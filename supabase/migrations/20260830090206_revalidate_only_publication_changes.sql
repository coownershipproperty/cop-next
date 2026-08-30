-- Ordinary property edits are already covered by the pages' hourly ISR.
-- Calling Vercel after every translated-field update creates a 30-route fanout
-- per row and can overwhelm both ISR and Supabase during a bulk update.
--
-- Revalidate immediately only when a property is first inserted as public or
-- its publication status changes. This preserves immediate publication and
-- unpublication while preventing translation/import revalidation storms.
create or replace function public.notify_vercel_revalidate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  revalidate_secret text;
begin
  if tg_op = 'INSERT' then
    if coalesce(new.status, '') not in ('Live', 'for_sale', 'sold') then
      return new;
    end if;
  elsif tg_op = 'UPDATE' then
    if new.status is not distinct from old.status then
      return new;
    end if;

    if coalesce(new.status, '') not in ('Live', 'for_sale', 'sold')
      and coalesce(old.status, '') not in ('Live', 'for_sale', 'sold') then
      return new;
    end if;
  end if;

  select decrypted_secret
  into revalidate_secret
  from vault.decrypted_secrets
  where name = 'vercel_revalidate_secret'
  limit 1;

  if revalidate_secret is null then
    raise warning 'Property revalidation secret is not configured';
    return new;
  end if;

  perform net.http_post(
    url := 'https://co-ownership-property.com/api/revalidate',
    body := jsonb_build_object(
      'table', tg_table_name,
      'record', jsonb_build_object('slug', new.slug)
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || revalidate_secret
    )
  );

  return new;
end;
$$;

revoke execute on function public.notify_vercel_revalidate() from public, anon, authenticated;

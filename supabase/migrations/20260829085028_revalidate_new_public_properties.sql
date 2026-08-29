-- Revalidate newly inserted public properties as well as later edits. Ignore
-- inserts and updates that remain non-public so staging/import work does not
-- create unnecessary requests.
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

drop trigger if exists properties_revalidate_trigger on public.properties;

create trigger properties_revalidate_trigger
after insert or update on public.properties
for each row
execute function public.notify_vercel_revalidate();

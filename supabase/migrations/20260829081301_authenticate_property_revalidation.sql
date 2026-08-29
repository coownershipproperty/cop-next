-- Authenticate the database's on-demand revalidation request with a dedicated
-- shared credential. The value is stored in Supabase Vault and Vercel's
-- encrypted environment, and never appears in source control.
create or replace function public.notify_vercel_revalidate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  revalidate_secret text;
begin
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

alter table public.leads
  add column if not exists final_property_slug text references public.properties(slug) on delete set null,
  add column if not exists final_property_title text,
  add column if not exists final_property_region text;

create index if not exists idx_leads_final_property_slug
  on public.leads (final_property_slug);

update public.leads as l
set final_property_slug = p.slug,
    final_property_title = p.title,
    final_property_region = p.region
from public.properties as p
where l.status = 'won'
  and l.final_property_slug is null
  and l.property_slug = p.slug;

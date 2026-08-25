begin;

-- The consolidation migration copies every listing to the canonical lead.
-- Remove the now-redundant child rows from archived enquiry records so every
-- shortlist has exactly one active owner.
delete from public.lead_property_shortlists s
using public.leads l
where s.lead_id = l.id
  and l.merged_into_lead_id is not null;

commit;

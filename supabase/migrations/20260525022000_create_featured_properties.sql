-- Homepage featured-properties list, editable from the admin (Featured tab).
-- Replaces the hardcoded array in lib/featured-properties.js.
-- Already applied to the cop-prod project; this file records it for the repo.

CREATE TABLE IF NOT EXISTS public.featured_properties (
  slug       text PRIMARY KEY,
  position   int NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.featured_properties ENABLE ROW LEVEL SECURITY;

-- The homepage (anon key, build-time) needs to read it; it is not sensitive.
CREATE POLICY "featured_properties public read" ON public.featured_properties
  FOR SELECT TO anon, authenticated USING (true);
-- Writes happen only via the admin save route using the service role.

-- Seed with the current hand-ranked list so the admin opens pre-populated.
INSERT INTO public.featured_properties (slug, position) VALUES
  ('ses-salines-spain-3-bed-townhouse-with-pool', 0),
  ('antibes-france-2-bed-apartment-with-pool', 1),
  ('vilamoura-portugal-3-bed-villa-with-pool', 2),
  ('la-quinta-california-4-bed-house-with-pool-2', 3),
  ('fayence-france-6-bed-villa-with-pool', 4),
  ('higueron-spain-3-bed-apartment-with-sea-views', 5),
  ('marbella-spain-2-bed-apartment-with-pool', 6),
  ('domaso-italy-2-bed-penthouse-with-infinity-pool', 7),
  ('portimao-portugal-3-bed-apartment-with-pool', 8),
  ('ericeira-portugal-2-bed-apartment-with-infinity-pool', 9),
  ('santa-ponsa-spain-3-bed-penthouse-with-pool', 10),
  ('valbonne-france-4-bed-villa-with-pool', 11),
  ('playa-d-en-bossa-spain-2-bed-apartment-with-sea-views-3', 12),
  ('brickell-miami-florida-luxury-1-bed-apartment-with-pool', 13),
  ('palau-italy-2-bed-apartment-with-sea-views', 14),
  ('chamonix-mont-blanc-france-4-bed-house-with-mountain-views', 15),
  ('palma-spain-2-bed-townhouse-with-pool', 16),
  ('les-issambres-cote-dazur-france-3-bed-villa-with-sea-view-heated-pool', 17),
  ('costa-de-la-luz-spain-4-bed-villa-with-sea-views-x', 18),
  ('estepona-spain-3-bed-apartment-with-sea-views', 19),
  ('eze-france-2-bed-apartment-with-pool', 20),
  ('6th-arrondissement-paris-france-2-bed-apartment-with-fireplace', 21),
  ('denia-spain-2-bed-apartment-with-beach-access', 22),
  ('ibiza-spain-3-bed-house-with-sea-views', 23),
  ('brickell-miami-florida-luxury-2-bed-apartment-with-pool', 24),
  ('palm-springs-california-5-bed-house-with-fireplace', 25),
  ('morzine-france-2-bed-apartment-with-mountain-views', 26),
  ('menaggio-italy-2-bed-apartment-with-pool', 27),
  ('florence-italy-2-bed-apartment', 28),
  ('apricale-italy-3-bed-villa-with-infinity-pool', 29),
  ('meina-lago-maggiore-italy-3-bed-villa-with-lake-view-infinity-pool', 30),
  ('torri-del-benaco-italy-2-bed-apartment-with-pool', 31),
  ('aspen-colorado-4-bed-house-ski-inski-out', 32)
ON CONFLICT (slug) DO NOTHING;

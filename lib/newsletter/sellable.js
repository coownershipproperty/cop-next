// Guard: never put a home in a newsletter that cannot be bought today.
//
// On 14 Sep 2026 a full read of Pacaso's pages found 59 of 179 "Live" Pacaso
// homes were fully owned or delisted — the sitemap never showed it. The nightly
// portal read now stamps property_facts.partner_availability for every Pacaso
// home. This helper drops anything that is not Live, or whose partner page
// last read as sold_out / delisted, so a campaign built days ago cannot send a
// dead listing.
export async function filterSellable(db, slugs) {
  if (!Array.isArray(slugs) || !slugs.length) return { keep: [], dropped: [] };
  const { data: props } = await db
    .from('properties')
    .select('slug, status, partner')
    .in('slug', slugs);
  const { data: facts } = await db
    .from('property_facts')
    .select('slug, partner_availability, availability_checked_at')
    .in('slug', slugs);
  const factBySlug = {};
  for (const f of facts || []) factBySlug[f.slug] = f;
  const statusBySlug = {};
  for (const p of props || []) statusBySlug[p.slug] = p;

  const keep = [];
  const dropped = [];
  for (const slug of slugs) {
    const p = statusBySlug[slug];
    const f = factBySlug[slug];
    if (!p) { dropped.push({ slug, reason: 'not found' }); continue; }
    if (!['Live', 'for_sale'].includes(p.status)) { dropped.push({ slug, reason: `status ${p.status}` }); continue; }
    if (f && f.partner_availability && f.partner_availability !== 'available') {
      dropped.push({ slug, reason: `partner page: ${f.partner_availability}` });
      continue;
    }
    keep.push(slug);
  }
  return { keep, dropped };
}

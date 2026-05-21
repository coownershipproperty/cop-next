import { requireCrmAdmin, setCrmCors } from '@/lib/adminAuth';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

function getDb() {
  return createSupabaseAdminClient();
}

// ── Lifestyle sibling groups ───────────────────────────────────────────────────
// Used to find "similar enough" regions when a contact's exact region
// doesn't have enough live properties.
const SIBLING_GROUPS = [
  ['Baqueira', 'French Alps', 'Portes du Soleil', 'Vorarlberg', 'Tyrol', 'Salzburger Land', 'Salzburg', 'Pinzgau', 'South Tyrol', 'Bavaria'],
  ['Colorado', 'Utah', 'Wyoming'],
  ['Ibiza', 'Mallorca', 'Formentera', 'Menorca', 'Sardinia', 'Tenerife'],
  ['Lake Como', 'Lake Garda', 'Lago Maggiore', 'Italian Lakes'],
  ['Costa del Sol', 'Costa Blanca', 'Costa Brava', 'Costa de la Luz', 'Sotogrande', 'Cantabria', 'Asturias'],
  ["Côte d'Azur", 'Liguria', 'French Riviera'],
  ['South of France', 'Burgundy', 'Provence', 'Dordogne'],
  ['Tuscany', 'Umbria'],
  ['London', 'Paris', 'Madrid', 'Milan', 'Amsterdam', 'Lisbon', 'Vienna', 'Dublin', 'Berlin'],
  ['Baltic Sea', 'Rügen', 'Sylt', 'Usedom', 'Stockholm Archipelago', 'Värmdö'],
  ['Adriatic', 'Istria'],
  ['South Carolina', 'Florida', 'New Jersey', 'Massachusetts', 'Oregon'],
  ['Arizona', 'Nevada', 'California'],
  ['Algarve', 'Silver Coast'],
  ['Baja California', 'Mexico'],
];

// Return sibling regions for a given region (same lifestyle group, excluding itself)
function getSiblings(region) {
  const lc = region.toLowerCase().trim();
  for (const group of SIBLING_GROUPS) {
    if (group.some(r => r.toLowerCase() === lc)) {
      return group.filter(r => r.toLowerCase() !== lc);
    }
  }
  return [];
}

// Does a property's region or city match any term in the list (case-insensitive)?
function matchesAny(prop, terms) {
  if (!terms.length) return false;
  const lc = terms.map(t => t.toLowerCase().trim());
  return lc.includes((prop.region || '').toLowerCase().trim()) ||
         lc.includes((prop.city   || '').toLowerCase().trim());
}

/**
 * Pick `count` items from a price-sorted pool, spread evenly across the price
 * range so we naturally get a mix of cheaper / mid / higher properties.
 * If the pool has fewer than `count` items, returns all of them.
 */
function pickWithVariety(pool, count) {
  if (!pool.length || count <= 0) return [];
  const sorted = [...pool].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  if (sorted.length <= count) return sorted;
  if (count === 1) return [sorted[Math.floor(sorted.length / 2)]];
  const step = (sorted.length - 1) / (count - 1);
  return Array.from({ length: count }, (_, i) => sorted[Math.round(i * step)]);
}

/**
 * Build a property selection for one contact.
 *
 * @param regionInterests  Array of {mainRegion, subregion} from each of their leads
 * @param allProps         All live properties
 * @param budgetMax        Contact's max budget (or null)
 * @returns                Up to 6 property objects
 */
function buildPropertySelection(regionInterests, allProps, budgetMax) {
  const TOTAL = 6;
  const chosen   = [];
  const chosenSet = new Set();

  const tryAdd = (p) => {
    if (!chosenSet.has(p.slug) && chosen.length < TOTAL) {
      chosen.push(p);
      chosenSet.add(p.slug);
    }
  };

  // Filter properties by budget (20% tolerance so we don't cut off great matches)
  const withinBudget = (p) =>
    !budgetMax || Number(p.price || 0) <= budgetMax * 1.2;

  const available = allProps.filter(withinBudget);

  // ── Unique regions: deduplicate the contact's interest regions ─────────────
  // Key: mainRegion (or subregion if no mainRegion). We keep subregion alongside
  // to use as a city-level preference hint when picking from that region.
  const regionMap = new Map(); // mainRegion → Set of subregions
  for (const { mainRegion, subregion } of regionInterests) {
    const key = (mainRegion || subregion || '').trim();
    if (!key) continue;
    if (!regionMap.has(key)) regionMap.set(key, new Set());
    if (subregion && subregion.trim()) regionMap.get(key).add(subregion.trim());
  }

  const uniqueRegions = [...regionMap.keys()]; // ordered by first appearance
  const n = uniqueRegions.length;
  if (!n) return [];

  // ── Proportional slot allocation ───────────────────────────────────────────
  // e.g. 1 region → [6], 2 → [3,3], 3 → [2,2,2], 4 → [2,2,1,1]
  const baseSlots  = Math.floor(TOTAL / n);
  const extraCount = TOTAL % n;
  const allocations = uniqueRegions.map((r, i) => ({
    region:    r,
    subs:      [...regionMap.get(r)],
    slots:     baseSlots + (i < extraCount ? 1 : 0),
    shortfall: 0,
  }));

  // ── First pass: fill each region's slot quota ──────────────────────────────
  for (const alloc of allocations) {
    const { region, subs, slots } = alloc;
    const avail = available.filter(p => !chosenSet.has(p.slug));

    // Tier 1: matches the region (and city hints if we have subregions)
    const inRegion = avail.filter(p => matchesAny(p, [region]));

    // Within the region, prefer city matches (subregion) — put them first
    const subMatches    = subs.length ? inRegion.filter(p => matchesAny(p, subs)) : [];
    const nonSubMatches = inRegion.filter(p => !subMatches.includes(p));
    const regionPool    = [...subMatches, ...nonSubMatches];

    // Pick with variety from the region pool
    const picks = pickWithVariety(regionPool.filter(p => !chosenSet.has(p.slug)), slots);
    picks.forEach(tryAdd);

    alloc.shortfall = slots - picks.length; // how many slots we couldn't fill
  }

  // ── Second pass: spill shortfalls between interest regions ────────────────
  // If region A fell short, try to fill from region B's pool before going wider
  if (chosen.length < TOTAL) {
    for (const alloc of allocations) {
      if (chosen.length >= TOTAL) break;
      const avail = available.filter(p =>
        !chosenSet.has(p.slug) && matchesAny(p, [alloc.region])
      );
      const needed = TOTAL - chosen.length;
      pickWithVariety(avail, needed).forEach(tryAdd);
    }
  }

  // ── Third pass: sibling regions (similar lifestyle) ────────────────────────
  if (chosen.length < TOTAL) {
    const allSiblings = [...new Set(
      uniqueRegions.flatMap(r => getSiblings(r))
    )].filter(s => !uniqueRegions.includes(s));

    const siblingPool = available.filter(p =>
      !chosenSet.has(p.slug) && matchesAny(p, allSiblings)
    );
    const needed = TOTAL - chosen.length;
    pickWithVariety(siblingPool, needed).forEach(tryAdd);
  }

  // ── Fourth pass: same country as any matched property ─────────────────────
  if (chosen.length < TOTAL) {
    const matchedCountries = [...new Set(
      chosen.map(p => p.country).filter(Boolean)
    )];
    if (matchedCountries.length) {
      const countryPool = available.filter(p =>
        !chosenSet.has(p.slug) &&
        matchedCountries.includes(p.country)
      );
      const needed = TOTAL - chosen.length;
      pickWithVariety(countryPool, needed).forEach(tryAdd);
    }
  }

  return chosen;
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCrmCors(res);
    return res.status(200).end();
  }
  setCrmCors(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = await requireCrmAdmin(req, res);
  if (!admin) return;

  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });

  const db = getDb();

  try {
    // ── 1. Create campaign record ─────────────────────────────────────────────
    const { data: campaign, error: campErr } = await db
      .from('newsletter_campaigns')
      .insert({ name, status: 'draft' })
      .select()
      .single();
    if (campErr) throw campErr;

    // ── 2. Fetch all live properties ──────────────────────────────────────────
    const { data: properties, error: propErr } = await db
      .from('properties')
      .select('slug, title, country, region, city, price, currency, img, beds, size')
      .eq('status', 'Live')
      .order('date_added', { ascending: false });
    if (propErr) throw propErr;

    // ── 3. Fetch all leads that have at least one region or subregion ─────────
    const { data: rawLeads, error: leadErr } = await db
      .from('leads')
      .select('contact_id, main_region, subregion, budget_max, contacts!inner(id, email, first_name)')
      .or('main_region.not.is.null,subregion.not.is.null')
      .not('contacts.email', 'is', null)
      .neq('contacts.email', 'dylan@co-ownership-property.com');
    if (leadErr) throw leadErr;

    // Filter out leads where both region fields are empty strings
    const leads = (rawLeads || []).filter(l =>
      (l.main_region && l.main_region.trim()) ||
      (l.subregion   && l.subregion.trim())
    );

    // ── 4. Group leads by contact ─────────────────────────────────────────────
    const contactMap = new Map();
    for (const lead of leads) {
      const cid = lead.contact_id;
      if (!contactMap.has(cid)) {
        contactMap.set(cid, {
          contact:   lead.contacts,
          interests: [], // [{mainRegion, subregion}]
          budgetMax: null,
        });
      }
      const entry = contactMap.get(cid);

      // Collect region interest from this lead
      const mainRegion = (lead.main_region || '').trim() || null;
      const subregion  = (lead.subregion   || '').trim() || null;

      // Handle legacy semicolon-joined values (old format)
      const mainParts = mainRegion ? mainRegion.split(';').map(s => s.trim()).filter(Boolean) : [null];
      const subParts  = subregion  ? subregion.split(';').map(s => s.trim()).filter(Boolean)  : [null];

      // Add each unique main_region as a separate interest entry
      for (const mr of mainParts) {
        // Pair with subregion only if we have just one subregion (otherwise ambiguous)
        const sr = subParts.length === 1 ? subParts[0] : null;
        // Dedup: skip if we already have this mainRegion
        const alreadyHave = entry.interests.some(i => i.mainRegion === mr && i.subregion === sr);
        if (!alreadyHave) {
          entry.interests.push({ mainRegion: mr, subregion: sr });
        }
      }

      // Track highest budget
      if (lead.budget_max) {
        const bud = Number(lead.budget_max);
        if (!entry.budgetMax || bud > entry.budgetMax) entry.budgetMax = bud;
      }
    }

    // ── 5. Build sends ────────────────────────────────────────────────────────
    const sends   = [];
    const skipped = [];

    for (const [contactId, { contact, interests, budgetMax }] of contactMap) {
      const email     = contact?.email;
      const firstName = contact?.first_name;
      if (!email) continue;
      if (!interests.length) { skipped.push(email); continue; }

      const selected = buildPropertySelection(interests, properties, budgetMax);

      if (!selected.length) {
        skipped.push(email);
        continue;
      }

      const slugs = selected.map(p => p.slug);

      sends.push({
        campaign_id:    campaign.id,
        contact_id:     contactId,
        email,
        property_slugs: slugs,
        primary_slugs:  slugs, // all are primary — no "you might also like" section
        fallback_slugs: [],
        status:         'pending',
      });
    }

    // ── 6. Batch-insert sends ─────────────────────────────────────────────────
    if (sends.length > 0) {
      const { error: insertErr } = await db.from('newsletter_sends').insert(sends);
      if (insertErr) throw insertErr;
    }

    // ── 7. Update campaign total_recipients ──────────────────────────────────
    await db.from('newsletter_campaigns')
      .update({ total_recipients: sends.length })
      .eq('id', campaign.id);

    return res.json({
      ok:         true,
      campaignId: campaign.id,
      recipients: sends.length,
      skipped:    skipped.length,
    });

  } catch (err) {
    console.error('[newsletter/prepare]', err);
    return res.status(500).json({ error: err.message });
  }
}

import { createClient } from '@supabase/supabase-js';

function getDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
}

// ── Lifestyle categories (siblings get shown in "You Might Also Like") ─────────
const CATEGORIES = [
  // European ski
  ['Baqueira', 'French Alps', 'Portes du Soleil', 'Vorarlberg', 'Tyrol', 'Salzburger Land', 'Salzburg', 'Pinzgau', 'South Tyrol', 'Bavaria'],
  // US ski / mountain
  ['Colorado', 'Utah', 'Wyoming'],
  // Mediterranean islands
  ['Ibiza', 'Mallorca', 'Formentera', 'Menorca', 'Sardinia', 'Tenerife'],
  // Italian lakes
  ['Lake Como', 'Lake Garda', 'Lago Maggiore'],
  // Spanish costas / Atlantic coast
  ['Costa del Sol', 'Costa Blanca', 'Costa Brava', 'Costa de la Luz', 'Sotogrande', 'Cantabria', 'Asturias'],
  // French / Italian Riviera
  ["Côte d'Azur", 'Liguria'],
  // French countryside
  ['South of France', 'Burgundy', 'Provence', 'Dordogne'],
  // Italian countryside
  ['Tuscany', 'Umbria'],
  // European capitals
  ['London', 'Paris', 'Madrid', 'Milan', 'Amsterdam', 'Lisbon', 'Vienna', 'Dublin', 'Berlin'],
  // Baltic / Nordic coast
  ['Baltic Sea', 'Rügen', 'Sylt', 'Usedom', 'Stockholm Archipelago', 'Värmdö'],
  // Adriatic / Croatia
  ['Adriatic', 'Istria'],
  // US beach / coastal
  ['South Carolina', 'Florida', 'New Jersey', 'Massachusetts', 'Oregon'],
  // US desert / Southwest
  ['Arizona', 'Nevada', 'California'],
  // Portugal
  ['Algarve', 'Silver Coast'],
  // Mexico
  ['Baja California'],
];

// ── Aliases: when lead subregion doesn't directly match property region ────────
const ALIASES = {
  'Balearic Islands':  ['Ibiza', 'Mallorca', 'Formentera', 'Menorca'],
  'Adriatic':          ['Adriatic', 'Istria'],
  'Pyrenees':          ['Baqueira', 'French Alps'],
  'South of France':   ['South of France', "Côte d'Azur", 'Provence', 'Burgundy'],
  'Italian Lakes':     ['Lake Como', 'Lake Garda', 'Lago Maggiore'],
  'Alps':              ['French Alps', 'Portes du Soleil', 'Vorarlberg', 'Tyrol', 'Salzburger Land', 'Baqueira'],
  'French Riviera':    ["Côte d'Azur", 'Liguria'],
  'Costa Cantabrica':  ['Cantabria', 'Asturias'],
  'Balearics':         ['Ibiza', 'Mallorca', 'Formentera', 'Menorca'],
  'Mallorca':          ['Mallorca'],
  'Ibiza':             ['Ibiza'],
  'Rome':              ['Tuscany', 'Liguria'],
};

function expandRegion(subregion) {
  const trimmed = subregion.trim();
  return ALIASES[trimmed] || [trimmed];
}

function getSiblings(expandedRegions) {
  const siblings = new Set();
  const lc = expandedRegions.map(r => r.toLowerCase());
  for (const cat of CATEGORIES) {
    if (cat.some(r => lc.includes(r.toLowerCase()))) {
      cat.forEach(r => siblings.add(r));
    }
  }
  for (const r of expandedRegions) siblings.delete(r);
  return [...siblings];
}

function regionMatch(prop, regions) {
  const lc = regions.map(r => r.toLowerCase());
  return lc.includes((prop.region || '').toLowerCase()) ||
         lc.includes((prop.city || '').toLowerCase());
}

function countryMatch(prop, countries) {
  const lc = countries.map(c => c.toLowerCase());
  return lc.includes((prop.country || '').toLowerCase());
}

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', 'https://cop-crm.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth   = req.headers['authorization'] || '';
  const secret = process.env.CRM_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) return res.status(401).json({ error: 'Unauthorised' });

  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });

  const db = getDb();

  try {
    // 1. Create campaign record
    const { data: campaign, error: campErr } = await db
      .from('newsletter_campaigns')
      .insert({ name, status: 'draft' })
      .select()
      .single();
    if (campErr) throw campErr;

    // 2. Fetch all live properties (newest first)
    const { data: properties, error: propErr } = await db
      .from('properties')
      .select('slug, title, country, region, city, price, currency, img, beds, size')
      .eq('status', 'Live')
      .order('date_added', { ascending: false });
    if (propErr) throw propErr;

    // 3. Fetch all leads with region data, plus contact email
    const { data: leads, error: leadErr } = await db
      .from('leads')
      .select('contact_id, main_region, subregion, budget_max, contacts!inner(id, email, first_name)')
      .not('main_region', 'is', null)
      .not('contacts.email', 'is', null)
      .neq('contacts.email', 'dylan@co-ownership-property.com');
    if (leadErr) throw leadErr;

    // 4. Consolidate multiple leads per contact (keep richest data)
    const contactMap = {};
    for (const lead of leads) {
      const cid = lead.contact_id;
      if (!contactMap[cid]) {
        contactMap[cid] = { ...lead };
      } else {
        // Prefer leads with subregion
        if (lead.subregion && !contactMap[cid].subregion) {
          contactMap[cid].subregion = lead.subregion;
        }
        // Merge main_regions (deduplicated)
        if (lead.main_region) {
          const existing = (contactMap[cid].main_region || '').split(';').map(s => s.trim());
          const incoming = lead.main_region.split(';').map(s => s.trim());
          const merged = [...new Set([...existing, ...incoming])].join(';');
          contactMap[cid].main_region = merged;
        }
        // Take the higher budget if any
        if (lead.budget_max && (!contactMap[cid].budget_max || lead.budget_max > contactMap[cid].budget_max)) {
          contactMap[cid].budget_max = lead.budget_max;
        }
      }
    }

    // 5. For each contact, pick best 6 properties
    const sends = [];
    const skipped = [];

    for (const [contactId, lead] of Object.entries(contactMap)) {
      const email      = lead.contacts?.email;
      const firstName  = lead.contacts?.first_name;
      if (!email) continue;

      // Parse preferred subregions (e.g. "Ibiza;Mallorca")
      const subregions = (lead.subregion || lead.main_region || '')
        .split(';').map(s => s.trim()).filter(Boolean);

      // Parse countries for fallback (from main_region)
      const countries = (lead.main_region || '')
        .split(';').map(s => s.trim()).filter(Boolean);

      const budget = lead.budget_max ? Number(lead.budget_max) : null;

      // Expand aliases
      const expandedRegions = [...new Set(subregions.flatMap(r => expandRegion(r)))];

      // Primary: exact region match (within budget)
      const primary = properties.filter(p =>
        regionMatch(p, expandedRegions) && (!budget || Number(p.price) <= budget)
      );

      // Siblings: lifestyle category matches (within budget, not already picked)
      const siblings = getSiblings(expandedRegions);
      const siblingMatches = properties.filter(p =>
        regionMatch(p, siblings) &&
        !primary.some(pp => pp.slug === p.slug) &&
        (!budget || Number(p.price) <= budget)
      );

      // Country fallback (within budget, not already picked)
      const countryFallback = properties.filter(p =>
        countryMatch(p, countries) &&
        !primary.some(pp => pp.slug === p.slug) &&
        !siblingMatches.some(s => s.slug === p.slug) &&
        (!budget || Number(p.price) <= budget)
      );

      // Build the 6 picks
      const MAX = 6;
      const primarySlugs   = primary.slice(0, MAX).map(p => p.slug);
      const remaining      = MAX - primarySlugs.length;
      const fallbackPool   = [...siblingMatches, ...countryFallback];
      const fallbackSlugs  = fallbackPool.slice(0, remaining).map(p => p.slug);
      const allSlugs       = [...primarySlugs, ...fallbackSlugs];

      if (allSlugs.length === 0) {
        skipped.push(email);
        continue;
      }

      sends.push({
        campaign_id:    campaign.id,
        contact_id:     contactId,
        email,
        property_slugs: allSlugs,
        primary_slugs:  primarySlugs,
        fallback_slugs: fallbackSlugs,
        status:         'pending',
      });
    }

    // 6. Batch-insert sends
    if (sends.length > 0) {
      const { error: insertErr } = await db.from('newsletter_sends').insert(sends);
      if (insertErr) throw insertErr;
    }

    // 7. Update campaign total_recipients
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

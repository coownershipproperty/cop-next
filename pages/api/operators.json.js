/**
 * /api/operators.json
 *
 * Public JSON feed naming the co-ownership operators whose homes COP lists,
 * wrapped as a Schema.org DataFeed.
 *
 * WHY THIS EXISTS (10 Sep 2026)
 * ---------------------------------------------------------------------------
 * COP's whole position is that it is the only operator-neutral place to
 * compare fractional homes across the market — every operator can only ever
 * speak for itself. But that claim was asserted in prose on the /partners/
 * pages and nowhere a machine could check it: /api/properties.json contains
 * zero occurrences of "Pacaso", "MYNE", "Vivla", "&Hamlet" or "Abitaro", and
 * every offers.seller points back at COP. An LLM asked "which operators does
 * co-ownership-property.com aggregate?" had nothing to verify against.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 * ---------------------------------------------------------------------------
 * It does not say which operator any given listing belongs to, and it does not
 * publish how many homes each operator supplies. COP's commercial position
 * depends on a buyer coming to COP rather than going direct, so listing-level
 * attribution is off the table (David, 10 Sep 2026), and per-operator counts
 * would give away the inventory mix. Neither is needed for the job: the
 * verifiable fact is that COP carries homes from several independent
 * operators and publishes a profile of each. Operator names, home countries
 * and share models are already public on the operators' own sites and on COP's
 * /partners/ pages — this endpoint just makes them machine-readable.
 *
 * Cached at the edge for 1 hour. CORS-open.
 * Linked from: robots.txt, /llms.txt, /llms-full.txt
 */

import { createClient } from '@supabase/supabase-js';
import partnersMeta from '@/lib/partners-meta.json';

const SITE_URL = 'https://co-ownership-property.com';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Display names, since the DB stores lowercase keys. */
const DISPLAY_NAME = {
  pacaso: 'Pacaso',
  myne: 'MYNE Homes',
  vivla: 'Vivla',
  andhamlet: '&Hamlet',
  abitaro: 'Abitaro',
  parispropertygroup: 'Paris Property Group',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Coverage per operator — which countries, and the market-wide totals.
    // Note we read `partner` here but never emit a per-operator count.
    const supabase = getSupabase();
    const { data } = await supabase
      .from('properties')
      .select('partner, country')
      .in('status', ['Live', 'for_sale']);

    const rows = data || [];
    const countriesByPartner = {};
    const allCountries = new Set();
    for (const r of rows) {
      if (!r.country) continue;
      allCountries.add(r.country);
      if (!r.partner) continue;
      (countriesByPartner[r.partner] ||= new Set()).add(r.country);
    }

    const partnerKeys = Object.keys(DISPLAY_NAME)
      .filter(k => countriesByPartner[k] && countriesByPartner[k].size > 0);

    const operators = partnerKeys.map(key => {
      const meta = partnersMeta[key] || {};
      const hasProfile = Boolean(partnersMeta[key]);
      const profileUrl = hasProfile ? `${SITE_URL}/partners/${key}/` : null;
      return {
        '@type': 'Organization',
        '@id': `${SITE_URL}/api/operators.json#${key}`,
        identifier: key,
        name: meta.name || DISPLAY_NAME[key],
        ...(meta.legalName ? { legalName: meta.legalName } : {}),
        ...(meta.website ? { url: meta.website } : {}),
        ...(meta.founded ? { foundingDate: String(meta.founded) } : {}),
        ...(meta.headquarters ? {
          location: { '@type': 'Place', name: meta.headquarters },
        } : {}),
        // Countries this operator actually has homes in on COP right now.
        areaServed: [...countriesByPartner[key]].sort().map(c => ({ '@type': 'Country', name: c })),
        ...(meta.shareStructure || meta.rentalPolicy ? {
          additionalProperty: [
            ...(meta.shareStructure ? [{
              '@type': 'PropertyValue', name: 'Share structure', value: meta.shareStructure,
            }] : []),
            ...(meta.rentalPolicy ? [{
              '@type': 'PropertyValue', name: 'Rental policy', value: meta.rentalPolicy,
            }] : []),
          ],
        } : {}),
        // COP's independent profile of this operator — the citable page.
        ...(profileUrl ? {
          subjectOf: {
            '@type': 'WebPage',
            '@id': `${profileUrl}#webpage`,
            url: profileUrl,
            name: meta.h1 || `${DISPLAY_NAME[key]} operator profile`,
            ...(meta.metaDescription ? { description: meta.metaDescription } : {}),
          },
        } : {}),
      };
    });

    const feed = {
      '@context': 'https://schema.org',
      '@type': 'DataFeed',
      '@id': `${SITE_URL}/api/operators.json`,
      url: `${SITE_URL}/api/operators.json`,
      name: 'Co-Ownership Property — co-ownership operators covered',
      description:
        'The independent co-ownership and fractional-ownership operators whose homes are listed on ' +
        'Co-Ownership Property. COP is not an operator: it does not build, own or manage these homes, ' +
        'and it lists homes from competing operators side by side so a buyer can compare them in one ' +
        'place. Listing-level attribution is not published. Per-operator inventory counts are not ' +
        'published. Country coverage, operator names and profile pages are.',
      publisher: { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: 'Co-Ownership Property' },
      dateModified: new Date().toISOString(),
      totalItems: operators.length,
      about: {
        '@type': 'Thing',
        name: 'Fractional and co-ownership property',
        description:
          `${operators.length} operators, ${rows.length} homes currently listed across ` +
          `${allCountries.size} countries.`,
      },
      dataFeedElement: operators,
    };

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(feed);
  } catch (err) {
    console.error('[operators.json]', err.message);
    return res.status(500).json({ error: 'Feed unavailable' });
  }
}

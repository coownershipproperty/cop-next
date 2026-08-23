import { requirePartnerHubAccess } from '@/lib/partnerHubAuth';

const COUNTRY_PRIORITY = ['Spain', 'France', 'Italy', 'Portugal', 'England', 'Austria', 'Germany', 'Croatia', 'Sweden', 'USA', 'Mexico'];

export default async function handler(req, res) {
  const access = await requirePartnerHubAccess(req, res, { adminOnly: true });
  if (!access) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { data, error } = await access.db
    .from('properties')
    .select('country, region')
    .in('status', ['Live', 'for_sale'])
    .limit(1000);
  if (error) return res.status(500).json({ error: 'Could not load COP destination options' });

  const byCountry = new Map();
  for (const property of data || []) {
    const country = String(property.country || '').trim();
    const region = String(property.region || '').trim();
    if (!country || !region) continue;
    if (!byCountry.has(country)) byCountry.set(country, new Set());
    byCountry.get(country).add(region);
  }

  const destinations = [...byCountry.entries()]
    .map(([country, regions]) => ({ country, regions: [...regions].sort((a, b) => a.localeCompare(b)) }))
    .sort((a, b) => {
      const aPriority = COUNTRY_PRIORITY.indexOf(a.country);
      const bPriority = COUNTRY_PRIORITY.indexOf(b.country);
      if (aPriority !== -1 || bPriority !== -1) return (aPriority === -1 ? 999 : aPriority) - (bPriority === -1 ? 999 : bPriority);
      return a.country.localeCompare(b.country);
    });

  return res.json({ destinations });
}

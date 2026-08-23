import { requirePartnerHubAccess } from '@/lib/partnerHubAuth';

export default async function handler(req, res) {
  const access = await requirePartnerHubAccess(req, res, { adminOnly: true });
  if (!access) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { data, error } = await access.db
    .from('properties')
    .select('slug, title, img, images, price, currency, country, region, city, status, date_added')
    .in('status', ['Live', 'for_sale'])
    .order('date_added', { ascending: false })
    .limit(1000);
  if (error) return res.status(500).json({ error: 'Could not load COP listings' });

  return res.json({
    properties: (data || []).map((property) => ({
      slug: property.slug,
      title: property.title,
      image: property.img || (Array.isArray(property.images) ? property.images[0] : null),
      location: [property.city, property.region, property.country].filter(Boolean).join(', '),
      price: property.price || null,
      currency: property.currency || 'EUR',
    })),
  });
}

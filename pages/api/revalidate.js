export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verify caller is authorised (Supabase webhook or internal cron)
  const auth = req.headers['authorization'] || '';
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ message: 'Unauthorised' });
  }

  try {
    const slug = req.body?.record?.slug;

    if (!slug) {
      return res.status(400).json({ message: 'No slug in payload' });
    }

    await res.revalidate(`/property/${slug}`);
    return res.json({ revalidated: true, slug });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

import { requireCrmAdmin, setCrmCors } from '@/lib/adminAuth';
import { getTelnyxBrowserCredential } from '@/lib/telnyx';

export default async function handler(req, res) {
  setCrmCors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = await requireCrmAdmin(req, res);
  if (!admin) return;

  try {
    const credential = await getTelnyxBrowserCredential();
    return res.status(200).json({
      ...credential,
      preferredCodecs: ['OPUS', 'G722', 'G711A', 'G711U'],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create Telnyx token';
    console.error('[telnyx-token]', message);
    return res.status(500).json({ error: message });
  }
}

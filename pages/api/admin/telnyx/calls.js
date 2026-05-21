import { requireCrmAdmin, setCrmCors } from '@/lib/adminAuth';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function noteFor(payload) {
  const parts = [`Telnyx call ${payload.status} with ${payload.destinationNumber}.`];
  if (payload.state) parts.push(`State: ${payload.state}.`);
  if (payload.sipReason) parts.push(`Reason: ${payload.sipReason}.`);
  return parts.join(' ');
}

export default async function handler(req, res) {
  setCrmCors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = await requireCrmAdmin(req, res);
  if (!admin) return;

  const payload = req.body || {};
  const leadId = clean(payload.leadId);
  const contactId = clean(payload.contactId);
  const destinationNumber = clean(payload.destinationNumber);
  const status = clean(payload.status) || 'unknown';

  if (!leadId || !destinationNumber) {
    return res.status(400).json({ error: 'Missing leadId or destinationNumber' });
  }

  const db = createSupabaseAdminClient();
  const metadata = {
    provider: 'telnyx',
    direction: 'outbound',
    destination_number: destinationNumber,
    caller_number: clean(payload.callerNumber) || null,
    telnyx_call_id: clean(payload.telnyxCallId) || null,
    status,
    state: clean(payload.state) || null,
    sip_code: typeof payload.sipCode === 'number' ? payload.sipCode : null,
    sip_reason: clean(payload.sipReason) || null,
    ...(payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}),
  };

  const { error } = await db.from('activities').insert({
    contact_id: contactId || null,
    lead_id: leadId,
    type: 'phone_call',
    description: noteFor({ ...payload, destinationNumber, status }),
    metadata,
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}

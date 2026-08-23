import { cleanPartnerHubText, isPartnerHubEmail } from '@/lib/partnerHub';

const ADMIN_EMAIL = process.env.PARTNER_HUB_ADMIN_EMAIL || 'info@co-ownership-property.com';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://co-ownership-property.com';

function escapeHtml(value) {
  return cleanPartnerHubText(value, 4000)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function recordDelivery({ db, lead, eventType, recipient, cc, status, providerId, errorMessage }) {
  await db.from('partner_hub_notifications').insert({
    lead_id: lead.id,
    partner_id: lead.partner_id,
    event_type: eventType,
    recipient,
    cc: cc || [],
    provider_id: providerId || null,
    status,
    error_message: errorMessage || null,
  });

  await db.from('partner_hub_events').insert({
    lead_id: lead.id,
    partner_id: lead.partner_id,
    actor_role: 'system',
    actor_email: 'partner-hub-notifications',
    event_type: status === 'failed' ? 'notification_failed' : 'notification_sent',
    metadata: { event_type: eventType, recipient, status },
  });
}

async function deliver({ db, lead, eventType, recipient, cc = [], subject, html }) {
  if (!isPartnerHubEmail(recipient)) {
    throw new Error('A valid server-side notification address is required');
  }

  if (process.env.PARTNER_HUB_DISABLE_EMAIL === 'true') {
    await recordDelivery({ db, lead, eventType, recipient, cc, status: 'skipped' });
    return { status: 'skipped', recipient };
  }

  try {
    // Keep Resend lazy so read-only Partner Hub endpoints can load even in a
    // local environment where the outbound email key is intentionally absent.
    const { sendHtml } = await import('@/lib/resend');
    const delivery = await sendHtml({ to: recipient, cc: cc.length ? cc : undefined, subject, html });
    await recordDelivery({
      db,
      lead,
      eventType,
      recipient,
      cc,
      status: 'sent',
      providerId: delivery?.id,
    });
    return { status: 'sent', recipient, id: delivery?.id || null };
  } catch (error) {
    await recordDelivery({
      db,
      lead,
      eventType,
      recipient,
      cc,
      status: 'failed',
      errorMessage: error.message,
    });
    throw error;
  }
}

function emailShell({ label, heading, body, buttonLabel, buttonUrl }) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#183247;max-width:620px;margin:0 auto;padding:28px;">
      <p style="margin:0 0 8px;color:#2c9d7b;font-size:12px;font-weight:700;letter-spacing:.08em;">${escapeHtml(label)}</p>
      <h2 style="margin:0 0 18px;font-size:24px;">${escapeHtml(heading)}</h2>
      ${body}
      <p style="margin:26px 0;">
        <a href="${escapeHtml(buttonUrl)}" style="display:inline-block;background:#0d2a40;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700;">${escapeHtml(buttonLabel)}</a>
      </p>
      <p style="margin-top:24px;padding-top:16px;border-top:1px solid #e4e9ec;color:#758491;font-size:12px;">Contact details remain inside the secure COP Partner Hub. Please do not forward this notification.</p>
    </div>
  `;
}

export async function notifyPartnerOfLead({ db, partner, lead, eventType = 'lead_assigned', note }) {
  const recipient = partner.notification_email;
  const cc = recipient === ADMIN_EMAIL ? [] : [ADMIN_EMAIL];
  const testPrefix = partner.test_routing ? '[TEST] ' : '';
  const leadName = `${lead.first_name} ${lead.last_name}`.trim();
  const noteRow = note ? `<p><strong>COP update:</strong> ${escapeHtml(note)}</p>` : '';

  return deliver({
    db,
    lead,
    eventType,
    recipient,
    cc,
    subject: eventType === 'test'
      ? `[TEST] ${partner.display_name} Partner Hub routing`
      : `${testPrefix}New COP lead — ${leadName}`,
    html: emailShell({
      label: partner.test_routing ? 'TEST ROUTING' : 'PRIVATE PARTNER NOTIFICATION',
      heading: eventType === 'test' ? 'Partner Hub routing test' : 'A lead is ready in your workspace',
      body: eventType === 'test'
        ? `<p>This confirms that ${escapeHtml(partner.display_name)} notifications route to <strong>${escapeHtml(recipient)}</strong>. No partner contact has been added.</p>`
        : `<p><strong>Lead:</strong> ${escapeHtml(leadName)}</p><p><strong>Interest:</strong> ${escapeHtml(lead.destination || lead.collection_type || 'Co-ownership opportunity')}</p>${noteRow}<p>Sign in to view contact details and manage the sales stage.</p>`,
      buttonLabel: 'Open partner workspace',
      buttonUrl: `${SITE_URL}/partner/`,
    }),
  });
}

export async function notifyAdminOfPartnerUpdate({ db, partner, lead, stage, note }) {
  const leadName = `${lead.first_name} ${lead.last_name}`.trim();
  return deliver({
    db,
    lead,
    eventType: 'partner_update',
    recipient: ADMIN_EMAIL,
    subject: `${partner.display_name} update — ${leadName}${stage ? ` is now ${stage}` : ''}`,
    html: emailShell({
      label: 'PARTNER PIPELINE UPDATE',
      heading: `${partner.display_name} updated a COP lead`,
      body: `<p><strong>Lead:</strong> ${escapeHtml(leadName)}</p>${stage ? `<p><strong>Stage:</strong> ${escapeHtml(stage)}</p>` : ''}${note ? `<p><strong>Progress note:</strong> ${escapeHtml(note)}</p>` : ''}`,
      buttonLabel: 'Review in COP Admin',
      buttonUrl: `${SITE_URL}/admin/partners/`,
    }),
  });
}

export { ADMIN_EMAIL as PARTNER_HUB_ADMIN_EMAIL };

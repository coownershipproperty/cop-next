import { requireAdmin } from "@/lib/newsletter/auth";
import { sendHtml } from "@/lib/resend";

const ADMIN_EMAIL = "info@co-ownership-property.com";
const ALLOWED_PARTNERS = new Set(["21-5", "Vivla"]);
const ALLOWED_EVENTS = new Set(["test", "lead_assigned", "partner_note", "stage_changed"]);
const ALLOWED_STAGES = new Set(["New", "Contacted", "Viewing", "Reserved", "Deposit paid", "Won", "Lost", "Paused"]);

function clean(value, max = 500) {
  return String(value || "").trim().slice(0, max);
}

function escapeHtml(value) {
  return clean(value, 2e3)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ctx = await requireAdmin(req, res);
  if (!ctx) return;

  const { eventType, partner, contact = {}, lead = {}, stage, note } = req.body || {};
  if (!ALLOWED_EVENTS.has(eventType)) return res.status(400).json({ error: "Unknown notification type" });
  if (!ALLOWED_PARTNERS.has(partner)) return res.status(400).json({ error: "Unknown partner" });
  if (eventType === "test" && contact.testRouting !== true) {
    return res.status(400).json({ error: "Test routing must be active before sending a test" });
  }
  if (eventType === "stage_changed" && !ALLOWED_STAGES.has(stage)) {
    return res.status(400).json({ error: "Unknown pipeline stage" });
  }

  const contactEmail = clean(contact.email, 254).toLowerCase();
  const recipient = eventType === "stage_changed" ? ADMIN_EMAIL : contactEmail;
  if (!isEmail(recipient)) return res.status(400).json({ error: "A valid notification email is required" });

  const partnerName = escapeHtml(partner);
  const leadName = escapeHtml(lead.name || "Test lead");
  const leadEmail = escapeHtml(lead.email || "Not supplied");
  const leadPhone = escapeHtml(lead.phone || "Not supplied");
  const safeStage = escapeHtml(stage || "New");
  const safeNote = escapeHtml(note || lead.note || "No additional note");
  const routingLabel = contact.testRouting ? "TEST ROUTING" : "LIVE PARTNER ROUTING";

  const subject = eventType === "test"
    ? `[TEST] ${partner} partner notification routing`
    : eventType === "lead_assigned"
      ? `New COP lead assigned — ${clean(lead.name, 120)}`
      : eventType === "partner_note"
        ? `COP update — ${clean(lead.name, 120)}`
        : `${partner} pipeline update — ${clean(lead.name, 120)} is now ${stage}`;

  const heading = eventType === "test"
    ? "Partner notification test"
    : eventType === "lead_assigned"
      ? "New lead assigned"
      : eventType === "partner_note"
        ? "Update from Co-Ownership Property"
        : "Partner pipeline update";

  try {
    const delivery = await sendHtml({
      to: recipient,
      cc: recipient === ADMIN_EMAIL ? undefined : ADMIN_EMAIL,
      subject,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#183247;max-width:620px;margin:0 auto;padding:28px;">
          <p style="margin:0 0 8px;color:#2c9d7b;font-size:12px;font-weight:700;letter-spacing:.08em;">${routingLabel}</p>
          <h2 style="margin:0 0 18px;font-size:24px;">${heading}</h2>
          <p><strong>Partner:</strong> ${partnerName}</p>
          ${eventType === "test" ? `<p>This confirms that partner emails currently route to <strong>${escapeHtml(recipient)}</strong>. No partner has been contacted.</p>` : `
            <p><strong>Lead:</strong> ${leadName}</p>
            <p><strong>Email:</strong> ${leadEmail}</p>
            <p><strong>Phone:</strong> ${leadPhone}</p>
            ${eventType === "stage_changed" ? `<p><strong>New stage:</strong> ${safeStage}</p>` : ""}
            <p><strong>Note:</strong> ${safeNote}</p>
          `}
          <p style="margin-top:24px;padding-top:16px;border-top:1px solid #e4e9ec;color:#758491;font-size:12px;">Sent by the COP Partner Hub. WhatsApp delivery is not connected yet.</p>
        </div>
      `,
    });

    return res.json({
      ok: true,
      email: { status: "sent", to: recipient, cc: recipient === ADMIN_EMAIL ? [] : [ADMIN_EMAIL], id: delivery?.id || null },
      whatsapp: { status: contact.phone ? "not_configured" : "missing_number", phone: clean(contact.phone, 40) || null }
    });
  } catch (error) {
    console.error("[partner-hub-notify]", error);
    return res.status(502).json({ error: "Resend did not accept the notification. Please try again." });
  }
}

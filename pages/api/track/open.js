/**
 * Email open tracking pixel.
 * Embedded as a 1×1 invisible image in outbound emails.
 * URL: /api/track/open?t={tracking_id}
 *
 * Returns a transparent 1×1 GIF immediately, then records the open
 * asynchronously so it never slows down email rendering.
 */
import { recordEmailOpen } from '@/lib/crm';

// 1×1 transparent GIF (37 bytes)
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export default async function handler(req, res) {
  // Return the pixel immediately — don't make the email client wait
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.status(200).send(PIXEL);

  // Record the open after responding
  const trackingId = req.query.t;
  if (!trackingId) return;

  const ip  = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  const ua  = req.headers['user-agent'] || '';

  // Skip crawlers and link-preview fetchers only. The old pattern also
  // matched `apple` (every AppleWebKit browser and Apple Mail), `google`
  // (GoogleImageProxy — i.e. EVERY Gmail open), `microsoft` and `outlook`, so
  // almost no real open was ever recorded (7 Sep 2026 audit). Proxy fetches
  // by Gmail/Apple Mail happen when the person opens the email, so they count.
  const botPatterns = /\b(bot|crawler|spider|preview|prefetch|linkcheck|monitor)\b|slurp|facebookexternalhit|whatsapp|telegram/i;
  if (botPatterns.test(ua)) return;

  try {
    await recordEmailOpen({ trackingId, ipAddress: ip, userAgent: ua });
  } catch (e) {
    console.error('[Track] open record failed:', e.message);
  }
}

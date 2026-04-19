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

  // Skip known bot/preview user agents (email clients pre-fetch images)
  const botPatterns = /bot|crawler|spider|preview|prefetch|yahoo|google|apple|microsoft|outlook/i;
  if (botPatterns.test(ua)) return;

  try {
    await recordEmailOpen({ trackingId, ipAddress: ip, userAgent: ua });
  } catch (e) {
    console.error('[Track] open record failed:', e.message);
  }
}

/**
 * GET /api/preview/watch-alert?locale=de&kind=drop
 *
 * Renders a bell alert exactly as it would send, using the same builder the
 * cron uses — so what you see here is what lands in the inbox. Sample data
 * only; touches no watcher record and sends nothing.
 */
import { buildWatchEmail } from '@/lib/watchAlertEmail';

const SAMPLE = {
  slug: 'marbella-andalusia-spain-3-bed-villa-with-pool',
  title: 'Marbella, Andalusia, Spain — 3-Bed Villa With Pool & Sea Views',
  title_es: 'Marbella, Andalucía, España — Villa de 3 dormitorios con piscina y vistas al mar',
  title_de: 'Marbella, Andalusien, Spanien — Villa mit 3 Schlafzimmern, Pool und Meerblick',
  title_fr: 'Marbella, Andalousie, Espagne — Villa 3 chambres avec piscine et vue mer',
  title_it: 'Marbella, Andalusia, Spagna — Villa con 3 camere, piscina e vista mare',
  title_nl: 'Marbella, Andalusië, Spanje — Villa met 3 slaapkamers, zwembad en zeezicht',
  title_pt: 'Marbella, Andaluzia, Espanha — Villa de 3 quartos com piscina e vista para o mar',
  title_sv: 'Marbella, Andalusien, Spanien — Villa med 3 sovrum, pool och havsutsikt',
  title_da: 'Marbella, Andalusien, Spanien — Villa med 3 soveværelser, pool og havudsigt',
  title_no: 'Marbella, Andalucía, Spania — Villa med 3 soverom, basseng og sjøutsikt',
  img: 'https://iotzzoxyckpyatzqcjbo.supabase.co/storage/v1/object/public/property-images/marbella-andalusia-spain-3-bed-villa-with-pool/hero.jpg',
  price: 165000,
  currency: 'EUR',
  beds: 3,
};

export default function handler(req, res) {
  const locale = String(req.query.locale || 'en');
  const kind = ['sold', 'drop', 'rise'].includes(String(req.query.kind)) ? String(req.query.kind) : 'drop';
  const { subject, html } = buildWatchEmail({
    property: SAMPLE,
    email: 'preview@co-ownership-property.com',
    locale,
    kind,
    oldPrice: 189000,
  });
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(
    `<!doctype html><meta charset="utf-8"><title>${subject}</title>` +
    `<div style="max-width:640px;margin:24px auto;font-family:Arial,sans-serif">` +
    `<p style="font-size:12px;color:#8a9aaa;letter-spacing:.08em;text-transform:uppercase;margin:0 0 4px">Subject line</p>` +
    `<p style="font-size:16px;color:#1E3448;margin:0 0 20px"><strong>${subject}</strong></p></div>` +
    html
  );
}

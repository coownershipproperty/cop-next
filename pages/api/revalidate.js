import { pingIndexNow } from '@/lib/indexnow';
import { SUPPORTED_LOCALES, familyPrefix, routePath } from '@/lib/i18n';

const REVALIDATION_BATCH_SIZE = 3;

export function propertyDetailRevalidationPaths(slug) {
  return SUPPORTED_LOCALES.map((locale) => {
    const propertyPrefix = familyPrefix(locale, 'property');
    return propertyPrefix ? `${propertyPrefix}${slug}/` : null;
  }).filter(Boolean);
}

export function propertyCollectionRevalidationPaths() {
  return SUPPORTED_LOCALES.flatMap((locale) => (
    [
      routePath(locale, 'homes'),
      routePath(locale, 'home'),
    ].filter(Boolean)
  ));
}

export function propertyRevalidationPaths(slug) {
  return [
    ...propertyDetailRevalidationPaths(slug),
    ...propertyCollectionRevalidationPaths(),
  ];
}

async function revalidateInBatches(res, paths) {
  for (let index = 0; index < paths.length; index += REVALIDATION_BATCH_SIZE) {
    const batch = paths.slice(index, index + REVALIDATION_BATCH_SIZE);
    await Promise.all(batch.map(path => res.revalidate(path)));
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verify caller is authorised (Supabase webhook, Vercel cron, or local Codex automation).
  const auth = req.headers['authorization'] || '';
  const allowedSecrets = [
    process.env.CRON_SECRET,
    // Dedicated shared secret used only by the Supabase property trigger.
    process.env.REVALIDATE_SECRET,
    // Local Codex publish automation already needs the service-role key to update posts.
    // Accepting it here avoids a separate secret when the Vercel CRON_SECRET is not locally retrievable.
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ].filter(Boolean);

  if (allowedSecrets.length === 0 || !allowedSecrets.some(secret => auth === `Bearer ${secret}`)) {
    return res.status(401).json({ message: 'Unauthorised' });
  }

  try {
    const slug = req.body?.record?.slug;
    const target = req.body?.table || req.body?.type || req.body?.entity;
    const scope = req.body?.scope;
    const explicitPaths = Array.isArray(req.body?.paths) ? req.body.paths : [];
    const paths = explicitPaths.filter(path => typeof path === 'string' && path.startsWith('/'));

    if (target === 'paths') {
      if (paths.length === 0) {
        return res.status(400).json({ message: 'No valid paths in payload' });
      }
    } else if (target === 'posts' || target === 'post' || target === 'blog') {
      if (!slug) return res.status(400).json({ message: 'No slug in payload' });
      paths.push('/all-our-blog', '/all-our-blog/', `/blog/${slug}`, `/blog/${slug}/`, '/');
    } else if (target === 'destination' || target === 'destinations') {
      if (!slug) return res.status(400).json({ message: 'No slug in payload' });
      // Destination editorial pages — rewrites land in content/destinations/<slug>.html
      // but Vercel edge caches the rendered output, so a content-only change needs
      // an explicit revalidate to bust the cache without a full Vercel rebuild.
      paths.push(`/${slug}`, `/${slug}/`);
      // Also revalidate the DE mirror if it exists.
      paths.push(`/de/destinationen/${slug}`, `/de/destinationen/${slug}/`);
    } else if (target === 'home' || target === 'homepage' || target === 'all') {
      // Bust the homepage + main static pages. Use when shipping a CSS/header
      // change that affects the chrome of every page but Vercel keeps serving
      // stale HTML referencing the previous CSS hash.
      paths.push('/', '/our-homes/', '/all-our-blog/', '/how-it-works/', '/about-us/', '/contact/');
      paths.push('/es/', '/es/propiedades/', '/es/blog/', '/es/como-funciona/', '/es/quienes-somos/', '/es/contacto/');
      paths.push('/fr/', '/fr/proprietes/', '/fr/blog/', '/fr/comment-ca-marche/', '/fr/a-propos/', '/fr/contact/');
      paths.push('/de/', '/de/immobilien/', '/de/blog/', '/de/so-funktionierts/', '/de/ueber-uns/', '/de/kontakt/');
    } else {
      if (!slug) return res.status(400).json({ message: 'No slug in payload' });
      // A property is rendered into one detail page per launched locale and can
      // also change the contents of every locale's listings page and homepage.
      // Revalidate those canonical routes directly so a database edit does not
      // need a full production rebuild to refresh translated pages.
      if (scope === 'detail') {
        paths.push(...propertyDetailRevalidationPaths(slug));
      } else if (scope === 'collections') {
        paths.push(...propertyCollectionRevalidationPaths());
      } else {
        paths.push(...propertyRevalidationPaths(slug));
      }
    }

    const uniquePaths = [...new Set(paths)];
    await revalidateInBatches(res, uniquePaths);

    // Notify IndexNow (Bing / Copilot / Yandex) so the changed URLs get recrawled
    // within minutes. Best-effort — never blocks or fails the revalidate response.
    if (req.body?.notifyIndexNow !== false) await pingIndexNow(uniquePaths);

    return res.json({ revalidated: true, slug, paths: uniquePaths });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

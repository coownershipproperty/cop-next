export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verify caller is authorised (Supabase webhook, Vercel cron, or local Codex automation).
  const auth = req.headers['authorization'] || '';
  const allowedSecrets = [
    process.env.CRON_SECRET,
    // Local Codex publish automation already needs the service-role key to update posts.
    // Accepting it here avoids a separate secret when the Vercel CRON_SECRET is not locally retrievable.
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ].filter(Boolean);

  if (allowedSecrets.length === 0 || !allowedSecrets.some(secret => auth === `Bearer ${secret}`)) {
    return res.status(401).json({ message: 'Unauthorised' });
  }

  try {
    const slug = req.body?.record?.slug;

    if (!slug) {
      return res.status(400).json({ message: 'No slug in payload' });
    }

    const target = req.body?.table || req.body?.type || req.body?.entity;
    const explicitPaths = Array.isArray(req.body?.paths) ? req.body.paths : [];
    const paths = explicitPaths.filter(path => typeof path === 'string' && path.startsWith('/'));

    if (target === 'posts' || target === 'post' || target === 'blog') {
      paths.push('/all-our-blog', '/all-our-blog/', `/blog/${slug}`, `/blog/${slug}/`, '/');
    } else if (target === 'destination' || target === 'destinations') {
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
      paths.push(`/property/${slug}`, `/property/${slug}/`, '/our-homes', '/our-homes/', '/');
    }

    const uniquePaths = [...new Set(paths)];
    await Promise.all(uniquePaths.map(path => res.revalidate(path)));

    return res.json({ revalidated: true, slug, paths: uniquePaths });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
};

nextConfig.redirects = async () => [
  // ── Blog ──────────────────────────────────────────────────────────────────
  { source: '/blog',                    destination: '/all-our-blog/',  permanent: true },
  { source: '/blog/',                   destination: '/all-our-blog/',  permanent: true },
  { source: '/market-insights',         destination: '/all-our-blog/',  permanent: true },
  { source: '/market-insights/',        destination: '/all-our-blog/',  permanent: true },
  { source: '/robots-ai-second-homes',  destination: '/all-our-blog/',  permanent: true },
  { source: '/robots-ai-second-homes/', destination: '/all-our-blog/',  permanent: true },

  // ── Contact ───────────────────────────────────────────────────────────────
  { source: '/contact-us',  destination: '/contact/', permanent: true },
  { source: '/contact-us/', destination: '/contact/', permanent: true },
  { source: '/thank-you',   destination: '/',         permanent: true },
  { source: '/thank-you/',  destination: '/',         permanent: true },
  { source: '/we-will-buy-the-property-with-you',  destination: '/contact/', permanent: true },
  { source: '/we-will-buy-the-property-with-you/', destination: '/contact/', permanent: true },
  { source: '/high-running-costs-sell-shares-in-your-holiday-home',  destination: '/contact/', permanent: true },
  { source: '/high-running-costs-sell-shares-in-your-holiday-home/', destination: '/contact/', permanent: true },

  // ── Properties / Homes ────────────────────────────────────────────────────
  { source: '/properties',                destination: '/our-homes/', permanent: true },
  { source: '/properties/',               destination: '/our-homes/', permanent: true },
  { source: '/properties-standard-list',  destination: '/our-homes/', permanent: true },
  { source: '/properties-standard-list/', destination: '/our-homes/', permanent: true },
  { source: '/properties-destinations',   destination: '/our-homes/', permanent: true },
  { source: '/properties-destinations/',  destination: '/our-homes/', permanent: true },
  { source: '/co-ownership-destinations', destination: '/our-homes/', permanent: true },
  { source: '/co-ownership-destinations/',destination: '/our-homes/', permanent: true },
  { source: '/co-ownership-apartments',   destination: '/our-homes/', permanent: true },
  { source: '/co-ownership-apartments/',  destination: '/our-homes/', permanent: true },
  { source: '/saved-searches',            destination: '/favourites/', permanent: true },
  { source: '/saved-searches/',           destination: '/favourites/', permanent: true },
  { source: '/mountain-lifestyle',        destination: '/our-homes/', permanent: true },
  { source: '/mountain-lifestyle/',       destination: '/our-homes/', permanent: true },

  // ── How It Works / Education pages ───────────────────────────────────────
  { source: '/what-is-fractional-ownership',                        destination: '/how-it-works/', permanent: true },
  { source: '/what-is-fractional-ownership/',                       destination: '/how-it-works/', permanent: true },
  { source: '/sell-your-fractional-share',                          destination: '/how-it-works/', permanent: true },
  { source: '/sell-your-fractional-share/',                         destination: '/how-it-works/', permanent: true },
  { source: '/benefits-of-fractional-ownership-for-second-homes',  destination: '/how-it-works/', permanent: true },
  { source: '/benefits-of-fractional-ownership-for-second-homes/', destination: '/how-it-works/', permanent: true },
  { source: '/the-running-costs-of-a-fractional-ownership-property',  destination: '/how-it-works/', permanent: true },
  { source: '/the-running-costs-of-a-fractional-ownership-property/', destination: '/how-it-works/', permanent: true },
  { source: '/co-ownership-buying-process',   destination: '/how-it-works/', permanent: true },
  { source: '/co-ownership-buying-process/',  destination: '/how-it-works/', permanent: true },
  { source: '/co-ownership-vs-full-ownership',  destination: '/how-it-works/', permanent: true },
  { source: '/co-ownership-vs-full-ownership/', destination: '/how-it-works/', permanent: true },

  // ── About ─────────────────────────────────────────────────────────────────
  { source: '/co-ownership-case-studies',  destination: '/about-us/', permanent: true },
  { source: '/co-ownership-case-studies/', destination: '/about-us/', permanent: true },
  { source: '/home-mobile',  destination: '/', permanent: true },
  { source: '/home-mobile/', destination: '/', permanent: true },

  // ── Specific city destination pages (non-standard WP slugs) ──────────────
  { source: '/miami-fractional-ownership',              destination: '/florida-fractional-ownership-properties/', permanent: true },
  { source: '/miami-fractional-ownership/',             destination: '/florida-fractional-ownership-properties/', permanent: true },
  { source: '/brickell-fractional-ownership-miami',     destination: '/florida-fractional-ownership-properties/', permanent: true },
  { source: '/brickell-fractional-ownership-miami/',    destination: '/florida-fractional-ownership-properties/', permanent: true },
  { source: '/breckenridge-fractional-ownership',       destination: '/colorado-fractional-ownership-properties/', permanent: true },
  { source: '/breckenridge-fractional-ownership/',      destination: '/colorado-fractional-ownership-properties/', permanent: true },
  { source: '/aspen-fractional-ownership',              destination: '/colorado-fractional-ownership-properties/', permanent: true },
  { source: '/aspen-fractional-ownership/',             destination: '/colorado-fractional-ownership-properties/', permanent: true },
  { source: '/vail-fractional-ownership',               destination: '/colorado-fractional-ownership-properties/', permanent: true },
  { source: '/vail-fractional-ownership/',              destination: '/colorado-fractional-ownership-properties/', permanent: true },
  { source: '/park-city-fractional-ownership-2',        destination: '/utah-fractional-ownership-properties/', permanent: true },
  { source: '/park-city-fractional-ownership-2/',       destination: '/utah-fractional-ownership-properties/', permanent: true },
  { source: '/napa-sonoma-fractional-ownership-wine-country-estates',  destination: '/california-fractional-ownership-properties/', permanent: true },
  { source: '/napa-sonoma-fractional-ownership-wine-country-estates/', destination: '/california-fractional-ownership-properties/', permanent: true },
  { source: '/malibu-santa-barbara-fractional-ownership',  destination: '/california-fractional-ownership-properties/', permanent: true },
  { source: '/malibu-santa-barbara-fractional-ownership/', destination: '/california-fractional-ownership-properties/', permanent: true },
  { source: '/newport-beach-fractional-ownership',      destination: '/california-fractional-ownership-properties/', permanent: true },
  { source: '/newport-beach-fractional-ownership/',     destination: '/california-fractional-ownership-properties/', permanent: true },
  { source: '/palm-springs-fractional-ownership-desert-modern-luxury',  destination: '/california-fractional-ownership-properties/', permanent: true },
  { source: '/palm-springs-fractional-ownership-desert-modern-luxury/', destination: '/california-fractional-ownership-properties/', permanent: true },

  // ── WordPress admin/system URLs ───────────────────────────────────────────
  { source: '/wp-admin',       destination: '/', permanent: true },
  { source: '/wp-admin/',      destination: '/', permanent: true },
  { source: '/wp-login.php',   destination: '/', permanent: true },
  { source: '/wp-signup.php',  destination: '/', permanent: true },
  { source: '/wp-json/:path*', destination: '/', permanent: true },

  // ── WordPress category/tag archives ───────────────────────────────────────
  { source: '/category/:slug',  destination: '/all-our-blog/', permanent: true },
  { source: '/category/:slug/', destination: '/all-our-blog/', permanent: true },
  { source: '/tag/:slug',       destination: '/all-our-blog/', permanent: true },
  { source: '/tag/:slug/',      destination: '/all-our-blog/', permanent: true },
];

module.exports = nextConfig;

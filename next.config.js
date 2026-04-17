/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
};

nextConfig.redirects = async () => [
  // Old page slugs → new equivalents
  { source: '/contact-us',  destination: '/contact',       permanent: true },
  { source: '/contact-us/', destination: '/contact/',      permanent: true },
  { source: '/blog',        destination: '/all-our-blog',  permanent: true },
  { source: '/blog/',       destination: '/all-our-blog/', permanent: true },

  // WordPress admin/login — redirect away cleanly
  { source: '/wp-admin',          destination: '/', permanent: true },
  { source: '/wp-admin/',         destination: '/', permanent: true },
  { source: '/wp-login.php',      destination: '/', permanent: true },
  { source: '/wp-signup.php',     destination: '/', permanent: true },
  { source: '/wp-json/:path*',    destination: '/', permanent: true },

  // Old WordPress category/tag archive pages → blog
  { source: '/category/:slug',    destination: '/all-our-blog/', permanent: true },
  { source: '/category/:slug/',   destination: '/all-our-blog/', permanent: true },
  { source: '/tag/:slug',         destination: '/all-our-blog/', permanent: true },
  { source: '/tag/:slug/',        destination: '/all-our-blog/', permanent: true },

  // Old destination landing pages → our homes with filter
  { source: '/:slug*-fractional-ownership-properties',  destination: '/our-homes/', permanent: true },
  { source: '/:slug*-fractional-ownership-properties/', destination: '/our-homes/', permanent: true },
];

module.exports = nextConfig;

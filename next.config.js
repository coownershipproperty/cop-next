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

  // Old WordPress "properties" or "homes" page → our-homes
  { source: '/properties',  destination: '/our-homes/', permanent: true },
  { source: '/properties/', destination: '/our-homes/', permanent: true },

  // what-is-fractional-ownership → how it works (linked internally in blog posts)
  { source: '/what-is-fractional-ownership',  destination: '/how-it-works/', permanent: true },
  { source: '/what-is-fractional-ownership/', destination: '/how-it-works/', permanent: true },

  // sell-your-fractional-share → how it works
  { source: '/sell-your-fractional-share',  destination: '/how-it-works/', permanent: true },
  { source: '/sell-your-fractional-share/', destination: '/how-it-works/', permanent: true },
];

module.exports = nextConfig;

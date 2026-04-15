/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  // Images served directly from WordPress (no Vercel optimization needed - 
  // the browser handles lazy loading natively via loading="lazy")
};

nextConfig.redirects = async () => [
  { source: '/contact-us', destination: '/contact', permanent: true },
  { source: '/contact-us/', destination: '/contact/', permanent: true },
  { source: '/blog', destination: '/all-our-blog', permanent: true },
  { source: '/blog/', destination: '/all-our-blog/', permanent: true },
];

module.exports = nextConfig;

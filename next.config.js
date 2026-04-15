/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,

  images: {
    // Vercel fetches once from these domains, optimises to WebP/AVIF,
    // then serves from their global CDN — Hostinger only hit once per image
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'co-ownership-property.com',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'staging.co-ownership-property.com',
        pathname: '/wp-content/uploads/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 604800, // 7 days
  },
};

nextConfig.redirects = async () => [
  { source: '/contact-us',  destination: '/contact',      permanent: true },
  { source: '/contact-us/', destination: '/contact/',     permanent: true },
  { source: '/blog',        destination: '/all-our-blog', permanent: true },
  { source: '/blog/',       destination: '/all-our-blog/', permanent: true },
];

module.exports = nextConfig;

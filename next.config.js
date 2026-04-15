/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true, // Match existing WordPress URL structure exactly
  images: {
    // Allow next/image to optimise images from these external domains
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
    // Output WebP/AVIF, serve at correct sizes
    formats: ['image/avif', 'image/webp'],
    // Reasonable cache TTL (7 days)
    minimumCacheTTL: 604800,
  },
};

nextConfig.redirects = async () => [
  // /contact-us is the old WordPress slug — redirect to /contact permanently
  { source: '/contact-us', destination: '/contact', permanent: true },
  { source: '/contact-us/', destination: '/contact/', permanent: true },
  // Blog alias
  { source: '/blog', destination: '/all-our-blog', permanent: true },
  { source: '/blog/', destination: '/all-our-blog/', permanent: true },
];

module.exports = nextConfig;

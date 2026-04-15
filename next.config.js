/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = nextConfig;

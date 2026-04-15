/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
};

nextConfig.redirects = async () => [
  { source: '/contact-us',  destination: '/contact',       permanent: true },
  { source: '/contact-us/', destination: '/contact/',      permanent: true },
  { source: '/blog',        destination: '/all-our-blog',  permanent: true },
  { source: '/blog/',       destination: '/all-our-blog/', permanent: true },
];

module.exports = nextConfig;

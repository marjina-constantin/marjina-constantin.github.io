/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use static export for production builds
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    trailingSlash: true,
    basePath: '/expenses-next',
    images: {
      unoptimized: true,
    },
  }),
};

module.exports = nextConfig; 
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  serverExternalPackages: ['@vercel/og'],
};

module.exports = nextConfig;

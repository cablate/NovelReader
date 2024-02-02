/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/recent",
      },
    ];
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/conversations/:path*",
        destination: "http://localhost:9603/api/conversations/:path*",
      },
      {
        source: "/api/download/:path*",
        destination: "http://localhost:9603/api/download/:path*",
      },
      {
        source: "/api/health",
        destination: "http://localhost:9603/api/health",
      },
    ];
  },
};

module.exports = nextConfig;

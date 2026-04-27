/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/conversations/:path*",
        destination: "http://localhost:9527/api/conversations/:path*",
      },
      {
        source: "/api/download/:path*",
        destination: "http://localhost:9527/api/download/:path*",
      },
      {
        source: "/api/health",
        destination: "http://localhost:9527/api/health",
      },
    ];
  },
};

module.exports = nextConfig;

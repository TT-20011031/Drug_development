/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:9603/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;

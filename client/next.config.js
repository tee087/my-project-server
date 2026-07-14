/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://localhost:5000/api/:path*" }
    ]
  },
}

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: "/api",
  },
  // Allow cross-origin requests from development domain
  allowedDevOrigins: ["dev.uniconnectcrm.com.br", "localhost:3000", "localhost:8080"],
  async rewrites() {
    const target = process.env.API_PROXY_TARGET || "http://localhost:8080"
    return [
      {
        source: "/api/:path*",
        destination: `${target}/api/:path*`,
      },
    ]
  },
}

export default nextConfig

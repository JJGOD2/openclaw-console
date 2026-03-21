/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Hardcode API URL so it's available at build time
  // even without Build Arguments
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://openclaw-backend.zeabur.app",
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
    serverActions: { allowedOrigins: ["*"] },
  },

  images: {
    unoptimized: true,
  },
};
export default nextConfig;

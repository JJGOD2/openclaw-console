/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Allow build to complete even with minor TypeScript/ESLint warnings
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
    serverActions: { allowedOrigins: ["*"] },
  },

  // Required for Next.js Image with external sources
  images: {
    remotePatterns: [],
    unoptimized: true,
  },
};
export default nextConfig;

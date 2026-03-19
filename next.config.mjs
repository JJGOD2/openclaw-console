/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Ignore TypeScript and ESLint errors during Zeabur build
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

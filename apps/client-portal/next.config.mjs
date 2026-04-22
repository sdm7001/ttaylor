/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ttaylor/ui', '@ttaylor/domain'],
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;

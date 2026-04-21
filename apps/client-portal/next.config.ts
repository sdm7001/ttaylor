import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@ttaylor/ui', '@ttaylor/domain'],
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;

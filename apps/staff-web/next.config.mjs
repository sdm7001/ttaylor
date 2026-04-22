/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ttaylor/ui', '@ttaylor/domain'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)),
        '@prisma/client',
        '.prisma/client',
      ];
    }
    return config;
  },
};

export default nextConfig;

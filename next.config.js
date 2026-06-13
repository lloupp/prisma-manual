/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        '@libsql/client',
        '@prisma/adapter-libsql',
      ];
    }
    // Three.js uses browser APIs — exclude from SSR bundle
    config.externals = config.externals || [];
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
      };
    }
    return config;
  },
};

module.exports = nextConfig;

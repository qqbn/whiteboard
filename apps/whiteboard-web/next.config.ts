import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @whiteboard/ui ships raw TS/TSX (internal package) – Next compiles it like app code.
  transpilePackages: ['@whiteboard/ui'],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;

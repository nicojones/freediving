import type { NextConfig } from 'next';
// Serwist disabled: causes "a[d] is not a function" / "originalFactory is undefined" during prerender.
// Re-enable when @serwist/next fixes server bundle injection of client-only sw-entry.
// import withSerwistInit from '@serwist/next'

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['idb'],
  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/fish.svg' }];
  },
};

export default nextConfig;

import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  // Avoid dev rebuild loop: Serwist writes `public/sw.js` each compile; Next watches `public/` and retriggers.
  disable: process.env.NODE_ENV !== 'production',
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  additionalPrecacheEntries: [
    { url: '/audio/hold.m4a', revision: null },
    { url: '/audio/prepare.m4a', revision: null },
    { url: '/audio/30s.m4a', revision: null },
    { url: '/audio/breathe.m4a', revision: null },
  ],
})

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['idb'],
  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/icon' }]
  },
}

export default withSerwist(nextConfig)

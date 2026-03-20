import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fishly — Breathhold Protocol',
    short_name: 'Fishly',
    theme_color: '#52dad3',
    background_color: '#0d1416',
    display: 'standalone',
    start_url: '/',
    icons: [
      { src: '/fish.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}

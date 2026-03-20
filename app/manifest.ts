import type { MetadataRoute } from 'next';

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
      { src: '/icons/fish.png', sizes: '256x256', type: 'image/png', purpose: 'any' },
    ],
  };
}

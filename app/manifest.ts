import { APP_NAME, APP_DESCR } from '@/src/constants/app';
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} — ${APP_DESCR}`,
    short_name: APP_NAME,
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

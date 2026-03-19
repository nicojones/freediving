import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Submerged — Breathhold Protocol',
        short_name: 'Submerged',
        theme_color: '#52dad3',
        background_color: '#0d1416',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,m4a}'],
        additionalManifestEntries: [
          { url: '/audio/hold.m4a', revision: null },
          { url: '/audio/prepare.m4a', revision: null },
          { url: '/audio/30s.m4a', revision: null },
          { url: '/audio/breathe.m4a', revision: null },
        ],
        runtimeCaching: [
          {
            urlPattern: /\.(m4a|mp3|wav|ogg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: { maxEntries: 50 },
              cacheableResponse: { statuses: [200, 206] },
              rangeRequests: true,
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})

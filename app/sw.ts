/// <reference lib="webworker" />
import { defaultCache } from '@serwist/next/worker'
import {
  CacheFirst,
  CacheableResponsePlugin,
  RangeRequestsPlugin,
  Serwist,
} from 'serwist'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...defaultCache,
    {
      matcher:
        ({ request }) =>
        request.destination === 'audio' ||
        /\.(m4a|mp3|wav|ogg)$/i.test(new URL(request.url).pathname),
      handler: new CacheFirst({
        cacheName: 'audio-cache',
        plugins: [
          new CacheableResponsePlugin({ statuses: [200, 206] }),
          new RangeRequestsPlugin(),
        ],
      }),
    },
  ],
})

serwist.addEventListeners()

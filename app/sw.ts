import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, CacheFirst, NetworkFirst, CacheableResponsePlugin, ExpirationPlugin } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const appPaths = [
  '/',
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    cleanupOutdatedCaches: true,
    concurrency: 10,
    ignoreURLParametersMatching: [],
  },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  disableDevLogs: true,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
  runtimeCaching: [
  {
    matcher: ({ url, request }: any) => url.pathname.startsWith('/apps-icons/') && request.destination === 'image',
    handler: new CacheFirst({
      cacheName: 'apps-icons-cache',
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }),
      ],
    }),
  },
  {
    matcher: ({ url, request }: any) =>
        request.destination === 'document' &&
        appPaths.some(path =>
          path === '/'
            ? url.pathname === '/'
            : url.pathname.startsWith(path)
        ),
    handler: new NetworkFirst({
      cacheName: 'pwa-app-pages-cache',
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60 }),
      ],
    }),
  },
],
});

serwist.addEventListeners(); // Обов'язково в кінці, без додаткових кастомних слухачів 'install'

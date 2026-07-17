import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    svelte(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registrazione manuale via virtual:pwa-register/svelte in App.svelte,
      // cosi' possiamo agganciare il controllo periodico degli aggiornamenti.
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/*.png', 'emoji-data.json'],
      manifest: {
        name: 'Soundboard',
        short_name: 'Soundboard',
        description: 'Soundboard installabile con suoni personalizzati',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
        // emoji-data.json (~430kB) e' voluminoso: alziamo il limite di precache di workbox.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Il file /sw.js non deve mai essere servito dalla cache: lo gestisce nginx.conf.
        navigateFallbackDenylist: [/^\/api/],
        // Un nuovo service worker attiva subito (invece di restare "in attesa" finche'
        // tutte le schede/l'app installata non vengono chiuse): dopo un deploy, la
        // versione aggiornata viene servita al primo reload successivo, senza dover
        // aspettare o intercettare il banner "Nuova versione disponibile".
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Elenco suoni dall'API: prova sempre la rete (dati aggiornati da altri
            // dispositivi), ma cade sulla cache se offline o la rete e' lenta.
            urlPattern: /\/api\/sounds$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'sounds-list-cache',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // File audio: serviti subito dalla cache (bassa latenza al tap) mentre
            // una versione aggiornata viene scaricata in background per il prossimo utilizzo.
            urlPattern: /\/api\/sounds\/.+\/audio\..+$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'sounds-audio-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})

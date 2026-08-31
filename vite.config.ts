import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages proje sitesi /saglik-takip/ altında sunulur.
// Vercel yükleme uçları TR ağından engelli olduğu için yayın buraya alındı (2026-09-01).
const BASE = '/saglik-takip/';

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      // 'prompt': kullanıcı veri girerken sessiz reload = veri kaybı. Kontrol kullanıcıda.
      registerType: 'prompt',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        scope: BASE,
        name: 'Sağlık Takip — 3 Aylık Program',
        short_name: 'Sağlık',
        description: 'Su orucu, refeeding ve kilo verme programı takibi',
        start_url: BASE,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0a0a0c',
        theme_color: '#0a0a0c',
        lang: 'tr',
        icons: [
          { src: BASE + 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: BASE + 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: BASE + 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: BASE + 'index.html',
      },
    }),
  ],
});

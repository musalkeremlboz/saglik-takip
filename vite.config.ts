import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt': kullanıcı veri girerken sessiz reload = veri kaybı. Kontrol kullanıcıda.
      registerType: 'prompt',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Sağlık Takip — 3 Aylık Program',
        short_name: 'Sağlık',
        description: 'Su orucu, refeeding ve kilo verme programı takibi',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0a0a0c',
        theme_color: '#0a0a0c',
        lang: 'tr',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
});

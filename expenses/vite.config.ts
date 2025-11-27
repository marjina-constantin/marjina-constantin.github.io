import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/expenses/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Cache API responses for offline/instant access
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/dev-expenses-api\.pantheonsite\.io\/api\/expenses/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'expenses-api-cache',
              expiration: {
                maxEntries: 20, // Increased to handle more API responses
                maxAgeSeconds: 60 * 60 * 48, // 48 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 5, // Try network first, fallback to cache after 5s
            },
          },
        ],
        // Clean up old caches
        cleanupOutdatedCaches: true,
        // Skip waiting for service worker updates
        skipWaiting: true,
      },
    }),
  ],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts-vendor': ['highcharts', 'highcharts-react-official'],
          'icons-vendor': ['react-icons', 'lucide-react'],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging (disable in production for smaller bundles)
    sourcemap: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});

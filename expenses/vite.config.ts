import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/expenses', // relative paths
  plugins: [
    react(),
    VitePWA()
  ],
  server: {
    port: 3000,
  },
});

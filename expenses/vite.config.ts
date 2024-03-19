import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/expenses/',
  plugins: [
    react(),
    VitePWA({ registerType: 'autoUpdate' })
  ],
  server: {
    port: 3000,
    open: true,
  },
});

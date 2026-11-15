import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // The browser talks to one origin; Vite forwards /api to the Express server.
    // Same origin means the refresh cookie works with SameSite=Strict and no CORS is needed.
    proxy: { '/api': 'http://localhost:4000' },
  },
});

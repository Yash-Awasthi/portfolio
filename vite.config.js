import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The dev server keeps Vite's default host check. Disabling it (allowedHosts:
// 'all') lets a page on any domain reach 127.0.0.1 through DNS rebinding.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules[\/](three|@react-three)/.test(id)) return 'three';
        },
      },
    },
  },
});

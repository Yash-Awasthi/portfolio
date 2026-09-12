import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server keeps Vite's default host check. Disabling it (allowedHosts:
// 'all') lets a page on any domain reach 127.0.0.1 through DNS rebinding and
// read the responses, so it is only ever opened deliberately for a tunnel run.
export default defineConfig({
  plugins: [react()],
});

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    css: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Override PostCSS to avoid Tailwind v4 plugin incompatibility with Vite
  css: {
    postcss: {
      plugins: [],
    },
  },
});

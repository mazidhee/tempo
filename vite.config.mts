import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  root: path.resolve(import.meta.dirname, 'src/renderer'),
  base: './',
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    electron([
      {
        entry: path.resolve(import.meta.dirname, 'src/main/index.ts'),
        vite: {
          build: {
            outDir: path.resolve(import.meta.dirname, 'dist-electron/main'),
            rollupOptions: {
              external: ['node:sqlite'],
            },
          },
        },
      },
      {
        entry: path.resolve(import.meta.dirname, 'src/main/preload.ts'),
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: path.resolve(import.meta.dirname, 'dist-electron/preload'),
            rollupOptions: {
              external: ['node:sqlite'],
            },
          },
        },
      },
    ]),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src/renderer'),
    },
  },
});

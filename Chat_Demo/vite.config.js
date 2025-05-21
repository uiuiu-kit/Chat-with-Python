// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
    },
    worker: {
        format: 'es'
    },
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    resolve: {
      // Damit Worker-Dateien korrekt referenziert werden können
      alias: {
        '@': '/src',
      },
    },
    base: './',
});

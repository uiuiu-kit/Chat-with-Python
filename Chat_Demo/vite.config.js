// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        rollupOptions: {
            external: ['pyodide-worker-runner', 'comlink', 'comsync'],
        },
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
});
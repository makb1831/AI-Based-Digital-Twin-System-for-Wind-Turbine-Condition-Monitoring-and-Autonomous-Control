import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Keep runtime file writes out of the watcher so telemetry persistence does not reload the page.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: {
        ignored: ['**/.runtime/**', '**/data/**', '**/.env', '**/telemetry-history.json'],
      },
    },
  };
});

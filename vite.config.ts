import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables from the current working directory.
  const env = loadEnv(mode, '.', '');
  
  // Vercel provides env vars via process.env or the loaded env file.
  const apiKey = env.API_KEY || process.env.API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Replaces occurrences of process.env.API_KEY in your source code
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', '@google/genai']
          }
        }
      }
    },
    server: {
      port: 3000,
      host: true
    }
  };
});
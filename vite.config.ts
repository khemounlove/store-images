
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Fix: Using '.' as the environment directory instead of process.cwd() to resolve the TS error
  const env = loadEnv(mode, '.', '');
  
  const apiKey = env.API_KEY || process.env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // This ensures process.env.API_KEY is replaced during build
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    },
    server: {
      port: 3000
    }
  };
});

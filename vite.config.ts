import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
      'process.env.EXPO_PUBLIC_SUPABASE_URL': JSON.stringify(
        env.EXPO_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL
      ),
      'process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(
        env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY
      ),
      'process.env.EXPO_PUBLIC_SUPABASE_PROJECT_ID': JSON.stringify(
        env.EXPO_PUBLIC_SUPABASE_PROJECT_ID || env.VITE_SUPABASE_PROJECT_ID
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5000,
      strictPort: true,
      allowedHosts: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      headers: {
        'Cache-Control': 'no-store',
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 5000,
      strictPort: true,
      allowedHosts: true,
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            motion: ['motion'],
            zustand: ['zustand'],
          },
        },
      },
    },
  };
});

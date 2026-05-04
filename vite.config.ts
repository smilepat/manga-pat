import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // Merge process.env (Vercel injects here) with .env files (local dev).
  // Empty prefix loads ALL keys from .env files, not just VITE_*.
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };

  // Resolve the build-time API key from either name:
  //   - VITE_GEMINI_API_KEY  (Vite-canonical)
  //   - GEMINI_API_KEY       (matches AI Studio / common convention)
  const geminiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiKey),
    },
  };
});

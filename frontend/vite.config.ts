import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3001,
    cors: true,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://backend:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.VITE_BACKEND_URL || 'http://backend:3000',
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@awsome-tank-shooter/shared': path.resolve(__dirname, '../shared/src')
    }
  },
  optimizeDeps: {
    include: [],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  build: {
    target: 'es2020'
  }
}); 
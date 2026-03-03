import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@skippster/identity': path.resolve(__dirname, '../../core/identity/src'),
      '@skippster/pds': path.resolve(__dirname, '../../core/pds/src'),
      '@skippster/p2p': path.resolve(__dirname, '../../core/p2p/src'),
      '@skippster/payments': path.resolve(__dirname, '../../core/payments/src'),
      '@skippster/agent': path.resolve(__dirname, '../../core/agent/src'),
    },
  },
  server: {
    port: 3000,
  },
});
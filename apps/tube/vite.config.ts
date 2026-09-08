import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      // Polyfill Node builtins for the browser bundle (webtorrent deps import
      // node:path / node:crypto / node:events / node:stream; bare 'path' etc.
      // are handled by Vite's built-in aliasing + these for the node: forms).
      { find: /^node:path$/, replacement: 'path-browserify' },
      { find: /^node:crypto$/, replacement: 'crypto-browserify' },
      { find: /^node:stream$/, replacement: 'stream-browserify' },
      { find: /^node:events$/, replacement: 'events/' },
      // torrent-discovery/webtorrent mark bittorrent-dht as browser:false,
      // which Vite turns into an empty stub — but rollup fails on its named
      // `import { Client as DHT }`. We're a seed-only browser client (tracker
      // + LSD peer discovery), so provide a dummy DHT export.
      { find: /^bittorrent-dht$/, replacement: path.resolve(__dirname, './src/lib/dht-stub.ts') },
    ],
  },
  server: {
    port: 3000,
  },
  define: {
    // Required for webtorrent
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['webtorrent'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
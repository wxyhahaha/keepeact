import { defineConfig } from 'vite';
const path = require('path');

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  build: {
    rollupOptions: {
      input: './src/index.ts',
    },
    outDir: 'dist',
    assetsDir: '',
    lib: {
      entry: './src/index.ts',
      name: 'Keepeact',
    },
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

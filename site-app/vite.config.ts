import { defineConfig } from 'vite';
var path = require('path');

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  build: {
    rollupOptions: {
      input: './src/index.ts',
      output: {
        format: 'umd',
      },
    },
    outDir: 'dist',
    assetsDir: '',
    lib: {
      entry: './src/index.ts',
      name: 'Keepeact',
    },
  },
  esbuild: {
    jsxFactory: 'createVNode',
    jsxInject: "import { createVNode } from 'keepeact';",
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

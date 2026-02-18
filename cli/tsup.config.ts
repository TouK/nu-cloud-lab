import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  shims: true,
  clean: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  dts: false,
  sourcemap: false,
  minify: false,
  target: 'node18',
  publicDir: 'src/templates',
  outDir: 'dist',
});

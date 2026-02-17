import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./resources/js/vitest.setup.js'],
    exclude: ['web3/**', 'node_modules/**', 'tests/Browser/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['resources/js/**/*.{js,jsx}'],
      exclude: [
        'resources/js/**/*.test.{js,jsx}',
        'resources/js/vitest.setup.js',
        'resources/js/bootstrap.js',
        'resources/js/app.jsx'
      ],
    },
  },
  resolve: {
    alias: {
      '@': '/resources/js',
    },
  },
  esbuild: {
    jsxInject: `import React from 'react'`,
  },
});

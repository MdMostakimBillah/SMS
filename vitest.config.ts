/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    css: false,
    // Backend (apps/api) has its own vitest config + isolated test database;
    // never run its tests from the root runner. Also skip other tooling's
    // worktree copies (.kilo) so only THIS project's sources are tested.
    exclude: [...configDefaults.exclude, 'apps/**', 'edutech-dist/**', '.kilo/**'],
  },
})

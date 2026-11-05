import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname) } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'out', 'e2e'],
    // Next inlines __NEXT_TRAILING_SLASH from `trailingSlash: true` at build time; mirror it so <Link> hrefs match the export.
    env: { CMS_FIXTURES: '1', __NEXT_TRAILING_SLASH: 'true' },
  },
});

import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname) } },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          setupFiles: ['./vitest.setup.ts'],
          include: ['**/*.test.{ts,tsx}'],
          exclude: ['node_modules', '.next', 'out', 'e2e'],
          // Next inlines __NEXT_TRAILING_SLASH from `trailingSlash: true` at build time; mirror it so <Link> hrefs match the export.
          env: { CMS_FIXTURES: '1', __NEXT_TRAILING_SLASH: 'true' },
        },
      },
      {
        extends: true,
        plugins: [
          // Renders every story in a real browser (chromium) with the a11y addon's checks (TDD §6.3).
          storybookTest({ configDir: path.join(import.meta.dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});

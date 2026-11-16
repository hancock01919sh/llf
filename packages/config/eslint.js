import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Shared flat config. jsx-a11y is part of the definition of done (AGENTS.md, TDD §6.6).
 * @param {{ nextAppDir?: string }} [options]
 */
export function llfConfig(options = {}) {
  const { nextAppDir } = options;
  return tseslint.config(
    {
      ignores: [
        '**/node_modules/**',
        '**/.next/**',
        '**/out/**',
        '**/dist/**',
        '**/coverage/**',
        '**/playwright-report/**',
        '**/test-results/**',
        '**/next-env.d.ts',
        'apps/cms/**',
        'apps/web/storybook-static/**',
      ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
      languageOptions: {
        ecmaVersion: 2023,
        sourceType: 'module',
        globals: { ...globals.node },
      },
      rules: {
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
        ],
        // User input must never be logged (TDD D20). Use the structured logger.
        'no-console': ['error', { allow: ['warn', 'error'] }],
      },
    },
    {
      files: ['**/*.tsx', '**/*.jsx'],
      ...jsxA11y.flatConfigs.strict,
      languageOptions: {
        ...jsxA11y.flatConfigs.strict.languageOptions,
        globals: { ...globals.browser },
      },
    },
    {
      files: ['**/*.tsx', '**/*.ts'],
      plugins: { 'react-hooks': reactHooks },
      rules: {
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'error',
      },
    },
    ...(nextAppDir
      ? [
          {
            files: [`${nextAppDir}/**/*.{ts,tsx}`],
            plugins: { '@next/next': nextPlugin },
            settings: { next: { rootDir: nextAppDir } },
            rules: {
              ...nextPlugin.configs.recommended.rules,
              ...nextPlugin.configs['core-web-vitals'].rules,
            },
          },
        ]
      : []),
    {
      files: ['scripts/**/*.{js,mjs}', '**/*.config.{js,mjs,ts}', '**/server.mjs'],
      rules: { 'no-console': 'off' },
    },
    prettier,
  );
}

export default llfConfig();

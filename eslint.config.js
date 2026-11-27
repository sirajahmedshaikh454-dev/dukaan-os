import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.turbo/**', '**/coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // CLAUDE.md section 12: no `any` types, ever.
    rules: { '@typescript-eslint/no-explicit-any': 'error' },
  },
  {
    // ADR-0002: only packages/core may touch the database driver.
    files: ['apps/**', 'miniapps/**', 'packages/ui/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'mongoose', message: 'Use tenantModel from @dukaan/core.' }],
          // Mini-apps talk through events and contracts, never by importing each other.
          patterns: [
            { group: ['@dukaan/miniapp-*', '**/miniapps/*'], message: 'Use the event bus.' },
          ],
        },
      ],
    },
  },
);

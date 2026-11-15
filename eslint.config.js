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
);

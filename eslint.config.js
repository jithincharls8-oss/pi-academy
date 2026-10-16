import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

const HARD_CODED_COLOUR = '/(#[0-9a-fA-F]{3,8}\\b|\\brgba?\\(|\\bhsla?\\()/';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'src-tauri/target',
      'src-tauri/gen',
      'public',
      'coverage',
      'playwright-report',
      'test-results',
      'dev-dist',
    ],
  },
  js.configs.recommended,
  { files: ['**/*.mjs', '**/*.js'], languageOptions: { globals: { ...globals.node } } },
  ...tseslint.configs.strict,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Design tokens only: no hard-coded colours in UI code.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}', 'src/styles/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: `Literal[value=${HARD_CODED_COLOUR}]`,
          message:
            'Use design tokens (CSS variables / Tailwind token classes) instead of hard-coded colours.',
        },
        {
          selector: `TemplateElement[value.raw=${HARD_CODED_COLOUR}]`,
          message:
            'Use design tokens (CSS variables / Tailwind token classes) instead of hard-coded colours.',
        },
      ],
    },
  },
);

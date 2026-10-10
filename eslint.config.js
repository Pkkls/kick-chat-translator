// Flat config (ESLint 10). Same rule set as the .eslintrc.cjs it replaces:
// eslint:recommended + typescript-eslint recommended + recommended-type-checked +
// prettier, same overrides. Only .ts and .tsx are linted, as `--ext .ts,.tsx`
// did: the .js and .mjs files are harnesses and scripts outside tsconfig.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'release/**',
      // `scratchpad` is working notes and harness output, outside tsconfig and
      // outside the package. Type-aware linting cannot parse a file the project
      // does not include, so anything landing there fails the whole run: a copy of
      // a source file kept beside a script, or an esbuild bundle a harness wrote.
      'scratchpad/**',
      '**/*.js',
      '**/*.cjs',
      '**/*.mjs',
      'scripts/pack.ts',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node, ...globals.webextensions },
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
    },
  },
  prettier,
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
);

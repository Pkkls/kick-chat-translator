/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true, webextensions: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
  ],
  // `scratchpad` is working notes and harness output, outside tsconfig and
  // outside the package. Type-aware linting cannot parse a file the project
  // does not include, so anything landing there fails the whole run: a copy of
  // a source file kept beside a script, or an esbuild bundle a harness wrote.
  ignorePatterns: ['dist', 'release', 'node_modules', 'scratchpad', '*.config.js', '*.config.cjs', 'scripts/pack.ts'],
  rules: {
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'eqeqeq': ['error', 'always'],
    'prefer-const': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: {
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
      },
    },
  ],
};

// @ts-check

import eslint from '@eslint/js';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import ts_eslint from 'typescript-eslint';

export default ts_eslint.config(eslint.configs.recommended, ...ts_eslint.configs.recommended, {
  ignorePatterns: ['node_modules', 'dist', 'esbuild.config.mjs'],
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      project: './tsconfig.json',
    },
  },
  plugins: {
    '@typescript-eslint': tsEslint,
  },
  rules: {
    '@typescript-eslint/no-namespace': 'off',
  },
});

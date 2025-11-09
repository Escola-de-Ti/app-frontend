import { defineConfig } from 'eslint/config';
import tsEslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import pluginPrettier from 'eslint-plugin-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default defineConfig([
  // JS/JSX
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.es2024, ...globals.node },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },

  // TS/TSX
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tsEslint.configs.recommended],
    plugins: { prettier: pluginPrettier },
    languageOptions: {
      globals: { ...globals.es2024, ...globals.node },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },

  {
    files: ['**/*.{jsx,tsx}'],
    extends: [pluginReact.configs.flat.recommended],
    plugins: {
      prettier: pluginPrettier,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: { ...globals.es2024, ...globals.node },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-vars': 'error',

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Ignorar pastas
  {
    ignores: ['node_modules/**', 'android/**', 'ios/**', 'build/**', 'dist/**'],
  },
]);

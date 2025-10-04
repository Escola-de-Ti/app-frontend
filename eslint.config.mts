import { defineConfig } from 'eslint/config';
import tsEslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import pluginPrettier from 'eslint-plugin-prettier';
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
    plugins: { prettier: pluginPrettier }, // ← adiciona o plugin aqui
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

  // React/React Native
  {
    files: ['**/*.{jsx,tsx}'],
    extends: [pluginReact.configs.flat.recommended],
    plugins: { prettier: pluginPrettier }, // ← adiciona também aqui
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: { ...globals.es2024, ...globals.node },
    },
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-vars': 'error',
    },
  },

  // Ignorar pastas
  {
    ignores: ['node_modules/**', 'android/**', 'ios/**', 'build/**', 'dist/**'],
  },
]);

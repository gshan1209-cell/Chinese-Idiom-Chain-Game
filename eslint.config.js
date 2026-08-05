import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

const typedSourceConfigs = tseslint.configs.recommendedTypeChecked.map((config) => ({
  ...config,
  files: ['src/**/*.{ts,tsx}'],
  languageOptions: {
    ...config.languageOptions,
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname
    }
  }
}));

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      '.test-dist/**',
      'coverage/**',
      'node_modules/**',
      'public/generated/*.json'
    ]
  },
  eslint.configs.recommended,
  ...typedSourceConfigs,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-misused-promises': 'error'
    }
  },
  {
    files: ['**/*.mjs', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    }
  }
);

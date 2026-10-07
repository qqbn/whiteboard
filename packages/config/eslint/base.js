import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

/**
 * Shared base for every package: JS recommended + type-aware typescript-eslint.
 * `tsconfigRootDir` must point at the consuming package (pass `import.meta.dirname`),
 * otherwise the project service resolves tsconfigs from the wrong directory in a monorepo.
 *
 * @param {{ tsconfigRootDir: string }} options
 */
export function base({ tsconfigRootDir }) {
  return defineConfig([
    globalIgnores(['**/dist/**', '**/coverage/**', '**/.turbo/**', '**/node_modules/**']),
    js.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        parserOptions: { projectService: true, tsconfigRootDir },
      },
      rules: {
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { fixStyle: 'inline-type-imports' },
        ],
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
      },
    },
    {
      // Config files are plain JS outside of any tsconfig – lint them without type info.
      files: ['**/*.{js,mjs,cjs}'],
      extends: [tseslint.configs.disableTypeChecked],
    },
  ]);
}

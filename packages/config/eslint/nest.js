import { defineConfig } from 'eslint/config';
import globals from 'globals';
import { base } from './base.js';

/** @param {{ tsconfigRootDir: string }} options */
export function nest(options) {
  return defineConfig([
    base(options),
    {
      languageOptions: { globals: globals.node },
      rules: {
        // Nest DI reads constructor param types at runtime (emitDecoratorMetadata),
        // so `import type` on an injected class would silently break injection.
        '@typescript-eslint/consistent-type-imports': 'off',
        '@typescript-eslint/no-extraneous-class': 'off',
      },
    },
  ]);
}

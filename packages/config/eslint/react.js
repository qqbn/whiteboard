import { defineConfig } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import { base } from './base.js';

/** For React libraries that are not Next apps (e.g. packages/ui). */
/** @param {{ tsconfigRootDir: string }} options */
export function react(options) {
  return defineConfig([
    base(options),
    reactHooks.configs.flat['recommended-latest'],
    { languageOptions: { globals: globals.browser } },
  ]);
}

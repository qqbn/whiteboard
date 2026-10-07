import { react } from '@whiteboard/config/eslint/react';
import storybook from 'eslint-plugin-storybook';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  react({ tsconfigRootDir: import.meta.dirname }),
  storybook.configs['flat/recommended'],
  globalIgnores(['storybook-static/**', '!.storybook']),
]);

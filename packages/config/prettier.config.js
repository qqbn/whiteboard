import { fileURLToPath } from 'node:url';

/** @type {import('prettier').Config} */
export default {
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  // Resolve from this package – Prettier would otherwise look for the plugin relative to the
  // package being formatted, where it is not installed.
  plugins: [fileURLToPath(import.meta.resolve('prettier-plugin-tailwindcss'))],
};

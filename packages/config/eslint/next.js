import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { defineConfig, globalIgnores } from 'eslint/config';
import { base } from './base.js';

/** @param {{ tsconfigRootDir: string }} options */
export function next(options) {
  return defineConfig([
    base(options),
    ...nextVitals,
    ...nextTs,
    globalIgnores([
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'playwright-report/**',
      'test-results/**',
    ]),
  ]);
}

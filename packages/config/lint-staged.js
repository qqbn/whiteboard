/**
 * lint-staged picks the config closest to each staged file and runs it with that package as cwd,
 * so every package lints with its own eslint.config.js.
 */
export const withEslint = {
  '*.{ts,tsx,js,mjs}': ['eslint --fix --no-warn-ignored', 'prettier --write'],
  '*.{json,md,mdx,css,yml,yaml}': 'prettier --write',
};

export const prettierOnly = {
  '*': 'prettier --write --ignore-unknown',
};

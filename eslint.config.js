import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // The tooling scripts are plain ESM run by node, so they use `process` and
  // `console`. Nothing here had declared a Node environment before: the `src`
  // and `tests` files escape `no-undef` because typescript-eslint turns that
  // rule off for TypeScript, which left the gap invisible until a .mjs file
  // arrived. Declared narrowly, for this directory only.
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly' },
    },
  },
);

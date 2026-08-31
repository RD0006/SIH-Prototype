import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Vendored third-party runtimes. These are build artifacts fetched by
  // `npm run fetch:models` (minified emscripten glue for the ONNX and Tesseract
  // WASM cores), not project source, and linting them produced hundreds of
  // meaningless errors.
  globalIgnores(['dist', 'public/tesseract', 'src/vendor']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    plugins: { react },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Without this, no-unused-vars cannot see a binding that is only used as
      // a JSX tag — `<motion.div>` or a component passed in as a prop and
      // rendered as `<Icon />`. Both patterns are used throughout this
      // codebase, and every file that used them was reporting a false error.
      'react/jsx-uses-vars': 'error',
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // Build tooling runs in Node, not the browser.
    files: ['scripts/**/*.mjs', 'vite.config.js', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
])

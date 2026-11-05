import js from '@eslint/js'
import { fileURLToPath } from 'node:url'
import globals from 'globals'
import markdown from 'eslint-plugin-markdown'
import jsonPlugin from 'eslint-plugin-json'
import mochaPlugin from 'eslint-plugin-mocha'
import nPlugin from 'eslint-plugin-n'
import promisePlugin from 'eslint-plugin-promise'
import eslintPluginPlugin from 'eslint-plugin-eslint-plugin'
import chaiFriendly from 'eslint-plugin-chai-friendly'
import importPlugin from 'eslint-plugin-import'
import tseslint from 'typescript-eslint'

export default [
  {
    ignores: ['coverage/**', 'nyc_output/**', 'dist/**', 'docs/**']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // typescript-eslint's recommended rules are not files-scoped and would
    // also hit plain JS; keep JS (tests, markdown examples) on the old rules.
    files: ['**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off'
    }
  },
  {
    plugins: {
      import: importPlugin
    },
    languageOptions: {
      parserOptions: importPlugin.configs.recommended.parserOptions
    },
    rules: importPlugin.configs.recommended.rules
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.mocha
      }
    }
  },
  nPlugin.configs['flat/recommended'],
  promisePlugin.configs['flat/recommended'],
  eslintPluginPlugin.configs.recommended,
  mochaPlugin.configs.recommended,
  chaiFriendly.configs.recommendedFlat,
  ...markdown.configs.recommended,
  jsonPlugin.configs.recommended,
  {
    files: ['test/*.js'],
    rules: {
      'n/no-unpublished-require': 'off'
    }
  },
  {
    // Markdown code blocks contain documentation examples that reference
    // packages (pem itself, express) not installed in this project.
    files: ['**/*.md/*.js'],
    rules: {
      'n/no-missing-require': 'off',
      'n/no-process-exit': 'off',
      'n/no-unpublished-require': 'off'
    }
  },
  {
    // The TS compiler (tsc with noEmitOnError) is the module-resolution gate
    // for lib TS files; the import/n resolvers cannot resolve .ts siblings
    // and would false-positive from U2 onward.
    files: ['lib/**/*.ts'],
    rules: {
      'import/no-unresolved': 'off',
      'n/no-missing-require': 'off'
    }
  }
]

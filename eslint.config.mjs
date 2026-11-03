import { FlatCompat } from '@eslint/eslintrc'
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

const compat = new FlatCompat({
  baseDirectory: fileURLToPath(new URL('.', import.meta.url))
})

export default [
  {
    ignores: ['coverage/**', 'nyc_output/**', 'dist/**', 'docs/**']
  },
  js.configs.recommended,
  ...compat.config({
    extends: [
      'plugin:import/recommended',
      'plugin:import/typescript'
    ]
  }),
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
  eslintPluginPlugin.configs['flat/recommended'],
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
  }
]

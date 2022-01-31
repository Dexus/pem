module.exports = {
  'env': {
    'node': true,
    'es6': true,
    'jest': true
  },
  "globals": {
    "NodeJS": true
  },
  settings: {
    jest: {
      version: require('jest/package.json').version,
    },
  },
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {"ecmaVersion": 2018},
  plugins: [
    '@typescript-eslint',
  ],
  'extends': [
    "eslint:recommended",
    "plugin:promise/recommended",
    "plugin:eslint-plugin/recommended",
    "plugin:import/recommended",
    "plugin:markdown/recommended",
    "plugin:json/recommended",
    "plugin:eslint-plugin/recommended",
    "plugin:jsdoc/recommended",
    "plugin:jest/recommended",
    "plugin:import/typescript"
  ],
  "overrides": [
    {
      "files": ["test/*.js"],
      "rules": {
        "n/no-unpublished-require": "off",
        "no-redeclare": "off",
        "@typescript-eslint/no-redeclare": ["error"],
        "jest/no-disabled-test": "off",
        "jest/expect-expect": ["error", {"assertFunctionNames": ["expect", "checkError"]}]
      }
    }, {
      "files": ["test/*.ts"],
      "rules": {
        "no-redeclare": "off",
        "@typescript-eslint/no-redeclare": ["error"],
        "jest/no-disabled-tests": "off",
        "jest/expect-expect": ["error", {"assertFunctionNames": ["expect", "hlp.checkError"]}],
        "jest/no-done-callback": "off",
        "jest/no-conditional-expect": 1,
        "prefer-const": ["error", {
          "destructuring": "any",
          "ignoreReadBeforeAssign": false
        }]
      }
    },
    {
      "files": ["src/*.ts"],
      "rules": {
        "n/no-unpublished-require": "off",
        "no-redeclare": "off",
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": ["error"],
        "@typescript-eslint/no-redeclare": ["error"],
      }
    }
  ]
}

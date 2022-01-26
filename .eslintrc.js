module.exports = {
  'env': {
    'mocha': true,
    'node': true,
    'es6': true,
  },
  "globals": {
    "NodeJS": true
  },
  root: true,
  parser: '@typescript-eslint/parser',
  "parserOptions": {"ecmaVersion": 2018},
  plugins: [
    '@typescript-eslint',
  ],
  'extends': [
    "eslint:recommended",
    "plugin:promise/recommended",
    "plugin:eslint-plugin/recommended",
    "plugin:mocha/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:markdown/recommended",
    "plugin:json/recommended",
    "plugin:chai-friendly/recommended",
    "plugin:eslint-plugin/recommended"
  ],
  "overrides": [
    {
      "files": ["test/*.js"],
      "rules": {
        "n/no-unpublished-require": "off",
        "no-redeclare": "off",
        "@typescript-eslint/no-redeclare": ["error"]
      }
    },
    {
      "files": ["src/*.ts"],
      "rules": {
        "n/no-unpublished-require": "off",
        "no-redeclare": "off",
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": ["error"],
        "@typescript-eslint/no-redeclare": ["error"]
      }
    }
  ]
}

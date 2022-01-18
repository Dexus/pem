module.exports = {
  'env': {
    'mocha': true,
    'node': true
  },
  'extends': [
    "eslint:recommended",
    "plugin:promise/recommended",
    "plugin:n/recommended",
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
        "n/no-unpublished-require": "off"
      }
    }
  ]
}

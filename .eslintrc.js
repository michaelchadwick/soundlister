/* eslint-env node */
module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:cypress/recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'no-unused-vars': [
      'warn',
      {
        varsIgnorePattern: 'emit',
      },
    ],
  },
}

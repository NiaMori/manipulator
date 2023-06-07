/** @type import('eslint').Linter.Config */
module.exports = {
  root: true,

  extends: '@antfu',

  rules: {
    'curly': ['error', 'all'],
    'brace-style': 'off',
    '@typescript-eslint/brace-style': ['error', '1tbs'],
  },

  ignorePatterns: ['test/**/*.case.md'],
}

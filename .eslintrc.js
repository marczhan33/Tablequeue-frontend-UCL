module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.js', 'node_modules'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    // Warn on console.log in production
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    // Prevent unused variables
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // Enforce consistent coding style
    'prefer-const': 'error',
    'no-var': 'error',
    // Allow any for now but warn
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
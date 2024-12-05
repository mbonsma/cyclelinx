/* eslint-disable-next-line no-undef */
module.exports = {
  "extends": [
    "next/core-web-vitals",
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint', 'import', 'react', 'react-hooks'],
  rules: {
    'no-console': ['warn', { allow: ['error'] }],
    'no-case-declarations': 'off',
    'no-debugger': 'off',
    'react/no-unescaped-entities': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'import/order': [
      'error',
      {
        pathGroups: [
          {
            pattern: 'next/dynamic',
            group: 'builtin',
            position: 'before',
          },
          {
            pattern: 'react',
            group: 'builtin',
            position: 'before',
          },

        ],
        pathGroupsExcludedImportTypes: ['react'],
      },
    ],
    'import/no-useless-path-segments': 'error',
  },

}

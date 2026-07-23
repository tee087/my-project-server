const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    rules: {
      'react-native/no-inline-styles': 'off',
    },
  },
];
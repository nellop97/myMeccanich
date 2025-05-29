// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  unstable_conditionNames: ['require', 'react-native', 'browser'],
  unstable_enablePackageExports: true,
};

module.exports = config;

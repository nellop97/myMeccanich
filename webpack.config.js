// webpack.config.js
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Alias per moduli non compatibili con web
  config.resolve.alias = {
    ...config.resolve.alias,
    // React Native Firebase - usa Firebase JS SDK su web
    '@react-native-firebase/auth': 'firebase/auth',
    '@react-native-firebase/firestore': 'firebase/firestore',
    '@react-native-firebase/storage': 'firebase/storage',

    // Altri moduli nativi - fornisci fallback vuoti
    '@react-native-community/datetimepicker': false,
    'react-native-document-picker': false,
    'react-native-image-picker': false,
  };

  // Ignora moduli nativi che non hanno senso su web
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
    path: false,
    crypto: false,
  };

  return config;
};
// babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo'
    ],
    plugins: [
      // Plugin per la risoluzione dei moduli
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.ts', '.tsx', '.json'],
          alias: {
            '@': './',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@store': './src/store',
            '@types': './src/types',
            '@utils': './src/utils',
            '@assets': './assets',
            '@navigation': './src/navigation',
            '@hooks': './src/hooks',
          }
        }
      ],
      // Plugin per gestire import.meta nel web
      '@babel/plugin-syntax-import-meta',
      // Plugin necessari per React Native
      'react-native-reanimated/plugin', // DEVE essere l'ultimo plugin
    ]
  };
};
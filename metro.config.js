// metro.config.js - VERSIONE CORRETTA PER RISOLVERE IMPORT.META
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Aggiungi estensioni per supportare web e mobile
  config.resolver.sourceExts = [
    ...config.resolver.sourceExts,
    'web.js',
    'web.jsx', 
    'web.ts',
    'web.tsx'
  ];

  // Aggiungi alias per risolvere i percorsi
  config.resolver.alias = {
    '@': path.resolve(__dirname, './'),
    '@components': path.resolve(__dirname, './src/components'),
    '@screens': path.resolve(__dirname, './src/screens'),
    '@services': path.resolve(__dirname, './src/services'),
    '@store': path.resolve(__dirname, './src/store'),
    '@types': path.resolve(__dirname, './src/types'),
    '@utils': path.resolve(__dirname, './src/utils'),
    '@assets': path.resolve(__dirname, './assets'),
    '@navigation': path.resolve(__dirname, './src/navigation'),
    '@hooks': path.resolve(__dirname, './src/hooks'),
  };

  // Configura il transformer per gestire meglio i moduli
  config.transformer = {
    ...config.transformer,
    minifierConfig: {
      // Evita errori di minificazione con alcune librerie
      keep_fnames: true,
      mangle: {
        keep_fnames: true,
      },
    },
    // Gestione import.meta per web - ABILITA PER EXPO ROUTER
    unstable_allowRequireContext: true,
    // Fix per import.meta
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  };

  // Configurazione per Firebase e altre dipendenze problematiche
  config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
  
  // Blocklist per evitare conflitti di dipendenze - AGGIUNGI MODULI PROBLEMATICI
  config.resolver.blockList = [
    // Evita conflitti con Firebase
    /.*\/__tests__\/.*/,
    /.*\/node_modules\/.*\/node_modules\/react-native\/.*/,
    // Blocca moduli che usano import.meta
    /.*\/node_modules\/@expo\/metro-config\/.*\/collect-dependencies\.js$/,
    /.*\/node_modules\/babel-preset-current-node-syntax\/.*/,
  ];

  // Configurazione aggiuntiva per web
  if (process.env.EXPO_PLATFORM === 'web') {
    config.resolver.platforms = ['web', 'js', 'ts', 'tsx', 'jsx', 'json'];
  }

  return config;
})();
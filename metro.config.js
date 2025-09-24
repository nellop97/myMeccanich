// metro.config.js - CONFIGURAZIONE PULITA SENZA IMPORT.META
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

  // Configurazione transformer semplificata
  config.transformer = {
    ...config.transformer,
    // RICHIESTO PER EXPO ROUTER
    unstable_allowRequireContext: true,
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  };

  // Configurazione resolver per Firebase
  config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
  
  // Blocklist per evitare conflitti e moduli ESM con import.meta (ma non Firebase)
  config.resolver.blockList = [
    /.*\/__tests__\/.*/,
    /.*\/node_modules\/.*\/node_modules\/react-native\/.*/,
    // Escludi solo i moduli ESM specifici che utilizzano import.meta
    /node_modules\/@eslint\/eslintrc\/.*/,
    /node_modules\/@humanwhocodes\/module-importer\/.*/,
    // NON bloccare Firebase
  ];

  return config;
})();
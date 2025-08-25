// ===========================================
// metro.config.js - Aggiorna anche questo
// ===========================================
const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Aggiungi estensioni web
  config.resolver.sourceExts = [...config.resolver.sourceExts, 'web.js', 'web.jsx', 'web.ts', 'web.tsx'];

  return config;
})();

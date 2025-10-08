// metro.config.js - Versione semplificata senza transformer custom
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Estensioni file per web
config.resolver.sourceExts.push('web.js', 'web.jsx', 'web.ts', 'web.tsx');

// Resolver personalizzato
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Forza react-native-web per web
    if (platform === 'web' && moduleName === 'react-native') {
        return context.resolveRequest(context, 'react-native-web', platform);
    }

    // Log Firebase modules (opzionale, puoi rimuovere)
    if (platform === 'web' && moduleName.startsWith('firebase/')) {
        console.log(`🔥 Caricando Firebase module: ${moduleName}`);
    }

    // Default resolver
    if (originalResolveRequest) {
        return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
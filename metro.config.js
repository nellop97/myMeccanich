// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Aggiungi estensioni per web
config.resolver.sourceExts.push('web.js', 'web.jsx', 'web.ts', 'web.tsx');

// Gestisci i moduli problematici
config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Forza react-native-web per web platform
    if (platform === 'web' && moduleName === 'react-native') {
        return context.resolveRequest(
            context,
            'react-native-web',
            platform
        );
    }

    // Default resolver
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
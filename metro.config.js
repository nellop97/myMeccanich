// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Aggiungi supporto per .cjs files (necessario per alcune librerie)
config.resolver.sourceExts.push('cjs');

// Configurazione per Firebase JS SDK compatibility
config.resolver.unstable_enablePackageExports = false;

// Custom resolver per gestire moduli problematici
config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Default resolver
    return context.resolveRequest(context, moduleName, platform);
};

// Ottimizzazioni per development
if (process.env.NODE_ENV !== 'production') {
    // Disabilita lookup gerarchico per migliorare performance
    config.resolver.disableHierarchicalLookup = true;
}

// Configurazione transformer per migliorare le performance
config.transformer = {
    ...config.transformer,
    minifierConfig: {
        output: {
            ascii_only: true,
            quote_style: 3,
            wrap_iife: true,
        },
        sourceMap: {
            includeSources: false,
        },
        toplevel: false,
        compress: {
            drop_console: process.env.NODE_ENV === 'production',
        },
    },
};

module.exports = config;
// metro.config.js - Configurazione con supporto react-hook-form
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// BLOCCA COMPLETAMENTE I FILE .mjs E LA CARTELLA esm/
config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== 'mjs');

// Aggiungi estensioni per web
config.resolver.sourceExts.push('web.js', 'web.jsx', 'web.ts', 'web.tsx');

// BLOCCA LA CARTELLA esm/ di zustand
config.resolver.blockList = [
    /node_modules\/zustand\/esm\/.*/,
    /\.mjs$/,
];

// Resolver personalizzato
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Forza react-native-web per web
    if (platform === 'web' && moduleName === 'react-native') {
        return context.resolveRequest(context, 'react-native-web', platform);
    }

    // ✅ ECCEZIONE PER REACT-HOOK-FORM - Usa il resolver di default
    if (moduleName === 'react-hook-form' || moduleName.startsWith('react-hook-form/')) {
        if (originalResolveRequest) {
            return originalResolveRequest(context, moduleName, platform);
        }
        return context.resolveRequest(context, moduleName, platform);
    }

    // FORZA ZUSTAND A USARE FILE COMMONJS, NON ESM
    if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
        // Rimuovi /esm se presente
        const cleanModuleName = moduleName.replace(/\/esm\//, '/');

        try {
            return context.resolveRequest(context, cleanModuleName, platform);
        } catch (e) {
            // Fallback al default
        }
    }

    // Default resolver
    if (originalResolveRequest) {
        return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
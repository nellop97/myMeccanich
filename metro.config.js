// metro.config.js - Configurazione CORRETTA e SEMPLIFICATA per Expo 54 + Firebase
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// ✅ IMPORTANTE: NON bloccare .mjs - Firebase lo richiede!
// Aggiungi le estensioni necessarie
if (!config.resolver.sourceExts.includes('mjs')) {
    config.resolver.sourceExts.push('mjs');
}
if (!config.resolver.sourceExts.includes('cjs')) {
    config.resolver.sourceExts.push('cjs');
}

// Aggiungi estensioni per web
config.resolver.sourceExts.push('web.js', 'web.jsx', 'web.ts', 'web.tsx');

// Blocca SOLO la cartella esm di zustand se causa problemi
config.resolver.blockList = [
    /node_modules\/zustand\/esm\/.*/,
];

// Resolver personalizzato SEMPLIFICATO
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Forza react-native-web per la piattaforma web
    if (platform === 'web' && moduleName === 'react-native') {
        return context.resolveRequest(context, 'react-native-web', platform);
    }

    // Gestisci tslib esplicitamente per Firebase
    if (moduleName === 'tslib') {
        try {
            return context.resolveRequest(context, moduleName, platform);
        } catch (e) {
            console.warn('⚠️ Tentativo di risolvere tslib con percorso alternativo...');
            // Fallback: prova a risolvere dal node_modules
            try {
                const path = require('path');
                const tslibPath = path.join(context.projectRoot, 'node_modules', 'tslib', 'tslib.js');
                return {
                    type: 'sourceFile',
                    filePath: tslibPath,
                };
            } catch (e2) {
                console.error('❌ Impossibile risolvere tslib:', e2.message);
                throw e;
            }
        }
    }

    // Gestisci zustand per forzare CommonJS invece di ESM
    if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
        const cleanModuleName = moduleName.replace(/\/esm\//, '/');
        try {
            return context.resolveRequest(context, cleanModuleName, platform);
        } catch (e) {
            // Fallback al resolver di default
        }
    }

    // Usa il resolver di default
    if (originalResolveRequest) {
        return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
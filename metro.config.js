// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix per compatibilità Firebase JS SDK con Metro
// Necessario per SDK 53+ con Firebase JS SDK
config.resolver.sourceExts.push('cjs');

// Disabilita temporaneamente package exports per Firebase
// Questo risolve l'errore "Component auth has not been registered yet"
config.resolver.unstable_enablePackageExports = false;

// Aggiungi resolver per moduli problematici
config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Fix per Firebase Auth
    if (moduleName.startsWith('firebase/')) {
        try {
            return context.resolveRequest(context, moduleName, platform);
        } catch (e) {
            console.warn(`Warning resolving ${moduleName}:`, e.message);
        }
    }

    return context.resolveRequest(context, moduleName, platform);
};

// Ottimizzazioni per development
if (process.env.NODE_ENV !== 'production') {
    config.resolver.disableHierarchicalLookup = true;
}

module.exports = config;
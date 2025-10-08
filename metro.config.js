// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// ESTENSIONI FILE
config.resolver.sourceExts.push('web.js', 'web.jsx', 'web.ts', 'web.tsx');

// TRANSFORMER PERSONALIZZATO
config.transformer = {
    ...config.transformer,
    babelTransformerPath: path.resolve(__dirname, 'metro.transformer.js'),
    // Abilita supporto per sintassi moderna
    unstable_allowRequireContext: true,
    getTransformOptions: async () => ({
        transform: {
            experimentalImportSupport: false,
            inlineRequires: true,
        },
    }),
};

// RESOLVER PERSONALIZZATO
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Forza react-native-web per web
    if (platform === 'web' && moduleName === 'react-native') {
        return context.resolveRequest(
            context,
            'react-native-web',
            platform
        );
    }

    // Gestisci Firebase per web
    if (platform === 'web' && moduleName.startsWith('firebase/')) {
        console.log(`🔥 Caricando Firebase module: ${moduleName}`);
    }

    // Default resolver
    if (originalResolveRequest) {
        return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
};

// ASSET EXTS
config.resolver.assetExts.push(
    // File extensions
    'db', 'mp3', 'ttf', 'obj', 'png', 'jpg'
);

module.exports = config;
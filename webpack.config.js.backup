// webpack.config.js - Configurazione per Expo Web
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
    const config = await createExpoWebpackConfigAsync(env, argv);

    // Risolvi il problema import.meta
    config.module.rules.push({
        test: /\.m?js/,
        resolve: {
            fullySpecified: false
        }
    });

    // Aggiungi alias per evitare problemi con i moduli
    config.resolve.alias = {
        ...config.resolve.alias,
        // Forza l'uso delle versioni web dei moduli
        'react-native$': 'react-native-web',
        '@react-native-async-storage/async-storage': '@react-native-async-storage/async-storage/lib/commonjs/AsyncStorage.web.js',
    };

    // Gestisci i polyfill per Node.js
    config.resolve.fallback = {
        ...config.resolve.fallback,
        "crypto": false,
        "stream": false,
        "assert": false,
        "http": false,
        "https": false,
        "os": false,
        "url": false,
        "util": false,
    };

    // Ottimizzazioni per Firebase
    config.optimization = {
        ...config.optimization,
        sideEffects: false,
    };

    // Aggiungi supporto per import.meta
    config.module.rules.forEach(rule => {
        if (rule.oneOf) {
            rule.oneOf.forEach(loader => {
                if (loader.test && loader.test.toString().includes('js')) {
                    loader.parser = {
                        ...loader.parser,
                        importMeta: false
                    };
                }
            });
        }
    });

    return config;
};
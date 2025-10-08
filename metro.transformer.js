// metro.transformer.js - Versione minimale che DEVE funzionare

module.exports.transform = function({ src, filename, options }) {
    // Gestione import.meta per Firebase
    if (
        filename.includes('node_modules/firebase') ||
        filename.includes('node_modules/@firebase') ||
        filename.includes('node_modules/idb')
    ) {
        // Sostituisci tutti i pattern di import.meta
        src = src
            .replace(/import\.meta\.url/g, '"__METRO_POLYFILL__"')
            .replace(/import\.meta\.env/g, '({MODE:"production",DEV:false,PROD:true})')
            .replace(/import\.meta(?!\.)/g, '({url:"__METRO_POLYFILL__",env:{MODE:"production"}})');
    }

    // Usa il transformer di default di Expo
    const expoTransformer = require('@expo/metro-config/build/transformer');
    return expoTransformer.transform({ src, filename, options });
};
// metro.transformer.js - Expo 54 compatible
const upstreamTransformer = require('@expo/metro-runtime/build/transformer');

module.exports.transform = async ({ src, filename, options }) => {
    // Rimuovi o sostituisci import.meta nei file Firebase
    if (filename.includes('node_modules/firebase') ||
        filename.includes('node_modules/@firebase')) {

        // Sostituisci import.meta.url con una stringa vuota
        src = src.replace(/import\.meta\.url/g, '"firebase-polyfill-url"');

        // Sostituisci import.meta.env con un oggetto vuoto
        src = src.replace(/import\.meta\.env/g, '({})');

        // Sostituisci import.meta generico
        src = src.replace(/import\.meta/g, '({url: "firebase-polyfill-url", env: {}})');
    }

    // Passa al transformer upstream
    return upstreamTransformer.transform({ src, filename, options });
};
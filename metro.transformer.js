// metro.transformer.js - Versione migliorata per Expo 54
const upstreamTransformer = require('@expo/metro-runtime/build/transformer');

module.exports.transform = async ({ src, filename, options }) => {
    // Gestione completa di import.meta per Firebase e altre librerie
    if (
        filename.includes('node_modules/firebase') ||
        filename.includes('node_modules/@firebase') ||
        filename.includes('node_modules/idb')
    ) {
        console.log(`🔧 Trasformando: ${filename.split('node_modules/').pop()}`);

        // FASE 1: Sostituisci import.meta.url
        src = src.replace(
            /import\.meta\.url/g,
            '"__METRO_POLYFILL_URL__"'
        );

        // FASE 2: Sostituisci import.meta.env
        src = src.replace(
            /import\.meta\.env/g,
            '({MODE: "production", DEV: false, PROD: true})'
        );

        // FASE 3: Sostituisci import.meta generico
        src = src.replace(
            /import\.meta(?!\.)/g,
            '({url: "__METRO_POLYFILL_URL__", env: {MODE: "production", DEV: false, PROD: true}})'
        );

        // FASE 4: Gestione sintassi import.meta[prop]
        src = src.replace(
            /import\.meta\[(['"`])(\w+)\1\]/g,
            '({url: "__METRO_POLYFILL_URL__", env: {MODE: "production"}})["$2"]'
        );
    }

    // Passa al transformer upstream con il codice modificato
    return upstreamTransformer.transform({ src, filename, options });
};
// src/utils/firebasePolyfill.js
// Polyfill per gestire import.meta in ambienti non-module

// Aggiungi questo polyfill globale PRIMA di importare Firebase
if (typeof global !== 'undefined' && !global.import) {
    global.import = {
        meta: {
            url: 'https://localhost:8081',
            env: {
                MODE: 'development',
                DEV: true,
                PROD: false,
                SSR: false
            }
        }
    };
}

// Polyfill per window in ambiente React Native
if (typeof window !== 'undefined' && !window.import) {
    window.import = {
        meta: {
            url: window.location ? window.location.href : 'https://localhost:8081',
            env: {
                MODE: 'development',
                DEV: true,
                PROD: false,
                SSR: false
            }
        }
    };
}

// Export vuoto per renderlo un modulo
export {};
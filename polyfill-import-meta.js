// polyfill-import-meta.js - Polyfill aggressivo per import.meta

// Polyfill per Global
if (typeof global !== 'undefined') {
    if (!global.import) {
        Object.defineProperty(global, 'import', {
            value: {
                meta: {
                    url: 'https://localhost:8081',
                    env: {
                        MODE: 'production',
                        DEV: false,
                        PROD: true,
                        SSR: false,
                        BASE_URL: '/'
                    }
                }
            },
            writable: false,
            configurable: true
        });
    }
}

// Polyfill per Window
if (typeof window !== 'undefined') {
    if (!window.import) {
        Object.defineProperty(window, 'import', {
            value: {
                meta: {
                    url: window.location ? window.location.href : 'https://localhost:8081',
                    env: {
                        MODE: process.env.NODE_ENV || 'production',
                        DEV: process.env.NODE_ENV === 'development',
                        PROD: process.env.NODE_ENV === 'production',
                        SSR: false,
                        BASE_URL: '/'
                    }
                }
            },
            writable: false,
            configurable: true
        });
    }

    // Polyfill anche per globalThis
    if (!globalThis.import) {
        Object.defineProperty(globalThis, 'import', {
            value: window.import,
            writable: false,
            configurable: true
        });
    }
}

// Log per conferma
console.log('✅ Polyfill import.meta applicato con successo');

export default {};
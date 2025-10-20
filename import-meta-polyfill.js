// import-meta-polyfill.js
// Polyfill globale per import.meta (compatibilità Firebase su web)

if (typeof global !== 'undefined') {
    // Definisci import.meta nel global scope
    if (!global.import) {
        global.import = {
            meta: {
                url: 'https://localhost:8081',
                env: {
                    MODE: 'production',
                    DEV: false,
                    PROD: true,
                    SSR: false,
                    BASE_URL: '/',
                }
            }
        };
        console.log('✅ Polyfill import.meta applicato');
    }
}

// Polyfill per window (se necessario)
if (typeof window !== 'undefined') {
    if (!window.import) {
        window.import = {
            meta: {
                url: window.location.href,
                env: {
                    MODE: process.env.NODE_ENV || 'production',
                    DEV: process.env.NODE_ENV === 'development',
                    PROD: process.env.NODE_ENV === 'production',
                    SSR: false,
                    BASE_URL: '/',
                }
            }
        };
        console.log('✅ Polyfill import.meta (window) applicato');
    }
}

export default {};
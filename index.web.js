// index.web.js - Entry point per Web con Polyfill

// ============================================
// 🔥 POLYFILL IMPORT.META (PRIMA PRIORITÀ)
// ============================================
if (typeof global !== 'undefined' && !global.import) {
    global.import = {
        meta: {
            url: typeof window !== 'undefined' ? window.location.href : 'https://localhost:8081',
            env: {
                MODE: 'production',
                DEV: false,
                PROD: true,
                SSR: false,
                BASE_URL: '/',
            }
        }
    };
}

if (typeof window !== 'undefined' && !window.import) {
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
    console.log('✅ Polyfill import.meta applicato');
}

// ============================================
// IMPORT NORMALI
// ============================================
import { registerRootComponent } from 'expo';
import App from './App.web';

// Registra l'app
registerRootComponent(App);

// ============================================
// SETUP WEB SPECIFICO
// ============================================
if (typeof document !== 'undefined') {
    // Previeni zoom su mobile web
    const metaViewport = document.createElement('meta');
    metaViewport.name = 'viewport';
    metaViewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
    document.head.appendChild(metaViewport);

    // Aggiungi stili base per web
    const style = document.createElement('style');
    style.innerHTML = `
    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      overflow-x: hidden;
    }

    #root {
      display: flex;
      flex: 1;
      min-height: 100vh;
    }

    /* Previeni selezione del testo su elementi UI */
    button, 
    a, 
    [role="button"] {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }

    /* Custom scrollbar per desktop */
    @media (min-width: 768px) {
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: #f1f1f1;
      }

      ::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
    }

    /* Fix input su Safari mobile */
    input,
    textarea,
    select {
      font-size: 16px !important;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
    }

    /* Animazioni smooth */
    * {
      transition: background-color 0.3s ease;
    }

    /* Loader iniziale */
    .app-loader {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    .app-loader::after {
      content: "Caricamento...";
      font-size: 18px;
      color: #3b82f6;
      margin-top: 60px;
      position: absolute;
    }

    .app-loader::before {
      content: "";
      width: 40px;
      height: 40px;
      border: 4px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    `;
    document.head.appendChild(style);

    console.log('✅ Stili web applicati');
}
// index.web.js - Entry point per Web
import { registerRootComponent } from 'expo';

// IMPORTANTE: Usa App.web.tsx per la versione web
import App from './App.web';

// Registra l'app
registerRootComponent(App);

// Setup specifico per Web
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
    }

    .app-loader.loaded {
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
  `;
    document.head.appendChild(style);

    // Aggiungi loader iniziale
    const loader = document.createElement('div');
    loader.className = 'app-loader';
    loader.innerHTML = `
    <div style="text-align: center;">
      <div style="
        width: 50px;
        height: 50px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #2196F3;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
      "></div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
      <div style="color: #666; font-size: 16px;">Caricamento...</div>
    </div>
  `;
    document.body.appendChild(loader);

    // Rimuovi loader quando l'app è pronta
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('loaded');
            setTimeout(() => loader.remove(), 300);
        }, 500);
    });
}
// index.web.js - Entry point per Web (Semplificato)
import { registerRootComponent } from 'expo';
import App from './App.web';

// Registra l'app
registerRootComponent(App);

// Setup web
if (typeof document !== 'undefined') {
    // Previeni zoom su mobile web
    const metaViewport = document.createElement('meta');
    metaViewport.name = 'viewport';
    metaViewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
    document.head.appendChild(metaViewport);

    // Stili base
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

    button, a, [role="button"] {
      -webkit-user-select: none;
      user-select: none;
    }

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

    input, textarea, select {
      font-size: 16px !important;
      -webkit-appearance: none;
      appearance: none;
    }
    `;
    document.head.appendChild(style);
}
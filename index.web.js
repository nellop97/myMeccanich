// ===========================================
// src/index.web.js - Entry point per web
// ===========================================
import { registerRootComponent } from 'expo';
import App from './App';

// Registra l'app
registerRootComponent(App);

// Web-specific setup
if (typeof document !== 'undefined') {
  // Aggiungi meta tags per PWA
  const metaViewport = document.createElement('meta');
  metaViewport.name = 'viewport';
  metaViewport.content = 'width=device-width, initial-scale=1, maximum-scale=1';
  document.head.appendChild(metaViewport);

  // Aggiungi stili base per web
  const style = document.createElement('style');
  style.innerHTML = `
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    #root {
      display: flex;
      flex: 1;
      height: 100vh;
    }

    /* Custom scrollbar */
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

    /* Input styles */
    input[type="date"],
    input[type="file"] {
      font-size: 16px;
    }
  `;
  document.head.appendChild(style);
}
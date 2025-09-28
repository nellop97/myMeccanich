console.log('Starting app...');

import { registerRootComponent } from 'expo';

console.log('Expo imported successfully');

import App from './App';

console.log('App imported successfully');

// Registra il componente root
registerRootComponent(App);
// src/services/firebase.ts
import { initializeApp, getApp, getApps } from 'firebase/app';
import {
    initializeAuth,
    getAuth,
    getReactNativePersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    inMemoryPersistence,
    Auth
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, Storage } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configurazione Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBH6F0JOVh8X-X41h2xN7cXxNEZnmY2nMk",
    authDomain: "mymecanich.firebaseapp.com",
    projectId: "mymecanich",
    storageBucket: "mymecanich.firebasestorage.app",
    messagingSenderId: "619020396283",
    appId: "1:619020396283:web:2f97f5f3e5e5dc5105b25e",
    measurementId: "G-7K1E9X8RLN"
};

// Flag per determinare l'ambiente
export const isWeb = Platform.OS === 'web';

// Singleton per Firebase App
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

// Auth con configurazione persistenza corretta per SDK 54
let auth: Auth;

if (!isWeb) {
    // Per React Native, usa initializeAuth con AsyncStorage
    try {
        auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage),
            // Aggiungi timeout per evitare hanging
            popupRedirectResolver: undefined,
        });
    } catch (error) {
        // Se auth è già inizializzato, usa getAuth
        if (error.code === 'auth/already-initialized') {
            auth = getAuth(app);
        } else {
            console.error('Errore inizializzazione auth:', error);
            // Fallback a getAuth standard
            auth = getAuth(app);
        }
    }
} else {
    // Per Web, usa getAuth standard con persistenza browser
    auth = getAuth(app);
    // Imposta persistenza per web
    auth.setPersistence(browserLocalPersistence).catch((error) => {
        console.warn('Errore impostazione persistenza web:', error);
    });
}

// Firestore e Storage
const db: Firestore = getFirestore(app);
const storage: Storage = getStorage(app);

// Configurazione per development
if (__DEV__) {
    // Abilita logging dettagliato in development
    console.log('Firebase initialized with config:', {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        platform: Platform.OS,
        persistenceEnabled: !isWeb
    });
}

// Helper per gestire errori di autenticazione
export const handleAuthError = (error: any): string => {
    console.error('Auth error:', error);

    // Gestione specifica per errori SDK 54
    if (error.code === 'auth/network-request-failed') {
        return 'Errore di connessione. Verifica la tua connessione internet.';
    }

    switch (error.code) {
        case 'auth/email-already-in-use':
            return 'Email già registrata';
        case 'auth/invalid-email':
            return 'Email non valida';
        case 'auth/weak-password':
            return 'Password troppo debole (minimo 6 caratteri)';
        case 'auth/user-not-found':
            return 'Utente non trovato';
        case 'auth/wrong-password':
            return 'Password errata';
        case 'auth/too-many-requests':
            return 'Troppi tentativi. Riprova più tardi';
        case 'auth/invalid-credential':
            return 'Credenziali non valide';
        default:
            return error.message || 'Errore durante l\'autenticazione';
    }
};

// Esporta istanze singleton
export { app, auth, db, storage };

// Esporta tipi per TypeScript
export type { Auth, Firestore, Storage };
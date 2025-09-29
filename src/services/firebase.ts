// src/services/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    initializeAuth,
    getAuth,
    getReactNativePersistence,
    browserLocalPersistence,
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

// Inizializza o ottieni l'app esistente
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

// Inizializzazione Auth con gestione corretta per SDK 54
let auth: Auth;

try {
    // Prova prima a ottenere l'auth esistente
    auth = getAuth(app);

    // Se siamo su mobile e l'auth non ha persistenza, reinizializza
    if (!isWeb && !auth.currentUser) {
        try {
            // Prova a inizializzare con AsyncStorage persistence
            auth = initializeAuth(app, {
                persistence: getReactNativePersistence(AsyncStorage)
            });
            console.log('✅ Auth inizializzato con AsyncStorage persistence');
        } catch (initError: any) {
            // Se già inizializzato, usa quello esistente
            if (initError.code === 'auth/already-initialized') {
                auth = getAuth(app);
                console.log('ℹ️ Auth già inizializzato, usando istanza esistente');
            } else {
                throw initError;
            }
        }
    }
} catch (error: any) {
    console.error('Errore durante inizializzazione auth:', error);

    // Fallback: prova a inizializzare auth in modo diverso
    if (!isWeb) {
        try {
            // Per mobile, usa initializeAuth con persistenza
            auth = initializeAuth(app, {
                persistence: getReactNativePersistence(AsyncStorage)
            });
        } catch (fallbackError: any) {
            // Se anche questo fallisce, usa getAuth standard
            auth = getAuth(app);
            console.warn('⚠️ Usando auth senza persistenza AsyncStorage');
        }
    } else {
        // Per web, usa getAuth standard
        auth = getAuth(app);
        // Imposta persistenza per web
        auth.setPersistence(browserLocalPersistence).catch((error) => {
            console.warn('Errore impostazione persistenza web:', error);
        });
    }
}

// Firestore e Storage
const db: Firestore = getFirestore(app);
const storage: Storage = getStorage(app);

// Configurazione per development
if (__DEV__) {
    console.log('🔥 Firebase initialized:', {
        projectId: firebaseConfig.projectId,
        platform: Platform.OS,
        authInitialized: !!auth,
        firestoreInitialized: !!db,
        storageInitialized: !!storage,
        persistenceEnabled: !isWeb
    });
}

// Helper per gestire errori di autenticazione
export const handleAuthError = (error: any): string => {
    console.error('Auth error:', error);

    const errorMessages: { [key: string]: string } = {
        'auth/network-request-failed': 'Errore di connessione. Verifica la tua connessione internet.',
        'auth/email-already-in-use': 'Email già registrata. Prova ad accedere.',
        'auth/invalid-email': 'Email non valida.',
        'auth/operation-not-allowed': 'Operazione non permessa.',
        'auth/weak-password': 'Password troppo debole. Usa almeno 6 caratteri.',
        'auth/user-disabled': 'Account disabilitato. Contatta il supporto.',
        'auth/user-not-found': 'Utente non trovato.',
        'auth/wrong-password': 'Password errata.',
        'auth/invalid-credential': 'Credenziali non valide.',
        'auth/too-many-requests': 'Troppi tentativi. Riprova più tardi.',
        'auth/requires-recent-login': 'Devi riautenticarti per questa operazione.',
        'auth/already-initialized': 'Auth già inizializzato.',
    };

    return errorMessages[error.code] || `Errore: ${error.message}`;
};

// Utility per verificare lo stato di Firebase
export const isFirebaseReady = (): boolean => {
    return !!auth && !!db && !!storage;
};

// Export principali
export { auth, db, storage, app };

// Export di tipi utili
export type { Auth, Firestore, Storage } from 'firebase/auth';
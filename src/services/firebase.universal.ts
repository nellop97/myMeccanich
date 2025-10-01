// src/services/firebase.universal.ts
import { Platform } from 'react-native';

// Polyfill per import.meta se necessario
if (typeof global !== 'undefined' && !global.import) {
    (global as any).import = {
        meta: {
            url: 'https://localhost:8081',
            env: { MODE: 'development', DEV: true, PROD: false, SSR: false }
        }
    };
}

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

// Variabili per i servizi
let auth: any = null;
let db: any = null;
let storage: any = null;
let app: any = null;
let isInitialized = false;

// Funzione di inizializzazione
export async function initializeFirebase() {
    if (isInitialized) {
        return { auth, db, storage, app };
    }

    try {
        // Usa require per evitare problemi con import dinamici
        const firebaseApp = require('firebase/app');
        const firebaseAuth = require('firebase/auth');
        const firebaseFirestore = require('firebase/firestore');
        const firebaseStorage = require('firebase/storage');

        // Inizializza app
        if (!firebaseApp.getApps().length) {
            app = firebaseApp.initializeApp(firebaseConfig);
        } else {
            app = firebaseApp.getApps()[0];
        }

        // Inizializza servizi
        if (Platform.OS === 'web') {
            // Web: usa getAuth standard
            auth = firebaseAuth.getAuth(app);

            // Imposta persistenza browser
            try {
                await firebaseAuth.setPersistence(auth, firebaseAuth.browserLocalPersistence);
            } catch (e) {
                console.warn('Persistenza non impostata:', e);
            }
        } else {
            // Mobile: prova con AsyncStorage
            try {
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;

                // Prova prima getAuth per vedere se già inizializzato
                try {
                    auth = firebaseAuth.getAuth(app);
                } catch {
                    // Se fallisce, usa initializeAuth
                    auth = firebaseAuth.initializeAuth(app, {
                        persistence: firebaseAuth.getReactNativePersistence(AsyncStorage)
                    });
                }
            } catch (e) {
                // Fallback a getAuth standard
                auth = firebaseAuth.getAuth(app);
                console.warn('AsyncStorage non disponibile:', e);
            }
        }

        // Inizializza Firestore e Storage
        db = firebaseFirestore.getFirestore(app);
        storage = firebaseStorage.getStorage(app);

        isInitialized = true;
        console.log(`✅ Firebase inizializzato per ${Platform.OS}`);

        return { auth, db, storage, app };
    } catch (error) {
        console.error('❌ Errore inizializzazione Firebase:', error);
        throw error;
    }
}

// Getter per i servizi (con inizializzazione lazy)
export function getAuth() {
    if (!auth) {
        console.warn('Auth non inizializzato, provo a inizializzare...');
        initializeFirebase();
    }
    return auth;
}

export function getDb() {
    if (!db) {
        console.warn('DB non inizializzato, provo a inizializzare...');
        initializeFirebase();
    }
    return db;
}

export function getStorage() {
    if (!storage) {
        console.warn('Storage non inizializzato, provo a inizializzare...');
        initializeFirebase();
    }
    return storage;
}

// Helper per errori
export const handleAuthError = (error: any): string => {
    const errorMessages: { [key: string]: string } = {
        'auth/network-request-failed': 'Errore di connessione. Verifica la tua connessione internet.',
        'auth/email-already-in-use': 'Email già registrata.',
        'auth/invalid-email': 'Email non valida.',
        'auth/weak-password': 'Password troppo debole (min. 6 caratteri).',
        'auth/user-not-found': 'Utente non trovato.',
        'auth/wrong-password': 'Password errata.',
        'auth/too-many-requests': 'Troppi tentativi. Riprova più tardi.',
        'auth/popup-blocked': 'Popup bloccato. Abilita i popup per questo sito.',
        'auth/invalid-credential': 'Credenziali non valide.',
    };

    return errorMessages[error?.code] || error?.message || 'Errore sconosciuto';
};

// Export per compatibilità
export { auth, db, storage, app };
export const isWeb = Platform.OS === 'web';
export default { initializeFirebase, getAuth, getDb, getStorage, handleAuthError };
// src/services/firebase.ts - Sistema Firebase senza import.meta
import { Platform } from 'react-native';

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
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;
let initialized = false;

// Flag per ambiente
export const isWeb = Platform.OS === 'web';
export const isMobile = !isWeb;

// Funzione di inizializzazione lazy
async function ensureInitialized() {
    if (initialized) return;

    try {
        // Import dinamici per evitare problemi con import.meta
        const firebaseApp = await import('firebase/app');
        const firebaseAuth = await import('firebase/auth');
        const firebaseFirestore = await import('firebase/firestore');
        const firebaseStorage = await import('firebase/storage');

        // Inizializza app
        if (!firebaseApp.getApps().length) {
            app = firebaseApp.initializeApp(firebaseConfig);
        } else {
            app = firebaseApp.getApps()[0];
        }

        // Inizializza Auth
        if (isWeb) {
            auth = firebaseAuth.getAuth(app);
            // Imposta persistenza browser
            try {
                await firebaseAuth.setPersistence(auth, firebaseAuth.browserLocalPersistence);
            } catch (e) {
                console.warn('Persistenza browser non impostata:', e);
            }
        } else {
            // Mobile
            try {
                // Prova prima getAuth
                auth = firebaseAuth.getAuth(app);
            } catch {
                // Se fallisce, prova con initializeAuth e AsyncStorage
                try {
                    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
                    const persistence = firebaseAuth.getReactNativePersistence(AsyncStorage);
                    auth = firebaseAuth.initializeAuth(app, { persistence });
                    console.log('✅ Auth mobile con AsyncStorage');
                } catch (err) {
                    // Fallback
                    auth = firebaseAuth.getAuth(app);
                    console.warn('⚠️ Auth mobile senza persistenza');
                }
            }
        }

        // Inizializza Firestore e Storage
        db = firebaseFirestore.getFirestore(app);
        storage = firebaseStorage.getStorage(app);

        initialized = true;
        console.log(`✅ Firebase inizializzato per ${Platform.OS}`);

    } catch (error) {
        console.error('❌ Errore inizializzazione Firebase:', error);
        throw error;
    }
}

// Proxy per auth che assicura inizializzazione
export const getAuth = () => {
    if (!auth) {
        console.warn('Auth non ancora inizializzato');
    }
    return auth;
};

// Proxy per db che assicura inizializzazione
export const getDb = () => {
    if (!db) {
        console.warn('DB non ancora inizializzato');
    }
    return db;
};

// Proxy per storage che assicura inizializzazione
export const getStorage = () => {
    if (!storage) {
        console.warn('Storage non ancora inizializzato');
    }
    return storage;
};

// Helper per gestire errori di autenticazione
export const handleAuthError = (error: any): string => {
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
        'auth/popup-blocked': 'Popup bloccato dal browser. Abilita i popup per questo sito.',
        'auth/popup-closed-by-user': 'Accesso annullato.',
        'auth/account-exists-with-different-credential': 'Un account esiste già con la stessa email.',
        'auth/too-many-requests': 'Troppi tentativi. Riprova più tardi.',
        'auth/requires-recent-login': 'Devi riautenticarti per questa operazione.',
    };

    return errorMessages[error?.code] || error?.message || 'Errore sconosciuto';
};

// Alias per retrocompatibilità
export const getFirebaseErrorMessage = handleAuthError;

// Utility per verificare lo stato di Firebase
export const isFirebaseReady = (): boolean => {
    return initialized && !!auth && !!db && !!storage;
};

// Inizializza Firebase quando il modulo viene importato
if (typeof window !== 'undefined' || typeof global !== 'undefined') {
    ensureInitialized().catch(console.error);
}

// Export con getter per lazy initialization
Object.defineProperty(exports, 'auth', {
    get: function() {
        return getAuth();
    }
});

Object.defineProperty(exports, 'db', {
    get: function() {
        return getDb();
    }
});

Object.defineProperty(exports, 'storage', {
    get: function() {
        return getStorage();
    }
});

// Export anche la funzione di inizializzazione
export { ensureInitialized };

// Export default per compatibilità
export default {
    auth: getAuth(),
    db: getDb(),
    storage: getStorage(),
    ensureInitialized,
    isFirebaseReady,
    handleAuthError,
};
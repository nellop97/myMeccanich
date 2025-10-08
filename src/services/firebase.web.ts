// src/services/firebase.web.ts - Versione ottimizzata per Web
// Usa require invece di import per evitare problemi con import.meta

let app: any;
let auth: any;
let db: any;
let storage: any;
let initialized = false;

// Configurazione Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC-AmP6d3a_VVXJnCWVHB1WmU_wPHF0ISI",
    authDomain: "mymecanich.firebaseapp.com",
    projectId: "mymecanich",
    storageBucket: "mymecanich.firebasestorage.app",
    messagingSenderId: "619020396283",
    appId: "1:619020396283:web:883f0ca48dce8c4d05b25e"
};

/**
 * Inizializza Firebase per Web
 * Usa require per evitare problemi con import.meta
 */
function initializeFirebaseWeb() {
    if (initialized) {
        return { app, auth, db, storage };
    }

    try {
        // Usa require per caricare Firebase
        const firebaseApp = require('firebase/app');
        const firebaseAuth = require('firebase/auth');
        const firebaseFirestore = require('firebase/firestore');
        const firebaseStorage = require('firebase/storage');

        // Inizializza app
        if (!firebaseApp.getApps().length) {
            app = firebaseApp.initializeApp(firebaseConfig);
            console.log('🔥 Firebase Web App inizializzata');
        } else {
            app = firebaseApp.getApps()[0];
            console.log('🔥 Firebase Web App esistente recuperata');
        }

        // Inizializza servizi
        auth = firebaseAuth.getAuth(app);
        db = firebaseFirestore.getFirestore(app);
        storage = firebaseStorage.getStorage(app);

        // Imposta persistenza per web
        firebaseAuth.setPersistence(auth, firebaseAuth.browserLocalPersistence)
            .then(() => {
                console.log('✅ Persistenza browser impostata');
            })
            .catch((error: any) => {
                console.warn('⚠️ Errore impostazione persistenza:', error);
            });

        initialized = true;
        console.log('✅ Firebase Web completamente inizializzato');

        return { app, auth, db, storage };
    } catch (error) {
        console.error('❌ Errore inizializzazione Firebase Web:', error);
        throw error;
    }
}

// Inizializza immediatamente
initializeFirebaseWeb();

// Helper per gestire errori auth
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
export const isWeb = true;
export default { auth, db, storage, app, handleAuthError };
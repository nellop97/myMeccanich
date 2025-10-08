// src/services/firebase.ts - Firebase 10.x per tutte le piattaforme
import { Platform } from 'react-native';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Configurazione Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC-AmP6d3a_VVXJnCWVHB1WmU_wPHF0ISI",
    authDomain: "mymecanich.firebaseapp.com",
    projectId: "mymecanich",
    storageBucket: "mymecanich.firebasestorage.app",
    messagingSenderId: "619020396283",
    appId: "1:619020396283:web:883f0ca48dce8c4d05b25e"
};

// Variabili globali
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// Inizializzazione
try {
    // Inizializza o recupera app esistente
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
        console.log('🔥 Firebase App inizializzata');
    } else {
        app = getApp();
        console.log('🔥 Firebase App esistente recuperata');
    }

    // Inizializza Auth (Firebase 10.x gestisce automaticamente la persistenza)
    auth = getAuth(app);
    console.log(`🔥 Firebase Auth inizializzato per ${Platform.OS}`);

    // Inizializza Firestore e Storage
    db = getFirestore(app);
    storage = getStorage(app);

    console.log(`✅ Firebase completamente inizializzato per ${Platform.OS}`);
} catch (error) {
    console.error('❌ Errore inizializzazione Firebase:', error);
    throw error;
}

// Helper per verificare se Firebase è pronto
export const isFirebaseReady = (): boolean => {
    return !!auth && !!db && !!storage;
};

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

// Export
export { app, auth, db, storage };
export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS !== 'web';

export default { app, auth, db, storage, isFirebaseReady, handleAuthError, isWeb, isMobile };
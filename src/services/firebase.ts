import { Platform } from 'react-native';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
    getAuth,
    Auth,
    initializeAuth,
    getReactNativePersistence
} from 'firebase/auth';
import {
    getFirestore,
    Firestore
} from 'firebase/firestore';

// Configurazione Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC-AmP6d3a_VVXJnCWVHB1WmU_wPHF0ISI",
    authDomain: "mymecanich.firebaseapp.com",
    projectId: "mymecanich",
    storageBucket: "mymecanich.firebasestorage.app",
    messagingSenderId: "619020396283",
    appId: "1:619020396283:web:883f0ca48dce8c4d05b25e"
};

// Variabili per l'esportazione
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
    // Inizializza Firebase App
    app = initializeApp(firebaseConfig);

    // Inizializza Firestore
    db = getFirestore(app);

    // Inizializza Auth con gestione persistenza per mobile
    if (Platform.OS !== 'web') {
        // Mobile: usa persistenza con AsyncStorage
        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            auth = initializeAuth(app, {
                persistence: getReactNativePersistence(AsyncStorage)
            });
            console.log('🔥 Firebase Mobile con persistenza inizializzato');
        } catch (error) {
            console.warn('⚠️ AsyncStorage non disponibile, usando auth standard');
            auth = getAuth(app);
        }
    } else {
        // Web: auth standard con persistenza browser
        auth = getAuth(app);
        console.log('🔥 Firebase Web inizializzato');
    }

    console.log('✅ Firebase inizializzato con successo per', Platform.OS);

} catch (error) {
    console.error('❌ Errore inizializzazione Firebase:', error);
    throw error;
}

// Helper per gestire errori Firebase
export const getFirebaseErrorMessage = (error: any): string => {
    const errorCode = error?.code || '';

    const errorMessages: Record<string, string> = {
        'auth/user-not-found': 'Utente non trovato',
        'auth/wrong-password': 'Password non corretta',
        'auth/invalid-email': 'Email non valida',
        'auth/email-already-in-use': 'Questa email è già registrata',
        'auth/weak-password': 'La password è troppo debole (minimo 6 caratteri)',
        'auth/user-disabled': 'Account disabilitato',
        'auth/invalid-credential': 'Credenziali non valide',
        'auth/network-request-failed': 'Errore di connessione. Verifica la tua connessione internet.',
        'auth/too-many-requests': 'Troppi tentativi. Riprova più tardi.',
        'auth/operation-not-allowed': 'Operazione non consentita',
        'auth/popup-closed-by-user': 'Accesso annullato dall\'utente',
        'auth/popup-blocked': 'Popup bloccato dal browser',
    };

    return errorMessages[errorCode] || `Errore: ${error.message || 'Errore sconosciuto'}`;
};

// Utility exports
export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS !== 'web';

// Main exports
export { app, auth, db };
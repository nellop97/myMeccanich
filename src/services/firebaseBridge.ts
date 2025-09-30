// src/services/firebaseBridge.ts - Bridge per compatibilità cross-platform
import { Platform } from 'react-native';

// Tipo per i servizi Firebase
interface FirebaseServices {
    auth: any;
    db: any;
    storage: any;
    isWeb: boolean;
    handleAuthError: (error: any) => string;
}

// Cache per i servizi
let cachedServices: FirebaseServices | null = null;

/**
 * Ottieni i servizi Firebase in modo cross-platform
 * Usa import dinamici per evitare problemi di bundling
 */
export async function getFirebaseServices(): Promise<FirebaseServices> {
    // Se già in cache, ritorna subito
    if (cachedServices) {
        return cachedServices;
    }

    try {
        if (Platform.OS === 'web') {
            // Web: import dinamico del modulo web
            const firebaseWeb = await import('./firebase.web');
            cachedServices = {
                auth: firebaseWeb.auth,
                db: firebaseWeb.db,
                storage: firebaseWeb.storage,
                isWeb: true,
                handleAuthError: firebaseWeb.handleAuthError,
            };
        } else {
            // Mobile: import del modulo standard
            const firebaseMobile = await import('./firebase');
            cachedServices = {
                auth: firebaseMobile.auth,
                db: firebaseMobile.db,
                storage: firebaseMobile.storage,
                isWeb: false,
                handleAuthError: firebaseMobile.handleAuthError,
            };
        }

        console.log(`✅ Firebase Bridge inizializzato per ${Platform.OS}`);
        return cachedServices;
    } catch (error) {
        console.error('❌ Errore in Firebase Bridge:', error);
        throw error;
    }
}

/**
 * Hook React per usare Firebase con gestione asincrona
 */
import { useState, useEffect } from 'react';

export function useFirebase() {
    const [services, setServices] = useState<FirebaseServices | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        getFirebaseServices()
            .then(setServices)
            .catch(setError)
            .finally(() => setLoading(false));
    }, []);

    return {
        ...services,
        loading,
        error
    };
}

/**
 * Wrapper per componenti che richiedono Firebase
 */
import React, { createContext, useContext, ReactNode } from 'react';

const FirebaseContext = createContext<FirebaseServices | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
    const [services, setServices] = useState<FirebaseServices | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getFirebaseServices()
            .then(setServices)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return null; // O un componente di loading
    }

    return (
        <FirebaseContext.Provider value={services}>
            {children}
            </FirebaseContext.Provider>
    );
}

export function useFirebaseContext() {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error('useFirebaseContext deve essere usato dentro FirebaseProvider');
    }
    return context;
}
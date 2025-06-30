// src/hooks/useAuthSync.ts
import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useStore } from '../store';

/**
 * Hook per sincronizzare lo stato di autenticazione Firebase con lo store Zustand
 * Questo hook deve essere utilizzato nel componente principale dell'app (App.tsx o AppNavigator)
 * per garantire che i dati siano sempre sincronizzati
 */
export const useAuthSync = () => {
    const { user: authUser, loading: authLoading, initializing } = useAuth();
    const { user: storeUser, setUser, setLoading } = useStore();

    useEffect(() => {
        console.log('🔄 Auth Sync - Auth User:', authUser ? {
            uid: authUser.uid,
            email: authUser.email,
            displayName: authUser.displayName,
            firstName: authUser.firstName,
            lastName: authUser.lastName,
            userType: authUser.userType
        } : null);

        console.log('🔄 Auth Sync - Store User:', storeUser ? {
            id: storeUser.id,
            name: storeUser.name,
            email: storeUser.email,
            isLoggedIn: storeUser.isLoggedIn
        } : null);

        if (!initializing) {
            if (authUser) {
                // Costruisci il nome dell'utente con fallback multipli
                const userName = buildUserDisplayName(authUser);

                // Sincronizza i dati Firebase con lo store Zustand
                const syncedUser = {
                    id: authUser.uid,
                    name: userName,
                    email: authUser.email || '',
                    isLoggedIn: true,
                    photoURL: authUser.photoURL,
                    isMechanic: authUser.userType === 'mechanic',
                    phoneNumber: authUser.phoneNumber,
                    emailVerified: authUser.emailVerified,
                    createdAt: authUser.createdAt,
                    lastLoginAt: authUser.lastLoginAt,
                    // Dati specifici per meccanici
                    workshopName: authUser.workshopName,
                    workshopAddress: authUser.address,
                    vatNumber: authUser.vatNumber,
                };

                console.log('✅ Auth Sync - Syncing user to store:', {
                    name: syncedUser.name,
                    email: syncedUser.email,
                    isLoggedIn: syncedUser.isLoggedIn
                });

                setUser(syncedUser);
            } else {
                console.log('❌ Auth Sync - No auth user, clearing store');
                setUser(null);
            }

            setLoading(authLoading);
        }
    }, [authUser, initializing, authLoading, setUser, setLoading]);

    return {
        user: storeUser,
        authUser,
        loading: authLoading || initializing,
        isAuthenticated: !!authUser && !!storeUser?.isLoggedIn,
        isInitializing: initializing
    };
};

/**
 * Funzione helper per costruire il nome visualizzato dell'utente
 * con fallback multipli per gestire diversi scenari di registrazione
 */
export const buildUserDisplayName = (authUser: any): string => {
    // Priorità:
    // 1. displayName (da Firebase Auth)
    // 2. firstName + lastName (da Firestore)
    // 3. firstName solo (da Firestore)
    // 4. Parte locale dell'email
    // 5. "Utente" come fallback

    if (authUser.displayName?.trim()) {
        return authUser.displayName.trim();
    }

    if (authUser.firstName?.trim() && authUser.lastName?.trim()) {
        return `${authUser.firstName.trim()} ${authUser.lastName.trim()}`;
    }

    if (authUser.firstName?.trim()) {
        return authUser.firstName.trim();
    }

    if (authUser.email) {
        const emailLocal = authUser.email.split('@')[0];
        // Capitalizza la prima lettera e rendi più leggibile
        return emailLocal.charAt(0).toUpperCase() + emailLocal.slice(1);
    }

    return 'Utente';
};

/**
 * Hook semplificato per ottenere i dati utente sincronizzati
 * Utilizza questo negli altri componenti invece di useStore direttamente
 */
export const useUser = () => {
    const { user, authUser, loading, isAuthenticated } = useAuthSync();

    return {
        user,
        authUser,
        loading,
        isAuthenticated,
        displayName: user?.name || buildUserDisplayName(authUser) || 'Utente'
    };
};

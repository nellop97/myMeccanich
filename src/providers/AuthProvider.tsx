// src/providers/AuthProvider.tsx
import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useStore } from '../store';
import { buildUserDisplayName } from '../hooks/useAuthSync';

interface AuthProviderProps {
    children: React.ReactNode;
}

/**
 * Provider che gestisce la sincronizzazione globale tra Firebase Auth e Store Zustand
 * Deve essere inserito nel punto più alto dell'app per garantire che la sincronizzazione
 * avvenga sempre, indipendentemente da quale componente è attualmente renderizzato
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const { user: authUser, loading: authLoading, initializing } = useAuth();
    const { setUser, setLoading } = useStore();

    useEffect(() => {
        console.log('🌍 Global Auth Sync - Initializing:', initializing);
        console.log('🌍 Global Auth Sync - Auth User:', authUser ? {
            uid: authUser.uid,
            email: authUser.email,
            displayName: authUser.displayName,
            firstName: authUser.firstName,
            lastName: authUser.lastName,
            userType: authUser.userType
        } : null);

        if (!initializing) {
            if (authUser) {
                // Costruisci il nome dell'utente
                const userName = buildUserDisplayName(authUser);

                // Sincronizza i dati Firebase con lo store Zustand
                const syncedUser = {
                    id: authUser.uid,
                    name: userName,
                    email: authUser.email || '',
                    isLoggedIn: true,
                    photoURL: authUser.photoURL || undefined,
                    isMechanic: authUser.userType === 'mechanic',
                    phoneNumber: authUser.phoneNumber || undefined,
                    emailVerified: authUser.emailVerified,
                    createdAt: authUser.createdAt,
                    lastLoginAt: authUser.lastLoginAt,
                    // Dati specifici per meccanici
                    workshopName: authUser.workshopName,
                    workshopAddress: authUser.address,
                    vatNumber: authUser.vatNumber,
                };

                console.log('✅ Global Auth Sync - Syncing user to store:', {
                    id: syncedUser.id,
                    name: syncedUser.name,
                    email: syncedUser.email,
                    isLoggedIn: syncedUser.isLoggedIn,
                    isMechanic: syncedUser.isMechanic
                });

                setUser(syncedUser);
            } else {
                console.log('❌ Global Auth Sync - No auth user, clearing store');
                setUser(null);
            }

            setLoading(authLoading);
        } else {
            setLoading(true);
        }
    }, [authUser, initializing, authLoading, setUser, setLoading]);

    // Non renderizza nulla, solo gestisce la sincronizzazione
    return <>{children}</>;
};

// Hook semplificato per uso nei componenti
export const useCurrentUser = () => {
    const { user } = useStore();
    const { user: authUser } = useAuth();

    return {
        user,
        authUser,
        isAuthenticated: !!user?.isLoggedIn,
        displayName: user?.name || buildUserDisplayName(authUser) || 'Utente'
    };
};

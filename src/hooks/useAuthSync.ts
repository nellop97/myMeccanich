// src/hooks/useAuthSync.ts
import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useStore } from '../store';
import { useWorkshopStore } from '../store/workshopStore';
import { useInvoicingStore } from '../store/invoicingStore';
import { buildUserDisplayName } from '../utils/authUtils';

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
            name: authUser.name,
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
                    photoURL: authUser.photoURL || undefined,
                    isMechanic: authUser.userType === 'mechanic',
                    phoneNumber: authUser.phoneNumber || undefined,
                    emailVerified: authUser.emailVerified || false,
                    createdAt: authUser.createdAt || undefined,
                    lastLoginAt: authUser.lastLoginAt || undefined,
                    // Dati specifici per meccanici (solo se presenti)
                    workshopName: authUser.workshopName || authUser.workshopInfo?.name || undefined,
                    workshopAddress: authUser.address || authUser.workshopInfo?.address || undefined,
                    vatNumber: authUser.vatNumber || authUser.workshopInfo?.vatNumber || undefined,
                };

                console.log('✅ Auth Sync - Syncing user to store:', {
                    name: syncedUser.name,
                    email: syncedUser.email,
                    isLoggedIn: syncedUser.isLoggedIn,
                    isMechanic: syncedUser.isMechanic
                });

                setUser(syncedUser);
            } else {
                console.log('❌ Auth Sync - No auth user, clearing store');
                setUser(null);
                // Le schermate meccanico escono con signOut di useAuth, senza passare da useLogout
                useInvoicingStore.getState().resetStore();
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
 * Hook per gestire il logout completo
 * Pulisce Firebase, store principale, workshopStore e invoicingStore
 */
export const useLogout = () => {
    const { signOut: firebaseSignOut } = useAuth();
    const { logout: storeLogout } = useStore();
    const { reset: resetWorkshopStore } = useWorkshopStore();

    const logout = async () => {
        console.log('🚪 Executing full logout...');
        try {
            // 1. Logout da Firebase
            console.log('🔥 Signing out from Firebase...');
            await firebaseSignOut();

            // 2. Pulisci lo store principale
            console.log('🗑️ Clearing main store...');
            storeLogout();

            // 3. Pulisci workshopStore
            console.log('🗑️ Clearing workshop store...');
            resetWorkshopStore();

            // 4. Pulisci invoicingStore
            console.log('🗑️ Clearing invoicing store...');
            useInvoicingStore.getState().resetStore();

            console.log('✅ Logout completed successfully');
            return true;
        } catch (error) {
            console.error('❌ Error during logout:', error);
            throw error;
        }
    };

    return { logout };
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
        displayName: user?.name || (authUser ? buildUserDisplayName(authUser) : 'Utente')
    };
};
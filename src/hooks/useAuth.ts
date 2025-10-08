// src/hooks/useAuth.ts - Hook autenticazione corretto
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../services/firebase';

export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    userType?: 'user' | 'mechanic';
    isLoggedIn: boolean;
    isMechanic: boolean;
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [initializing, setInitializing] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!auth) {
            console.warn('⚠️ Firebase auth not available');
            setInitializing(false);
            return;
        }

        console.log('🔐 Setting up auth state listener...');

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            console.log('👤 Auth state changed:', firebaseUser?.uid ? `User: ${firebaseUser.uid}` : 'No user');

            if (firebaseUser) {
                // Utente autenticato
                const userData: User = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    userType: 'user', // Default, da aggiornare con dati dal database
                    isLoggedIn: true,
                    isMechanic: false // Default, da aggiornare con dati dal database
                };
                setUser(userData);
            } else {
                // Utente non autenticato
                setUser(null);
            }

            if (initializing) {
                setInitializing(false);
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [initializing]);

    // Sign out function
    const signOut = async () => {
        try {
            setLoading(true);
            await firebaseSignOut(auth);
            setUser(null);
        } catch (error) {
            console.error('❌ Error signing out:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        user,
        initializing,
        loading,
        signOut
    };
}
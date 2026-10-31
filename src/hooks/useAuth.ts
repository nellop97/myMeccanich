// src/hooks/useAuth.ts - CON LETTURA FIRESTORE PER USERTYPE
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, type DocumentData } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    name?: string;
    firstName?: string;
    lastName?: string;
    photoURL?: string | null;
    phoneNumber?: string | null;
    emailVerified: boolean;
    userType?: 'user' | 'mechanic';
    role?: 'owner' | 'mechanic';
    isMechanic: boolean;
    workshopName?: string;
    workshopInfo?: {
        name?: string;
        address?: string;
        vatNumber?: string;
    };
    address?: string;
    vatNumber?: string;
    rating?: number;
    reviewsCount?: number;
    verified?: boolean;
    createdAt?: any;
    lastLoginAt?: any;
}

// Combina dati Firebase Auth con il documento Firestore dell'utente
const buildAuthUser = (firebaseUser: FirebaseUser, userData: DocumentData): AuthUser => ({
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    // Il profilo salva il nome solo su Firestore: Firebase Auth resta come riserva
    displayName: userData.displayName || firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    phoneNumber: firebaseUser.phoneNumber,
    emailVerified: firebaseUser.emailVerified,
    // Dati da Firestore
    name: userData.name || firebaseUser.displayName,
    firstName: userData.firstName,
    lastName: userData.lastName,
    userType: userData.userType, // 'user' o 'mechanic'
    role: userData.role, // 'owner' o 'mechanic'
    isMechanic: userData.userType === 'mechanic' || userData.role === 'mechanic',
    workshopName: userData.workshopName,
    address: userData.address,
    vatNumber: userData.vatNumber,
    workshopInfo: userData.workshopName ? {
        name: userData.workshopName,
        address: userData.address,
        vatNumber: userData.vatNumber,
    } : undefined,
    rating: userData.rating,
    reviewsCount: userData.reviewsCount,
    verified: userData.verified,
    createdAt: userData.createdAt,
    lastLoginAt: userData.lastLoginAt,
});

// Ogni istanza di useAuth ha il proprio stato: qui si registra per ricevere gli aggiornamenti
const authUserListeners = new Set<(user: AuthUser) => void>();

/**
 * Rilegge il documento utente e aggiorna tutte le istanze di useAuth.
 * Da chiamare dopo aver modificato users/{uid}. Un errore di lettura non
 * tocca i dati in memoria: il salvataggio che l'ha preceduta resta valido.
 */
export const refreshAuthUser = async (): Promise<void> => {
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser) return;

    try {
        const userDocSnap = await getDoc(doc(db, 'users', firebaseUser.uid));

        // L'utente puo aver fatto logout durante la lettura
        if (!userDocSnap.exists() || auth.currentUser?.uid !== firebaseUser.uid) return;

        const updatedUser = buildAuthUser(firebaseUser, userDocSnap.data());
        authUserListeners.forEach((listener) => listener(updatedUser));
    } catch (error) {
        console.error('❌ Errore aggiornamento dati utente:', error);
    }
};

export function useAuth() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [initializing, setInitializing] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        authUserListeners.add(setUser);
        return () => {
            authUserListeners.delete(setUser);
        };
    }, []);

    useEffect(() => {
        if (!auth) {
            console.warn('⚠️ Firebase auth not available');
            setInitializing(false);
            return;
        }

        console.log('🔐 Setting up auth state listener...');

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log('👤 Auth state changed:', firebaseUser?.uid ? `User: ${firebaseUser.uid}` : 'No user');

            if (firebaseUser) {
                try {
                    // Leggi i dati utente da Firestore
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        console.log('📄 Dati Firestore letti:', {
                            userType: userData.userType,
                            role: userData.role,
                            name: userData.name,
                        });

                        // Combina dati Firebase Auth con Firestore
                        const authUserData = buildAuthUser(firebaseUser, userData);

                        console.log('✅ User data completo:', {
                            uid: authUserData.uid,
                            isMechanic: authUserData.isMechanic,
                            userType: authUserData.userType,
                            role: authUserData.role,
                        });

                        setUser(authUserData);
                    } else {
                        console.warn('⚠️ Documento utente non trovato in Firestore');

                        // Fallback: usa solo dati Firebase Auth
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                            phoneNumber: firebaseUser.phoneNumber,
                            emailVerified: firebaseUser.emailVerified,
                            userType: 'user',
                            role: 'owner',
                            isMechanic: false,
                        });
                    }
                } catch (error) {
                    console.error('❌ Errore lettura dati utente da Firestore:', error);

                    // Fallback in caso di errore
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        photoURL: firebaseUser.photoURL,
                        phoneNumber: firebaseUser.phoneNumber,
                        emailVerified: firebaseUser.emailVerified,
                        userType: 'user',
                        role: 'owner',
                        isMechanic: false,
                    });
                }
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
        signOut,
    };
}

// Hook semplificato per controllare il tipo di utente
export function useUserType() {
    const { user } = useAuth();

    return {
        isMechanic: user?.isMechanic || false,
        isOwner: !user?.isMechanic,
        userType: user?.userType,
        role: user?.role,
    };
}
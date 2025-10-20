// src/hooks/useProfile.ts
/**
 * Hook personalizzato per gestire il profilo utente
 * Supporta lettura, aggiornamento, upload foto e gestione dati Firebase
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { db, auth, storage } from '../services/firebase';
import { useStore } from '../store';

export interface UserProfile {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
    phone?: string;
    photoURL?: string;
    userType: 'user' | 'mechanic';
    emailVerified: boolean;
    profileComplete: boolean;
    createdAt: any;
    updatedAt: any;

    // Campi specifici per meccanici
    workshopName?: string;
    address?: string;
    vatNumber?: string;
    mechanicLicense?: string;
    rating?: number;
    reviewsCount?: number;
    verified?: boolean;
}

export interface ProfileUpdateData {
    firstName?: string;
    lastName?: string;
    phone?: string;
    photoURL?: string;

    // Campi per meccanici
    workshopName?: string;
    address?: string;
    vatNumber?: string;
    mechanicLicense?: string;
}

export const useProfile = () => {
    const { user: storeUser, setUser } = useStore();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Carica il profilo da Firebase
    const loadProfile = useCallback(async () => {
        if (!auth.currentUser) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));

            if (userDoc.exists()) {
                const data = userDoc.data() as UserProfile;
                setProfile(data);
            } else {
                setError('Profilo non trovato');
            }
        } catch (err) {
            console.error('Errore caricamento profilo:', err);
            setError('Impossibile caricare il profilo');
        } finally {
            setLoading(false);
        }
    }, []);

    // Aggiorna il profilo
    const updateProfile = useCallback(async (updates: ProfileUpdateData) => {
        if (!auth.currentUser) {
            throw new Error('Utente non autenticato');
        }

        try {
            setUpdating(true);
            setError(null);

            const userRef = doc(db, 'users', auth.currentUser.uid);

            // Prepara i dati da aggiornare
            const updateData: any = {
                ...updates,
                updatedAt: serverTimestamp(),
            };

            // Se cambiano firstName o lastName, aggiorna anche name
            if (updates.firstName || updates.lastName) {
                const currentFirstName = updates.firstName || profile?.firstName || '';
                const currentLastName = updates.lastName || profile?.lastName || '';
                updateData.name = `${currentFirstName} ${currentLastName}`.trim();
            }

            // Aggiorna Firestore
            await updateDoc(userRef, updateData);

            // Aggiorna Firebase Auth se necessario
            if (updateData.name) {
                await updateProfile(auth.currentUser, {
                    displayName: updateData.name,
                });
            }

            // Ricarica il profilo
            await loadProfile();

            // Aggiorna lo store
            if (storeUser) {
                setUser({
                    ...storeUser,
                    ...updates,
                    name: updateData.name || storeUser.name,
                });
            }

            return true;
        } catch (err) {
            console.error('Errore aggiornamento profilo:', err);
            setError('Impossibile aggiornare il profilo');
            throw err;
        } finally {
            setUpdating(false);
        }
    }, [profile, storeUser, setUser, loadProfile]);

    // Upload foto profilo
    const uploadProfilePhoto = useCallback(async (uri: string): Promise<string> => {
        if (!auth.currentUser) {
            throw new Error('Utente non autenticato');
        }

        try {
            setUploadingPhoto(true);
            setError(null);

            // Converti URI in Blob
            const response = await fetch(uri);
            const blob = await response.blob();

            // Upload su Firebase Storage
            const filename = `profile_${auth.currentUser.uid}_${Date.now()}.jpg`;
            const storageRef = ref(storage, `profile_photos/${filename}`);

            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);

            // Aggiorna il profilo con la nuova URL
            await updateProfile({ photoURL: downloadURL });

            return downloadURL;
        } catch (err) {
            console.error('Errore upload foto:', err);
            setError('Impossibile caricare la foto');
            throw err;
        } finally {
            setUploadingPhoto(false);
        }
    }, [updateProfile]);

    // Verifica se il profilo è completo
    const isProfileComplete = useCallback(() => {
        if (!profile) return false;

        const basicComplete = !!(
            profile.firstName &&
            profile.lastName &&
            profile.email &&
            profile.phone
        );

        if (profile.userType === 'mechanic') {
            return basicComplete && !!(
                profile.workshopName &&
                profile.address &&
                profile.vatNumber
            );
        }

        return basicComplete;
    }, [profile]);

    // Carica il profilo all'avvio
    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    return {
        profile,
        loading,
        updating,
        uploadingPhoto,
        error,
        loadProfile,
        updateProfile,
        uploadProfilePhoto,
        isProfileComplete: isProfileComplete(),
    };
};
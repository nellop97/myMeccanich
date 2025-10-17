// src/services/ProfileService.ts
/**
 * Servizio per gestire tutte le operazioni sul profilo utente
 * Include CRUD operations, upload media, validazioni
 */

import {
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs,
} from 'firebase/firestore';
import {
    updateProfile as updateAuthProfile,
    updateEmail,
    updatePassword,
    deleteUser,
    EmailAuthProvider,
    reauthenticateWithCredential,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, auth, storage } from '../config/firebase';

export interface ProfileData {
    firstName: string;
    lastName: string;
    phone?: string;
    photoURL?: string;
    workshopName?: string;
    address?: string;
    vatNumber?: string;
    mechanicLicense?: string;
}

class ProfileService {
    /**
     * Ottiene il profilo dell'utente corrente
     */
    async getCurrentProfile() {
        const user = auth.currentUser;
        if (!user) throw new Error('Utente non autenticato');

        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
            throw new Error('Profilo non trovato');
        }

        return userDoc.data();
    }

    /**
     * Ottiene un profilo per ID
     */
    async getProfileById(userId: string) {
        const userDoc = await getDoc(doc(db, 'users', userId));

        if (!userDoc.exists()) {
            throw new Error('Profilo non trovato');
        }

        return userDoc.data();
    }

    /**
     * Aggiorna il profilo utente
     */
    async updateProfile(updates: Partial<ProfileData>) {
        const user = auth.currentUser;
        if (!user) throw new Error('Utente non autenticato');

        const userRef = doc(db, 'users', user.uid);

        // Prepara i dati
        const updateData: any = {
            ...updates,
            updatedAt: serverTimestamp(),
        };

        // Se cambiano firstName o lastName, aggiorna name
        if (updates.firstName || updates.lastName) {
            const profile = await this.getCurrentProfile();
            const firstName = updates.firstName || profile.firstName;
            const lastName = updates.lastName || profile.lastName;
            updateData.name = `${firstName} ${lastName}`.trim();

            // Aggiorna anche Firebase Auth
            await updateAuthProfile(user, {
                displayName: updateData.name,
            });
        }

        // Calcola se il profilo è completo
        const profile = await this.getCurrentProfile();
        const isMechanic = profile.userType === 'mechanic';

        const isComplete = !!(
            (updates.firstName || profile.firstName) &&
            (updates.lastName || profile.lastName) &&
            (updates.phone || profile.phone) &&
            (!isMechanic || (
                (updates.workshopName || profile.workshopName) &&
                (updates.address || profile.address) &&
                (updates.vatNumber || profile.vatNumber)
            ))
        );

        updateData.profileComplete = isComplete;

        // Aggiorna Firestore
        await updateDoc(userRef, updateData);

        return updateData;
    }

    /**
     * Upload foto profilo
     */
    async uploadProfilePhoto(uri: string, mimeType: string = 'image/jpeg') {
        const user = auth.currentUser;
        if (!user) throw new Error('Utente non autenticato');

        try {
            // Converti URI in Blob
            const response = await fetch(uri);
            const blob = await response.blob();

            // Crea riferimento storage
            const filename = `profile_${user.uid}_${Date.now()}.jpg`;
            const storageRef = ref(storage, `profile_photos/${filename}`);

            // Upload
            const metadata = {
                contentType: mimeType,
                customMetadata: {
                    userId: user.uid,
                    uploadedAt: new Date().toISOString(),
                },
            };

            await uploadBytes(storageRef, blob, metadata);
            const downloadURL = await getDownloadURL(storageRef);

            // Aggiorna profilo
            await this.updateProfile({ photoURL: downloadURL });

            // Aggiorna Firebase Auth
            await updateAuthProfile(user, {
                photoURL: downloadURL,
            });

            return downloadURL;
        } catch (error) {
            console.error('Errore upload foto profilo:', error);
            throw new Error('Impossibile caricare la foto del profilo');
        }
    }

    /**
     * Rimuove foto profilo
     */
    async removeProfilePhoto() {
        const user = auth.currentUser;
        if (!user) throw new Error('Utente non autenticato');

        const profile = await this.getCurrentProfile();

        if (profile.photoURL) {
            try {
                // Elimina da Storage se è un URL Firebase
                if (profile.photoURL.includes('firebasestorage')) {
                    const photoRef = ref(storage, profile.photoURL);
                    await deleteObject(photoRef);
                }
            } catch (error) {
                console.warn('Errore eliminazione foto da storage:', error);
            }
        }

        // Rimuovi URL dal profilo
        await this.updateProfile({ photoURL: '' });

        // Rimuovi da Firebase Auth
        await updateAuthProfile(user, {
            photoURL: null,
        });
    }

    /**
     * Cambia email (richiede riautenticazione)
     */
    async changeEmail(newEmail: string, currentPassword: string) {
        const user = auth.currentUser;
        if (!user || !user.email) throw new Error('Utente non autenticato');

        // Riautentica
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Cambia email
        await updateEmail(user, newEmail);

        // Aggiorna Firestore
        await updateDoc(doc(db, 'users', user.uid), {
            email: newEmail,
            updatedAt: serverTimestamp(),
        });
    }

    /**
     * Cambia password (richiede riautenticazione)
     */
    async changePassword(currentPassword: string, newPassword: string) {
        const user = auth.currentUser;
        if (!user || !user.email) throw new Error('Utente non autenticato');

        // Riautentica
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Cambia password
        await updatePassword(user, newPassword);
    }

    /**
     * Elimina account (richiede riautenticazione)
     */
    async deleteAccount(password: string) {
        const user = auth.currentUser;
        if (!user || !user.email) throw new Error('Utente non autenticato');

        // Riautentica
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);

        // Elimina foto profilo se esiste
        try {
            await this.removeProfilePhoto();
        } catch (error) {
            console.warn('Errore eliminazione foto profilo:', error);
        }

        // Elimina documenti correlati
        // TODO: Implementare eliminazione veicoli, manutenzioni, etc.

        // Elimina documento utente
        await deleteDoc(doc(db, 'users', user.uid));

        // Elimina account Firebase Auth
        await deleteUser(user);
    }

    /**
     * Verifica disponibilità email
     */
    async isEmailAvailable(email: string): Promise<boolean> {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email));
            const snapshot = await getDocs(q);

            return snapshot.empty;
        } catch (error) {
            console.error('Errore verifica email:', error);
            return false;
        }
    }

    /**
     * Valida dati profilo
     */
    validateProfileData(data: Partial<ProfileData>, isMechanic: boolean = false): string[] {
        const errors: string[] = [];

        if (data.firstName && data.firstName.trim().length < 2) {
            errors.push('Il nome deve contenere almeno 2 caratteri');
        }

        if (data.lastName && data.lastName.trim().length < 2) {
            errors.push('Il cognome deve contenere almeno 2 caratteri');
        }

        if (data.phone && !/^[\d\s\+\-\(\)]+$/.test(data.phone)) {
            errors.push('Numero di telefono non valido');
        }

        if (isMechanic) {
            if (data.workshopName && data.workshopName.trim().length < 3) {
                errors.push('Il nome dell\'officina deve contenere almeno 3 caratteri');
            }

            if (data.address && data.address.trim().length < 5) {
                errors.push('L\'indirizzo deve contenere almeno 5 caratteri');
            }

            if (data.vatNumber && !/^[A-Z0-9]{11,16}$/.test(data.vatNumber.replace(/\s/g, ''))) {
                errors.push('Partita IVA non valida');
            }
        }

        return errors;
    }

    /**
     * Ottiene statistiche profilo (per meccanici)
     */
    async getMechanicStats(mechanicId?: string) {
        const uid = mechanicId || auth.currentUser?.uid;
        if (!uid) throw new Error('ID meccanico non fornito');

        // TODO: Implementare query per statistiche reali
        // Per ora ritorna dati mock
        return {
            totalRepairs: 0,
            activeRepairs: 0,
            totalRevenue: 0,
            averageRating: 0,
            totalCustomers: 0,
        };
    }
}

export const profileService = new ProfileService();
export default profileService;
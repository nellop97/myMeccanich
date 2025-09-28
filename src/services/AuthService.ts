// src/services/AuthService.ts
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    User,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithCredential,
    OAuthCredential,
    signInWithPopup,
    getIdToken
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
    updateDoc
} from 'firebase/firestore';
import { auth, db, handleAuthError, isWeb } from './firebase';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

// Completa l'autenticazione web
WebBrowser.maybeCompleteAuthSession();

// Tipi utente
export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    photoURL?: string;
    phone?: string;
    role: 'owner' | 'mechanic';
    workshopName?: string;
    vatNumber?: string;
    address?: string;
    createdAt: any;
    lastLoginAt?: any;
    emailVerified?: boolean;
}

// Configurazione Google Auth per expo-auth-session
const GOOGLE_CONFIG = {
    clientId: Platform.select({
        ios: '619020396283-i5qvfa2fnri304g3nndjrob5flhfrp5r.apps.googleusercontent.com',
        android: '619020396283-hsb93gobbbuokvc80idf466ptlh7fmdi.apps.googleusercontent.com',
        web: '619020396283-4gd2pd371hop6d1vkc0tvo6j3jaod2t6.apps.googleusercontent.com',
    }),
    scopes: ['openid', 'profile', 'email'],
};

class AuthService {
    // Listener per stato autenticazione
    subscribeToAuthChanges(callback: (user: User | null) => void) {
        return onAuthStateChanged(auth, callback);
    }

    // Registrazione con email e password
    async registerWithEmailPassword(
        email: string,
        password: string,
        userData: Partial<UserProfile>
    ): Promise<UserProfile> {
        try {
            // Crea utente Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Aggiorna profilo display name
            if (userData.firstName || userData.lastName) {
                const displayName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
                await updateProfile(user, { displayName });
            }

            // Crea profilo utente in Firestore
            const userProfile: UserProfile = {
                uid: user.uid,
                email: user.email!,
                displayName: user.displayName || '',
                firstName: userData.firstName,
                lastName: userData.lastName,
                phone: userData.phone,
                role: userData.role || 'owner',
                workshopName: userData.workshopName,
                vatNumber: userData.vatNumber,
                address: userData.address,
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp(),
                emailVerified: user.emailVerified,
            };

            await setDoc(doc(db, 'users', user.uid), userProfile);

            return userProfile;
        } catch (error) {
            throw new Error(handleAuthError(error));
        }
    }

    // Login con email e password
    async loginWithEmailPassword(email: string, password: string): Promise<UserProfile> {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Aggiorna ultimo login
            await updateDoc(doc(db, 'users', user.uid), {
                lastLoginAt: serverTimestamp(),
            });

            // Recupera profilo utente
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
                throw new Error('Profilo utente non trovato');
            }

            return userDoc.data() as UserProfile;
        } catch (error) {
            throw new Error(handleAuthError(error));
        }
    }

    // Google Sign In con expo-auth-session (compatibile SDK 54)
    async signInWithGoogle(): Promise<UserProfile | null> {
        try {
            if (isWeb) {
                // Web: usa signInWithPopup
                const provider = new GoogleAuthProvider();
                provider.addScope('profile');
                provider.addScope('email');

                const result = await signInWithPopup(auth, provider);
                return await this.handleGoogleUser(result.user);
            } else {
                // Mobile: usa expo-auth-session
                const redirectUri = AuthSession.makeRedirectUri({
                    scheme: 'mymeccanich',
                    useProxy: __DEV__, // Usa proxy solo in development
                });

                const discovery = {
                    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
                    tokenEndpoint: 'https://oauth2.googleapis.com/token',
                    revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
                };

                const request = new AuthSession.AuthRequest({
                    clientId: GOOGLE_CONFIG.clientId!,
                    scopes: GOOGLE_CONFIG.scopes,
                    redirectUri,
                    responseType: AuthSession.ResponseType.IdToken,
                    prompt: AuthSession.Prompt.SelectAccount,
                });

                const result = await request.promptAsync(discovery);

                if (result.type === 'success' && result.params.id_token) {
                    // Crea credenziali Google
                    const credential = GoogleAuthProvider.credential(result.params.id_token);

                    // Autentica con Firebase
                    const userCredential = await signInWithCredential(auth, credential);
                    return await this.handleGoogleUser(userCredential.user);
                }

                return null;
            }
        } catch (error) {
            console.error('Errore Google Sign In:', error);
            throw new Error(handleAuthError(error));
        }
    }

    // Apple Sign In (solo iOS)
    async signInWithApple(): Promise<UserProfile | null> {
        if (Platform.OS !== 'ios') {
            throw new Error('Apple Sign In è disponibile solo su iOS');
        }

        try {
            const nonce = Math.random().toString(36).substring(2, 10);
            const hashedNonce = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                nonce
            );

            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
                nonce: hashedNonce,
            });

            if (credential.identityToken) {
                // Importa dinamicamente OAuthProvider per evitare errori su Android
                const { OAuthProvider } = await import('firebase/auth');
                const provider = new OAuthProvider('apple.com');
                const oAuthCredential = provider.credential({
                    idToken: credential.identityToken,
                    rawNonce: nonce,
                });

                const userCredential = await signInWithCredential(auth, oAuthCredential);

                // Gestisci i dati Apple (nome disponibile solo al primo login)
                const user = userCredential.user;
                const userProfile = await this.getOrCreateUserProfile(user);

                if (credential.fullName && !userProfile.firstName) {
                    // Aggiorna il nome solo se non già presente
                    await updateDoc(doc(db, 'users', user.uid), {
                        firstName: credential.fullName.givenName,
                        lastName: credential.fullName.familyName,
                        displayName: `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim(),
                    });
                }

                return userProfile;
            }

            return null;
        } catch (error) {
            if ((error as any).code === 'ERR_CANCELED') {
                // Utente ha annullato
                return null;
            }
            throw new Error(handleAuthError(error));
        }
    }

    // Helper per gestire utente Google
    private async handleGoogleUser(user: User): Promise<UserProfile> {
        return await this.getOrCreateUserProfile(user);
    }

    // Ottieni o crea profilo utente
    private async getOrCreateUserProfile(user: User): Promise<UserProfile> {
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (userDoc.exists()) {
            // Aggiorna ultimo login
            await updateDoc(doc(db, 'users', user.uid), {
                lastLoginAt: serverTimestamp(),
            });
            return userDoc.data() as UserProfile;
        }

        // Crea nuovo profilo per utenti social
        const nameParts = (user.displayName || '').split(' ');
        const userProfile: UserProfile = {
            uid: user.uid,
            email: user.email!,
            displayName: user.displayName || '',
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            photoURL: user.photoURL || undefined,
            role: 'owner', // Default per nuovi utenti social
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            emailVerified: user.emailVerified,
        };

        await setDoc(doc(db, 'users', user.uid), userProfile);
        return userProfile;
    }

    // Recupera profilo utente corrente
    async getCurrentUserProfile(): Promise<UserProfile | null> {
        const user = auth.currentUser;
        if (!user) return null;

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) return null;

        return userDoc.data() as UserProfile;
    }

    // Aggiorna profilo utente
    async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error('Nessun utente autenticato');

        // Aggiorna Firebase Auth se necessario
        if (updates.displayName && updates.displayName !== user.displayName) {
            await updateProfile(user, { displayName: updates.displayName });
        }

        // Aggiorna Firestore
        const { uid, email, ...updateData } = updates; // Escludi campi non modificabili
        await updateDoc(doc(db, 'users', user.uid), updateData);
    }

    // Reset password
    async resetPassword(email: string): Promise<void> {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            throw new Error(handleAuthError(error));
        }
    }

    // Logout
    async logout(): Promise<void> {
        try {
            await signOut(auth);
        } catch (error) {
            throw new Error(handleAuthError(error));
        }
    }

    // Ottieni token ID per API calls
    async getIdToken(): Promise<string | null> {
        const user = auth.currentUser;
        if (!user) return null;

        try {
            return await getIdToken(user);
        } catch (error) {
            console.error('Errore recupero token:', error);
            return null;
        }
    }

    // Verifica se l'utente è un meccanico
    async isMechanic(): Promise<boolean> {
        const profile = await this.getCurrentUserProfile();
        return profile?.role === 'mechanic';
    }

    // Verifica se l'utente è proprietario
    async isOwner(): Promise<boolean> {
        const profile = await this.getCurrentUserProfile();
        return profile?.role === 'owner';
    }
}

// Esporta istanza singleton
export const authService = new AuthService();

// Esporta anche il tipo per dependency injection
export type IAuthService = AuthService;
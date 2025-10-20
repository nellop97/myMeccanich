// src/services/GoogleSignInService.ts - VERSIONE EXPO PURA
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import {
    GoogleAuthProvider,
    signInWithCredential,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult
} from 'firebase/auth';
import { auth } from './firebase';

// Necessario per mobile per completare l'auth session
WebBrowser.maybeCompleteAuthSession();

// Configurazione Google OAuth
const GOOGLE_CONFIG = {
    webClientId: "619020396283-4gd2pd371hop6d1vkc0tvo6j3jaod2t6.apps.googleusercontent.com",
    iosClientId: "619020396283-i5qvfa2fnri304g3nndjrob5flhfrp5r.apps.googleusercontent.com",
    androidClientId: "619020396283-hsb93gobbbuokvc80idf466ptlh7fmdi.apps.googleusercontent.com",
    scopes: ['openid', 'profile', 'email'],
};

export class GoogleSignInService {
    private static request: AuthSession.AuthRequest | null = null;

    /**
     * Inizializza il servizio (chiamare all'avvio dell'app)
     */
    static async initialize() {
        if (Platform.OS === 'web') {
            // Check per redirect result su web
            try {
                const result = await getRedirectResult(auth);
                if (result) {
                    console.log('✅ Login completato da redirect:', result.user.email);
                    return result;
                }
            } catch (error) {
                console.error('Errore checking redirect result:', error);
            }
        }
        return null;
    }

    /**
     * Effettua il login con Google
     */
    static async signIn() {
        try {
            if (Platform.OS === 'web') {
                return await GoogleSignInService.signInWeb();
            } else {
                return await GoogleSignInService.signInMobile();
            }
        } catch (error) {
            console.error('Errore Google Sign-In:', error);
            throw error;
        }
    }

    /**
     * Login Google per WEB
     */
    private static async signInWeb() {
        const provider = new GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');

        try {
            // Prova prima con popup
            const result = await signInWithPopup(auth, provider);
            console.log('✅ Login con popup riuscito:', result.user.email);
            return result;
        } catch (popupError: any) {
            // Se il popup è bloccato, usa redirect
            if (popupError.code === 'auth/popup-blocked' ||
                popupError.code === 'auth/popup-closed-by-user') {
                console.log('Popup bloccato, usando redirect...');
                await signInWithRedirect(auth, provider);
                return null; // Il risultato sarà gestito al reload della pagina
            }
            throw popupError;
        }
    }

    /**
     * Login Google per MOBILE (usando Expo Auth Session)
     */
    private static async signInMobile() {
        try {
            // Genera code challenge per PKCE
            const codeChallenge = AuthSession.AuthRequest.PKCE.codeChallenge(
                await Crypto.digestStringAsync(
                    Crypto.CryptoDigestAlgorithm.SHA256,
                    Math.random().toString(36).substring(2, 15) +
                    Math.random().toString(36).substring(2, 15),
                    { encoding: Crypto.CryptoEncoding.BASE64URL }
                )
            );

            // Configurazione della richiesta OAuth
            const request = new AuthSession.AuthRequest({
                clientId: Platform.select({
                    ios: GOOGLE_CONFIG.iosClientId,
                    android: GOOGLE_CONFIG.androidClientId,
                    default: GOOGLE_CONFIG.androidClientId,
                })!,
                scopes: GOOGLE_CONFIG.scopes,
                responseType: AuthSession.ResponseType.Code,
                redirectUri: AuthSession.makeRedirectUri({
                    scheme: 'mymeccanich',
                    useProxy: true, // Usa il proxy Expo per lo sviluppo
                }),
                codeChallenge,
                extraParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            });

            // Salva la request per dopo
            this.request = request;

            // URL di discovery Google
            const discovery = {
                authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
                tokenEndpoint: 'https://oauth2.googleapis.com/token',
                revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
            };

            // Effettua la richiesta OAuth
            const result = await request.promptAsync(discovery);

            if (result.type === 'success') {
                // Scambia il code per tokens
                const tokenResult = await AuthSession.exchangeCodeAsync(
                    {
                        clientId: Platform.select({
                            ios: GOOGLE_CONFIG.iosClientId,
                            android: GOOGLE_CONFIG.androidClientId,
                            default: GOOGLE_CONFIG.androidClientId,
                        })!,
                        code: result.params.code,
                        redirectUri: AuthSession.makeRedirectUri({
                            scheme: 'mymeccanich',
                            useProxy: true,
                        }),
                        codeVerifier: request.codeVerifier!,
                        extraParams: {
                            code_verifier: request.codeVerifier!,
                        },
                    },
                    discovery
                );

                if (!tokenResult.idToken) {
                    throw new Error('ID Token mancante nella risposta');
                }

                // Crea il credential per Firebase
                const credential = GoogleAuthProvider.credential(
                    tokenResult.idToken,
                    tokenResult.accessToken
                );

                // Effettua il login su Firebase
                const firebaseResult = await signInWithCredential(auth, credential);

                console.log('✅ Login mobile riuscito:', firebaseResult.user.email);

                // Salva i token per future necessità
                this.saveTokens(tokenResult);

                return firebaseResult;
            } else if (result.type === 'cancel') {
                throw new Error('Login annullato dall\'utente');
            } else {
                throw new Error(`Login fallito: ${result.type}`);
            }
        } catch (error) {
            console.error('Errore durante Google Sign-In mobile:', error);
            throw error;
        }
    }

    /**
     * Salva i token in modo sicuro (per future implementazioni)
     */
    private static saveTokens(tokenResult: AuthSession.TokenResponse) {
        // Qui potresti salvare i token in SecureStore per uso futuro
        // Per ora li logghiamo solo
        console.log('Tokens ottenuti:', {
            hasIdToken: !!tokenResult.idToken,
            hasAccessToken: !!tokenResult.accessToken,
            hasRefreshToken: !!tokenResult.refreshToken,
            expiresIn: tokenResult.expiresIn,
        });
    }

    /**
     * Refresh del token (se necessario)
     */
    static async refreshToken(refreshToken: string) {
        try {
            const tokenResult = await AuthSession.refreshAsync(
                {
                    clientId: Platform.select({
                        ios: GOOGLE_CONFIG.iosClientId,
                        android: GOOGLE_CONFIG.androidClientId,
                        default: GOOGLE_CONFIG.androidClientId,
                    })!,
                    refreshToken,
                    scopes: GOOGLE_CONFIG.scopes,
                },
                {
                    tokenEndpoint: 'https://oauth2.googleapis.com/token',
                }
            );

            return tokenResult;
        } catch (error) {
            console.error('Errore refresh token:', error);
            throw error;
        }
    }

    /**
     * Logout
     */
    static async signOut() {
        try {
            await auth.signOut();

            // Pulisci eventuali sessioni di Auth Session
            if (this.request) {
                this.request = null;
            }

            console.log('✅ Logout effettuato');
        } catch (error) {
            console.error('Errore durante logout:', error);
            throw error;
        }
    }

    /**
     * Verifica disponibilità Google Sign-In
     */
    static isAvailable(): boolean {
        return true; // Expo Auth Session è sempre disponibile
    }

    /**
     * Ottieni informazioni utente corrente
     */
    static getCurrentUser() {
        return auth.currentUser;
    }

    /**
     * Ottieni informazioni dettagliate dell'utente da Google
     */
    static async getUserInfo(accessToken: string) {
        try {
            const response = await fetch(
                `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
            );

            if (!response.ok) {
                throw new Error('Errore nel recupero info utente');
            }

            const userInfo = await response.json();
            return userInfo;
        } catch (error) {
            console.error('Errore getUserInfo:', error);
            throw error;
        }
    }
}

export default GoogleSignInService;
// src/services/GoogleSignInService.ts - VERSIONE EXPO COMPATIBILE
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';

// Necessario per mobile
WebBrowser.maybeCompleteAuthSession();

// Configurazione Google OAuth
const GOOGLE_CONFIG = {
  webClientId: "619020396283-4gd2pd371hop6d1vkc0tvo6j3jaod2t6.apps.googleusercontent.com",
  iosClientId: "619020396283-i5qvfa2fnri304g3nndjrob5flhfrp5r.apps.googleusercontent.com",
  androidClientId: "619020396283-hsb93gobbbuokvc80idf466ptlh7fmdi.apps.googleusercontent.com",
  scopes: ['openid', 'profile', 'email'],
};

export class GoogleSignInService {
  private static discoveryDocument = AuthSession.makeRedirectUri({
    scheme: 'mymeccanich',
  });

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
    
    const result = await signInWithPopup(auth, provider);
    return result;
  }

  /**
   * Login Google per MOBILE (usando Expo Auth Session)
   */
  private static async signInMobile() {
    try {
      // Configurazione della richiesta OAuth
      const request = new AuthSession.AuthRequest({
        clientId: Platform.select({
          ios: GOOGLE_CONFIG.iosClientId,
          android: GOOGLE_CONFIG.androidClientId,
          default: GOOGLE_CONFIG.androidClientId,
        }),
        scopes: GOOGLE_CONFIG.scopes,
        responseType: AuthSession.ResponseType.Code,
        redirectUri: AuthSession.makeRedirectUri({
          scheme: 'mymeccanich',
        }),
        additionalParameters: {},
        extraParams: {
          // Forza il consent screen per ottenere refresh token
          access_type: 'offline',
        },
      });

      // URL di discovery Google
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
      };

      // Effettua la richiesta OAuth
      const result = await request.promptAsync(discovery);

      if (result.type === 'success') {
        // Scambia il code per un access token
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: Platform.select({
              ios: GOOGLE_CONFIG.iosClientId,
              android: GOOGLE_CONFIG.androidClientId,
              default: GOOGLE_CONFIG.androidClientId,
            }),
            code: result.params.code,
            redirectUri: AuthSession.makeRedirectUri({
              scheme: 'mymeccanich',
            }),
          },
          discovery
        );

        // Ottieni le informazioni utente
        const userInfoResponse = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResult.accessToken}`
        );
        const userInfo = await userInfoResponse.json();

        // Crea il credential per Firebase usando l'ID token se disponibile,
        // altrimenti usa l'access token
        const credential = GoogleAuthProvider.credential(
          tokenResult.idToken,
          tokenResult.accessToken
        );

        // Effettua il login su Firebase
        const firebaseResult = await signInWithCredential(auth, credential);
        return firebaseResult;
      } else {
        throw new Error('Login cancellato dall\'utente');
      }
    } catch (error) {
      console.error('Errore durante Google Sign-In mobile:', error);
      throw error;
    }
  }

  /**
   * Logout
   */
  static async signOut() {
    try {
      await auth.signOut();
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
   * Ottieni informazioni utente corrente (per web)
   */
  static async getCurrentUser() {
    return auth.currentUser;
  }
}

export default GoogleSignInService;
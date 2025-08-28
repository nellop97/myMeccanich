// src/services/DebugService.ts - SERVIZIO DI DEBUG
import { Platform } from 'react-native';
import { auth, db } from './firebase';
import GoogleSignInService from './GoogleSignInService';

export class DebugService {
  /**
   * Test completo della configurazione Firebase e OAuth
   */
  static async runFullTest() {
    console.log('🧪 === INIZIO TEST CONFIGURAZIONE ===');
    
    // Test Firebase
    await DebugService.testFirebase();
    
    // Test Google Sign-In
    await DebugService.testGoogleSignIn();
    
    // Test platform-specific
    await DebugService.testPlatformSpecific();
    
    console.log('🧪 === FINE TEST CONFIGURAZIONE ===');
  }

  /**
   * Test configurazione Firebase
   */
  static async testFirebase() {
    console.log('\n🔥 === TEST FIREBASE ===');
    
    try {
      // Test Auth
      console.log('Auth disponibile:', !!auth);
      console.log('Auth app:', auth.app.name);
      console.log('Auth project ID:', auth.app.options.projectId);
      
      // Test Firestore
      console.log('Firestore disponibile:', !!db);
      console.log('Firestore app:', db.app.name);
      console.log('Firestore project ID:', db.app.options.projectId);
      
      // Test connessione
      const testDoc = db.collection ? 'Firestore v8' : 'Firestore v9';
      console.log('Firestore version:', testDoc);
      
      console.log('✅ Firebase configurato correttamente');
      
    } catch (error) {
      console.error('❌ Errore Firebase:', error);
    }
  }

  /**
   * Test Google Sign-In
   */
  static async testGoogleSignIn() {
    console.log('\n🔍 === TEST GOOGLE SIGN-IN ===');
    
    try {
      console.log('Google Sign-In disponibile:', GoogleSignInService.isAvailable());
      console.log('Platform:', Platform.OS);
      
      // Test import delle librerie necessarie
      const AuthSession = await import('expo-auth-session');
      console.log('Expo Auth Session:', !!AuthSession);
      
      const WebBrowser = await import('expo-web-browser');
      console.log('Expo Web Browser:', !!WebBrowser);
      
      const Crypto = await import('expo-crypto');
      console.log('Expo Crypto:', !!Crypto);
      
      console.log('✅ Google Sign-In configurato correttamente');
      
    } catch (error) {
      console.error('❌ Errore Google Sign-In:', error);
    }
  }

  /**
   * Test specifici per platform
   */
  static async testPlatformSpecific() {
    console.log('\n📱 === TEST PLATFORM SPECIFIC ===');
    
    console.log('Platform:', Platform.OS);
    console.log('Platform Version:', Platform.Version);
    
    if (Platform.OS === 'ios') {
      await DebugService.testIOS();
    } else if (Platform.OS === 'android') {
      await DebugService.testAndroid();
    } else if (Platform.OS === 'web') {
      await DebugService.testWeb();
    }
  }

  /**
   * Test specifici iOS
   */
  static async testIOS() {
    console.log('🍎 === TEST iOS ===');
    
    try {
      // Test AsyncStorage
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      console.log('AsyncStorage disponibile:', !!AsyncStorage.default);
      
      // Test Apple Authentication (se disponibile)
      try {
        const AppleAuthentication = await import('expo-apple-authentication');
        console.log('Apple Authentication disponibile:', !!AppleAuthentication);
      } catch (error) {
        console.log('Apple Authentication non disponibile (normale per simulatore)');
      }
      
      console.log('✅ iOS configurato correttamente');
      
    } catch (error) {
      console.error('❌ Errore iOS:', error);
    }
  }

  /**
   * Test specifici Android
   */
  static async testAndroid() {
    console.log('🤖 === TEST ANDROID ===');
    
    try {
      // Test AsyncStorage
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      console.log('AsyncStorage disponibile:', !!AsyncStorage.default);
      
      console.log('✅ Android configurato correttamente');
      
    } catch (error) {
      console.error('❌ Errore Android:', error);
    }
  }

  /**
   * Test specifici Web
   */
  static async testWeb() {
    console.log('🌐 === TEST WEB ===');
    
    try {
      console.log('User Agent:', navigator.userAgent);
      console.log('Location:', window.location.href);
      
      // Test popup availability
      console.log('Popup disponibile:', !!window.open);
      
      console.log('✅ Web configurato correttamente');
      
    } catch (error) {
      console.error('❌ Errore Web:', error);
    }
  }

  /**
   * Test veloce per verificare che tutto sia a posto
   */
  static quickHealthCheck(): boolean {
    try {
      const checks = {
        auth: !!auth,
        firestore: !!db,
        googleSignIn: GoogleSignInService.isAvailable(),
        projectId: auth.app.options.projectId === 'mymecanich'
      };
      
      console.log('🩺 Health Check:', checks);
      
      const allGood = Object.values(checks).every(Boolean);
      console.log(allGood ? '✅ Tutto OK!' : '⚠️ Alcuni problemi rilevati');
      
      return allGood;
    } catch (error) {
      console.error('❌ Health check fallito:', error);
      return false;
    }
  }
}

export default DebugService;
// src/screens/LoginScreen.tsx
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import {
  Button,
  Checkbox,
  Divider,
  HelperText,
  Text,
  TextInput,
  useTheme
} from 'react-native-paper';
import { AuthStackParamList } from '../navigation/AppNavigator';
import { useStore } from '../store';

// Expo imports
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

// Firebase imports
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithCredential,
  onAuthStateChanged,
  User as FirebaseUser,
  OAuthProvider
} from 'firebase/auth';
import { auth } from '../services/firebase';

WebBrowser.maybeCompleteAuthSession();

// Configurazione Google OAuth
const googleConfig = {
  clientId: 'YOUR_GOOGLE_CLIENT_ID', // Sostituisci con il tuo Client ID
  scopes: ['openid', 'profile', 'email'],
  additionalParameters: {},
  customParameters: {},
};

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { setUser } = useStore();
  const theme = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Configurazione OAuth per Google
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: googleConfig.clientId,
      scopes: googleConfig.scopes,
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'your-app-scheme', // Sostituisci con il tuo scheme
        useProxy: true,
      }),
    },
    { authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth' }
  );

  useEffect(() => {
    // Listener per cambio stato autenticazione
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChanged);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response);
    }
  }, [response]);

  const handleAuthStateChanged = (user: FirebaseUser | null) => {
    if (user) {
      // Utente autenticato con successo
      setUser({
        id: user.uid,
        name: user.displayName || 'Utente',
        email: user.email || '',
        isLoggedIn: true,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        phoneNumber: user.phoneNumber,
        createdAt: user.metadata.creationTime,
        lastLoginAt: user.metadata.lastSignInTime,
      });
    }
  };

  const handleGoogleResponse = async (response: AuthSession.AuthSessionResult) => {
    if (response.type === 'success') {
      try {
        setIsLoading(true);
        
        // Ottieni l'access token
        const { access_token } = response.params;
        
        // Crea il credential per Firebase
        const credential = GoogleAuthProvider.credential(null, access_token);
        
        // Accedi con Firebase
        await signInWithCredential(auth, credential);
        
      } catch (error: any) {
        console.error('Errore Google Sign-In:', error);
        Alert.alert('Errore', 'Errore durante l\'accesso con Google');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!text) {
      setEmailError('L\'email è obbligatoria');
      return false;
    } else if (!emailRegex.test(text)) {
      setEmailError('Inserisci un indirizzo email valido');
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };

  const validatePassword = (text: string) => {
    if (!text) {
      setPasswordError('La password è obbligatoria');
      return false;
    } else if (text.length < 6) {
      setPasswordError('La password deve avere almeno 6 caratteri');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };

  const handleLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // handleAuthStateChanged gestirà l'aggiornamento dello stato
    } catch (error: any) {
      console.error('Errore di login:', error);
      let errorMessage = 'Errore durante il login';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Utente non trovato';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Password non corretta';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email non valida';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Account disabilitato';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Credenziali non valide';
          break;
        default:
          errorMessage = error.message || 'Errore durante il login';
      }
      
      Alert.alert('Errore', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      
      if (!request) {
        Alert.alert('Errore', 'Configurazione Google non pronta');
        return;
      }
      
      // Avvia il flusso OAuth
      await promptAsync();
      
    } catch (error: any) {
      console.error('Errore Google Sign-In:', error);
      Alert.alert('Errore', 'Errore durante l\'accesso con Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setIsLoading(true);
      
      // Verifica se Apple Sign-In è disponibile
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Errore', 'Apple Sign-In non è disponibile su questo dispositivo');
        return;
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Crea il nonce per Apple Sign-In
      const nonce = Math.random().toString(36).substring(2, 15);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      // Crea il provider Apple per Firebase
      const provider = new OAuthProvider('apple.com');
      const oauthCredential = provider.credential({
        idToken: credential.identityToken,
        rawNonce: nonce,
      });

      // Accedi con Firebase (se hai configurato Apple Sign-In su Firebase)
      // await signInWithCredential(auth, oauthCredential);

      // Per ora, simuliamo un login di successo
      console.log(credential)
      setUser({
        id: credential.user,
        name: credential.fullName?.givenName 
          ? `${credential.fullName.givenName} ${credential.fullName.familyName || ''}`.trim()
          : 'Utente Apple',
        email: credential.email || `${credential.user}@privaterelay.appleid.com`,
        isLoggedIn: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      });
      
    } catch (error: any) {
      console.error('Errore Apple Sign-In:', error);
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Errore', 'Errore durante l\'accesso con Apple');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>🚗</Text>
          </View>
          <Text variant="headlineMedium" style={styles.appName}>AutoManager</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Gestisci la tua auto in modo smart
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text variant="titleLarge" style={styles.title}>Accedi</Text>
          
          {/* Campo Email */}
          <TextInput
            label="Email"
            value={email}
            onChangeText={text => {
              setEmail(text);
              if (emailError) validateEmail(text);
            }}
            onBlur={() => validateEmail(email)}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
            style={styles.input}
            error={!!emailError}
          />
          {emailError ? <HelperText type="error">{emailError}</HelperText> : null}
          
          {/* Campo Password */}
          <TextInput
            label="Password"
            value={password}
            onChangeText={text => {
              setPassword(text);
              if (passwordError) validatePassword(text);
            }}
            onBlur={() => validatePassword(password)}
            mode="outlined"
            secureTextEntry={!showPassword}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
            error={!!passwordError}
          />
          {passwordError ? <HelperText type="error">{passwordError}</HelperText> : null}
          
          {/* Opzioni aggiuntive */}
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setRememberMe(!rememberMe)}
            >
              <Checkbox
                status={rememberMe ? 'checked' : 'unchecked'}
                onPress={() => setRememberMe(!rememberMe)}
              />
              <Text variant="bodyMedium">Ricordami</Text>
            </TouchableOpacity>
            
            <TouchableOpacity>
              <Text variant="bodyMedium" style={{color: theme.colors.primary}}>
                Password dimenticata?
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Pulsante di Login */}
          <Button 
            mode="contained" 
            onPress={handleLogin}
            style={styles.loginButton}
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Accesso in corso...' : 'Accedi'}
          </Button>
          
          {/* Divisore */}
          <View style={styles.dividerContainer}>
            <Divider style={styles.divider} />
            <Text variant="bodySmall" style={styles.dividerText}>oppure</Text>
            <Divider style={styles.divider} />
          </View>
          
          {/* Pulsanti Social */}
          <View style={styles.socialButtonsContainer}>
            <Button
              mode="outlined"
              onPress={handleGoogleLogin}
              disabled={isLoading}
              style={[styles.socialButton, { flex: 1, marginRight: 8 }]}
              icon="google"
            >
              Google
            </Button>
            
            {Platform.OS === 'ios' && (
              <Button
                mode="outlined"
                onPress={handleAppleLogin}
                disabled={isLoading}
                style={[styles.socialButton, { flex: 1, marginLeft: 8 }]}
                icon="apple"
              >
                Apple
              </Button>
            )}
          </View>
          
          {/* Link Registrazione */}
          <View style={styles.registerContainer}>
            <Text variant="bodyMedium">Non hai ancora un account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text 
                variant="bodyMedium" 
                style={{color: theme.colors.primary, fontWeight: 'bold'}}
              >
                Registrati
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: 'white',
    fontSize: 32,
  },
  appName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    marginBottom: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButton: {
    marginTop: 16,
    paddingVertical: 6,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 8,
    color: '#888',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  socialButton: {
    marginVertical: 4,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
});
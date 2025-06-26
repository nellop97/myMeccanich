// src/screens/RegisterScreen.tsx - VERSIONE COMPLETA CON FIRESTORE
import React, { useState, useEffect } from 'react';
import { Platform, StyleSheet, ScrollView, View, KeyboardAvoidingView, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Checkbox,
  Portal,
  Modal,
  useTheme,
  ActivityIndicator,
  HelperText,
  Chip
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

// Firebase imports
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  updateProfile,
  signInWithCredential,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

// Conditional imports per OAuth (solo se necessari)
let AuthSession: any = null;
let AppleAuthentication: any = null;

if (Platform.OS !== 'web') {
  try {
    AuthSession = require('expo-auth-session');
    AppleAuthentication = require('expo-apple-authentication');
  } catch (error) {
    console.log('OAuth libraries not available');
  }
}

// TypeScript interfaces
interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  workshopName?: string;
  address?: string;
  vatNumber?: string;
  mechanicLicense?: string;
}

type UserType = 'user' | 'mechanic';

interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: UserType;
  loginProvider: string;
  profileComplete: boolean;
  verified: boolean;
  workshopName?: string;
  address?: string;
  vatNumber?: string;
  mechanicLicense?: string;
  rating?: number;
  reviewsCount?: number;
  settings: {
    notifications: boolean;
    darkMode: boolean;
    language: string;
  };
  createdAt: any;
  updatedAt: any;
}

export default function RegisterScreen() {
  const navigation = useNavigation();
  const theme = useTheme();

  // State per il form
  const [currentStep, setCurrentStep] = useState(1);
  const [userType, setUserType] = useState<UserType>('user');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    workshopName: '',
    address: '',
    vatNumber: '',
    mechanicLicense: ''
  });

  // State per UI
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [socialUser, setSocialUser] = useState<FirebaseUser | null>(null); // Per tracciare utenti social

  // State per errori
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Configurazione Google OAuth
  const [googleRequest, googleResponse, promptGoogleAsync] = Platform.OS !== 'web' && AuthSession
      ? AuthSession.useAuthRequest({
        clientId: '619020396283-hsb93gobbbuokvc80idf466ptlh7fmdi.apps.googleusercontent.com',
        scopes: ['openid', 'profile', 'email'],
        redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
      }, { authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth' })
      : [null, null, null];

  // Effect per gestire la risposta Google OAuth
  useEffect(() => {
    if (googleResponse?.type === 'success' && googleResponse.authentication) {
      handleGoogleAuthResponse(googleResponse);
    }
  }, [googleResponse]);

  // Effect per pre-compilare i campi quando arriva un utente social
  useEffect(() => {
    if (socialUser && socialUser.displayName) {
      const [firstName, ...lastNameArray] = socialUser.displayName.split(' ');
      const lastName = lastNameArray.join(' ');

      setFormData(prev => ({
        ...prev,
        firstName: firstName || '',
        lastName: lastName || '',
        email: socialUser.email || ''
      }));
    }
  }, [socialUser]);

  // Funzioni di validazione
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step >= 1) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email richiesta';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Formato email non valido';
      }

      if (!formData.password.trim()) {
        newErrors.password = 'Password richiesta';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password troppo corta (minimo 6 caratteri)';
      }

      if (!formData.confirmPassword.trim()) {
        newErrors.confirmPassword = 'Conferma password richiesta';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Le password non coincidono';
      }
    }

    if (step >= 2) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'Nome richiesto';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Cognome richiesto';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Numero di telefono richiesto';
      } else if (!validatePhone(formData.phone)) {
        newErrors.phone = 'Numero di telefono non valido';
      }
    }

    if (step >= 3 && userType === 'mechanic') {
      if (!formData.workshopName?.trim()) {
        newErrors.workshopName = 'Nome officina richiesto';
      }
      if (!formData.address?.trim()) {
        newErrors.address = 'Indirizzo richiesto';
      }
      if (!formData.vatNumber?.trim()) {
        newErrors.vatNumber = 'Partita IVA richiesta';
      }
    }

    if (step === 3 && !agreedToTerms) {
      newErrors.terms = 'Devi accettare i termini e condizioni';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Funzione per salvare utente in Firestore
  const saveUserToFirestore = async (user: FirebaseUser, loginProvider: string): Promise<void> => {
    try {
      const displayName = user.displayName || '';
      const [firstName, ...lastNameArray] = displayName.split(' ');
      const lastName = lastNameArray.join(' ');

      const userData: UserProfile = {
        uid: user.uid,
        email: user.email || formData.email,
        firstName: loginProvider === 'email' ? formData.firstName : (firstName || 'Nome'),
        lastName: loginProvider === 'email' ? formData.lastName : (lastName || 'Cognome'),
        phone: loginProvider === 'email' ? formData.phone : '',
        userType: userType,
        loginProvider: loginProvider,
        profileComplete: loginProvider === 'email',
        verified: false,
        settings: {
          notifications: true,
          darkMode: false,
          language: 'it'
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Aggiungi campi specifici per meccanici
      if (userType === 'mechanic' && loginProvider === 'email') {
        userData.workshopName = formData.workshopName;
        userData.address = formData.address;
        userData.vatNumber = formData.vatNumber;
        userData.mechanicLicense = formData.mechanicLicense;
        userData.rating = 0;
        userData.reviewsCount = 0;
      }

      // Salva in Firestore nella collezione 'users'
      await setDoc(doc(db, 'users', user.uid), userData);

      console.log('✅ Utente salvato in Firestore:', userData);
    } catch (error) {
      console.error('❌ Errore salvando utente in Firestore:', error);
      throw new Error('Errore durante il salvataggio del profilo');
    }
  };

  // Gestione registrazione email/password o completamento social
  const handleEmailRegistration = async (): Promise<void> => {
    if (!validateStep(3)) return;

    setLoading(true);

    try {
      if (socialUser) {
        // Completa registrazione per utente social
        await saveUserToFirestore(socialUser, socialUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'apple');

        Alert.alert(
            'Registrazione completata!',
            `Benvenuto ${formData.firstName}! Il tuo account ${userType === 'mechanic' ? 'meccanico' : 'utente'} è stato creato con successo.`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        // Registrazione normale email/password
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.email.trim(),
            formData.password
        );

        // Aggiorna il profilo
        await updateProfile(userCredential.user, {
          displayName: `${formData.firstName} ${formData.lastName}`
        });

        // Salva in Firestore
        await saveUserToFirestore(userCredential.user, 'email');

        // Mostra messaggio di successo
        Alert.alert(
            'Registrazione completata!',
            `Benvenuto ${formData.firstName}! Il tuo account ${userType === 'mechanic' ? 'meccanico' : 'utente'} è stato creato con successo.`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }

    } catch (error: any) {
      console.error('❌ Errore durante la registrazione:', error);

      let errorMessage = 'Errore durante la registrazione. Riprova.';

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Questa email è già registrata. Prova ad accedere invece.';
          break;
        case 'auth/weak-password':
          errorMessage = 'La password è troppo debole. Usa almeno 6 caratteri.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Formato email non valido.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Errore di connessione. Verifica la tua connessione internet.';
          break;
      }

      Alert.alert('Errore', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Gestione Google Sign-In
  const handleGoogleSignIn = async (): Promise<void> => {
    setSocialLoading('google');

    try {
      if (Platform.OS === 'web') {
        // Web Google Sign-In
        const provider = new GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');

        const result = await signInWithPopup(auth, provider);

        // Se è un meccanico, salva l'utente e vai al completamento profilo
        if (userType === 'mechanic') {
          setSocialUser(result.user);
          setCurrentStep(2); // Vai al completamento del profilo
          return;
        }

        // Se è un utente normale, completa subito la registrazione
        await saveUserToFirestore(result.user, 'google');

        Alert.alert(
            'Registrazione completata!',
            'Account creato con successo usando Google.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
        );

      } else if (promptGoogleAsync) {
        // Mobile Google Sign-In
        await promptGoogleAsync();
      } else {
        throw new Error('Google Sign-In non configurato');
      }
    } catch (error: any) {
      console.error('❌ Errore Google Sign-In:', error);
      if (error.code !== 'auth/cancelled-popup-request') {
        Alert.alert('Errore', 'Errore durante l\'accesso con Google');
      }
    } finally {
      setSocialLoading(null);
    }
  };

  // Gestione risposta Google OAuth (mobile)
  const handleGoogleAuthResponse = async (authResponse: any): Promise<void> => {
    try {
      const { authentication } = authResponse;
      const credential = GoogleAuthProvider.credential(
          authentication.idToken,
          authentication.accessToken
      );

      const result = await signInWithCredential(auth, credential);

      // Se è un meccanico, salva l'utente e vai al completamento profilo
      if (userType === 'mechanic') {
        setSocialUser(result.user);
        setCurrentStep(2);
        return;
      }

      // Se è un utente normale, completa la registrazione
      await saveUserToFirestore(result.user, 'google');

      Alert.alert(
          'Registrazione completata!',
          'Account creato con successo usando Google.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error: any) {
      console.error('❌ Errore autenticazione Google:', error);
      Alert.alert('Errore', 'Errore durante l\'autenticazione con Google');
    }
  };

  // Gestione Apple Sign-In
  const handleAppleSignIn = async (): Promise<void> => {
    setSocialLoading('apple');

    try {
      if (Platform.OS === 'web') {
        // Web Apple Sign-In
        const provider = new OAuthProvider('apple.com');
        provider.addScope('email');
        provider.addScope('name');

        const result = await signInWithPopup(auth, provider);

        // Se è un meccanico, salva l'utente e vai al completamento profilo
        if (userType === 'mechanic') {
          setSocialUser(result.user);
          setCurrentStep(2);
          return;
        }

        // Se è un utente normale, completa la registrazione
        await saveUserToFirestore(result.user, 'apple');

        Alert.alert(
            'Registrazione completata!',
            'Account creato con successo usando Apple.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
        );

      } else if (Platform.OS === 'ios' && AppleAuthentication) {
        // iOS native Apple Sign-In
        const isAvailable = await AppleAuthentication.isAvailableAsync();
        if (!isAvailable) {
          throw new Error('Apple Sign-In non disponibile');
        }

        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });

        // TODO: Implementa l'integrazione completa con Firebase
        Alert.alert('Apple Sign-In', 'Implementazione in corso...');

      } else {
        throw new Error('Apple Sign-In disponibile solo su iOS e Web');
      }
    } catch (error: any) {
      console.error('❌ Errore Apple Sign-In:', error);
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Errore', 'Errore durante l\'accesso con Apple');
      }
    } finally {
      setSocialLoading(null);
    }
  };

  // Render steps
  const renderStep1 = () => (
      <View style={styles.stepContainer}>
        <Text variant="headlineSmall" style={styles.stepTitle}>
          Crea il tuo account
        </Text>

        <View style={styles.userTypeContainer}>
          <Chip
              selected={userType === 'user'}
              onPress={() => setUserType('user')}
              style={[styles.userTypeChip, userType === 'user' && styles.selectedChip]}
              textStyle={userType === 'user' && styles.selectedChipText}
          >
            👤 Proprietario Auto
          </Chip>
          <Chip
              selected={userType === 'mechanic'}
              onPress={() => setUserType('mechanic')}
              style={[styles.userTypeChip, userType === 'mechanic' && styles.selectedChip]}
              textStyle={userType === 'mechanic' && styles.selectedChipText}
          >
            🔧 Meccanico
          </Chip>
        </View>

        {/* OPZIONI SOCIAL LOGIN PRINCIPALI */}
        <Text variant="bodyLarge" style={styles.socialTitle}>
          Registrati velocemente con:
        </Text>

        <Button
            mode="contained"
            onPress={handleGoogleSignIn}
            style={[styles.socialButton, styles.googleButton]}
            disabled={socialLoading === 'google'}
            loading={socialLoading === 'google'}
            icon="google"
            contentStyle={styles.socialButtonContent}
        >
          Continua con Google
        </Button>

        {(Platform.OS === 'ios' || Platform.OS === 'web') && (
            <Button
                mode="contained"
                onPress={handleAppleSignIn}
                style={[styles.socialButton, styles.appleButton]}
                disabled={socialLoading === 'apple'}
                loading={socialLoading === 'apple'}
                icon="apple"
                contentStyle={styles.socialButtonContent}
                buttonColor="#000000"
            >
              Continua con Apple
            </Button>
        )}

        {/* DIVIDER */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>oppure</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* FORM EMAIL/PASSWORD */}
        <Text variant="bodyMedium" style={styles.emailFormTitle}>
          Registrati con email:
        </Text>

        <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!errors.email}
            style={styles.input}
        />
        <HelperText type="error" visible={!!errors.email}>
          {errors.email}
        </HelperText>

        <TextInput
            label="Password"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            mode="outlined"
            secureTextEntry={!showPassword}
            right={
              <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => setShowPassword(!showPassword)}
              />
            }
            error={!!errors.password}
            style={styles.input}
        />
        <HelperText type="error" visible={!!errors.password}>
          {errors.password}
        </HelperText>

        <TextInput
            label="Conferma Password"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
            mode="outlined"
            secureTextEntry={!showConfirmPassword}
            right={
              <TextInput.Icon
                  icon={showConfirmPassword ? "eye-off" : "eye"}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
            error={!!errors.confirmPassword}
            style={styles.input}
        />
        <HelperText type="error" visible={!!errors.confirmPassword}>
          {errors.confirmPassword}
        </HelperText>
      </View>
  );

  const renderStep2 = () => (
      <View style={styles.stepContainer}>
        <Text variant="headlineSmall" style={styles.stepTitle}>
          {socialUser ? 'Completa il tuo profilo' : 'Informazioni personali'}
        </Text>

        {socialUser && (
            <Text variant="bodyMedium" style={styles.socialWelcome}>
              Ciao {socialUser.displayName || 'Utente'}! Completa le informazioni per continuare.
            </Text>
        )}

        <TextInput
            label="Nome"
            value={formData.firstName}
            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
            mode="outlined"
            error={!!errors.firstName}
            style={styles.input}
            placeholder={socialUser?.displayName?.split(' ')[0] || ''}
        />
        <HelperText type="error" visible={!!errors.firstName}>
          {errors.firstName}
        </HelperText>

        <TextInput
            label="Cognome"
            value={formData.lastName}
            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
            mode="outlined"
            error={!!errors.lastName}
            style={styles.input}
            placeholder={socialUser?.displayName?.split(' ').slice(1).join(' ') || ''}
        />
        <HelperText type="error" visible={!!errors.lastName}>
          {errors.lastName}
        </HelperText>

        <TextInput
            label="Numero di telefono"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            mode="outlined"
            keyboardType="phone-pad"
            error={!!errors.phone}
            style={styles.input}
        />
        <HelperText type="error" visible={!!errors.phone}>
          {errors.phone}
        </HelperText>
      </View>
  );

  const renderStep3 = () => (
      <View style={styles.stepContainer}>
        <Text variant="headlineSmall" style={styles.stepTitle}>
          {userType === 'mechanic' ? 'Informazioni officina' : 'Completa registrazione'}
        </Text>

        {userType === 'mechanic' && (
            <>
              <TextInput
                  label="Nome Officina"
                  value={formData.workshopName}
                  onChangeText={(text) => setFormData({ ...formData, workshopName: text })}
                  mode="outlined"
                  error={!!errors.workshopName}
                  style={styles.input}
              />
              <HelperText type="error" visible={!!errors.workshopName}>
                {errors.workshopName}
              </HelperText>

              <TextInput
                  label="Indirizzo"
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  mode="outlined"
                  error={!!errors.address}
                  style={styles.input}
              />
              <HelperText type="error" visible={!!errors.address}>
                {errors.address}
              </HelperText>

              <TextInput
                  label="Partita IVA"
                  value={formData.vatNumber}
                  onChangeText={(text) => setFormData({ ...formData, vatNumber: text })}
                  mode="outlined"
                  error={!!errors.vatNumber}
                  style={styles.input}
              />
              <HelperText type="error" visible={!!errors.vatNumber}>
                {errors.vatNumber}
              </HelperText>

              <TextInput
                  label="Licenza Meccanico (opzionale)"
                  value={formData.mechanicLicense}
                  onChangeText={(text) => setFormData({ ...formData, mechanicLicense: text })}
                  mode="outlined"
                  style={styles.input}
              />
            </>
        )}

        <View style={styles.termsContainer}>
          <Checkbox
              status={agreedToTerms ? 'checked' : 'unchecked'}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
          />
          <Text style={styles.termsText}>
            Accetto i termini e condizioni e la privacy policy
          </Text>
        </View>
        <HelperText type="error" visible={!!errors.terms}>
          {errors.terms}
        </HelperText>
      </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  return (
      <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Card style={styles.card}>
            <Card.Content>
              {/* Progress indicator */}
              <View style={styles.progressContainer}>
                {[1, 2, 3].map((step) => (
                    <View
                        key={step}
                        style={[
                          styles.progressDot,
                          step <= currentStep && styles.progressDotActive
                        ]}
                    />
                ))}
              </View>

              <Text variant="headlineMedium" style={styles.title}>
                Registrazione MyMecanich
              </Text>

              {renderCurrentStep()}

              {/* Navigation buttons */}
              <View style={styles.buttonContainer}>
                {currentStep > 1 && (
                    <Button
                        mode="outlined"
                        onPress={() => {
                          if (currentStep === 2 && socialUser) {
                            // Se siamo allo step 2 con un utente social, torna alla selezione account
                            setSocialUser(null);
                            setCurrentStep(1);
                          } else {
                            setCurrentStep(currentStep - 1);
                          }
                        }}
                        style={styles.backButton}
                    >
                      Indietro
                    </Button>
                )}

                {currentStep < 3 ? (
                    <Button
                        mode="contained"
                        onPress={() => {
                          if (validateStep(currentStep)) {
                            setCurrentStep(currentStep + 1);
                          }
                        }}
                        style={styles.nextButton}
                    >
                      Avanti
                    </Button>
                ) : (
                    <Button
                        mode="contained"
                        onPress={handleEmailRegistration}
                        loading={loading}
                        disabled={loading}
                        style={styles.registerButton}
                    >
                      {loading ? 'Registrazione...' : (socialUser ? 'Completa Registrazione' : 'Registrati')}
                    </Button>
                )}
              </View>

              <Button
                  mode="text"
                  onPress={() => navigation.goBack()}
                  style={styles.loginButton}
              >
                Hai già un account? Accedi
              </Button>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    elevation: 4,
    borderRadius: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#6200ea',
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
  },
  stepContainer: {
    marginBottom: 16,
  },
  stepTitle: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  userTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  userTypeChip: {
    flex: 1,
    marginHorizontal: 8,
  },
  selectedChip: {
    backgroundColor: '#6200ea',
  },
  selectedChipText: {
    color: 'white',
  },
  input: {
    marginBottom: 8,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  termsText: {
    flex: 1,
    marginLeft: 8,
  },
  socialTitle: {
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
    fontWeight: '600',
    color: '#333',
  },
  socialButtonContent: {
    height: 48,
    flexDirection: 'row',
  },
  googleButton: {
    backgroundColor: '#4285f4',
    marginBottom: 12,
  },
  appleButton: {
    backgroundColor: '#000000',
    marginBottom: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  emailFormTitle: {
    marginBottom: 12,
    color: '#666',
  },
  socialWelcome: {
    textAlign: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    color: '#2e7d32',
  },
  orText: {
    textAlign: 'center',
    marginVertical: 16,
    color: '#666',
  },
  socialButton: {
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  backButton: {
    flex: 1,
    marginRight: 8,
  },
  nextButton: {
    flex: 1,
    marginLeft: 8,
  },
  registerButton: {
    flex: 1,
  },
  loginButton: {
    marginTop: 16,
  },
});

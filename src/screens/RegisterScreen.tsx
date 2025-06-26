// src/screens/RegisterScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  Platform,
  StyleSheet,
  ScrollView,
  View,
  KeyboardAvoidingView,
  Alert,
  TouchableOpacity
} from 'react-native';
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
  Chip,
  Divider,
  IconButton
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Firebase imports
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  updateProfile,
  signInWithCredential,
  User as FirebaseUser,
  AuthCredential
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

// Expo imports condizionali
let AuthSession: any = null;
let AppleAuthentication: any = null;
let WebBrowser: any = null;

if (Platform.OS !== 'web') {
  try {
    AuthSession = require('expo-auth-session');
    AppleAuthentication = require('expo-apple-authentication');
    WebBrowser = require('expo-web-browser');
    WebBrowser.maybeCompleteAuthSession();
  } catch (error) {
    console.log('OAuth libraries not available');
  }
}

// Configurazione Google OAuth
const GOOGLE_CONFIG = {
  clientId: Platform.select({
    ios: '619020396283-i5qvfa2fnri304g3nndjrob5flhfrp5r.apps.googleusercontent.com',
    android: '619020396283-hsb93gobbbuokvc80idf466ptlh7fmdi.apps.googleusercontent.com',
    web: '619020396283-4gd2pd371hop6d1vkc0tvo6j3jaod2t6.apps.googleusercontent.com',
    default: '619020396283-hsb93gobbbuokvc80idf466ptlh7fmdi.apps.googleusercontent.com'
  }),
  scopes: ['openid', 'profile', 'email'],
};

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
type SocialProvider = 'google' | 'apple' | null;

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
  createdAt: any;
  updatedAt: any;
}

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useTheme();

  // Stati principali
  const [currentStep, setCurrentStep] = useState(0); // 0: tipo utente, 1: credenziali, 2: dati personali, 3: conferma
  const [userType, setUserType] = useState<UserType>('user');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider>(null);
  const [socialUser, setSocialUser] = useState<FirebaseUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Dati del form
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

  // Errori di validazione
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Configurazione Google OAuth per mobile
  const [googleRequest, googleResponse, promptGoogleAsync] = AuthSession?.useAuthRequest ?
      AuthSession.useAuthRequest(
          {
            clientId: GOOGLE_CONFIG.clientId,
            scopes: GOOGLE_CONFIG.scopes,
            redirectUri: AuthSession.makeRedirectUri({
              scheme: 'com.mymeccanick',
              useProxy: true,
            }),
          },
          { authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth' }
      ) : [null, null, null];

  // Effetti per gestire le risposte OAuth
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      handleGoogleAuthResponse(googleResponse);
    } else if (googleResponse?.type === 'error') {
      console.error('Google OAuth Error:', googleResponse.error);
      setSocialLoading(null);
      Alert.alert('Errore', 'Errore durante l\'autenticazione con Google');
    }
  }, [googleResponse]);

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

    // Step 0: selezione tipo utente - nessuna validazione necessaria
    if (step === 0) {
      return true;
    }

    // Step 1: credenziali email/password
    if (step === 1) {
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

    // Step 2: dati personali
    if (step === 2) {
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

    // Step 3: dati officina (solo per meccanici)
    if (step === 3 && userType === 'mechanic') {
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

    // Step finale: termini e condizioni
    const isFinalStep = (step === 3 && userType === 'user') || (step === 4 && userType === 'mechanic');
    if (isFinalStep && !agreedToTerms) {
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
        userType,
        loginProvider,
        profileComplete: loginProvider === 'email',
        verified: user.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Aggiungi dati specifici per meccanici
      if (userType === 'mechanic') {
        userData.workshopName = formData.workshopName;
        userData.address = formData.address;
        userData.vatNumber = formData.vatNumber;
        userData.mechanicLicense = formData.mechanicLicense;
        userData.rating = 0;
        userData.reviewsCount = 0;
      }

      // Verifica se l'utente esiste già
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), userData);
        console.log('✅ Utente salvato in Firestore:', userData);
      } else {
        console.log('ℹ️ Utente già esistente in Firestore');
      }
    } catch (error) {
      console.error('❌ Errore salvataggio Firestore:', error);
      throw error;
    }
  };

  // Registrazione con email e password
  const handleEmailRegistration = async (): Promise<void> => {
    if (!validateStep(userType === 'mechanic' ? 4 : 3)) {
      return;
    }

    setLoading(true);

    try {
      // Crea l'account Firebase
      const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
      );

      // Aggiorna il profilo con il nome completo
      await updateProfile(userCredential.user, {
        displayName: `${formData.firstName} ${formData.lastName}`
      });

      // Salva i dati in Firestore
      await saveUserToFirestore(userCredential.user, 'email');

      Alert.alert(
          'Registrazione completata!',
          'Account creato con successo. Verifica la tua email per completare l\'attivazione.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error: any) {
      console.error('❌ Errore registrazione email:', error);
      let errorMessage = 'Errore durante la registrazione';

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Questa email è già registrata';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email non valida';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password troppo debole';
          break;
        default:
          errorMessage = error.message || 'Errore durante la registrazione';
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
      const { access_token } = authResponse.params;
      const credential = GoogleAuthProvider.credential(null, access_token);

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
    } finally {
      setSocialLoading(null);
    }
  };

  // Gestione Apple Sign-In
  const handleAppleSignIn = async (): Promise<void> => {
    setSocialLoading('apple');

    try {
      // Controlla se siamo in ambiente di sviluppo
      const isExpoGo = __DEV__ && Platform.OS === 'ios';

      if (isExpoGo) {
        // Durante lo sviluppo con Expo Go, mostra un messaggio informativo
        Alert.alert(
            'Apple Sign-In in sviluppo',
            'Apple Sign-In richiede un build personalizzato dell\'app. Durante lo sviluppo con Expo Go, questa funzionalità non è disponibile.\n\nPer testare Apple Sign-In:\n1. Usa "expo build" o "eas build"\n2. Oppure testa su web/Android con Google Sign-In',
            [
              { text: 'OK', style: 'default' },
              {
                text: 'Usa Google invece',
                onPress: () => {
                  setSocialLoading(null);
                  handleGoogleSignIn();
                }
              }
            ]
        );
        return;
      }

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

      } else if (AppleAuthentication) {
        // Mobile Apple Sign-In (solo con build personalizzato)
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

        // Crea il provider Apple per Firebase
        const provider = new OAuthProvider('apple.com');
        const authCredential = provider.credential({
          idToken: credential.identityToken!,
          rawNonce: credential.realUserStatus?.toString(),
        });

        const result = await signInWithCredential(auth, authCredential);

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

      } else {
        throw new Error('Apple Sign-In non configurato');
      }
    } catch (error: any) {
      console.error('❌ Errore Apple Sign-In:', error);

      // Gestione errori specifici
      if (error.code === 'auth/invalid-credential') {
        Alert.alert(
            'Errore configurazione',
            'Apple Sign-In non è configurato correttamente per questo ambiente. Durante lo sviluppo, usa Google Sign-In o testa su un build di produzione.',
            [
              { text: 'OK', style: 'default' },
              {
                text: 'Usa Google',
                onPress: () => {
                  setSocialLoading(null);
                  handleGoogleSignIn();
                }
              }
            ]
        );
      } else if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Errore', 'Errore durante l\'accesso con Apple');
      }
    } finally {
      setSocialLoading(null);
    }
  };

  // Completamento profilo per utenti social che diventano meccanici
  const completeSocialMechanicProfile = async (): Promise<void> => {
    if (!socialUser || !validateStep(4)) {
      return;
    }

    setLoading(true);

    try {
      await saveUserToFirestore(socialUser, socialUser.providerData[0]?.providerId || 'social');

      Alert.alert(
          'Registrazione completata!',
          'Profilo meccanico completato con successo.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error: any) {
      console.error('❌ Errore completamento profilo:', error);
      Alert.alert('Errore', 'Errore durante il completamento del profilo');
    } finally {
      setLoading(false);
    }
  };

  // Navigazione tra gli step
  const nextStep = (): void => {
    const maxStep = userType === 'mechanic' ? 4 : 3;

    if (currentStep < maxStep) {
      // Step 0 (selezione tipo utente) non ha validazione
      if (currentStep === 0) {
        setCurrentStep(currentStep + 1);
      } else {
        // Per gli altri step, valida prima di procedere
        if (validateStep(currentStep)) {
          setCurrentStep(currentStep + 1);
        }
      }
    } else {
      // Ultimo step - valida e completa registrazione
      if (validateStep(currentStep)) {
        if (socialUser) {
          completeSocialMechanicProfile();
        } else {
          handleEmailRegistration();
        }
      }
    }
  };

  const prevStep = (): void => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Aggiornamento dati del form
  const updateFormData = (field: keyof FormData, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Rimuovi l'errore se presente
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Render dei diversi step
  const renderUserTypeSelection = () => (
      <View style={styles.stepContainer}>
        <Text variant="headlineSmall" style={styles.stepTitle}>
          Che tipo di account vuoi creare?
        </Text>

        <TouchableOpacity
            onPress={() => setUserType('user')}
            style={[
              styles.userTypeCard,
              userType === 'user' && styles.userTypeCardSelected
            ]}
        >
          <MaterialCommunityIcons
              name="account"
              size={48}
              color={userType === 'user' ? theme.colors.primary : theme.colors.onSurface}
          />
          <Text variant="titleMedium" style={{ marginTop: 8 }}>Proprietario Auto</Text>
          <Text variant="bodySmall" style={{ textAlign: 'center', marginTop: 4 }}>
            Gestisci la manutenzione delle tue automobili
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
            onPress={() => setUserType('mechanic')}
            style={[
              styles.userTypeCard,
              userType === 'mechanic' && styles.userTypeCardSelected
            ]}
        >
          <MaterialCommunityIcons
              name="wrench"
              size={48}
              color={userType === 'mechanic' ? theme.colors.primary : theme.colors.onSurface}
          />
          <Text variant="titleMedium" style={{ marginTop: 8 }}>Meccanico/Officina</Text>
          <Text variant="bodySmall" style={{ textAlign: 'center', marginTop: 4 }}>
            Gestisci i tuoi clienti e i servizi offerti
          </Text>
        </TouchableOpacity>
      </View>
  );

  const renderCredentialsStep = () => (
      <View style={styles.stepContainer}>
        <Text variant="headlineSmall" style={styles.stepTitle}>
          Crea il tuo account
        </Text>

        {/* Bottoni Social Login */}
        <Button
            mode="outlined"
            onPress={handleGoogleSignIn}
            loading={socialLoading === 'google'}
            disabled={loading || socialLoading !== null}
            icon="google"
            style={styles.socialButton}
        >
          Registrati con Google
        </Button>

        {Platform.OS === 'ios' && (
            <Button
                mode="outlined"
                onPress={handleAppleSignIn}
                loading={socialLoading === 'apple'}
                disabled={loading || socialLoading !== null}
                icon="apple"
                style={styles.socialButton}
            >
              Registrati con Apple
            </Button>
        )}

        <View style={styles.dividerContainer}>
          <Divider style={styles.divider} />
          <Text variant="bodySmall" style={styles.dividerText}>OPPURE</Text>
          <Divider style={styles.divider} />
        </View>

        {/* Form Email/Password */}
        <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => updateFormData('email', text)}
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
            onChangeText={(text) => updateFormData('password', text)}
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
            onChangeText={(text) => updateFormData('confirmPassword', text)}
            secureTextEntry={!showPassword}
            error={!!errors.confirmPassword}
            style={styles.input}
        />
        <HelperText type="error" visible={!!errors.confirmPassword}>
          {errors.confirmPassword}
        </HelperText>
      </View>
  );

  const renderPersonalDataStep = () => (
      <View style={styles.stepContainer}>
        <Text variant="headlineSmall" style={styles.stepTitle}>
          Dati personali
        </Text>

        <TextInput
            label="Nome"
            value={formData.firstName}
            onChangeText={(text) => updateFormData('firstName', text)}
            error={!!errors.firstName}
            style={styles.input}
        />
        <HelperText type="error" visible={!!errors.firstName}>
          {errors.firstName}
        </HelperText>

        <TextInput
            label="Cognome"
            value={formData.lastName}
            onChangeText={(text) => updateFormData('lastName', text)}
            error={!!errors.lastName}
            style={styles.input}
        />
        <HelperText type="error" visible={!!errors.lastName}>
          {errors.lastName}
        </HelperText>

        <TextInput
            label="Numero di telefono"
            value={formData.phone}
            onChangeText={(text) => updateFormData('phone', text)}
            keyboardType="phone-pad"
            error={!!errors.phone}
            style={styles.input}
        />
        <HelperText type="error" visible={!!errors.phone}>
          {errors.phone}
        </HelperText>
      </View>
  );

  const renderMechanicDataStep = () => (
      <View style={styles.stepContainer}>
        <Text variant="headlineSmall" style={styles.stepTitle}>
          Dati officina
        </Text>

        <TextInput
            label="Nome officina"
            value={formData.workshopName}
            onChangeText={(text) => updateFormData('workshopName', text)}
            error={!!errors.workshopName}
            style={styles.input}
        />
        <HelperText type="error" visible={!!errors.workshopName}>
          {errors.workshopName}
        </HelperText>

        <TextInput
            label="Indirizzo"
            value={formData.address}
            onChangeText={(text) => updateFormData('address', text)}
            multiline
            numberOfLines={2}
            error={!!errors.address}
            style={styles.input}
        />
        <HelperText type="error" visible={!!errors.address}>
          {errors.address}
        </HelperText>

        <TextInput
            label="Partita IVA"
            value={formData.vatNumber}
            onChangeText={(text) => updateFormData('vatNumber', text)}
            error={!!errors.vatNumber}
            style={styles.input}
        />
        <HelperText type="error" visible={!!errors.vatNumber}>
          {errors.vatNumber}
        </HelperText>

        <TextInput
            label="Numero licenza meccanico (opzionale)"
            value={formData.mechanicLicense}
            onChangeText={(text) => updateFormData('mechanicLicense', text)}
            style={styles.input}
        />
      </View>
  );

  const renderTermsStep = () => (
      <View style={styles.stepContainer}>
        <Text variant="headlineSmall" style={styles.stepTitle}>
          Termini e condizioni
        </Text>

        <View style={styles.termsContainer}>
          <Checkbox
              status={agreedToTerms ? 'checked' : 'unchecked'}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
          />
          <View style={styles.termsTextContainer}>
            <Text variant="bodyMedium">
              Accetto i{' '}
              <Text
                  style={styles.linkText}
                  onPress={() => setShowTermsModal(true)}
              >
                termini e condizioni
              </Text>
              {' '}e la{' '}
              <Text
                  style={styles.linkText}
                  onPress={() => setShowTermsModal(true)}
              >
                privacy policy
              </Text>
            </Text>
          </View>
        </View>
        <HelperText type="error" visible={!!errors.terms}>
          {errors.terms}
        </HelperText>

        <Text variant="bodySmall" style={styles.summaryText}>
          Stai per creare un account come{' '}
          <Text style={{ fontWeight: 'bold' }}>
            {userType === 'mechanic' ? 'Meccanico/Officina' : 'Proprietario Auto'}
          </Text>
          {socialUser ? ' utilizzando il tuo account social.' : ' con email e password.'}
        </Text>
      </View>
  );

  // Render principale
  return (
      <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
        >
          <Card style={styles.card}>
            <Card.Content>
              {/* Progress indicator */}
              <View style={styles.progressContainer}>
                {Array.from({ length: userType === 'mechanic' ? 5 : 4 }, (_, i) => (
                    <View
                        key={i}
                        style={[
                          styles.progressDot,
                          i <= currentStep && styles.progressDotActive
                        ]}
                    />
                ))}
              </View>

              {/* Contenuto dello step corrente */}
              {currentStep === 0 && renderUserTypeSelection()}
              {currentStep === 1 && renderCredentialsStep()}
              {currentStep === 2 && renderPersonalDataStep()}
              {currentStep === 3 && userType === 'mechanic' && renderMechanicDataStep()}
              {((currentStep === 3 && userType === 'user') ||
                  (currentStep === 4 && userType === 'mechanic')) && renderTermsStep()}

              {/* Bottoni di navigazione */}
              <View style={styles.buttonContainer}>
                {currentStep > 0 && (
                    <Button
                        mode="outlined"
                        onPress={prevStep}
                        disabled={loading || socialLoading !== null}
                        style={styles.navigationButton}
                    >
                      Indietro
                    </Button>
                )}

                {currentStep === 0 ? (
                    <Button
                        mode="contained"
                        onPress={nextStep}
                        style={styles.navigationButton}
                    >
                      Continua
                    </Button>
                ) : (
                    <Button
                        mode="contained"
                        onPress={nextStep}
                        loading={loading}
                        disabled={loading || socialLoading !== null}
                        style={styles.navigationButton}
                    >
                      {((currentStep === 3 && userType === 'user') ||
                          (currentStep === 4 && userType === 'mechanic'))
                          ? 'Completa registrazione'
                          : 'Continua'
                      }
                    </Button>
                )}
              </View>

              {/* Link per tornare al login */}
              <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.loginLinkContainer}
              >
                <Text variant="bodyMedium" style={styles.loginLink}>
                  Hai già un account? Accedi
                </Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </ScrollView>

        {/* Modal per termini e condizioni */}
        <Portal>
          <Modal
              visible={showTermsModal}
              onDismiss={() => setShowTermsModal(false)}
              contentContainerStyle={styles.modalContainer}
          >
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Termini e Condizioni
            </Text>
            <ScrollView style={styles.modalContent}>
              <Text variant="bodyMedium">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit...
                {/* Inserisci qui i tuoi termini e condizioni reali */}
              </Text>
            </ScrollView>
            <Button
                mode="contained"
                onPress={() => setShowTermsModal(false)}
                style={styles.modalButton}
            >
              Chiudi
            </Button>
          </Modal>
        </Portal>
      </KeyboardAvoidingView>
  );
};

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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  progressDotActive: {
    backgroundColor: '#6200ee',
  },
  stepContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  userTypeCard: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  userTypeCardSelected: {
    borderColor: '#6200ee',
    backgroundColor: '#f3e5f5',
  },
  socialButton: {
    marginBottom: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
  },
  input: {
    marginBottom: 8,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  termsTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  linkText: {
    color: '#6200ee',
    textDecorationLine: 'underline',
  },
  summaryText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
  },
  navigationButton: {
    flex: 1,
  },
  loginLinkContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  loginLink: {
    color: '#6200ee',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  modalContent: {
    maxHeight: 300,
    marginBottom: 16,
  },
  modalButton: {
    alignSelf: 'stretch',
  },
});

export default RegisterScreen;

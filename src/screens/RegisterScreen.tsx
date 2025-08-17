// src/screens/RegisterScreen.tsx - VERSIONE AGGIORNATA CON INSERIMENTO DATI AUTO/OFFICINA
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  HelperText,
  Divider,
  Card,
  IconButton,
  Chip,
  ProgressBar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Firebase imports
import { auth, db } from '../services/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Google Sign-In
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
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

const { width: screenWidth } = Dimensions.get('window');

// Interfacce
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

interface CarData {
  brand: string;
  model: string;
  year: string;
  licensePlate: string;
  vin: string;
  fuelType: string;
  kilometers: string;
}

type UserType = 'user' | 'mechanic';
type SocialProvider = 'google' | 'apple' | null;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Stati principali
  const [currentStep, setCurrentStep] = useState(0);
  const [userType, setUserType] = useState<UserType>('user');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider>(null);
  const [socialUser, setSocialUser] = useState<FirebaseUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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

  // Dati auto (per utenti normali)
  const [carDataList, setCarDataList] = useState<CarData[]>([]);
  const [currentCarData, setCurrentCarData] = useState<CarData>({
    brand: '',
    model: '',
    year: '',
    licensePlate: '',
    vin: '',
    fuelType: 'gasoline',
    kilometers: ''
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
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Credenziali
        if (!formData.email || !validateEmail(formData.email)) {
          newErrors.email = 'Email non valida';
        }
        if (!formData.password || formData.password.length < 6) {
          newErrors.password = 'La password deve avere almeno 6 caratteri';
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Le password non coincidono';
        }
        break;

      case 2: // Dati personali
        if (!formData.firstName) {
          newErrors.firstName = 'Nome obbligatorio';
        }
        if (!formData.lastName) {
          newErrors.lastName = 'Cognome obbligatorio';
        }
        if (!formData.phone || !validatePhone(formData.phone)) {
          newErrors.phone = 'Numero di telefono non valido';
        }
        break;

      case 3: // Dati specifici (auto o officina)
        if (userType === 'mechanic') {
          if (!formData.workshopName) {
            newErrors.workshopName = 'Nome officina obbligatorio';
          }
          if (!formData.address) {
            newErrors.address = 'Indirizzo obbligatorio';
          }
          if (!formData.vatNumber) {
            newErrors.vatNumber = 'Partita IVA obbligatoria';
          }
        } else {
          // Per utenti normali, almeno un'auto deve essere inserita
          if (carDataList.length === 0 && !currentCarData.brand) {
            newErrors.car = 'Inserisci almeno un\'automobile';
          }
        }
        break;

      case 4: // Termini e condizioni
        if (!agreedToTerms) {
          newErrors.terms = 'Devi accettare i termini e condizioni';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Aggiunta auto alla lista
  const addCar = () => {
    if (!currentCarData.brand || !currentCarData.model || !currentCarData.licensePlate) {
      Alert.alert('Errore', 'Inserisci almeno marca, modello e targa');
      return;
    }

    setCarDataList([...carDataList, currentCarData]);
    setCurrentCarData({
      brand: '',
      model: '',
      year: '',
      licensePlate: '',
      vin: '',
      fuelType: 'gasoline',
      kilometers: ''
    });
  };

  // Rimozione auto dalla lista
  const removeCar = (index: number) => {
    setCarDataList(carDataList.filter((_, i) => i !== index));
  };

  // Salvataggio utente su Firestore
  const saveUserToFirestore = async (user: FirebaseUser, provider: string) => {
    try {
      const userData = {
        uid: user.uid,
        email: user.email,
        firstName: formData.firstName || user.displayName?.split(' ')[0] || '',
        lastName: formData.lastName || user.displayName?.split(' ')[1] || '',
        phone: formData.phone || '',
        userType: userType,
        loginProvider: provider,
        profileComplete: true,
        verified: user.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Aggiungi dati specifici per tipo utente
      if (userType === 'mechanic') {
        Object.assign(userData, {
          workshopName: formData.workshopName,
          address: formData.address,
          vatNumber: formData.vatNumber,
          mechanicLicense: formData.mechanicLicense,
          rating: 0,
          reviewsCount: 0,
        });
      }

      await setDoc(doc(db, 'users', user.uid), userData);

      // Se è un utente normale, salva anche le auto
      if (userType === 'user' && carDataList.length > 0) {
        for (const car of carDataList) {
          await setDoc(doc(db, 'users', user.uid, 'cars', car.licensePlate), {
            ...car,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }

      console.log('✅ Utente salvato su Firestore');
    } catch (error) {
      console.error('❌ Errore salvataggio Firestore:', error);
      throw error;
    }
  };

  // Gestione registrazione con email
  const handleEmailRegister = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      await saveUserToFirestore(userCredential.user, 'email');

      Alert.alert(
        'Registrazione completata!',
        'Account creato con successo. Verifica la tua email per completare l\'attivazione.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error: any) {
      console.error('❌ Errore registrazione:', error);
      Alert.alert('Errore', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Gestione Google Sign-In
  const handleGoogleSignIn = async () => {
    setSocialLoading('google');

    try {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        setSocialUser(result.user);
        setCurrentStep(2); // Vai ai dati personali
      } else if (promptGoogleAsync) {
        await promptGoogleAsync();
      }
    } catch (error: any) {
      console.error('❌ Errore Google Sign-In:', error);
      Alert.alert('Errore', 'Errore durante l\'accesso con Google');
    } finally {
      setSocialLoading(null);
    }
  };

  // Gestione risposta Google OAuth
  const handleGoogleAuthResponse = async (response: any) => {
    try {
      const { access_token } = response.params;
      const credential = GoogleAuthProvider.credential(null, access_token);
      const result = await signInWithCredential(auth, credential);
      setSocialUser(result.user);
      setCurrentStep(2); // Vai ai dati personali
    } catch (error: any) {
      console.error('❌ Errore autenticazione Google:', error);
      Alert.alert('Errore', 'Errore durante l\'autenticazione con Google');
    } finally {
      setSocialLoading(null);
    }
  };

  // Navigazione tra step
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Rendering degli step
  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      <ProgressBar
        progress={(currentStep + 1) / 5}
        color={theme.colors.primary}
        style={styles.progressBar}
      />
      <Text variant="bodySmall" style={styles.stepText}>
        Passo {currentStep + 1} di 5
      </Text>
    </View>
  );

  const renderUserTypeSelection = () => (
    <View style={styles.stepContainer}>
      <Text variant="headlineMedium" style={styles.stepTitle}>
        Come vuoi utilizzare l'app?
      </Text>
      <Text variant="bodyMedium" style={styles.stepSubtitle}>
        Scegli il tipo di account più adatto alle tue esigenze
      </Text>

      <View style={styles.userTypeContainer}>
        <TouchableOpacity
          style={[
            styles.userTypeCard,
            userType === 'user' && styles.userTypeCardSelected
          ]}
          onPress={() => {
            setUserType('user');
            nextStep();
          }}
        >
          <MaterialCommunityIcons
            name="car"
            size={48}
            color={userType === 'user' ? theme.colors.primary : theme.colors.onSurface}
          />
          <Text variant="titleMedium" style={{ marginTop: 8 }}>
            Proprietario Auto
          </Text>
          <Text variant="bodySmall" style={{ textAlign: 'center', marginTop: 4 }}>
            Gestisci la manutenzione delle tue auto
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.userTypeCard,
            userType === 'mechanic' && styles.userTypeCardSelected
          ]}
          onPress={() => {
            setUserType('mechanic');
            nextStep();
          }}
        >
          <MaterialCommunityIcons
            name="wrench"
            size={48}
            color={userType === 'mechanic' ? theme.colors.primary : theme.colors.onSurface}
          />
          <Text variant="titleMedium" style={{ marginTop: 8 }}>
            Meccanico/Officina
          </Text>
          <Text variant="bodySmall" style={{ textAlign: 'center', marginTop: 4 }}>
            Gestisci clienti e servizi
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCredentialsStep = () => (
    <View style={styles.stepContainer}>
      <Text variant="headlineSmall" style={styles.stepTitle}>
        Crea il tuo account
      </Text>

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
          onPress={() => Alert.alert('Apple Sign-In', 'Disponibile nella versione finale')}
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

      <TextInput
        label="Email"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
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
        onChangeText={(text) => setFormData({ ...formData, firstName: text })}
        error={!!errors.firstName}
        style={styles.input}
      />
      <HelperText type="error" visible={!!errors.firstName}>
        {errors.firstName}
      </HelperText>

      <TextInput
        label="Cognome"
        value={formData.lastName}
        onChangeText={(text) => setFormData({ ...formData, lastName: text })}
        error={!!errors.lastName}
        style={styles.input}
      />
      <HelperText type="error" visible={!!errors.lastName}>
        {errors.lastName}
      </HelperText>

      <TextInput
        label="Numero di telefono"
        value={formData.phone}
        onChangeText={(text) => setFormData({ ...formData, phone: text })}
        keyboardType="phone-pad"
        error={!!errors.phone}
        style={styles.input}
      />
      <HelperText type="error" visible={!!errors.phone}>
        {errors.phone}
      </HelperText>
    </View>
  );

  const renderCarDataStep = () => (
    <View style={styles.stepContainer}>
      <Text variant="headlineSmall" style={styles.stepTitle}>
        Le tue automobili
      </Text>
      <Text variant="bodyMedium" style={styles.stepSubtitle}>
        Aggiungi almeno un'automobile per iniziare
      </Text>

      {/* Lista auto aggiunte */}
      {carDataList.length > 0 && (
        <View style={styles.carListContainer}>
          {carDataList.map((car, index) => (
            <Card key={index} style={styles.carCard}>
              <Card.Content style={styles.carCardContent}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleMedium">
                    {car.brand} {car.model}
                  </Text>
                  <Text variant="bodySmall">
                    Targa: {car.licensePlate} | Anno: {car.year || 'N/D'}
                  </Text>
                </View>
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => removeCar(index)}
                />
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      {/* Form aggiunta auto */}
      <View style={styles.carFormContainer}>
        <View style={styles.row}>
          <TextInput
            label="Marca"
            value={currentCarData.brand}
            onChangeText={(text) => setCurrentCarData({ ...currentCarData, brand: text })}
            style={[styles.input, styles.halfInput]}
          />
          <TextInput
            label="Modello"
            value={currentCarData.model}
            onChangeText={(text) => setCurrentCarData({ ...currentCarData, model: text })}
            style={[styles.input, styles.halfInput]}
          />
        </View>

        <View style={styles.row}>
          <TextInput
            label="Anno"
            value={currentCarData.year}
            onChangeText={(text) => setCurrentCarData({ ...currentCarData, year: text })}
            keyboardType="numeric"
            style={[styles.input, styles.halfInput]}
          />
          <TextInput
            label="Targa"
            value={currentCarData.licensePlate}
            onChangeText={(text) => setCurrentCarData({ ...currentCarData, licensePlate: text.toUpperCase() })}
            autoCapitalize="characters"
            style={[styles.input, styles.halfInput]}
          />
        </View>

        <TextInput
          label="VIN (opzionale)"
          value={currentCarData.vin}
          onChangeText={(text) => setCurrentCarData({ ...currentCarData, vin: text })}
          style={styles.input}
        />

        <View style={styles.row}>
          <TextInput
            label="Chilometri"
            value={currentCarData.kilometers}
            onChangeText={(text) => setCurrentCarData({ ...currentCarData, kilometers: text })}
            keyboardType="numeric"
            style={[styles.input, styles.halfInput]}
          />
          <View style={[styles.halfInput, { marginTop: 8 }]}>
            <Text variant="labelMedium" style={{ marginBottom: 4 }}>Alimentazione</Text>
            <View style={styles.chipContainer}>
              <Chip
                selected={currentCarData.fuelType === 'gasoline'}
                onPress={() => setCurrentCarData({ ...currentCarData, fuelType: 'gasoline' })}
                style={styles.chip}
              >
                Benzina
              </Chip>
              <Chip
                selected={currentCarData.fuelType === 'diesel'}
                onPress={() => setCurrentCarData({ ...currentCarData, fuelType: 'diesel' })}
                style={styles.chip}
              >
                Diesel
              </Chip>
              <Chip
                selected={currentCarData.fuelType === 'electric'}
                onPress={() => setCurrentCarData({ ...currentCarData, fuelType: 'electric' })}
                style={styles.chip}
              >
                Elettrica
              </Chip>
            </View>
          </View>
        </View>

        <Button
          mode="contained-tonal"
          onPress={addCar}
          icon="plus"
          style={styles.addButton}
        >
          Aggiungi auto
        </Button>
      </View>

      <HelperText type="error" visible={!!errors.car}>
        {errors.car}
      </HelperText>
    </View>
  );

  const renderWorkshopDataStep = () => (
    <View style={styles.stepContainer}>
      <Text variant="headlineSmall" style={styles.stepTitle}>
        Dati officina
      </Text>

      <TextInput
        label="Nome officina"
        value={formData.workshopName}
        onChangeText={(text) => setFormData({ ...formData, workshopName: text })}
        error={!!errors.workshopName}
        style={styles.input}
      />
      <HelperText type="error" visible={!!errors.workshopName}>
        {errors.workshopName}
      </HelperText>

      <TextInput
        label="Indirizzo completo"
        value={formData.address}
        onChangeText={(text) => setFormData({ ...formData, address: text })}
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
        onChangeText={(text) => setFormData({ ...formData, vatNumber: text })}
        keyboardType="numeric"
        error={!!errors.vatNumber}
        style={styles.input}
      />
      <HelperText type="error" visible={!!errors.vatNumber}>
        {errors.vatNumber}
      </HelperText>

      <TextInput
        label="Numero licenza meccanico (opzionale)"
        value={formData.mechanicLicense}
        onChangeText={(text) => setFormData({ ...formData, mechanicLicense: text })}
        style={styles.input}
      />
    </View>
  );

  const renderConfirmationStep = () => (
    <View style={styles.stepContainer}>
      <Text variant="headlineSmall" style={styles.stepTitle}>
        Conferma registrazione
      </Text>

      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text variant="titleMedium">Riepilogo dati</Text>
          <Divider style={{ marginVertical: 12 }} />
          
          <Text variant="bodyMedium">
            <Text style={{ fontWeight: 'bold' }}>Tipo account:</Text> {userType === 'user' ? 'Proprietario Auto' : 'Meccanico/Officina'}
          </Text>
          <Text variant="bodyMedium">
            <Text style={{ fontWeight: 'bold' }}>Email:</Text> {formData.email || socialUser?.email}
          </Text>
          <Text variant="bodyMedium">
            <Text style={{ fontWeight: 'bold' }}>Nome:</Text> {formData.firstName} {formData.lastName}
          </Text>
          <Text variant="bodyMedium">
            <Text style={{ fontWeight: 'bold' }}>Telefono:</Text> {formData.phone}
          </Text>
          
          {userType === 'mechanic' ? (
            <>
              <Text variant="bodyMedium">
                <Text style={{ fontWeight: 'bold' }}>Officina:</Text> {formData.workshopName}
              </Text>
              <Text variant="bodyMedium">
                <Text style={{ fontWeight: 'bold' }}>P.IVA:</Text> {formData.vatNumber}
              </Text>
            </>
          ) : (
            <Text variant="bodyMedium">
              <Text style={{ fontWeight: 'bold' }}>Auto registrate:</Text> {carDataList.length}
            </Text>
          )}
        </Card.Content>
      </Card>

      <TouchableOpacity
        style={styles.termsContainer}
        onPress={() => setAgreedToTerms(!agreedToTerms)}
      >
        <MaterialCommunityIcons
          name={agreedToTerms ? "checkbox-marked" : "checkbox-blank-outline"}
          size={24}
          color={theme.colors.primary}
        />
        <Text variant="bodyMedium" style={styles.termsText}>
          Accetto i termini e condizioni e la privacy policy
        </Text>
      </TouchableOpacity>
      <HelperText type="error" visible={!!errors.terms}>
        {errors.terms}
      </HelperText>

      <Button
        mode="contained"
        onPress={handleEmailRegister}
        loading={loading}
        disabled={loading || !agreedToTerms}
        style={styles.confirmButton}
      >
        Completa registrazione
      </Button>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderUserTypeSelection();
      case 1:
        return renderCredentialsStep();
      case 2:
        return renderPersonalDataStep();
      case 3:
        return userType === 'user' ? renderCarDataStep() : renderWorkshopDataStep();
      case 4:
        return renderConfirmationStep();
      default:
        return null;
    }
  };

  // Calcolo padding bottom dinamico per Android
  const getBottomPadding = () => {
    if (Platform.OS === 'android') {
      return Math.max(insets.bottom, 100);
    }
    return insets.bottom || 20;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingBottom: getBottomPadding() }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {currentStep > 0 && renderStepIndicator()}
          
          {renderCurrentStep()}

          {/* Bottoni navigazione */}
          {currentStep > 0 && (
            <View style={styles.navigationButtons}>
              <Button
                mode="text"
                onPress={prevStep}
                disabled={loading}
                style={styles.navButton}
              >
                Indietro
              </Button>
              {currentStep < 4 && (
                <Button
                  mode="contained"
                  onPress={nextStep}
                  disabled={loading}
                  style={styles.navButton}
                >
                  Avanti
                </Button>
              )}
            </View>
          )}

          {/* Spacer per Android */}
          {Platform.OS === 'android' && (
            <View style={{ height: 40 }} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  stepIndicatorContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  stepText: {
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepTitle: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  stepSubtitle: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  userTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  userTypeCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  userTypeCardSelected: {
    borderColor: '#007AFF',
  },
  socialButton: {
    marginBottom: 12,
    borderRadius: 8,
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
    marginHorizontal: 15,
    fontSize: 12,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  input: {
    marginBottom: 8,
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  carListContainer: {
    marginBottom: 20,
  },
  carCard: {
    marginBottom: 10,
    borderRadius: 8,
  },
  carCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carFormContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginTop: 4,
  },
  addButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  summaryCard: {
    marginBottom: 20,
    borderRadius: 12,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  termsText: {
    marginLeft: 10,
    flex: 1,
  },
  confirmButton: {
    borderRadius: 8,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  navButton: {
    minWidth: 100,
  },
});

export default RegisterScreen;
// src/screens/RegisterScreen.tsx - VERSIONE SISTEMATA PER WEB
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  Animated,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  HelperText,
  Divider,
  Card,
  IconButton,
  Chip,
  ProgressBar,
  Checkbox,
  Surface,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Firebase imports
import { auth, db, isWeb } from '../services/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Importa il nuovo sistema di temi
import { useAppThemeManager, useThemedStyles } from '../hooks/useTheme';

// Gestione Google Sign-In cross-platform
let AuthSession: any = null;
let AppleAuthentication: any = null;

if (!isWeb) {
  try {
    AuthSession = require('expo-auth-session');
  } catch (e) {
    console.warn('Expo Auth Session non disponibile:', e);
  }
  
  if (Platform.OS === 'ios') {
    try {
      AppleAuthentication = require('expo-apple-authentication');
    } catch (e) {
      console.warn('Apple Authentication non disponibile:', e);
    }
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
  const insets = useSafeAreaInsets();

  // Nuovo sistema di temi
  const { colors, isDark, toggleTheme } = useAppThemeManager();
  const { dynamicStyles } = useThemedStyles();

  // Responsive hooks
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  
  // Animazioni
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const progressAnim = useState(new Animated.Value(0))[0];

  // Stati principali - INIZIALIZZATI SUBITO
  const [currentStep, setCurrentStep] = useState(0);
  const [userType, setUserType] = useState<UserType>('user');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider>(null);
  const [socialUser, setSocialUser] = useState<FirebaseUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  // Calcolo responsive - DOPO GLI STATI
  const isTablet = screenData.width >= 768;
  const isDesktop = screenData.width >= 1024;

  // Configurazione layout responsive
  const getContainerWidth = () => {
    if (isDesktop) return 1200;
    if (isTablet) return 800;
    return screenData.width;
  };

  const getCardWidth = () => {
    if (isDesktop) return 500;
    if (isTablet) return 600;
    return '100%';
  };

  const getCardMargin = () => {
    if (isDesktop) return 40;
    if (isTablet) return 24;
    return 16;
  };

  const getIconSize = () => {
    if (isDesktop) return 64;
    if (isTablet) return 56;
    return 48;
  };

  useEffect(() => {
    const onChange = (result: any) => {
      setScreenData(result.window);
    };
    
    const subscription = Dimensions.addEventListener('change', onChange);
    
    // Animazione di entrata
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    
    return () => subscription?.remove();
  }, []);

  // Effect per animare la progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / 5,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

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

      case 3: // Dati specifici
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

  // Salvataggio utente su Firestore
  const saveUserToFirestore = async (user: FirebaseUser, authProvider: string) => {
    try {
      console.log('💾 Salvataggio dati utente su Firestore...');
      
      const userData = {
        uid: user.uid,
        email: user.email,
        authProvider,
        userType,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        name: `${formData.firstName} ${formData.lastName}`,
        profilePicture: user.photoURL || null,
        isEmailVerified: user.emailVerified,
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
      if (isWeb) {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        setSocialUser(result.user);
        
        // Pre-popola i dati dal profilo Google
        if (result.user.displayName) {
          const nameParts = result.user.displayName.split(' ');
          setFormData(prev => ({
            ...prev,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: result.user.email || '',
          }));
        }
        
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
      
      // Pre-popola i dati dal profilo Google
      if (result.user.displayName) {
        const nameParts = result.user.displayName.split(' ');
        setFormData(prev => ({
          ...prev,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: result.user.email || '',
        }));
      }
      
      setCurrentStep(2); // Vai ai dati personali
    } catch (error: any) {
      console.error('❌ Errore autenticazione Google:', error);
      Alert.alert('Errore', 'Errore durante l\'autenticazione con Google');
    } finally {
      setSocialLoading(null);
    }
  };

  // Gestione auto per utenti normali
  const addCar = () => {
    if (currentCarData.brand && currentCarData.model && currentCarData.licensePlate) {
      setCarDataList([...carDataList, { ...currentCarData }]);
      setCurrentCarData({
        brand: '',
        model: '',
        year: '',
        licensePlate: '',
        vin: '',
        fuelType: 'gasoline',
        kilometers: ''
      });
    }
  };

  const removeCar = (index: number) => {
    setCarDataList(carDataList.filter((_, i) => i !== index));
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

  const goToStep = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  // STILI STATICI - SENZA RIFERIMENTI A STATI
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backgroundGradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    contentContainer: {
      flex: 1,
      maxWidth: getContainerWidth(),
      alignSelf: 'center',
      width: '100%',
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: getCardMargin(),
      paddingTop: isDesktop ? 40 : Math.max(insets.top + 20, 40),
      paddingBottom: Math.max(insets.bottom + 20, 40),
    },

    // Theme toggle button
    themeToggleContainer: {
      position: 'absolute',
      top: insets.top + 10,
      right: 20,
      zIndex: 1000,
    },
    themeToggle: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 20,
      padding: 8,
      ...dynamicStyles.cardShadow,
    },

    // Header
    header: {
      alignItems: 'center',
      marginBottom: isDesktop ? 40 : 32,
    },
    headerIcon: {
      marginBottom: 16,
      padding: 20,
      borderRadius: 40,
      backgroundColor: colors.primaryContainer,
      ...dynamicStyles.cardShadow,
    },
    title: {
      fontSize: isDesktop ? 36 : isTablet ? 32 : 28,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
      color: colors.onBackground,
    },
    subtitle: {
      fontSize: isDesktop ? 16 : 14,
      textAlign: 'center',
      color: colors.onSurfaceVariant,
      maxWidth: 400,
      lineHeight: 22,
    },

    // Step indicator
    stepIndicatorContainer: {
      marginBottom: 32,
      alignItems: 'center',
    },
    progressBarContainer: {
      width: '100%',
      height: 8,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 12,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    stepText: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },

    // Step breadcrumbs per desktop
    stepBreadcrumbs: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 32,
      gap: 8,
      flexWrap: 'wrap',
    },
    breadcrumbItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surfaceVariant,
    },
    breadcrumbItemActive: {
      backgroundColor: colors.primaryContainer,
    },
    breadcrumbItemCompleted: {
      backgroundColor: colors.primary,
    },
    breadcrumbItemInactive: {
      opacity: 0.5,
    },
    breadcrumbText: {
      fontSize: 12,
      marginLeft: 4,
      color: colors.onSurfaceVariant,
    },
    breadcrumbTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    breadcrumbTextCompleted: {
      color: colors.onPrimary,
      fontWeight: '600',
    },

    // Card principale
    card: {
      width: getCardWidth(),
      alignSelf: 'center',
      maxWidth: '100%',
      backgroundColor: colors.surface,
      borderRadius: 24,
      overflow: 'hidden',
      ...dynamicStyles.cardShadow,
    },
    cardGradient: {
      height: 6,
    },
    cardContent: {
      padding: isDesktop ? 40 : isTablet ? 32 : 24,
    },

    // Step container
    stepContainer: {
      alignItems: 'center',
      minHeight: 400,
    },
    stepTitle: {
      fontSize: isDesktop ? 28 : isTablet ? 24 : 20,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 12,
      color: colors.onSurface,
    },
    stepSubtitle: {
      fontSize: isDesktop ? 16 : 14,
      textAlign: 'center',
      color: colors.onSurfaceVariant,
      marginBottom: 32,
      maxWidth: 400,
      lineHeight: 22,
    },

    // User type selection
    userTypeContainer: {
      flexDirection: isTablet ? 'row' : 'column',
      gap: isTablet ? 20 : 16,
      width: '100%',
      maxWidth: 600,
    },
    userTypeCard: {
      flex: isTablet ? 1 : undefined,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
      minHeight: 160,
      ...dynamicStyles.cardShadow,
    },
    userTypeCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryContainer,
      transform: [{ scale: 1.02 }],
    },

    // Animations
    animatedContainer: {
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }],
    },

    // Navigation buttons
    navigationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 32,
      width: '100%',
      maxWidth: 400,
    },
    navigationButton: {
      minWidth: 100,
      borderRadius: 12,
    },

    // Input container
    inputsContainer: {
      width: '100%',
      maxWidth: 400,
      gap: 16,
    },
    input: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
    },

    // Social buttons
    socialButtonsContainer: {
      width: '100%',
      maxWidth: 400,
      gap: 12,
      marginBottom: 24,
    },
    socialButton: {
      borderRadius: 12,
      backgroundColor: colors.surfaceVariant,
      borderColor: colors.outline,
    },

    // Divider
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
      width: '100%',
      maxWidth: 400,
    },
    divider: {
      flex: 1,
      backgroundColor: colors.outline,
    },
    dividerText: {
      marginHorizontal: 16,
      fontSize: 12,
      color: colors.onSurfaceVariant,
      backgroundColor: colors.surface,
      paddingHorizontal: 8,
    },
  });

  // Theme Toggle Component
  const ThemeToggle = () => (
    <View style={styles.themeToggleContainer}>
      <TouchableOpacity
        style={styles.themeToggle}
        onPress={toggleTheme}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={isDark ? 'weather-sunny' : 'weather-night'}
          size={24}
          color={colors.primary}
        />
      </TouchableOpacity>
    </View>
  );

  // Render step indicator
  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      {isDesktop ? (
        // Breadcrumbs per desktop
        <View style={styles.stepBreadcrumbs}>
          {[
            { key: 0, name: 'Tipo Account', icon: 'account-group' },
            { key: 1, name: 'Credenziali', icon: 'lock' },
            { key: 2, name: 'Dati Personali', icon: 'account' },
            { key: 3, name: userType === 'mechanic' ? 'Dati Officina' : 'Le Tue Auto', icon: userType === 'mechanic' ? 'wrench' : 'car' },
            { key: 4, name: 'Conferma', icon: 'check' },
          ].map((step, index) => {
            const isActive = currentStep === step.key;
            const isCompleted = currentStep > step.key;
            const isAccessible = currentStep >= step.key;

            return (
              <TouchableOpacity
                key={step.key}
                style={[
                  styles.breadcrumbItem,
                  isActive && styles.breadcrumbItemActive,
                  isCompleted && styles.breadcrumbItemCompleted,
                  !isAccessible && styles.breadcrumbItemInactive,
                ]}
                onPress={() => goToStep(step.key)}
                disabled={!isAccessible}
              >
                <MaterialCommunityIcons
                  name={step.icon as any}
                  size={16}
                  color={
                    isCompleted ? colors.onPrimary :
                    isActive ? colors.primary : 
                    colors.onSurfaceVariant
                  }
                />
                <Text style={[
                  styles.breadcrumbText,
                  isActive && styles.breadcrumbTextActive,
                  isCompleted && styles.breadcrumbTextCompleted,
                ]}>
                  {step.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        // Progress bar per mobile con animazione
        <>
          <View style={styles.progressBarContainer}>
            <Animated.View style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }
            ]}>
              <LinearGradient
                colors={dynamicStyles.primaryGradient}
                style={{ flex: 1 }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
          </View>
          <Text style={styles.stepText}>
            Passo {currentStep + 1} di 5
          </Text>
        </>
      )}
    </View>
  );

  // Render selezione tipo utente
  const renderUserTypeSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>
        Come vuoi utilizzare l'app?
      </Text>
      <Text style={styles.stepSubtitle}>
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
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="car"
            size={getIconSize()}
            color={userType === 'user' ? colors.primary : colors.onSurface}
          />
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            marginTop: 12, 
            textAlign: 'center',
            color: colors.onSurface 
          }}>
            Proprietario Auto
          </Text>
          <Text style={{ 
            fontSize: 14, 
            textAlign: 'center', 
            marginTop: 4, 
            color: colors.onSurfaceVariant 
          }}>
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
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="wrench"
            size={getIconSize()}
            color={userType === 'mechanic' ? colors.primary : colors.onSurface}
          />
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            marginTop: 12, 
            textAlign: 'center',
            color: colors.onSurface 
          }}>
            Meccanico/Officina
          </Text>
          <Text style={{ 
            fontSize: 14, 
            textAlign: 'center', 
            marginTop: 4, 
            color: colors.onSurfaceVariant 
          }}>
            Gestisci clienti e servizi
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render step credenziali - VERSIONE SEMPLIFICATA
  const renderCredentialsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>
        Crea il tuo account
      </Text>

      <View style={styles.socialButtonsContainer}>
        <Button
          mode="outlined"
          onPress={handleGoogleSignIn}
          loading={socialLoading === 'google'}
          disabled={loading || socialLoading !== null}
          icon="google"
          style={styles.socialButton}
          contentStyle={{ height: 48 }}
          textColor={colors.onSurfaceVariant}
        >
          Registrati con Google
        </Button>

        {(Platform.OS === 'ios' || isWeb) && (
          <Button
            mode="outlined"
            onPress={() => Alert.alert('Apple Sign-In', 'Disponibile nella versione finale')}
            disabled={loading || socialLoading !== null}
            icon="apple"
            style={styles.socialButton}
            contentStyle={{ height: 48 }}
            textColor={colors.onSurfaceVariant}
          >
            Registrati con Apple
          </Button>
        )}
      </View>

      <View style={styles.dividerContainer}>
        <Divider style={styles.divider} />
        <Text style={styles.dividerText}>
          OPPURE
        </Text>
        <Divider style={styles.divider} />
      </View>

      <View style={styles.inputsContainer}>
        <TextInput
          label="Email"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
          error={!!errors.email}
          style={styles.input}
          mode="outlined"
          outlineColor={colors.outline}
          activeOutlineColor={colors.primary}
          left={<TextInput.Icon icon="email" iconColor={colors.primary} />}
        />
        <HelperText type="error" visible={!!errors.email}>
          {errors.email}
        </HelperText>

        <TextInput
          label="Password"
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
          secureTextEntry={!showPassword}
          error={!!errors.password}
          style={styles.input}
          mode="outlined"
          outlineColor={colors.outline}
          activeOutlineColor={colors.primary}
          left={<TextInput.Icon icon="lock" iconColor={colors.primary} />}
          right={
            <TextInput.Icon
              icon={showPassword ? "eye-off" : "eye"}
              iconColor={colors.primary}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
        />
        <HelperText type="error" visible={!!errors.password}>
          {errors.password}
        </HelperText>

        <TextInput
          label="Conferma Password"
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
          secureTextEntry={!showConfirmPassword}
          error={!!errors.confirmPassword}
          style={styles.input}
          mode="outlined"
          outlineColor={colors.outline}
          activeOutlineColor={colors.primary}
          left={<TextInput.Icon icon="lock-check" iconColor={colors.primary} />}
          right={
            <TextInput.Icon
              icon={showConfirmPassword ? "eye-off" : "eye"}
              iconColor={colors.primary}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          }
        />
        <HelperText type="error" visible={!!errors.confirmPassword}>
          {errors.confirmPassword}
        </HelperText>
      </View>
    </View>
  );

  // Placeholder per altri step (da implementare)
  const renderPlaceholderStep = (title: string) => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSubtitle}>Questa sezione sarà implementata presto</Text>
      
      <Button
        mode="contained"
        onPress={nextStep}
        buttonColor={colors.primary}
        style={{ marginTop: 32 }}
      >
        Continua
      </Button>
    </View>
  );

  // Step finale
  const renderFinalStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Quasi finito!</Text>
      <Text style={styles.stepSubtitle}>
        Accetta i termini per completare la registrazione
      </Text>

      <View style={{ alignItems: 'center', marginTop: 40 }}>
        <MaterialCommunityIcons
          name="check-circle-outline"
          size={80}
          color={colors.primary}
          style={{ marginBottom: 24 }}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <Checkbox
            status={agreedToTerms ? 'checked' : 'unchecked'}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            color={colors.primary}
          />
          <Text style={{ marginLeft: 8, color: colors.onSurface }}>
            Accetto i termini e condizioni
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={handleEmailRegister}
          loading={loading}
          disabled={loading || !agreedToTerms}
          buttonColor={colors.primary}
          style={{ width: '100%', maxWidth: 300 }}
          contentStyle={{ height: 48 }}
        >
          {loading ? 'Creazione account...' : 'Crea Account'}
        </Button>
      </View>
    </View>
  );

  // Render navigation buttons
  const renderNavigationButtons = () => {
    if (currentStep === 0 || currentStep === 4) return null;

    return (
      <View style={styles.navigationContainer}>
        <Button
          mode="text"
          onPress={prevStep}
          disabled={loading}
          style={styles.navigationButton}
          textColor={colors.primary}
        >
          Indietro
        </Button>

        <Button
          mode="contained"
          onPress={nextStep}
          disabled={loading}
          style={styles.navigationButton}
          buttonColor={colors.primary}
        >
          Avanti
        </Button>
      </View>
    );
  };

  // Render del contenuto dello step corrente
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderUserTypeSelection();
      case 1: return renderCredentialsStep();
      case 2: return renderPlaceholderStep('Dati Personali');
      case 3: return renderPlaceholderStep(userType === 'mechanic' ? 'Dati Officina' : 'Le Tue Auto');
      case 4: return renderFinalStep();
      default: return renderUserTypeSelection();
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={isDark ? 
          ['#000000', '#1C1C1E', '#2C2C2E'] : 
          ['#FAFAFA', '#F5F5F5', '#FFFFFF']
        }
        style={styles.backgroundGradient}
      />
      
      {/* Theme Toggle */}
      <ThemeToggle />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.contentContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* Header */}
            <Animated.View style={[styles.header, styles.animatedContainer]}>
              <Surface style={styles.headerIcon} elevation={0}>
                <MaterialCommunityIcons
                  name="car-wrench"
                  size={isDesktop ? 72 : isTablet ? 64 : 56}
                  color={colors.primary}
                />
              </Surface>
              <Text style={styles.title}>
                Benvenuto in MyMeccanic
              </Text>
              <Text style={styles.subtitle}>
                Crea il tuo account per iniziare a gestire le tue automobili
              </Text>
            </Animated.View>

            {/* Step Indicator */}
            <Animated.View style={styles.animatedContainer}>
              {renderStepIndicator()}
            </Animated.View>

            {/* Main Card */}
            <Animated.View style={styles.animatedContainer}>
              <Card style={styles.card} elevation={0}>
                {/* Gradient accent */}
                <LinearGradient
                  colors={dynamicStyles.primaryGradient}
                  style={styles.cardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                
                <Card.Content style={styles.cardContent}>
                  {renderCurrentStep()}
                  {renderNavigationButtons()}
                </Card.Content>
              </Card>
            </Animated.View>

            {/* Login Link */}
            <View style={{ alignItems: 'center', marginTop: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: colors.onSurfaceVariant }}>
                  Hai già un account?{' '}
                </Text>
                {isWeb ? (
                  <Button
                    mode="text"
                    onPress={() => navigation.goBack()}
                    compact
                    textColor={colors.primary}
                  >
                    Accedi
                  </Button>
                ) : (
                  <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={{ color: colors.primary, fontWeight: '600' }}>
                      Accedi
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default RegisterScreen;
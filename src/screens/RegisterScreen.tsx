
// src/screens/RegisterScreen.tsx - VERSIONE COMPLETA
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
  Menu,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Firebase imports
import { auth, db, isWeb } from '../services/firebase';

// Car data imports
import CarSearchModal from '../components/CarSearchModal';
import { carDataService } from '../services/CarDataService';
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
  specializations?: string[];
  workingHours?: {
    [key: string]: {
      open: string;
      close: string;
      isClosed: boolean;
    };
  };
}

interface CarData {
  brand: string;
  model: string;
  year: string;
  licensePlate: string;
  vin: string;
  fuelType: string;
  kilometers: string;
  color: string;
  engineSize: string;
  transmission: string;
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

  // Stati principali
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
    mechanicLicense: '',
    specializations: [],
    workingHours: {
      monday: { open: '08:00', close: '18:00', isClosed: false },
      tuesday: { open: '08:00', close: '18:00', isClosed: false },
      wednesday: { open: '08:00', close: '18:00', isClosed: false },
      thursday: { open: '08:00', close: '18:00', isClosed: false },
      friday: { open: '08:00', close: '18:00', isClosed: false },
      saturday: { open: '08:00', close: '13:00', isClosed: false },
      sunday: { open: '00:00', close: '00:00', isClosed: true },
    }
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
    kilometers: '',
    color: '',
    engineSize: '',
    transmission: 'manual'
  });

  // Errori di validazione
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Menù per specializzazioni
  const [showSpecializationsMenu, setShowSpecializationsMenu] = useState(false);
  
  // Car search modal
  const [showCarSearchModal, setShowCarSearchModal] = useState(false);
  const [currentCarIndex, setCurrentCarIndex] = useState(-1);

  // Opzioni disponibili
  const specializationOptions = [
    'Auto', 'Moto', 'Elettrico', 'Ibrido', 'Diesel', 'Benzina', 
    'Climatizzazione', 'Elettronica', 'Carrozzeria', 'Pneumatici'
  ];

  const fuelTypeOptions = [
    { value: 'gasoline', label: 'Benzina' },
    { value: 'diesel', label: 'Diesel' },
    { value: 'electric', label: 'Elettrico' },
    { value: 'hybrid', label: 'Ibrido' },
    { value: 'lpg', label: 'GPL' },
    { value: 'methane', label: 'Metano' }
  ];

  const transmissionOptions = [
    { value: 'manual', label: 'Manuale' },
    { value: 'automatic', label: 'Automatico' },
    { value: 'semiautomatic', label: 'Semiautomatico' }
  ];

  // Calcolo responsive
  const isTablet = screenData.width >= 768;
  const isDesktop = screenData.width >= 1024;

  const getContainerWidth = () => {
    if (isDesktop) return 1200;
    if (isTablet) return 800;
    return screenData.width;
  };

  const getCardWidth = () => {
    if (isDesktop) return 600;
    if (isTablet) return 700;
    return '100%';
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

  // Funzioni di validazione
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone);
  };

  const validateVatNumber = (vatNumber: string): boolean => {
    const vatRegex = /^IT[0-9]{11}$/;
    return vatRegex.test(vatNumber);
  };

  const validateLicensePlate = (plate: string): boolean => {
    const plateRegex = /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/;
    return plateRegex.test(plate.toUpperCase());
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
          if (!formData.vatNumber || !validateVatNumber(formData.vatNumber)) {
            newErrors.vatNumber = 'Partita IVA non valida (formato: IT + 11 cifre)';
          }
        } else {
          // Validazione auto per utenti
          if (carDataList.length === 0) {
            newErrors.cars = 'Aggiungi almeno una auto';
          }
          
          // Validazione dati auto
          carDataList.forEach((car, index) => {
            if (!car.brand || !car.model || !car.year) {
              newErrors[`car_${index}`] = 'Dati auto incompleti';
            }
          });
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
      
      const baseUserData = {
        uid: user.uid,
        email: user.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        userType,
        authProvider,
        profilePicture: user.photoURL || null,
        isEmailVerified: user.emailVerified,
        profileComplete: true,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        settings: {
          language: 'it',
          currency: 'EUR',
          notifications: userType === 'mechanic' ? {
            appointments: true,
            invoices: true,
            reviews: true,
            marketing: false,
          } : {
            maintenance: true,
            documents: true,
            reminders: true,
            marketing: false,
          },
          privacy: {
            shareDataWithWorkshops: userType === 'user',
            allowMarketingEmails: false,
          },
        },
      };

      let userData = { ...baseUserData };

      // Dati specifici per meccanici
      if (userType === 'mechanic') {
        userData = {
          ...userData,
          workshopName: formData.workshopName,
          address: formData.address,
          vatNumber: formData.vatNumber,
          mechanicLicense: formData.mechanicLicense || '',
          specializations: formData.specializations || [],
          workingHours: formData.workingHours,
          rating: 0,
          reviewsCount: 0,
          verified: false,
          certifications: [],
        };
      }

      // Salva l'utente
      await setDoc(doc(db, 'users', user.uid), userData);

      // Se è un utente normale, salva anche le auto
      if (userType === 'user' && carDataList.length > 0) {
        for (let i = 0; i < carDataList.length; i++) {
          const car = carDataList[i];
          const carId = `${user.uid}_vehicle_${i + 1}`;
          
          await setDoc(doc(db, 'vehicles', carId), {
            id: carId,
            userId: user.uid,
            brand: car.brand,
            model: car.model,
            year: parseInt(car.year),
            licensePlate: car.licensePlate.toUpperCase(),
            vin: car.vin.toUpperCase(),
            fuelType: car.fuelType,
            kilometers: parseInt(car.kilometers),
            color: car.color,
            engineSize: car.engineSize,
            transmission: car.transmission,
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            notes: '',
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
        'Account creato con successo. Benvenuto in MyMeccanic!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error: any) {
      console.error('❌ Errore registrazione:', error);
      Alert.alert('Errore', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Gestione auto
  const addCar = async () => {
    const newErrors: Record<string, string> = {};

    if (!currentCarData.brand) newErrors.brand = 'Marca obbligatoria';
    if (!currentCarData.model) newErrors.model = 'Modello obbligatorio';
    if (!currentCarData.year) newErrors.year = 'Anno obbligatorio';
    if (!currentCarData.licensePlate) {
      newErrors.licensePlate = 'Targa obbligatoria';
    } else if (!validateLicensePlate(currentCarData.licensePlate)) {
      newErrors.licensePlate = 'Formato targa non valido (es: AB123CD)';
    }
    if (!currentCarData.kilometers) newErrors.kilometers = 'Chilometraggio obbligatorio';

    // Validazione dati auto con API
    if (currentCarData.brand && currentCarData.model && currentCarData.year) {
      try {
        const isValid = await carDataService.validateCarData(
          currentCarData.brand,
          currentCarData.model,
          parseInt(currentCarData.year)
        );
        
        if (!isValid) {
          newErrors.brand = 'Combinazione marca/modello/anno non valida';
        }
      } catch (error) {
        console.warn('Impossibile validare dati auto:', error);
        // Continua comunque senza bloccare l'utente
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setCarDataList([...carDataList, { ...currentCarData }]);
    setCurrentCarData({
      brand: '',
      model: '',
      year: '',
      licensePlate: '',
      vin: '',
      fuelType: 'gasoline',
      kilometers: '',
      color: '',
      engineSize: '',
      transmission: 'manual'
    });
    setErrors({});
  };

  const removeCar = (index: number) => {
    setCarDataList(carDataList.filter((_, i) => i !== index));
  };

  // Gestisce apertura modal ricerca auto
  const openCarSearch = (index: number = -1) => {
    setCurrentCarIndex(index);
    setShowCarSearchModal(true);
  };

  // Gestisce selezione auto dal modal
  const handleCarSelection = (selectedCar: { brand: string; model: string; year: string }) => {
    if (currentCarIndex === -1) {
      // Nuovo auto
      setCurrentCarData({
        ...currentCarData,
        brand: selectedCar.brand,
        model: selectedCar.model,
        year: selectedCar.year,
      });
    } else {
      // Modifica auto esistente
      const updatedCars = [...carDataList];
      updatedCars[currentCarIndex] = {
        ...updatedCars[currentCarIndex],
        brand: selectedCar.brand,
        model: selectedCar.model,
        year: selectedCar.year,
      };
      setCarDataList(updatedCars);
    }
    setShowCarSearchModal(false);
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
            size={64}
            color={userType === 'user' ? colors.primary : colors.onSurface}
          />
          <Text style={[styles.userTypeTitle, { color: colors.onSurface }]}>
            Proprietario Auto
          </Text>
          <Text style={[styles.userTypeSubtitle, { color: colors.onSurfaceVariant }]}>
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
            size={64}
            color={userType === 'mechanic' ? colors.primary : colors.onSurface}
          />
          <Text style={[styles.userTypeTitle, { color: colors.onSurface }]}>
            Meccanico/Officina
          </Text>
          <Text style={[styles.userTypeSubtitle, { color: colors.onSurfaceVariant }]}>
            Gestisci clienti e servizi
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render step credenziali
  const renderCredentialsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Crea il tuo account</Text>
      <Text style={styles.stepSubtitle}>
        Inserisci i tuoi dati per accedere
      </Text>

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
          left={<TextInput.Icon icon="email" />}
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
          left={<TextInput.Icon icon="lock" />}
          right={
            <TextInput.Icon
              icon={showPassword ? "eye-off" : "eye"}
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
          left={<TextInput.Icon icon="lock-check" />}
          right={
            <TextInput.Icon
              icon={showConfirmPassword ? "eye-off" : "eye"}
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

  // Render dati personali
  const renderPersonalDataStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Dati Personali</Text>
      <Text style={styles.stepSubtitle}>
        Inserisci i tuoi dati personali
      </Text>

      <View style={styles.inputsContainer}>
        <TextInput
          label="Nome"
          value={formData.firstName}
          onChangeText={(text) => setFormData({ ...formData, firstName: text })}
          error={!!errors.firstName}
          style={styles.input}
          mode="outlined"
          left={<TextInput.Icon icon="account" />}
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
          mode="outlined"
          left={<TextInput.Icon icon="account" />}
        />
        <HelperText type="error" visible={!!errors.lastName}>
          {errors.lastName}
        </HelperText>

        <TextInput
          label="Telefono"
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          keyboardType="phone-pad"
          error={!!errors.phone}
          style={styles.input}
          mode="outlined"
          left={<TextInput.Icon icon="phone" />}
        />
        <HelperText type="error" visible={!!errors.phone}>
          {errors.phone}
        </HelperText>
      </View>
    </View>
  );

  // Render dati specifici
  const renderSpecificDataStep = () => {
    if (userType === 'mechanic') {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Dati Officina</Text>
          <Text style={styles.stepSubtitle}>
            Inserisci i dati della tua officina
          </Text>

          <View style={styles.inputsContainer}>
            <TextInput
              label="Nome Officina"
              value={formData.workshopName}
              onChangeText={(text) => setFormData({ ...formData, workshopName: text })}
              error={!!errors.workshopName}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="store" />}
            />
            <HelperText type="error" visible={!!errors.workshopName}>
              {errors.workshopName}
            </HelperText>

            <TextInput
              label="Indirizzo"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              error={!!errors.address}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={2}
              left={<TextInput.Icon icon="map-marker" />}
            />
            <HelperText type="error" visible={!!errors.address}>
              {errors.address}
            </HelperText>

            <TextInput
              label="Partita IVA (IT + 11 cifre)"
              value={formData.vatNumber}
              onChangeText={(text) => setFormData({ ...formData, vatNumber: text.toUpperCase() })}
              error={!!errors.vatNumber}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="file-document" />}
            />
            <HelperText type="error" visible={!!errors.vatNumber}>
              {errors.vatNumber}
            </HelperText>

            <TextInput
              label="Licenza Meccanico (opzionale)"
              value={formData.mechanicLicense}
              onChangeText={(text) => setFormData({ ...formData, mechanicLicense: text })}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="certificate" />}
            />

            <Text style={[styles.inputLabel, { color: colors.onSurface }]}>
              Specializzazioni
            </Text>
            <View style={styles.chipContainer}>
              {specializationOptions.map((spec) => (
                <Chip
                  key={spec}
                  selected={formData.specializations?.includes(spec)}
                  onPress={() => {
                    const current = formData.specializations || [];
                    const updated = current.includes(spec)
                      ? current.filter(s => s !== spec)
                      : [...current, spec];
                    setFormData({ ...formData, specializations: updated });
                  }}
                  style={styles.chip}
                >
                  {spec}
                </Chip>
              ))}
            </View>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Le Tue Auto</Text>
          <Text style={styles.stepSubtitle}>
            Aggiungi almeno una auto per iniziare
          </Text>

          <View style={styles.inputsContainer}>
            <View style={styles.addCarForm}>
              {/* Selezione Auto con Ricerca */}
              <TouchableOpacity
                style={[styles.carSearchButton, { backgroundColor: colors.primaryContainer, borderColor: colors.outline }]}
                onPress={() => openCarSearch()}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="car-search"
                  size={24}
                  color={colors.primary}
                />
                <View style={styles.carSearchContent}>
                  {currentCarData.brand && currentCarData.model ? (
                    <>
                      <Text style={[styles.carSearchTitle, { color: colors.onSurface }]}>
                        {currentCarData.brand} {currentCarData.model}
                      </Text>
                      {currentCarData.year && (
                        <Text style={[styles.carSearchSubtitle, { color: colors.onSurfaceVariant }]}>
                          Anno: {currentCarData.year}
                        </Text>
                      )}
                    </>
                  ) : (
                    <>
                      <Text style={[styles.carSearchTitle, { color: colors.onSurface }]}>
                        Seleziona Auto
                      </Text>
                      <Text style={[styles.carSearchSubtitle, { color: colors.onSurfaceVariant }]}>
                        Cerca tra migliaia di marche e modelli
                      </Text>
                    </>
                  )}
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={colors.onSurfaceVariant}
                />
              </TouchableOpacity>

              {/* Campi aggiuntivi */}
              <View style={styles.carFormRow}>
                <TextInput
                  label="Targa"
                  value={currentCarData.licensePlate}
                  onChangeText={(text) => setCurrentCarData({ ...currentCarData, licensePlate: text.toUpperCase() })}
                  error={!!errors.licensePlate}
                  style={[styles.input, styles.halfWidth]}
                  mode="outlined"
                  placeholder="AB123CD"
                />
                <TextInput
                  label="Chilometri"
                  value={currentCarData.kilometers}
                  onChangeText={(text) => setCurrentCarData({ ...currentCarData, kilometers: text })}
                  keyboardType="numeric"
                  error={!!errors.kilometers}
                  style={[styles.input, styles.halfWidth]}
                  mode="outlined"
                  placeholder="50000"
                />
              </View>

              <View style={styles.carFormRow}>
                <TextInput
                  label="VIN (opzionale)"
                  value={currentCarData.vin}
                  onChangeText={(text) => setCurrentCarData({ ...currentCarData, vin: text.toUpperCase() })}
                  style={[styles.input, styles.halfWidth]}
                  mode="outlined"
                  placeholder="17 caratteri"
                />
                <TextInput
                  label="Colore (opzionale)"
                  value={currentCarData.color}
                  onChangeText={(text) => setCurrentCarData({ ...currentCarData, color: text })}
                  style={[styles.input, styles.halfWidth]}
                  mode="outlined"
                  placeholder="Rosso"
                />
              </View>

              <Button
                mode="outlined"
                onPress={addCar}
                style={styles.addButton}
                icon="plus"
              >
                Aggiungi Auto
              </Button>

              {Object.keys(errors).map(key => errors[key] && (
                <HelperText key={key} type="error" visible={true}>
                  {errors[key]}
                </HelperText>
              ))}
            </View>

            {carDataList.length > 0 && (
              <View style={styles.carsList}>
                <Text style={[styles.carsListTitle, { color: colors.onSurface }]}>
                  Auto aggiunte ({carDataList.length})
                </Text>
                {carDataList.map((car, index) => (
                  <View key={index} style={[styles.carItem, { borderColor: colors.outline }]}>
                    <TouchableOpacity
                      style={styles.carInfo}
                      onPress={() => openCarSearch(index)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.carTitle, { color: colors.onSurface }]}>
                        {car.brand} {car.model} ({car.year})
                      </Text>
                      <Text style={[styles.carSubtitle, { color: colors.onSurfaceVariant }]}>
                        {car.licensePlate} - {car.kilometers} km
                      </Text>
                      {car.color && (
                        <Text style={[styles.carDetails, { color: colors.onSurfaceVariant }]}>
                          Colore: {car.color}
                        </Text>
                      )}
                    </TouchableOpacity>
                    <View style={styles.carActions}>
                      <IconButton
                        icon="pencil"
                        onPress={() => openCarSearch(index)}
                        iconColor={colors.primary}
                        size={20}
                      />
                      <IconButton
                        icon="delete"
                        onPress={() => removeCar(index)}
                        iconColor={colors.error}
                        size={20}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      );
    }
  };

  // Step finale
  const renderFinalStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Quasi finito!</Text>
      <Text style={styles.stepSubtitle}>
        Accetta i termini per completare la registrazione
      </Text>

      <View style={styles.finalStepContent}>
        <MaterialCommunityIcons
          name="check-circle-outline"
          size={80}
          color={colors.primary}
          style={styles.finalIcon}
        />

        <View style={styles.checkboxContainer}>
          <Checkbox
            status={agreedToTerms ? 'checked' : 'unchecked'}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            color={colors.primary}
          />
          <Text style={[styles.checkboxLabel, { color: colors.onSurface }]}>
            Accetto i termini e condizioni
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={handleEmailRegister}
          loading={loading}
          disabled={loading || !agreedToTerms}
          buttonColor={colors.primary}
          style={styles.finalButton}
          contentStyle={styles.finalButtonContent}
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
      case 2: return renderPersonalDataStep();
      case 3: return renderSpecificDataStep();
      case 4: return renderFinalStep();
      default: return renderUserTypeSelection();
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingVertical: Math.max(insets.top + 20, 40),
    },
    stepContainer: {
      alignItems: 'center',
      minHeight: 400,
    },
    stepTitle: {
      fontSize: isDesktop ? 28 : 20,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 12,
      color: colors.onSurface,
    },
    stepSubtitle: {
      fontSize: 14,
      textAlign: 'center',
      color: colors.onSurfaceVariant,
      marginBottom: 32,
      maxWidth: 400,
    },
    userTypeContainer: {
      flexDirection: isTablet ? 'row' : 'column',
      gap: 16,
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
    },
    userTypeCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryContainer,
    },
    userTypeTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginTop: 12,
      textAlign: 'center',
    },
    userTypeSubtitle: {
      fontSize: 14,
      textAlign: 'center',
      marginTop: 4,
    },
    inputsContainer: {
      width: '100%',
      maxWidth: 400,
      gap: 16,
    },
    input: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
    },
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
    inputLabel: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 8,
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    chip: {
      margin: 2,
    },
    addCarForm: {
      marginBottom: 24,
    },
    carFormRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    halfWidth: {
      flex: 1,
    },
    addButton: {
      marginTop: 16,
      borderRadius: 12,
    },
    carsList: {
      width: '100%',
    },
    carsListTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    carItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderWidth: 1,
      borderRadius: 8,
      marginBottom: 8,
    },
    carInfo: {
      flex: 1,
    },
    carTitle: {
      fontSize: 14,
      fontWeight: '600',
    },
    carSubtitle: {
      fontSize: 12,
      marginTop: 2,
    },
    carDetails: {
      fontSize: 11,
      marginTop: 1,
    },
    carActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    carSearchButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 16,
    },
    carSearchContent: {
      flex: 1,
      marginLeft: 12,
    },
    carSearchTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    carSearchSubtitle: {
      fontSize: 12,
      marginTop: 2,
    },
    finalStepContent: {
      alignItems: 'center',
      marginTop: 40,
      width: '100%',
      maxWidth: 400,
    },
    finalIcon: {
      marginBottom: 24,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    checkboxLabel: {
      marginLeft: 8,
      flex: 1,
    },
    finalButton: {
      width: '100%',
      borderRadius: 12,
    },
    finalButtonContent: {
      height: 48,
    },
  });

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderCurrentStep()}
          {renderNavigationButtons()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Car Search Modal */}
      <CarSearchModal
        visible={showCarSearchModal}
        onClose={() => setShowCarSearchModal(false)}
        onSelect={handleCarSelection}
        initialData={
          currentCarIndex >= 0 ? carDataList[currentCarIndex] : currentCarData
        }
        isDark={isDark}
      />
    </View>
  );
};

export default RegisterScreen;

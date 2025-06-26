// src/screens/RegisterScreen.tsx - UNIVERSAL COMPONENT
import React, { useState } from 'react';
import { Platform } from 'react-native';

// Conditional imports - solo quelli necessari per la piattaforma corrente
let RNComponents: any = {};
let WebComponents: any = {};

if (Platform.OS !== 'web') {
  // React Native imports per mobile
  const RN = require('react-native');
  const Paper = require('react-native-paper');
  const VectorIcons = require('react-native-vector-icons/MaterialIcons');
  const AuthSession = require('expo-auth-session');
  const AppleAuth = require('expo-apple-authentication');
  const Google = require('expo-auth-session/providers/google');
  
  RNComponents = {
    View: RN.View,
    ScrollView: RN.ScrollView,
    Text: RN.Text,
    TextInput: RN.TextInput,
    TouchableOpacity: RN.TouchableOpacity,
    SafeAreaView: RN.SafeAreaView,
    KeyboardAvoidingView: RN.KeyboardAvoidingView,
    Alert: RN.Alert,
    StyleSheet: RN.StyleSheet,
    ActivityIndicator: RN.ActivityIndicator,
    Button: Paper.Button,
    Card: Paper.Card,
    Checkbox: Paper.Checkbox,
    Portal: Paper.Portal,
    Modal: Paper.Modal,
    Icon: VectorIcons.default,
    AuthSession,
    AppleAuth,
    Google
  };
} else {
  // Web imports
  WebComponents = {
    // Lucide icons per web
    Car: require('lucide-react').Car,
    Wrench: require('lucide-react').Wrench,
    User: require('lucide-react').User,
    Mail: require('lucide-react').Mail,
    Lock: require('lucide-react').Lock,
    Phone: require('lucide-react').Phone,
    MapPin: require('lucide-react').MapPin,
    Building: require('lucide-react').Building,
    FileText: require('lucide-react').FileText,
    Eye: require('lucide-react').Eye,
    EyeOff: require('lucide-react').EyeOff,
    Loader2: require('lucide-react').Loader2,
    CheckCircle: require('lucide-react').CheckCircle,
    AlertCircle: require('lucide-react').AlertCircle,
    Apple: require('lucide-react').Apple
  };
}

// Firebase imports (universali)
import { 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  updateProfile,
  signInWithCredential
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

// TypeScript interfaces (condivise)
interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  workshopName: string;
  address: string;
  vatNumber: string;
  mechanicLicense: string;
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
  verified?: boolean;
  workshopName?: string;
  address?: string;
  vatNumber?: string;
  mechanicLicense?: string;
  rating?: number;
  reviewsCount?: number;
  services?: string[];
  createdAt: any;
  lastLogin: any;
}

const RegisterScreen: React.FC = () => {
  // 🧠 LOGICA CONDIVISA (identica per tutte le piattaforme)
  const [currentPage, setCurrentPage] = useState<UserType>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const [showTermsModal, setShowTermsModal] = useState(false);

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

  // Google OAuth setup per mobile
  let request: any, response: any, promptAsync: any;
  if (Platform.OS !== 'web' && RNComponents.Google) {
    [request, response, promptAsync] = RNComponents.Google.useAuthRequest({
      clientId: 'YOUR_GOOGLE_CLIENT_ID',
      iosClientId: 'YOUR_IOS_CLIENT_ID',
      androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    });

    React.useEffect(() => {
      if (response?.type === 'success') {
        handleGoogleAuthResponse(response);
      }
    }, [response]);
  }

  // Gestione input (universale)
  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (success) setSuccess(false);
  };

  // Validazione (universale)
  const validateStep = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        if (!formData.firstName.trim()) {
          showError('Il nome è obbligatorio');
          return false;
        }
        if (!formData.lastName.trim()) {
          showError('Il cognome è obbligatorio');
          return false;
        }
        if (!formData.phone.trim()) {
          showError('Il numero di telefono è obbligatorio');
          return false;
        }
        return true;
      
      case 2:
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          showError('Formato email non valido');
          return false;
        }
        if (formData.password.length < 6) {
          showError('La password deve essere di almeno 6 caratteri');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          showError('Le password non coincidono');
          return false;
        }
        return true;
      
      case 3:
        if (currentPage === 'mechanic') {
          if (!formData.workshopName.trim()) {
            showError('Il nome dell\'officina è obbligatorio');
            return false;
          }
          if (!formData.address.trim()) {
            showError('L\'indirizzo è obbligatorio');
            return false;
          }
          if (!formData.vatNumber.trim()) {
            showError('La Partita IVA è obbligatoria');
            return false;
          }
          const vatRegex = /^\d{11}$/;
          if (!vatRegex.test(formData.vatNumber)) {
            showError('La Partita IVA deve contenere 11 cifre');
            return false;
          }
        }
        if (!termsAccepted) {
          showError('Devi accettare i termini di servizio e la privacy policy');
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  // Helper per gestire errori in modo platform-specific
  const showError = (message: string) => {
    if (Platform.OS === 'web') {
      setError(message);
    } else {
      RNComponents.Alert.alert('Errore', message);
    }
  };

  const showSuccess = (message: string) => {
    if (Platform.OS === 'web') {
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } else {
      RNComponents.Alert.alert('Successo', message, [
        { text: 'OK', onPress: () => {/* Navigate to dashboard */} }
      ]);
    }
  };

  // Navigation helpers
  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  // Social Authentication (platform-specific)
  const handleGoogleLogin = async () => {
    setSocialLoading('google');
    
    try {
      if (Platform.OS === 'web') {
        // Web popup approach
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        const result = await signInWithPopup(auth, provider);
        await saveUserToFirestore(result.user, 'google');
        showSuccess('Accesso effettuato con Google!');
        
      } else {
        // Mobile approach
        if (!request) {
          showError('Configurazione Google non pronta');
          return;
        }
        await promptAsync();
      }
    } catch (error: any) {
      console.error('Errore Google Sign-In:', error);
      showError('Errore durante l\'accesso con Google');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleGoogleAuthResponse = async (authResponse: any) => {
    try {
      const { authentication } = authResponse;
      const credential = GoogleAuthProvider.credential(
        authentication.idToken,
        authentication.accessToken
      );
      
      const result = await signInWithCredential(auth, credential);
      await saveUserToFirestore(result.user, 'google');
      showSuccess('Accesso effettuato con Google!');
      
    } catch (error: any) {
      console.error('Errore autenticazione Google:', error);
      showError('Errore durante l\'autenticazione con Google');
    }
  };

  const handleAppleLogin = async () => {
    setSocialLoading('apple');
    
    try {
      if (Platform.OS === 'web') {
        // Web Apple Sign-In
        const provider = new OAuthProvider('apple.com');
        provider.addScope('email');
        provider.addScope('name');
        
        const result = await signInWithPopup(auth, provider);
        await saveUserToFirestore(result.user, 'apple');
        showSuccess('Accesso effettuato con Apple!');
        
      } else if (Platform.OS === 'ios') {
        // iOS native Apple Sign-In
        const isAvailable = await RNComponents.AppleAuth.isAvailableAsync();
        if (!isAvailable) {
          showError('Apple Sign-In non è disponibile su questo dispositivo');
          return;
        }

        const credential = await RNComponents.AppleAuth.signInAsync({
          requestedScopes: [
            RNComponents.AppleAuth.AppleAuthenticationScope.FULL_NAME,
            RNComponents.AppleAuth.AppleAuthenticationScope.EMAIL,
          ],
        });

        // Per una completa integrazione Firebase, configurare l'OAuthProvider
        showSuccess('Accesso effettuato con Apple!');
      } else {
        showError('Apple Sign-In disponibile solo su iOS e Web');
      }
    } catch (error: any) {
      console.error('Errore Apple Sign-In:', error);
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        showError('Errore durante l\'accesso con Apple');
      }
    } finally {
      setSocialLoading(null);
    }
  };

  // Email/Password Registration (universale)
  const handleEmailRegistration = async () => {
    if (!validateStep(3)) return;

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );

      await updateProfile(userCredential.user, {
        displayName: `${formData.firstName} ${formData.lastName}`
      });

      await saveUserToFirestore(userCredential.user, 'email');
      showSuccess('Registrazione completata con successo!');

    } catch (error: any) {
      console.error('Errore durante la registrazione:', error);
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
      }

      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Save user to Firestore (universale)
  const saveUserToFirestore = async (user: any, loginProvider: string) => {
    const displayName = user.displayName || '';
    const [firstName, ...lastNameArray] = displayName.split(' ');
    const lastName = lastNameArray.join(' ');

    const userData: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      firstName: loginProvider === 'email' ? formData.firstName : (firstName || 'Nome'),
      lastName: loginProvider === 'email' ? formData.lastName : (lastName || 'Cognome'),
      phone: loginProvider === 'email' ? formData.phone : (user.phoneNumber || ''),
      userType: currentPage,
      loginProvider,
      profileComplete: loginProvider === 'email',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    };

    if (currentPage === 'mechanic') {
      if (loginProvider === 'email') {
        userData.workshopName = formData.workshopName;
        userData.address = formData.address;
        userData.vatNumber = formData.vatNumber;
        userData.mechanicLicense = formData.mechanicLicense;
      }
      userData.verified = false;
      userData.rating = 0;
      userData.reviewsCount = 0;
      userData.services = [];
    }

    await setDoc(doc(db, 'users', user.uid), userData);
  };

  // 🎨 RENDER PLATFORM-SPECIFIC UI
  if (Platform.OS === 'web') {
    return renderWebUI();
  } else {
    return renderMobileUI();
  }

  // 🌐 WEB UI
  function renderWebUI() {
    const { Car, Wrench, User, Mail, Lock, Phone, MapPin, Building, FileText, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Apple } = WebComponents;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Car className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Registrati su AutoCare
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              La tua piattaforma completa per la gestione dell'auto
            </p>
          </div>

          {/* User Type Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCurrentPage('user')}
              className={`flex flex-col items-center p-4 rounded-lg border-2 transition-colors ${
                currentPage === 'user'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">Proprietario</span>
              <span className="text-xs text-gray-500">Auto privata</span>
            </button>
            
            <button
              type="button"
              onClick={() => setCurrentPage('mechanic')}
              className={`flex flex-col items-center p-4 rounded-lg border-2 transition-colors ${
                currentPage === 'mechanic'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <Wrench className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">Meccanico</span>
              <span className="text-xs text-gray-500">Officina/Garage</span>
            </button>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || socialLoading !== null}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {socialLoading === 'google' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continua con Google
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={handleAppleLogin}
              disabled={loading || socialLoading !== null}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {socialLoading === 'apple' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Apple className="w-5 h-5 mr-3" />
                  Continua con Apple
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-blue-50 text-gray-500">oppure</span>
            </div>
          </div>

          {/* Multi-step Form */}
          <div className="bg-white py-8 px-4 shadow rounded-lg sm:px-10">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center">
                {[1, 2, 3].map((stepNumber) => (
                  <React.Fragment key={stepNumber}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      step >= stepNumber ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step > stepNumber ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-medium">{stepNumber}</span>
                      )}
                    </div>
                    {stepNumber < 3 && (
                      <div className={`flex-1 h-1 mx-2 ${
                        step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Form Steps */}
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Dati personali</h3>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Nome"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Cognome"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      placeholder="Numero di telefono"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Credenziali account</h3>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Conferma password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  {currentPage === 'mechanic' && (
                    <>
                      <h3 className="text-lg font-medium text-gray-900">Dati professionali</h3>
                      
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Nome officina"
                          value={formData.workshopName}
                          onChange={(e) => handleInputChange('workshopName', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                      
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPin className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Indirizzo completo"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                      
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FileText className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Partita IVA (11 cifre)"
                          value={formData.vatNumber}
                          onChange={(e) => handleInputChange('vatNumber', e.target.value)}
                          pattern="[0-9]{11}"
                          maxLength={11}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                      
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FileText className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Numero patente meccanico (opzionale)"
                          value={formData.mechanicLicense}
                          onChange={(e) => handleInputChange('mechanicLicense', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="flex items-center mt-6">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                      Accetto i{' '}
                      <button type="button" className="text-blue-600 hover:text-blue-500">
                        termini di servizio
                      </button>{' '}
                      e la{' '}
                      <button type="button" className="text-blue-600 hover:text-blue-500">
                        privacy policy
                      </button>
                    </label>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="flex items-center p-4 text-red-800 bg-red-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 mr-3" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Success Display */}
              {success && (
                <div className="flex items-center p-4 text-green-800 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 mr-3" />
                  <span className="text-sm">
                    Registrazione completata con successo! Reindirizzamento in corso...
                  </span>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Indietro
                  </button>
                )}
                
                <div className="ml-auto">
                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Avanti
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEmailRegistration}
                      disabled={loading || !termsAccepted}
                      className="flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Registrazione in corso...
                        </>
                      ) : (
                        'Completa registrazione'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Hai già un account?{' '}
              <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Accedi qui
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 📱 MOBILE UI
  function renderMobileUI() {
    const {
      SafeAreaView, ScrollView, View, Text, TextInput, TouchableOpacity,
      KeyboardAvoidingView, ActivityIndicator, StyleSheet,
      Button, Card, Checkbox, Portal, Modal, Icon
    } = RNComponents;

    const styles = StyleSheet.create({
      container: { flex: 1, backgroundColor: '#f5f5f5' },
      keyboardAvoid: { flex: 1 },
      scrollContainer: { flexGrow: 1, padding: 16 },
      header: { alignItems: 'center', marginBottom: 24 },
      title: { fontSize: 24, fontWeight: 'bold', marginTop: 16, textAlign: 'center' },
      subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 8 },
      card: { marginBottom: 16 },
      userTypeContainer: { marginBottom: 16 },
      sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
      userTypeButtons: { flexDirection: 'row', justifyContent: 'space-between' },
      userTypeButton: {
        flex: 1, alignItems: 'center', padding: 16, borderWidth: 2,
        borderColor: '#e0e0e0', borderRadius: 8, marginHorizontal: 4, backgroundColor: '#fff'
      },
      userTypeButtonActive: { borderColor: '#2196F3', backgroundColor: '#e3f2fd' },
      userTypeButtonText: { fontSize: 16, fontWeight: '600', marginTop: 8, color: '#666' },
      userTypeButtonTextActive: { color: '#2196F3' },
      userTypeButtonSubtext: { fontSize: 12, color: '#999', marginTop: 4 },
      socialButton: { marginBottom: 8 },
      orContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
      orLine: { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
      orText: { marginHorizontal: 16, color: '#666' },
      progressContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
      progressItem: { flexDirection: 'row', alignItems: 'center' },
      progressCircle: {
        width: 32, height: 32, borderRadius: 16, backgroundColor: '#e0e0e0',
        justifyContent: 'center', alignItems: 'center'
      },
      progressCircleActive: { backgroundColor: '#2196F3' },
      progressText: { color: '#666', fontWeight: '600' },
      progressTextActive: { color: '#fff' },
      progressLine: { width: 40, height: 2, backgroundColor: '#e0e0e0', marginHorizontal: 8 },
      progressLineActive: { backgroundColor: '#2196F3' },
      stepContainer: { marginBottom: 16 },
      stepTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
      inputContainer: {
        flexDirection: 'row', alignItems: 'center', borderWidth: 1,
        borderColor: '#e0e0e0', borderRadius: 8, marginBottom: 12, backgroundColor: '#fff'
      },
      inputIcon: { marginLeft: 12 },
      input: { flex: 1, paddingHorizontal: 12, paddingVertical: 16, fontSize: 16 },
      passwordToggle: { padding: 12 },
      checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
      checkboxText: { marginLeft: 8, fontSize: 14, color: '#666', textDecorationLine: 'underline' },
      navigationContainer: { flexDirection: 'row', marginTop: 24 },
      navButton: { flex: 1 },
      navButtonSpacer: { width: 16 },
      loginLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
      loginLinkText: { fontSize: 14, color: '#666' },
      loginLinkButton: { fontSize: 14, color: '#2196F3', fontWeight: '600' },
      modalContent: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8, maxHeight: '80%' },
      modalScroll: { marginVertical: 16 },
      modalParagraph: { marginTop: 16 },
      modalButton: { marginTop: 16 }
    });

    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Icon name="directions-car" size={48} color="#2196F3" />
              <Text style={styles.title}>Registrati su AutoCare</Text>
              <Text style={styles.subtitle}>
                La tua piattaforma completa per la gestione dell'auto
              </Text>
            </View>

            <Card style={styles.card}>
              <Card.Content>
                {/* User Type Selection */}
                <View style={styles.userTypeContainer}>
                  <Text style={styles.sectionTitle}>Che tipo di utente sei?</Text>
                  <View style={styles.userTypeButtons}>
                    <TouchableOpacity
                      style={[
                        styles.userTypeButton,
                        currentPage === 'user' && styles.userTypeButtonActive
                      ]}
                      onPress={() => setCurrentPage('user')}
                    >
                      <Icon name="person" size={32} color={currentPage === 'user' ? '#2196F3' : '#666'} />
                      <Text style={[
                        styles.userTypeButtonText,
                        currentPage === 'user' && styles.userTypeButtonTextActive
                      ]}>
                        Proprietario
                      </Text>
                      <Text style={styles.userTypeButtonSubtext}>Auto privata</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.userTypeButton,
                        currentPage === 'mechanic' && styles.userTypeButtonActive
                      ]}
                      onPress={() => setCurrentPage('mechanic')}
                    >
                      <Icon name="build" size={32} color={currentPage === 'mechanic' ? '#2196F3' : '#666'} />
                      <Text style={[
                        styles.userTypeButtonText,
                        currentPage === 'mechanic' && styles.userTypeButtonTextActive
                      ]}>
                        Meccanico
                      </Text>
                      <Text style={styles.userTypeButtonSubtext}>Officina/Garage</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Social Login */}
                <View>
                  <Button
                    mode="outlined"
                    onPress={handleGoogleLogin}
                    loading={socialLoading === 'google'}
                    disabled={loading || socialLoading !== null}
                    style={styles.socialButton}
                    icon="google"
                  >
                    Continua con Google
                  </Button>

                  {Platform.OS === 'ios' && (
                    <Button
                      mode="outlined"
                      onPress={handleAppleLogin}
                      loading={socialLoading === 'apple'}
                      disabled={loading || socialLoading !== null}
                      style={styles.socialButton}
                      icon="apple"
                    >
                      Continua con Apple
                    </Button>
                  )}
                </View>

                <View style={styles.orContainer}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>oppure</Text>
                  <View style={styles.orLine} />
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  {[1, 2, 3].map((stepNumber) => (
                    <View key={stepNumber} style={styles.progressItem}>
                      <View style={[
                        styles.progressCircle,
                        step >= stepNumber && styles.progressCircleActive
                      ]}>
                        <Text style={[
                          styles.progressText,
                          step >= stepNumber && styles.progressTextActive
                        ]}>
                          {stepNumber}
                        </Text>
                      </View>
                      {stepNumber < 3 && (
                        <View style={[
                          styles.progressLine,
                          step > stepNumber && styles.progressLineActive
                        ]} />
                      )}
                    </View>
                  ))}
                </View>

                {/* Form Steps */}
                {step === 1 && (
                  <View style={styles.stepContainer}>
                    <Text style={styles.stepTitle}>Dati personali</Text>
                    
                    <View style={styles.inputContainer}>
                      <Icon name="person" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Nome"
                        value={formData.firstName}
                        onChangeText={(value) => handleInputChange('firstName', value)}
                        autoCapitalize="words"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Icon name="person" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Cognome"
                        value={formData.lastName}
                        onChangeText={(value) => handleInputChange('lastName', value)}
                        autoCapitalize="words"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Icon name="phone" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Numero di telefono"
                        value={formData.phone}
                        onChangeText={(value) => handleInputChange('phone', value)}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>
                )}

                {step === 2 && (
                  <View style={styles.stepContainer}>
                    <Text style={styles.stepTitle}>Credenziali account</Text>
                    
                    <View style={styles.inputContainer}>
                      <Icon name="email" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={formData.email}
                        onChangeText={(value) => handleInputChange('email', value)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Password"
                        value={formData.password}
                        onChangeText={(value) => handleInputChange('password', value)}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity
                        style={styles.passwordToggle}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Icon name={showPassword ? "visibility-off" : "visibility"} size={20} color="#666" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                      <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Conferma password"
                        value={formData.confirmPassword}
                        onChangeText={(value) => handleInputChange('confirmPassword', value)}
                        secureTextEntry={!showConfirmPassword}
                      />
                      <TouchableOpacity
                        style={styles.passwordToggle}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <Icon name={showConfirmPassword ? "visibility-off" : "visibility"} size={20} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {step === 3 && (
                  <View style={styles.stepContainer}>
                    {currentPage === 'mechanic' && (
                      <>
                        <Text style={styles.stepTitle}>Dati professionali</Text>
                        
                        <View style={styles.inputContainer}>
                          <Icon name="business" size={20} color="#666" style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="Nome officina"
                            value={formData.workshopName}
                            onChangeText={(value) => handleInputChange('workshopName', value)}
                          />
                        </View>

                        <View style={styles.inputContainer}>
                          <Icon name="location-on" size={20} color="#666" style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="Indirizzo completo"
                            value={formData.address}
                            onChangeText={(value) => handleInputChange('address', value)}
                            multiline
                          />
                        </View>

                        <View style={styles.inputContainer}>
                          <Icon name="description" size={20} color="#666" style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="Partita IVA (11 cifre)"
                            value={formData.vatNumber}
                            onChangeText={(value) => handleInputChange('vatNumber', value)}
                            keyboardType="numeric"
                            maxLength={11}
                          />
                        </View>

                        <View style={styles.inputContainer}>
                          <Icon name="card-membership" size={20} color="#666" style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="Numero patente meccanico (opzionale)"
                            value={formData.mechanicLicense}
                            onChangeText={(value) => handleInputChange('mechanicLicense', value)}
                          />
                        </View>
                      </>
                    )}

                    <View style={styles.checkboxContainer}>
                      <Checkbox
                        status={termsAccepted ? 'checked' : 'unchecked'}
                        onPress={() => setTermsAccepted(!termsAccepted)}
                      />
                      <TouchableOpacity onPress={() => setShowTermsModal(true)}>
                        <Text style={styles.checkboxText}>
                          Accetto i termini di servizio e la privacy policy
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Navigation Buttons */}
                <View style={styles.navigationContainer}>
                  {step > 1 && (
                    <Button
                      mode="outlined"
                      onPress={prevStep}
                      style={styles.navButton}
                    >
                      Indietro
                    </Button>
                  )}
                  
                  <View style={styles.navButtonSpacer} />
                  
                  {step < 3 ? (
                    <Button
                      mode="contained"
                      onPress={nextStep}
                      style={styles.navButton}
                    >
                      Avanti
                    </Button>
                  ) : (
                    <Button
                      mode="contained"
                      onPress={handleEmailRegistration}
                      loading={loading}
                      disabled={loading || !termsAccepted}
                      style={styles.navButton}
                    >
                      Completa registrazione
                    </Button>
                  )}
                </View>
              </Card.Content>
            </Card>

            {/* Login Link */}
            <View style={styles.loginLink}>
              <Text style={styles.loginLinkText}>Hai già un account? </Text>
              <TouchableOpacity onPress={() => {/* Navigate to Login */}}>
                <Text style={styles.loginLinkButton}>Accedi qui</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Terms Modal */}
        <Portal>
          <Modal
            visible={showTermsModal}
            onDismiss={() => setShowTermsModal(false)}
            contentContainerStyle={styles.modalContent}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
              Termini di Servizio e Privacy Policy
            </Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={{ fontSize: 14, lineHeight: 20, marginBottom: 16 }}>
                Qui inserisci i tuoi termini di servizio e la privacy policy completa.
                Questo è solo un esempio per dimostrare la funzionalità del modal.
              </Text>
              <Text style={[styles.modalParagraph, { fontSize: 14, lineHeight: 20 }]}>
                L'utente accetta di utilizzare l'app AutoCare in conformità con le leggi vigenti
                e di fornire informazioni accurate durante la registrazione.
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
      </SafeAreaView>
    );
  }
};

export default RegisterScreen;
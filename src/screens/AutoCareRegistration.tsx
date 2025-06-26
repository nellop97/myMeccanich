import React, { useState } from 'react';
import { Car, Wrench, User, Mail, Lock, Phone, MapPin, Building, FileText, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// Import Firebase services
// IMPORTANTE: Assicurati che il path '../config/firebase' corrisponda alla posizione del tuo file di configurazione Firebase
import { 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase'; // Aggiorna questo path se necessario

const AutoCareRegistration = () => {
  const [currentPage, setCurrentPage] = useState('user'); // 'user' or 'mechanic'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    // Campi specifici per meccanico
    workshopName: '',
    address: '',
    vatNumber: '',
    mechanicLicense: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Reset error quando l'utente inizia a digitare
    if (error) setError('');
    if (success) setSuccess(false);
  };

  const handleSocialLogin = async (provider) => {
    setSocialLoading(provider);
    setError('');
    
    try {
      let authProvider;
      
      if (provider === 'Google') {
        authProvider = new GoogleAuthProvider();
        authProvider.addScope('email');
        authProvider.addScope('profile');
      } else if (provider === 'Apple') {
        authProvider = new OAuthProvider('apple.com');
        authProvider.addScope('email');
        authProvider.addScope('name');
      }
      
      const result = await signInWithPopup(auth, authProvider);
      const user = result.user;
      
      // Prepara i dati utente
      const userData = {
        uid: user.uid,
        email: user.email,
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ')[1] || '',
        phone: user.phoneNumber || '',
        userType: currentPage,
        loginProvider: provider,
        createdAt: new Date(),
        lastLogin: new Date()
      };
      
      // Se è un meccanico ma non ha completato il profilo, 
      // salva i dati base e richiedi completamento
      if (currentPage === 'mechanic') {
        userData.profileComplete = false;
        userData.workshopName = '';
        userData.address = '';
        userData.vatNumber = '';
        userData.mechanicLicense = '';
      } else {
        userData.profileComplete = true;
      }
      
      // Salva in Firestore
      await setDoc(doc(db, 'users', user.uid), userData);
      
      setSuccess(true);
      console.log('Registrazione social completata:', userData);
      
      // Redirect o callback di successo
      setTimeout(() => {
        if (currentPage === 'mechanic' && !userData.profileComplete) {
          // Potresti reindirizzare a una pagina di completamento profilo
          alert('Registrazione completata! Completa il tuo profilo officina.');
        } else {
          alert('Registrazione completata con successo!');
        }
      }, 1000);
      
    } catch (error) {
      console.error('Errore registrazione social:', error);
      
      // Gestisci errori specifici
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Accesso annullato dall\'utente');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Popup bloccato dal browser. Abilita i popup per questo sito.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setError('Esiste già un account con questa email usando un provider diverso.');
      } else {
        setError(`Errore durante la registrazione: ${error.message}`);
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage !== currentPage) {
      setCurrentPage(newPage);
      // Reset dello stato quando si cambia tipo di utente
      setError('');
      setSuccess(false);
      // Reset solo dei campi specifici del meccanico se si passa da meccanico a utente
      if (currentPage === 'mechanic' && newPage === 'user') {
        setFormData(prev => ({
          ...prev,
          workshopName: '',
          address: '',
          vatNumber: '',
          mechanicLicense: ''
        }));
      }
    }
  };
    // Reset errori
    setError('');
    
    // Validazione campi obbligatori
    if (!formData.firstName.trim()) {
      setError('Il nome è obbligatorio');
      return false;
    }
    
    if (!formData.lastName.trim()) {
      setError('Il cognome è obbligatorio');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('L\'email è obbligatoria');
      return false;
    }
    
    // Validazione formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Formato email non valido');
      return false;
    }
    
    if (!formData.phone.trim()) {
      setError('Il telefono è obbligatorio');
      return false;
    }
    
    // Validazione password
    if (!formData.password) {
      setError('La password è obbligatoria');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Le password non coincidono');
      return false;
    }
    
    // Validazione campi meccanico
    if (currentPage === 'mechanic') {
      if (!formData.workshopName.trim()) {
        setError('Il nome dell\'officina è obbligatorio');
        return false;
      }
      
      if (!formData.address.trim()) {
        setError('L\'indirizzo è obbligatorio');
        return false;
      }
      
      if (!formData.vatNumber.trim()) {
        setError('La Partita IVA è obbligatoria');
        return false;
      }
      
      // Validazione base Partita IVA italiana (11 cifre)
      const vatRegex = /^\d{11}$/;
      if (!vatRegex.test(formData.vatNumber)) {
        setError('La Partita IVA deve contenere 11 cifre');
        return false;
      }
    }
    
    // Validazione termini
    if (!termsAccepted) {
      setError('Devi accettare i termini di servizio e la privacy policy');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    // Validazione
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Crea utente con Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email.trim(), 
        formData.password
      );
      
      const user = userCredential.user;
      
      // Prepara dati per Firestore
      const userData = {
        uid: user.uid,
        email: formData.email.trim().toLowerCase(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        userType: currentPage,
        loginProvider: 'email',
        profileComplete: true,
        createdAt: new Date(),
        lastLogin: new Date()
      };
      
      // Aggiungi campi specifici per meccanico
      if (currentPage === 'mechanic') {
        userData.workshopName = formData.workshopName.trim();
        userData.address = formData.address.trim();
        userData.vatNumber = formData.vatNumber.trim();
        userData.mechanicLicense = formData.mechanicLicense.trim();
        
        // Campi aggiuntivi per meccanici
        userData.verified = false; // Da verificare manualmente
        userData.rating = 0;
        userData.reviewsCount = 0;
        userData.services = [];
      }
      
      // Salva in Firestore
      await setDoc(doc(db, 'users', user.uid), userData);
      
      setSuccess(true);
      console.log('Registrazione completata:', userData);
      
      // Feedback successo
      setTimeout(() => {
        alert(`Registrazione completata con successo! Benvenuto${currentPage === 'user' ? '' : ' nella community AutoCare'}, ${formData.firstName}!`);
        
        // Qui potresti fare il redirect alla dashboard
        // window.location.href = '/dashboard';
      }, 1000);
      
    } catch (error) {
      console.error('Errore durante la registrazione:', error);
      
      // Gestisci errori specifici di Firebase Auth
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('Questa email è già registrata. Prova ad accedere invece.');
          break;
        case 'auth/weak-password':
          setError('La password è troppo debole. Usa almeno 6 caratteri.');
          break;
        case 'auth/invalid-email':
          setError('Formato email non valido.');
          break;
        case 'auth/operation-not-allowed':
          setError('Registrazione email/password non abilitata. Contatta il supporto.');
          break;
        case 'auth/network-request-failed':
          setError('Errore di connessione. Controlla la tua connessione internet.');
          break;
        default:
          setError(`Errore durante la registrazione: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const SocialButton = ({ provider, icon, bgColor, textColor }) => {
    const isLoading = socialLoading === provider;
    const isDisabled = socialLoading !== null || loading;
    
    return (
      <button
        onClick={() => !isDisabled && handleSocialLogin(provider)}
        disabled={isDisabled}
        className={`w-full ${bgColor} ${textColor} py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-3 hover:opacity-90 transition-all duration-200 shadow-md disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          icon
        )}
        {isLoading ? 'Connessione...' : `Continua con ${provider}`}
      </button>
    );
  };

  const InputField = ({ icon: Icon, type, name, placeholder, value, required = true }) => (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200 outline-none"
      />
    </div>
  );

  const AlertMessage = ({ type, message }) => {
    if (!message) return null;
    
    const isError = type === 'error';
    const isSuccess = type === 'success';
    
    return (
      <div className={`p-4 rounded-xl flex items-center gap-3 mb-4 ${
        isError ? 'bg-red-50 border border-red-200' : 
        isSuccess ? 'bg-green-50 border border-green-200' : 
        'bg-blue-50 border border-blue-200'
      }`}>
        {isError && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
        {isSuccess && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
        <p className={`text-sm ${
          isError ? 'text-red-700' : 
          isSuccess ? 'text-green-700' : 
          'text-blue-700'
        }`}>
          {message}
        </p>
      </div>
    );
  };
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type={showPassword ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200 outline-none"
      />
      <button
        type="button"
        onClick={toggleShow}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header con toggle */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center gap-2">
              <Car className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-800">AutoCare</span>
            </div>
          </div>
          
          {/* Toggle buttons */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => handlePageChange('user')}
              disabled={loading || socialLoading !== null}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 ${
                currentPage === 'user' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <User className="w-4 h-4" />
              Proprietario
            </button>
            <button
              onClick={() => handlePageChange('mechanic')}
              disabled={loading || socialLoading !== null}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 ${
                currentPage === 'mechanic' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Wrench className="w-4 h-4" />
              Meccanico
            </button>
          </div>
        </div>
      </div>

      {/* Contenuto principale */}
      <div className="max-w-md mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Titolo dinamico */}
          <div className="text-center mb-8">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              currentPage === 'user' ? 'bg-blue-100' : 'bg-orange-100'
            }`}>
              {currentPage === 'user' ? (
                <User className={`w-8 h-8 ${currentPage === 'user' ? 'text-blue-600' : 'text-orange-600'}`} />
              ) : (
                <Wrench className={`w-8 h-8 ${currentPage === 'user' ? 'text-blue-600' : 'text-orange-600'}`} />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {currentPage === 'user' ? 'Registrati come Proprietario' : 'Registrati come Meccanico'}
            </h2>
            <p className="text-gray-600">
              {currentPage === 'user' 
                ? 'Gestisci i tuoi veicoli e la manutenzione' 
                : 'Gestisci la tua officina e i clienti'}
            </p>
          </div>

          {/* Pulsanti Social */}
          <div className="space-y-3 mb-6">
            <SocialButton
              provider="Google"
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              }
              bgColor="bg-white border border-gray-200"
              textColor="text-gray-700"
            />
            <SocialButton
              provider="Apple"
              icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              }
              bgColor="bg-black"
              textColor="text-white"
            />
          </div>

          {/* Separatore */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">oppure registrati con email</span>
            </div>
          </div>

          {/* Campi di registrazione */}
          <div className="space-y-4">
            {/* Campi comuni */}
            <div className="grid grid-cols-2 gap-4">
              <InputField
                icon={User}
                type="text"
                name="firstName"
                placeholder="Nome"
                value={formData.firstName}
              />
              <InputField
                icon={User}
                type="text"
                name="lastName"
                placeholder="Cognome"
                value={formData.lastName}
              />
            </div>

            <InputField
              icon={Mail}
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
            />

            <InputField
              icon={Phone}
              type="tel"
              name="phone"
              placeholder="Telefono"
              value={formData.phone}
            />

            {/* Campi specifici per meccanico */}
            {currentPage === 'mechanic' && (
              <div className="space-y-4 pt-2">
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Informazioni Officina</h3>
                </div>
                <InputField
                  icon={Building}
                  type="text"
                  name="workshopName"
                  placeholder="Nome Officina"
                  value={formData.workshopName}
                />
                <InputField
                  icon={MapPin}
                  type="text"
                  name="address"
                  placeholder="Indirizzo completo"
                  value={formData.address}
                />
                <InputField
                  icon={FileText}
                  type="text"
                  name="vatNumber"
                  placeholder="Partita IVA"
                  value={formData.vatNumber}
                />
                <InputField
                  icon={FileText}
                  type="text"
                  name="mechanicLicense"
                  placeholder="Numero Licenza (opzionale)"
                  value={formData.mechanicLicense}
                  required={false}
                />
              </div>
            )}

            <PasswordField
              name="password"
              placeholder="Password"
              value={formData.password}
              showPassword={showPassword}
              toggleShow={() => setShowPassword(!showPassword)}
            />

            <PasswordField
              name="confirmPassword"
              placeholder="Conferma Password"
              value={formData.confirmPassword}
              showPassword={showConfirmPassword}
              toggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            {/* Alert per errori/successo */}
            <AlertMessage type="error" message={error} />
            <AlertMessage type="success" message={success ? 'Registrazione completata con successo!' : ''} />

            {/* Checkbox termini */}
            <div className="flex items-start gap-3 mt-6">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                Accetto i{' '}
                <button type="button" className="text-blue-600 hover:underline">
                  Termini di Servizio
                </button>{' '}
                e la{' '}
                <button type="button" className="text-blue-600 hover:underline">
                  Privacy Policy
                </button>
              </label>
            </div>

            {/* Pulsante registrazione */}
            <button
              onClick={handleSubmit}
              disabled={loading || socialLoading !== null || success}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mt-6 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none ${
                currentPage === 'user' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' 
                  : 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Registrazione in corso...
                </div>
              ) : success ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Registrazione completata!
                </div>
              ) : (
                `Registrati come ${currentPage === 'user' ? 'Proprietario' : 'Meccanico'}`
              )}
            </button>
          </div>

          {/* Link al login */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Hai già un account?{' '}
              <button className="text-blue-600 hover:underline font-medium">
                Accedi qui
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-gray-500 text-sm">
          © 2025 AutoCare. Tutti i diritti riservati.
        </p>
      </div>
    </div>
  );
};

export default AutoCareRegistration;
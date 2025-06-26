import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Alert,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Controller, useForm } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ArrowLeft,
  Calendar,
  Car,
  DollarSign,
  FileText,
  Save,
  Info,
  Key,
  Hash,
  Palette,
  Check,
  ChevronRight,
  ChevronLeft,
  Gauge,
  X
} from 'lucide-react-native';

// Import Firebase
import { db, auth } from '../../services/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { useStore } from '../../store';
import { useUserCarsStore } from '@/src/store/useCarsStore';

const { width: screenWidth } = Dimensions.get('window');

// Theme colors
const theme = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#5AC8FA',
  background: '#FFFFFF',
  cardBackground: '#F8F9FA',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  border: '#E5E5EA',
  placeholder: '#C7C7CC'
};

// Car colors
const CAR_COLORS = [
  { name: 'Bianco', value: '#FFFFFF', border: '#E5E5EA' },
  { name: 'Nero', value: '#000000' },
  { name: 'Argento', value: '#C0C0C0' },
  { name: 'Grigio', value: '#808080' },
  { name: 'Rosso', value: '#FF0000' },
  { name: 'Blu', value: '#0000FF' },
  { name: 'Verde', value: '#008000' },
  { name: 'Marrone', value: '#8B4513' },
  { name: 'Giallo', value: '#FFFF00' },
  { name: 'Arancione', value: '#FFA500' },
];

interface CarFormData {
  make: string;
  model: string;
  year: string;
  color: string;
  licensePlate: string;
  vin: string;
  purchaseDate: string;
  purchasePrice: string;
  purchaseMileage: string;
  currentMileage: string;
  insuranceCompany: string;
  insuranceExpiry: string;
  notes: string;
}

const AddCarScreen = () => {
  const navigation = useNavigation();
  const { darkMode } = useStore();
  const { addCar: addCarToStore } = useUserCarsStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(undefined);
  const [insuranceDate, setInsuranceDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const currentTheme = darkMode ? {
    ...theme,
    background: '#121212',
    cardBackground: '#1e1e1e',
    text: '#ffffff',
    textSecondary: '#a0a0a0',
    border: '#333333',
    placeholder: '#666666'
  } : theme;

  const { control, handleSubmit, formState: { errors }, watch, setValue, getValues, trigger } = useForm<CarFormData>({
    defaultValues: {
      make: '',
      model: '',
      year: new Date().getFullYear().toString(),
      color: '',
      licensePlate: '',
      vin: '',
      purchaseDate: '',
      purchasePrice: '',
      purchaseMileage: '',
      currentMileage: '',
      insuranceCompany: '',
      insuranceExpiry: '',
      notes: ''
    }
  });

  const selectedColor = watch('color');

  const steps = [
    {
      title: 'Informazioni Base',
      subtitle: 'Marca, modello e identificazione',
      fields: ['make', 'model', 'year', 'licensePlate']
    },
    {
      title: 'Personalizzazione',
      subtitle: 'Colore e dettagli aggiuntivi',
      fields: ['color', 'vin', 'currentMileage']
    },
    {
      title: 'Acquisto',
      subtitle: 'Dati di acquisto (opzionali)',
      fields: ['purchaseDate', 'purchasePrice', 'purchaseMileage']
    },
    {
      title: 'Assicurazione',
      subtitle: 'Informazioni assicurative (opzionali)',
      fields: ['insuranceCompany', 'insuranceExpiry', 'notes']
    }
  ];

  // Funzione per salvare il veicolo su Firebase
  const saveCarToFirebase = async (carData: any) => {
    try {
      if (!auth.currentUser) {
        throw new Error('Utente non autenticato');
      }

      const vehicleData = {
        ...carData,
        ownerId: auth.currentUser.uid,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Salva su Firestore
      const docRef = await addDoc(collection(db, 'vehicles'), vehicleData);

      return {
        id: docRef.id,
        ...vehicleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Errore durante il salvataggio su Firebase:', error);
      throw error;
    }
  };

  const onSubmit = async (data: CarFormData) => {
    try {
      setIsLoading(true);

      const carData = {
        make: data.make.trim(),
        model: data.model.trim(),
        year: parseInt(data.year) || new Date().getFullYear(),
        color: data.color,
        licensePlate: data.licensePlate.trim().toUpperCase(),
        vin: data.vin.trim() || undefined,
        purchaseDate: data.purchaseDate || undefined,
        purchasePrice: parseFloat(data.purchasePrice) || undefined,
        purchaseMileage: parseInt(data.purchaseMileage) || 0,
        currentMileage: parseInt(data.currentMileage) || parseInt(data.purchaseMileage) || 0,
        insuranceCompany: data.insuranceCompany.trim() || undefined,
        insuranceExpiry: data.insuranceExpiry || undefined,
        notes: data.notes.trim() || undefined,
        maintenanceRecords: [],
        expenses: [],
        documents: [],
        fuelRecords: [],
        reminders: [],
      };

      // Salva su Firebase
      const savedCar = await saveCarToFirebase(carData);

      // Aggiorna anche lo store locale per immediate UI updates
      addCarToStore(carData);

      Alert.alert(
          'Successo! 🚗',
          'Veicolo aggiunto con successo al database!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
      );
    } catch (error: any) {
      console.error('Errore durante il salvataggio:', error);
      Alert.alert(
          'Errore',
          error.message || 'Si è verificato un errore durante il salvataggio. Riprova.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    const currentStepFields = steps[currentStep].fields;
    const requiredFields = currentStep === 0 ? ['make', 'model', 'licensePlate'] : [];

    // Validate required fields for current step
    const isValid = await trigger(requiredFields as any);

    if (isValid) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Stati per il modal date picker personalizzato
  const [showPurchaseDateModal, setShowPurchaseDateModal] = useState(false);
  const [showInsuranceDateModal, setShowInsuranceDateModal] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  // Gestione date picker in modal - EVITA il picker in basso a sinistra
  const openPurchaseDatePicker = () => {
    const currentDate = getSafeDate(watch('purchaseDate'), new Date());
    setTempDate(currentDate);
    setShowPurchaseDateModal(true);
  };

  const openInsuranceDatePicker = () => {
    const currentDate = getSafeDate(watch('insuranceExpiry'), new Date());
    setTempDate(currentDate);
    setShowInsuranceDateModal(true);
  };

  const confirmPurchaseDate = () => {
    setPurchaseDate(tempDate);
    setValue('purchaseDate', tempDate.toISOString().split('T')[0]);
    setShowPurchaseDateModal(false);
  };

  const confirmInsuranceDate = () => {
    setInsuranceDate(tempDate);
    setValue('insuranceExpiry', tempDate.toISOString().split('T')[0]);
    setShowInsuranceDateModal(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Seleziona data';
    try {
      const date = new Date(dateString);
      // Verifica che la data sia valida
      if (isNaN(date.getTime())) {
        return 'Seleziona data';
      }
      return date.toLocaleDateString('it-IT');
    } catch (error) {
      return 'Seleziona data';
    }
  };

  // Funzione per ottenere una data sicura per il DateTimePicker
  const getSafeDate = (dateString: string, fallbackDate: Date = new Date()) => {
    if (!dateString) return fallbackDate;
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? fallbackDate : date;
    } catch (error) {
      return fallbackDate;
    }
  };

  // Modern Input Component
  const ModernInput = ({
                         label,
                         placeholder,
                         value,
                         onChangeText,
                         error,
                         required = false,
                         keyboardType = 'default',
                         icon: Icon,
                         suffix,
                         autoCapitalize = 'none'
                       }: any) => (
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: currentTheme.text }]}>
          {label} {required && <Text style={{ color: currentTheme.error }}>*</Text>}
        </Text>
        <View style={[
          styles.inputWrapper,
          {
            backgroundColor: currentTheme.cardBackground,
            borderColor: error ? currentTheme.error : currentTheme.border
          }
        ]}>
          {Icon && (
              <Icon
                  size={20}
                  color={error ? currentTheme.error : currentTheme.textSecondary}
                  style={styles.inputIcon}
              />
          )}
          <TextInput
              style={[
                styles.textInput,
                {
                  color: currentTheme.text,
                  flex: suffix ? 0.8 : 1
                }
              ]}
              placeholder={placeholder}
              placeholderTextColor={currentTheme.placeholder}
              value={value}
              onChangeText={onChangeText}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
          />
          {suffix && (
              <Text style={[styles.inputSuffix, { color: currentTheme.textSecondary }]}>
                {suffix}
              </Text>
          )}
        </View>
        {error && (
            <Text style={[styles.errorText, { color: currentTheme.error }]}>
              {error.message}
            </Text>
        )}
      </View>
  );

  // Progress Indicator Component
  const ProgressIndicator = () => (
      <View style={[styles.progressContainer, { backgroundColor: currentTheme.cardBackground }]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressTitle, { color: currentTheme.text }]}>
            {steps[currentStep].title}
          </Text>
          <Text style={[styles.progressSubtitle, { color: currentTheme.textSecondary }]}>
            {steps[currentStep].subtitle}
          </Text>
        </View>
        <View style={styles.progressBar}>
          {steps.map((_, index) => (
              <View
                  key={index}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: index <= currentStep
                          ? currentTheme.primary
                          : currentTheme.border
                    }
                  ]}
              />
          ))}
        </View>
        <Text style={[styles.progressText, { color: currentTheme.textSecondary }]}>
          Passo {currentStep + 1} di {steps.length}
        </Text>
      </View>
  );

  // Color Selector Component
  const ColorSelector = () => (
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: currentTheme.text }]}>
          Colore <Text style={{ color: currentTheme.error }}>*</Text>
        </Text>
        <View style={styles.colorGrid}>
          {CAR_COLORS.map((color) => (
              <TouchableOpacity
                  key={color.name}
                  style={[
                    styles.colorOption,
                    {
                      backgroundColor: color.value,
                      borderColor: color.border || currentTheme.border,
                      borderWidth: selectedColor === color.name ? 3 : 1,
                    },
                    selectedColor === color.name && {
                      borderColor: currentTheme.primary,
                      shadowColor: currentTheme.primary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 4,
                    }
                  ]}
                  onPress={() => setValue('color', color.name)}
              >
                {selectedColor === color.name && (
                    <Check size={16} color={color.value === '#FFFFFF' ? '#000000' : '#FFFFFF'} />
                )}
              </TouchableOpacity>
          ))}
        </View>
        {selectedColor && (
            <Text style={[styles.selectedColorText, { color: currentTheme.textSecondary }]}>
              Colore selezionato: {selectedColor}
            </Text>
        )}
      </View>
  );

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
            <View style={[styles.card, { backgroundColor: currentTheme.cardBackground }]}>
              <Controller
                  control={control}
                  name="make"
                  rules={{ required: 'La marca è obbligatoria' }}
                  render={({ field: { onChange, onBlur, value } }) => (
                      <ModernInput
                          label="Marca"
                          placeholder="es. Toyota, BMW, Mercedes"
                          value={value}
                          onChangeText={onChange}
                          error={errors.make}
                          required
                          icon={Car}
                          autoCapitalize="words"
                      />
                  )}
              />

              <Controller
                  control={control}
                  name="model"
                  rules={{ required: 'Il modello è obbligatorio' }}
                  render={({ field: { onChange, onBlur, value } }) => (
                      <ModernInput
                          label="Modello"
                          placeholder="es. Yaris, X3, Classe A"
                          value={value}
                          onChangeText={onChange}
                          error={errors.model}
                          required
                          icon={Car}
                          autoCapitalize="words"
                      />
                  )}
              />

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Controller
                      control={control}
                      name="year"
                      render={({ field: { onChange, onBlur, value } }) => (
                          <ModernInput
                              label="Anno"
                              placeholder="2020"
                              value={value}
                              onChangeText={onChange}
                              keyboardType="numeric"
                              icon={Calendar}
                          />
                      )}
                  />
                </View>

                <View style={styles.halfWidth}>
                  <Controller
                      control={control}
                      name="licensePlate"
                      rules={{ required: 'La targa è obbligatoria' }}
                      render={({ field: { onChange, onBlur, value } }) => (
                          <ModernInput
                              label="Targa"
                              placeholder="AB123CD"
                              value={value}
                              onChangeText={onChange}
                              error={errors.licensePlate}
                              required
                              icon={Hash}
                              autoCapitalize="characters"
                          />
                      )}
                  />
                </View>
              </View>
            </View>
        );

      case 1:
        return (
            <View style={[styles.card, { backgroundColor: currentTheme.cardBackground }]}>
              <ColorSelector />

              <Controller
                  control={control}
                  name="vin"
                  render={({ field: { onChange, onBlur, value } }) => (
                      <ModernInput
                          label="Numero di Telaio (VIN)"
                          placeholder="es. WVWZZZ1JZ1W123456"
                          value={value}
                          onChangeText={onChange}
                          icon={Key}
                          autoCapitalize="characters"
                      />
                  )}
              />

              <Controller
                  control={control}
                  name="currentMileage"
                  render={({ field: { onChange, onBlur, value } }) => (
                      <ModernInput
                          label="Chilometraggio Attuale"
                          placeholder="100000"
                          value={value}
                          onChangeText={onChange}
                          keyboardType="numeric"
                          icon={Gauge}
                          suffix="km"
                      />
                  )}
              />
            </View>
        );

      case 2:
        return (
            <View style={[styles.card, { backgroundColor: currentTheme.cardBackground }]}>
              <Controller
                  control={control}
                  name="purchaseDate"
                  render={({ field: { value } }) => (
                      <View style={styles.inputContainer}>
                        <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Data di Acquisto</Text>
                        <TouchableOpacity
                            style={[styles.dateButton, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.border }]}
                            onPress={openPurchaseDatePicker}
                        >
                          <Calendar size={20} color={currentTheme.textSecondary} />
                          <Text style={[styles.dateButtonText, { color: currentTheme.text }]}>
                            {formatDate(value)}
                          </Text>
                        </TouchableOpacity>
                      </View>
                  )}
              />

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Controller
                      control={control}
                      name="purchasePrice"
                      render={({ field: { onChange, onBlur, value } }) => (
                          <ModernInput
                              label="Prezzo di Acquisto"
                              placeholder="15000"
                              value={value}
                              onChangeText={onChange}
                              keyboardType="numeric"
                              icon={DollarSign}
                              suffix="€"
                          />
                      )}
                  />
                </View>

                <View style={styles.halfWidth}>
                  <Controller
                      control={control}
                      name="purchaseMileage"
                      render={({ field: { onChange, onBlur, value } }) => (
                          <ModernInput
                              label="Km all'Acquisto"
                              placeholder="50000"
                              value={value}
                              onChangeText={onChange}
                              keyboardType="numeric"
                              icon={Gauge}
                              suffix="km"
                          />
                      )}
                  />
                </View>
              </View>
            </View>
        );

      case 3:
        return (
            <View style={[styles.card, { backgroundColor: currentTheme.cardBackground }]}>
              <Controller
                  control={control}
                  name="insuranceCompany"
                  render={({ field: { onChange, onBlur, value } }) => (
                      <ModernInput
                          label="Compagnia Assicurativa"
                          placeholder="es. Generali, UnipolSai"
                          value={value}
                          onChangeText={onChange}
                          icon={FileText}
                          autoCapitalize="words"
                      />
                  )}
              />

              <Controller
                  control={control}
                  name="insuranceExpiry"
                  render={({ field: { value } }) => (
                      <View style={styles.inputContainer}>
                        <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Scadenza Assicurazione</Text>
                        <TouchableOpacity
                            style={[styles.dateButton, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.border }]}
                            onPress={openInsuranceDatePicker}
                        >
                          <Calendar size={20} color={currentTheme.textSecondary} />
                          <Text style={[styles.dateButtonText, { color: currentTheme.text }]}>
                            {formatDate(value)}
                          </Text>
                        </TouchableOpacity>
                      </View>
                  )}
              />

              <Controller
                  control={control}
                  name="notes"
                  render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.inputContainer}>
                        <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Note</Text>
                        <TextInput
                            style={[
                              styles.textArea,
                              {
                                backgroundColor: currentTheme.cardBackground,
                                borderColor: currentTheme.border,
                                color: currentTheme.text
                              }
                            ]}
                            placeholder="Aggiungi note aggiuntive sul veicolo..."
                            placeholderTextColor={currentTheme.placeholder}
                            value={value}
                            onChangeText={onChange}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                      </View>
                  )}
              />
            </View>
        );

      default:
        return null;
    }
  };

  return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <StatusBar
            barStyle={darkMode ? 'light-content' : 'dark-content'}
            backgroundColor={currentTheme.background}
        />

        {/* Header */}
        <View style={[styles.header, { backgroundColor: currentTheme.cardBackground, borderBottomColor: currentTheme.border }]}>
          <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={isLoading}
          >
            <ArrowLeft size={24} color={currentTheme.text} />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Aggiungi Veicolo</Text>
            <Text style={[styles.headerSubtitle, { color: currentTheme.textSecondary }]}>
              Crea il profilo del tuo veicolo
            </Text>
          </View>
        </View>

        <KeyboardAvoidingView
            style={styles.content}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
          >
            <ProgressIndicator />
            {renderStepContent()}

            {/* Info Card */}
            {currentStep === 0 && (
                <View style={[styles.infoCard, { backgroundColor: currentTheme.info + '10' }]}>
                  <View style={styles.infoHeader}>
                    <Info size={20} color={currentTheme.info} />
                    <Text style={[styles.infoTitle, { color: currentTheme.info }]}>Informazioni</Text>
                  </View>
                  <Text style={[styles.infoText, { color: currentTheme.text }]}>
                    I campi contrassegnati con * sono obbligatori. Le altre informazioni possono essere aggiunte successivamente modificando il veicolo.
                  </Text>
                </View>
            )}
          </ScrollView>

          {/* Navigation Buttons */}
          <View style={[styles.navigationContainer, { backgroundColor: currentTheme.cardBackground, borderTopColor: currentTheme.border }]}>
            <View style={styles.navigationButtons}>
              {currentStep > 0 && (
                  <TouchableOpacity
                      style={[styles.navButton, styles.prevButton, { backgroundColor: currentTheme.border }]}
                      onPress={prevStep}
                      disabled={isLoading}
                  >
                    <ChevronLeft size={20} color={currentTheme.textSecondary} />
                    <Text style={[styles.navButtonText, { color: currentTheme.textSecondary }]}>
                      Indietro
                    </Text>
                  </TouchableOpacity>
              )}

              <TouchableOpacity
                  style={[
                    styles.navButton,
                    styles.nextButton,
                    { backgroundColor: currentTheme.primary },
                    currentStep === 0 && { flex: 1 },
                    isLoading && { opacity: 0.7 }
                  ]}
                  onPress={currentStep === steps.length - 1 ? handleSubmit(onSubmit) : nextStep}
                  disabled={isLoading}
              >
                {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                ) : currentStep === steps.length - 1 ? (
                    <>
                      <Save size={20} color="#ffffff" />
                      <Text style={styles.nextButtonText}>Salva Veicolo</Text>
                    </>
                ) : (
                    <>
                      <Text style={styles.nextButtonText}>Avanti</Text>
                      <ChevronRight size={20} color="#ffffff" />
                    </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Modal Date Pickers - SOLUZIONE PULITA senza picker in basso */}

        {/* Modal per data di acquisto */}
        <Modal
            visible={showPurchaseDateModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowPurchaseDateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: currentTheme.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
                  Data di Acquisto
                </Text>
                <TouchableOpacity onPress={() => setShowPurchaseDateModal(false)}>
                  <X size={24} color={currentTheme.textSecondary} />
                </TouchableOpacity>
              </View>

              <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  locale="it-IT"
                  style={{ width: '100%' }}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: currentTheme.border }]}
                    onPress={() => setShowPurchaseDateModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: currentTheme.textSecondary }]}>
                    Annulla
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: currentTheme.primary }]}
                    onPress={confirmPurchaseDate}
                >
                  <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>
                    Conferma
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal per data scadenza assicurazione */}
        <Modal
            visible={showInsuranceDateModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowInsuranceDateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: currentTheme.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
                  Scadenza Assicurazione
                </Text>
                <TouchableOpacity onPress={() => setShowInsuranceDateModal(false)}>
                  <X size={24} color={currentTheme.textSecondary} />
                </TouchableOpacity>
              </View>

              <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  locale="it-IT"
                  style={{ width: '100%' }}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: currentTheme.border }]}
                    onPress={() => setShowInsuranceDateModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: currentTheme.textSecondary }]}>
                    Annulla
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: currentTheme.primary }]}
                    onPress={confirmInsuranceDate}
                >
                  <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>
                    Conferma
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Progress Indicator
  progressContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 12,
  },

  // Card
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  // Inputs
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    fontSize: 16,
    minHeight: 24,
  },
  inputSuffix: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
  },

  // Row layout
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },

  // Color selector
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedColorText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },

  // Date button
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateButtonText: {
    fontSize: 16,
    marginLeft: 12,
  },

  // Info card
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Navigation
  navigationContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 120,
  },
  prevButton: {
    marginRight: 12,
  },
  nextButton: {
    flex: 1,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginHorizontal: 8,
  },

  // Stili per i modal date picker
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddCarScreen;

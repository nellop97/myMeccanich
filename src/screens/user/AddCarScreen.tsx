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
  Animated
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
  Gauge
} from 'lucide-react-native';

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
  const { addCar } = useUserCarsStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);
  const [showInsuranceDatePicker, setShowInsuranceDatePicker] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(undefined);
  const [insuranceDate, setInsuranceDate] = useState<Date | undefined>(undefined);

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

  const onSubmit = (data: CarFormData) => {
    try {
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
        notes: data.notes.trim() || undefined
      };

      addCar(carData);

      Alert.alert(
        'Successo',
        'Veicolo aggiunto con successo!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Errore', 'Si è verificato un errore durante il salvataggio');
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

  const handlePurchaseDateChange = (event: any, date?: Date) => {
    setShowPurchaseDatePicker(false);
    if (date) {
      setPurchaseDate(date);
      setValue('purchaseDate', date.toISOString().split('T')[0]);
    }
  };

  const handleInsuranceDateChange = (event: any, date?: Date) => {
    setShowInsuranceDatePicker(false);
    if (date) {
      setInsuranceDate(date);
      setValue('insuranceExpiry', date.toISOString().split('T')[0]);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Seleziona data';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT');
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
          <View style={styles.inputIconContainer}>
            <Icon size={20} color={currentTheme.textSecondary} />
          </View>
        )}
        <TextInput
          style={[styles.input, { color: currentTheme.text }]}
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
          {error}
        </Text>
      )}
    </View>
  );

  // Progress Indicator
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
                backgroundColor: index <= currentStep ? currentTheme.primary : currentTheme.border 
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

  // Step Content Renderer
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={[styles.card, { backgroundColor: currentTheme.cardBackground }]}>
            <Controller
              control={control}
              name="make"
              rules={{ required: 'Marca richiesta' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Marca"
                  placeholder="es. Toyota, BMW, Volkswagen"
                  value={value}
                  onChangeText={onChange}
                  error={errors.make?.message}
                  required
                  icon={Car}
                  autoCapitalize="words"
                />
              )}
            />

            <Controller
              control={control}
              name="model"
              rules={{ required: 'Modello richiesto' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Modello"
                  placeholder="es. Corolla, Serie 3, Golf"
                  value={value}
                  onChangeText={onChange}
                  error={errors.model?.message}
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
                      placeholder="2024"
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
                  rules={{ required: 'Targa richiesta' }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <ModernInput
                      label="Targa"
                      placeholder="AB123CD"
                      value={value}
                      onChangeText={(text) => onChange(text.toUpperCase())}
                      error={errors.licensePlate?.message}
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
            {/* Color Selector */}
            <View style={styles.colorSelector}>
              <Text style={[styles.colorLabel, { color: currentTheme.text }]}>Colore</Text>
              <View style={styles.colorGrid}>
                {CAR_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color.value}
                    style={[
                      styles.colorOption,
                      { 
                        backgroundColor: color.value,
                        borderColor: color.border || currentTheme.border,
                        borderWidth: selectedColor === color.name ? 3 : 1
                      },
                      selectedColor === color.name && { borderColor: currentTheme.primary, borderWidth: 3 }
                    ]}
                    onPress={() => setValue('color', color.name)}
                  >
                    {selectedColor === color.name && (
                      <View style={[
                        styles.colorCheckmark,
                        { backgroundColor: color.value === '#FFFFFF' ? '#000000' : '#ffffff' }
                      ]}>
                        <Check size={16} color={color.value === '#FFFFFF' ? '#ffffff' : '#000000'} />
                      </View>
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

            <Controller
              control={control}
              name="vin"
              render={({ field: { onChange, onBlur, value } }) => (
                <ModernInput
                  label="Numero di Telaio (VIN)"
                  placeholder="Codice VIN (opzionale)"
                  value={value}
                  onChangeText={(text) => onChange(text.toUpperCase())}
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
                  placeholder="55000"
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
                    onPress={() => setShowPurchaseDatePicker(true)}
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
                  placeholder="es. Generali, Allianz"
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
                    onPress={() => setShowInsuranceDatePicker(true)}
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
                  <Text style={[styles.inputLabel, { color: currentTheme.text }]}>Note Aggiuntive</Text>
                  <View style={[
                    styles.inputWrapper, 
                    styles.textAreaWrapper,
                    { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.border }
                  ]}>
                    <TextInput
                      style={[styles.input, styles.textAreaInput, { color: currentTheme.text }]}
                      placeholder="Note aggiuntive sul veicolo..."
                      placeholderTextColor={currentTheme.placeholder}
                      value={value}
                      onChangeText={onChange}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
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
                currentStep === 0 && { flex: 1 }
              ]}
              onPress={currentStep === steps.length - 1 ? handleSubmit(onSubmit) : nextStep}
            >
              {currentStep === steps.length - 1 ? (
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

      {/* Date Pickers */}
      {showPurchaseDatePicker && (
        <DateTimePicker
          value={purchaseDate || new Date()}
          mode="date"
          display="default"
          onChange={handlePurchaseDateChange}
          maximumDate={new Date()}
        />
      )}

      {showInsuranceDatePicker && (
        <DateTimePicker
          value={insuranceDate || new Date()}
          mode="date"
          display="default"
          onChange={handleInsuranceDateChange}
        />
      )}
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
    elevation: 4,
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
    gap: 8,
    marginBottom: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flex: 1,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },

  // Card
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Input Styles
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
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
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingVertical: 16,
  },
  inputIconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    minHeight: 20,
  },
  textAreaInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputSuffix: {
    fontSize: 16,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },

  // Layout
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },

  // Date Button
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
  },

  // Color Selector
  colorSelector: {
    marginBottom: 24,
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  colorCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedColorText: {
    fontSize: 14,
    fontStyle: 'italic',
  },

  // Info Card
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Navigation
  navigationContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  prevButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddCarScreen;
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
  TextInput
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
  Zap,
  Info,
  Key,
  Hash,
  Ruler,
  Palette,
  Check
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
  { name: 'Bianco', value: '#FFFFFF' },
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
  const isDesktop = Platform.OS === 'web' && screenWidth > 768;

  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);
  const [showInsuranceDatePicker, setShowInsuranceDatePicker] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(undefined);
  const [insuranceDate, setInsuranceDate] = useState<Date | undefined>(undefined);

  const { control, handleSubmit, formState: { errors }, watch, setValue, getValues } = useForm<CarFormData>({
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

  const onSubmit = (data: CarFormData) => {
    if (!data.make.trim()) {
      Alert.alert('Errore', 'Inserisci la marca del veicolo');
      return;
    }

    if (!data.model.trim()) {
      Alert.alert('Errore', 'Inserisci il modello del veicolo');
      return;
    }

    if (!data.licensePlate.trim()) {
      Alert.alert('Errore', 'Inserisci la targa del veicolo');
      return;
    }

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
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Aggiungi Veicolo</Text>
          <Text style={styles.headerSubtitle}>Inserisci i dati del tuo veicolo</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Information Card */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Informazioni Base</Text>

            <Controller
              control={control}
              name="make"
              rules={{ required: 'Marca richiesta' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.inputLabel}>
                    Marca <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.make && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="es. Toyota, BMW, Volkswagen"
                    placeholderTextColor={theme.placeholder}
                  />
                  {errors.make && (
                    <Text style={styles.errorText}>{errors.make.message}</Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="model"
              rules={{ required: 'Modello richiesto' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.inputLabel}>
                    Modello <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.model && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="es. Corolla, Serie 3, Golf"
                    placeholderTextColor={theme.placeholder}
                  />
                  {errors.model && (
                    <Text style={styles.errorText}>{errors.model.message}</Text>
                  )}
                </View>
              )}
            />

            <View style={styles.row}>
              <Controller
                control={control}
                name="year"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.halfWidth, { marginBottom: 16 }]}>
                    <Text style={styles.inputLabel}>Anno</Text>
                    <TextInput
                      style={styles.input}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="2024"
                      keyboardType="numeric"
                      placeholderTextColor={theme.placeholder}
                    />
                  </View>
                )}
              />

              <Controller
                control={control}
                name="licensePlate"
                rules={{ required: 'Targa richiesta' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.halfWidth, { marginBottom: 16 }]}>
                    <Text style={styles.inputLabel}>
                      Targa <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.input, errors.licensePlate && styles.inputError]}
                      value={value}
                      onChangeText={(text) => onChange(text.toUpperCase())}
                      onBlur={onBlur}
                      placeholder="AB123CD"
                      autoCapitalize="characters"
                      placeholderTextColor={theme.placeholder}
                    />
                    {errors.licensePlate && (
                      <Text style={styles.errorText}>{errors.licensePlate.message}</Text>
                    )}
                  </View>
                )}
              />
            </View>

            {/* Color Selector */}
            <View style={styles.colorSelector}>
              <Text style={styles.colorLabel}>Colore</Text>
              <View style={styles.colorGrid}>
                {CAR_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color.value}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color.value },
                      selectedColor === color.name && styles.colorOptionSelected
                    ]}
                    onPress={() => setValue('color', color.name)}
                  >
                    {selectedColor === color.name && (
                      <View style={styles.colorCheckmark}>
                        <Check size={16} color="#ffffff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Controller
              control={control}
              name="vin"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.inputLabel}>Numero di Telaio (VIN)</Text>
                  <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={(text) => onChange(text.toUpperCase())}
                    onBlur={onBlur}
                    placeholder="Codice VIN (opzionale)"
                    autoCapitalize="characters"
                    placeholderTextColor={theme.placeholder}
                  />
                </View>
              )}
            />
          </View>

          {/* Purchase Information Card */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Informazioni di Acquisto</Text>

            <Controller
              control={control}
              name="purchaseDate"
              render={({ field: { value } }) => (
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.inputLabel}>Data di Acquisto</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowPurchaseDatePicker(true)}
                  >
                    <Calendar size={20} color={theme.textSecondary} />
                    <Text style={styles.dateButtonText}>
                      {value ? formatDate(value) : 'Seleziona data'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            />

            <View style={styles.row}>
              <Controller
                control={control}
                name="purchasePrice"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.halfWidth, { marginBottom: 16 }]}>
                    <Text style={styles.inputLabel}>Prezzo di Acquisto (€)</Text>
                    <TextInput
                      style={styles.input}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="15000"
                      keyboardType="numeric"
                      placeholderTextColor={theme.placeholder}
                    />
                  </View>
                )}
              />

              <Controller
                control={control}
                name="purchaseMileage"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.halfWidth, { marginBottom: 16 }]}>
                    <Text style={styles.inputLabel}>Km all'Acquisto</Text>
                    <TextInput
                      style={styles.input}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="50000"
                      keyboardType="numeric"
                      placeholderTextColor={theme.placeholder}
                    />
                  </View>
                )}
              />
            </View>

            <Controller
              control={control}
              name="currentMileage"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.inputLabel}>Chilometraggio Attuale</Text>
                  <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="55000"
                    keyboardType="numeric"
                    placeholderTextColor={theme.placeholder}
                  />
                </View>
              )}
            />
          </View>

          {/* Insurance Information Card */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Informazioni Assicurazione</Text>

            <Controller
              control={control}
              name="insuranceCompany"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.inputLabel}>Compagnia Assicurativa</Text>
                  <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="es. Generali, Allianz"
                    placeholderTextColor={theme.placeholder}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="insuranceExpiry"
              render={({ field: { value } }) => (
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.inputLabel}>Scadenza Assicurazione</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowInsuranceDatePicker(true)}
                  >
                    <Calendar size={20} color={theme.textSecondary} />
                    <Text style={styles.dateButtonText}>
                      {value ? formatDate(value) : 'Seleziona data'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>

          {/* Notes Card */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Note Aggiuntive</Text>

            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.inputLabel}>Note</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Note aggiuntive sul veicolo..."
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    placeholderTextColor={theme.placeholder}
                  />
                </View>
              )}
            />
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Info size={20} color={theme.info} />
              <Text style={styles.infoTitle}>Informazioni</Text>
            </View>
            <Text style={styles.infoText}>
              I campi contrassegnati con * sono obbligatori. Le altre informazioni possono essere aggiunte successivamente modificando il veicolo.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.secondaryButtonText}>Annulla</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleSubmit(onSubmit)}
            >
              <Save size={20} color="#ffffff" />
              <Text style={styles.primaryButtonText}>Salva Veicolo</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.cardBackground,
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
    color: theme.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
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
  formCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  requiredStar: {
    color: theme.error,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.text,
    backgroundColor: theme.background,
  },
  inputError: {
    borderColor: theme.error,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: theme.error,
    fontSize: 14,
    marginTop: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    backgroundColor: theme.background,
  },
  dateButtonText: {
    fontSize: 16,
    color: theme.text,
    marginLeft: 8,
  },
  colorSelector: {
    marginBottom: 16,
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderColor: theme.primary,
    borderWidth: 3,
  },
  colorCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    backgroundColor: theme.info + '10',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.info,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: theme.text,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: theme.primary,
  },
  secondaryButton: {
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.border,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddCarScreen;
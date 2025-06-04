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
  Dimensions
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
  Palette
} from 'lucide-react-native';

import {
  PrimaryButton,
  SecondaryButton,
  ModernCard,
  FormInput,
  theme
} from '../../components/shared/GlobalComponents';

import { useStore } from '../../store';
import { useUserCarsStore } from '../../store/userCarsStore';

const { width: screenWidth } = Dimensions.get('window');

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

  const onSubmit = (data: CarFormData) => {
    try {
      const carData = {
        make: data.make,
        model: data.model,
        year: parseInt(data.year) || new Date().getFullYear(),
        color: data.color,
        licensePlate: data.licensePlate,
        vin: data.vin || undefined,
        purchaseDate: data.purchaseDate || undefined,
        purchasePrice: parseFloat(data.purchasePrice) || undefined,
        purchaseMileage: parseInt(data.purchaseMileage) || undefined,
        currentMileage: parseInt(data.currentMileage) || 0,
        lastUpdatedMileage: new Date().toISOString().split('T')[0],
        insuranceCompany: data.insuranceCompany || undefined,
        insuranceExpiry: data.insuranceExpiry || undefined,
        notes: data.notes || undefined,
        isActive: true,
      };

      const newCarId = addCar(carData);

      Alert.alert(
          'Successo',
          'Auto aggiunta con successo!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('CarDetail', { carId: newCarId })
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

  // Predefined colors array
  const predefinedColors = [
    { name: 'Bianco', hex: '#ffffff' },
    { name: 'Nero', hex: '#000000' },
    { name: 'Grigio', hex: '#6b7280' },
    { name: 'Argento', hex: '#9ca3af' },
    { name: 'Rosso', hex: '#ef4444' },
    { name: 'Blu', hex: '#3b82f6' },
    { name: 'Verde', hex: '#10b981' },
    { name: 'Giallo', hex: '#f59e0b' }
  ];

  const ColorSelector = () => (
      <View style={styles.colorSelector}>
        <Text style={styles.colorLabel}>Colore</Text>
        <View style={styles.colorGrid}>
          {predefinedColors.map(color => (
              <TouchableOpacity
                  key={color.name}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color.hex },
                    watch('color') === color.name && styles.colorOptionSelected
                  ]}
                  onPress={() => setValue('color', color.name)}
              >
                {watch('color') === color.name && (
                    <View style={styles.colorCheckmark}>
                      <Text style={styles.colorCheckmarkText}>✓</Text>
                    </View>
                )}
              </TouchableOpacity>
          ))}
        </View>
        <Controller
            control={control}
            name="color"
            render={({ field: { onChange, value } }) => (
                <FormInput
                    placeholder="Colore (es: Blu Metallizzato)"
                    value={value}
                    onChangeText={onChange}
                    icon={Palette}
                />
            )}
        />
      </View>
  );

  return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Aggiungi Auto</Text>
            <Text style={styles.headerSubtitle}>Registra un nuovo veicolo</Text>
          </View>
        </View>

        <KeyboardAvoidingView
            style={styles.content}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
              style={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
          >
            {/* Informazioni Base */}
            <ModernCard style={styles.formCard}>
              <Text style={styles.sectionTitle}>Informazioni Base</Text>

              <Controller
                  control={control}
                  name="make"
                  rules={{ required: 'Marca obbligatoria' }}
                  render={({ field: { onChange, value } }) => (
                      <FormInput
                          label="Marca"
                          placeholder="Es: Fiat"
                          value={value}
                          onChangeText={onChange}
                          required
                          error={errors.make?.message}
                          icon={Car}
                      />
                  )}
              />

              <Controller
                  control={control}
                  name="model"
                  rules={{ required: 'Modello obbligatorio' }}
                  render={({ field: { onChange, value } }) => (
                      <FormInput
                          label="Modello"
                          placeholder="Es: Panda"
                          value={value}
                          onChangeText={onChange}
                          required
                          error={errors.model?.message}
                      />
                  )}
              />

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Controller
                      control={control}
                      name="year"
                      rules={{ required: 'Anno obbligatorio' }}
                      render={({ field: { onChange, value } }) => (
                          <FormInput
                              label="Anno"
                              placeholder={new Date().getFullYear().toString()}
                              value={value}
                              onChangeText={onChange}
                              keyboardType="numeric"
                              required
                              error={errors.year?.message}
                          />
                      )}
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Controller
                      control={control}
                      name="licensePlate"
                      rules={{ required: 'Targa obbligatoria' }}
                      render={({ field: { onChange, value } }) => (
                          <FormInput
                              label="Targa"
                              placeholder="Es: AB123CD"
                              value={value}
                              onChangeText={(text) => onChange(text.toUpperCase())}
                              autoCapitalize="characters"
                              required
                              error={errors.licensePlate?.message}
                              icon={Hash}
                          />
                      )}
                  />
                </View>
              </View>

              <ColorSelector />

              <Controller
                  control={control}
                  name="vin"
                  render={({ field: { onChange, value } }) => (
                      <FormInput
                          label="Numero di Telaio (VIN)"
                          placeholder="Es: ZFA1690000123456"
                          value={value}
                          onChangeText={(text) => onChange(text.toUpperCase())}
                          autoCapitalize="characters"
                          icon={Key}
                      />
                  )}
              />
            </ModernCard>

            {/* Chilometraggio */}
            <ModernCard style={styles.formCard}>
              <Text style={styles.sectionTitle}>Chilometraggio</Text>

              <Controller
                  control={control}
                  name="currentMileage"
                  rules={{ required: 'Chilometraggio attuale obbligatorio' }}
                  render={({ field: { onChange, value } }) => (
                      <FormInput
                          label="Chilometraggio Attuale"
                          placeholder="Es: 45000"
                          value={value}
                          onChangeText={onChange}
                          keyboardType="numeric"
                          required
                          error={errors.currentMileage?.message}
                          icon={Ruler}
                      />
                  )}
              />

              <Controller
                  control={control}
                  name="purchaseMileage"
                  render={({ field: { onChange, value } }) => (
                      <FormInput
                          label="Chilometraggio all'Acquisto"
                          placeholder="Es: 10000"
                          value={value}
                          onChangeText={onChange}
                          keyboardType="numeric"
                          icon={Ruler}
                      />
                  )}
              />
            </ModernCard>

            {/* Informazioni Acquisto */}
            <ModernCard style={styles.formCard}>
              <Text style={styles.sectionTitle}>Informazioni Acquisto</Text>

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.inputLabel}>Data Acquisto</Text>
                  <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowPurchaseDatePicker(true)}
                  >
                    <Calendar size={20} color={theme.primary} />
                    <Text style={styles.dateButtonText}>
                      {purchaseDate
                          ? purchaseDate.toLocaleDateString('it-IT')
                          : 'Seleziona data'
                      }
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.halfWidth}>
                  <Controller
                      control={control}
                      name="purchasePrice"
                      render={({ field: { onChange, value } }) => (
                          <FormInput
                              label="Prezzo Acquisto"
                              placeholder="Es: 15000"
                              value={value}
                              onChangeText={onChange}
                              keyboardType="numeric"
                              icon={DollarSign}
                          />
                      )}
                  />
                </View>
              </View>
            </ModernCard>

            {/* Assicurazione */}
            <ModernCard style={styles.formCard}>
              <Text style={styles.sectionTitle}>Assicurazione</Text>

              <Controller
                  control={control}
                  name="insuranceCompany"
                  render={({ field: { onChange, value } }) => (
                      <FormInput
                          label="Compagnia Assicurativa"
                          placeholder="Es: UnipolSai"
                          value={value}
                          onChangeText={onChange}
                          icon={FileText}
                      />
                  )}
              />

              <Text style={styles.inputLabel}>Scadenza Assicurazione</Text>
              <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowInsuranceDatePicker(true)}
              >
                <Calendar size={20} color={theme.primary} />
                <Text style={styles.dateButtonText}>
                  {insuranceDate
                      ? insuranceDate.toLocaleDateString('it-IT')
                      : 'Seleziona data'
                  }
                </Text>
              </TouchableOpacity>
            </ModernCard>

            {/* Note Aggiuntive */}
            <ModernCard style={styles.formCard}>
              <Text style={styles.sectionTitle}>Note Aggiuntive</Text>

              <Controller
                  control={control}
                  name="notes"
                  render={({ field: { onChange, value } }) => (
                      <FormInput
                          label="Note"
                          placeholder="Note aggiuntive sul veicolo..."
                          value={value}
                          onChangeText={onChange}
                          multiline
                      />
                  )}
              />
            </ModernCard>

            {/* Note Informative */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Info size={20} color={theme.info} />
                <Text style={styles.infoTitle}>Nota Importante</Text>
              </View>
              <Text style={styles.infoText}>
                Solo i campi contrassegnati con * sono obbligatori. Puoi sempre aggiungere o modificare
                le informazioni in seguito dalla schermata di dettaglio dell'auto.
              </Text>
            </View>

            {/* Pulsanti Azione */}
            <View style={styles.actionButtons}>
              <SecondaryButton
                  title="Annulla"
                  onPress={() => navigation.goBack()}
              />
              <PrimaryButton
                  title="Salva Auto"
                  icon={Save}
                  onPress={handleSubmit(onSubmit)}
              />
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
                minimumDate={new Date()}
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
    marginBottom: 16,
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
    marginBottom: 16,
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    backgroundColor: theme.cardBackground,
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
  colorCheckmarkText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
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
});

export default AddCarScreen;

import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Controller, useForm } from 'react-hook-form';
import { UniversalDatePicker } from '../../components';
import {
  ArrowLeft,
  Calendar,
  Fuel,
  DollarSign,
  MapPin,
  Save,
  Calculator
} from 'lucide-react-native';
import { db, auth } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useStore } from '../../store';
import { useAppThemeManager } from '../../hooks/useTheme';

interface FuelFormData {
  date: Date;
  liters: string;
  totalCost: string;
  pricePerLiter: string;
  fuelType: 'gasoline' | 'diesel' | 'lpg' | 'electric';
  currentMileage: string;
  gasStation: string;
  location: string;
  notes: string;
}

interface RouteParams {
  carId: string;
}

const fuelTypes = [
  { id: 'gasoline', label: 'Benzina', icon: '⛽' },
  { id: 'diesel', label: 'Diesel', icon: '🚛' },
  { id: 'lpg', label: 'GPL', icon: '🔥' },
  { id: 'electric', label: 'Elettrico', icon: '⚡' }
];

const AddFuelScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { carId } = route.params as RouteParams;
  const { darkMode } = useStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [consumption, setConsumption] = useState<{kmPerLiter?: number, costPer100km?: number}>({});

  const theme = {
    background: darkMode ? '#121212' : '#f5f5f5',
    cardBackground: darkMode ? '#1e1e1e' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#a0a0a0' : '#666666',
    primary: '#007AFF',
    border: darkMode ? '#333333' : '#e0e0e0',
    success: '#34C759'
  };

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FuelFormData>({
    defaultValues: {
      date: new Date(),
      fuelType: 'gasoline',
      liters: '',
      totalCost: '',
      pricePerLiter: '',
      currentMileage: '',
      gasStation: '',
      location: '',
      notes: ''
    }
  });

  const watchedValues = watch();

  // Calculate price per liter automatically
  const calculatePricePerLiter = useCallback(() => {
    const liters = parseFloat(watchedValues.liters);
    const total = parseFloat(watchedValues.totalCost);
    if (liters > 0 && total > 0) {
      const pricePerLiter = (total / liters).toFixed(3);
      setValue('pricePerLiter', pricePerLiter);
    }
  }, [watchedValues.liters, watchedValues.totalCost, setValue]);

  // Calculate consumption (mock - would need previous fuel record)
  const calculateConsumption = useCallback(() => {
    // This would require previous fuel record from database
    // For now, showing mock calculation
    const liters = parseFloat(watchedValues.liters);
    if (liters > 0) {
      // Mock calculation - in real app would get distance from last refuel
      const mockDistance = 500; // km
      const kmPerLiter = mockDistance / liters;
      const costPer100km = (parseFloat(watchedValues.totalCost) / mockDistance) * 100;

      setConsumption({
        kmPerLiter: parseFloat(kmPerLiter.toFixed(2)),
        costPer100km: parseFloat(costPer100km.toFixed(2))
      });
    }
  }, [watchedValues.liters, watchedValues.totalCost]);

  React.useEffect(() => {
    calculatePricePerLiter();
    calculateConsumption();
  }, [calculatePricePerLiter, calculateConsumption]);

  const onSubmit = async (data: FuelFormData) => {
    if (!auth.currentUser) {
      Alert.alert('Errore', 'Devi essere autenticato per salvare i dati');
      return;
    }

    setIsLoading(true);

    try {
      const fuelRecord = {
        carId,
        userId: auth.currentUser.uid,
        date: data.date.toISOString(),
        liters: parseFloat(data.liters),
        totalCost: parseFloat(data.totalCost),
        pricePerLiter: parseFloat(data.pricePerLiter),
        fuelType: data.fuelType,
        currentMileage: parseInt(data.currentMileage),
        gasStation: data.gasStation,
        location: data.location,
        notes: data.notes,
        consumption: consumption,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'fuelRecords'), fuelRecord);

      Alert.alert(
        'Successo',
        'Rifornimento salvato con successo!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving fuel record:', error);
      Alert.alert('Errore', 'Impossibile salvare il rifornimento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Aggiungi Rifornimento</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Date Section */}
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Data e Ora</Text>

            <TouchableOpacity
              style={[styles.dateButton, { borderColor: theme.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color={theme.primary} />
              <Text style={[styles.dateText, { color: theme.text }]}>
                {watchedValues.date.toLocaleDateString('it-IT')} {watchedValues.date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
                <UniversalDatePicker
                    value={watchedValues.date}
                    onChange={(date) => {
                        setShowDatePicker(false);
                        setValue('date', date);
                    }}
                    label="Seleziona data"
                    mode="datetime"
                />
            )}
          </View>

          {/* Fuel Type Section */}
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Tipo Carburante</Text>

            <View style={styles.fuelTypeGrid}>
              {fuelTypes.map((fuel) => (
                <Controller
                  key={fuel.id}
                  control={control}
                  name="fuelType"
                  render={({ field: { value, onChange } }) => (
                    <TouchableOpacity
                      style={[
                        styles.fuelTypeButton,
                        { 
                          borderColor: theme.border,
                          backgroundColor: value === fuel.id ? theme.primary : 'transparent'
                        }
                      ]}
                      onPress={() => onChange(fuel.id)}
                    >
                      <Text style={styles.fuelTypeIcon}>{fuel.icon}</Text>
                      <Text style={[
                        styles.fuelTypeLabel, 
                        { color: value === fuel.id ? '#fff' : theme.text }
                      ]}>
                        {fuel.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              ))}
            </View>
          </View>

          {/* Fuel Details Section */}
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Dettagli Rifornimento</Text>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Litri</Text>
                <Controller
                  control={control}
                  name="liters"
                  rules={{ required: 'Litri obbligatori' }}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, { 
                        borderColor: errors.liters ? '#FF3B30' : theme.border,
                        backgroundColor: theme.cardBackground,
                        color: theme.text
                      }]}
                      value={value}
                      onChangeText={onChange}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor={theme.textSecondary}
                    />
                  )}
                />
              </View>

              <View style={styles.inputHalf}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Costo Totale (€)</Text>
                <Controller
                  control={control}
                  name="totalCost"
                  rules={{ required: 'Costo obbligatorio' }}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, { 
                        borderColor: errors.totalCost ? '#FF3B30' : theme.border,
                        backgroundColor: theme.cardBackground,
                        color: theme.text
                      }]}
                      value={value}
                      onChangeText={onChange}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor={theme.textSecondary}
                    />
                  )}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Prezzo al Litro (€)</Text>
              <Controller
                control={control}
                name="pricePerLiter"
                render={({ field: { value } }) => (
                  <TextInput
                    style={[styles.input, { 
                      borderColor: theme.border,
                      backgroundColor: theme.cardBackground,
                      color: theme.text
                    }]}
                    value={value}
                    editable={false}
                    placeholder="Calcolato automaticamente"
                    placeholderTextColor={theme.textSecondary}
                  />
                )}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Chilometraggio Attuale</Text>
              <Controller
                control={control}
                name="currentMileage"
                rules={{ required: 'Chilometraggio obbligatorio' }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, { 
                      borderColor: errors.currentMileage ? '#FF3B30' : theme.border,
                      backgroundColor: theme.cardBackground,
                      color: theme.text
                    }]}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="numeric"
                    placeholder="km"
                    placeholderTextColor={theme.textSecondary}
                  />
                )}
              />
            </View>
          </View>

          {/* Consumption Display */}
          {(consumption.kmPerLiter || consumption.costPer100km) && (
            <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
              <View style={styles.sectionHeader}>
                <Calculator size={20} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Consumi Stimati</Text>
              </View>

              <View style={styles.consumptionGrid}>
                {consumption.kmPerLiter && (
                  <View style={styles.consumptionItem}>
                    <Text style={[styles.consumptionValue, { color: theme.primary }]}>
                      {consumption.kmPerLiter} km/l
                    </Text>
                    <Text style={[styles.consumptionLabel, { color: theme.textSecondary }]}>
                      Consumo
                    </Text>
                  </View>
                )}

                {consumption.costPer100km && (
                  <View style={styles.consumptionItem}>
                    <Text style={[styles.consumptionValue, { color: theme.primary }]}>
                      €{consumption.costPer100km}/100km
                    </Text>
                    <Text style={[styles.consumptionLabel, { color: theme.textSecondary }]}>
                      Costo
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Location Section */}
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Ubicazione</Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Distributore</Text>
              <Controller
                control={control}
                name="gasStation"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, { 
                      borderColor: theme.border,
                      backgroundColor: theme.cardBackground,
                      color: theme.text
                    }]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Es. Eni, Shell, IP..."
                    placeholderTextColor={theme.textSecondary}
                  />
                )}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Indirizzo</Text>
              <Controller
                control={control}
                name="location"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, { 
                      borderColor: theme.border,
                      backgroundColor: theme.cardBackground,
                      color: theme.text
                    }]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="Via, città"
                    placeholderTextColor={theme.textSecondary}
                  />
                )}
              />
            </View>
          </View>

          {/* Notes Section */}
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Note (opzionali)</Text>

            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.textArea, { 
                    borderColor: theme.border,
                    backgroundColor: theme.cardBackground,
                    color: theme.text
                  }]}
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={3}
                  placeholder="Aggiungi note..."
                  placeholderTextColor={theme.textSecondary}
                />
              )}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.success }]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            <Save size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Salvataggio...' : 'Salva Rifornimento'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
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
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 12,
  },
  dateText: {
    fontSize: 16,
  },
  fuelTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fuelTypeButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 4,
  },
  fuelTypeIcon: {
    fontSize: 20,
  },
  fuelTypeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  consumptionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  consumptionItem: {
    alignItems: 'center',
  },
  consumptionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  consumptionLabel: {
    fontSize: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    gap: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddFuelScreen;
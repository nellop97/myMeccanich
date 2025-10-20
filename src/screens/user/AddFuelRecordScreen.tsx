// src/screens/user/AddFuelRecordScreen.tsx
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Fuel, DollarSign, MapPin, Calendar, Save } from 'lucide-react-native';
import { useAppThemeManager } from '../../hooks/useTheme';
import { useUserData } from '../../hooks/useUserData';
import DateTimePicker from '@react-native-community/datetimepicker';

const AddFuelRecordScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useAppThemeManager();
  const { vehicles } = useUserData();
  const carId = route.params?.carId;

  const [formData, setFormData] = useState({
    carId: carId || vehicles[0]?.id || '',
    date: new Date(),
    liters: '',
    pricePerLiter: '',
    totalCost: '',
    mileage: '',
    station: '',
    notes: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  const calculateTotalCost = () => {
    const liters = parseFloat(formData.liters) || 0;
    const pricePerLiter = parseFloat(formData.pricePerLiter) || 0;
    const total = liters * pricePerLiter;
    setFormData({ ...formData, totalCost: total.toFixed(2) });
  };

  const handleSave = async () => {
    if (!formData.liters || !formData.pricePerLiter) {
      Alert.alert('Errore', 'Inserisci almeno litri e prezzo per litro');
      return;
    }

    try {
      // Qui andrà la logica per salvare su Firebase
      // await addFuelRecord(formData);

      Alert.alert('Successo', 'Rifornimento registrato con successo', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Errore', 'Errore durante il salvataggio');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color={colors.onSurface} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
              Nuovo Rifornimento
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Save size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Date Picker */}
            <TouchableOpacity 
              style={[styles.inputGroup, { backgroundColor: colors.surface }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color={colors.onSurfaceVariant} />
              <Text style={[styles.inputText, { color: colors.onSurface }]}>
                {formData.date.toLocaleDateString('it-IT')}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
                <UniversalDatePicker
                    value={date}
                    onChange={setDate}
                    label="Seleziona data"
                    mode="date"
                />
            )}

            {/* Liters */}
            <View style={[styles.inputGroup, { backgroundColor: colors.surface }]}>
              <Fuel size={20} color={colors.onSurfaceVariant} />
              <TextInput
                style={[styles.input, { color: colors.onSurface }]}
                placeholder="Litri"
                placeholderTextColor={colors.onSurfaceVariant}
                value={formData.liters}
                onChangeText={(text) => setFormData({ ...formData, liters: text })}
                keyboardType="decimal-pad"
                onBlur={calculateTotalCost}
              />
            </View>

            {/* Price per Liter */}
            <View style={[styles.inputGroup, { backgroundColor: colors.surface }]}>
              <DollarSign size={20} color={colors.onSurfaceVariant} />
              <TextInput
                style={[styles.input, { color: colors.onSurface }]}
                placeholder="Prezzo al litro (€)"
                placeholderTextColor={colors.onSurfaceVariant}
                value={formData.pricePerLiter}
                onChangeText={(text) => setFormData({ ...formData, pricePerLiter: text })}
                keyboardType="decimal-pad"
                onBlur={calculateTotalCost}
              />
            </View>

            {/* Total Cost */}
            <View style={[styles.totalCard, { backgroundColor: colors.primaryContainer }]}>
              <Text style={[styles.totalLabel, { color: colors.onPrimaryContainer }]}>
                Totale
              </Text>
              <Text style={[styles.totalAmount, { color: colors.onPrimaryContainer }]}>
                €{formData.totalCost || '0.00'}
              </Text>
            </View>

            {/* Station */}
            <View style={[styles.inputGroup, { backgroundColor: colors.surface }]}>
              <MapPin size={20} color={colors.onSurfaceVariant} />
              <TextInput
                style={[styles.input, { color: colors.onSurface }]}
                placeholder="Stazione di servizio (opzionale)"
                placeholderTextColor={colors.onSurfaceVariant}
                value={formData.station}
                onChangeText={(text) => setFormData({ ...formData, station: text })}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>
                Salva Rifornimento
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ===========================================
// src/screens/user/AddReminderScreen.tsx
// ===========================================
const AddReminderScreen = () => {
  const navigation = useNavigation();
  const { colors } = useAppThemeManager();
  const { vehicles } = useUserData();

  const [formData, setFormData] = useState({
    carId: vehicles[0]?.id || '',
    title: '',
    description: '',
    dueDate: new Date(),
    dueMileage: '',
    type: 'maintenance',
    isRecurring: false,
    recurringInterval: '12', // months
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  const reminderTypes = [
    { id: 'maintenance', label: 'Manutenzione', icon: 'wrench' },
    { id: 'insurance', label: 'Assicurazione', icon: 'shield' },
    { id: 'tax', label: 'Bollo', icon: 'file-text' },
    { id: 'inspection', label: 'Revisione', icon: 'check-circle' },
    { id: 'other', label: 'Altro', icon: 'bell' },
  ];

  const handleSave = async () => {
    if (!formData.title) {
      Alert.alert('Errore', 'Inserisci un titolo per il promemoria');
      return;
    }

    try {
      // Logica per salvare su Firebase
      Alert.alert('Successo', 'Promemoria creato con successo', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Errore', 'Errore durante il salvataggio');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
            Nuovo Promemoria
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Save size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Reminder Type */}
          <Text style={[styles.label, { color: colors.onSurface }]}>
            Tipo di promemoria
          </Text>
          <View style={styles.typeGrid}>
            {reminderTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  { 
                    backgroundColor: formData.type === type.id ? colors.primaryContainer : colors.surface,
                    borderColor: formData.type === type.id ? colors.primary : colors.outline,
                  }
                ]}
                onPress={() => setFormData({ ...formData, type: type.id })}
              >
                <Text style={{ color: formData.type === type.id ? colors.onPrimaryContainer : colors.onSurface }}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Title */}
          <View style={[styles.inputGroup, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.input, { color: colors.onSurface }]}
              placeholder="Titolo del promemoria"
              placeholderTextColor={colors.onSurfaceVariant}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />
          </View>

          {/* Description */}
          <View style={[styles.inputGroup, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.input, { color: colors.onSurface }]}
              placeholder="Descrizione (opzionale)"
              placeholderTextColor={colors.onSurfaceVariant}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Due Date */}
          <TouchableOpacity 
            style={[styles.inputGroup, { backgroundColor: colors.surface }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color={colors.onSurfaceVariant} />
            <Text style={[styles.inputText, { color: colors.onSurface }]}>
              Scadenza: {formData.dueDate.toLocaleDateString('it-IT')}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
              <UniversalDatePicker
                  value={date}
                  onChange={setDate}
                  label="Seleziona data"
                  mode="date"
              />
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
          >
            <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>
              Crea Promemoria
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Stili condivisi
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  inputText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeCard: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
});

export { AddFuelRecordScreen, AddReminderScreen };
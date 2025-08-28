// src/screens/user/AddReminderScreen.tsx
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
  Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  Bell,
  Calendar,
  Car,
  Save,
  Wrench,
  Shield,
  FileText,
  CheckCircle,
  RefreshCw,
  Settings,
  AlertTriangle,
  Info,
} from 'lucide-react-native';
import { DatePicker } from '../../components/DatePicker';
import { useAppThemeManager } from '../../hooks/useTheme';
import { useUserData } from '../../hooks/useUserData';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const AddReminderScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, isDark } = useAppThemeManager();
  const { vehicles, refreshData } = useUserData();

  const preselectedCarId = route.params?.carId;

  const [formData, setFormData] = useState({
    vehicleId: preselectedCarId || vehicles[0]?.id || '',
    title: '',
    description: '',
    type: 'maintenance',
    dueDate: new Date(),
    dueMileage: '',
    isRecurring: false,
    recurringInterval: 365, // giorni
    notifyDaysBefore: 7,
    isActive: true,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const reminderTypes = [
    { 
      id: 'maintenance', 
      label: 'Manutenzione', 
      icon: Wrench, 
      color: '#FF9500',
      description: 'Tagliandi, cambio olio, filtri',
      suggestions: ['Tagliando completo', 'Cambio olio motore', 'Cambio filtri', 'Controllo freni']
    },
    { 
      id: 'insurance', 
      label: 'Assicurazione', 
      icon: Shield, 
      color: '#34C759',
      description: 'Rinnovo polizza assicurativa',
      suggestions: ['Rinnovo RCA', 'Rinnovo Kasko', 'Scadenza polizza']
    },
    { 
      id: 'tax', 
      label: 'Bollo', 
      icon: FileText, 
      color: '#007AFF',
      description: 'Pagamento tassa automobilistica',
      suggestions: ['Pagamento bollo auto', 'Tassa di circolazione']
    },
    { 
      id: 'inspection', 
      label: 'Revisione', 
      icon: CheckCircle, 
      color: '#5856D6',
      description: 'Revisione periodica obbligatoria',
      suggestions: ['Revisione ministeriale', 'Controllo tecnico']
    },
    { 
      id: 'other', 
      label: 'Altro', 
      icon: Bell, 
      color: '#8E8E93',
      description: 'Altri promemoria personalizzati',
      suggestions: []
    },
  ];

  const recurringOptions = [
    { label: 'Settimanale', value: 7 },
    { label: 'Mensile', value: 30 },
    { label: 'Trimestrale', value: 90 },
    { label: 'Semestrale', value: 180 },
    { label: 'Annuale', value: 365 },
    { label: 'Biennale', value: 730 },
  ];

  const selectedType = reminderTypes.find(t => t.id === formData.type);
  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);

  const validateForm = () => {
    if (!formData.vehicleId) {
      Alert.alert('Errore', 'Seleziona un veicolo');
      return false;
    }
    if (!formData.title.trim()) {
      Alert.alert('Errore', 'Inserisci un titolo per il promemoria');
      return false;
    }
    if (!formData.type) {
      Alert.alert('Errore', 'Seleziona un tipo di promemoria');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        Alert.alert('Errore', 'Utente non autenticato');
        return;
      }

      const reminderData = {
        vehicleId: formData.vehicleId,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        type: formData.type,
        dueDate: firestore.Timestamp.fromDate(formData.dueDate),
        dueMileage: formData.dueMileage ? parseInt(formData.dueMileage) : null,
        isActive: formData.isActive,
        isRecurring: formData.isRecurring,
        recurringInterval: formData.isRecurring ? formData.recurringInterval : null,
        notifyDaysBefore: formData.notifyDaysBefore,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        userId: userId,
      };

      await firestore()
        .collection('users')
        .doc(userId)
        .collection('reminders')
        .add(reminderData);

      await refreshData();

      Alert.alert(
        'Successo!',
        'Promemoria creato con successo',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Errore salvataggio promemoria:', error);
      Alert.alert('Errore', 'Impossibile salvare il promemoria');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {['Tipo', 'Dettagli', 'Pianifica'].map((step, index) => (
        <View key={index} style={styles.stepItem}>
          <View style={[
            styles.stepCircle,
            {
              backgroundColor: currentStep >= index ? colors.primary : colors.surfaceVariant,
            }
          ]}>
            <Text style={[
              styles.stepNumber,
              { color: currentStep >= index ? colors.onPrimary : colors.onSurfaceVariant }
            ]}>
              {index + 1}
            </Text>
          </View>
          <Text style={[
            styles.stepLabel,
            { color: currentStep >= index ? colors.onBackground : colors.onSurfaceVariant }
          ]}>
            {step}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderTypeSelection();
      case 1:
        return renderDetailsForm();
      case 2:
        return renderScheduleForm();
      default:
        return null;
    }
  };

  const renderTypeSelection = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.onBackground }]}>
        Che tipo di promemoria vuoi creare?
      </Text>

      {/* Vehicle Selection */}
      <View style={styles.vehicleSection}>
        <Text style={[styles.label, { color: colors.onSurface }]}>
          Seleziona il veicolo
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {vehicles.map(vehicle => (
            <TouchableOpacity
              key={vehicle.id}
              style={[
                styles.vehicleCard,
                {
                  backgroundColor: formData.vehicleId === vehicle.id ? colors.primaryContainer : colors.surface,
                  borderColor: formData.vehicleId === vehicle.id ? colors.primary : colors.outline,
                  borderWidth: 2,
                }
              ]}
              onPress={() => setFormData({ ...formData, vehicleId: vehicle.id })}
            >
              <Car size={24} color={formData.vehicleId === vehicle.id ? colors.onPrimaryContainer : colors.onSurface} />
              <Text style={[
                styles.vehicleName,
                { color: formData.vehicleId === vehicle.id ? colors.onPrimaryContainer : colors.onSurface }
              ]}>
                {vehicle.make} {vehicle.model}
              </Text>
              <Text style={[
                styles.vehiclePlate,
                { color: formData.vehicleId === vehicle.id ? colors.onPrimaryContainer : colors.onSurfaceVariant }
              ]}>
                {vehicle.licensePlate}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Type Selection */}
      <Text style={[styles.label, { color: colors.onSurface, marginTop: 24 }]}>
        Tipo di promemoria
      </Text>
      <View style={styles.typeGrid}>
        {reminderTypes.map(type => {
          const Icon = type.icon;
          const isSelected = formData.type === type.id;

          return (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeCard,
                {
                  backgroundColor: isSelected ? colors.primaryContainer : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.outline,
                  borderWidth: 2,
                }
              ]}
              onPress={() => setFormData({ ...formData, type: type.id })}
            >
              <View style={[
                styles.typeIcon,
                { backgroundColor: type.color + '20' }
              ]}>
                <Icon size={24} color={type.color} />
              </View>
              <Text style={[
                styles.typeLabel,
                { color: isSelected ? colors.onPrimaryContainer : colors.onSurface }
              ]}>
                {type.label}
              </Text>
              <Text style={[
                styles.typeDescription,
                { color: isSelected ? colors.onPrimaryContainer : colors.onSurfaceVariant }
              ]}>
                {type.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderDetailsForm = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.onBackground }]}>
        Dettagli del promemoria
      </Text>

      {/* Suggestions */}
      {selectedType?.suggestions && selectedType.suggestions.length > 0 && (
        <View style={styles.suggestionsSection}>
          <Text style={[styles.label, { color: colors.onSurface }]}>
            Suggerimenti rapidi
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedType.suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.suggestionChip, { backgroundColor: colors.primaryContainer }]}
                onPress={() => setFormData({ ...formData, title: suggestion })}
              >
                <Text style={[styles.suggestionText, { color: colors.onPrimaryContainer }]}>
                  {suggestion}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Title Input */}
      <View style={[styles.inputGroup, { backgroundColor: colors.surface }]}>
        <Text style={[styles.inputLabel, { color: colors.onSurface }]}>
          Titolo *
        </Text>
        <TextInput
          style={[styles.input, { color: colors.onSurface }]}
          placeholder="Es. Tagliando 60.000 km"
          placeholderTextColor={colors.onSurfaceVariant}
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
        />
      </View>

      {/* Description Input */}
      <View style={[styles.inputGroup, { backgroundColor: colors.surface }]}>
        <Text style={[styles.inputLabel, { color: colors.onSurface }]}>
          Descrizione (opzionale)
        </Text>
        <TextInput
          style={[styles.textArea, { color: colors.onSurface }]}
          placeholder="Aggiungi note o dettagli..."
          placeholderTextColor={colors.onSurfaceVariant}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Mileage Input */}
      <View style={[styles.inputGroup, { backgroundColor: colors.surface }]}>
        <Text style={[styles.inputLabel, { color: colors.onSurface }]}>
          Chilometraggio (opzionale)
        </Text>
        <View style={styles.inputRow}>
          <Settings size={20} color={colors.onSurfaceVariant} />
          <TextInput
            style={[styles.input, { color: colors.onSurface, flex: 1 }]}
            placeholder="Es. 60000"
            placeholderTextColor={colors.onSurfaceVariant}
            value={formData.dueMileage}
            onChangeText={(text) => setFormData({ ...formData, dueMileage: text })}
            keyboardType="numeric"
          />
          <Text style={[styles.inputSuffix, { color: colors.onSurfaceVariant }]}>km</Text>
        </View>
      </View>
    </View>
  );

  const renderScheduleForm = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.onBackground }]}>
        Quando vuoi essere avvisato?
      </Text>

      {/* Due Date */}
      <TouchableOpacity
        style={[styles.dateSelector, { backgroundColor: colors.surface }]}
        onPress={() => setShowDatePicker(true)}
      >
        <Calendar size={20} color={colors.primary} />
        <View style={styles.dateSelectorContent}>
          <Text style={[styles.dateSelectorLabel, { color: colors.onSurfaceVariant }]}>
            Data di scadenza
          </Text>
          <Text style={[styles.dateSelectorValue, { color: colors.onSurface }]}>
            {formData.dueDate.toLocaleDateString('it-IT', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
      </TouchableOpacity>

      {showDatePicker && (
        <DatePicker
          value={formData.dueDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setFormData({ ...formData, dueDate: selectedDate });
            }
          }}
        />
      )}

      {/* Notify Days Before */}
      <View style={[styles.inputGroup, { backgroundColor: colors.surface }]}>
        <Text style={[styles.inputLabel, { color: colors.onSurface }]}>
          Avvisami prima di
        </Text>
        <View style={styles.notifyOptions}>
          {[1, 3, 7, 14, 30].map(days => (
            <TouchableOpacity
              key={days}
              style={[
                styles.notifyOption,
                {
                  backgroundColor: formData.notifyDaysBefore === days ? colors.primaryContainer : colors.surfaceVariant,
                }
              ]}
              onPress={() => setFormData({ ...formData, notifyDaysBefore: days })}
            >
              <Text style={[
                styles.notifyOptionText,
                { color: formData.notifyDaysBefore === days ? colors.onPrimaryContainer : colors.onSurfaceVariant }
              ]}>
                {days === 1 ? '1 giorno' : `${days} giorni`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recurring Toggle */}
      <View style={[styles.toggleGroup, { backgroundColor: colors.surface }]}>
        <View style={styles.toggleContent}>
          <RefreshCw size={20} color={colors.primary} />
          <View style={styles.toggleText}>
            <Text style={[styles.toggleLabel, { color: colors.onSurface }]}>
              Promemoria ricorrente
            </Text>
            <Text style={[styles.toggleDescription, { color: colors.onSurfaceVariant }]}>
              Si ripete automaticamente
            </Text>
          </View>
        </View>
        <Switch
          value={formData.isRecurring}
          onValueChange={(value) => setFormData({ ...formData, isRecurring: value })}
          trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
          thumbColor={formData.isRecurring ? colors.primary : colors.onSurfaceVariant}
        />
      </View>

      {/* Recurring Interval */}
      {formData.isRecurring && (
        <View style={[styles.inputGroup, { backgroundColor: colors.surface }]}>
          <Text style={[styles.inputLabel, { color: colors.onSurface }]}>
            Frequenza di ripetizione
          </Text>
          <View style={styles.recurringOptions}>
            {recurringOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.recurringOption,
                  {
                    backgroundColor: formData.recurringInterval === option.value ? colors.primaryContainer : colors.surfaceVariant,
                  }
                ]}
                onPress={() => setFormData({ ...formData, recurringInterval: option.value })}
              >
                <Text style={[
                  styles.recurringOptionText,
                  { color: formData.recurringInterval === option.value ? colors.onPrimaryContainer : colors.onSurfaceVariant }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Active Toggle */}
      <View style={[styles.toggleGroup, { backgroundColor: colors.surface }]}>
        <View style={styles.toggleContent}>
          <Bell size={20} color={colors.primary} />
          <View style={styles.toggleText}>
            <Text style={[styles.toggleLabel, { color: colors.onSurface }]}>
              Promemoria attivo
            </Text>
            <Text style={[styles.toggleDescription, { color: colors.onSurfaceVariant }]}>
              Ricevi notifiche per questo promemoria
            </Text>
          </View>
        </View>
        <Switch
          value={formData.isActive}
          onValueChange={(value) => setFormData({ ...formData, isActive: value })}
          trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
          thumbColor={formData.isActive ? colors.primary : colors.onSurfaceVariant}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={isLoading}>
          <ArrowLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
          Nuovo Promemoria
        </Text>
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={isLoading || currentStep !== 2}
          style={{ opacity: currentStep === 2 ? 1 : 0.3 }}
        >
          <Save size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={[styles.navigationButtons, { backgroundColor: colors.background }]}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: colors.surfaceVariant }]}
              onPress={() => setCurrentStep(currentStep - 1)}
              disabled={isLoading}
            >
              <Text style={[styles.navButtonText, { color: colors.onSurfaceVariant }]}>
                Indietro
              </Text>
            </TouchableOpacity>
          )}

          {currentStep < 2 ? (
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.primaryButton,
                { backgroundColor: colors.primary }
              ]}
              onPress={() => setCurrentStep(currentStep + 1)}
              disabled={isLoading}
            >
              <Text style={[styles.navButtonText, { color: colors.onPrimary }]}>
                Avanti
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.primaryButton,
                { backgroundColor: colors.primary }
              ]}
              onPress={handleSave}
              disabled={isLoading}
            >
              <Text style={[styles.navButtonText, { color: colors.onPrimary }]}>
                {isLoading ? 'Salvataggio...' : 'Crea Promemoria'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    padding: 16,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepLabel: {
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
  },
  vehicleSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  vehicleCard: {
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  vehiclePlate: {
    fontSize: 12,
    marginTop: 4,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  suggestionsSection: {
    marginBottom: 20,
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 14,
  },
  inputGroup: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    paddingVertical: 4,
  },
  textArea: {
    fontSize: 16,
    minHeight: 80,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputSuffix: {
    fontSize: 16,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  dateSelectorContent: {
    flex: 1,
  },
  dateSelectorLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  dateSelectorValue: {
    fontSize: 16,
  },
  notifyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  notifyOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  notifyOptionText: {
    fontSize: 14,
  },
  toggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 12,
  },
  recurringOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recurringOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recurringOptionText: {
    fontSize: 14,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    elevation: 2,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddReminderScreen;
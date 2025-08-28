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
import { db, auth } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
    recurringInterval: 365,
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

  const recurringIntervals = [
    { value: 90, label: '3 mesi' },
    { value: 180, label: '6 mesi' },
    { value: 365, label: '1 anno' },
    { value: 730, label: '2 anni' },
  ];

  const notificationOptions = [
    { value: 1, label: '1 giorno prima' },
    { value: 3, label: '3 giorni prima' },
    { value: 7, label: '1 settimana prima' },
    { value: 14, label: '2 settimane prima' },
    { value: 30, label: '1 mese prima' },
  ];

  const handleSaveReminder = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Errore', 'Inserisci un titolo per il promemoria');
      return;
    }

    if (!formData.vehicleId) {
      Alert.alert('Errore', 'Seleziona un veicolo');
      return;
    }

    setIsLoading(true);

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('Utente non autenticato');
      }

      const reminderData = {
        vehicleId: formData.vehicleId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        dueDate: formData.dueDate,
        dueMileage: formData.dueMileage ? parseInt(formData.dueMileage) : undefined,
        isActive: formData.isActive,
        isRecurring: formData.isRecurring,
        recurringInterval: formData.isRecurring ? formData.recurringInterval : undefined,
        notifyDaysBefore: formData.notifyDaysBefore,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: userId,
      };

      const remindersRef = collection(db, 'users', userId, 'reminders');
      await addDoc(remindersRef, reminderData);

      Alert.alert('Successo', 'Promemoria creato con successo', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);

    } catch (error) {
      console.error('Errore creazione promemoria:', error);
      Alert.alert('Errore', 'Impossibile creare il promemoria');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.onSurface }]}>
              Seleziona Tipo di Promemoria
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.onSurfaceVariant }]}>
              Scegli la categoria che meglio descrive il tuo promemoria
            </Text>

            <View style={styles.typeSelector}>
              {reminderTypes.map(type => {
                const Icon = type.icon;
                const isSelected = formData.type === type.id;
                
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeOption,
                      {
                        backgroundColor: isSelected ? type.color + '20' : colors.surface,
                        borderColor: isSelected ? type.color : colors.outline,
                      }
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, type: type.id }))}
                  >
                    <View style={[styles.typeIcon, { backgroundColor: type.color + '20' }]}>
                      <Icon size={24} color={type.color} />
                    </View>
                    <Text style={[styles.typeLabel, { color: colors.onSurface }]}>
                      {type.label}
                    </Text>
                    <Text style={[styles.typeDescription, { color: colors.onSurfaceVariant }]}>
                      {type.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {formData.type && reminderTypes.find(t => t.id === formData.type)?.suggestions.length > 0 && (
              <View style={styles.suggestions}>
                <Text style={[styles.suggestionsTitle, { color: colors.onSurface }]}>
                  Suggerimenti:
                </Text>
                <View style={styles.suggestionsList}>
                  {reminderTypes.find(t => t.id === formData.type)?.suggestions.map(suggestion => (
                    <TouchableOpacity
                      key={suggestion}
                      style={[styles.suggestionChip, { backgroundColor: colors.surface, borderColor: colors.outline }]}
                      onPress={() => setFormData(prev => ({ ...prev, title: suggestion }))}
                    >
                      <Text style={[styles.suggestionText, { color: colors.onSurface }]}>
                        {suggestion}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.onSurface }]}>
              Dettagli Promemoria
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.onSurfaceVariant }]}>
              Inserisci i dettagli del tuo promemoria
            </Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Veicolo
              </Text>
              <View style={[styles.vehicleSelector, { borderColor: colors.outline }]}>
                {vehicles.map(vehicle => (
                  <TouchableOpacity
                    key={vehicle.id}
                    style={[
                      styles.vehicleOption,
                      {
                        backgroundColor: formData.vehicleId === vehicle.id ? colors.primary + '20' : colors.surface,
                        borderColor: formData.vehicleId === vehicle.id ? colors.primary : colors.outline,
                      }
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, vehicleId: vehicle.id }))}
                  >
                    <Car size={20} color={formData.vehicleId === vehicle.id ? colors.primary : colors.onSurfaceVariant} />
                    <Text style={[
                      styles.vehicleOptionText,
                      { color: formData.vehicleId === vehicle.id ? colors.primary : colors.onSurface }
                    ]}>
                      {vehicle.brand} {vehicle.model}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Titolo *
              </Text>
              <TextInput
                style={[styles.textInput, { borderColor: colors.outline, color: colors.onSurface }]}
                value={formData.title}
                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                placeholder="Es: Tagliando 10.000 km"
                placeholderTextColor={colors.onSurfaceVariant}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Descrizione (opzionale)
              </Text>
              <TextInput
                style={[styles.textArea, { borderColor: colors.outline, color: colors.onSurface }]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Aggiungi dettagli aggiuntivi..."
                placeholderTextColor={colors.onSurfaceVariant}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Data di Scadenza
              </Text>
              <TouchableOpacity
                style={[styles.dateSelector, { borderColor: colors.outline }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color={colors.primary} />
                <View style={styles.dateSelectorContent}>
                  <Text style={[styles.dateSelectorLabel, { color: colors.onSurfaceVariant }]}>
                    Scade il
                  </Text>
                  <Text style={[styles.dateSelectorValue, { color: colors.onSurface }]}>
                    {formData.dueDate.toLocaleDateString('it-IT')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Chilometraggio (opzionale)
              </Text>
              <TextInput
                style={[styles.textInput, { borderColor: colors.outline, color: colors.onSurface }]}
                value={formData.dueMileage}
                onChangeText={(text) => setFormData(prev => ({ ...prev, dueMileage: text }))}
                placeholder="Es: 15000"
                placeholderTextColor={colors.onSurfaceVariant}
                keyboardType="numeric"
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.onSurface }]}>
              Impostazioni Notifica
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.onSurfaceVariant }]}>
              Configura quando e come ricevere le notifiche
            </Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Notifica con Anticipo
              </Text>
              <View style={styles.notifyOptions}>
                {notificationOptions.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.notifyOption,
                      {
                        backgroundColor: formData.notifyDaysBefore === option.value ? colors.primary + '20' : colors.surface,
                        borderColor: formData.notifyDaysBefore === option.value ? colors.primary : colors.outline,
                      }
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, notifyDaysBefore: option.value }))}
                  >
                    <Text style={[
                      styles.notifyOptionText,
                      { color: formData.notifyDaysBefore === option.value ? colors.primary : colors.onSurface }
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.toggleGroup, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
              <View style={styles.toggleContent}>
                <RefreshCw size={20} color={colors.primary} />
                <View style={styles.toggleText}>
                  <Text style={[styles.toggleLabel, { color: colors.onSurface }]}>
                    Promemoria Ricorrente
                  </Text>
                  <Text style={[styles.toggleDescription, { color: colors.onSurfaceVariant }]}>
                    Ripeti automaticamente il promemoria
                  </Text>
                </View>
              </View>
              <Switch
                value={formData.isRecurring}
                onValueChange={(value) => setFormData(prev => ({ ...prev, isRecurring: value }))}
                trackColor={{ false: colors.outline, true: colors.primary + '50' }}
                thumbColor={formData.isRecurring ? colors.primary : colors.onSurfaceVariant}
              />
            </View>

            {formData.isRecurring && (
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.onSurface }]}>
                  Intervallo di Ricorrenza
                </Text>
                <View style={styles.recurringOptions}>
                  {recurringIntervals.map(interval => (
                    <TouchableOpacity
                      key={interval.value}
                      style={[
                        styles.recurringOption,
                        {
                          backgroundColor: formData.recurringInterval === interval.value ? colors.secondary + '20' : colors.surface,
                          borderColor: formData.recurringInterval === interval.value ? colors.secondary : colors.outline,
                        }
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, recurringInterval: interval.value }))}
                    >
                      <Text style={[
                        styles.recurringOptionText,
                        { color: formData.recurringInterval === interval.value ? colors.secondary : colors.onSurface }
                      ]}>
                        {interval.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={[styles.toggleGroup, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
              <View style={styles.toggleContent}>
                <Bell size={20} color={colors.primary} />
                <View style={styles.toggleText}>
                  <Text style={[styles.toggleLabel, { color: colors.onSurface }]}>
                    Promemoria Attivo
                  </Text>
                  <Text style={[styles.toggleDescription, { color: colors.onSurfaceVariant }]}>
                    Ricevi notifiche per questo promemoria
                  </Text>
                </View>
              </View>
              <Switch
                value={formData.isActive}
                onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value }))}
                trackColor={{ false: colors.outline, true: colors.primary + '50' }}
                thumbColor={formData.isActive ? colors.primary : colors.onSurfaceVariant}
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
          Nuovo Promemoria
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView style={styles.content}>
          {renderStepContent()}
        </ScrollView>

        <View style={[styles.navigationButtons, { backgroundColor: colors.background }]}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: colors.surface, borderColor: colors.outline }]}
              onPress={() => setCurrentStep(prev => prev - 1)}
            >
              <Text style={[styles.navButtonText, { color: colors.onSurface }]}>
                Indietro
              </Text>
            </TouchableOpacity>
          )}
          
          {currentStep < 2 ? (
            <TouchableOpacity
              style={[styles.navButton, styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => setCurrentStep(prev => prev + 1)}
            >
              <Text style={[styles.navButtonText, { color: colors.onPrimary }]}>
                Avanti
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navButton, styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={handleSaveReminder}
              disabled={isLoading}
            >
              <Text style={[styles.navButtonText, { color: colors.onPrimary }]}>
                {isLoading ? 'Salvataggio...' : 'Salva Promemoria'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DatePicker
          date={formData.dueDate}
          onDateChange={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
          onClose={() => setShowDatePicker(false)}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  typeSelector: {
    gap: 12,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  typeLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    flex: 1,
  },
  typeDescription: {
    fontSize: 14,
    flex: 2,
  },
  suggestions: {
    marginTop: 24,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  vehicleSelector: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
  },
  vehicleOptionText: {
    fontSize: 16,
    marginLeft: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
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
    borderWidth: 1,
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
    borderWidth: 1,
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
    borderWidth: 1,
  },
  recurringOptionText: {
    fontSize: 14,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 12,
  },
  navButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
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
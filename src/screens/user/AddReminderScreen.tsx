// src/screens/user/AddReminderScreen.tsx
// Schermata creazione promemoria con Apple Liquid Glass Design

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
  TextInput,
  Switch,
  KeyboardAvoidingView,
} from 'react-native';
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
  Info,
  Gauge,
  DollarSign,
  Clock,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAppThemeManager } from '../../hooks/useTheme';
import { useUserData } from '../../hooks/useUserData';
import ReminderService from '../../services/ReminderService';
import { ReminderType } from '../../types/database.types';

// ============================================
// GLASS CARD COMPONENT
// ============================================
const GlassCard = ({ children, style }: any) => {
  const { isDark } = useAppThemeManager();

  return Platform.OS === 'web' || Platform.OS === 'ios' ? (
    <BlurView
      intensity={Platform.OS === 'web' ? 40 : (isDark ? 30 : 60)}
      tint={isDark ? 'dark' : 'light'}
      style={[
        {
          backgroundColor: isDark ? 'rgba(30, 30, 30, 0.7)' : 'rgba(255, 255, 255, 0.7)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          borderWidth: 1,
          borderRadius: 16,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </BlurView>
  ) : (
    <View
      style={[
        {
          backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          borderWidth: 1,
          borderRadius: 16,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const AddReminderScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, isDark } = useAppThemeManager();
  const { vehicles } = useUserData();
  const { width } = useWindowDimensions();

  const preselectedVehicleId = (route.params as any)?.vehicleId;

  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form data
  const [vehicleId, setVehicleId] = useState(preselectedVehicleId || vehicles[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ReminderType>('maintenance');
  const [dueDate, setDueDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [dueMileage, setDueMileage] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState(1);
  const [recurringUnit, setRecurringUnit] = useState<'days' | 'weeks' | 'months' | 'years'>('years');
  const [notifyDaysBefore, setNotifyDaysBefore] = useState(7);

  const isLargeScreen = width >= 768;
  const isWeb = Platform.OS === 'web';

  const handleSave = async () => {
    if (!vehicleId) {
      Alert.alert('Errore', 'Seleziona un veicolo');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Errore', 'Inserisci un titolo per il promemoria');
      return;
    }

    try {
      setSaving(true);

      const reminderData: any = {
        vehicleId,
        title: title.trim(),
        type,
        dueDate,
        isActive,
        isCompleted: false,
        isRecurring,
        notifyDaysBefore,
        notificationSent: false,
      };

      // Aggiungi campi opzionali solo se presenti
      if (description.trim()) reminderData.description = description.trim();
      if (dueMileage) reminderData.dueMileage = parseInt(dueMileage);
      if (cost) reminderData.cost = parseFloat(cost);
      if (notes.trim()) reminderData.notes = notes.trim();

      // Campi ricorrenza
      if (isRecurring) {
        reminderData.recurringInterval = recurringInterval;
        reminderData.recurringUnit = recurringUnit;
      }

      await ReminderService.createReminder(reminderData);

      Alert.alert('Successo', 'Promemoria creato con successo', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Errore creazione promemoria:', error);
      Alert.alert('Errore', 'Impossibile creare il promemoria');
    } finally {
      setSaving(false);
    }
  };

  const reminderTypes = [
    { id: 'maintenance', label: 'Manutenzione', icon: Wrench, color: '#FF9500' },
    { id: 'insurance', label: 'Assicurazione', icon: Shield, color: '#34C759' },
    { id: 'tax', label: 'Bollo', icon: FileText, color: '#007AFF' },
    { id: 'inspection', label: 'Revisione', icon: CheckCircle, color: '#5856D6' },
    { id: 'tire_change', label: 'Cambio Gomme', icon: Settings, color: '#FF2D55' },
    { id: 'oil_change', label: 'Cambio Olio', icon: Wrench, color: '#FF9500' },
    { id: 'document', label: 'Documento', icon: FileText, color: '#5AC8FA' },
    { id: 'custom', label: 'Personalizzato', icon: Bell, color: '#8E8E93' },
    { id: 'other', label: 'Altro', icon: Bell, color: '#8E8E93' },
  ];

  const recurringOptions = [
    { value: 7, unit: 'days' as const, label: 'Ogni settimana' },
    { value: 1, unit: 'months' as const, label: 'Ogni mese' },
    { value: 3, unit: 'months' as const, label: 'Ogni 3 mesi' },
    { value: 6, unit: 'months' as const, label: 'Ogni 6 mesi' },
    { value: 1, unit: 'years' as const, label: 'Ogni anno' },
    { value: 2, unit: 'years' as const, label: 'Ogni 2 anni' },
  ];

  const notificationOptions = [
    { value: 0, label: 'Giorno stesso' },
    { value: 1, label: '1 giorno prima' },
    { value: 3, label: '3 giorni prima' },
    { value: 7, label: '1 settimana prima' },
    { value: 14, label: '2 settimane prima' },
    { value: 30, label: '1 mese prima' },
  ];

  // Suggerimenti per tipo
  const getSuggestionsForType = (type: string): string[] => {
    const suggestions: Record<string, string[]> = {
      maintenance: ['Tagliando completo', 'Cambio olio motore', 'Cambio filtri', 'Controllo freni'],
      insurance: ['Rinnovo RCA', 'Rinnovo Kasko', 'Scadenza polizza'],
      tax: ['Pagamento bollo auto', 'Tassa di circolazione'],
      inspection: ['Revisione ministeriale', 'Controllo tecnico'],
      tire_change: ['Cambio gomme estive', 'Cambio gomme invernali'],
      oil_change: ['Cambio olio motore', 'Sostituzione filtro olio'],
      document: ['Scadenza patente', 'Rinnovo certificato'],
      custom: [],
      other: [],
    };
    return suggestions[type] || [];
  };

  const suggestions = getSuggestionsForType(type);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1a1a1a', '#0a0a0a'] : ['#f8f9fa', '#e9ecef']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={[styles.header, isWeb && styles.headerWeb]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.onSurface} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
              Nuovo Promemoria
            </Text>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              isWeb && isLargeScreen && styles.scrollContentWeb,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Veicolo */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Car size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                  Veicolo
                </Text>
              </View>
              <View style={styles.vehicleList}>
                {vehicles.map(vehicle => (
                  <TouchableOpacity
                    key={vehicle.id}
                    style={[
                      styles.vehicleChip,
                      {
                        backgroundColor: vehicleId === vehicle.id ? colors.primary : colors.surfaceVariant,
                        borderColor: vehicleId === vehicle.id ? colors.primary : colors.outline,
                      },
                    ]}
                    onPress={() => setVehicleId(vehicle.id)}
                  >
                    <Text
                      style={[
                        styles.vehicleChipText,
                        { color: vehicleId === vehicle.id ? 'white' : colors.onSurfaceVariant },
                      ]}
                    >
                      {vehicle.make} {vehicle.model}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassCard>

            {/* Tipo */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Bell size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                  Tipo Promemoria
                </Text>
              </View>
              <View style={styles.typeGrid}>
                {reminderTypes.map(reminderType => {
                  const Icon = reminderType.icon;
                  const isSelected = type === reminderType.id;
                  return (
                    <TouchableOpacity
                      key={reminderType.id}
                      style={[
                        styles.typeCard,
                        {
                          backgroundColor: isSelected ? reminderType.color : colors.surfaceVariant,
                          borderColor: isSelected ? reminderType.color : colors.outline,
                        },
                      ]}
                      onPress={() => setType(reminderType.id as ReminderType)}
                    >
                      <Icon size={28} color={isSelected ? 'white' : colors.onSurfaceVariant} />
                      <Text
                        style={[
                          styles.typeLabel,
                          { color: isSelected ? 'white' : colors.onSurfaceVariant },
                        ]}
                      >
                        {reminderType.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Suggerimenti */}
              {suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <Text style={[styles.suggestionsTitle, { color: colors.onSurfaceVariant }]}>
                    Suggerimenti:
                  </Text>
                  <View style={styles.suggestionsList}>
                    {suggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.suggestionChip, { backgroundColor: colors.primaryContainer }]}
                        onPress={() => setTitle(suggestion)}
                      >
                        <Text style={[styles.suggestionChipText, { color: colors.primary }]}>
                          {suggestion}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </GlassCard>

            {/* Dettagli */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Info size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                  Dettagli
                </Text>
              </View>
              <View style={styles.cardContent}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.onSurface }]}
                  placeholder="Titolo promemoria"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={title}
                  onChangeText={setTitle}
                />
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { backgroundColor: colors.surfaceVariant, color: colors.onSurface },
                  ]}
                  placeholder="Descrizione (opzionale)"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </GlassCard>

            {/* Scadenza */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Calendar size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                  Scadenza
                </Text>
              </View>
              <View style={styles.cardContent}>
                <TouchableOpacity
                  style={[styles.dateButton, { backgroundColor: colors.surfaceVariant }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Clock size={20} color={colors.primary} />
                  <Text style={[styles.dateButtonText, { color: colors.onSurface }]}>
                    {dueDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={dueDate}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (selectedDate) setDueDate(selectedDate);
                    }}
                  />
                )}

                <View style={styles.inputRow}>
                  <View style={styles.inputIcon}>
                    <Gauge size={20} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, styles.inputFlex, { backgroundColor: colors.surfaceVariant, color: colors.onSurface }]}
                    placeholder="Chilometraggio (opzionale)"
                    placeholderTextColor={colors.onSurfaceVariant}
                    value={dueMileage}
                    onChangeText={setDueMileage}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputIcon}>
                    <DollarSign size={20} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, styles.inputFlex, { backgroundColor: colors.surfaceVariant, color: colors.onSurface }]}
                    placeholder="Costo previsto (opzionale)"
                    placeholderTextColor={colors.onSurfaceVariant}
                    value={cost}
                    onChangeText={setCost}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </GlassCard>

            {/* Ricorrenza */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <RefreshCw size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                  Ricorrenza
                </Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.switchRow}>
                  <Text style={[styles.switchLabel, { color: colors.onSurface }]}>
                    Promemoria ricorrente
                  </Text>
                  <Switch
                    value={isRecurring}
                    onValueChange={setIsRecurring}
                    trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                    thumbColor={isRecurring ? 'white' : colors.onSurfaceVariant}
                  />
                </View>

                {isRecurring && (
                  <View style={styles.optionsContainer}>
                    {recurringOptions.map(option => (
                      <TouchableOpacity
                        key={`${option.value}-${option.unit}`}
                        style={[
                          styles.optionChip,
                          {
                            backgroundColor:
                              recurringInterval === option.value && recurringUnit === option.unit
                                ? colors.primary
                                : colors.surfaceVariant,
                            borderColor:
                              recurringInterval === option.value && recurringUnit === option.unit
                                ? colors.primary
                                : colors.outline,
                          },
                        ]}
                        onPress={() => {
                          setRecurringInterval(option.value);
                          setRecurringUnit(option.unit);
                        }}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            {
                              color:
                                recurringInterval === option.value && recurringUnit === option.unit
                                  ? 'white'
                                  : colors.onSurfaceVariant,
                            },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </GlassCard>

            {/* Notifiche */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Bell size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                  Notifiche
                </Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.switchRow}>
                  <Text style={[styles.switchLabel, { color: colors.onSurface }]}>
                    Attiva notifiche
                  </Text>
                  <Switch
                    value={isActive}
                    onValueChange={setIsActive}
                    trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                    thumbColor={isActive ? 'white' : colors.onSurfaceVariant}
                  />
                </View>

                {isActive && (
                  <View style={styles.optionsContainer}>
                    {notificationOptions.map(option => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.optionChip,
                          {
                            backgroundColor: notifyDaysBefore === option.value ? colors.primary : colors.surfaceVariant,
                            borderColor: notifyDaysBefore === option.value ? colors.primary : colors.outline,
                          },
                        ]}
                        onPress={() => setNotifyDaysBefore(option.value)}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            { color: notifyDaysBefore === option.value ? 'white' : colors.onSurfaceVariant },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </GlassCard>

            {/* Note */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Info size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                  Note
                </Text>
              </View>
              <View style={styles.cardContent}>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { backgroundColor: colors.surfaceVariant, color: colors.onSurface },
                  ]}
                  placeholder="Note aggiuntive (opzionale)"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </GlassCard>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={saving}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Save size={20} color="white" />
                    <Text style={styles.saveButtonText}>Crea Promemoria</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerWeb: {
    paddingHorizontal: 32,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  scrollContentWeb: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    marginBottom: 16,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardContent: {
    gap: 12,
  },
  vehicleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  vehicleChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '30%',
    aspectRatio: 1.2,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  suggestionsContainer: {
    marginTop: 16,
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  suggestionChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputFlex: {
    flex: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default AddReminderScreen;

// src/screens/user/AddMaintenanceScreen.tsx - REDESIGN COMPLETO
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  ChevronDown,
  Euro,
  FileText,
  Paperclip,
  Save,
} from 'lucide-react-native';
import { UniversalDatePicker } from '../../components';
import { useAppThemeManager } from '../../hooks/useTheme';
import { db, auth } from '../../services/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

interface RouteParams {
  carId: string;
}

const MAINTENANCE_TYPES = [
  'Cambio olio',
  'Tagliando',
  'Revisione',
  'Cambio gomme',
  'Freni',
  'Batteria',
  'Filtri',
  'Distribuzione',
  'Altro',
];

const AddMaintenanceScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { carId } = (route.params as RouteParams) || {};
  const { colors, isDark } = useAppThemeManager();

  const [date, setDate] = useState(new Date());
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!carId) {
      Alert.alert('Errore', 'Veicolo non specificato');
      return false;
    }
    if (!type) {
      Alert.alert('Errore', 'Seleziona il tipo di intervento');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Errore', 'Inserisci una descrizione');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Utente non autenticato');

      const maintenanceData = {
        userId: user.uid,
        vehicleId: carId,
        type: type,
        description: description.trim(),
        completedDate: Timestamp.fromDate(date),
        cost: cost ? parseFloat(cost.replace(',', '.')) : 0,
        status: 'completed',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'maintenance'), maintenanceData);

      Alert.alert('Successo', 'Manutenzione registrata con successo!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error saving maintenance:', error);
      Alert.alert('Errore', 'Impossibile salvare la manutenzione. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? colors.background : '#F8F9FA' },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
        ]}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={colors.onSurface} strokeWidth={2} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
          Nuovo Intervento
        </Text>

        <View style={styles.headerButton} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Form Card */}
          <View
            style={[
              styles.formCard,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
            ]}
          >
            {/* Data */}
            <View style={styles.formGroup}>
              <UniversalDatePicker
                value={date}
                onChange={setDate}
                label="Data"
                mode="date"
                maximumDate={new Date()}
                showCalendar={true}
              />
            </View>

            {/* Tipo Intervento */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Tipo Intervento
              </Text>
              <TouchableOpacity
                style={[
                  styles.inputContainer,
                  { borderColor: isDark ? '#374151' : '#E5E7EB' },
                ]}
                onPress={() => setShowTypePicker(!showTypePicker)}
              >
                <FileText
                  size={20}
                  color={colors.onSurfaceVariant}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.inputText,
                    {
                      color: type ? colors.onSurface : colors.onSurfaceVariant,
                      flex: 1,
                    },
                  ]}
                >
                  {type || 'Seleziona tipo'}
                </Text>
                <ChevronDown
                  size={20}
                  color={colors.onSurfaceVariant}
                  strokeWidth={2}
                />
              </TouchableOpacity>

              {/* Type Picker */}
              {showTypePicker && (
                <View
                  style={[
                    styles.picker,
                    {
                      backgroundColor: isDark ? colors.surface : '#FFFFFF',
                      borderColor: isDark ? '#374151' : '#E5E7EB',
                    },
                  ]}
                >
                  {MAINTENANCE_TYPES.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.pickerItem,
                        {
                          backgroundColor:
                            type === item
                              ? `${colors.primary}15`
                              : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        setType(item);
                        setShowTypePicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          {
                            color:
                              type === item ? colors.primary : colors.onSurface,
                            fontWeight: type === item ? '600' : '400',
                          },
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Descrizione */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Descrizione
              </Text>
              <View
                style={[
                  styles.textAreaContainer,
                  { borderColor: isDark ? '#374151' : '#E5E7EB' },
                ]}
              >
                <TextInput
                  style={[
                    styles.textArea,
                    { color: colors.onSurface },
                  ]}
                  placeholder="Descrivi l'intervento effettuato..."
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Costo */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Costo
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { borderColor: isDark ? '#374151' : '#E5E7EB' },
                ]}
              >
                <Euro
                  size={20}
                  color={colors.onSurfaceVariant}
                  strokeWidth={2}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.onSurface, flex: 1 },
                  ]}
                  placeholder="0,00"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={cost}
                  onChangeText={setCost}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Allegati */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Allegati
              </Text>
              <TouchableOpacity
                style={[
                  styles.attachmentButton,
                  {
                    backgroundColor: `${colors.primary}10`,
                    borderColor: `${colors.primary}30`,
                  },
                ]}
                onPress={() => {
                  // TODO: Implement file picker
                  Alert.alert('Info', 'Funzione allegati in arrivo');
                }}
              >
                <Paperclip size={20} color={colors.primary} strokeWidth={2} />
                <Text style={[styles.attachmentText, { color: colors.primary }]}>
                  Aggiungi foto o documenti
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: colors.primary },
              isLoading && styles.saveButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Save size={20} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.saveButtonText}>Salva Intervento</Text>
              </>
            )}
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
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  scrollContent: {
    padding: 20,
  },

  // Form Card
  formCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },

  // Form Group
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: -0.2,
  },

  // Input Container
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  input: {
    fontSize: 15,
    padding: 0,
  },
  inputText: {
    fontSize: 15,
  },

  // Text Area
  textAreaContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  textArea: {
    fontSize: 15,
    minHeight: 100,
    padding: 0,
  },

  // Picker
  picker: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerItemText: {
    fontSize: 15,
  },

  // Attachment Button
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  attachmentText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Save Button
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      },
    }),
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});

export default AddMaintenanceScreen;

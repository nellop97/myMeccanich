import React, { useState } from 'react';
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
  KeyboardAvoidingView,
  Image
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Controller, useForm } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Camera,
  FileText,
  Save,
  Tag,
  MapPin,
  Receipt
} from 'lucide-react-native';
import { db, auth } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useStore } from '../../store';

interface ExpenseFormData {
  date: Date;
  amount: string;
  category: string;
  description: string;
  location: string;
  notes: string;
  receiptImage?: string;
}

interface RouteParams {
  carId: string;
}

const expenseCategories = [
  { id: 'parking', label: 'Parcheggio', icon: '🅿️', color: '#007AFF' },
  { id: 'tolls', label: 'Pedaggi', icon: '🛣️', color: '#FF9500' },
  { id: 'washing', label: 'Lavaggio', icon: '🧽', color: '#5AC8FA' },
  { id: 'fines', label: 'Multe', icon: '🚫', color: '#FF3B30' },
  { id: 'accessories', label: 'Accessori', icon: '🔧', color: '#34C759' },
  { id: 'registration', label: 'Bollo/Tasse', icon: '📄', color: '#8E8E93' },
  { id: 'other', label: 'Altro', icon: '📦', color: '#5856D6' }
];

const AddExpenseScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { carId } = route.params as RouteParams;
  const { darkMode } = useStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const theme = {
    background: darkMode ? '#121212' : '#f5f5f5',
    cardBackground: darkMode ? '#1e1e1e' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#a0a0a0' : '#666666',
    primary: '#007AFF',
    border: darkMode ? '#333333' : '#e0e0e0',
    success: '#34C759'
  };

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<ExpenseFormData>({
    defaultValues: {
      date: new Date(),
      amount: '',
      category: '',
      description: '',
      location: '',
      notes: '',
      receiptImage: ''
    }
  });

  const watchedCategory = watch('category');

  const handleImagePicker = () => {
    Alert.alert(
      'Aggiungi Ricevuta',
      'Scegli come aggiungere la foto della ricevuta',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Fotocamera', 
          onPress: () => {
            // In a real app, you would implement camera functionality
            Alert.alert('Info', 'Funzionalità fotocamera in sviluppo');
          }
        },
        { 
          text: 'Galleria', 
          onPress: () => {
            // In a real app, you would implement gallery picker
            Alert.Alert('Info', 'Funzionalità galleria in sviluppo');
          }
        }
      ]
    );
  };

  const onSubmit = async (data: ExpenseFormData) => {
    if (!auth.currentUser) {
      Alert.alert('Errore', 'Devi essere autenticato per salvare i dati');
      return;
    }

    if (!data.category) {
      Alert.alert('Errore', 'Seleziona una categoria');
      return;
    }

    setIsLoading(true);

    try {
      const expense = {
        carId,
        userId: auth.currentUser.uid,
        date: data.date.toISOString(),
        amount: parseFloat(data.amount),
        category: data.category,
        description: data.description,
        location: data.location,
        notes: data.notes,
        receiptImage: receiptImage,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'expenses'), expense);

      Alert.alert(
        'Successo',
        'Spesa salvata con successo!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving expense:', error);
      Alert.alert('Errore', 'Impossibile salvare la spesa');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCategory = expenseCategories.find(cat => cat.id === watchedCategory);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Aggiungi Spesa</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Date Section */}
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Data</Text>

            <TouchableOpacity
              style={[styles.dateButton, { borderColor: theme.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color={theme.primary} />
              <Text style={[styles.dateText, { color: theme.text }]}>
                {watch('date').toLocaleDateString('it-IT')}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={watch('date')}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setValue('date', selectedDate);
                  }
                }}
              />
            )}
          </View>

          {/* Category Section */}
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Categoria</Text>

            <View style={styles.categoryGrid}>
              {expenseCategories.map((category) => (
                <Controller
                  key={category.id}
                  control={control}
                  name="category"
                  render={({ field: { value, onChange } }) => (
                    <TouchableOpacity
                      style={[
                        styles.categoryButton,
                        { 
                          borderColor: value === category.id ? category.color : theme.border,
                          backgroundColor: value === category.id ? category.color + '20' : 'transparent'
                        }
                      ]}
                      onPress={() => onChange(category.id)}
                    >
                      <Text style={styles.categoryIcon}>{category.icon}</Text>
                      <Text style={[
                        styles.categoryLabel, 
                        { color: value === category.id ? category.color : theme.text }
                      ]}>
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              ))}
            </View>
          </View>

          {/* Amount Section */}
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Importo</Text>

            <View style={styles.amountContainer}>
              <DollarSign size={20} color={theme.primary} />
              <Controller
                control={control}
                name="amount"
                rules={{ 
                  required: 'Importo obbligatorio',
                  pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Importo non valido' }
                }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.amountInput, { 
                      borderColor: errors.amount ? '#FF3B30' : 'transparent',
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
              <Text style={[styles.currencyLabel, { color: theme.textSecondary }]}>€</Text>
            </View>
            {errors.amount && (
              <Text style={styles.errorText}>{errors.amount.message}</Text>
            )}
          </View>

          {/* Description Section */}
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Descrizione</Text>

            <Controller
              control={control}
              name="description"
              rules={{ required: 'Descrizione obbligatoria' }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, { 
                    borderColor: errors.description ? '#FF3B30' : theme.border,
                    backgroundColor: theme.cardBackground,
                    color: theme.text
                  }]}
                  value={value}
                  onChangeText={onChange}
                  placeholder={selectedCategory ? `Es. ${selectedCategory.label}...` : 'Descrivi la spesa...'}
                  placeholderTextColor={theme.textSecondary}
                />
              )}
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description.message}</Text>
            )}
          </View>

          {/* Location Section */}
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Luogo (opzionale)</Text>

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
                  placeholder="Dove hai sostenuto questa spesa?"
                  placeholderTextColor={theme.textSecondary}
                />
              )}
            />
          </View>

          {/* Receipt Section */}
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Ricevuta (opzionale)</Text>

            <TouchableOpacity
              style={[styles.receiptButton, { borderColor: theme.border }]}
              onPress={handleImagePicker}
            >
              <Camera size={24} color={theme.primary} />
              <Text style={[styles.receiptButtonText, { color: theme.text }]}>
                {receiptImage ? 'Cambia foto' : 'Aggiungi foto ricevuta'}
              </Text>
            </TouchableOpacity>

            {receiptImage && (
              <View style={styles.receiptPreview}>
                <Image source={{ uri: receiptImage }} style={styles.receiptImage} />
              </View>
            )}
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
                  placeholder="Aggiungi note aggiuntive..."
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
              {isLoading ? 'Salvataggio...' : 'Salva Spesa'}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderRadius: 8,
    gap: 6,
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,122,255,0.1)',
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    paddingVertical: 12,
    textAlign: 'right',
  },
  currencyLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
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
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderRadius: 8,
    borderStyle: 'dashed',
    gap: 8,
  },
  receiptButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  receiptPreview: {
    marginTop: 12,
    alignItems: 'center',
  },
  receiptImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
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

export default AddExpenseScreen;
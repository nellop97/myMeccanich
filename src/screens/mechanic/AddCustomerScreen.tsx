// src/screens/mechanic/AddCustomerScreen.tsx
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  Building,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useStore } from '../../store';
import { useInvoicingStore, Customer } from '../../store/invoicingStore';

const { width: screenWidth } = Dimensions.get('window');

interface RouteParams {
  customerId?: string;
}

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  vatNumber: string;
  fiscalCode: string;
  isCompany: boolean;
}

const AddCustomerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams | undefined;

  const { darkMode } = useStore();
  const { addCustomer, updateCustomer, getCustomerById } = useInvoicingStore();

  const isEditing = !!params?.customerId;
  const customer = isEditing ? getCustomerById(params!.customerId) : null;

  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<CustomerFormData>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      vatNumber: '',
      fiscalCode: '',
      isCompany: false,
    }
  });

  const watchIsCompany = watch('isCompany');

  const theme = {
    background: darkMode ? '#111827' : '#f3f4f6',
    cardBackground: darkMode ? '#1f2937' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#9ca3af' : '#6b7280',
    border: darkMode ? '#374151' : '#e5e7eb',
    accent: '#2563eb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  };

  // Carica i dati del cliente se in modalità modifica
  useEffect(() => {
    if (customer) {
      setValue('name', customer.name);
      setValue('email', customer.email || '');
      setValue('phone', customer.phone || '');
      setValue('address', customer.address || '');
      setValue('city', customer.city || '');
      setValue('postalCode', customer.postalCode || '');
      setValue('vatNumber', customer.vatNumber || '');
      setValue('fiscalCode', customer.fiscalCode || '');
      setValue('isCompany', customer.isCompany);
    }
  }, [customer, setValue]);

  const onSubmit = (data: CustomerFormData) => {
    try {
      if (isEditing && customer) {
        updateCustomer(customer.id, data);
        Alert.alert('Successo', 'Cliente aggiornato con successo', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        addCustomer(data);
        Alert.alert('Successo', 'Cliente aggiunto con successo', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Errore', 'Errore durante il salvataggio del cliente');
    }
  };

  const FormCard = ({ title, icon: Icon, children }: any) => (
    <View style={[styles.formCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <View style={styles.formCardHeader}>
        <View style={styles.formCardTitleContainer}>
          <View style={[styles.formCardIcon, { backgroundColor: darkMode ? '#1e3a8a' : '#dbeafe' }]}>
            <Icon size={20} color={darkMode ? '#60a5fa' : '#2563eb'} />
          </View>
          <Text style={[styles.formCardTitle, { color: theme.text }]}>{title}</Text>
        </View>
      </View>
      <View style={styles.formCardContent}>
        {children}
      </View>
    </View>
  );

  const FormInput = ({
    label,
    placeholder,
    value,
    onChangeText,
    error,
    keyboardType = 'default',
    autoCapitalize = 'words',
    required = false
  }: any) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: theme.text }]}>
        {label} {required && <Text style={{ color: theme.error }}>*</Text>}
      </Text>
      <TextInput
        style={[
          styles.textInput,
          {
            backgroundColor: theme.cardBackground,
            borderColor: error ? theme.error : theme.border,
            color: theme.text
          }
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {error && <Text style={[styles.errorText, { color: theme.error }]}>Questo campo è obbligatorio</Text>}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {isEditing ? 'Modifica Cliente' : 'Nuovo Cliente'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {isEditing ? 'Aggiorna i dati del cliente' : 'Aggiungi un nuovo cliente'}
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
          {/* Tipo Cliente */}
          <FormCard title="Tipo Cliente" icon={watchIsCompany ? Building : User}>
            <View style={styles.switchContainer}>
              <View style={styles.switchLabelContainer}>
                <Text style={[styles.switchLabel, { color: theme.text }]}>Persona Fisica</Text>
                <Text style={[styles.switchLabel, { color: theme.text }]}>Azienda</Text>
              </View>
              <Controller
                control={control}
                name="isCompany"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: theme.textSecondary, true: theme.accent }}
                    thumbColor={value ? '#ffffff' : '#ffffff'}
                  />
                )}
              />
            </View>
            <Text style={[styles.switchDescription, { color: theme.textSecondary }]}>
              {watchIsCompany
                ? 'Selezionato per aziende, professionisti e attività commerciali'
                : 'Selezionato per clienti privati e persone fisiche'
              }
            </Text>
          </FormCard>

          {/* Informazioni Generali */}
          <FormCard title="Informazioni Generali" icon={User}>
            <Controller
              control={control}
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <FormInput
                  label={watchIsCompany ? "Ragione Sociale" : "Nome e Cognome"}
                  placeholder={watchIsCompany ? "es. AutoService SpA" : "es. Mario Rossi"}
                  value={value}
                  onChangeText={onChange}
                  error={errors.name}
                  required={true}
                />
              )}
              name="name"
            />

            <Controller
              control={control}
              render={({ field: { onChange, value } }) => (
                <FormInput
                  label="Email"
                  placeholder="es. cliente@email.com"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
              name="email"
            />

            <Controller
              control={control}
              render={({ field: { onChange, value } }) => (
                <FormInput
                  label="Telefono"
                  placeholder="es. +39 123 456 7890"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                />
              )}
              name="phone"
            />
          </FormCard>

          {/* Indirizzo */}
          <FormCard title="Indirizzo" icon={MapPin}>
            <Controller
              control={control}
              render={({ field: { onChange, value } }) => (
                <FormInput
                  label="Indirizzo"
                  placeholder="es. Via Roma 123"
                  value={value}
                  onChangeText={onChange}
                />
              )}
              name="address"
            />

            <View style={styles.addressRow}>
              <View style={styles.cityContainer}>
                <Controller
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <FormInput
                      label="Città"
                      placeholder="es. Milano"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                  name="city"
                />
              </View>

              <View style={styles.postalCodeContainer}>
                <Controller
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <FormInput
                      label="CAP"
                      placeholder="es. 20100"
                      value={value}
                      onChangeText={onChange}
                      keyboardType="numeric"
                    />
                  )}
                  name="postalCode"
                />
              </View>
            </View>
          </FormCard>

          {/* Dati Fiscali */}
          <FormCard title="Dati Fiscali" icon={Building}>
            {watchIsCompany ? (
              <Controller
                control={control}
                render={({ field: { onChange, value } }) => (
                  <FormInput
                    label="Partita IVA"
                    placeholder="es. IT12345678901"
                    value={value}
                    onChangeText={onChange}
                    autoCapitalize="characters"
                  />
                )}
                name="vatNumber"
              />
            ) : (
              <Controller
                control={control}
                render={({ field: { onChange, value } }) => (
                  <FormInput
                    label="Codice Fiscale"
                    placeholder="es. RSSMRA80A01F205X"
                    value={value}
                    onChangeText={onChange}
                    autoCapitalize="characters"
                  />
                )}
                name="fiscalCode"
              />
            )}

            <Text style={[styles.fiscalNote, { color: theme.textSecondary }]}>
              {watchIsCompany
                ? 'La Partita IVA è necessaria per le fatture B2B'
                : 'Il Codice Fiscale è necessario per le fatture ai privati'
              }
            </Text>
          </FormCard>

          {/* Pulsanti Azione */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.border }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Annulla</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.accent }]}
              onPress={handleSubmit(onSubmit)}
            >
              <Save size={18} color="#ffffff" />
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Aggiorna Cliente' : 'Salva Cliente'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
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
  formCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  formCardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  formCardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  formCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  formCardContent: {
    padding: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  switchDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cityContainer: {
    flex: 2,
  },
  postalCodeContainer: {
    flex: 1,
  },
  fiscalNote: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default AddCustomerScreen;

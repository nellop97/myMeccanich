// src/screens/mechanic/NewAppointmentScreen.tsx
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Calendar,
  Car,
  FileText,
  Plus,
  Save,
  User,
  Wrench,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useStore } from '../../store';
import { useWorkshopStore } from '../../store/workshopStore';
import CalendarAppointmentPicker from './CalendarAppointmentPicker';
import UserSearchModal from '../../components/UserSearchModal';

const { width: screenWidth } = Dimensions.get('window');

export type FormData = {
  model: string;
  vin: string;
  licensePlate: string;
  owner: string;
  repairDescription: string;
  estimatedCost: string;
};

const NewAppointmentScreen = () => {
  const navigation = useNavigation();
  const { darkMode } = useStore();
  const { addAppointment } = useWorkshopStore();

  // Stati per il calendario integrato
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const isDesktop = Platform.OS === 'web' && screenWidth > 768;

  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    defaultValues: {
      estimatedCost: '0'
    }
  });

  const theme = {
    background: darkMode ? '#111827' : '#f3f4f6',
    cardBackground: darkMode ? '#1f2937' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#9ca3af' : '#6b7280',
    border: darkMode ? '#374151' : '#e5e7eb',
    inputBackground: darkMode ? '#374151' : '#ffffff',
    placeholderColor: darkMode ? '#9ca3af' : '#6b7280',
    accent: '#2563eb',
    primary: darkMode ? '#60a5fa' : '#2563eb', // Accent color for UI elements
  };

  const [carData, setCarData] = useState({
    model: '',
    vin: '',
    licensePlate: '',
    owner: '',
    color: '',
    year: '',
    mileage: '',
    ownerId: '', // ID dell'utente proprietario
    ownerPhone: '', // Telefono del proprietario
    ownerEmail: '', // Email del proprietario
  });

  // Stati per la ricerca utenti
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const onSubmit = (data: FormData) => {
    try {
      if (!startDate) {
        Alert.alert('Errore', 'Seleziona almeno la data di inizio dei lavori');
        return;
      }

      const finalEndDate = endDate || startDate; // Se non c'è data di fine, usa quella di inizio

      const newAppointmentId = addAppointment({
        model: data.model,
        vin: data.vin,
        licensePlate: data.licensePlate,
        owner: data.owner,
        repairs: [{
          description: data.repairDescription,
          scheduledDate: startDate,
          deliveryDate: finalEndDate,
          totalCost: parseFloat(data.estimatedCost) || 0,
        }]
      });

      console.log('Nuovo appuntamento creato con ID:', newAppointmentId);
      console.log('Periodo di lavorazione:', { startDate, endDate: finalEndDate });
      navigation.goBack();
    } catch (error) {
      console.error('Errore durante la creazione dell\'appuntamento:', error);
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

  const FormInput = ({ label, placeholder, value, onChangeText, error, multiline = false, keyboardType = 'default' }: any) => (
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
        <TextInput
            style={[
              styles.textInput,
              multiline && styles.textInputMultiline,
              {
                backgroundColor: theme.inputBackground,
                borderColor: error ? '#ef4444' : theme.border,
                color: theme.text
              }
            ]}
            placeholder={placeholder}
            placeholderTextColor={theme.placeholderColor}
            value={value}
            onChangeText={onChangeText}
            multiline={multiline}
            keyboardType={keyboardType}
        />
        {error && <Text style={styles.errorText}>Questo campo è obbligatorio</Text>}
      </View>
  );

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setCarData(prev => ({
      ...prev,
      owner: `${user.firstName} ${user.lastName}`,
      ownerId: user.id,
      ownerPhone: user.phone || '',
      ownerEmail: user.email,
    }));
  };

  const handleSave = () => {
    // Validazione base
    if (!carData.model.trim() || !carData.licensePlate.trim() || !selectedUser) {
      Alert.alert('Errore', 'Compila tutti i campi obbligatori e seleziona un proprietario');
      return;
    }

    if (repairs.length === 0) {
      Alert.alert('Errore', 'Aggiungi almeno una riparazione');
      return;
    }

    const invalidRepairs = repairs.some(repair => 
      !repair.description.trim() || !repair.estimatedCost.trim()
    );

    if (invalidRepairs) {
      Alert.alert('Errore', 'Compila tutti i campi delle riparazioni');
      return;
    }
  };

  return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} translucent={false}/>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Nuovo Appuntamento</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Aggiungi una nuova auto in officina
            </Text>
          </View>
        </View>

        <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
          {/* Informazioni Veicolo */}
          <FormCard title="Informazioni Veicolo" icon={Car}>
            <View style={isDesktop ? styles.rowDesktop : styles.rowMobile}>
              <View style={isDesktop ? styles.halfWidth : styles.fullWidth}>
                <Controller
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { onChange, value } }) => (
                        <FormInput
                            label="Modello Auto *"
                            placeholder="es. Tesla Model 3, Fiat 500..."
                            value={value}
                            onChangeText={onChange}
                            error={errors.model}
                        />
                    )}
                    name="model"
                />
              </View>

              <View style={isDesktop ? styles.halfWidth : styles.fullWidth}>
                <Controller
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { onChange, value } }) => (
                        <FormInput
                            label="Numero VIN *"
                            placeholder="es. 5YJ3E1EAXKF123456"
                            value={value}
                            onChangeText={onChange}
                            error={errors.vin}
                        />
                    )}
                    name="vin"
                />
              </View>
            </View>

            <View style={isDesktop ? styles.rowDesktop : styles.rowMobile}>
              <View style={isDesktop ? styles.halfWidth : styles.fullWidth}>
                <Controller
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { onChange, value } }) => (
                        <FormInput
                            label="Targa *"
                            placeholder="es. AB123CD"
                            value={value}
                            onChangeText={onChange}
                            error={errors.licensePlate}
                        />
                    )}
                    name="licensePlate"
                />
              </View>

              <View style={isDesktop ? styles.halfWidth : styles.fullWidth}>
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    Proprietario *
                  </Text>

                  {selectedUser ? (
                    <View style={[styles.selectedUserContainer, { backgroundColor: theme.cardBackground, borderColor: theme.primary }]}>
                      <View style={styles.selectedUserInfo}>
                        <View style={[styles.userAvatar, { backgroundColor: theme.primary }]}>
                          <Text style={styles.userAvatarText}>
                            {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                          </Text>
                        </View>
                        <View style={styles.userDetails}>
                          <Text style={[styles.selectedUserName, { color: theme.text }]}>
                            {selectedUser.firstName} {selectedUser.lastName}
                          </Text>
                          <Text style={[styles.selectedUserEmail, { color: theme.textSecondary }]}>
                            {selectedUser.email}
                          </Text>
                          {selectedUser.phone && (
                            <Text style={[styles.selectedUserPhone, { color: theme.textSecondary }]}>
                              📞 {selectedUser.phone}
                            </Text>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity 
                        onPress={() => {
                          setSelectedUser(null);
                          setCarData(prev => ({
                            ...prev,
                            owner: '',
                            ownerId: '',
                            ownerPhone: '',
                            ownerEmail: '',
                          }));
                        }}
                        style={styles.removeUserButton}
                      >
                        <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.searchUserButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                      onPress={() => setShowUserSearch(true)}
                    >
                      <MaterialCommunityIcons name="account-search" size={20} color={theme.primary} />
                      <Text style={[styles.searchUserText, { color: theme.primary }]}>
                        Cerca proprietario
                      </Text>
                      <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                  )}

                  {!selectedUser && (
                    <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                      Clicca per cercare il proprietario tra i tuoi clienti registrati
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </FormCard>

          {/* Dettagli Intervento */}
          <FormCard title="Dettagli Intervento" icon={Wrench}>
            <Controller
                control={control}
                rules={{ required: true }}
                render={({ field: { onChange, value } }) => (
                    <FormInput
                        label="Descrizione Riparazione *"
                        placeholder="Descrivi dettagliatamente l'intervento da effettuare..."
                        value={value}
                        onChangeText={onChange}
                        error={errors.repairDescription}
                        multiline={true}
                    />
                )}
                name="repairDescription"
            />

            <Controller
                control={control}
                render={({ field: { onChange, value } }) => (
                    <FormInput
                        label="Costo Stimato (€)"
                        placeholder="0.00"
                        value={value}
                        onChangeText={onChange}
                        keyboardType="numeric"
                    />
                )}
                name="estimatedCost"
            />
          </FormCard>

          {/* Pianificazione con Calendario */}
          <FormCard title="Pianificazione" icon={Calendar}>
            <CalendarAppointmentPicker
              startDate={startDate}
              endDate={endDate}
              onPeriodChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
              theme={theme}
            />
          </FormCard>

          {/* Riepilogo */}
          <View style={[styles.summaryCard, { backgroundColor: darkMode ? '#1e3a8a' : '#dbeafe', borderColor: darkMode ? '#1e40af' : '#93c5fd' }]}>
            <View style={styles.summaryHeader}>
              <FileText size={20} color={darkMode ? '#60a5fa' : '#1e40af'} />
              <Text style={[styles.summaryTitle, { color: darkMode ? '#60a5fa' : '#1e40af' }]}>
                Riepilogo Appuntamento
              </Text>
            </View>
            <Text style={[styles.summaryText, { color: darkMode ? '#93c5fd' : '#1e40af' }]}>
              {startDate ? (
                endDate ? (
                  `Lavorazione programmata dal ${new Date(startDate).toLocaleDateString('it-IT')} al ${new Date(endDate).toLocaleDateString('it-IT')} (${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} giorni).`
                ) : (
                  `Lavorazione programmata per il ${new Date(startDate).toLocaleDateString('it-IT')} (1 giorno).`
                )
              ) : (
                'Seleziona il periodo di lavorazione nel calendario sopra.'
              )}
              {' '}Verifica tutti i dati inseriti prima di salvare l'appuntamento.
            </Text>
          </View>

          {/* Pulsanti Azione */}
          <View style={[styles.actionButtons, isDesktop && styles.actionButtonsDesktop]}>
            <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.border }]}
                onPress={() => navigation.goBack()}
            >
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Annulla</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: startDate ? theme.accent : theme.textSecondary }
                ]}
                onPress={handleSubmit(onSubmit)}
                disabled={!startDate}
            >
              <Save size={18} color="#ffffff" />
              <Text style={styles.saveButtonText}>Salva Appuntamento</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

      {/* User Search Modal */}
      <UserSearchModal
        visible={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        onSelectUser={handleSelectUser}
        darkMode={darkMode}
      />
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  rowDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowMobile: {
    flexDirection: 'column',
  },
  halfWidth: {
    flex: 1,
    marginHorizontal: 4,
  },
  fullWidth: {
    flex: 1,
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
  textInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 12,
  },
  actionButtonsDesktop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  // Stili per la ricerca utenti
  selectedUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  selectedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  selectedUserName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedUserEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  selectedUserPhone: {
    fontSize: 12,
  },
  removeUserButton: {
    padding: 8,
  },
  searchUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchUserText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default NewAppointmentScreen;
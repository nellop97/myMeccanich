
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
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Controller, useForm } from 'react-hook-form';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  FileText,
  Send,
  AlertTriangle
} from 'lucide-react-native';
import { db, auth } from '../../services/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { useStore } from '../../store';

interface TransferFormData {
  newOwnerEmail: string;
  newOwnerName: string;
  newOwnerPhone: string;
  message: string;
  transferDate: Date;
}

interface RouteParams {
  carId: string;
  carInfo: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };
}

const TransferCarScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { carId, carInfo } = route.params as RouteParams;
  const { darkMode } = useStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: Confirmation, 3: Success

  const theme = {
    background: darkMode ? '#121212' : '#f5f5f5',
    cardBackground: darkMode ? '#1e1e1e' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#a0a0a0' : '#666666',
    primary: '#007AFF',
    border: darkMode ? '#333333' : '#e0e0e0',
    warning: '#FF9500',
    success: '#34C759'
  };

  const { control, handleSubmit, watch, formState: { errors } } = useForm<TransferFormData>({
    defaultValues: {
      newOwnerEmail: '',
      newOwnerName: '',
      newOwnerPhone: '',
      message: 'Ti sto trasferendo la proprietà di questa auto. Accetta il trasferimento per diventare il nuovo proprietario.',
      transferDate: new Date()
    }
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const checkUserExists = async (email: string) => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email.toLowerCase())
      );
      const snapshot = await getDocs(usersQuery);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking user:', error);
      return false;
    }
  };

  const createTransferRequest = async (data: TransferFormData) => {
    if (!auth.currentUser) {
      throw new Error('Utente non autenticato');
    }

    // Check if recipient exists
    const userExists = await checkUserExists(data.newOwnerEmail);
    
    const transferRequest = {
      carId,
      fromUserId: auth.currentUser.uid,
      fromUserEmail: auth.currentUser.email,
      toUserEmail: data.newOwnerEmail.toLowerCase(),
      newOwnerName: data.newOwnerName,
      newOwnerPhone: data.newOwnerPhone,
      message: data.message,
      carInfo: carInfo,
      status: userExists ? 'pending' : 'invitation_sent',
      userExists,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    await addDoc(collection(db, 'carTransferRequests'), transferRequest);
    return transferRequest;
  };

  const onSubmit = async (data: TransferFormData) => {
    if (!validateEmail(data.newOwnerEmail)) {
      Alert.alert('Errore', 'Inserisci un indirizzo email valido');
      return;
    }

    if (data.newOwnerEmail.toLowerCase() === auth.currentUser?.email?.toLowerCase()) {
      Alert.alert('Errore', 'Non puoi trasferire l\'auto a te stesso');
      return;
    }

    setIsLoading(true);

    try {
      await createTransferRequest(data);
      setStep(3);
    } catch (error) {
      console.error('Error creating transfer request:', error);
      Alert.alert('Errore', 'Impossibile creare la richiesta di trasferimento');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={[styles.step, { backgroundColor: step >= 1 ? theme.primary : theme.border }]}>
        <Text style={[styles.stepText, { color: step >= 1 ? '#fff' : theme.textSecondary }]}>1</Text>
      </View>
      <View style={[styles.stepLine, { backgroundColor: step >= 2 ? theme.primary : theme.border }]} />
      <View style={[styles.step, { backgroundColor: step >= 2 ? theme.primary : theme.border }]}>
        <Text style={[styles.stepText, { color: step >= 2 ? '#fff' : theme.textSecondary }]}>2</Text>
      </View>
      <View style={[styles.stepLine, { backgroundColor: step >= 3 ? theme.primary : theme.border }]} />
      <View style={[styles.step, { backgroundColor: step >= 3 ? theme.primary : theme.border }]}>
        <Text style={[styles.stepText, { color: step >= 3 ? '#fff' : theme.textSecondary }]}>3</Text>
      </View>
    </View>
  );

  const renderForm = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Car Info */}
      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Auto da Trasferire</Text>
        <View style={styles.carInfo}>
          <Text style={[styles.carTitle, { color: theme.text }]}>
            {carInfo.make} {carInfo.model} ({carInfo.year})
          </Text>
          <Text style={[styles.carPlate, { color: theme.textSecondary }]}>
            {carInfo.licensePlate}
          </Text>
        </View>
      </View>

      {/* Warning */}
      <View style={[styles.warningSection, { backgroundColor: theme.warning + '20', borderColor: theme.warning }]}>
        <AlertTriangle size={20} color={theme.warning} />
        <Text style={[styles.warningText, { color: theme.text }]}>
          Attenzione: Trasferendo la proprietà perderai l'accesso a tutti i dati relativi a questa auto.
        </Text>
      </View>

      {/* New Owner Info */}
      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Nuovo Proprietario</Text>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>Email *</Text>
          <Controller
            control={control}
            name="newOwnerEmail"
            rules={{ 
              required: 'Email obbligatoria',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email non valida' }
            }}
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputWithIcon}>
                <Mail size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { 
                    borderColor: errors.newOwnerEmail ? '#FF3B30' : theme.border,
                    backgroundColor: theme.cardBackground,
                    color: theme.text
                  }]}
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="email@example.com"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            )}
          />
          {errors.newOwnerEmail && (
            <Text style={styles.errorText}>{errors.newOwnerEmail.message}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>Nome Completo *</Text>
          <Controller
            control={control}
            name="newOwnerName"
            rules={{ required: 'Nome obbligatorio' }}
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputWithIcon}>
                <User size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { 
                    borderColor: errors.newOwnerName ? '#FF3B30' : theme.border,
                    backgroundColor: theme.cardBackground,
                    color: theme.text
                  }]}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Nome e cognome"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            )}
          />
          {errors.newOwnerName && (
            <Text style={styles.errorText}>{errors.newOwnerName.message}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>Telefono (opzionale)</Text>
          <Controller
            control={control}
            name="newOwnerPhone"
            render={({ field: { onChange, value } }) => (
              <View style={styles.inputWithIcon}>
                <Phone size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { 
                    borderColor: theme.border,
                    backgroundColor: theme.cardBackground,
                    color: theme.text
                  }]}
                  value={value}
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                  placeholder="+39 123 456 7890"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            )}
          />
        </View>
      </View>

      {/* Message */}
      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Messaggio</Text>
        
        <Controller
          control={control}
          name="message"
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
              numberOfLines={4}
              placeholder="Aggiungi un messaggio per il nuovo proprietario..."
              placeholderTextColor={theme.textSecondary}
            />
          )}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: theme.primary }]}
        onPress={() => setStep(2)}
        disabled={isLoading}
      >
        <Text style={styles.submitButtonText}>Continua</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderConfirmation = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.confirmationTitle, { color: theme.text }]}>
          Conferma Trasferimento
        </Text>
        
        <View style={styles.confirmationItem}>
          <Text style={[styles.confirmationLabel, { color: theme.textSecondary }]}>Auto:</Text>
          <Text style={[styles.confirmationValue, { color: theme.text }]}>
            {carInfo.make} {carInfo.model} ({carInfo.year}) - {carInfo.licensePlate}
          </Text>
        </View>

        <View style={styles.confirmationItem}>
          <Text style={[styles.confirmationLabel, { color: theme.textSecondary }]}>Nuovo proprietario:</Text>
          <Text style={[styles.confirmationValue, { color: theme.text }]}>
            {watch('newOwnerName')}
          </Text>
        </View>

        <View style={styles.confirmationItem}>
          <Text style={[styles.confirmationLabel, { color: theme.textSecondary }]}>Email:</Text>
          <Text style={[styles.confirmationValue, { color: theme.text }]}>
            {watch('newOwnerEmail')}
          </Text>
        </View>

        {watch('newOwnerPhone') && (
          <View style={styles.confirmationItem}>
            <Text style={[styles.confirmationLabel, { color: theme.textSecondary }]}>Telefono:</Text>
            <Text style={[styles.confirmationValue, { color: theme.text }]}>
              {watch('newOwnerPhone')}
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.warningSection, { backgroundColor: theme.warning + '20', borderColor: theme.warning }]}>
        <AlertTriangle size={20} color={theme.warning} />
        <Text style={[styles.warningText, { color: theme.text }]}>
          Confermando, invierai una richiesta di trasferimento. Il nuovo proprietario dovrà accettare per completare il trasferimento.
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: theme.border }]}
          onPress={() => setStep(1)}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Indietro</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Send size={16} color="#ffffff" />
              <Text style={styles.primaryButtonText}>Invia Richiesta</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderSuccess = () => (
    <View style={[styles.successContainer, { backgroundColor: theme.background }]}>
      <View style={[styles.successIcon, { backgroundColor: theme.success + '20' }]}>
        <Send size={48} color={theme.success} />
      </View>
      
      <Text style={[styles.successTitle, { color: theme.text }]}>
        Richiesta Inviata!
      </Text>
      
      <Text style={[styles.successMessage, { color: theme.textSecondary }]}>
        La richiesta di trasferimento è stata inviata a {watch('newOwnerEmail')}. 
        Riceverai una notifica quando il nuovo proprietario avrà accettato il trasferimento.
      </Text>

      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('VehicleList')}
      >
        <Text style={styles.doneButtonText}>Torna alle Auto</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Trasferisci Proprietà</Text>
        <View style={{ width: 24 }} />
      </View>

      {step < 3 && renderStepIndicator()}

      {step === 1 && renderForm()}
      {step === 2 && renderConfirmation()}
      {step === 3 && renderSuccess()}
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
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  step: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepLine: {
    width: 40,
    height: 2,
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
  carInfo: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  carTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  carPlate: {
    fontSize: 14,
  },
  warningSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmationItem: {
    marginBottom: 12,
  },
  confirmationLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  confirmationValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  secondaryButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  doneButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TransferCarScreen;

// =====================================================
// REQUEST VEHICLE VIEW SCREEN
// Schermata per richiedere visualizzazione dati veicolo
// =====================================================

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  Divider
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Car,
  User,
  Mail,
  Phone,
  MessageSquare,
  Search,
  CheckCircle,
  AlertCircle,
  Eye,
  XCircle,
  Info
} from 'lucide-react-native';
import { useAppThemeManager } from '../../hooks/useTheme';
import { VehicleViewRequestService } from '../../services/VehicleViewRequestService';
import { auth } from '../../services/firebase';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isLargeScreen = width >= 768;

export default function RequestVehicleViewScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useAppThemeManager();
  const viewRequestService = VehicleViewRequestService.getInstance();

  const [step, setStep] = useState<'search' | 'request'>('search');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [foundVehicle, setFoundVehicle] = useState<any>(null);

  // Message state for inline notifications
  const [message, setMessage] = useState<{
    type: 'error' | 'warning' | 'info' | 'success' | null;
    text: string;
  }>({ type: null, text: '' });

  // Form data
  const [formData, setFormData] = useState({
    name: auth.currentUser?.displayName || '',
    email: auth.currentUser?.email || '',
    phone: '',
    message: ''
  });

  // Cerca veicolo per targa
  const searchVehicle = async () => {
    // Clear previous messages
    setMessage({ type: null, text: '' });

    if (!searchQuery.trim()) {
      setMessage({
        type: 'error',
        text: 'Inserisci la targa del veicolo'
      });
      return;
    }

    setIsLoading(true);

    try {
      const vehicle = await viewRequestService.findVehicleByPlate(searchQuery);

      if (!vehicle) {
        setMessage({
          type: 'error',
          text: 'Veicolo non trovato. Assicurati di aver inserito la targa corretta.'
        });
        setIsLoading(false);
        return;
      }

      // Verifica se proprietario
      if (vehicle.ownerId === auth.currentUser?.uid) {
        setMessage({
          type: 'warning',
          text: 'Questo veicolo è già di tua proprietà. Non puoi richiedere di visualizzarlo.'
        });
        setIsLoading(false);
        return;
      }

      // Verifica se esiste già una richiesta
      const hasExisting = await viewRequestService.hasExistingRequest(
        vehicle.id,
        formData.email
      );

      if (hasExisting) {
        setMessage({
          type: 'warning',
          text: 'Hai già inviato una richiesta per questo veicolo. Non puoi inviare richieste duplicate. Controlla lo stato nella sezione "Mie Richieste".'
        });
        setIsLoading(false);
        return;
      }

      setFoundVehicle(vehicle);
      setStep('request');
      setMessage({ type: null, text: '' });
    } catch (error) {
      console.error('Error searching vehicle:', error);
      setMessage({
        type: 'error',
        text: 'Impossibile cercare il veicolo. Riprova più tardi.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Invia richiesta
  const submitRequest = async () => {
    // Validazione
    if (!formData.name || !formData.email) {
      Alert.alert('Errore', 'Nome ed email sono obbligatori');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      Alert.alert('Errore', 'Inserisci un indirizzo email valido');
      return;
    }

    setIsLoading(true);

    try {
      await viewRequestService.createViewRequest(foundVehicle.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message
      });

      Alert.alert(
        'Richiesta inviata!',
        'La tua richiesta è stata inviata al proprietario. Riceverai una notifica quando verrà approvata.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Errore', 'Impossibile inviare la richiesta. Riprova più tardi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper per renderizzare messaggi
  const renderMessage = () => {
    if (!message.type) return null;

    const messageConfig = {
      error: {
        icon: <XCircle size={20} color={colors.error} />,
        backgroundColor: colors.errorContainer,
        textColor: colors.onErrorContainer,
      },
      warning: {
        icon: <AlertCircle size={20} color="#f59e0b" />,
        backgroundColor: '#fef3c7',
        textColor: '#92400e',
      },
      info: {
        icon: <Info size={20} color={colors.primary} />,
        backgroundColor: colors.primaryContainer,
        textColor: colors.onPrimaryContainer,
      },
      success: {
        icon: <CheckCircle size={20} color="#34C759" />,
        backgroundColor: '#dcfce7',
        textColor: '#166534',
      },
    };

    const config = messageConfig[message.type];

    return (
      <View style={[styles.messageBox, { backgroundColor: config.backgroundColor }]}>
        {config.icon}
        <Text style={[styles.messageText, { color: config.textColor }]}>
          {message.text}
        </Text>
      </View>
    );
  };

  const renderSearchStep = () => (
    <View style={styles.stepContainer}>
      <Card style={[styles.card, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
              <Search size={32} color={colors.primary} />
            </View>
          </View>

          <Text style={[styles.title, { color: colors.onSurface }]}>
            Cerca Veicolo
          </Text>

          <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
            Inserisci la targa del veicolo di cui vuoi visualizzare i dati.
            Il proprietario riceverà la tua richiesta e potrà decidere quali informazioni condividere.
          </Text>

          <View style={styles.searchContainer}>
            <View style={[styles.inputGroup, { borderColor: colors.outline }]}>
              <View style={styles.inputIcon}>
                <Car size={20} color={colors.primary} />
              </View>
              <TextInput
                style={[styles.input, { color: colors.onSurface }]}
                placeholder="Es: AB123CD"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  // Clear message when user starts typing again
                  if (message.type) {
                    setMessage({ type: null, text: '' });
                  }
                }}
                autoCapitalize="characters"
                placeholderTextColor={colors.onSurfaceVariant}
              />
            </View>

            {/* Display inline message */}
            {renderMessage()}

            <Button
              mode="contained"
              onPress={searchVehicle}
              loading={isLoading}
              disabled={isLoading || !searchQuery.trim()}
              style={styles.searchButton}
              buttonColor={colors.primary}
            >
              Cerca Veicolo
            </Button>
          </View>

          <View style={[styles.infoBox, { backgroundColor: colors.primaryContainer }]}>
            <AlertCircle size={16} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.onPrimaryContainer }]}>
              La ricerca è disponibile solo per veicoli registrati nell'app
            </Text>
          </View>
        </Card.Content>
      </Card>
    </View>
  );

  const renderRequestStep = () => (
    <View style={styles.stepContainer}>
      {/* Vehicle Info Card */}
      <Card style={[styles.card, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <View style={styles.vehicleHeader}>
            <View style={[styles.vehicleIconCircle, { backgroundColor: colors.primaryContainer }]}>
              <Car size={24} color={colors.primary} />
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={[styles.vehicleTitle, { color: colors.onSurface }]}>
                {foundVehicle.make} {foundVehicle.model}
              </Text>
              <Text style={[styles.vehicleSubtitle, { color: colors.onSurfaceVariant }]}>
                {foundVehicle.year} • {foundVehicle.licensePlate}
              </Text>
            </View>
            <CheckCircle size={24} color={colors.primary} />
          </View>
        </Card.Content>
      </Card>

      {/* Request Form Card */}
      <Card style={[styles.card, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            I tuoi dati
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.onSurfaceVariant }]}>
            Il proprietario vedrà queste informazioni
          </Text>

          <View style={[styles.inputGroup, { borderColor: colors.outline }]}>
            <View style={styles.inputIcon}>
              <User size={20} color={colors.primary} />
            </View>
            <TextInput
              style={[styles.input, { color: colors.onSurface }]}
              placeholder="Nome e Cognome *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholderTextColor={colors.onSurfaceVariant}
            />
          </View>

          <View style={[styles.inputGroup, { borderColor: colors.outline }]}>
            <View style={styles.inputIcon}>
              <Mail size={20} color={colors.primary} />
            </View>
            <TextInput
              style={[styles.input, { color: colors.onSurface }]}
              placeholder="Email *"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colors.onSurfaceVariant}
            />
          </View>

          <View style={[styles.inputGroup, { borderColor: colors.outline }]}>
            <View style={styles.inputIcon}>
              <Phone size={20} color={colors.primary} />
            </View>
            <TextInput
              style={[styles.input, { color: colors.onSurface }]}
              placeholder="Telefono (opzionale)"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
              placeholderTextColor={colors.onSurfaceVariant}
            />
          </View>

          <Divider style={styles.divider} />

          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Messaggio (opzionale)
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.onSurfaceVariant }]}>
            Spiega perché sei interessato al veicolo
          </Text>

          <View style={[styles.messageInput, { borderColor: colors.outline }]}>
            <MessageSquare size={20} color={colors.primary} style={styles.messageIcon} />
            <TextInput
              style={[styles.messageTextInput, { color: colors.onSurface }]}
              placeholder="Es: Sono interessato all'acquisto di questo veicolo..."
              value={formData.message}
              onChangeText={(text) => setFormData({ ...formData, message: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={colors.onSurfaceVariant}
            />
          </View>

          <View style={[styles.warningBox, { backgroundColor: colors.errorContainer }]}>
            <Eye size={16} color={colors.error} />
            <Text style={[styles.warningText, { color: colors.onErrorContainer }]}>
              Il proprietario deciderà quali dati condividere con te
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={() => {
            setStep('search');
            setFoundVehicle(null);
            setSearchQuery('');
          }}
          style={styles.actionButton}
          textColor={colors.onSurface}
        >
          Indietro
        </Button>

        <Button
          mode="contained"
          onPress={submitRequest}
          loading={isLoading}
          disabled={isLoading || !formData.name || !formData.email}
          style={[styles.actionButton, styles.submitButton]}
          buttonColor={colors.primary}
        >
          Invia Richiesta
        </Button>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
          Richiedi Visualizzazione
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isWeb && isLargeScreen && styles.scrollContentWeb
          ]}
          showsVerticalScrollIndicator={false}
        >
          {step === 'search' ? renderSearchStep() : renderRequestStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  scrollContentWeb: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  stepContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  searchContainer: {
    gap: 16,
    marginBottom: 16,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  searchButton: {
    borderRadius: 12,
    paddingVertical: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 16,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  vehicleSubtitle: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 20,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
    marginBottom: 16,
  },
  messageIcon: {
    marginBottom: 8,
  },
  messageTextInput: {
    fontSize: 15,
    lineHeight: 20,
    minHeight: 80,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
  submitButton: {
    // Additional styles if needed
  },
});

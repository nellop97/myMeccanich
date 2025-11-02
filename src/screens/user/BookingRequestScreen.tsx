// src/screens/user/BookingRequestScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Car, FileText, Clock, AlertCircle, Check, ArrowLeft } from 'lucide-react-native';
import { useStore } from '../../store';
import WorkshopService from '../../services/WorkshopService';
import BookingService from '../../services/BookingService';
import VehicleService from '../../services/VehicleService';
import { Workshop, Vehicle, WorkshopService as WorkshopServiceType } from '../../types/database.types';
import DateTimePicker from '@react-native-community/datetimepicker';

interface BookingRequestScreenProps {
  navigation: any;
  route: any;
}

type Step = 1 | 2 | 3 | 4;

export default function BookingRequestScreen({ navigation, route }: BookingRequestScreenProps) {
  const { darkMode, user } = useStore();
  const { workshopId } = route.params;

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Form data
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [bookingType, setBookingType] = useState<'routine' | 'custom' | 'emergency'>('routine');
  const [selectedService, setSelectedService] = useState<WorkshopServiceType | null>(null);
  const [problemDescription, setProblemDescription] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'medium' | 'high' | 'emergency'>('medium');
  const [preferredDates, setPreferredDates] = useState<Date[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const theme = {
    background: darkMode ? '#111827' : '#f3f4f6',
    cardBackground: darkMode ? '#1f2937' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#9ca3af' : '#6b7280',
    border: darkMode ? '#374151' : '#e5e7eb',
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workshopData, vehiclesData] = await Promise.all([
        WorkshopService.getWorkshop(workshopId),
        VehicleService.getInstance().getUserVehicles(user!.uid),
      ]);

      setWorkshop(workshopData);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      Alert.alert('Errore', 'Impossibile caricare i dati');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedVehicle || !workshop || !user) {
      Alert.alert('Errore', 'Dati mancanti');
      return;
    }

    try {
      setLoading(true);

      const bookingData = {
        userId: user.uid,
        userName: user.displayName || user.email || '',
        userEmail: user.email || '',
        userPhone: user.phoneNumber,
        workshopId: workshop.id,
        workshopName: workshop.name,
        mechanicId: workshop.ownerId,
        vehicleId: selectedVehicle.id,
        vehicleMake: selectedVehicle.make,
        vehicleModel: selectedVehicle.model,
        vehicleYear: selectedVehicle.year,
        vehicleLicensePlate: selectedVehicle.licensePlate,
        currentMileage: selectedVehicle.mileage,
        bookingType,
        serviceId: selectedService?.id,
        serviceName: selectedService?.name || 'Servizio personalizzato',
        serviceCategory: selectedService?.category,
        problemDescription,
        urgencyLevel,
        preferredDates,
      };

      const bookingId = await BookingService.createBookingRequest(bookingData);

      Alert.alert(
        'Richiesta Inviata!',
        'La tua richiesta di prenotazione è stata inviata. Riceverai presto una risposta.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('BookingDetail', { bookingId }),
          },
        ]
      );
    } catch (error) {
      console.error('Errore invio richiesta:', error);
      Alert.alert('Errore', 'Impossibile inviare la richiesta');
    } finally {
      setLoading(false);
    }
  };

  const addPreferredDate = () => {
    if (preferredDates.length >= 3) {
      Alert.alert('Limite raggiunto', 'Puoi selezionare massimo 3 date preferite');
      return;
    }
    setPreferredDates([...preferredDates, tempDate]);
    setShowDatePicker(false);
  };

  const removePreferredDate = (index: number) => {
    setPreferredDates(preferredDates.filter((_, i) => i !== index));
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return selectedVehicle !== null;
      case 2:
        return bookingType === 'custom' || selectedService !== null;
      case 3:
        return problemDescription.trim().length > 10;
      case 4:
        return preferredDates.length > 0;
      default:
        return false;
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              {
                backgroundColor: currentStep >= step ? theme.primary : theme.border,
              },
            ]}
          >
            {currentStep > step ? (
              <Check size={16} color="#fff" />
            ) : (
              <Text style={[styles.stepNumber, { color: currentStep >= step ? '#fff' : theme.textSecondary }]}>
                {step}
              </Text>
            )}
          </View>
          {step < 4 && (
            <View
              style={[
                styles.stepLine,
                {
                  backgroundColor: currentStep > step ? theme.primary : theme.border,
                },
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Car size={32} color={theme.primary} />
        <Text style={[styles.stepTitle, { color: theme.text }]}>Seleziona Veicolo</Text>
        <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
          Scegli il veicolo per cui richiedere l'intervento
        </Text>
      </View>

      {vehicles.map((vehicle) => (
        <TouchableOpacity
          key={vehicle.id}
          style={[
            styles.vehicleCard,
            {
              backgroundColor: theme.cardBackground,
              borderColor: selectedVehicle?.id === vehicle.id ? theme.primary : theme.border,
              borderWidth: selectedVehicle?.id === vehicle.id ? 2 : 1,
            },
          ]}
          onPress={() => setSelectedVehicle(vehicle)}
        >
          <View style={styles.vehicleInfo}>
            <Text style={[styles.vehicleName, { color: theme.text }]}>
              {vehicle.make} {vehicle.model}
            </Text>
            <Text style={[styles.vehicleDetails, { color: theme.textSecondary }]}>
              {vehicle.year} • {vehicle.licensePlate}
            </Text>
            <Text style={[styles.vehicleMileage, { color: theme.textSecondary }]}>
              {vehicle.mileage.toLocaleString()} km
            </Text>
          </View>
          {selectedVehicle?.id === vehicle.id && (
            <View style={[styles.checkmark, { backgroundColor: theme.primary }]}>
              <Check size={20} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      ))}

      {vehicles.length === 0 && (
        <View style={styles.emptyState}>
          <Car size={48} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Nessun veicolo trovato
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
            Aggiungi un veicolo dal tuo profilo per poter prenotare servizi
          </Text>
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <FileText size={32} color={theme.primary} />
        <Text style={[styles.stepTitle, { color: theme.text }]}>Tipo di Servizio</Text>
        <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
          Scegli un servizio di routine o descrivilo tu
        </Text>
      </View>

      {/* Tipo prenotazione */}
      <View style={styles.typeButtons}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            {
              backgroundColor: bookingType === 'routine' ? theme.primary : theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
          onPress={() => setBookingType('routine')}
        >
          <Text style={[styles.typeButtonText, { color: bookingType === 'routine' ? '#fff' : theme.text }]}>
            Servizio Routine
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            {
              backgroundColor: bookingType === 'custom' ? theme.primary : theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
          onPress={() => setBookingType('custom')}
        >
          <Text style={[styles.typeButtonText, { color: bookingType === 'custom' ? '#fff' : theme.text }]}>
            Personalizzato
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            {
              backgroundColor: bookingType === 'emergency' ? theme.error : theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
          onPress={() => setBookingType('emergency')}
        >
          <AlertCircle size={16} color={bookingType === 'emergency' ? '#fff' : theme.text} />
          <Text style={[styles.typeButtonText, { color: bookingType === 'emergency' ? '#fff' : theme.text }]}>
            Urgente
          </Text>
        </TouchableOpacity>
      </View>

      {/* Servizi disponibili */}
      {bookingType === 'routine' && workshop?.services && (
        <View style={styles.servicesContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Servizi Disponibili</Text>
          {workshop.services
            .filter((s) => s.isAvailable)
            .map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.serviceCard,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: selectedService?.id === service.id ? theme.primary : theme.border,
                    borderWidth: selectedService?.id === service.id ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedService(service)}
              >
                <View style={styles.serviceInfo}>
                  <Text style={[styles.serviceName, { color: theme.text }]}>
                    {service.name}
                  </Text>
                  {service.description && (
                    <Text style={[styles.serviceDescription, { color: theme.textSecondary }]}>
                      {service.description}
                    </Text>
                  )}
                  <View style={styles.serviceDetails}>
                    <View style={styles.serviceDetail}>
                      <Clock size={14} color={theme.textSecondary} />
                      <Text style={[styles.serviceDetailText, { color: theme.textSecondary }]}>
                        ~{service.estimatedDuration} min
                      </Text>
                    </View>
                    {service.priceFrom && (
                      <Text style={[styles.servicePrice, { color: theme.success }]}>
                        da €{service.priceFrom}
                      </Text>
                    )}
                  </View>
                </View>
                {selectedService?.id === service.id && (
                  <View style={[styles.checkmark, { backgroundColor: theme.primary }]}>
                    <Check size={20} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
        </View>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <FileText size={32} color={theme.primary} />
        <Text style={[styles.stepTitle, { color: theme.text }]}>Descrivi il Problema</Text>
        <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
          Fornisci più dettagli possibili
        </Text>
      </View>

      <TextInput
        style={[
          styles.textArea,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
            color: theme.text,
          },
        ]}
        placeholder="Descrivi il problema o l'intervento richiesto..."
        placeholderTextColor={theme.textSecondary}
        value={problemDescription}
        onChangeText={setProblemDescription}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Livello di Urgenza</Text>
      <View style={styles.urgencyButtons}>
        {[
          { value: 'low', label: 'Bassa', color: theme.success },
          { value: 'medium', label: 'Media', color: theme.warning },
          { value: 'high', label: 'Alta', color: theme.error },
          { value: 'emergency', label: 'Emergenza', color: '#dc2626' },
        ].map((urgency) => (
          <TouchableOpacity
            key={urgency.value}
            style={[
              styles.urgencyButton,
              {
                backgroundColor: urgencyLevel === urgency.value ? urgency.color : theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
            onPress={() => setUrgencyLevel(urgency.value as any)}
          >
            <Text
              style={[
                styles.urgencyButtonText,
                { color: urgencyLevel === urgency.value ? '#fff' : theme.text },
              ]}
            >
              {urgency.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Calendar size={32} color={theme.primary} />
        <Text style={[styles.stepTitle, { color: theme.text }]}>Date Preferite</Text>
        <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
          Proponi fino a 3 date che ti sono comode
        </Text>
      </View>

      {preferredDates.map((date, index) => (
        <View
          key={index}
          style={[styles.dateCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
        >
          <Text style={[styles.dateText, { color: theme.text }]}>
            {date.toLocaleDateString('it-IT', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          <TouchableOpacity onPress={() => removePreferredDate(index)}>
            <Text style={[styles.removeButton, { color: theme.error }]}>Rimuovi</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.addDateButton, { backgroundColor: theme.primary }]}
        onPress={() => setShowDatePicker(true)}
        disabled={preferredDates.length >= 3}
      >
        <Calendar size={20} color="#fff" />
        <Text style={styles.addDateButtonText}>
          {preferredDates.length === 0 ? 'Aggiungi Data' : `Aggiungi altra data (${preferredDates.length}/3)`}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <View>
          <DateTimePicker
            value={tempDate}
            mode="datetime"
            display="default"
            onChange={(event, selectedDate) => {
              if (Platform.OS === 'android') {
                setShowDatePicker(false);
              }
              if (selectedDate) {
                setTempDate(selectedDate);
                if (Platform.OS === 'android') {
                  addPreferredDate();
                }
              }
            }}
            minimumDate={new Date()}
          />
          {Platform.OS === 'ios' && (
            <View style={styles.datePickerButtons}>
              <TouchableOpacity
                style={[styles.datePickerButton, { backgroundColor: theme.border }]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={[styles.datePickerButtonText, { color: theme.text }]}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.datePickerButton, { backgroundColor: theme.primary }]}
                onPress={addPreferredDate}
              >
                <Text style={[styles.datePickerButtonText, { color: '#fff' }]}>Conferma</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient
        colors={darkMode ? ['#1f2937', '#111827'] : ['#3b82f6', '#2563eb']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Nuova Prenotazione</Text>
            {workshop && (
              <Text style={styles.headerSubtitle}>{workshop.name}</Text>
            )}
          </View>
        </View>
      </LinearGradient>

      {renderStepIndicator()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={[styles.navigationButtons, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: theme.border }]}
            onPress={() => setCurrentStep((currentStep - 1) as Step)}
          >
            <Text style={[styles.navButtonText, { color: theme.text }]}>Indietro</Text>
          </TouchableOpacity>
        )}

        {currentStep < 4 ? (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.navButtonPrimary,
              {
                backgroundColor: canProceedToNextStep() ? theme.primary : theme.border,
              },
            ]}
            onPress={() => setCurrentStep((currentStep + 1) as Step)}
            disabled={!canProceedToNextStep()}
          >
            <Text style={[styles.navButtonText, { color: '#fff' }]}>Avanti</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.navButtonPrimary,
              {
                backgroundColor: canProceedToNextStep() ? theme.success : theme.border,
              },
            ]}
            onPress={handleSubmit}
            disabled={!canProceedToNextStep() || loading}
          >
            <Text style={[styles.navButtonText, { color: '#fff' }]}>
              {loading ? 'Invio...' : 'Invia Richiesta'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e0e7ff',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepLine: {
    width: 40,
    height: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  stepContent: {
    gap: 16,
  },
  stepHeader: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  stepDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  vehicleCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  vehicleMileage: {
    fontSize: 12,
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  servicesContainer: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  serviceCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceDetailText: {
    fontSize: 12,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  textArea: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 150,
  },
  urgencyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  urgencyButton: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  urgencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 14,
    flex: 1,
  },
  removeButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  addDateButton: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addDateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  datePickerButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  datePickerButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  datePickerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  navigationButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  navButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  navButtonPrimary: {},
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

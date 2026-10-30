// src/screens/mechanic/MechanicBookingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Car,
  MessageCircle,
} from 'lucide-react-native';
import { useStore } from '../../store';
import BookingService from '../../services/BookingService';
import WorkshopService from '../../services/WorkshopService';
import { BookingRequest, Workshop } from '../../types/database.types';
import DateTimePicker from '@react-native-community/datetimepicker';

import { mechanicButton, mechanicCard, mechanicStaticColors, useMechanicTheme } from './mechanicTheme';
import { MechanicEmptyState, MechanicLoadingState } from './MechanicStates';
import MechanicHeader from './MechanicHeader';
interface MechanicBookingsScreenProps {
  navigation: any;
}

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'in_progress';

export default function MechanicBookingsScreen({ navigation }: MechanicBookingsScreenProps) {
  const { user } = useStore();
  const theme = useMechanicTheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedBookingForProposal, setSelectedBookingForProposal] = useState<string | null>(null);
  const [proposedDate, setProposedDate] = useState(new Date());


  useEffect(() => {
    loadWorkshop();
  }, [user]);

  useEffect(() => {
    if (workshop) {
      loadBookings();

      // Real-time listener
      const unsubscribe = BookingService.onWorkshopBookingsChange(workshop.id, (updatedBookings) => {
        setBookings(updatedBookings);
      });

      return () => unsubscribe();
    }
  }, [workshop]);

  const loadWorkshop = async () => {
    if (!user?.uid) return;

    try {
      const workshops = await WorkshopService.getWorkshopsByMechanic(user.uid);
      if (workshops.length > 0) {
        setWorkshop(workshops[0]); // Usa la prima officina
      }
    } catch (error) {
      console.error('Errore caricamento officina:', error);
    }
  };

  const loadBookings = async () => {
    if (!workshop) return;

    try {
      setLoading(true);
      const data = await BookingService.getWorkshopBookings(workshop.id);
      setBookings(data);
    } catch (error) {
      console.error('Errore caricamento prenotazioni:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const getFilteredBookings = () => {
    if (filter === 'all') return bookings;
    return bookings.filter((b) => {
      if (filter === 'pending') return ['pending', 'quote_requested', 'quote_sent', 'date_proposed'].includes(b.status);
      if (filter === 'confirmed') return b.status === 'confirmed';
      if (filter === 'in_progress') return b.status === 'in_progress';
      return true;
    });
  };

  const handleProposeDate = (bookingId: string) => {
    setSelectedBookingForProposal(bookingId);
    setProposedDate(new Date());
    setShowDatePicker(true);
  };

  const handleConfirmProposal = async () => {
    if (!selectedBookingForProposal) return;

    try {
      setLoading(true);
      await BookingService.addProposal(selectedBookingForProposal, {
        proposedBy: 'mechanic',
        proposedDate,
        message: 'Ti propongo questa data per l\'appuntamento',
      });

      setShowDatePicker(false);
      setSelectedBookingForProposal(null);
      Alert.alert('Successo', 'Proposta inviata al cliente');
    } catch (error) {
      console.error('Errore invio proposta:', error);
      Alert.alert('Errore', 'Impossibile inviare la proposta');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    Alert.alert(
      'Accetta Prenotazione',
      'Vuoi accettare questa richiesta?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Accetta',
          onPress: async () => {
            try {
              setLoading(true);
              await BookingService.updateBookingStatus(bookingId, 'confirmed');
              Alert.alert('Successo', 'Prenotazione accettata!');
            } catch (error) {
              console.error('Errore:', error);
              Alert.alert('Errore', 'Impossibile accettare la prenotazione');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectBooking = async (bookingId: string) => {
    Alert.prompt(
      'Rifiuta Prenotazione',
      'Indica il motivo (opzionale)',
      async (reason) => {
        try {
          setLoading(true);
          await BookingService.updateBookingStatus(bookingId, 'rejected', {
            mechanicNotes: reason || 'Prenotazione rifiutata',
          });
          Alert.alert('Prenotazione Rifiutata', 'Il cliente verrà notificato.');
        } catch (error) {
          console.error('Errore:', error);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleMarkInProgress = async (bookingId: string) => {
    try {
      setLoading(true);
      await BookingService.updateBookingStatus(bookingId, 'in_progress');
      Alert.alert('Successo', 'Lavori iniziati!');
    } catch (error) {
      console.error('Errore:', error);
      Alert.alert('Errore', 'Impossibile aggiornare lo stato');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async (bookingId: string) => {
    Alert.alert(
      'Completa Lavori',
      'Confermi che i lavori sono stati completati? Il cliente riceverà una notifica.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Completa',
          onPress: async () => {
            try {
              setLoading(true);
              await BookingService.updateBookingStatus(bookingId, 'completed');

              // Invia notifica veicolo pronto
              const booking = await BookingService.getBookingRequest(bookingId);
              if (booking && workshop) {
                await import('../../services/NotificationService').then((module) => {
                  module.default.notifyVehicleReady(
                    {
                      make: booking.vehicleMake,
                      model: booking.vehicleModel,
                      licensePlate: booking.vehicleLicensePlate,
                    },
                    workshop.name,
                    bookingId
                  );
                });
              }

              Alert.alert('Successo', 'Lavori completati! Il cliente è stato notificato.');
            } catch (error) {
              console.error('Errore:', error);
              Alert.alert('Errore', 'Impossibile completare i lavori');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getUnreadCount = (booking: BookingRequest) => {
    if (!user?.uid) return 0;
    return BookingService.getUnreadMessageCount(booking, user.uid);
  };

  const renderBookingCard = (booking: BookingRequest) => {
    const unreadCount = getUnreadCount(booking);
    const isPending = ['pending', 'quote_requested', 'quote_sent', 'date_proposed'].includes(booking.status);
    const isConfirmed = booking.status === 'confirmed';
    const isInProgress = booking.status === 'in_progress';

    return (
      <TouchableOpacity
        key={booking.id}
        style={[styles.bookingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => navigation.navigate('MechanicBookingDetail', { bookingId: booking.id })}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.customerInfo}>
            <User size={20} color={theme.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.customerName, { color: theme.text }]} numberOfLines={1}>
                {booking.userName}
              </Text>
              <Text style={[styles.customerEmail, { color: theme.textSecondary }]} numberOfLines={1}>
                {booking.userEmail}
              </Text>
            </View>
          </View>

          {isPending && (
            <View style={[styles.pendingBadge, { backgroundColor: theme.warning + '20' }]}>
              <AlertCircle size={14} color={theme.warning} />
              <Text style={[styles.badgeText, { color: theme.warning }]}>
                In Attesa
              </Text>
            </View>
          )}
        </View>

        {/* Vehicle Info */}
        <View style={styles.vehicleInfo}>
          <Car size={18} color={theme.textSecondary} />
          <Text style={[styles.vehicleText, { color: theme.text }]}>
            {booking.vehicleMake} {booking.vehicleModel} • {booking.vehicleLicensePlate}
          </Text>
        </View>

        {/* Service */}
        <View style={styles.serviceInfo}>
          <FileText size={16} color={theme.textSecondary} />
          <Text style={[styles.serviceText, { color: theme.text }]}>
            {booking.serviceName}
          </Text>
        </View>

        {/* Problem Description */}
        <Text style={[styles.problemDescription, { color: theme.textSecondary }]} numberOfLines={2}>
          {booking.problemDescription}
        </Text>

        {/* Urgency */}
        {booking.urgencyLevel === 'emergency' && (
          <View style={[styles.urgencyBadge, { backgroundColor: theme.error + '20' }]}>
            <AlertCircle size={14} color={theme.error} />
            <Text style={[styles.urgencyText, { color: theme.error }]}>
              URGENTE
            </Text>
          </View>
        )}

        {/* Unread Messages */}
        {unreadCount > 0 && (
          <View style={styles.messagesIndicator}>
            <MessageCircle size={16} color={theme.primary} />
            <Text style={[styles.messagesText, { color: theme.primary }]}>
              {unreadCount} {unreadCount === 1 ? 'nuovo messaggio' : 'nuovi messaggi'}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {isPending && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.primary }]}
                onPress={() => handleProposeDate(booking.id)}
              >
                <Calendar size={16} color={theme.onPrimary} />
                <Text style={styles.actionButtonText}>Proponi Data</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.success }]}
                onPress={() => navigation.navigate('CreateQuote', { bookingId: booking.id })}
              >
                <FileText size={16} color={theme.onPrimary} />
                <Text style={styles.actionButtonText}>Preventivo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.error }]}
                onPress={() => handleRejectBooking(booking.id)}
              >
                <XCircle size={16} color={theme.onPrimary} />
              </TouchableOpacity>
            </>
          )}

          {isConfirmed && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonFull, { backgroundColor: theme.primary }]}
              onPress={() => handleMarkInProgress(booking.id)}
            >
              <Clock size={16} color={theme.onPrimary} />
              <Text style={styles.actionButtonText}>Inizia Lavori</Text>
            </TouchableOpacity>
          )}

          {isInProgress && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonFull, { backgroundColor: theme.success }]}
              onPress={() => handleMarkCompleted(booking.id)}
            >
              <CheckCircle size={16} color={theme.onPrimary} />
              <Text style={styles.actionButtonText}>Completa Lavori</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Date */}
        {booking.selectedDate && (
          <View style={styles.dateInfo}>
            <Calendar size={14} color={theme.success} />
            <Text style={[styles.dateText, { color: theme.success }]}>
              {new Date(booking.selectedDate).toLocaleDateString('it-IT', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (!workshop) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <MechanicHeader title="Prenotazioni" onBack={() => navigation.goBack()} />
        <MechanicEmptyState
          icon={AlertCircle}
          title="Nessuna officina trovata"
          subtitle="Configura prima la tua officina nelle impostazioni"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <MechanicHeader
        title="Richieste Prenotazione"
        subtitle={workshop.name}
        onBack={() => navigation.goBack()}
      />

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {[
          { value: 'all', label: 'Tutte', count: bookings.length },
          {
            value: 'pending',
            label: 'In Attesa',
            count: bookings.filter((b) => ['pending', 'quote_requested', 'quote_sent', 'date_proposed'].includes(b.status)).length,
          },
          { value: 'confirmed', label: 'Confermate', count: bookings.filter((b) => b.status === 'confirmed').length },
          { value: 'in_progress', label: 'In Corso', count: bookings.filter((b) => b.status === 'in_progress').length },
        ].map((filterOption) => (
          <TouchableOpacity
            key={filterOption.value}
            style={[
              styles.filterButton,
              {
                backgroundColor: filter === filterOption.value ? theme.primary : theme.surface,
                borderColor: theme.border,
              },
            ]}
            onPress={() => setFilter(filterOption.value as FilterStatus)}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === filterOption.value ? theme.onPrimary : theme.text },
              ]}
            >
              {filterOption.label}
            </Text>
            {filterOption.count > 0 && (
              <View
                style={[
                  styles.filterBadge,
                  {
                    backgroundColor: filter === filterOption.value ? theme.onPrimary : theme.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterBadgeText,
                    { color: filter === filterOption.value ? theme.primary : theme.onPrimary },
                  ]}
                >
                  {filterOption.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bookings List */}
      {loading ? (
        <MechanicLoadingState text="Caricamento prenotazioni..." />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
            />
          }
        >
          {getFilteredBookings().length === 0 ? (
            <MechanicEmptyState icon={Calendar} title="Nessuna prenotazione" />
          ) : (
            getFilteredBookings().map(renderBookingCard)
          )}
        </ScrollView>
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <View style={styles.pickerModal}>
          <View style={[styles.pickerContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.pickerTitle, { color: theme.text }]}>
              Proponi una Data
            </Text>

            <DateTimePicker
              value={proposedDate}
              mode="datetime"
              display="default"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setProposedDate(selectedDate);
                }
                if (Platform.OS === 'android') {
                  setShowDatePicker(false);
                  handleConfirmProposal();
                }
              }}
              minimumDate={new Date()}
            />

            {Platform.OS === 'ios' && (
              <View style={styles.pickerActions}>
                <TouchableOpacity
                  style={[styles.pickerButton, { backgroundColor: theme.border }]}
                  onPress={() => {
                    setShowDatePicker(false);
                    setSelectedBookingForProposal(null);
                  }}
                >
                  <Text style={[styles.pickerButtonText, { color: theme.text }]}>
                    Annulla
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pickerButton, { backgroundColor: theme.primary }]}
                  onPress={handleConfirmProposal}
                >
                  <Text style={[styles.pickerButtonText, { color: theme.onPrimary }]}>
                    Invia Proposta
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    maxHeight: 60,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  bookingCard: {
    ...mechanicCard,
    marginBottom: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  customerEmail: {
    fontSize: 14,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vehicleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceText: {
    fontSize: 14,
  },
  problemDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  messagesIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  messagesText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    ...mechanicButton.compact,
    flex: 1,
  },
  actionButtonFull: {
    flex: 1,
  },
  actionButtonText: {
    color: mechanicStaticColors.onPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: mechanicStaticColors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContent: {
    width: '90%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  pickerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  pickerButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// src/screens/mechanic/MechanicBookingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

interface MechanicBookingsScreenProps {
  navigation: any;
}

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'in_progress';

export default function MechanicBookingsScreen({ navigation }: MechanicBookingsScreenProps) {
  const { darkMode, user } = useStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedBookingForProposal, setSelectedBookingForProposal] = useState<string | null>(null);
  const [proposedDate, setProposedDate] = useState(new Date());

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
        style={[styles.bookingCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
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
                <Calendar size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Proponi Data</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.success }]}
                onPress={() => navigation.navigate('CreateQuote', { bookingId: booking.id })}
              >
                <FileText size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Preventivo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.error }]}
                onPress={() => handleRejectBooking(booking.id)}
              >
                <XCircle size={16} color="#fff" />
              </TouchableOpacity>
            </>
          )}

          {isConfirmed && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonFull, { backgroundColor: theme.primary }]}
              onPress={() => handleMarkInProgress(booking.id)}
            >
              <Clock size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Inizia Lavori</Text>
            </TouchableOpacity>
          )}

          {isInProgress && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonFull, { backgroundColor: theme.success }]}
              onPress={() => handleMarkCompleted(booking.id)}
            >
              <CheckCircle size={16} color="#fff" />
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
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={darkMode ? ['#1f2937', '#111827'] : ['#3b82f6', '#2563eb']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Prenotazioni</Text>
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <AlertCircle size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.text }]}>
            Nessuna officina trovata
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
            Configura prima la tua officina nelle impostazioni
          </Text>
        </View>
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
        <Text style={styles.headerTitle}>Richieste Prenotazione</Text>
        <Text style={styles.headerSubtitle}>{workshop.name}</Text>
      </LinearGradient>

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
                backgroundColor: filter === filterOption.value ? theme.primary : theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
            onPress={() => setFilter(filterOption.value as FilterStatus)}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === filterOption.value ? '#fff' : theme.text },
              ]}
            >
              {filterOption.label}
            </Text>
            {filterOption.count > 0 && (
              <View
                style={[
                  styles.filterBadge,
                  {
                    backgroundColor: filter === filterOption.value ? '#fff' : theme.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterBadgeText,
                    { color: filter === filterOption.value ? theme.primary : '#fff' },
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
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
            <View style={styles.emptyContainer}>
              <Calendar size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.text }]}>
                Nessuna prenotazione
              </Text>
            </View>
          ) : (
            getFilteredBookings().map(renderBookingCard)
          )}
        </ScrollView>
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <View style={styles.pickerModal}>
          <View style={[styles.pickerContent, { backgroundColor: theme.cardBackground }]}>
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
                  <Text style={[styles.pickerButtonText, { color: '#fff' }]}>
                    Invia Proposta
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e0e7ff',
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
    borderRadius: 10,
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
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
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
    fontSize: 13,
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
    fontSize: 11,
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
    fontSize: 13,
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
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    flex: 1,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonFull: {
    flex: 1,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 64,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  pickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
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

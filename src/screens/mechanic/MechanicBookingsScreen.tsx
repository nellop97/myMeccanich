// src/screens/mechanic/MechanicBookingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
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
  Wrench,
} from 'lucide-react-native';
import { useStore } from '../../store';
import BookingService, { BOOKING_NOT_PENDING } from '../../services/BookingService';
import WorkshopService from '../../services/WorkshopService';
import InterventionService from '../../services/InterventionService';
import { BookingRequest, Workshop } from '../../types/database.types';
import UniversalDatePicker from '../../components/UniversalDatePicker';

import { mechanicButton, mechanicCard, mechanicStaticColors, useMechanicTheme } from './mechanicTheme';
import { MechanicEmptyState, MechanicLoadingState } from './MechanicStates';
import MechanicHeader from './MechanicHeader';
import { showAlert, showPrompt } from '../../utils/platformHelpers';
interface MechanicBookingsScreenProps {
  navigation: any;
}

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'in_progress';

const formatBookingDate = (date: Date) =>
  date.toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

// Date proposte dal cliente, nell'ordine in cui le ha indicate
const getPreferredDates = (booking: BookingRequest) =>
  (booking.preferredDates ?? []).map((value) => new Date(value));

/**
 * Il meccanico può confermare direttamente solo una richiesta in attesa,
 * senza un preventivo in ballo, scegliendo una data non ancora passata
 */
const canAcceptDirectly = (booking: BookingRequest) =>
  booking.status === 'pending' && !booking.quoteId && !booking.quoteStatus;

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
  const [workshopFailed, setWorkshopFailed] = useState(false);
  const [bookingsFailed, setBookingsFailed] = useState(false);
  const [bookingsReload, setBookingsReload] = useState(0);

  useEffect(() => {
    loadWorkshop();
  }, [user]);

  // Le prenotazioni si attivano dal profilo: al ritorno l'officina va riletta
  useEffect(() => navigation.addListener('focus', loadWorkshop), [navigation, user]);

  useEffect(() => {
    if (workshop) {
      loadBookings();

      // Real-time listener
      const unsubscribe = BookingService.onWorkshopBookingsChange(
        workshop.id,
        workshop.ownerId,
        (updatedBookings) => {
          setBookings(updatedBookings);
          setBookingsFailed(false);
        },
        () => setBookingsFailed(true)
      );

      return () => unsubscribe();
    }
  }, [workshop, bookingsReload]);

  const loadWorkshop = async () => {
    if (!user?.id) return;

    setWorkshopFailed(false);
    try {
      const workshops = await WorkshopService.getWorkshopsByMechanic(user.id);
      if (workshops.length > 0) {
        setWorkshop(workshops[0]); // Usa la prima officina
      }
    } catch (error) {
      console.error('Errore caricamento officina:', error);
      setWorkshopFailed(true);
    }
  };

  const loadBookings = async () => {
    if (!workshop) return;

    try {
      setLoading(true);
      setBookingsFailed(false);
      const data = await BookingService.getWorkshopBookings(workshop.id, workshop.ownerId);
      setBookings(data);
    } catch (error) {
      console.error('Errore caricamento prenotazioni:', error);
      setBookingsFailed(true);
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
      if (filter === 'in_progress') return b.status === 'in_progress' || b.status === 'ready';
      return true;
    });
  };

  const handleProposeDate = (bookingId: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setSelectedBookingForProposal(bookingId);
    setProposedDate(tomorrow);
    setShowDatePicker(true);
  };

  const handleConfirmProposal = async () => {
    if (!selectedBookingForProposal) return;

    if (proposedDate.getTime() <= Date.now()) {
      showAlert('Data non valida', 'Scegli una data e un orario futuri');
      return;
    }

    try {
      setLoading(true);
      await BookingService.addProposal(selectedBookingForProposal, {
        proposedBy: 'mechanic',
        proposedDate,
        message: 'Ti propongo questa data per l\'appuntamento',
      });

      setShowDatePicker(false);
      setSelectedBookingForProposal(null);
      showAlert('Successo', 'Proposta inviata al cliente');
    } catch (error) {
      console.error('Errore invio proposta:', error);
      showAlert('Errore', 'Impossibile inviare la proposta');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId: string, date: Date) => {
    showAlert(
      'Accetta Prenotazione',
      `Confermi l'appuntamento di ${formatBookingDate(date)}?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Accetta',
          onPress: async () => {
            try {
              setLoading(true);
              await BookingService.acceptBooking(bookingId, date);
              showAlert('Prenotazione accettata', 'Trovi l\'intervento nel calendario.');
            } catch (error) {
              console.error('Errore:', error);
              showAlert(
                'Errore',
                error instanceof Error && error.message === BOOKING_NOT_PENDING
                  ? 'Questa richiesta non è più in attesa: il cliente potrebbe averla annullata o potrebbe essere già stata gestita. Controlla lo stato aggiornato nella lista.'
                  : 'Impossibile accettare la prenotazione'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectBooking = async (bookingId: string) => {
    showPrompt(
      'Rifiuta Prenotazione',
      'Indica il motivo (opzionale)',
      async (reason) => {
        try {
          setLoading(true);
          await BookingService.updateBookingStatus(bookingId, 'rejected', {
            mechanicNotes: reason || 'Prenotazione rifiutata',
          });
          showAlert('Prenotazione Rifiutata', 'Il cliente verrà notificato.');
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
      await BookingService.setWorkStatus(bookingId, 'in_progress');
      showAlert('Successo', 'Lavori iniziati!');
    } catch (error) {
      console.error('Errore:', error);
      showAlert('Errore', 'Impossibile aggiornare lo stato');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = (booking: BookingRequest) => {
    if (!booking.interventionCarId || !booking.interventionRepairId) {
      showAlert('Intervento non trovato', 'Apri il Calendario Interventi e riprova.');
      return;
    }
    navigation.navigate('CompleteIntervention', {
      carId: booking.interventionCarId,
      repairId: booking.interventionRepairId,
    });
  };

  const collectBooking = async (booking: BookingRequest, paid: boolean) => {
    try {
      setLoading(true);
      await InterventionService.collect(booking.id, booking.invoiceId, paid);
    } catch (error) {
      console.error('Errore ritiro:', error);
      showAlert('Errore', 'Impossibile registrare il ritiro. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  const handleCollected = (booking: BookingRequest) => {
    showAlert('Ritiro auto', "L'auto è stata ritirata. Il cliente ha pagato?", [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Da pagare', onPress: () => collectBooking(booking, false) },
      { text: 'Pagato', onPress: () => collectBooking(booking, true) },
    ]);
  };

  const getUnreadCount = (booking: BookingRequest) => {
    if (!user?.id) return 0;
    return BookingService.getUnreadMessageCount(booking, user.id);
  };

  const renderBookingCard = (booking: BookingRequest) => {
    const unreadCount = getUnreadCount(booking);
    const isPending = ['pending', 'quote_requested', 'quote_sent', 'date_proposed'].includes(booking.status);
    const isConfirmed = booking.status === 'confirmed';
    const isInProgress = booking.status === 'in_progress';
    const preferredDates = getPreferredDates(booking);
    const acceptable = canAcceptDirectly(booking);
    const now = Date.now();

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

        {/* Date proposte dal cliente */}
        {isPending && preferredDates.length > 0 && (
          <View style={styles.preferredDates}>
            <Text style={[styles.preferredTitle, { color: theme.text }]}>
              {acceptable ? 'Date proposte: scegline una per confermare' : 'Date proposte dal cliente'}
            </Text>
            {preferredDates.map((date) => {
              const isPast = date.getTime() <= now;
              const canPick = acceptable && !isPast;

              return (
                <TouchableOpacity
                  key={date.getTime()}
                  style={[styles.preferredDate, { borderColor: canPick ? theme.primary : theme.border }]}
                  onPress={() => handleAcceptBooking(booking.id, date)}
                  disabled={!canPick}
                  accessibilityRole={canPick ? 'button' : undefined}
                  accessibilityLabel={`${canPick ? 'Conferma' : 'Data proposta'} ${formatBookingDate(date)}`}
                >
                  <Calendar size={16} color={canPick ? theme.primary : theme.textSecondary} />
                  <Text style={[styles.preferredDateText, { color: isPast ? theme.textSecondary : theme.text }]}>
                    {formatBookingDate(date)}
                  </Text>
                  {isPast ? (
                    <Text style={[styles.preferredHint, { color: theme.textSecondary }]}>Passata</Text>
                  ) : canPick ? (
                    <CheckCircle size={18} color={theme.primary} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

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
              onPress={() => handleMarkCompleted(booking)}
            >
              <CheckCircle size={16} color={theme.onPrimary} />
              <Text style={styles.actionButtonText}>Completa Lavori</Text>
            </TouchableOpacity>
          )}

          {booking.status === 'ready' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonFull, { backgroundColor: theme.primary }]}
              onPress={() => handleCollected(booking)}
            >
              <CheckCircle size={16} color={theme.onPrimary} />
              <Text style={styles.actionButtonText}>Segna ritirata</Text>
            </TouchableOpacity>
          )}
        </View>

        {booking.interventionCarId && booking.interventionRepairId && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonFull, styles.interventionButton, { borderColor: theme.border }]}
            onPress={() => navigation.navigate('RepairPartsManagement', {
              carId: booking.interventionCarId,
              repairId: booking.interventionRepairId,
            })}
            accessibilityRole="button"
          >
            <Wrench size={16} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>Apri intervento</Text>
          </TouchableOpacity>
        )}

        {/* Date */}
        {booking.selectedDate && (
          <View style={styles.dateInfo}>
            <Calendar size={14} color={theme.success} />
            <Text style={[styles.dateText, { color: theme.success }]}>
              {formatBookingDate(new Date(booking.selectedDate))}
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
        {workshopFailed ? (
          <MechanicEmptyState
            icon={AlertCircle}
            title="Impossibile caricare l'officina"
            subtitle="Controlla la connessione e riprova"
            actionLabel="Riprova"
            onAction={loadWorkshop}
          />
        ) : (
          <MechanicEmptyState
            icon={AlertCircle}
            title="Prenotazioni non attive"
            subtitle="Attivale dal profilo per comparire nella ricerca e ricevere richieste"
            actionLabel="Apri il profilo"
            onAction={() => navigation.navigate('MechanicProfile')}
          />
        )}
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
          { value: 'in_progress', label: 'In Corso', count: bookings.filter((b) => b.status === 'in_progress' || b.status === 'ready').length },
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
      ) : bookingsFailed ? (
        <MechanicEmptyState
          icon={AlertCircle}
          title="Impossibile caricare le prenotazioni"
          subtitle="Controlla la connessione e riprova"
          actionLabel="Riprova"
          onAction={() => setBookingsReload((current) => current + 1)}
        />
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

            <UniversalDatePicker label="Data e ora" mode="datetime" value={proposedDate} onChange={setProposedDate} minimumDate={new Date()} />

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
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  preferredDates: {
    gap: 8,
    marginTop: 12,
  },
  preferredTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  preferredDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  preferredDateText: {
    flex: 1,
    fontSize: 14,
  },
  preferredHint: {
    fontSize: 12,
  },
  interventionButton: {
    borderWidth: 1,
    marginTop: 8,
  },
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

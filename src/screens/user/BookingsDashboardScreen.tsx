// src/screens/user/BookingsDashboardScreen.tsx
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  MessageCircle,
  Plus,
} from 'lucide-react-native';
import { useStore } from '../../store';
import BookingService from '../../services/BookingService';
import { BookingRequest } from '../../types/database.types';

interface BookingsDashboardScreenProps {
  navigation: any;
}

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed';

export default function BookingsDashboardScreen({ navigation }: BookingsDashboardScreenProps) {
  const { darkMode, user } = useStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');

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
    loadBookings();

    // Real-time listener
    if (user?.uid) {
      const unsubscribe = BookingService.onUserBookingsChange(user.uid, (updatedBookings) => {
        setBookings(updatedBookings);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const loadBookings = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const data = await BookingService.getUserBookings(user.uid);
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
      if (filter === 'completed') return b.status === 'completed';
      return true;
    });
  };

  const getStatusInfo = (status: BookingRequest['status']) => {
    switch (status) {
      case 'pending':
        return { label: 'In Attesa', color: theme.warning, icon: Clock };
      case 'quote_requested':
        return { label: 'Preventivo Richiesto', color: theme.warning, icon: FileText };
      case 'quote_sent':
        return { label: 'Preventivo Ricevuto', color: theme.primary, icon: FileText };
      case 'date_proposed':
        return { label: 'Data Proposta', color: theme.primary, icon: Calendar };
      case 'confirmed':
        return { label: 'Confermata', color: theme.success, icon: CheckCircle };
      case 'in_progress':
        return { label: 'In Corso', color: theme.primary, icon: AlertCircle };
      case 'completed':
        return { label: 'Completata', color: theme.success, icon: CheckCircle };
      case 'cancelled':
        return { label: 'Cancellata', color: theme.error, icon: XCircle };
      case 'rejected':
        return { label: 'Rifiutata', color: theme.error, icon: XCircle };
      default:
        return { label: status, color: theme.textSecondary, icon: Clock };
    }
  };

  const getUnreadCount = (booking: BookingRequest) => {
    if (!user?.uid) return 0;
    return BookingService.getUnreadMessageCount(booking, user.uid);
  };

  const renderBookingCard = (booking: BookingRequest) => {
    const statusInfo = getStatusInfo(booking.status);
    const StatusIcon = statusInfo.icon;
    const unreadCount = getUnreadCount(booking);

    return (
      <TouchableOpacity
        key={booking.id}
        style={[styles.bookingCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
        onPress={() => navigation.navigate('BookingDetail', { bookingId: booking.id })}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.workshopInfo}>
            <Text style={[styles.workshopName, { color: theme.text }]} numberOfLines={1}>
              {booking.workshopName}
            </Text>
            <Text style={[styles.serviceName, { color: theme.textSecondary }]} numberOfLines={1}>
              {booking.serviceName}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <StatusIcon size={14} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.vehicleInfo}>
          <Text style={[styles.vehicleText, { color: theme.text }]}>
            {booking.vehicleMake} {booking.vehicleModel} • {booking.vehicleLicensePlate}
          </Text>
        </View>

        {/* Date Info */}
        {booking.selectedDate && (
          <View style={styles.dateInfo}>
            <Calendar size={16} color={theme.textSecondary} />
            <Text style={[styles.dateText, { color: theme.text }]}>
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

        {/* Quote Info */}
        {booking.quotedPrice && (
          <View style={styles.quoteInfo}>
            <FileText size={16} color={theme.success} />
            <Text style={[styles.quoteText, { color: theme.success }]}>
              Preventivo: €{booking.quotedPrice.toFixed(2)}
            </Text>
          </View>
        )}

        {/* Messages indicator */}
        {unreadCount > 0 && (
          <View style={styles.messagesIndicator}>
            <MessageCircle size={16} color={theme.primary} />
            <Text style={[styles.messagesText, { color: theme.primary }]}>
              {unreadCount} {unreadCount === 1 ? 'nuovo messaggio' : 'nuovi messaggi'}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={[styles.createdAt, { color: theme.textSecondary }]}>
            Creata il {new Date(booking.createdAt).toLocaleDateString('it-IT')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient
        colors={darkMode ? ['#1f2937', '#111827'] : ['#3b82f6', '#2563eb']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Le Mie Prenotazioni</Text>
        <Text style={styles.headerSubtitle}>
          Gestisci tutti i tuoi appuntamenti
        </Text>
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
          { value: 'completed', label: 'Completate', count: bookings.filter((b) => b.status === 'completed').length },
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
                    {
                      color: filter === filterOption.value ? theme.primary : '#fff',
                    },
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
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Caricamento prenotazioni...
          </Text>
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
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                {filter === 'all'
                  ? 'Inizia a prenotare servizi per i tuoi veicoli'
                  : `Nessuna prenotazione ${filter === 'pending' ? 'in attesa' : filter === 'confirmed' ? 'confermata' : filter}`}
              </Text>
            </View>
          ) : (
            getFilteredBookings().map(renderBookingCard)
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('WorkshopSearch')}
      >
        <Plus size={28} color="#fff" />
      </TouchableOpacity>
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
    marginBottom: 12,
  },
  workshopInfo: {
    flex: 1,
    marginRight: 12,
  },
  workshopName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  vehicleInfo: {
    marginBottom: 8,
  },
  vehicleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quoteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  messagesIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.2)',
  },
  messagesText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardFooter: {
    marginTop: 8,
  },
  createdAt: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
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
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      },
    }),
  },
});

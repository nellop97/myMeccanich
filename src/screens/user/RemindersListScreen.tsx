// src/screens/user/RemindersListScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Switch,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Bell,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Car,
  Wrench,
  Shield,
  FileText,
  DollarSign,
  Plus,
  Edit3,
  Trash2,
  Filter,
  X,
  ChevronRight,
  Settings,
  RefreshCw,
} from 'lucide-react-native';
import { FAB, Chip } from 'react-native-paper';
import { useAppThemeManager } from '../../hooks/useTheme';
import { useUserData } from '../../hooks/useUserData';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

interface Reminder {
  id: string;
  vehicleId: string;
  title: string;
  description?: string;
  type: 'maintenance' | 'insurance' | 'tax' | 'inspection' | 'other';
  dueDate: Date;
  dueMileage?: number;
  isActive: boolean;
  isRecurring?: boolean;
  recurringInterval?: number; // in days
  lastNotified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RemindersListScreen = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useAppThemeManager();
  const { vehicles, refreshData } = useUserData();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [overdueReminders, setOverdueReminders] = useState<Reminder[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Carica promemoria da Firebase
  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) return;

      const remindersSnapshot = await firestore()
        .collection('users')
        .doc(userId)
        .collection('reminders')
        .orderBy('dueDate', 'asc')
        .get();

      const loadedReminders = remindersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastNotified: doc.data().lastNotified?.toDate(),
      })) as Reminder[];

      // Separa promemoria scaduti e prossimi
      const now = new Date();
      const overdue = loadedReminders.filter(r => r.isActive && r.dueDate < now);
      const upcoming = loadedReminders.filter(r => r.isActive && r.dueDate >= now);

      setReminders(loadedReminders);
      setOverdueReminders(overdue);
      setUpcomingReminders(upcoming);
    } catch (error) {
      console.error('Errore caricamento promemoria:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReminders();
    await refreshData();
    setRefreshing(false);
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return Wrench;
      case 'insurance': return Shield;
      case 'tax': return FileText;
      case 'inspection': return CheckCircle;
      case 'other': return Bell;
      default: return Bell;
    }
  };

  const getReminderColor = (type: string) => {
    switch (type) {
      case 'maintenance': return '#FF9500';
      case 'insurance': return '#34C759';
      case 'tax': return '#007AFF';
      case 'inspection': return '#5856D6';
      case 'other': return '#8E8E93';
      default: return colors.primary;
    }
  };

  const formatDueDate = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Scaduto da ${Math.abs(diffDays)} giorni`;
    } else if (diffDays === 0) {
      return 'Scade oggi';
    } else if (diffDays === 1) {
      return 'Scade domani';
    } else if (diffDays <= 7) {
      return `Scade tra ${diffDays} giorni`;
    } else if (diffDays <= 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Scade tra ${weeks} settiman${weeks === 1 ? 'a' : 'e'}`;
    } else {
      return date.toLocaleDateString('it-IT');
    }
  };

  const toggleReminderStatus = async (reminderId: string, currentStatus: boolean) => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) return;

      await firestore()
        .collection('users')
        .doc(userId)
        .collection('reminders')
        .doc(reminderId)
        .update({
          isActive: !currentStatus,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      await loadReminders();
    } catch (error) {
      Alert.alert('Errore', 'Impossibile aggiornare il promemoria');
    }
  };

  const deleteReminder = async (reminderId: string, title: string) => {
    Alert.alert(
      'Elimina Promemoria',
      `Sei sicuro di voler eliminare "${title}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = auth().currentUser?.uid;
              if (!userId) return;

              await firestore()
                .collection('users')
                .doc(userId)
                .collection('reminders')
                .doc(reminderId)
                .delete();

              await loadReminders();
              Alert.alert('Successo', 'Promemoria eliminato');
            } catch (error) {
              Alert.alert('Errore', 'Impossibile eliminare il promemoria');
            }
          },
        },
      ]
    );
  };

  const markAsCompleted = async (reminder: Reminder) => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) return;

      if (reminder.isRecurring && reminder.recurringInterval) {
        // Se è ricorrente, sposta la data di scadenza
        const newDueDate = new Date(reminder.dueDate);
        newDueDate.setDate(newDueDate.getDate() + reminder.recurringInterval);

        await firestore()
          .collection('users')
          .doc(userId)
          .collection('reminders')
          .doc(reminder.id)
          .update({
            dueDate: newDueDate,
            lastNotified: new Date(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
          });

        Alert.alert('Successo', `Promemoria spostato al ${newDueDate.toLocaleDateString('it-IT')}`);
      } else {
        // Se non è ricorrente, disattiva
        await firestore()
          .collection('users')
          .doc(userId)
          .collection('reminders')
          .doc(reminder.id)
          .update({
            isActive: false,
            updatedAt: firestore.FieldValue.serverTimestamp(),
          });

        Alert.alert('Successo', 'Promemoria completato');
      }

      await loadReminders();
    } catch (error) {
      Alert.alert('Errore', 'Impossibile completare il promemoria');
    }
  };

  const ReminderCard = ({ reminder, isOverdue }: { reminder: Reminder; isOverdue: boolean }) => {
    const Icon = getReminderIcon(reminder.type);
    const color = getReminderColor(reminder.type);
    const vehicle = vehicles.find(v => v.id === reminder.vehicleId);

    return (
      <TouchableOpacity
        style={[
          styles.reminderCard,
          {
            backgroundColor: colors.surface,
            borderLeftColor: isOverdue ? colors.error : color,
            borderLeftWidth: 4,
          },
        ]}
        onPress={() => markAsCompleted(reminder)}
        activeOpacity={0.7}
      >
        <View style={styles.reminderHeader}>
          <View style={[styles.reminderIcon, { backgroundColor: color + '20' }]}>
            <Icon size={20} color={color} />
          </View>
          <View style={styles.reminderInfo}>
            <Text style={[styles.reminderTitle, { color: colors.onSurface }]}>
              {reminder.title}
            </Text>
            {reminder.description && (
              <Text style={[styles.reminderDescription, { color: colors.onSurfaceVariant }]}>
                {reminder.description}
              </Text>
            )}
            <View style={styles.reminderMeta}>
              <View style={styles.metaItem}>
                <Car size={12} color={colors.onSurfaceVariant} />
                <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Veicolo'}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Calendar size={12} color={isOverdue ? colors.error : colors.onSurfaceVariant} />
                <Text style={[
                  styles.metaText,
                  { color: isOverdue ? colors.error : colors.onSurfaceVariant }
                ]}>
                  {formatDueDate(reminder.dueDate)}
                </Text>
              </View>
              {reminder.dueMileage && (
                <View style={styles.metaItem}>
                  <Settings size={12} color={colors.onSurfaceVariant} />
                  <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                    {reminder.dueMileage.toLocaleString()} km
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.reminderActions}>
          {reminder.isRecurring && (
            <View style={[styles.recurringBadge, { backgroundColor: colors.primaryContainer }]}>
              <RefreshCw size={12} color={colors.onPrimaryContainer} />
            </View>
          )}
          <Switch
            value={reminder.isActive}
            onValueChange={() => toggleReminderStatus(reminder.id, reminder.isActive)}
            trackColor={{ false: colors.surfaceVariant, true: color }}
            thumbColor={reminder.isActive ? color : colors.onSurfaceVariant}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const FilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
              Filtra Promemoria
            </Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <X size={24} color={colors.onSurface} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.filterLabel, { color: colors.onSurface }]}>
            Tipo di promemoria
          </Text>
          <View style={styles.filterOptions}>
            {['all', 'maintenance', 'insurance', 'tax', 'inspection', 'other'].map(type => (
              <Chip
                key={type}
                selected={selectedType === type}
                onPress={() => setSelectedType(type)}
                style={styles.filterChip}
              >
                {type === 'all' ? 'Tutti' : type.charAt(0).toUpperCase() + type.slice(1)}
              </Chip>
            ))}
          </View>

          <Text style={[styles.filterLabel, { color: colors.onSurface }]}>
            Veicolo
          </Text>
          <View style={styles.filterOptions}>
            <Chip
              selected={selectedVehicle === 'all'}
              onPress={() => setSelectedVehicle('all')}
              style={styles.filterChip}
            >
              Tutti i veicoli
            </Chip>
            {vehicles.map(vehicle => (
              <Chip
                key={vehicle.id}
                selected={selectedVehicle === vehicle.id}
                onPress={() => setSelectedVehicle(vehicle.id)}
                style={styles.filterChip}
              >
                {vehicle.make} {vehicle.model}
              </Chip>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowFilterModal(false)}
          >
            <Text style={[styles.applyButtonText, { color: colors.onPrimary }]}>
              Applica Filtri
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Filtra i promemoria
  const filteredOverdue = overdueReminders.filter(r => {
    if (selectedType !== 'all' && r.type !== selectedType) return false;
    if (selectedVehicle !== 'all' && r.vehicleId !== selectedVehicle) return false;
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredUpcoming = upcomingReminders.filter(r => {
    if (selectedType !== 'all' && r.type !== selectedType) return false;
    if (selectedVehicle !== 'all' && r.vehicleId !== selectedVehicle) return false;
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header con ricerca */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.searchBar}>
          <TextInput
            style={[styles.searchInput, { color: colors.onSurface }]}
            placeholder="Cerca promemoria..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity onPress={() => setShowFilterModal(true)}>
            <Filter size={24} color={colors.onSurface} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Promemoria Scaduti */}
        {filteredOverdue.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={20} color={colors.error} />
              <Text style={[styles.sectionTitle, { color: colors.error }]}>
                Scaduti ({filteredOverdue.length})
              </Text>
            </View>
            {filteredOverdue.map(reminder => (
              <ReminderCard key={reminder.id} reminder={reminder} isOverdue={true} />
            ))}
          </View>
        )}

        {/* Prossimi Promemoria */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
              Prossime Scadenze ({filteredUpcoming.length})
            </Text>
          </View>

          {filteredUpcoming.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Bell size={48} color={colors.onSurfaceVariant} />
              <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
                Nessun promemoria attivo
              </Text>
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                Aggiungi promemoria per non dimenticare scadenze importanti
              </Text>
            </View>
          ) : (
            filteredUpcoming.map(reminder => (
              <ReminderCard key={reminder.id} reminder={reminder} isOverdue={false} />
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AddReminder')}
      />

      {/* Filter Modal */}
      <FilterModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  reminderCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  reminderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  reminderDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  reminderMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  recurringBadge: {
    padding: 4,
    borderRadius: 12,
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    marginTop: 16,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    marginBottom: 8,
  },
  applyButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RemindersListScreen;
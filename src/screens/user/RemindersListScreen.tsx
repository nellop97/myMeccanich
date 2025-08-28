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
import { db, auth } from '../../services/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

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
  recurringInterval?: number;
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

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const remindersRef = collection(db, 'users', userId, 'reminders');
      const q = query(remindersRef, orderBy('dueDate', 'asc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const remindersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          dueDate: doc.data().dueDate?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          lastNotified: doc.data().lastNotified?.toDate(),
        })) as Reminder[];

        setReminders(remindersData);
        categorizeReminders(remindersData);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Errore caricamento promemoria:', error);
      Alert.alert('Errore', 'Impossibile caricare i promemoria');
    }
  };

  const categorizeReminders = (reminders: Reminder[]) => {
    const now = new Date();
    const activeReminders = reminders.filter(r => r.isActive);
    
    const overdue = activeReminders.filter(r => r.dueDate < now);
    const upcoming = activeReminders.filter(r => {
      const daysUntilDue = Math.ceil((r.dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
      return daysUntilDue >= 0 && daysUntilDue <= 30;
    });

    setOverdueReminders(overdue);
    setUpcomingReminders(upcoming);
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
      default: return Bell;
    }
  };

  const getReminderColor = (type: string) => {
    switch (type) {
      case 'maintenance': return '#FF9500';
      case 'insurance': return '#34C759';
      case 'tax': return '#007AFF';
      case 'inspection': return '#5856D6';
      default: return '#8E8E93';
    }
  };

  const formatDaysRemaining = (dueDate: Date) => {
    const now = new Date();
    const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (daysRemaining < 0) {
      return `Scaduto ${Math.abs(daysRemaining)} giorn${Math.abs(daysRemaining) === 1 ? 'o' : 'i'} fa`;
    } else if (daysRemaining === 0) {
      return 'Scade oggi';
    } else if (daysRemaining === 1) {
      return 'Scade domani';
    } else {
      return dueDate.toLocaleDateString('it-IT');
    }
  };

  const toggleReminderStatus = async (reminderId: string, currentStatus: boolean) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const reminderRef = doc(db, 'users', userId, 'reminders', reminderId);
      await updateDoc(reminderRef, {
        isActive: !currentStatus,
        updatedAt: serverTimestamp(),
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
              const userId = auth.currentUser?.uid;
              if (!userId) return;

              const reminderRef = doc(db, 'users', userId, 'reminders', reminderId);
              await deleteDoc(reminderRef);

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
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const reminderRef = doc(db, 'users', userId, 'reminders', reminder.id);

      if (reminder.isRecurring && reminder.recurringInterval) {
        const newDueDate = new Date(reminder.dueDate);
        newDueDate.setDate(newDueDate.getDate() + reminder.recurringInterval);

        await updateDoc(reminderRef, {
          dueDate: newDueDate,
          lastNotified: new Date(),
          updatedAt: serverTimestamp(),
        });

        Alert.alert('Successo', `Promemoria spostato al ${newDueDate.toLocaleDateString('it-IT')}`);
      } else {
        await updateDoc(reminderRef, {
          isActive: false,
          updatedAt: serverTimestamp(),
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
                  {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Veicolo'}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Calendar size={12} color={isOverdue ? colors.error : colors.onSurfaceVariant} />
                <Text style={[
                  styles.metaText,
                  { color: isOverdue ? colors.error : colors.onSurfaceVariant }
                ]}>
                  {formatDaysRemaining(reminder.dueDate)}
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
          <View style={styles.reminderActions}>
            <Switch
              value={reminder.isActive}
              onValueChange={() => toggleReminderStatus(reminder.id, reminder.isActive)}
              trackColor={{ false: colors.outline, true: color + '50' }}
              thumbColor={reminder.isActive ? color : colors.onSurfaceVariant}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
            <TouchableOpacity
              onPress={() => deleteReminder(reminder.id, reminder.title)}
              style={styles.deleteButton}
            >
              <Trash2 size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {reminder.isRecurring && (
          <View style={styles.recurringIndicator}>
            <RefreshCw size={14} color={colors.primary} />
            <Text style={[styles.recurringText, { color: colors.primary }]}>
              Ricorrente ogni {Math.round(reminder.recurringInterval! / 30)} mes{reminder.recurringInterval! > 60 ? 'i' : 'e'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const filteredReminders = reminders.filter(reminder => {
    const matchesType = selectedType === 'all' || reminder.type === selectedType;
    const matchesVehicle = selectedVehicle === 'all' || reminder.vehicleId === selectedVehicle;
    const matchesSearch = searchQuery === '' || 
      reminder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesVehicle && matchesSearch;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <X size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
          Promemoria
        </Text>
        <TouchableOpacity onPress={() => setShowFilterModal(true)}>
          <Filter size={24} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      {overdueReminders.length > 0 && (
        <View style={[styles.alertSection, { backgroundColor: colors.errorContainer }]}>
          <View style={styles.alertHeader}>
            <AlertTriangle size={20} color={colors.error} />
            <Text style={[styles.alertTitle, { color: colors.error }]}>
              {overdueReminders.length} Promemoria Scadut{overdueReminders.length === 1 ? 'o' : 'i'}
            </Text>
          </View>
        </View>
      )}

      {upcomingReminders.length > 0 && (
        <View style={[styles.alertSection, { backgroundColor: colors.secondaryContainer }]}>
          <View style={styles.alertHeader}>
            <Clock size={20} color={colors.secondary} />
            <Text style={[styles.alertTitle, { color: colors.secondary }]}>
              {upcomingReminders.length} Promemoria In Scadenza
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.remindersList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredReminders.length > 0 ? (
          <>
            {overdueReminders.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.error }]}>
                  Scaduti
                </Text>
                {overdueReminders.map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} isOverdue={true} />
                ))}
              </View>
            )}

            {upcomingReminders.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.secondary }]}>
                  In Scadenza (30 giorni)
                </Text>
                {upcomingReminders.map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} isOverdue={false} />
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Tutti i Promemoria
              </Text>
              {filteredReminders.map(reminder => (
                <ReminderCard 
                  key={reminder.id} 
                  reminder={reminder} 
                  isOverdue={reminder.dueDate < new Date()} 
                />
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Bell size={64} color={colors.onSurfaceVariant} />
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
              Nessun promemoria
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
              Crea il tuo primo promemoria per non dimenticare scadenze importanti
            </Text>
          </View>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AddReminder')}
      />

      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.filterModal, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                Filtri
              </Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterContent}>
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: colors.onSurface }]}>
                  Cerca
                </Text>
                <TextInput
                  style={[styles.searchInput, { backgroundColor: colors.surfaceVariant, color: colors.onSurfaceVariant }]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Cerca nei promemoria..."
                  placeholderTextColor={colors.onSurfaceVariant}
                />
              </View>

              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: colors.onSurface }]}>
                  Tipo
                </Text>
                <View style={styles.filterOptions}>
                  {['all', 'maintenance', 'insurance', 'tax', 'inspection', 'other'].map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: selectedType === type ? colors.primary : colors.surface,
                          borderColor: colors.outline,
                        }
                      ]}
                      onPress={() => setSelectedType(type)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        { color: selectedType === type ? colors.onPrimary : colors.onSurface }
                      ]}>
                        {type === 'all' ? 'Tutti' :
                         type === 'maintenance' ? 'Manutenzione' :
                         type === 'insurance' ? 'Assicurazione' :
                         type === 'tax' ? 'Bollo' :
                         type === 'inspection' ? 'Revisione' : 'Altro'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: colors.onSurface }]}>
                  Veicolo
                </Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: selectedVehicle === 'all' ? colors.primary : colors.surface,
                        borderColor: colors.outline,
                      }
                    ]}
                    onPress={() => setSelectedVehicle('all')}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { color: selectedVehicle === 'all' ? colors.onPrimary : colors.onSurface }
                    ]}>
                      Tutti
                    </Text>
                  </TouchableOpacity>
                  {vehicles.map(vehicle => (
                    <TouchableOpacity
                      key={vehicle.id}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: selectedVehicle === vehicle.id ? colors.primary : colors.surface,
                          borderColor: colors.outline,
                        }
                      ]}
                      onPress={() => setSelectedVehicle(vehicle.id)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        { color: selectedVehicle === vehicle.id ? colors.onPrimary : colors.onSurface }
                      ]}>
                        {vehicle.brand} {vehicle.model}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.outline }]}
                onPress={() => {
                  setSelectedType('all');
                  setSelectedVehicle('all');
                  setSearchQuery('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.onSurface }]}>
                  Resetta
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.onPrimary }]}>
                  Applica
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  alertSection: {
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  remindersList: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  reminderCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  reminderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reminderDescription: {
    fontSize: 14,
    marginBottom: 8,
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
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 4,
  },
  recurringIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  recurringText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
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
  filterModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  filterContent: {
    flex: 1,
  },
  filterSection: {
    padding: 16,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  searchInput: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RemindersListScreen;
// src/screens/user/RemindersListScreen.tsx
// Schermata lista promemoria con Apple Liquid Glass Design + Responsive + Export Calendario

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
  Modal,
  TextInput,
  Animated,
  Share,
} from 'react-native';
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
  Plus,
  Edit3,
  Trash2,
  Filter,
  X,
  ChevronRight,
  Settings,
  RefreshCw,
  Download,
  Search,
  Gauge,
  SlidersHorizontal,
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAppThemeManager } from '../../hooks/useTheme';
import { useUserData } from '../../hooks/useUserData';
import ReminderService from '../../services/ReminderService';
import { Reminder, ReminderType } from '../../types/database.types';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// ============================================
// GLASS CARD COMPONENT
// ============================================
const GlassCard = ({ children, style, onPress }: any) => {
  const { isDark } = useAppThemeManager();
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  };

  const cardContent = (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      {Platform.OS === 'web' || Platform.OS === 'ios' ? (
        <BlurView
          intensity={Platform.OS === 'web' ? 40 : (isDark ? 30 : 60)}
          tint={isDark ? 'dark' : 'light'}
          style={[
            {
              backgroundColor: isDark
                ? 'rgba(30, 30, 30, 0.7)'
                : 'rgba(255, 255, 255, 0.7)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.05)',
              borderWidth: 1,
              borderRadius: 16,
              overflow: 'hidden',
            },
            style,
          ]}
        >
          {children}
        </BlurView>
      ) : (
        <View
          style={[
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              borderWidth: 1,
              borderRadius: 16,
              overflow: 'hidden',
            },
            style,
          ]}
        >
          {children}
        </View>
      )}
    </Animated.View>
  );

  return onPress ? (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {cardContent}
    </TouchableOpacity>
  ) : (
    cardContent
  );
};

const RemindersListScreen = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useAppThemeManager();
  const { vehicles, refreshData } = useUserData();
  const { width } = useWindowDimensions();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [overdueReminders, setOverdueReminders] = useState<Reminder[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isLargeScreen = width >= 768;
  const isWeb = Platform.OS === 'web';

  // Carica i promemoria
  const loadReminders = useCallback(async () => {
    try {
      setLoading(true);
      const allReminders = await ReminderService.getAllReminders();
      const overdue = await ReminderService.getOverdueReminders();
      const upcoming = await ReminderService.getUpcomingReminders(30);

      setReminders(allReminders);
      setOverdueReminders(overdue);
      setUpcomingReminders(upcoming);
    } catch (error) {
      console.error('Errore caricamento promemoria:', error);
      Alert.alert('Errore', 'Impossibile caricare i promemoria');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [loadReminders])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReminders();
    await refreshData();
    setRefreshing(false);
  };

  // Icone e colori per tipo
  const getReminderIcon = (type: ReminderType) => {
    const icons: Record<ReminderType, any> = {
      maintenance: Wrench,
      insurance: Shield,
      tax: FileText,
      inspection: CheckCircle,
      tire_change: Settings,
      oil_change: Wrench,
      document: FileText,
      custom: Bell,
      other: Bell,
    };
    return icons[type] || Bell;
  };

  const getReminderColor = (type: ReminderType) => {
    const colors: Record<ReminderType, string> = {
      maintenance: '#FF9500',
      insurance: '#34C759',
      tax: '#007AFF',
      inspection: '#5856D6',
      tire_change: '#FF2D55',
      oil_change: '#FF9500',
      document: '#5AC8FA',
      custom: '#8E8E93',
      other: '#8E8E93',
    };
    return colors[type] || '#8E8E93';
  };

  const getReminderTypeLabel = (type: ReminderType) => {
    const labels: Record<ReminderType, string> = {
      maintenance: 'Manutenzione',
      insurance: 'Assicurazione',
      tax: 'Bollo',
      inspection: 'Revisione',
      tire_change: 'Cambio Gomme',
      oil_change: 'Cambio Olio',
      document: 'Documento',
      custom: 'Personalizzato',
      other: 'Altro',
    };
    return labels[type] || 'Promemoria';
  };

  // Formattazione giorni rimanenti
  const formatDaysRemaining = (dueDate: Date) => {
    const now = new Date();
    const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (daysRemaining < 0) {
      return `Scaduto ${Math.abs(daysRemaining)} giorn${Math.abs(daysRemaining) === 1 ? 'o' : 'i'} fa`;
    } else if (daysRemaining === 0) {
      return 'Scade oggi';
    } else if (daysRemaining === 1) {
      return 'Scade domani';
    } else if (daysRemaining <= 7) {
      return `Tra ${daysRemaining} giorni`;
    } else {
      return dueDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  // Toggle stato reminder
  const toggleReminderStatus = async (reminderId: string) => {
    try {
      await ReminderService.toggleReminderStatus(reminderId);
      await loadReminders();
    } catch (error) {
      Alert.alert('Errore', 'Impossibile aggiornare il promemoria');
    }
  };

  // Elimina reminder
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
              await ReminderService.deleteReminder(reminderId);
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

  // Completa reminder
  const completeReminder = async (reminder: Reminder) => {
    try {
      await ReminderService.completeReminder(reminder.id);
      await loadReminders();

      if (reminder.isRecurring) {
        Alert.alert('Successo', `Promemoria spostato alla prossima scadenza`);
      } else {
        Alert.alert('Successo', 'Promemoria completato');
      }
    } catch (error) {
      Alert.alert('Errore', 'Impossibile completare il promemoria');
    }
  };

  // Export calendario
  const exportToCalendar = async (reminder: Reminder) => {
    try {
      const vehicle = vehicles.find(v => v.id === reminder.vehicleId);
      const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : 'Veicolo';

      const icsContent = ReminderService.generateICSFile(reminder, vehicleName);

      if (Platform.OS === 'web') {
        // Web: Download diretto
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `promemoria-${reminder.title.replace(/\s+/g, '-')}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        Alert.alert('Successo', 'File calendario scaricato');
      } else {
        // Mobile: Condivisione
        const fileName = `promemoria-${reminder.title.replace(/\s+/g, '-')}.ics`;
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(fileUri, icsContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/calendar',
            dialogTitle: 'Aggiungi al calendario',
            UTI: 'public.calendar-event',
          });
        } else {
          Alert.alert('Errore', 'Condivisione non disponibile su questo dispositivo');
        }
      }
    } catch (error) {
      console.error('Errore export calendario:', error);
      Alert.alert('Errore', 'Impossibile esportare il promemoria');
    }
  };

  // Filtraggio
  const filteredReminders = reminders.filter(reminder => {
    const matchesType = selectedType === 'all' || reminder.type === selectedType;
    const matchesVehicle = selectedVehicle === 'all' || reminder.vehicleId === selectedVehicle;
    const matchesSearch = searchQuery === '' ||
      reminder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesVehicle && matchesSearch;
  });

  // ============================================
  // RENDER REMINDER CARD
  // ============================================
  const ReminderCard = ({ reminder, isOverdue }: { reminder: Reminder; isOverdue: boolean }) => {
    const Icon = getReminderIcon(reminder.type);
    const color = getReminderColor(reminder.type);
    const vehicle = vehicles.find(v => v.id === reminder.vehicleId);

    return (
      <GlassCard
        onPress={() => (navigation as any).navigate('ReminderDetail', { reminderId: reminder.id })}
        style={[
          styles.reminderCard,
          { borderLeftColor: isOverdue ? '#FF3B30' : color, borderLeftWidth: 4 },
        ]}
      >
        <View style={styles.reminderContent}>
          {/* Icon e titolo */}
          <View style={styles.reminderHeader}>
            <View style={[styles.reminderIcon, { backgroundColor: color + '20' }]}>
              <Icon size={24} color={color} />
            </View>
            <View style={styles.reminderInfo}>
              <Text style={[styles.reminderTitle, { color: colors.onSurface }]}>
                {reminder.title}
              </Text>
              {reminder.description && (
                <Text
                  style={[styles.reminderDescription, { color: colors.onSurfaceVariant }]}
                  numberOfLines={2}
                >
                  {reminder.description}
                </Text>
              )}
            </View>
          </View>

          {/* Metadata */}
          <View style={styles.reminderMeta}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Car size={14} color={colors.onSurfaceVariant} />
                <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Veicolo'}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Calendar size={14} color={isOverdue ? '#FF3B30' : colors.onSurfaceVariant} />
                <Text style={[
                  styles.metaText,
                  { color: isOverdue ? '#FF3B30' : colors.onSurfaceVariant }
                ]}>
                  {formatDaysRemaining(reminder.dueDate)}
                </Text>
              </View>
            </View>

            {(reminder.dueMileage || reminder.cost) && (
              <View style={styles.metaRow}>
                {reminder.dueMileage && (
                  <View style={styles.metaItem}>
                    <Gauge size={14} color={colors.onSurfaceVariant} />
                    <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                      {reminder.dueMileage.toLocaleString()} km
                    </Text>
                  </View>
                )}
                {reminder.cost && (
                  <View style={styles.metaItem}>
                    <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                      €{reminder.cost.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Badge ricorrenza */}
          {reminder.isRecurring && (
            <View style={[styles.recurringBadge, { backgroundColor: color + '20' }]}>
              <RefreshCw size={12} color={color} />
              <Text style={[styles.recurringText, { color: color }]}>
                Ricorrente
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.reminderActions}>
            <TouchableOpacity
              onPress={() => completeReminder(reminder)}
              style={[styles.actionButton, { backgroundColor: colors.primaryContainer }]}
            >
              <CheckCircle size={18} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                Completa
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => exportToCalendar(reminder)}
              style={[styles.actionButton, { backgroundColor: colors.secondaryContainer }]}
            >
              <Download size={18} color={colors.secondary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => (navigation as any).navigate('ReminderDetail', { reminderId: reminder.id })}
              style={[styles.actionButton, { backgroundColor: colors.tertiaryContainer }]}
            >
              <Edit3 size={18} color={colors.tertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => deleteReminder(reminder.id, reminder.title)}
              style={[styles.actionButton, { backgroundColor: colors.errorContainer }]}
            >
              <Trash2 size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>
    );
  };

  // ============================================
  // RENDER MAIN
  // ============================================
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={isDark ? ['#1a1a1a', '#0a0a0a'] : ['#f8f9fa', '#e9ecef']}
          style={styles.gradient}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1a1a1a', '#0a0a0a'] : ['#f8f9fa', '#e9ecef']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={[styles.header, isWeb && styles.headerWeb]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <X size={24} color={colors.onSurface} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
              Promemoria
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setShowFilterModal(true)} style={styles.iconButton}>
              <Filter size={22} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Alert */}
        {overdueReminders.length > 0 && (
          <GlassCard style={[styles.alertCard, { borderLeftColor: '#FF3B30' }]}>
            <View style={styles.alertContent}>
              <AlertTriangle size={24} color="#FF3B30" />
              <View style={styles.alertText}>
                <Text style={[styles.alertTitle, { color: colors.onSurface }]}>
                  {overdueReminders.length} Promemoria Scadut{overdueReminders.length === 1 ? 'o' : 'i'}
                </Text>
                <Text style={[styles.alertSubtitle, { color: colors.onSurfaceVariant }]}>
                  Richiede la tua attenzione
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {upcomingReminders.length > 0 && (
          <GlassCard style={[styles.alertCard, { borderLeftColor: '#FF9500' }]}>
            <View style={styles.alertContent}>
              <Clock size={24} color="#FF9500" />
              <View style={styles.alertText}>
                <Text style={[styles.alertTitle, { color: colors.onSurface }]}>
                  {upcomingReminders.length} In Scadenza
                </Text>
                <Text style={[styles.alertSubtitle, { color: colors.onSurfaceVariant }]}>
                  Nei prossimi 30 giorni
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.contentContainer,
            isWeb && isLargeScreen && styles.contentContainerWeb,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {filteredReminders.length > 0 ? (
            <>
              {/* Scaduti */}
              {overdueReminders.filter(r =>
                (selectedType === 'all' || r.type === selectedType) &&
                (selectedVehicle === 'all' || r.vehicleId === selectedVehicle)
              ).length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: '#FF3B30' }]}>
                    Scaduti
                  </Text>
                  {overdueReminders
                    .filter(r =>
                      (selectedType === 'all' || r.type === selectedType) &&
                      (selectedVehicle === 'all' || r.vehicleId === selectedVehicle)
                    )
                    .map(reminder => (
                      <ReminderCard key={reminder.id} reminder={reminder} isOverdue={true} />
                    ))}
                </View>
              )}

              {/* In scadenza */}
              {upcomingReminders.filter(r =>
                (selectedType === 'all' || r.type === selectedType) &&
                (selectedVehicle === 'all' || r.vehicleId === selectedVehicle)
              ).length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: '#FF9500' }]}>
                    In Scadenza (30 giorni)
                  </Text>
                  {upcomingReminders
                    .filter(r =>
                      (selectedType === 'all' || r.type === selectedType) &&
                      (selectedVehicle === 'all' || r.vehicleId === selectedVehicle)
                    )
                    .map(reminder => (
                      <ReminderCard key={reminder.id} reminder={reminder} isOverdue={false} />
                    ))}
                </View>
              )}

              {/* Tutti */}
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
              <Bell size={64} color={colors.onSurfaceVariant} opacity={0.5} />
              <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
                {searchQuery || selectedType !== 'all' || selectedVehicle !== 'all'
                  ? 'Nessun risultato'
                  : 'Nessun promemoria'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
                {searchQuery || selectedType !== 'all' || selectedVehicle !== 'all'
                  ? 'Prova a modificare i filtri'
                  : 'Crea il tuo primo promemoria per non dimenticare scadenze importanti'}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => (navigation as any).navigate('AddReminder', { vehicleId: vehicles[0]?.id })}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Plus size={28} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Filter Modal */}
        <Modal
          visible={showFilterModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={styles.modalOverlay}>
            <GlassCard style={styles.filterModal}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.outline }]}>
                <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                  Filtri
                </Text>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <X size={24} color={colors.onSurface} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.filterContent}>
                {/* Ricerca */}
                <View style={styles.filterSection}>
                  <Text style={[styles.filterSectionTitle, { color: colors.onSurface }]}>
                    Cerca
                  </Text>
                  <View style={[styles.searchContainer, { backgroundColor: colors.surfaceVariant }]}>
                    <Search size={20} color={colors.onSurfaceVariant} />
                    <TextInput
                      style={[styles.searchInput, { color: colors.onSurface }]}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Cerca nei promemoria..."
                      placeholderTextColor={colors.onSurfaceVariant}
                    />
                  </View>
                </View>

                {/* Tipo */}
                <View style={styles.filterSection}>
                  <Text style={[styles.filterSectionTitle, { color: colors.onSurface }]}>
                    Tipo
                  </Text>
                  <View style={styles.filterOptions}>
                    {['all', 'maintenance', 'insurance', 'tax', 'inspection', 'tire_change', 'oil_change', 'document', 'other'].map(type => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor: selectedType === type ? colors.primary : colors.surfaceVariant,
                            borderColor: selectedType === type ? colors.primary : colors.outline,
                          }
                        ]}
                        onPress={() => setSelectedType(type)}
                      >
                        <Text style={[
                          styles.filterChipText,
                          { color: selectedType === type ? 'white' : colors.onSurfaceVariant }
                        ]}>
                          {type === 'all' ? 'Tutti' : getReminderTypeLabel(type as ReminderType)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Veicolo */}
                <View style={styles.filterSection}>
                  <Text style={[styles.filterSectionTitle, { color: colors.onSurface }]}>
                    Veicolo
                  </Text>
                  <View style={styles.filterOptions}>
                    <TouchableOpacity
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: selectedVehicle === 'all' ? colors.primary : colors.surfaceVariant,
                          borderColor: selectedVehicle === 'all' ? colors.primary : colors.outline,
                        }
                      ]}
                      onPress={() => setSelectedVehicle('all')}
                    >
                      <Text style={[
                        styles.filterChipText,
                        { color: selectedVehicle === 'all' ? 'white' : colors.onSurfaceVariant }
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
                            backgroundColor: selectedVehicle === vehicle.id ? colors.primary : colors.surfaceVariant,
                            borderColor: selectedVehicle === vehicle.id ? colors.primary : colors.outline,
                          }
                        ]}
                        onPress={() => setSelectedVehicle(vehicle.id)}
                      >
                        <Text style={[
                          styles.filterChipText,
                          { color: selectedVehicle === vehicle.id ? 'white' : colors.onSurfaceVariant }
                        ]}>
                          {vehicle.make} {vehicle.model}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.surfaceVariant }]}
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
                  <Text style={[styles.modalButtonText, { color: 'white' }]}>
                    Applica
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerWeb: {
    paddingHorizontal: 32,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  iconButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  alertCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 13,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  contentContainerWeb: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },
  reminderCard: {
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  reminderContent: {
    padding: 16,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reminderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  reminderDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  reminderMeta: {
    gap: 8,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  recurringText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reminderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flex: 1,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 64,
    height: 64,
    borderRadius: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  filterContent: {
    flex: 1,
  },
  filterSection: {
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default RemindersListScreen;

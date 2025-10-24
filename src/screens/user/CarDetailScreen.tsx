// src/screens/user/CarDetailScreen.tsx - REDESIGN COMPLETO
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  Edit,
  Wrench,
  Calendar,
  Plus,
  ChevronRight,
  AlertCircle,
  Clock,
  Shield,
} from 'lucide-react-native';
import { useAppThemeManager } from '../../hooks/useTheme';
import { useUserData } from '../../hooks/useUserData';

export interface RouteParams {
  carId: string;
}

const CarDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { carId } = route.params as RouteParams;
  const { colors, isDark } = useAppThemeManager();
  const {
    vehicles,
    recentMaintenance,
    upcomingReminders,
    refreshData,
    loading,
  } = useUserData();

  const [refreshing, setRefreshing] = useState(false);

  // Get vehicle data
  const vehicle = vehicles.find((v) => v.id === carId);

  // Filter maintenance records for this vehicle
  const maintenanceRecords = recentMaintenance
    .filter((record) => record.vehicleId === carId)
    .slice(0, 10);

  // Filter reminders for this vehicle
  const reminders = upcomingReminders
    .filter((reminder) => reminder.vehicleId === carId)
    .slice(0, 10);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('it-IT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const isOverdue = (dueDate: any) => {
    if (!dueDate) return false;
    const due = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
    return due < new Date();
  };

  if (!vehicle) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: colors.onSurface }]}>
            Veicolo non trovato
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Torna indietro</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? colors.background : '#F8F9FA' },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
        ]}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={colors.onSurface} strokeWidth={2} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
          Dettagli Veicolo
        </Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => (navigation as any).navigate('AddVehicle', { vehicleId: carId })}
        >
          <Edit size={24} color={colors.onSurface} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Vehicle Info Card */}
        <View
          style={[
            styles.vehicleCard,
            { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
          ]}
        >
          <Text style={[styles.vehicleName, { color: colors.onSurface }]}>
            {vehicle.make} {vehicle.model} {vehicle.year}
          </Text>
          <Text style={[styles.vehicleVIN, { color: colors.onSurfaceVariant }]}>
            VIN: {vehicle.vin || '1HGCV2F69JL000000'}
          </Text>
        </View>

        {/* Storico Manutenzioni Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Storico Manutenzioni
            </Text>
            <View style={styles.sectionActions}>
              <TouchableOpacity
                style={[styles.viewAllButton, { marginRight: 8 }]}
                onPress={() =>
                  (navigation as any).navigate('MaintenanceHistory', { carId })
                }
              >
                <Text style={[styles.viewAllText, { color: colors.primary }]}>
                  Vedi tutte
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: `${colors.primary}15` }]}
                onPress={() =>
                  (navigation as any).navigate('AddMaintenance', { carId })
                }
              >
                <Plus size={20} color={colors.primary} strokeWidth={2.5} />
                <Text style={[styles.addButtonText, { color: colors.primary }]}>
                  Aggiungi
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : maintenanceRecords.length === 0 ? (
            <View
              style={[
                styles.emptySection,
                { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
              ]}
            >
              <Wrench size={32} color={colors.onSurfaceVariant} strokeWidth={1.5} />
              <Text
                style={[
                  styles.emptySectionText,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                Nessuna manutenzione registrata
              </Text>
            </View>
          ) : (
            maintenanceRecords.map((record) => (
              <TouchableOpacity
                key={record.id}
                style={[
                  styles.recordCard,
                  { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
                ]}
                onPress={() => {
                  (navigation as any).navigate('MaintenanceDetail', {
                    maintenanceId: record.id,
                    carId
                  });
                }}
              >
                <View style={[styles.recordIcon, { backgroundColor: '#3B82F620' }]}>
                  <Wrench size={20} color="#3B82F6" strokeWidth={2} />
                </View>

                <View style={styles.recordInfo}>
                  <Text style={[styles.recordTitle, { color: colors.onSurface }]}>
                    {record.type}
                  </Text>
                  <Text
                    style={[
                      styles.recordDate,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    {formatDate(record.completedDate)}
                  </Text>
                </View>

                <ChevronRight
                  size={20}
                  color={colors.onSurfaceVariant}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Scadenze e Promemoria Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Scadenze e Promemoria
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: `${colors.primary}15` }]}
              onPress={() =>
                (navigation as any).navigate('AddReminder', { carId })
              }
            >
              <Plus size={20} color={colors.primary} strokeWidth={2.5} />
              <Text style={[styles.addButtonText, { color: colors.primary }]}>
                Aggiungi
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : reminders.length === 0 ? (
            <View
              style={[
                styles.emptySection,
                { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
              ]}
            >
              <Calendar
                size={32}
                color={colors.onSurfaceVariant}
                strokeWidth={1.5}
              />
              <Text
                style={[
                  styles.emptySectionText,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                Nessuna scadenza programmata
              </Text>
            </View>
          ) : (
            reminders.map((reminder) => {
              const overdueStatus = isOverdue(reminder.dueDate);
              const iconColor = overdueStatus ? '#EF4444' : '#F59E0B';
              const backgroundColor = overdueStatus ? '#FEE2E2' : '#FEF3C7';
              
              const IconComponent = 
                reminder.type === 'maintenance' ? Wrench :
                reminder.type === 'insurance' ? Shield :
                reminder.type === 'inspection' ? AlertCircle :
                Calendar;

              return (
                <TouchableOpacity
                  key={reminder.id}
                  style={[
                    styles.recordCard,
                    overdueStatus && styles.overdueCard,
                    { 
                      backgroundColor: overdueStatus 
                        ? backgroundColor 
                        : (isDark ? colors.surface : '#FFFFFF') 
                    },
                  ]}
                  onPress={() => {
                    // Navigate to reminder detail
                  }}
                >
                  <View style={[styles.recordIcon, { backgroundColor: `${iconColor}20` }]}>
                    <IconComponent size={20} color={iconColor} strokeWidth={2} />
                  </View>

                  <View style={styles.recordInfo}>
                    <Text
                      style={[
                        styles.recordTitle,
                        { color: overdueStatus ? '#991B1B' : colors.onSurface },
                      ]}
                    >
                      {reminder.title}
                    </Text>
                    <Text
                      style={[
                        styles.recordDate,
                        {
                          color: overdueStatus
                            ? '#DC2626'
                            : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      Scadenza: {formatDate(reminder.dueDate)}
                    </Text>
                  </View>

                  <ChevronRight
                    size={20}
                    color={overdueStatus ? '#DC2626' : colors.onSurfaceVariant}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  scrollContent: {
    padding: 20,
  },

  // Vehicle Card
  vehicleCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  vehicleVIN: {
    fontSize: 14,
    letterSpacing: 0.2,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Loading & Empty States
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptySection: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptySectionText: {
    fontSize: 14,
  },

  // Record Card
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      },
    }),
  },
  overdueCard: {
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 13,
  },
});

export default CarDetailScreen;

// src/screens/user/HomeScreen.tsx - VERSIONE CORRETTA
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  RefreshControl,
  Alert,
  ActivityIndicator
} from 'react-native';
import {
  Car,
  Settings,
  Plus,
  AlertCircle,
  Wrench,
  Fuel,
  DollarSign,
  FileText,
  Bell,
  Calendar,
  TrendingUp,
  Shield
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

// 🔒 USA GLI HOOK ESISTENTI E CORRETTI
import { useAuth } from '../../hooks/useAuth';
import { useUser } from '../../hooks/useAuthSync';
import { useUserData } from '../../hooks/useUserData';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  
  // 🔒 USA GLI HOOK CORRETTI
  const { logout, loading: authLoading } = useAuth();
  const { user, authUser, loading: userLoading, isAuthenticated, displayName } = useUser();
  
  // 📊 USA IL NUOVO HOOK PER I DATI UTENTE
  const {
    vehicles,
    recentMaintenance,
    upcomingReminders,
    loading: dataLoading,
    error,
    refreshData,
    stats,
    hasVehicles,
    hasReminders,
    hasOverdueReminders
  } = useUserData();

  const [refreshing, setRefreshing] = useState(false);

  // Combina tutti gli stati di loading
  const loading = authLoading || userLoading || dataLoading;

  // 🐛 DEBUG LOGS - Stati di autenticazione
  useEffect(() => {
    console.log('🔍 [HomeScreen] Hook States Debug:');
    console.log('  - authLoading:', authLoading);
    console.log('  - userLoading:', userLoading);
    console.log('  - dataLoading:', dataLoading);
    console.log('  - isAuthenticated:', isAuthenticated);
    console.log('  - user:', user ? 'EXISTS' : 'NULL');
    console.log('  - authUser:', authUser ? 'EXISTS' : 'NULL');
    console.log('  - displayName:', displayName);
    if (authUser) {
      console.log('  - authUser.uid:', authUser.uid);
      console.log('  - authUser.email:', authUser.email);
      console.log('  - authUser.userType:', authUser.userType);
    }
  }, [authLoading, userLoading, dataLoading, isAuthenticated, user, authUser, displayName]);

  // 🐛 DEBUG LOGS - Dati Firebase
  useEffect(() => {
    console.log('📊 [HomeScreen] Firebase Data Debug:');
    console.log('  - vehicles.length:', vehicles.length);
    console.log('  - vehicles data:', vehicles);
    console.log('  - recentMaintenance.length:', recentMaintenance.length);
    console.log('  - recentMaintenance data:', recentMaintenance);
    console.log('  - upcomingReminders.length:', upcomingReminders.length);
    console.log('  - upcomingReminders data:', upcomingReminders);
    console.log('  - error:', error);
  }, [vehicles, recentMaintenance, upcomingReminders, error]);

  // 🐛 DEBUG LOGS - Statistiche
  useEffect(() => {
    console.log('📈 [HomeScreen] Stats Debug:');
    console.log('  - stats:', stats);
    console.log('  - hasVehicles:', hasVehicles);
    console.log('  - hasReminders:', hasReminders);
    console.log('  - hasOverdueReminders:', hasOverdueReminders);
  }, [stats, hasVehicles, hasReminders, hasOverdueReminders]);

  // Theme
  const theme = {
    background: '#f3f4f6',
    cardBackground: '#ffffff',
    text: '#000000',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    accent: '#2563eb',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  };

  // 🔄 Refresh dei dati
  const onRefresh = useCallback(async () => {
    console.log('🔄 [HomeScreen] onRefresh - INIZIATO');
    setRefreshing(true);
    
    try {
      await refreshData();
      console.log('✅ [HomeScreen] onRefresh - COMPLETATO con successo');
    } catch (error) {
      console.error('❌ [HomeScreen] onRefresh - ERRORE:', error);
    } finally {
      setRefreshing(false);
      console.log('🏁 [HomeScreen] onRefresh - refreshing = false');
    }
  }, [refreshData]);

  // 🚪 Gestione logout
  const handleLogout = useCallback(async () => {
    console.log('🚪 [HomeScreen] handleLogout - Richiesta logout');
    
    Alert.alert(
      'Conferma Logout',
      'Sei sicuro di voler uscire?',
      [
        { 
          text: 'Annulla', 
          style: 'cancel',
          onPress: () => console.log('❌ [HomeScreen] Logout annullato dall\'utente')
        },
        {
          text: 'Esci',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔄 [HomeScreen] Eseguendo logout...');
              await logout();
              console.log('✅ [HomeScreen] Logout completato con successo');
            } catch (error) {
              console.error('❌ [HomeScreen] Errore durante logout:', error);
              Alert.alert('Errore', 'Errore durante il logout');
            }
          }
        }
      ]
    );
  }, [logout]);

  // 🧭 Navigazione
  const handleNavigation = useCallback((screenName: string, params?: any) => {
    console.log(`🧭 [HomeScreen] Navigazione verso: ${screenName}`, params ? `con parametri: ${JSON.stringify(params)}` : 'senza parametri');
    navigation.navigate(screenName as any, params);
  }, [navigation]);

  // 🔒 Controllo autenticazione
  if (!isAuthenticated) {
    console.log('🚫 [HomeScreen] RENDER: Non autenticato - mostrando messaggio di errore');
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <AlertCircle width={48} height={48} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.text }]}>
            Non autenticato
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // 📱 Loading state
  if (loading) {
    console.log('⏳ [HomeScreen] RENDER: Loading state attivo');
    console.log('  - authLoading:', authLoading);
    console.log('  - userLoading:', userLoading);
    console.log('  - dataLoading:', dataLoading);
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Caricamento...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ❌ Error state
  if (error) {
    console.log('❌ [HomeScreen] RENDER: Error state attivo:', error);
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <AlertCircle width={48} height={48} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.text }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.accent }]}
            onPress={onRefresh}
          >
            <Text style={styles.retryButtonText}>Riprova</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 🏠 INTERFACCIA PRINCIPALE
  console.log('🏠 [HomeScreen] RENDER: Interfaccia principale');
  console.log('  - displayName per header:', displayName);
  console.log('  - refreshing state:', refreshing);
  console.log('  - Veicoli da mostrare:', vehicles.length);
  console.log('  - Promemoria da mostrare:', upcomingReminders.length);
  console.log('  - Manutenzioni da mostrare:', recentMaintenance.length);
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
          />
        }
      >
        {/* 👋 Header con saluto */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              Ciao,
            </Text>
            <Text style={[styles.username, { color: theme.text }]}>
              {displayName}
            </Text>
            {authUser?.userType && (
              <Text style={[styles.userType, { color: theme.textSecondary }]}>
                {authUser.userType === 'mechanic' ? '🔧 Meccanico' : '🚗 Proprietario'}
              </Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => handleNavigation('Settings')}
          >
            <Settings width={24} height={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* 📊 Statistiche rapide */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Car width={24} height={24} color={theme.accent} />
            <Text style={[styles.statNumber, { color: theme.text }]}>{stats.vehiclesCount}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Veicoli</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Wrench width={24} height={24} color={theme.success} />
            <Text style={[styles.statNumber, { color: theme.text }]}>{stats.maintenanceCount}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Interventi</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Bell width={24} height={24} color={hasOverdueReminders ? theme.error : theme.warning} />
            <Text style={[styles.statNumber, { color: theme.text }]}>{stats.remindersCount}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Promemoria</Text>
          </View>
        </View>

        {/* 🚗 Sezione Veicoli */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>I tuoi Veicoli</Text>
            <TouchableOpacity onPress={() => handleNavigation('AddCar')}>
              <Plus width={24} height={24} color={theme.accent} />
            </TouchableOpacity>
          </View>

          {!hasVehicles ? (
            <View style={[styles.emptyState, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <Car width={48} height={48} color={theme.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
                Nessun veicolo registrato
              </Text>
              <Text style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}>
                Aggiungi il tuo primo veicolo per iniziare a tracciare manutenzioni e spese
              </Text>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.accent }]}
                onPress={() => handleNavigation('AddCar')}
              >
                <Text style={styles.addButtonText}>Aggiungi Veicolo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {console.log('🚗 [HomeScreen] Rendering veicoli:', vehicles.map(v => `${v.make} ${v.model} (${v.year})`))}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {vehicles.map((vehicle) => {
                  console.log(`🚗 [HomeScreen] Rendering singolo veicolo:`, {
                    id: vehicle.id,
                    make: vehicle.make,
                    model: vehicle.model,
                    year: vehicle.year,
                    licensePlate: vehicle.licensePlate,
                    currentMileage: vehicle.currentMileage
                  });
                  
                  return (
                    <TouchableOpacity
                      key={vehicle.id}
                      style={[styles.carCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                      onPress={() => handleNavigation('CarDetail', { carId: vehicle.id })}
                    >
                      <Car width={32} height={32} color={theme.accent} />
                      <Text style={[styles.carMake, { color: theme.text }]}>
                        {vehicle.make} {vehicle.model}
                      </Text>
                      <Text style={[styles.carYear, { color: theme.textSecondary }]}>
                        {vehicle.year}
                      </Text>
                      <Text style={[styles.carPlate, { color: theme.textSecondary }]}>
                        {vehicle.licensePlate}
                      </Text>
                      <Text style={[styles.carMileage, { color: theme.textSecondary }]}>
                        {vehicle.currentMileage?.toLocaleString() || '0'} km
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}
        </View>

        {/* ⚡ Azioni rapide */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Azioni Rapide</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              onPress={() => handleNavigation('AddMaintenance')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: theme.success + '20' }]}>
                <Wrench width={24} height={24} color={theme.success} />
              </View>
              <Text style={[styles.quickActionTitle, { color: theme.text }]}>
                Nuova Manutenzione
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              onPress={() => handleNavigation('AddExpense')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: theme.warning + '20' }]}>
                <DollarSign width={24} height={24} color={theme.warning} />
              </View>
              <Text style={[styles.quickActionTitle, { color: theme.text }]}>
                Aggiungi Spesa
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              onPress={() => handleNavigation('Documents')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: theme.accent + '20' }]}>
                <FileText width={24} height={24} color={theme.accent} />
              </View>
              <Text style={[styles.quickActionTitle, { color: theme.text }]}>
                Documenti
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              onPress={() => handleNavigation('Reminders')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: theme.error + '20' }]}>
                <Bell width={24} height={24} color={theme.error} />
              </View>
              <Text style={[styles.quickActionTitle, { color: theme.text }]}>
                Promemoria
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ⏰ Promemoria imminenti */}
        {upcomingReminders.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Promemoria Imminenti</Text>
            {console.log('⏰ [HomeScreen] Rendering promemoria:', upcomingReminders.map(r => `${r.title} - ${r.status}`))}
            {upcomingReminders.slice(0, 3).map((reminder) => {
              console.log(`⏰ [HomeScreen] Rendering singolo promemoria:`, {
                id: reminder.id,
                title: reminder.title,
                description: reminder.description,
                status: reminder.status,
                dueDate: reminder.dueDate
              });
              
              return (
                <View
                  key={reminder.id}
                  style={[styles.reminderCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                >
                  <View style={styles.reminderIcon}>
                    <Bell width={20} height={20} color={theme.warning} />
                  </View>
                  <View style={styles.reminderContent}>
                    <Text style={[styles.reminderTitle, { color: theme.text }]}>
                      {reminder.title}
                    </Text>
                    <Text style={[styles.reminderDescription, { color: theme.textSecondary }]}>
                      {reminder.description}
                    </Text>
                    <Text style={[styles.reminderDate, { color: theme.warning }]}>
                      Scadenza: {reminder.dueDate?.toDate?.()?.toLocaleDateString('it-IT') || 'N/A'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* 🔧 Manutenzioni recenti */}
        {recentMaintenance.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Manutenzioni Recenti</Text>
            {console.log('🔧 [HomeScreen] Rendering manutenzioni:', recentMaintenance.map(m => `${m.type} - €${m.cost}`))}
            {recentMaintenance.slice(0, 3).map((maintenance) => {
              const vehicle = vehicles.find(v => v.id === maintenance.vehicleId);
              console.log(`🔧 [HomeScreen] Rendering singola manutenzione:`, {
                id: maintenance.id,
                type: maintenance.type,
                vehicleId: maintenance.vehicleId,
                vehicleFound: vehicle ? `${vehicle.make} ${vehicle.model}` : 'NOT FOUND',
                cost: maintenance.cost,
                completedDate: maintenance.completedDate
              });
              
              return (
                <View
                  key={maintenance.id}
                  style={[styles.maintenanceCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                >
                  <View style={styles.maintenanceIcon}>
                    <Wrench width={20} height={20} color={theme.success} />
                  </View>
                  <View style={styles.maintenanceContent}>
                    <Text style={[styles.maintenanceType, { color: theme.text }]}>
                      {maintenance.type}
                    </Text>
                    <Text style={[styles.maintenanceVehicle, { color: theme.textSecondary }]}>
                      {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Veicolo non trovato'}
                    </Text>
                    <Text style={[styles.maintenanceDate, { color: theme.textSecondary }]}>
                      {maintenance.completedDate?.toDate?.()?.toLocaleDateString('it-IT') || 'N/A'}
                    </Text>
                  </View>
                  <Text style={[styles.maintenanceCost, { color: theme.success }]}>
                    €{maintenance.cost?.toFixed(2) || '0.00'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* 🚪 Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: theme.error }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutButtonText, { color: theme.error }]}>
            Esci dall'App
          </Text>
        </TouchableOpacity>

        {/* Spazio finale per scroll */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 16,
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  userType: {
    fontSize: 14,
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  carCard: {
    width: 160,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 20,
    marginRight: 4,
  },
  carMake: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  carYear: {
    fontSize: 14,
    marginTop: 4,
  },
  carPlate: {
    fontSize: 12,
    marginTop: 2,
  },
  carMileage: {
    fontSize: 12,
    marginTop: 2,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  reminderCard: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  reminderIcon: {
    marginRight: 12,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reminderDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  reminderDate: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  maintenanceCard: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  maintenanceIcon: {
    marginRight: 12,
  },
  maintenanceContent: {
    flex: 1,
  },
  maintenanceType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  maintenanceVehicle: {
    fontSize: 14,
    marginTop: 2,
  },
  maintenanceDate: {
    fontSize: 12,
    marginTop: 2,
  },
  maintenanceCost: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 32,
    marginHorizontal: 20,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HomeScreen;
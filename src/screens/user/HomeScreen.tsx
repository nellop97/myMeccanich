// src/screens/user/HomeScreen.tsx - VERSIONE AGGIORNATA CON TUTTI I COLLEGAMENTI
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  StatusBar,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Surface,
  FAB,
  Chip,
  IconButton,
  Divider,
} from 'react-native-paper';
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
  Shield,
  Clock,
  MapPin,
  ChevronRight,
  Activity,
  Zap,
  User,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Importa il nuovo sistema di temi
import { useAppThemeManager, useThemedStyles } from '../../hooks/useTheme';

// USA SOLO FIREBASE AUTH E USERDATA
import { useAuth } from '../../hooks/useAuth';
import { useUserData } from '../../hooks/useUserData';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Sistema di temi
  const { colors, isDark, toggleTheme } = useAppThemeManager();
  const { dynamicStyles } = useThemedStyles();

  // Hooks per dati reali
  const { user, logout, loading: authLoading } = useAuth();
  const { 
    vehicles,
    recentMaintenance, 
    upcomingReminders, 
    recentFuelRecords, 
    recentExpenses,
    loading: dataLoading, 
    error: dataError,
    refreshData,
    stats,
    hasVehicles,
    hasReminders,
    hasOverdueReminders
  } = useUserData();

  const [refreshing, setRefreshing] = useState(false);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const onChange = (result: any) => {
      setScreenData(result.window);
    };
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  // Calcolo responsive
  const isTablet = screenData.width >= 768;
  const isDesktop = screenData.width >= 1024;

  // Funzione per formattare la valuta
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Refresh dei dati
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Errore refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  // Gestione logout
  const handleLogout = useCallback(async () => {
    Alert.alert(
      'Conferma Logout',
      'Sei sicuro di voler uscire?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Esci',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Errore', 'Errore durante il logout');
            }
          }
        }
      ]
    );
  }, [logout]);

  // NAVIGAZIONE AGGIORNATA CON TUTTI I COLLEGAMENTI
  const handleNavigation = useCallback((screenName: string, params?: any) => {
    try {
      navigation.navigate(screenName as never, params as never);
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Errore', 'Errore di navigazione');
    }
  }, [navigation]);

  // Quick Actions con navigazione corretta
  const quickActions = [
    {
      id: 'vehicles',
      icon: Car,
      label: 'I Miei Veicoli',
      color: colors.primary,
      onPress: () => handleNavigation('VehicleList'),
    },
    {
      id: 'add_vehicle',
      icon: Plus,
      label: 'Aggiungi Auto',
      color: colors.success,
      onPress: () => handleNavigation('AddVehicle'),
    },
    {
      id: 'maintenance',
      icon: Wrench,
      label: 'Manutenzioni',
      color: colors.info,
      onPress: () => {
        if (vehicles.length === 1) {
          handleNavigation('CarMaintenance', { carId: vehicles[0].id });
        } else if (vehicles.length > 1) {
          handleNavigation('MaintenanceList');
        } else {
          Alert.alert('Attenzione', 'Aggiungi prima un veicolo');
        }
      },
    },
    {
      id: 'fuel',
      icon: Fuel,
      label: 'Carburante',
      color: colors.warning,
      onPress: () => {
        if (vehicles.length > 0) {
          handleNavigation('FuelTracking', { carId: vehicles[0]?.id });
        } else {
          Alert.alert('Attenzione', 'Aggiungi prima un veicolo');
        }
      },
    },
    {
      id: 'expenses',
      icon: DollarSign,
      label: 'Spese',
      color: colors.error,
      onPress: () => handleNavigation('ExpenseTracker'),
    },
    {
      id: 'reminders',
      icon: Bell,
      label: 'Promemoria',
      color: colors.secondary,
      onPress: () => handleNavigation('RemindersList'),
    },
    {
      id: 'documents',
      icon: FileText,
      label: 'Documenti',
      color: colors.tertiary,
      onPress: () => {
        if (vehicles.length > 0) {
          handleNavigation('DocumentsList', { carId: vehicles[0]?.id });
        } else {
          Alert.alert('Attenzione', 'Aggiungi prima un veicolo');
        }
      },
    },
    {
      id: 'profile',
      icon: User,
      label: 'Profilo',
      color: colors.onSurfaceVariant,
      onPress: () => handleNavigation('Profile', { userId: user?.uid }),
    },
  ];

  // Loading state
  if (!user || dataLoading || authLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: colors.background 
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ 
          marginTop: 16, 
          color: colors.onBackground,
          fontSize: 16 
        }}>
          Caricamento dati...
        </Text>
      </View>
    );
  }

  // Costruisci il nome utente
  const userName = user?.displayName || 
                  `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
                  user?.email?.split('@')[0] ||
                  'Utente';

  // Dati statistiche
  const userStats = {
    totalCars: stats.vehiclesCount,
    totalMaintenance: stats.maintenanceCount,
    totalExpenses: stats.totalExpenses + stats.totalFuelCost,
    upcomingMaintenance: stats.remindersCount,
  };

  // Componente StatCard
  const StatCard = ({ icon: Icon, number, label, color }: any) => (
    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.statIcon, { backgroundColor: colors.primaryContainer }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={[styles.statNumber, { color: colors.onSurface }]}>{number}</Text>
      <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
    </View>
  );

  // Componente QuickActionCard
  const QuickActionCard = ({ icon: Icon, label, onPress, color = colors.primary }: any) => (
    <TouchableOpacity 
      style={[styles.quickActionCard, { backgroundColor: colors.surface }]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={styles.quickActionIcon}>
        <Icon size={24} color={color} />
      </View>
      <Text style={[styles.quickActionLabel, { color: colors.onSurface }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header Gradient */}
      <LinearGradient
        colors={isDark ? ['#1e3a8a', '#1e293b'] : ['#3b82f6', '#60a5fa']}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={[styles.header, { paddingTop: insets.top }]}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerGreeting}>Ciao, {userName}! 👋</Text>
                <Text style={styles.headerSubtitle}>
                  {hasOverdueReminders 
                    ? '⚠️ Hai scadenze da controllare'
                    : 'Tutto sotto controllo'}
                </Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.notificationButton} 
                  onPress={() => handleNavigation('RemindersList')}
                >
                  <Bell size={24} color="#fff" />
                  {stats.overdueReminders > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationCount}>
                        {stats.overdueReminders}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.themeToggle} 
                  onPress={toggleTheme}
                >
                  {isDark ? 
                    <Sun size={24} color="#fff" /> : 
                    <Moon size={24} color="#fff" />
                  }
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.themeToggle} 
                  onPress={handleLogout}
                >
                  <LogOut size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
            Panoramica
          </Text>
          <View style={styles.statsGrid}>
            <StatCard 
              icon={Car} 
              number={userStats.totalCars} 
              label="Veicoli" 
              color={colors.primary}
            />
            <StatCard 
              icon={Wrench} 
              number={userStats.totalMaintenance} 
              label="Manutenzioni" 
              color={colors.info}
            />
            <StatCard 
              icon={DollarSign} 
              number={formatCurrency(userStats.totalExpenses)} 
              label="Spese Totali" 
              color={colors.error}
            />
            <StatCard 
              icon={Bell} 
              number={userStats.upcomingMaintenance} 
              label="Promemoria" 
              color={colors.warning}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
            Azioni Rapide
          </Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <QuickActionCard
                key={action.id}
                icon={action.icon}
                label={action.label}
                onPress={action.onPress}
                color={action.color}
              />
            ))}
          </View>
        </View>

        {/* Recent Activities */}
        {(recentMaintenance.length > 0 || recentFuelRecords.length > 0) && (
          <View style={styles.recentSection}>
            <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
              Attività Recenti
            </Text>

            {recentMaintenance.slice(0, 3).map((maintenance: any) => (
              <TouchableOpacity
                key={maintenance.id}
                style={[styles.activityCard, { backgroundColor: colors.surface }]}
                onPress={() => {
                  const vehicle = vehicles.find(v => v.id === maintenance.vehicleId);
                  if (vehicle) {
                    handleNavigation('CarMaintenance', { carId: vehicle.id });
                  }
                }}
              >
                <View style={[styles.activityIcon, { backgroundColor: colors.primaryContainer }]}>
                  <Wrench size={20} color={colors.primary} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: colors.onSurface }]}>
                    {maintenance.description || maintenance.type}
                  </Text>
                  <Text style={[styles.activitySubtitle, { color: colors.onSurfaceVariant }]}>
                    {vehicles.find(v => v.id === maintenance.vehicleId)?.make} {vehicles.find(v => v.id === maintenance.vehicleId)?.model}
                  </Text>
                  <Text style={[styles.activityDate, { color: colors.onSurfaceVariant }]}>
                    {new Date(maintenance.completedDate?.toDate?.() || maintenance.completedDate).toLocaleDateString('it-IT')}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* No Vehicles Alert */}
        {!hasVehicles && (
          <Card style={[styles.alertCard, { backgroundColor: colors.primaryContainer }]}>
            <Card.Content>
              <View style={styles.alertContent}>
                <AlertCircle size={24} color={colors.primary} />
                <Text style={[styles.alertTitle, { color: colors.onPrimaryContainer }]}>
                  Inizia ora!
                </Text>
                <Text style={[styles.alertText, { color: colors.onPrimaryContainer }]}>
                  Aggiungi il tuo primo veicolo per iniziare a tracciare manutenzioni e spese
                </Text>
                <Button
                  mode="contained"
                  onPress={() => handleNavigation('AddVehicle')}
                  style={styles.alertButton}
                >
                  Aggiungi Veicolo
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* FAB per aggiungere velocemente */}
      <FAB.Group
        open={false}
        visible
        icon="plus"
        actions={[
          {
            icon: 'car',
            label: 'Aggiungi Veicolo',
            onPress: () => handleNavigation('AddVehicle'),
          },
          {
            icon: 'wrench',
            label: 'Aggiungi Manutenzione',
            onPress: () => {
              if (vehicles.length > 0) {
                handleNavigation('AddMaintenance', { carId: vehicles[0]?.id });
              } else {
                Alert.alert('Attenzione', 'Aggiungi prima un veicolo');
              }
            },
          },
          {
            icon: 'gas-station',
            label: 'Aggiungi Rifornimento',
            onPress: () => {
              if (vehicles.length > 0) {
                handleNavigation('AddFuelRecord', { carId: vehicles[0]?.id });
              } else {
                Alert.alert('Attenzione', 'Aggiungi prima un veicolo');
              }
            },
          },
          {
            icon: 'currency-usd',
            label: 'Aggiungi Spesa',
            onPress: () => {
              if (vehicles.length > 0) {
                handleNavigation('AddExpense', { carId: vehicles[0]?.id });
              } else {
                Alert.alert('Attenzione', 'Aggiungi prima un veicolo');
              }
            },
          },
        ]}
        onStateChange={() => {}}
        onPress={() => {}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  themeToggle: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  quickActionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '30%',
    aspectRatio: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  recentSection: {
    padding: 20,
    paddingTop: 0,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
  },
  alertCard: {
    margin: 20,
    borderRadius: 12,
  },
  alertContent: {
    alignItems: 'center',
    padding: 16,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  alertButton: {
    borderRadius: 20,
  },
});

export default HomeScreen;
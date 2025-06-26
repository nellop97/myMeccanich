import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Dimensions,
  Image,
  Animated,
  FlatList,
  Platform,
  ImageBackground,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Car,
  Calendar,
  FileText,
  Settings,
  Bell,
  Plus,
  ChevronRight,
  Wrench,
  DollarSign,
  Fuel,
  AlertCircle,
  Clock,
  Activity,
  MapPin,
  CheckCircle,
  BarChart2,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store';
import { LinearGradient } from 'expo-linear-gradient';

// Firestore imports
import { db } from '../../services/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.8;
const CARD_SPACING = screenWidth * 0.05;

// Tipi per i dati Firestore
interface Vehicle {
  id: string;
  ownerId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  currentMileage: number;
  color?: string;
  isActive: boolean;
}

interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  ownerId: string;
  title: string;
  description: string;
  completedDate: any; // Timestamp
  totalCost: number;
  status: 'completed' | 'pending' | 'scheduled';
  category: string;
}

interface Expense {
  id: string;
  vehicleId: string;
  ownerId: string;
  description: string;
  amount: number;
  category: string;
  date: any; // Timestamp
}

interface FuelRecord {
  id: string;
  vehicleId: string;
  ownerId: string;
  date: any; // Timestamp
  totalCost: number;
  quantity: number;
}

// Hook personalizzato per i veicoli
const useUserVehicles = (userId: string | null) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    const vehiclesQuery = query(
        collection(db, 'vehicles'),
        where('ownerId', '==', userId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
        vehiclesQuery,
        (snapshot) => {
          const vehiclesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Vehicle[];

          setVehicles(vehiclesData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Errore nel recupero veicoli:', err);
          setError('Errore nel caricamento dei veicoli');
          setLoading(false);
        }
    );

    return () => unsubscribe();
  }, [userId]);

  return { vehicles, loading, error };
};

// Hook per le statistiche annuali
const useYearlyStats = (userId: string | null, vehicles: Vehicle[]) => {
  const [stats, setStats] = useState({
    totalMaintenanceRecords: 0,
    totalExpenses: 0,
    totalKmDriven: 0,
    loading: true,
    error: null as string | null
  });

  useEffect(() => {
    if (!userId || vehicles.length === 0) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    const vehicleIds = vehicles.map(v => v.id);
    let unsubscribes: (() => void)[] = [];

    // Calcola anno corrente
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

    // Query per maintenance records dell'anno
    const maintenanceQuery = query(
        collection(db, 'maintenance_records'),
        where('ownerId', '==', userId),
        where('completedDate', '>=', Timestamp.fromDate(yearStart)),
        where('completedDate', '<=', Timestamp.fromDate(yearEnd))
    );

    // Query per expenses dell'anno
    const expensesQuery = query(
        collection(db, 'expenses'),
        where('ownerId', '==', userId),
        where('date', '>=', Timestamp.fromDate(yearStart)),
        where('date', '<=', Timestamp.fromDate(yearEnd))
    );

    // Query per fuel records dell'anno
    const fuelQuery = query(
        collection(db, 'fuel_records'),
        where('ownerId', '==', userId),
        where('date', '>=', Timestamp.fromDate(yearStart)),
        where('date', '<=', Timestamp.fromDate(yearEnd))
    );

    let maintenanceData: MaintenanceRecord[] = [];
    let expensesData: Expense[] = [];
    let fuelData: FuelRecord[] = [];
    let loadedCount = 0;

    const checkIfAllLoaded = () => {
      if (loadedCount === 3) {
        // Calcola statistiche
        const totalMaintenanceRecords = maintenanceData.length;
        const maintenanceCosts = maintenanceData.reduce((sum, record) => sum + (record.totalCost || 0), 0);
        const expensesCosts = expensesData.reduce((sum, expense) => sum + expense.amount, 0);
        const fuelCosts = fuelData.reduce((sum, fuel) => sum + fuel.totalCost, 0);
        const totalExpenses = maintenanceCosts + expensesCosts + fuelCosts;

        // Calcola km percorsi (differenza tra chilometraggio attuale e inizio anno - stima)
        const totalKmDriven = vehicles.reduce((sum, vehicle) => {
          // Stima conservativa: 1000 km al mese
          return sum + Math.min(vehicle.currentMileage, 12000);
        }, 0);

        setStats({
          totalMaintenanceRecords,
          totalExpenses,
          totalKmDriven,
          loading: false,
          error: null
        });
      }
    };

    // Sottoscrizioni
    const maintenanceUnsub = onSnapshot(maintenanceQuery, (snapshot) => {
      maintenanceData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MaintenanceRecord[];
      loadedCount++;
      checkIfAllLoaded();
    }, (err) => {
      console.error('Errore maintenance:', err);
      setStats(prev => ({ ...prev, error: 'Errore nel caricamento dati', loading: false }));
    });

    const expensesUnsub = onSnapshot(expensesQuery, (snapshot) => {
      expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
      loadedCount++;
      checkIfAllLoaded();
    }, (err) => {
      console.error('Errore expenses:', err);
      setStats(prev => ({ ...prev, error: 'Errore nel caricamento dati', loading: false }));
    });

    const fuelUnsub = onSnapshot(fuelQuery, (snapshot) => {
      fuelData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FuelRecord[];
      loadedCount++;
      checkIfAllLoaded();
    }, (err) => {
      console.error('Errore fuel:', err);
      setStats(prev => ({ ...prev, error: 'Errore nel caricamento dati', loading: false }));
    });

    unsubscribes = [maintenanceUnsub, expensesUnsub, fuelUnsub];

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [userId, vehicles]);

  return stats;
};

// Hook per attività recenti
const useRecentActivities = (userId: string | null) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    // Query per gli ultimi 5 record di manutenzione
    const maintenanceQuery = query(
        collection(db, 'maintenance_records'),
        where('ownerId', '==', userId),
        orderBy('completedDate', 'desc'),
        limit(5)
    );

    const unsubscribe = onSnapshot(maintenanceQuery, (snapshot) => {
      const activitiesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'maintenance',
          title: data.title,
          subtitle: data.description,
          date: data.completedDate,
          amount: data.totalCost,
          icon: Wrench,
          color: '#007AFF'
        };
      });

      setActivities(activitiesData);
      setLoading(false);
    }, (err) => {
      console.error('Errore nel recupero attività:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { activities, loading };
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user, darkMode, logout } = useStore();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeCarIndex, setActiveCarIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Usa i nuovi hook
  const { vehicles, loading: vehiclesLoading, error: vehiclesError } = useUserVehicles(user?.uid || null);
  const yearlyStats = useYearlyStats(user?.uid || null, vehicles);
  const { activities, loading: activitiesLoading } = useRecentActivities(user?.uid || null);

  const theme = {
    background: darkMode ? '#111827' : '#f3f4f6',
    cardBackground: darkMode ? '#1f2937' : '#ffffff',
    cardBackgroundAlt: darkMode ? '#2a3441' : '#f9fafb',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#9ca3af' : '#6b7280',
    border: darkMode ? '#374151' : '#e5e7eb',
    accent: '#2563eb',
    accentGradient: ['#2563eb', '#3b82f6'],
    success: '#10b981',
    successGradient: ['#059669', '#10b981'],
    warning: '#f59e0b',
    warningGradient: ['#d97706', '#f59e0b'],
    error: '#ef4444',
    errorGradient: ['#dc2626', '#ef4444'],
    shadow: darkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleNavigation = (screen: string, params?: any) => {
    navigation.navigate(screen as never, params as never);
  };

  const quickActions = [
    {
      icon: Car,
      title: 'Le Mie Auto',
      subtitle: `${vehicles.length} veicoli registrati`,
      color: theme.accent,
      bgColor: darkMode ? '#1e3a8a' : '#dbeafe',
      gradient: theme.accentGradient,
      onPress: () => handleNavigation('MyCars'),
    },
    {
      icon: Calendar,
      title: 'Prossimi Servizi',
      subtitle: 'Controlla scadenze',
      color: theme.warning,
      bgColor: darkMode ? '#92400e' : '#fef3c7',
      gradient: theme.warningGradient,
      onPress: () => handleNavigation('MaintenanceCalendar'),
    },
    {
      icon: FileText,
      title: 'Storico Interventi',
      subtitle: `${yearlyStats.totalMaintenanceRecords} quest'anno`,
      color: theme.success,
      bgColor: darkMode ? '#065f46' : '#d1fae5',
      gradient: theme.successGradient,
      onPress: () => handleNavigation('MaintenanceHistory'),
    },
    {
      icon: DollarSign,
      title: 'Spese',
      subtitle: `${formatCurrency(yearlyStats.totalExpenses)} quest'anno`,
      color: theme.error,
      bgColor: darkMode ? '#7f1d1d' : '#fee2e2',
      gradient: theme.errorGradient,
      onPress: () => handleNavigation('Expenses'),
    },
  ];

  const renderCarCard = ({ item, index }: { item: Vehicle; index: number }) => (
      <TouchableOpacity
          style={[
            styles.carCard,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
              width: CARD_WIDTH,
              marginLeft: index === 0 ? CARD_SPACING : 0,
              marginRight: CARD_SPACING,
            },
          ]}
          onPress={() => handleNavigation('CarDetail', { carId: item.id })}
          activeOpacity={0.8}
      >
        <LinearGradient
            colors={theme.accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.carCardGradient}
        >
          <View style={styles.carCardContent}>
            <View style={styles.carInfo}>
              <Text style={styles.carMake}>{item.make}</Text>
              <Text style={styles.carModel}>{item.model}</Text>
              <Text style={styles.carYear}>{item.year}</Text>
            </View>
            <View style={styles.carDetails}>
              <Text style={styles.carPlate}>{item.licensePlate}</Text>
              <Text style={styles.carMileage}>
                {item.currentMileage?.toLocaleString()} km
              </Text>
            </View>
          </View>
          <Car width={48} height={48} color="rgba(255,255,255,0.3)" style={styles.carIcon} />
        </LinearGradient>
      </TouchableOpacity>
  );

  const renderActivityItem = ({ item }: { item: any }) => (
      <View style={[styles.activityItem, { paddingVertical: 12 }]}>
        <View style={[styles.activityIcon, { backgroundColor: `${item.color}20` }]}>
          <item.icon width={20} height={20} color={item.color} />
        </View>
        <View style={styles.activityContent}>
          <Text style={[styles.activityTitle, { color: theme.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.activitySubtitle, { color: theme.textSecondary }]}>
            {item.subtitle}
          </Text>
        </View>
        <View style={styles.activityMeta}>
          <Text style={[styles.activityDate, { color: theme.textSecondary }]}>
            {formatDate(item.date)}
          </Text>
          {item.amount && (
              <Text style={[styles.activityTitle, { color: theme.text }]}>
                {formatCurrency(item.amount)}
              </Text>
          )}
        </View>
      </View>
  );

  if (vehiclesLoading && !refreshing) {
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.text }]}>
              Caricamento...
            </Text>
          </View>
        </SafeAreaView>
    );
  }

  if (vehiclesError) {
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
          <View style={styles.errorContainer}>
            <AlertCircle width={48} height={48} color={theme.error} />
            <Text style={[styles.errorText, { color: theme.text }]}>
              {vehiclesError}
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

  return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

        <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.accent}
                  colors={[theme.accent]}
              />
            }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: theme.textSecondary }]}>
                Buongiorno,
              </Text>
              <Text style={[styles.username, { color: theme.text }]}>
                {user?.name || user?.email || 'Utente'}
              </Text>
            </View>
            <TouchableOpacity
                onPress={() => handleNavigation('Settings')}
                style={[styles.settingsButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
            >
              <Settings width={20} height={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Veicoli */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>I Miei Veicoli</Text>
              <TouchableOpacity onPress={() => handleNavigation('AddCar')}>
                <Plus width={24} height={24} color={theme.accent} />
              </TouchableOpacity>
            </View>

            {vehicles.length > 0 ? (
                <FlatList
                    data={vehicles}
                    renderItem={renderCarCard}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: false }
                    )}
                    snapToInterval={CARD_WIDTH + CARD_SPACING}
                    decelerationRate="fast"
                    contentContainerStyle={styles.carsList}
                />
            ) : (
                <TouchableOpacity
                    style={[styles.addVehicleCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                    onPress={() => handleNavigation('AddCar')}
                    activeOpacity={0.8}
                >
                  <LinearGradient
                      colors={theme.accentGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.addVehicleGradient}
                  >
                    <Plus width={32} height={32} color="#ffffff" />
                    <Text style={styles.addVehicleText}>Aggiungi il tuo primo veicolo</Text>
                  </LinearGradient>
                </TouchableOpacity>
            )}
          </View>

          {/* Azioni Rapide */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Azioni Rapide</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => (
                  <TouchableOpacity
                      key={index}
                      style={[
                        styles.quickActionCard,
                        {
                          backgroundColor: theme.cardBackground,
                          borderColor: theme.border,
                        },
                      ]}
                      onPress={action.onPress}
                      activeOpacity={0.8}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: action.bgColor }]}>
                      <action.icon width={24} height={24} color={action.color} />
                    </View>
                    <Text style={[styles.quickActionTitle, { color: theme.text }]}>
                      {action.title}
                    </Text>
                    <Text style={[styles.quickActionSubtitle, { color: theme.textSecondary }]}>
                      {action.subtitle}
                    </Text>
                  </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Riepilogo Annuale */}
          {!yearlyStats.loading && (
              <TouchableOpacity
                  style={[
                    styles.statsCard,
                    {
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => handleNavigation('Statistics')}
                  activeOpacity={0.8}
              >
                <Text style={[styles.statsTitle, { color: theme.text }]}>
                  Riepilogo Annuale
                </Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <BarChart2 width={24} height={24} color={theme.accent} style={{marginBottom: 8}} />
                    <Text style={[styles.statValue, { color: theme.text }]}>
                      {yearlyStats.totalMaintenanceRecords}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                      Interventi
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <DollarSign width={24} height={24} color={theme.warning} style={{marginBottom: 8}} />
                    <Text style={[styles.statValue, { color: theme.text }]}>
                      {formatCurrency(yearlyStats.totalExpenses)}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                      Spese Totali
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <MapPin width={24} height={24} color={theme.success} style={{marginBottom: 8}} />
                    <Text style={[styles.statValue, { color: theme.text }]}>
                      {yearlyStats.totalKmDriven.toLocaleString()}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                      Km Percorsi
                    </Text>
                  </View>
                </View>
                <ChevronRight
                    width={20}
                    height={20}
                    color={theme.textSecondary}
                    style={styles.statsArrow}
                />
              </TouchableOpacity>
          )}

          {/* Attività Recenti */}
          {activities.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Attività Recenti</Text>
                  <TouchableOpacity onPress={() => handleNavigation('MaintenanceHistory')}>
                    <ChevronRight width={20} height={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={[styles.activityCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                  <FlatList
                      data={activities}
                      renderItem={renderActivityItem}
                      keyExtractor={(item) => item.id}
                      scrollEnabled={false}
                      ItemSeparatorComponent={() => (
                          <View style={[styles.separator, { backgroundColor: theme.border }]} />
                      )}
                  />
                </View>
              </View>
          )}

          {/* Logout Button */}
          <TouchableOpacity
              style={[
                styles.logoutButton,
                {
                  borderColor: theme.border,
                },
              ]}
              onPress={logout}
              activeOpacity={0.7}
          >
            <Text style={[styles.logoutButtonText, { color: theme.text }]}>
              Esci
            </Text>
          </TouchableOpacity>
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
    fontSize: 16,
    marginTop: 16,
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
    marginVertical: 16,
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
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
  carsList: {
    paddingLeft: 0,
  },
  carCard: {
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  carCardGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  carCardContent: {
    flex: 1,
  },
  carInfo: {
    marginBottom: 12,
  },
  carMake: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
  },
  carModel: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  carYear: {
    color: '#ffffff',
    fontSize: 16,
    opacity: 0.8,
    marginTop: 2,
  },
  carDetails: {
    marginTop: 8,
  },
  carPlate: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  carMileage: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.9,
  },
  carIcon: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  addVehicleCard: {
    height: 160,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  addVehicleGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addVehicleText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  quickActionsGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (screenWidth - 60) / 2,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
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
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  activityCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
    marginHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  activityMeta: {
    alignItems: 'flex-end',
  },
  activityDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  separator: {
    height: 1,
    marginVertical: 8,
  },
  statsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    marginHorizontal: 20,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  statsArrow: {
    position: 'absolute',
    top: 20,
    right: 20,
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

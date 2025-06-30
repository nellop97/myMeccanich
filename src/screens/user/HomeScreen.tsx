// src/screens/user/HomeScreen.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { useAuth } from '../../hooks/useAuth';
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
  photoURL?: string;
  nextMaintenanceDate?: Timestamp;
  lastMaintenanceDate?: Timestamp;
  insuranceExpiry?: Timestamp;
  inspectionExpiry?: Timestamp;
}

interface YearlyStats {
  totalMaintenance: number;
  totalExpenses: number;
  totalKilometers: number;
  averageExpensePerKm: number;
}

// Hook per sincronizzare Firebase Auth con Store Zustand
const useAuthSync = () => {
  const { user: authUser, loading: authLoading, initializing } = useAuth();
  const { user: storeUser, setUser, setLoading } = useStore();

  useEffect(() => {
    console.log('🔄 Auth Sync - Auth User:', authUser);
    console.log('🔄 Auth Sync - Store User:', storeUser);

    if (!initializing) {
      if (authUser) {
        // Costruisci il nome dell'utente dai dati disponibili
        const userName = authUser.displayName ||
            (authUser.firstName && authUser.lastName ?
                `${authUser.firstName} ${authUser.lastName}` : null) ||
            authUser.firstName ||
            authUser.email?.split('@')[0] ||
            'Utente';

        // Sincronizza i dati Firebase con lo store Zustand
        const syncedUser = {
          id: authUser.uid,
          name: userName,
          email: authUser.email || '',
          isLoggedIn: true,
          photoURL: authUser.photoURL,
          isMechanic: authUser.userType === 'mechanic',
          phoneNumber: authUser.phoneNumber,
          emailVerified: authUser.emailVerified,
          createdAt: authUser.createdAt,
          lastLoginAt: authUser.lastLoginAt,
          // Dati specifici per meccanici
          workshopName: authUser.workshopName,
          workshopAddress: authUser.address,
          vatNumber: authUser.vatNumber,
        };

        console.log('✅ Auth Sync - Syncing user to store:', syncedUser);
        setUser(syncedUser);
      } else {
        console.log('❌ Auth Sync - No auth user, clearing store');
        setUser(null);
      }

      setLoading(authLoading);
    }
  }, [authUser, initializing, authLoading, setUser, setLoading]);

  return {
    user: storeUser,
    authUser,
    loading: authLoading || initializing,
    isAuthenticated: !!authUser && !!storeUser?.isLoggedIn
  };
};

// Hook per caricare i veicoli dell'utente
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

    console.log('🚗 Loading vehicles for user:', userId);

    const vehiclesQuery = query(
        collection(db, 'vehicles'),
        where('ownerId', '==', userId),
        orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
        vehiclesQuery,
        (snapshot) => {
          const vehiclesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Vehicle[];

          console.log('✅ Vehicles loaded:', vehiclesData.length);
          setVehicles(vehiclesData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('❌ Error loading vehicles:', err);
          setError('Errore nel caricamento dei veicoli');
          setLoading(false);
        }
    );

    return () => unsubscribe();
  }, [userId]);

  return { vehicles, loading, error };
};

// Hook per statistiche annuali
const useYearlyStats = (userId: string | null, vehicles: Vehicle[]) => {
  const [stats, setStats] = useState<YearlyStats>({
    totalMaintenance: 0,
    totalExpenses: 0,
    totalKilometers: 0,
    averageExpensePerKm: 0
  });

  useEffect(() => {
    if (!userId || vehicles.length === 0) {
      setStats({
        totalMaintenance: 0,
        totalExpenses: 0,
        totalKilometers: 0,
        averageExpensePerKm: 0
      });
      return;
    }

    // Calcola le statistiche dai veicoli
    const currentYear = new Date().getFullYear();

    // Qui dovresti fare query a Firestore per ottenere i dati reali
    // Per ora uso dati mock per dimostrare la funzionalità
    const mockStats = {
      totalMaintenance: vehicles.length * 3, // Media 3 interventi per veicolo
      totalExpenses: vehicles.length * 850, // Media €850 per veicolo
      totalKilometers: vehicles.reduce((total, vehicle) => total + (vehicle.currentMileage || 0), 0),
      averageExpensePerKm: 0.12
    };

    setStats(mockStats);
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
  const { logout: storeLogout } = useStore();
  const { logout: authLogout } = useAuth();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeCarIndex, setActiveCarIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Usa il nuovo hook per sincronizzare auth
  const { user, authUser, loading: authLoading, isAuthenticated } = useAuthSync();

  // Usa i nuovi hook per i dati
  const { vehicles, loading: vehiclesLoading, error: vehiclesError } = useUserVehicles(authUser?.uid || null);
  const yearlyStats = useYearlyStats(authUser?.uid || null, vehicles);
  const { activities, loading: activitiesLoading } = useRecentActivities(authUser?.uid || null);

  // Determina la modalità scura dal sistema (poiché non è nello store visibile)
  const [darkMode] = useState(false); // Puoi collegarlo alle preferenze di sistema

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

  // Funzione per logout che pulisce entrambi i sistemi
  const handleLogout = useCallback(async () => {
    try {
      console.log('🚪 Logging out...');
      await authLogout(); // Logout da Firebase
      storeLogout(); // Pulisci lo store
      console.log('✅ Logout completed');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  }, [authLogout, storeLogout]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Il refresh viene gestito automaticamente dai listener Firestore
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('it-IT');
  };

  const handleNavigation = (screenName: string, params?: any) => {
    navigation.navigate(screenName as any, params);
  };

  // Loading state
  if (authLoading || !isAuthenticated) {
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

  // Error state
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

  // Costruisci il nome utente con fallback multipli
  const displayName = user?.name ||
      authUser?.displayName ||
      (authUser?.firstName && authUser?.lastName ?
          `${authUser.firstName} ${authUser.lastName}` : null) ||
      authUser?.firstName ||
      user?.email?.split('@')[0] ||
      'Utente';

  console.log('🎯 Display name resolved to:', displayName);

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
          {/* Header con nome utente */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: theme.textSecondary }]}>
                Buongiorno,
              </Text>
              <Text style={[styles.username, { color: theme.text }]}>
                {displayName}
              </Text>
              {__DEV__ && (
                  <Text style={[styles.debugText, { color: theme.textSecondary }]}>
                    Debug: {JSON.stringify({
                    storeName: user?.name,
                    authDisplayName: authUser?.displayName,
                    authFirstName: authUser?.firstName,
                    authLastName: authUser?.lastName,
                    email: user?.email
                  }, null, 2)}
                  </Text>
              )}
            </View>
            <TouchableOpacity
                onPress={() => handleNavigation('Settings')}
                style={[
                  styles.settingsButton,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border
                  }
                ]}
            >
              <Settings width={20} height={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Sezione Veicoli */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                I Miei Veicoli
              </Text>
              <TouchableOpacity onPress={() => handleNavigation('AddCar')}>
                <Plus width={24} height={24} color={theme.accent} />
              </TouchableOpacity>
            </View>

            {vehicles.length > 0 ? (
                <FlatList
                    data={vehicles}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    snapToInterval={CARD_WIDTH + CARD_SPACING}
                    decelerationRate="fast"
                    contentContainerStyle={{ paddingLeft: CARD_SPACING / 2 }}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: false }
                    )}
                    renderItem={({ item: vehicle, index }) => (
                        <TouchableOpacity
                            style={[
                              styles.carCard,
                              {
                                width: CARD_WIDTH,
                                marginHorizontal: CARD_SPACING / 2,
                                backgroundColor: theme.cardBackground,
                                borderColor: theme.border
                              }
                            ]}
                            onPress={() => handleNavigation('CarDetail', { carId: vehicle.id })}
                        >
                          <LinearGradient
                              colors={theme.accentGradient}
                              style={styles.carCardGradient}
                          >
                            <View style={styles.carCardContent}>
                              <View style={styles.carCardHeader}>
                                <Text style={styles.carCardTitle}>
                                  {vehicle.make} {vehicle.model}
                                </Text>
                                <Text style={styles.carCardYear}>{vehicle.year}</Text>
                              </View>
                              <Text style={styles.carCardPlate}>
                                {vehicle.licensePlate}
                              </Text>
                              <Text style={styles.carCardMileage}>
                                {vehicle.currentMileage?.toLocaleString()} km
                              </Text>
                            </View>
                            <ChevronRight width={20} height={20} color="#ffffff" />
                          </LinearGradient>
                        </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.id}
                />
            ) : (
                <View style={[styles.emptyState, { backgroundColor: theme.cardBackground }]}>
                  <Car width={48} height={48} color={theme.textSecondary} />
                  <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
                    Nessun veicolo aggiunto
                  </Text>
                  <Text style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}>
                    Aggiungi il tuo primo veicolo per iniziare
                  </Text>
                  <TouchableOpacity
                      style={[styles.addButton, { backgroundColor: theme.accent }]}
                      onPress={() => handleNavigation('AddCar')}
                  >
                    <Text style={styles.addButtonText}>Aggiungi Veicolo</Text>
                  </TouchableOpacity>
                </View>
            )}
          </View>

          {/* Statistiche Annuali */}
          {vehicles.length > 0 && (
              <View style={[styles.statsCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <TouchableOpacity style={styles.statsArrow}>
                  <ChevronRight width={20} height={20} color={theme.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.statsTitle, { color: theme.text }]}>
                  Statistiche {new Date().getFullYear()}
                </Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.accent }]}>
                      {yearlyStats.totalMaintenance}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                      Interventi
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.success }]}>
                      {formatCurrency(yearlyStats.totalExpenses)}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                      Spese Totali
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.warning }]}>
                      {yearlyStats.totalKilometers.toLocaleString()}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                      Km Totali
                    </Text>
                  </View>
                </View>
              </View>
          )}

          {/* Azioni Rapide */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text, paddingHorizontal: 20 }]}>
              Azioni Rapide
            </Text>
            <View style={styles.quickActionsGrid}>
              {[
                { icon: Wrench, title: 'Manutenzione', subtitle: 'Programma un intervento', screen: 'AddMaintenance' },
                { icon: Fuel, title: 'Rifornimento', subtitle: 'Registra carburante', screen: 'AddFuel' },
                { icon: DollarSign, title: 'Spesa', subtitle: 'Aggiungi una spesa', screen: 'AddExpense' },
                { icon: FileText, title: 'Documento', subtitle: 'Carica documento', screen: 'AddDocument' },
              ].map((action, index) => (
                  <TouchableOpacity
                      key={index}
                      style={[styles.quickActionCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                      onPress={() => handleNavigation(action.screen)}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: theme.accentGradient[0] + '20' }]}>
                      <action.icon width={24} height={24} color={theme.accent} />
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

          {/* Attività Recenti */}
          {activities.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Attività Recenti
                  </Text>
                  <TouchableOpacity onPress={() => handleNavigation('MaintenanceHistory')}>
                    <Text style={[{ color: theme.accent }]}>Vedi tutto</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.activityCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                  {activities.map((activity, index) => (
                      <View key={activity.id}>
                        <View style={styles.activityItem}>
                          <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
                            <activity.icon width={20} height={20} color={activity.color} />
                          </View>
                          <View style={styles.activityContent}>
                            <Text style={[styles.activityTitle, { color: theme.text }]}>
                              {activity.title}
                            </Text>
                            <Text style={[styles.activitySubtitle, { color: theme.textSecondary }]}>
                              {activity.subtitle}
                            </Text>
                          </View>
                          <View style={styles.activityMeta}>
                            <Text style={[styles.activityDate, { color: theme.textSecondary }]}>
                              {formatDate(activity.date)}
                            </Text>
                            {activity.amount && (
                                <Text style={[{ color: theme.text, fontWeight: '600' }]}>
                                  {formatCurrency(activity.amount)}
                                </Text>
                            )}
                          </View>
                        </View>
                        {index < activities.length - 1 && (
                            <View style={[styles.separator, { backgroundColor: theme.border }]} />
                        )}
                      </View>
                  ))}
                </View>
              </View>
          )}

          {/* Logout Button */}
          <TouchableOpacity
              style={[styles.logoutButton, { borderColor: theme.border }]}
              onPress={handleLogout}
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
  debugText: {
    fontSize: 10,
    marginTop: 4,
    maxWidth: 200,
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  carCardContent: {
    flex: 1,
  },
  carCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  carCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  carCardYear: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  carCardPlate: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 4,
  },
  carCardMileage: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
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
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
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
    fontSize: 14,
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

// src/screens/user/HomeScreen.tsx - VERSIONE MODERNA E RAFFINATA
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
  Platform,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  FAB,
} from 'react-native-paper';
import {
  Car,
  Plus,
  AlertCircle,
  Wrench,
  Fuel,
  DollarSign,
  FileText,
  Bell,
  TrendingUp,
  ChevronRight,
  User,
  LogOut,
  Moon,
  Sun,
  Sparkles,
  BarChart3,
  Calendar,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppThemeManager, useThemedStyles } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useUserData } from '../../hooks/useUserData';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const { colors, isDark, toggleTheme } = useAppThemeManager();
  const { dynamicStyles } = useThemedStyles();

  const { user, signOut, loading: authLoading } = useAuth();
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

  const isTablet = screenData.width >= 768;
  const isDesktop = screenData.width >= 1024;
  const isWeb = Platform.OS === 'web';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

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
              await signOut();
            } catch (error) {
              Alert.alert('Errore', 'Errore durante il logout');
            }
          }
        }
      ]
    );
  }, [signOut]);

  const handleNavigation = useCallback((screenName: string, params?: any) => {
    try {
      (navigation as any).navigate(screenName, params);
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Errore', 'Errore di navigazione');
    }
  }, [navigation]);

  const quickActions = [
    {
      id: 'vehicles',
      icon: Car,
      label: 'Veicoli',
      color: '#6366f1',
      gradient: ['#6366f1', '#8b5cf6'],
      onPress: () => handleNavigation('VehicleList'),
    },
    {
      id: 'add_vehicle',
      icon: Plus,
      label: 'Aggiungi',
      color: '#10b981',
      gradient: ['#10b981', '#059669'],
      onPress: () => handleNavigation('AddVehicle'),
    },
    {
      id: 'maintenance',
      icon: Wrench,
      label: 'Manutenzione',
      color: '#3b82f6',
      gradient: ['#3b82f6', '#2563eb'],
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
      color: '#f59e0b',
      gradient: ['#f59e0b', '#d97706'],
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
      color: '#ef4444',
      gradient: ['#ef4444', '#dc2626'],
      onPress: () => handleNavigation('ExpenseTracker'),
    },
    {
      id: 'reminders',
      icon: Bell,
      label: 'Promemoria',
      color: '#8b5cf6',
      gradient: ['#8b5cf6', '#7c3aed'],
      onPress: () => handleNavigation('RemindersList'),
    },
    {
      id: 'documents',
      icon: FileText,
      label: 'Documenti',
      color: '#06b6d4',
      gradient: ['#06b6d4', '#0891b2'],
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
      color: '#64748b',
      gradient: ['#64748b', '#475569'],
      onPress: () => handleNavigation('Profile', { userId: user?.uid }),
    },
  ];

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

  const userName = user?.displayName || 
                  user?.email?.split('@')[0] ||
                  'Utente';

  const userStats = {
    totalCars: stats.vehiclesCount,
    totalMaintenance: stats.maintenanceCount,
    totalExpenses: stats.totalExpenses + stats.totalFuelCost,
    upcomingMaintenance: stats.remindersCount,
  };

  const ModernStatCard = ({ icon: Icon, number, label, gradient }: any) => (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.modernStatCard}
    >
      <View style={styles.statCardContent}>
        <View style={styles.statIconWrapper}>
          <Icon size={24} color="#fff" strokeWidth={2.5} />
        </View>
        <View style={styles.statTextWrapper}>
          <Text style={styles.statNumber}>{number}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      </View>
    </LinearGradient>
  );

  const QuickActionButton = ({ icon: Icon, label, onPress, gradient }: any) => (
    <TouchableOpacity 
      style={styles.quickActionWrapper} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.quickActionGradient}
      >
        <View style={styles.quickActionIconContainer}>
          <Icon size={22} color="#fff" strokeWidth={2.5} />
        </View>
      </LinearGradient>
      <Text style={[styles.quickActionText, { color: colors.onBackground }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <LinearGradient
        colors={isDark 
          ? ['#1e1b4b', '#312e81', colors.background] 
          : ['#6366f1', '#8b5cf6', colors.background]
        }
        locations={[0, 0.5, 1]}
        style={styles.headerGradient}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.greetingRow}>
                  <Text style={styles.headerGreeting}>Ciao, {userName}</Text>
                  <Sparkles size={20} color="#fff" style={{ marginLeft: 6 }} />
                </View>
                <Text style={styles.headerSubtitle}>
                  {hasOverdueReminders 
                    ? '⚠️ Hai scadenze da controllare'
                    : '✨ Tutto sotto controllo'}
                </Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.actionIconButton} 
                  onPress={() => handleNavigation('RemindersList')}
                >
                  <Bell size={22} color="#fff" strokeWidth={2.5} />
                  {stats.overdueReminders > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationCount}>
                        {stats.overdueReminders}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionIconButton} 
                  onPress={toggleTheme}
                >
                  {isDark ? 
                    <Sun size={22} color="#fff" strokeWidth={2.5} /> : 
                    <Moon size={22} color="#fff" strokeWidth={2.5} />
                  }
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionIconButton} 
                  onPress={handleLogout}
                >
                  <LogOut size={22} color="#fff" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          (isTablet || isDesktop) && styles.scrollContentWide
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <BarChart3 size={20} color={colors.primary} strokeWidth={2.5} />
            <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
              Panoramica
            </Text>
          </View>
          <View style={[
            styles.statsGrid,
            (isTablet || isDesktop) && styles.statsGridWide
          ]}>
            <ModernStatCard 
              icon={Car} 
              number={userStats.totalCars} 
              label="Veicoli" 
              gradient={['#6366f1', '#8b5cf6']}
            />
            <ModernStatCard 
              icon={Wrench} 
              number={userStats.totalMaintenance} 
              label="Manutenzioni" 
              gradient={['#3b82f6', '#2563eb']}
            />
            <ModernStatCard 
              icon={DollarSign} 
              number={formatCurrency(userStats.totalExpenses)} 
              label="Spese Totali" 
              gradient={['#ef4444', '#dc2626']}
            />
            <ModernStatCard 
              icon={Bell} 
              number={userStats.upcomingMaintenance} 
              label="Promemoria" 
              gradient={['#f59e0b', '#d97706']}
            />
          </View>
        </View>

        <View style={styles.quickActionsSection}>
          <View style={styles.sectionHeader}>
            <Sparkles size={20} color={colors.primary} strokeWidth={2.5} />
            <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
              Azioni Rapide
            </Text>
          </View>
          <View style={[
            styles.quickActionsGrid,
            (isTablet || isDesktop) && styles.quickActionsGridWide
          ]}>
            {quickActions.map((action) => (
              <QuickActionButton
                key={action.id}
                icon={action.icon}
                label={action.label}
                onPress={action.onPress}
                gradient={action.gradient}
              />
            ))}
          </View>
        </View>

        {(recentMaintenance.length > 0 || recentFuelRecords.length > 0) && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Calendar size={20} color={colors.primary} strokeWidth={2.5} />
              <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
                Attività Recenti
              </Text>
            </View>

            {recentMaintenance.slice(0, 3).map((maintenance: any) => (
              <TouchableOpacity
                key={maintenance.id}
                style={[styles.activityCard, { 
                  backgroundColor: colors.surface,
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                }]}
                onPress={() => {
                  const vehicle = vehicles.find(v => v.id === maintenance.vehicleId);
                  if (vehicle) {
                    handleNavigation('CarMaintenance', { carId: vehicle.id });
                  }
                }}
              >
                <LinearGradient
                  colors={['#3b82f6', '#2563eb']}
                  style={styles.activityIconGradient}
                >
                  <Wrench size={20} color="#fff" strokeWidth={2.5} />
                </LinearGradient>
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

        {!hasVehicles && (
          <LinearGradient
            colors={isDark ? ['#1e293b', '#334155'] : ['#f1f5f9', '#e2e8f0']}
            style={styles.emptyStateCard}
          >
            <View style={styles.emptyStateIconWrapper}>
              <Car size={48} color={colors.primary} strokeWidth={2} />
            </View>
            <Text style={[styles.emptyStateTitle, { color: colors.onSurface }]}>
              Inizia il tuo viaggio!
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.onSurfaceVariant }]}>
              Aggiungi il tuo primo veicolo per iniziare a tracciare manutenzioni, spese e molto altro
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => handleNavigation('AddVehicle')}
            >
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emptyStateButtonGradient}
              >
                <Plus size={20} color="#fff" strokeWidth={2.5} />
                <Text style={styles.emptyStateButtonText}>Aggiungi Veicolo</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

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
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerGreeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  actionIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  scrollContentWide: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  statsSection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statsGridWide: {
    gap: 16,
  },
  modernStatCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  statIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTextWrapper: {
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  quickActionsGridWide: {
    gap: 20,
  },
  quickActionWrapper: {
    width: '22%',
    alignItems: 'center',
    gap: 10,
  },
  quickActionGradient: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  quickActionIconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  recentSection: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  activityIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
  },
  emptyStateCard: {
    margin: 20,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  emptyStateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  emptyStateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default HomeScreen;

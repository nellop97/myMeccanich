// src/screens/user/HomeScreen.tsx - VERSIONE TEMATIZZATA E RESPONSIVE
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
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Importa il nuovo sistema di temi
import { useAppThemeManager, useThemedStyles } from '../../hooks/useTheme';

// ✅ USA SOLO FIREBASE AUTH
import { useAuth } from '../../hooks/useAuth';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Nuovo sistema di temi
  const { colors, isDark, toggleTheme } = useAppThemeManager();
  const { dynamicStyles } = useThemedStyles();
  
  // ✅ USA SOLO USEAUTH - FONTE SICURA
  const { user, logout, loading: authLoading } = useAuth();
  
  // Responsive hooks
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  
  useEffect(() => {
    const onChange = (result: any) => {
      setScreenData(result.window);
    };
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  // ✅ TUTTI GLI STATI LOCALI PRIMA DEL CONTROLLO
  const [refreshing, setRefreshing] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  // Calcolo responsive
  const isTablet = screenData.width >= 768;
  const isDesktop = screenData.width >= 1024;
  const isLandscape = screenData.width > screenData.height;

  // Configurazione layout responsive
  const getCardColumns = () => {
    if (isDesktop) return 4;
    if (isTablet) return isLandscape ? 4 : 3;
    return 2;
  };

  const getCardMargin = () => {
    if (isDesktop) return 24;
    if (isTablet) return 16;
    return 12;
  };

  const getHeaderPadding = () => {
    if (isDesktop) return 32;
    if (isTablet) return 24;
    return 16;
  };

  // ✅ TUTTI GLI HOOKS (INCLUSI USECALLBACK) PRIMA DEL CONTROLLO
  
  // 🔄 Refresh dei dati
  const onRefresh = useCallback(async () => {
    console.log('🔄 HomeScreen: onRefresh iniziato');
    setRefreshing(true);
    
    try {
      // Simula il caricamento dei dati
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ HomeScreen: onRefresh completato');
    } catch (error) {
      console.error('❌ HomeScreen: onRefresh errore:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // 🚪 Gestione logout
  const handleLogout = useCallback(async () => {
    console.log('🚪 HomeScreen: Richiesta logout');
    
    Alert.alert(
      'Conferma Logout',
      'Sei sicuro di voler uscire?',
      [
        { 
          text: 'Annulla', 
          style: 'cancel',
          onPress: () => console.log('❌ Logout annullato')
        },
        {
          text: 'Esci',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔄 Eseguendo logout...');
              await logout();
              console.log('✅ Logout completato');
            } catch (error) {
              console.error('❌ Errore durante logout:', error);
              Alert.alert('Errore', 'Errore durante il logout');
            }
          }
        }
      ]
    );
  }, [logout]);

  // 🧭 Navigazione
  const handleNavigation = useCallback((screenName: string, params?: any) => {
    console.log(`🧭 Navigating to: ${screenName}`, params);
    try {
      navigation.navigate(screenName as never, params as never);
    } catch (error) {
      console.error('❌ Navigation error:', error);
      Alert.alert('Errore', 'Errore di navigazione');
    }
  }, [navigation]);

  // ✅ CONTROLLO DI SICUREZZA DOPO TUTTI GLI HOOKS
  if (!user) {
    console.log('⚠️ HomeScreen: user is undefined, showing loading...');
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
          Caricamento profilo...
        </Text>
      </View>
    );
  }

  // ✅ COSTRUISCI IL NOME UTENTE CON FALLBACK SICURO
  const userName = user?.displayName || 
                  `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
                  user?.email?.split('@')[0] ||
                  'Utente';

  // Dati mockup per le statistiche
  const userStats = {
    totalCars: 2,
    totalMaintenance: 12,
    totalExpenses: 2450.50,
    upcomingMaintenance: 3,
    overdueItems: 1,
    lastMaintenanceDate: '15 Nov 2024',
    nextServiceDate: '15 Dic 2024',
    monthlyExpenses: 350.75,
  };

  const recentActivities = [
    {
      id: 1,
      type: 'maintenance',
      title: 'Cambio olio motore',
      car: 'BMW X3',
      date: '2024-11-15',
      cost: 85.50,
      icon: Wrench,
      color: colors.primary,
    },
    {
      id: 2,
      type: 'fuel',
      title: 'Rifornimento',
      car: 'Audi A4',
      date: '2024-11-12',
      cost: 65.20,
      icon: Fuel,
      color: colors.tertiary,
    },
    {
      id: 3,
      type: 'expense',
      title: 'Assicurazione',
      car: 'BMW X3',
      date: '2024-11-10',
      cost: 450.00,
      icon: Shield,
      color: colors.secondary,
    },
  ];

  const upcomingMaintenances = [
    {
      id: 1,
      title: 'Revisione periodica',
      car: 'BMW X3',
      dueDate: '2024-12-15',
      type: 'scheduled',
      priority: 'medium',
    },
    {
      id: 2,
      title: 'Cambio gomme invernali',
      car: 'Audi A4',
      dueDate: '2024-12-01',
      type: 'seasonal',
      priority: 'high',
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backgroundGradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    
    // Header
    header: {
      backgroundColor: colors.surface,
      paddingTop: insets.top,
      paddingHorizontal: getHeaderPadding(),
      paddingBottom: 20,
      ...dynamicStyles.cardShadow,
    },
    headerContent: {
      flexDirection: isTablet ? 'row' : 'column',
      alignItems: isTablet ? 'center' : 'flex-start',
      justifyContent: isTablet ? 'space-between' : 'flex-start',
      gap: isTablet ? 0 : 12,
    },
    headerLeft: {
      flex: isTablet ? 1 : undefined,
    },
    headerGreeting: {
      fontSize: isDesktop ? 32 : isTablet ? 28 : 24,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: isDesktop ? 16 : 14,
      color: colors.onSurfaceVariant,
      marginBottom: 8,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    notificationButton: {
      position: 'relative',
      backgroundColor: colors.primaryContainer,
      borderRadius: 20,
      padding: 8,
    },
    notificationBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      backgroundColor: colors.error,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    notificationCount: {
      color: colors.onError,
      fontSize: 10,
      fontWeight: 'bold',
    },
    themeToggle: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 20,
      padding: 8,
    },

    // Content
    scrollContent: {
      paddingHorizontal: getCardMargin(),
      paddingBottom: insets.bottom + 100, // Spazio per FAB
    },

    // Stats Grid
    statsSection: {
      marginVertical: 20,
    },
    sectionTitle: {
      fontSize: isDesktop ? 20 : 18,
      fontWeight: '600',
      color: colors.onBackground,
      marginBottom: 16,
      paddingHorizontal: isDesktop ? 8 : 0,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: getCardMargin(),
    },
    statCard: {
      backgroundColor: colors.surface,
      borderRadius: dynamicStyles.borderRadius.large,
      padding: isDesktop ? 24 : 20,
      flex: isDesktop ? 0 : 1,
      width: isDesktop ? `${(100 - (getCardColumns() - 1) * 2) / getCardColumns()}%` : undefined,
      minWidth: isDesktop ? 200 : undefined,
      alignItems: 'center',
      ...dynamicStyles.cardShadow,
    },
    statIcon: {
      backgroundColor: colors.primaryContainer,
      borderRadius: 30,
      padding: 12,
      marginBottom: 12,
    },
    statNumber: {
      fontSize: isDesktop ? 28 : 24,
      fontWeight: 'bold',
      color: colors.onSurface,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: isDesktop ? 14 : 12,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },

    // Quick Actions
    quickActionsSection: {
      marginVertical: 20,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: getCardMargin(),
    },
    quickActionCard: {
      backgroundColor: colors.surface,
      borderRadius: dynamicStyles.borderRadius.large,
      padding: isDesktop ? 20 : 16,
      flex: 1,
      minWidth: isDesktop ? 180 : 150,
      alignItems: 'center',
      ...dynamicStyles.cardShadow,
    },
    quickActionIcon: {
      marginBottom: 12,
    },
    quickActionLabel: {
      fontSize: isDesktop ? 14 : 12,
      color: colors.onSurface,
      textAlign: 'center',
      fontWeight: '500',
    },

    // Recent Activities
    activitiesSection: {
      marginVertical: 20,
    },
    activityCard: {
      backgroundColor: colors.surface,
      borderRadius: dynamicStyles.borderRadius.medium,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      ...dynamicStyles.cardShadow,
    },
    activityIcon: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 25,
      padding: 10,
      marginRight: 16,
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      marginBottom: 2,
    },
    activitySubtitle: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginBottom: 4,
    },
    activityMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    activityDate: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },
    activityCost: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },

    // Upcoming Maintenance
    maintenanceSection: {
      marginVertical: 20,
    },
    maintenanceCard: {
      backgroundColor: colors.surface,
      borderRadius: dynamicStyles.borderRadius.medium,
      padding: 16,
      marginBottom: 12,
      ...dynamicStyles.cardShadow,
    },
    maintenanceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    maintenanceTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onSurface,
      flex: 1,
    },
    priorityChip: {
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    priorityText: {
      fontSize: 10,
      fontWeight: '600',
    },
    maintenanceCar: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginBottom: 4,
    },
    maintenanceDate: {
      fontSize: 12,
      color: colors.onSurfaceVariant,
    },

    // FAB
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: insets.bottom,
      backgroundColor: colors.primary,
    },
  });

  // Componente StatCard
  const StatCard = ({ icon: Icon, number, label, color = colors.primary }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Icon size={isDesktop ? 28 : 24} color={color} />
      </View>
      <Text style={styles.statNumber}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  // Componente QuickActionCard
  const QuickActionCard = ({ icon: Icon, label, onPress, color = colors.primary }: any) => (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.quickActionIcon}>
        <Icon size={isDesktop ? 28 : 24} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );

  // Componente ActivityCard
  const ActivityCard = ({ activity }: any) => (
    <TouchableOpacity style={styles.activityCard} activeOpacity={0.7}>
      <View style={[styles.activityIcon, { backgroundColor: `${activity.color}20` }]}>
        <activity.icon size={20} color={activity.color} />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{activity.title}</Text>
        <Text style={styles.activitySubtitle}>{activity.car}</Text>
        <View style={styles.activityMeta}>
          <Text style={styles.activityDate}>{activity.date}</Text>
          <Text style={styles.activityCost}>€{activity.cost.toFixed(2)}</Text>
        </View>
      </View>
      <ChevronRight size={20} color={colors.onSurfaceVariant} />
    </TouchableOpacity>
  );

  // Componente MaintenanceCard
  const MaintenanceCard = ({ maintenance }: any) => {
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'high': return colors.error;
        case 'medium': return colors.warning;
        default: return colors.success;
      }
    };

    return (
      <TouchableOpacity style={styles.maintenanceCard} activeOpacity={0.7}>
        <View style={styles.maintenanceHeader}>
          <Text style={styles.maintenanceTitle}>{maintenance.title}</Text>
          <View style={[
            styles.priorityChip, 
            { backgroundColor: `${getPriorityColor(maintenance.priority)}20` }
          ]}>
            <Text style={[
              styles.priorityText, 
              { color: getPriorityColor(maintenance.priority) }
            ]}>
              {maintenance.priority.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.maintenanceCar}>{maintenance.car}</Text>
        <Text style={styles.maintenanceDate}>Scadenza: {maintenance.dueDate}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={isDark ? 
          ['#000000', '#1C1C1E'] : 
          ['#FAFAFA', '#F5F5F5']
        }
        style={styles.backgroundGradient}
      />

      {/* Status Bar */}
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerGreeting}>
              Ciao, {userName.split(' ')[0]}! 👋
            </Text>
            <Text style={styles.headerSubtitle}>
              Gestisci le tue automobili
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => Alert.alert('Notifiche', 'Funzione in sviluppo')}
            >
              <Bell size={20} color={colors.primary} />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>3</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.themeToggle}
              onPress={toggleTheme}
              activeOpacity={0.7}
            >
              <Activity size={20} color={colors.primary} />
            </TouchableOpacity>

            <IconButton
              icon="cog"
              size={24}
              iconColor={colors.onSurfaceVariant}
              onPress={() => handleNavigation('Settings')}
            />
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Statistics Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Le tue statistiche</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon={Car}
              number={userStats.totalCars}
              label="Auto"
              color={colors.primary}
            />
            <StatCard
              icon={Wrench}
              number={userStats.totalMaintenance}
              label="Manutenzioni"
              color={colors.secondary}
            />
            <StatCard
              icon={DollarSign}
              number={`€${userStats.totalExpenses}`}
              label="Spese Totali"
              color={colors.tertiary}
            />
            <StatCard
              icon={Clock}
              number={userStats.upcomingMaintenance}
              label="Scadenze"
              color={colors.warning}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Azioni rapide</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionCard
              icon={Plus}
              label="Nuova Auto"
              onPress={() => handleNavigation('AddCar')}
              color={colors.primary}
            />
            <QuickActionCard
              icon={Wrench}
              label="Manutenzione"
              onPress={() => handleNavigation('AddMaintenance')}
              color={colors.secondary}
            />
            <QuickActionCard
              icon={Fuel}
              label="Rifornimento"
              onPress={() => handleNavigation('AddFuel')}
              color={colors.tertiary}
            />
            <QuickActionCard
              icon={DollarSign}
              label="Spesa"
              onPress={() => handleNavigation('AddExpense')}
              color={colors.warning}
            />
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.activitiesSection}>
          <Text style={styles.sectionTitle}>Attività recenti</Text>
          {recentActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </View>

        {/* Upcoming Maintenance */}
        <View style={styles.maintenanceSection}>
          <Text style={styles.sectionTitle}>Manutenzioni in scadenza</Text>
          {upcomingMaintenances.map((maintenance) => (
            <MaintenanceCard key={maintenance.id} maintenance={maintenance} />
          ))}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => Alert.alert('Menu Rapido', 'Funzione in sviluppo')}
        color={colors.onPrimary}
      />
    </View>
  );
};

export default HomeScreen;

// src/screens/user/HomeScreen.tsx - VERSIONE CON DATI REALI DA FIREBASE
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

// ✅ USA SOLO FIREBASE AUTH E USERDATA
import { useAuth } from '../../hooks/useAuth';
import { useUserData } from '../../hooks/useUserData';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Nuovo sistema di temi
  const { colors, isDark, toggleTheme } = useAppThemeManager();
  const { dynamicStyles } = useThemedStyles();
  
  // ✅ USA HOOKS PER DATI REALI
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
      await refreshData();
      console.log('✅ HomeScreen: onRefresh completato');
    } catch (error) {
      console.error('❌ HomeScreen: onRefresh errore:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

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
  if (!user || dataLoading || authLoading) {
    console.log('⚠️ HomeScreen: loading state, showing loading...');
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
          {!user ? 'Caricamento profilo...' : 'Caricamento dati...'}
        </Text>
      </View>
    );
  }

  // ✅ COSTRUISCI IL NOME UTENTE CON FALLBACK SICURO
  const userName = user?.displayName || 
                  `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
                  user?.email?.split('@')[0] ||
                  'Utente';

  // ✅ DATI REALI DA FIREBASE - sostituisce userStats mockup
  const userStats = {
    totalCars: stats.vehiclesCount,
    totalMaintenance: stats.maintenanceCount,
    totalExpenses: stats.totalExpenses + stats.totalFuelCost, // Combina spese e carburante
    upcomingMaintenance: stats.remindersCount,
    overdueItems: stats.overdueReminders,
    lastMaintenanceDate: recentMaintenance[0] ? new Date(recentMaintenance[0].completedDate?.toDate?.() || recentMaintenance[0].completedDate).toLocaleDateString('it-IT') : 'N/A',
    nextServiceDate: upcomingReminders[0] ? new Date(upcomingReminders[0].dueDate?.toDate?.() || upcomingReminders[0].dueDate).toLocaleDateString('it-IT') : 'N/A',
    monthlyExpenses: stats.totalExpenses, // Spese del mese
  };

  // ✅ ATTIVITÀ RECENTI REALI DA FIREBASE
  const recentActivities = [
    // Manutenzioni recenti
    ...recentMaintenance.slice(0, 2).map((maintenance, index) => ({
      id: `maintenance_${maintenance.id}`,
      type: 'maintenance',
      title: maintenance.description || maintenance.type,
      car: vehicles.find(v => v.id === maintenance.vehicleId)?.make + ' ' + vehicles.find(v => v.id === maintenance.vehicleId)?.model || 'Auto',
      date: new Date(maintenance.completedDate?.toDate?.() || maintenance.completedDate).toLocaleDateString('it-IT'),
      cost: maintenance.cost || 0,
      icon: Wrench,
      color: colors.primary,
    })),
    
    // Rifornimenti recenti
    ...recentFuelRecords.slice(0, 1).map((fuel, index) => ({
      id: `fuel_${fuel.id}`,
      type: 'fuel',
      title: 'Rifornimento',
      car: vehicles.find(v => v.id === fuel.vehicleId)?.make + ' ' + vehicles.find(v => v.id === fuel.vehicleId)?.model || 'Auto',
      date: new Date(fuel.date?.toDate?.() || fuel.date).toLocaleDateString('it-IT'),
      cost: fuel.totalCost || 0,
      icon: Fuel,
      color: colors.tertiary,
    })),
    
    // Spese recenti
    ...recentExpenses.slice(0, 1).map((expense, index) => ({
      id: `expense_${expense.id}`,
      type: 'expense',
      title: expense.description || expense.category,
      car: vehicles.find(v => v.id === expense.vehicleId)?.make + ' ' + vehicles.find(v => v.id === expense.vehicleId)?.model || 'Auto',
      date: new Date(expense.date?.toDate?.() || expense.date).toLocaleDateString('it-IT'),
      cost: expense.amount || 0,
      icon: DollarSign,
      color: colors.secondary,
    })),
  ].slice(0, 3); // Mostra solo le prime 3 attività

  // ✅ MANUTENZIONI IN SCADENZA REALI DA FIREBASE
  const upcomingMaintenances = upcomingReminders.slice(0, 3).map(reminder => ({
    id: reminder.id,
    title: reminder.title,
    car: vehicles.find(v => v.id === reminder.vehicleId)?.make + ' ' + vehicles.find(v => v.id === reminder.vehicleId)?.model || 'Auto',
    dueDate: new Date(reminder.dueDate?.toDate?.() || reminder.dueDate).toLocaleDateString('it-IT'),
    type: reminder.type || 'scheduled',
    priority: reminder.priority || 'medium',
  }));

  // ✅ FORMATO MONETA ITALIANO
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

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

    // Empty state
    emptyState: {
      alignItems: 'center',
      padding: 40,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: 16,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: 8,
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
          <Text style={styles.activityCost}>{formatCurrency(activity.cost)}</Text>
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

  // Componente EmptyState
  const EmptyState = ({ icon: Icon, title, subtitle }: any) => (
    <View style={styles.emptyState}>
      <Icon size={48} color={colors.onSurfaceVariant} />
      <Text style={styles.emptyStateText}>{title}</Text>
      <Text style={styles.emptyStateSubtext}>{subtitle}</Text>
    </View>
  );

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
              {hasVehicles ? `${stats.vehiclesCount} ${stats.vehiclesCount === 1 ? 'auto registrata' : 'auto registrate'}` : 'Inizia registrando la tua prima auto'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => handleNavigation('Reminders')}
            >
              <Bell size={20} color={colors.primary} />
              {stats.remindersCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationCount}>
                    {stats.remindersCount > 99 ? '99+' : stats.remindersCount}
                  </Text>
                </View>
              )}
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
              label={userStats.totalCars === 1 ? "Auto" : "Auto"}
              color={colors.primary}
            />
            <StatCard
              icon={Wrench}
              number={userStats.totalMaintenance}
              label={userStats.totalMaintenance === 1 ? "Manutenzione" : "Manutenzioni"}
              color={colors.secondary}
            />
            <StatCard
              icon={DollarSign}
              number={formatCurrency(userStats.totalExpenses)}
              label="Spese Totali"
              color={colors.tertiary}
            />
            <StatCard
              icon={hasOverdueReminders ? AlertCircle : Clock}
              number={userStats.upcomingMaintenance}
              label={hasOverdueReminders ? "Scadute" : "Scadenze"}
              color={hasOverdueReminders ? colors.error : colors.warning}
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
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))
          ) : (
            <EmptyState
              icon={Activity}
              title="Nessuna attività recente"
              subtitle="Le tue manutenzioni e rifornimenti appariranno qui"
            />
          )}
        </View>

        {/* Upcoming Maintenance */}
        <View style={styles.maintenanceSection}>
          <Text style={styles.sectionTitle}>
            {hasOverdueReminders ? "Scadenze importanti" : "Prossime scadenze"}
          </Text>
          {upcomingMaintenances.length > 0 ? (
            upcomingMaintenances.map((maintenance) => (
              <MaintenanceCard key={maintenance.id} maintenance={maintenance} />
            ))
          ) : (
            <EmptyState
              icon={Calendar}
              title="Nessuna scadenza programmata"
              subtitle="Aggiungi promemoria per non dimenticare le manutenzioni"
            />
          )}
        </View>

        {/* Messaggio di errore se presente */}
        {dataError && (
          <Card style={{ backgroundColor: colors.errorContainer, margin: 16, padding: 16 }}>
            <Text style={{ color: colors.onErrorContainer }}>
              Errore nel caricamento dati: {dataError}
            </Text>
            <Button 
              mode="text" 
              onPress={refreshData}
              textColor={colors.onErrorContainer}
              style={{ marginTop: 8 }}
            >
              Riprova
            </Button>
          </Card>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => Alert.alert('Menu Rapido', 'Scegli cosa aggiungere', [
          { text: 'Nuova Auto', onPress: () => handleNavigation('AddCar') },
          { text: 'Manutenzione', onPress: () => handleNavigation('AddMaintenance') },
          { text: 'Rifornimento', onPress: () => handleNavigation('AddFuel') },
          { text: 'Spesa', onPress: () => handleNavigation('AddExpense') },
          { text: 'Annulla', style: 'cancel' },
        ])}
        color={colors.onPrimary}
      />
    </View>
  );
};

export default HomeScreen;

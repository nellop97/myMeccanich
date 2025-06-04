// src/screens/user/UserDashboardScreen.tsx
import { useNavigation } from '@react-navigation/native';
import {
  AlertTriangle,
  Bell,
  Calendar,
  Car,
  ChevronRight,
  DollarSign,
  FileText,
  Fuel,
  MapPin,
  Plus,
  Search,
  Settings,
  TrendingUp,
  User,
  Wrench,
  Zap,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useStore } from '../../store';
import { useUserCarsStore, UserCar, MaintenanceRecord, Expense } from '../../store/userCarsStore';

const { width: screenWidth } = Dimensions.get('window');

const UserDashboardScreen = () => {
  const navigation = useNavigation();
  const { user, darkMode } = useStore();
  const { 
    cars, 
    getAllCarsStats, 
    getOverdueMaintenance, 
    getUpcomingMaintenance,
    getExpiringDocuments,
    getActiveReminders 
  } = useUserCarsStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const isDesktop = Platform.OS === 'web' && screenWidth > 768;

  const theme = {
    background: darkMode ? '#111827' : '#f3f4f6',
    cardBackground: darkMode ? '#1f2937' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#9ca3af' : '#6b7280',
    border: darkMode ? '#374151' : '#e5e7eb',
    accent: '#2563eb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  };

  const stats = getAllCarsStats();
  const activeCars = cars.filter(car => car.isActive);
  const overdueMaintenance = getOverdueMaintenance();
  const upcomingMaintenance = getUpcomingMaintenance();
  const expiringDocuments = getExpiringDocuments(undefined, 30);
  const activeReminders = getActiveReminders();

  const onRefresh = async () => {
    setRefreshing(true);
    // Simula un refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buongiorno';
    if (hour < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, iconColor, onPress, alert = false }: any) => (
    <TouchableOpacity
      style={[
        styles.statCard, 
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
        alert && { borderColor: theme.error, borderWidth: 2 }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.statCardContent}>
        <View style={[styles.statIcon, { backgroundColor: iconColor + '20' }]}>
          <Icon size={20} color={iconColor} />
        </View>
        <View style={styles.statInfo}>
          <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
          <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.statSubtitle, { color: alert ? theme.error : theme.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <ChevronRight size={16} color={theme.textSecondary} />
    </TouchableOpacity>
  );

  const QuickActionCard = ({ title, icon: Icon, iconColor, onPress }: any) => (
    <TouchableOpacity
      style={[styles.quickActionCard, { backgroundColor: iconColor + '20', borderColor: iconColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon size={24} color={iconColor} />
      <Text style={[styles.quickActionText, { color: iconColor }]}>{title}</Text>
    </TouchableOpacity>
  );

  const CarCard = ({ car }: { car: UserCar }) => {
    const carStats = useUserCarsStore.getState().getCarStats(car.id);
    const carOverdue = getOverdueMaintenance(car.id);
    const carExpiring = getExpiringDocuments(car.id, 7);
    const hasIssues = carOverdue.length > 0 || carExpiring.length > 0;

    return (
      <TouchableOpacity
        style={[
          styles.carCard, 
          { backgroundColor: theme.cardBackground, borderColor: theme.border },
          hasIssues && { borderColor: theme.warning, borderWidth: 2 }
        ]}
        onPress={() => navigation.navigate('CarDetail', { carId: car.id })}
        activeOpacity={0.7}
      >
        <View style={styles.carCardHeader}>
          <View style={styles.carMainInfo}>
            <Text style={[styles.carName, { color: theme.text }]}>
              {car.make} {car.model}
            </Text>
            <Text style={[styles.carDetails, { color: theme.textSecondary }]}>
              {car.year} • {car.licensePlate}
            </Text>
            <Text style={[styles.carMileage, { color: theme.textSecondary }]}>
              {car.currentMileage.toLocaleString()} km
            </Text>
          </View>
          {hasIssues && (
            <View style={[styles.alertBadge, { backgroundColor: theme.warning + '20' }]}>
              <AlertTriangle size={16} color={theme.warning} />
            </View>
          )}
        </View>

        <View style={styles.carStatsRow}>
          <View style={styles.carStat}>
            <Wrench size={14} color={theme.accent} />
            <Text style={[styles.carStatValue, { color: theme.text }]}>
              {carStats.maintenanceCount}
            </Text>
            <Text style={[styles.carStatLabel, { color: theme.textSecondary }]}>
              Interventi
            </Text>
          </View>
          
          <View style={styles.carStat}>
            <DollarSign size={14} color={theme.success} />
            <Text style={[styles.carStatValue, { color: theme.text }]}>
              {formatCurrency(carStats.totalExpenses)}
            </Text>
            <Text style={[styles.carStatLabel, { color: theme.textSecondary }]}>
              Spese
            </Text>
          </View>
          
          <View style={styles.carStat}>
            <Calendar size={14} color={theme.warning} />
            <Text style={[styles.carStatValue, { color: theme.text }]}>
              {carStats.nextMaintenanceDate ? formatDate(carStats.nextMaintenanceDate) : '--'}
            </Text>
            <Text style={[styles.carStatLabel, { color: theme.textSecondary }]}>
              Prossimo
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ActivityItem = ({ type, title, subtitle, date, amount, carName }: any) => {
    const getIcon = () => {
      switch (type) {
        case 'maintenance': return <Wrench size={16} color={theme.accent} />;
        case 'expense': return <DollarSign size={16} color={theme.success} />;
        case 'document': return <FileText size={16} color={theme.warning} />;
        default: return <Car size={16} color={theme.textSecondary} />;
      }
    };

    return (
      <View style={styles.activityItem}>
        <View style={[styles.activityIcon, { backgroundColor: theme.accent + '20' }]}>
          {getIcon()}
        </View>
        <View style={styles.activityContent}>
          <Text style={[styles.activityTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.activitySubtitle, { color: theme.textSecondary }]}>
            {subtitle} • {carName}
          </Text>
          <Text style={[styles.activityDate, { color: theme.textSecondary }]}>
            {formatDate(date)} {amount && `• ${formatCurrency(amount)}`}
          </Text>
        </View>
      </View>
    );
  };

  // Combina attività recenti
  const getRecentActivities = () => {
    const activities: any[] = [];
    
    cars.forEach(car => {
      // Manutenzioni recenti
      car.maintenanceRecords.slice(-3).forEach(maintenance => {
        activities.push({
          id: `maintenance-${maintenance.id}`,
          type: 'maintenance',
          title: maintenance.description,
          subtitle: 'Intervento completato',
          date: maintenance.date,
          amount: maintenance.cost,
          carName: `${car.make} ${car.model}`,
          timestamp: new Date(maintenance.date).getTime()
        });
      });
      
      // Spese recenti
      car.expenses.slice(-3).forEach(expense => {
        activities.push({
          id: `expense-${expense.id}`,
          type: 'expense',
          title: expense.description,
          subtitle: `Spesa ${expense.category}`,
          date: expense.date,
          amount: expense.amount,
          carName: `${car.make} ${car.model}`,
          timestamp: new Date(expense.date).getTime()
        });
      });
    });
    
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  };

  const recentActivities = getRecentActivities();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>
            {getGreeting()},
          </Text>
          <Text style={[styles.userName, { color: theme.text }]}>
            {user.name?.split(' ')[0] || 'Utente'}!
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={24} color={theme.text} />
            {activeReminders.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{activeReminders.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Settings size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Barra di ricerca */}
        <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Search size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Cerca auto, interventi, spese..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Alerts importanti */}
        {(overdueMaintenance.length > 0 || expiringDocuments.length > 0) && (
          <View style={[styles.alertsCard, { backgroundColor: theme.error + '10', borderColor: theme.error }]}>
            <View style={styles.alertsHeader}>
              <AlertTriangle size={20} color={theme.error} />
              <Text style={[styles.alertsTitle, { color: theme.error }]}>
                Richiede la tua attenzione
              </Text>
            </View>
            
            {overdueMaintenance.length > 0 && (
              <TouchableOpacity 
                style={styles.alertItem}
                onPress={() => navigation.navigate('MaintenanceCalendar')}
              >
                <Text style={[styles.alertText, { color: theme.text }]}>
                  {overdueMaintenance.length} manutenzione/i scaduta/e
                </Text>
                <ChevronRight size={16} color={theme.error} />
              </TouchableOpacity>
            )}
            
            {expiringDocuments.length > 0 && (
              <TouchableOpacity 
                style={styles.alertItem}
                onPress={() => navigation.navigate('Documents')}
              >
                <Text style={[styles.alertText, { color: theme.text }]}>
                  {expiringDocuments.length} documento/i in scadenza
                </Text>
                <ChevronRight size={16} color={theme.error} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Statistiche principali */}
        <View style={styles.statsSection}>
          <StatCard
            title="Totale Auto"
            value={stats.totalCars}
            subtitle={`${stats.carsNeedingAttention} richiedono attenzione`}
            icon={Car}
            iconColor={stats.carsNeedingAttention > 0 ? theme.warning : theme.accent}
            onPress={() => navigation.navigate('MyCars')}
            alert={stats.carsNeedingAttention > 0}
          />
          
          <StatCard
            title="Spese Totali"
            value={formatCurrency(stats.totalExpenses)}
            subtitle="Tutte le auto"
            icon={DollarSign}
            iconColor={theme.success}
            onPress={() => navigation.navigate('ExpenseReports')}
          />
          
          <StatCard
            title="Promemoria"
            value={stats.activeReminders}
            subtitle={upcomingMaintenance.length > 0 ? `${upcomingMaintenance.length} manutenzioni in arrivo` : 'Tutto aggiornato'}
            icon={Bell}
            iconColor={stats.activeReminders > 0 ? theme.warning : theme.success}
            onPress={() => navigation.navigate('Reminders')}
            alert={stats.activeReminders > 0}
          />
        </View>

        {/* Azioni rapide */}
        <View style={[styles.quickActionsCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Azioni Rapide</Text>
          
          <View style={styles.quickActionsGrid}>
            <QuickActionCard
              title="Aggiungi Spesa"
              icon={Fuel}
              iconColor={theme.success}
              onPress={() => navigation.navigate('AddExpense')}
            />
            
            <QuickActionCard
              title="Nuovo Intervento"
              icon={Wrench}
              iconColor={theme.accent}
              onPress={() => navigation.navigate('AddMaintenance')}
            />
            
            <QuickActionCard
              title="Calendario"
              icon={Calendar}
              iconColor={theme.warning}
              onPress={() => navigation.navigate('MaintenanceCalendar')}
            />
            
            <QuickActionCard
              title="Aggiungi Auto"
              icon={Plus}
              iconColor={theme.textSecondary}
              onPress={() => navigation.navigate('AddCar')}
            />
          </View>
        </View>

        {/* Le tue auto */}
        <View style={[styles.carsSection, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Le Tue Auto</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyCars')}>
              <Text style={[styles.seeAllText, { color: theme.accent }]}>Vedi tutte</Text>
            </TouchableOpacity>
          </View>

          {activeCars.length === 0 ? (
            <View style={styles.emptyState}>
              <Car size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
                Nessuna auto registrata
              </Text>
              <Text style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}>
                Aggiungi la tua prima auto per iniziare
              </Text>
              <TouchableOpacity
                style={[styles.emptyActionButton, { backgroundColor: theme.accent }]}
                onPress={() => navigation.navigate('AddCar')}
              >
                <Plus size={20} color="#ffffff" />
                <Text style={styles.emptyActionButtonText}>Aggiungi Auto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carsScroll}>
              {activeCars.slice(0, 3).map(car => (
                <CarCard key={car.id} car={car} />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Attività recenti */}
        <View style={[styles.activitySection, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Attività Recenti</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: theme.accent }]}>Vedi tutto</Text>
            </TouchableOpacity>
          </View>

          {recentActivities.length === 0 ? (
            <View style={styles.emptyActivity}>
              <Text style={[styles.emptyActivityText, { color: theme.textSecondary }]}>
                Nessuna attività recente
              </Text>
            </View>
          ) : (
            recentActivities.map(activity => (
              <ActivityItem key={activity.id} {...activity} />
            ))
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  notificationButton: {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  alertsCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 16,
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  alertText: {
    fontSize: 14,
    flex: 1,
  },
  statsSection: {
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    padding: 10,
    borderRadius: 8,
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  statSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  quickActionsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  carsSection: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  carsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  carCard: {
    width: 200,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
  },
  carCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  carMainInfo: {
    flex: 1,
  },
  carName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  carDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  carMileage: {
    fontSize: 14,
    fontWeight: '500',
  },
  alertBadge: {
    padding: 6,
    borderRadius: 6,
  },
  carStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  carStat: {
    alignItems: 'center',
    flex: 1,
  },
  carStatValue: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 2,
  },
  carStatLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  activitySection: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityIcon: {
    padding: 8,
    borderRadius: 8,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyActionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyActivityText: {
    fontSize: 14,
  },
});

export default UserDashboardScreen;
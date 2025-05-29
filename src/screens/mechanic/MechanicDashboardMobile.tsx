import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Search, Wrench, Calendar, FileText, DollarSign } from 'lucide-react-native';
import { useStore } from '../../store';
import { useWorkshopStore } from '../../store/workshopStore';

// VERSIONE MOBILE - Dashboard Meccanico
// Ottimizzata per dispositivi mobili
// Header e sidebar gestiti da CustomHeaderMechanic in AppNavigator

const { width: screenWidth } = Dimensions.get('window');
const SIDEBAR_WIDTH = 280;

const MechanicDashboardMobile = () => {
  // Utilizzo degli store Zustand
  const { user, darkMode } = useStore();
  const { cars, updateRepairStatus } = useWorkshopStore();
  
  // Stato UI locale rimosso - ora gestito da CustomHeaderMechanic
  // const [activeTab, setActiveTab] = React.useState('dashboard');
  // const [sidebarVisible, setSidebarVisible] = React.useState(false);
  
  // Animazione per la sidebar
  const sidebarAnimation = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.timing(sidebarAnimation, {
      toValue: sidebarVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [sidebarVisible]);
  
  // Funzioni di utilità per estrarre i dati
  const carsInWorkshop = cars.filter(car => 
    car.repairs.some(repair => repair.status === 'in-progress')
  );
  
  const pendingRepairs = cars.flatMap(car => 
    car.repairs
      .filter(repair => repair.status === 'pending')
      .map(repair => ({ 
        carId: car.id, 
        repairId: repair.id, 
        car, 
        repair,
        plate: car.licensePlate || 'N/A',
        date: repair.scheduledDate,
        owner: car.owner || 'N/A',
        type: repair.description
      }))
  );
  
  const pendingInvoices = cars.flatMap(car => 
    car.repairs
      .filter(repair => repair.status === 'completed')
      .map(repair => ({
        id: repair.id,
        carId: car.id,
        plate: car.licensePlate || 'N/A',
        owner: car.owner || 'N/A',
        amount: repair.totalCost,
        date: new Date().toLocaleDateString('it-IT'),
        status: 'Da emettere'
      }))
  );
  
  // Statistiche meccanico
  const mechanicStats = {
    carsInWorkshop: carsInWorkshop.length,
    appointments: pendingRepairs.length,
    pendingInvoices: pendingInvoices.length,
    monthlyRevenue: pendingInvoices.reduce((acc, invoice) => acc + invoice.amount, 0),
    appointmentsToday: pendingRepairs.filter(item => {
      const today = new Date().toISOString().split('T')[0];
      return item.date === today;
    }).length,
    overdueInvoices: 2,
    monthlyGrowth: 12
  };
  
  // Funzioni rimosse - ora gestite da CustomHeaderMechanic
  // const handleAddNewCar, toggleSidebar, etc.

  const theme = {
    background: darkMode ? '#111827' : '#f3f4f6',
    cardBackground: darkMode ? '#1f2937' : '#ffffff',
    sidebarBackground: darkMode ? '#1f2937' : '#1e40af',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#9ca3af' : '#6b7280',
    border: darkMode ? '#374151' : '#e5e7eb',
    overlay: 'rgba(0, 0, 0, 0.5)',
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, iconBg, iconColor }) => (
    <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <View style={styles.statCardHeader}>
        <Text style={[styles.statCardTitle, { color: theme.textSecondary }]}>{title}</Text>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <Icon size={20} color={iconColor} />
        </View>
      </View>
      <Text style={[styles.statCardValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statCardSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      
      <View style={styles.mainContainer}>
        {/* Header e Sidebar ora gestiti da CustomHeaderMechanic */}

        {/* Search Bar Mobile */}
        <View style={[styles.searchBarMobile, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Search size={18} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Cerca auto..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInputMobile, { color: theme.text }]}
          />
        </View>
        
        {/* Main Content */}
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Stats Grid Mobile */}
          <View style={styles.statsGridMobile}>
            <StatCard
              title="Auto in Officina"
              value={mechanicStats.carsInWorkshop}
              subtitle="+2 rispetto a ieri"
              icon={Wrench}
              iconBg={darkMode ? '#1e3a8a' : '#dbeafe'}
              iconColor={darkMode ? '#60a5fa' : '#2563eb'}
            />
            <StatCard
              title="Appuntamenti"
              value={mechanicStats.appointments}
              subtitle={`${mechanicStats.appointmentsToday} per oggi`}
              icon={Calendar}
              iconBg={darkMode ? '#581c87' : '#e9d5ff'}
              iconColor={darkMode ? '#a855f7' : '#7c3aed'}
            />
            <StatCard
              title="Fatture da Emettere"
              value={mechanicStats.pendingInvoices}
              subtitle={`${mechanicStats.overdueInvoices} scadute`}
              icon={FileText}
              iconBg={darkMode ? '#92400e' : '#fef3c7'}
              iconColor={darkMode ? '#f59e0b' : '#d97706'}
            />
            <StatCard
              title="Fatturato Mensile"
              value={`€${mechanicStats.monthlyRevenue.toFixed(2)}`}
              subtitle={`+${mechanicStats.monthlyGrowth}% rispetto al mese scorso`}
              icon={DollarSign}
              iconBg={darkMode ? '#065f46' : '#d1fae5'}
              iconColor={darkMode ? '#10b981' : '#059669'}
            />
          </View>
          
          {/* Cars in workshop */}
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Auto in Officina</Text>
              <TouchableOpacity>
                <Text style={styles.cardLink}>Visualizza tutte</Text>
              </TouchableOpacity>
            </View>
            
            {cars.map(car => (
              car.repairs.filter(repair => repair.status === 'in-progress' || repair.status === 'pending').map(repair => (
                <View key={`${car.id}-${repair.id}`} style={[styles.carCard, { borderColor: theme.border }]}>
                  <View style={styles.carCardHeader}>
                    <Text style={[styles.carPlate, { color: theme.text }]}>{car.licensePlate || 'N/A'}</Text>
                    <View style={[
                      styles.statusBadge,
                      {
                        backgroundColor: repair.status === 'in-progress' 
                          ? (darkMode ? '#1e3a8a' : '#dbeafe')
                          : (darkMode ? '#92400e' : '#fef3c7')
                      }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        {
                          color: repair.status === 'in-progress'
                            ? (darkMode ? '#60a5fa' : '#2563eb')
                            : (darkMode ? '#f59e0b' : '#d97706')
                        }
                      ]}>
                        {repair.status === 'in-progress' ? 'In lavorazione' : 'In attesa'}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={[styles.carModel, { color: theme.text }]}>{car.model}</Text>
                  <Text style={[styles.carOwner, { color: theme.textSecondary }]}>{car.owner || 'N/A'}</Text>
                  <Text style={[styles.carDate, { color: theme.textSecondary }]}>{repair.scheduledDate}</Text>
                  <Text style={[styles.carDescription, { color: theme.textSecondary }]}>{repair.description}</Text>
                  
                  <TouchableOpacity
                    style={styles.actionButtonMobile}
                    onPress={() => updateRepairStatus(
                      car.id,
                      repair.id,
                      repair.status === 'in-progress' ? 'completed' : 'in-progress'
                    )}
                  >
                    <Text style={styles.actionButtonText}>
                      {repair.status === 'in-progress' ? 'Completa' : 'Inizia Lavoro'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            ))}
          </View>
        </ScrollView>

        {/* Sidebar e Modal ora gestiti da CustomHeaderMechanic */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  notificationText: {
    color: '#d97706',
    fontSize: 12,
    marginLeft: 4,
  },
  addButtonMobile: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
  },
  searchBarMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInputMobile: {
    flex: 1,
    fontSize: 16,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsGridMobile: {
    marginVertical: 16,
  },
  statCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statCardTitle: {
    fontSize: 14,
    flex: 1,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 8,
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statCardSubtitle: {
    fontSize: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardLink: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  carCard: {
    padding: 16,
    borderTopWidth: 1,
  },
  carCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  carPlate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  carModel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  carOwner: {
    fontSize: 14,
    marginBottom: 2,
  },
  carDate: {
    fontSize: 14,
    marginBottom: 2,
  },
  carDescription: {
    fontSize: 14,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  actionButtonMobile: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  overlayTouchable: {
    flex: 1,
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    padding: 16,
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 1000,
  },
  sidebarHeader: {
    marginBottom: 24,
    paddingTop: 40,
  },
  sidebarTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  sidebarSubtitle: {
    fontSize: 14,
    color: '#93c5fd',
    marginTop: 4,
  },
  sidebarNav: {
    flex: 1,
  },
  sidebarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  sidebarButtonActive: {
    // backgroundColor set dynamically
  },
  sidebarButtonText: {
    color: '#ffffff',
    marginLeft: 12,
    fontSize: 16,
  },
  sidebarFooter: {
    paddingBottom: 40,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  userAvatar: {
    width: 40,
    height: 40,
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 16,
  },
  userRole: {
    color: '#93c5fd',
    fontSize: 12,
  },
  themeButton: {
    backgroundColor: '#1e40af',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  themeButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
});

export default MechanicDashboardMobile;
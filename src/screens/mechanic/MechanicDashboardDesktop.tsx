import { Bell, Calendar, Car, ChevronRight, DollarSign, FileText, PlusCircle, Search, Settings, Wrench } from 'lucide-react-native';
import React from 'react';
import {
  Dimensions,
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
import { useWorkshopStore } from '../../store/workshopStore';

// VERSIONE DESKTOP - Dashboard Meccanico
// Layout fisso con sidebar sempre visibile, ottimizzata per schermi grandi

const { width: screenWidth } = Dimensions.get('window');
const SIDEBAR_WIDTH = 250;

const MechanicDashboardDesktop = () => {
  // Utilizzo degli store Zustand
  const { user, darkMode, toggleDarkMode } = useStore();
  const { cars, addCar, updateRepairStatus } = useWorkshopStore();
  
  // Stato UI locale per la navigazione tra tab
  const [activeTab, setActiveTab] = React.useState('dashboard');
  
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
  
  // Funzioni per interagire con lo stato
  const handleAddNewCar = () => {
    const newCarId = addCar({
      model: 'Nuova Auto',
      vin: `VIN-${Date.now()}`,
      licensePlate: `NUOVA-${Date.now().toString().slice(-4)}`,
      owner: 'Nuovo Cliente'
    });
    console.log('Nuova auto aggiunta con ID:', newCarId);
  };
  
  const handleCompleteInvoice = (carId, repairId) => {
    console.log(`Fattura emessa per riparazione ${repairId} dell'auto ${carId}`);
  };

  const theme = {
    background: darkMode ? '#111827' : '#f3f4f6',
    cardBackground: darkMode ? '#1f2937' : '#ffffff',
    sidebarBackground: darkMode ? '#1f2937' : '#1e40af',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#9ca3af' : '#6b7280',
    border: darkMode ? '#374151' : '#e5e7eb',
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

  const SidebarButton = ({ title, icon: Icon, isActive, onPress }) => (
    <TouchableOpacity
      style={[
        styles.sidebarButton,
        isActive && styles.sidebarButtonActive,
        { backgroundColor: isActive ? (darkMode ? '#374151' : '#1d4ed8') : 'transparent' }
      ]}
      onPress={onPress}
    >
      <Icon size={20} color="#ffffff" />
      <Text style={styles.sidebarButtonText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      
      <View style={styles.mainContainer}>
        {/* Sidebar Desktop - sempre visibile */}
        <View style={[styles.sidebar, { backgroundColor: theme.sidebarBackground }]}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>AutoGestione</Text>
            <Text style={styles.sidebarSubtitle}>Pannello Officina</Text>
          </View>
          
          <View style={styles.sidebarNav}>
            <SidebarButton
              title="Dashboard"
              icon={Wrench}
              isActive={activeTab === 'dashboard'}
              onPress={() => setActiveTab('dashboard')}
            />
            <SidebarButton
              title="Appuntamenti"
              icon={Calendar}
              isActive={activeTab === 'appointments'}
              onPress={() => setActiveTab('appointments')}
            />
            <SidebarButton
              title="Fatturazione"
              icon={FileText}
              isActive={activeTab === 'invoices'}
              onPress={() => setActiveTab('invoices')}
            />
            <SidebarButton
              title="Archivio Auto"
              icon={Car}
              isActive={activeTab === 'archive'}
              onPress={() => setActiveTab('archive')}
            />
            <SidebarButton
              title="Impostazioni"
              icon={Settings}
              isActive={activeTab === 'settings'}
              onPress={() => setActiveTab('settings')}
            />
          </View>
          
          <View style={styles.sidebarFooter}>
            <View style={styles.userProfile}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {user.name ? user.name.substring(0, 2).toUpperCase() : 'MG'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name || 'Mario Galli'}</Text>
                <Text style={styles.userRole}>
                  {user.isMechanic ? 'Meccanico' : 'Utente'}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.themeButton}
              onPress={toggleDarkMode}
            >
              <Text style={styles.themeButtonText}>
                {darkMode ? 'Modalità Chiara' : 'Modalità Scura'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Main content Desktop */}
        <View style={styles.mainContent}>
          {/* Header Desktop */}
          <View style={[styles.header, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                Buongiorno, {user.name?.split(' ')[0] || 'Mario'}!
              </Text>
              <View style={styles.notificationBadge}>
                <Bell size={16} color="#d97706" />
                <Text style={styles.notificationText}>3 notifiche</Text>
              </View>
            </View>
            
            <View style={styles.headerRight}>
              <View style={styles.searchContainer}>
                <Search size={18} color={theme.textSecondary} style={styles.searchIcon} />
                <TextInput
                  placeholder="Cerca auto..."
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.searchInput, { color: theme.text, borderColor: theme.border }]}
                />
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddNewCar}
              >
                <PlusCircle size={18} color="#ffffff" />
                <Text style={styles.addButtonText}>Nuova Auto</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Dashboard content Desktop */}
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Stats Grid Desktop - 4 colonne */}
            <View style={styles.statsGrid}>
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
            
            {/* Cars in workshop Desktop - Tabella */}
            <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Auto in Officina</Text>
                <TouchableOpacity style={styles.cardLinkContainer}>
                  <Text style={styles.cardLink}>Visualizza tutte</Text>
                  <ChevronRight size={16} color="#2563eb" />
                </TouchableOpacity>
              </View>
              
              {/* Table Header Desktop */}
              <View style={[styles.tableHeader, { backgroundColor: darkMode ? '#374151' : '#f9fafb' }]}>
                <Text style={[styles.tableHeaderCell, { color: theme.textSecondary }]}>Targa</Text>
                <Text style={[styles.tableHeaderCell, { color: theme.textSecondary }]}>Auto</Text>
                <Text style={[styles.tableHeaderCell, { color: theme.textSecondary }]}>Proprietario</Text>
                <Text style={[styles.tableHeaderCell, { color: theme.textSecondary }]}>Arrivo</Text>
                <Text style={[styles.tableHeaderCell, { color: theme.textSecondary }]}>Problema</Text>
                <Text style={[styles.tableHeaderCell, { color: theme.textSecondary }]}>Stato</Text>
                <Text style={[styles.tableHeaderCell, { color: theme.textSecondary }]}>Azioni</Text>
              </View>
              
              {/* Table Body Desktop */}
              {cars.map(car => (
                car.repairs.filter(repair => repair.status === 'in-progress' || repair.status === 'pending').map(repair => (
                  <View key={`${car.id}-${repair.id}`} style={[styles.tableRow, { borderColor: theme.border }]}>
                    <Text style={[styles.tableCell, { color: theme.text }]}>{car.licensePlate || 'N/A'}</Text>
                    <Text style={[styles.tableCell, { color: theme.text }]}>{car.model}</Text>
                    <Text style={[styles.tableCell, { color: theme.text }]}>{car.owner || 'N/A'}</Text>
                    <Text style={[styles.tableCell, { color: theme.text }]}>{repair.scheduledDate}</Text>
                    <Text style={[styles.tableCell, { color: theme.text }]}>{repair.description}</Text>
                    <View style={styles.tableCellStatus}>
                      <View style={[
                        styles.statusBadgeDesktop,
                        {
                          backgroundColor: repair.status === 'in-progress' 
                            ? (darkMode ? '#1e3a8a' : '#dbeafe')
                            : (darkMode ? '#92400e' : '#fef3c7')
                        }
                      ]}>
                        <Text style={[
                          styles.statusTextDesktop,
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
                    <View style={styles.tableCellAction}>
                      <TouchableOpacity
                        style={styles.actionButton}
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
                  </View>
                ))
              ))}
            </View>
            
            {/* Two-column layout Desktop - Prossimi interventi e Fatture */}
            <View style={styles.twoColumnLayout}>
              {/* Upcoming maintenance */}
              <View style={[styles.columnCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <View style={styles.columnCardHeader}>
                  <Text style={[styles.columnCardTitle, { color: theme.text }]}>Prossimi Interventi</Text>
                  <TouchableOpacity style={styles.cardLinkContainer}>
                    <Text style={styles.cardLink}>Calendario</Text>
                    <ChevronRight size={16} color="#2563eb" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.columnCardContent} showsVerticalScrollIndicator={false}>
                  {pendingRepairs.slice(0, 3).map(item => (
                    <View key={`${item.carId}-${item.repairId}`} style={[styles.listItem, { borderColor: theme.border }]}>
                      <View style={[styles.listItemIcon, { backgroundColor: darkMode ? '#1e3a8a' : '#dbeafe' }]}>
                        <Calendar size={20} color={darkMode ? '#60a5fa' : '#2563eb'} />
                      </View>
                      <View style={styles.listItemContent}>
                        <Text style={[styles.listItemTitle, { color: theme.text }]}>{item.plate} - {item.car.model}</Text>
                        <Text style={[styles.listItemSubtitle, { color: theme.textSecondary }]}>{item.owner} • {item.type}</Text>
                      </View>
                      <View style={styles.listItemRight}>
                        <Text style={[styles.listItemDate, { color: '#2563eb' }]}>{item.date}</Text>
                        <TouchableOpacity>
                          <Text style={[styles.listItemAction, { color: theme.textSecondary }]}>Dettagli</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.columnCardFooter}>
                  <TouchableOpacity>
                    <Text style={styles.addItemButton}>+ Aggiungi Intervento</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Pending invoices */}
              <View style={[styles.columnCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <View style={styles.columnCardHeader}>
                  <Text style={[styles.columnCardTitle, { color: theme.text }]}>Fatture in Sospeso</Text>
                  <TouchableOpacity style={styles.cardLinkContainer}>
                    <Text style={styles.cardLink}>Gestione Fatture</Text>
                    <ChevronRight size={16} color="#2563eb" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.columnCardContent} showsVerticalScrollIndicator={false}>
                  {pendingInvoices.slice(0, 3).map(invoice => (
                    <View key={invoice.id} style={[styles.listItem, { borderColor: theme.border }]}>
                      <View style={[styles.listItemIcon, { backgroundColor: darkMode ? '#92400e' : '#fef3c7' }]}>
                        <FileText size={20} color={darkMode ? '#f59e0b' : '#d97706'} />
                      </View>
                      <View style={styles.listItemContent}>
                        <Text style={[styles.listItemTitle, { color: theme.text }]}>{invoice.plate} - {invoice.owner}</Text>
                        <Text style={[styles.listItemSubtitle, { color: theme.textSecondary }]}>{invoice.date} • {invoice.status}</Text>
                      </View>
                      <View style={styles.listItemRight}>
                        <Text style={[styles.listItemAmount, { color: theme.text }]}>€{invoice.amount.toFixed(2)}</Text>
                        <TouchableOpacity
                          style={styles.invoiceButton}
                          onPress={() => handleCompleteInvoice(invoice.carId, invoice.id)}
                        >
                          <Text style={styles.invoiceButtonText}>Emetti</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.columnCardFooter}>
                  <TouchableOpacity>
                    <Text style={styles.addItemButton}>+ Nuova Fattura</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
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
    flexDirection: 'row',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    padding: 16,
  },
  sidebarHeader: {
    marginBottom: 32,
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
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
    marginTop: 32,
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
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  notificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginLeft: 16,
  },
  notificationText: {
    color: '#d97706',
    fontSize: 14,
    marginLeft: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 40,
    paddingRight: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    width: 200,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    marginLeft: 8,
    fontWeight: '500',
  },
  scrollContent: {
    flex: 1,
    padding: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 6,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statCardTitle: {
    fontSize: 14,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 8,
  },
  statCardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
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
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLink: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
  },
  tableCellStatus: {
    flex: 1,
    alignItems: 'flex-start',
  },
  tableCellAction: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statusBadgeDesktop: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusTextDesktop: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  twoColumnLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  columnCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 6,
  },
  columnCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  columnCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  columnCardContent: {
    maxHeight: 300,
  },
  columnCardFooter: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 14,
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  listItemDate: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  listItemAction: {
    fontSize: 14,
  },
  listItemAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  invoiceButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  invoiceButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  addItemButton: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MechanicDashboardDesktop;
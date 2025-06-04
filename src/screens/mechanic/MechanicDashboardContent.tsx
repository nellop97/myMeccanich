// src/components/mechanic/MechanicDashboardContent.tsx
import {
    Bell,
    Calendar,
    ChevronRight,
    DollarSign,
    FileText,
    PlusCircle,
    Search,
    Wrench,
} from 'lucide-react-native';
import React from 'react';
import {
    Alert,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useStore } from '../../store';
import { useWorkshopStore } from '../../store/workshopStore';
import { useNavigation } from '@react-navigation/native';
import { useInvoicingStore } from '../../store/invoicingStore';

const { width: screenWidth } = Dimensions.get('window');

const MechanicDashboardContent = () => {
  const { user, darkMode } = useStore();
  const navigation = useNavigation();
  const { cars, updateRepairStatus, addCar } = useWorkshopStore();
  const { getFatturesByRepair } = useInvoicingStore();

  const isDesktop = Platform.OS === 'web' && screenWidth > 768;

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
      .filter(repair => repair.status === 'completed' 
        //&& !hasInvoice(car.id, repair.id) TODO
      )
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

  const handleCreateInvoiceFromRepair = (carId: string, repairId: string) => {
    // Verifica se esiste già una fattura per questa riparazione
    const existingInvoices = getFatturesByRepair(carId, repairId);

    if (existingInvoices.length > 0) {
      Alert.alert(
        'Fattura esistente',
        'Esiste già una fattura per questa riparazione. Vuoi visualizzarla?',
        [
          { text: 'Annulla', style: 'cancel' },
          {
            text: 'Visualizza',
            onPress: () => navigation.navigate('InvoiceDetail', { invoiceId: existingInvoices[0].id })
          }
        ]
      );
    } else {
      // Crea una nuova fattura
      navigation.navigate('CreateInvoice', { carId, repairId });
    }
  };

  const hasInvoice = (carId: string, repairId: string) => {
    return getFatturesByRepair(carId, repairId).length > 0;
  };

  const theme = {
    background: darkMode ? '#111827' : '#f3f4f6',
    cardBackground: darkMode ? '#1f2937' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#9ca3af' : '#6b7280',
    border: darkMode ? '#374151' : '#e5e7eb',
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, iconBg, iconColor }: any) => (
    <View style={[
      styles.statCard,
      isDesktop && styles.statCardDesktop,
      { backgroundColor: theme.cardBackground, borderColor: theme.border }
    ]}>
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
      {/* Header Desktop - solo per desktop */}
      {isDesktop && (
        <View style={[styles.headerDesktop, { backgroundColor: theme.cardBackground }]}>
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
              onPress={() => navigation.navigate('NewAppointment')}
            >
              <PlusCircle size={18} color="#ffffff" />
              <Text style={styles.addButtonText}>Nuova Auto</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Search Bar Mobile - solo per mobile */}
      {!isDesktop && (
        <View style={[styles.searchBarMobile, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Search size={18} color={theme.textSecondary} style={styles.searchIconMobile} />
          <TextInput
            placeholder="Cerca auto..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInputMobile, { color: theme.text }]}
          />
        </View>
      )}

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View style={[styles.statsGrid, !isDesktop && styles.statsGridMobile]}>
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
            <TouchableOpacity
              style={styles.cardLinkContainer}
              onPress={() => navigation.navigate('AllCarsInWorkshop' as never)}
            >
              <Text style={styles.cardLink}>Visualizza tutte</Text>
              <ChevronRight size={16} color="#2563eb" />
            </TouchableOpacity>
          </View>

          {isDesktop ? (
            // Tabella Desktop
            <>
              <View style={[styles.tableHeader, { backgroundColor: darkMode ? '#374151' : '#f9fafb' }]}>
                <Text style={[styles.tableHeaderCell, { color: theme.textSecondary }]}>Targa</Text>
                <Text style={[styles.tableHeaderCell, { color: theme.textSecondary }]}>Auto</Text>
                <Text style={[styles.tableHeaderCell, { color: theme.textSecondary }]}>Proprietario</Text>
                <Text style={[styles.tableHeaderCell, { color: theme.textSecondary }]}>Arrivo</Text>
                <Text style={[styles.tableHeaderCell, { color: theme.textSecondary }]}>Problema</Text>
                <Text style={[styles.tableHeaderCell, { color: theme.textSecondary }]}>Stato</Text>
                <Text style={[styles.tableHeaderCell, { color: theme.textSecondary }]}>Azioni</Text>
              </View>

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
            </>
          ) : (
            // Cards Mobile
            <>
              {cars.map(car => (
                car.repairs.filter(repair => repair.status === 'in-progress' || repair.status === 'pending').map(repair => (
                  <View key={`${car.id}-${repair.id}`} style={[styles.carCard, { borderColor: theme.border }]}>
                    <View style={styles.carCardHeader}>
                      <Text style={[styles.carPlate, { color: theme.text }]}>{car.licensePlate || 'N/A'}</Text>
                      <View style={styles.statusContainer}>
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
                        {/* Indicatore fattura per riparazioni completate */}
                        {repair.status === 'completed' && hasInvoice(car.id, repair.id) && (
                          <View style={[styles.invoiceIndicator, { backgroundColor: darkMode ? '#065f46' : '#d1fae5' }]}>
                            <FileText size={12} color={darkMode ? '#10b981' : '#059669'} />
                            <Text style={[styles.invoiceIndicatorText, { color: darkMode ? '#10b981' : '#059669' }]}>
                              Fatturata
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <Text style={[styles.carModel, { color: theme.text }]}>{car.model}</Text>
                    <Text style={[styles.carOwner, { color: theme.textSecondary }]}>{car.owner || 'N/A'}</Text>
                    <Text style={[styles.carDate, { color: theme.textSecondary }]}>{repair.scheduledDate}</Text>
                    <Text style={[styles.carDescription, { color: theme.textSecondary }]}>{repair.description}</Text>

                    <View style={styles.repairActions}>
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

                      {/* Pulsante per creare fattura se la riparazione è completata e non ha ancora fattura */}
                      {repair.status === 'completed' && !hasInvoice(car.id, repair.id) && (
                        <TouchableOpacity
                          style={[styles.actionButtonMobile, { backgroundColor: '#10b981', marginTop: 8 }]}
                          onPress={() => handleCreateInvoiceFromRepair(car.id, repair.id)}
                        >
                          <Text style={styles.actionButtonText}>Crea Fattura</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
              ))}
            </>
          )}
        </View>

        {/* Two-column layout */}
        <View style={[styles.twoColumnLayout, !isDesktop && styles.twoColumnLayoutMobile]}>
          {/* Upcoming maintenance */}
          <View style={[styles.columnCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={styles.columnCardHeader}>
              <Text style={[styles.columnCardTitle, { color: theme.text }]}>Prossimi Interventi</Text>
              <TouchableOpacity
                style={styles.cardLinkContainer}
                onPress={() => navigation.navigate('MechanicCalendar' as never)}
              >
                <Text style={styles.cardLink}>Calendario</Text>
                <ChevronRight size={16} color="#2563eb" />
              </TouchableOpacity>
            </View>
            <View style={styles.columnCardContent}>
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
            </View>
            <View style={styles.columnCardFooter}>
              <TouchableOpacity onPress={() => navigation.navigate('NewAppointment' as never)}>
                <Text style={styles.addItemButton}>+ Aggiungi Intervento</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pending Invoices */}
          <View style={[styles.columnCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={styles.columnCardHeader}>
              <Text style={[styles.columnCardTitle, { color: theme.text }]}>Fatture in Sospeso</Text>
              <TouchableOpacity
                style={styles.cardLinkContainer}
                onPress={() => navigation.navigate('InvoicingDashboard' as never)}
              >
                <Text style={styles.cardLink}>Gestione Fatture</Text>
                <ChevronRight size={16} color="#2563eb" />
              </TouchableOpacity>
            </View>
            <View style={styles.columnCardContent}>
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
                      onPress={() => handleCreateInvoiceFromRepair(invoice.carId, invoice.id)}
                    >
                      <Text style={styles.invoiceButtonText}>Crea Fattura</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.columnCardFooter}>
              <TouchableOpacity onPress={() => navigation.navigate('CreateInvoice' as never)}>
                <Text style={styles.addItemButton}>+ Nuova Fattura</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerDesktop: {
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
  searchIconMobile: {
    marginRight: 8,
  },
  searchInputMobile: {
    flex: 1,
    fontSize: 16,
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
  statsGridMobile: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  statCardDesktop: {
    padding: 24,
    marginHorizontal: 6,
    marginBottom: 0,
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
  repairActions: {
    marginTop: 12,
  },
  actionButtonMobile: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  twoColumnLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  twoColumnLayoutMobile: {
    flexDirection: 'column',
  },
  columnCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 6,
    marginBottom: 16,
  },
  columnCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
  invoiceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  invoiceIndicatorText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 2,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
});

export default MechanicDashboardContent;

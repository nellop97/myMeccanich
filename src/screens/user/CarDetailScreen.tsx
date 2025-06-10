import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Alert,
  Share
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Edit3,
  Share2,
  MoreVertical,
  Calendar,
  DollarSign,
  Wrench,
  Fuel,
  FileText,
  AlertTriangle,
  Clock,
  MapPin,
  Settings,
  TrendingUp,
  Plus,
  Activity,
  Book,
  BarChart3
} from 'lucide-react-native';

import { useStore } from '../../store';
import { useWorkshopStore } from '../../store/workshopStore'; // Changed from useUserCarsStore

const { width: screenWidth } = Dimensions.get('window');


// Esempio di come potresti dover definire un oggetto 'theme' di fallback o rimuovere i suoi usi:
const fallbackTheme = {
  background: '#ffffff',
  text: '#000000',
  primary: '#007bff',
  border: '#cccccc',
  cardBackground: '#f8f9fa',
  textSecondary: '#6c757d',
  error: '#dc3545',
  accent: '#ffc107',
  success: '#28a745',
  info: '#17a2b8',
  // ...aggiungi altre proprietà necessarie
};
// E poi usare fallbackTheme.background, fallbackTheme.primary, etc.

const CarDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { darkMode } = useStore();
  // Changed from getCarById, getCarStats, getOverdueMaintenance, getUpcomingMaintenance
  const { getCarById } = useWorkshopStore();

  const { carId } = route.params;
  const car = getCarById(carId);

  // Placeholder for stats and maintenance details as useWorkshopStore doesn't have these methods directly
  const stats = {
    maintenanceCount: car?.repairs.length || 0,
    totalExpenses: car?.repairs.reduce((sum, repair) => sum + repair.totalCost, 0) || 0,
    avgConsumption: null, // No fuel data in workshopStore
    nextMaintenanceDate: null, // Needs custom logic based on repairs
    overdueMaintenance: 0 // Needs custom logic
  };

  // Placeholder for overdueMaintenance and upcomingMaintenance
  const overdueMaintenance = [];
  const upcomingMaintenance = [];
  const hasIssues = overdueMaintenance.length > 0;


  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, maintenance, expenses, documents

  if (!car) {
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: fallbackTheme.background }]}>
          <View>
            <Text>Auto non trovata</Text>
            <Text>L'auto richiesta non è stata trovata</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text>Torna alla lista</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
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
      month: 'short',
      year: 'numeric'
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${car.model} (${car.year}) - ${car.licensePlate}\nChilometraggio: ${car.mileage?.toLocaleString()} km\nManutenzioni: ${stats.maintenanceCount}\nSpese totali: ${formatCurrency(stats.totalExpenses)}`,
        title: 'Dettagli Auto'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const TabButton = ({ id, title, active }: any) => (
      <TouchableOpacity
          style={[styles.tabButton, active && styles.tabButtonActive]}
          onPress={() => setActiveTab(id)}
      >
        <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
          {title}
        </Text>
      </TouchableOpacity>
  );

  const OverviewTab = () => (
      <View style={styles.tabContent}>
        <View style={styles.carInfoCard}>
          <View style={styles.carHeader}>
            <View style={styles.carMainInfo}>
              <Text style={styles.carTitle}>{car.model}</Text>
              <Text style={styles.carSubtitle}>{car.year} • {car.licensePlate}</Text>
              <Text style={styles.carMileage}>
                {car.mileage?.toLocaleString()} km
              </Text>
            </View>
            <View style={styles.carActions}>
              <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('EditCar', { carId })}
              >
                <Edit3 size={20} color={fallbackTheme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleShare}
              >
                <Share2 size={20} color={fallbackTheme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {(car.color || car.vin || car.owner) && ( // Changed purchaseDate to owner as per workshopStore
              <View style={styles.carDetailsSection}>
                <Text style={styles.sectionTitle}>Dettagli</Text>
                <View style={styles.detailsGrid}>
                  {car.color && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Colore</Text>
                        <Text style={styles.detailValue}>{car.color}</Text>
                      </View>
                  )}
                  {car.vin && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Telaio</Text>
                        <Text style={styles.detailValue}>{car.vin}</Text>
                      </View>
                  )}
                  {car.owner && ( // Changed purchaseDate to owner
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Proprietario</Text>
                        <Text style={styles.detailValue}>{car.owner}</Text>
                      </View>
                  )}
                </View>
              </View>
          )}
        </View>


        {hasIssues && (
            <View style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <AlertTriangle size={24} color={fallbackTheme.error} />
                <Text style={styles.alertTitle}>Richiede Attenzione</Text>
              </View>
              <Text style={styles.alertText}>
                {overdueMaintenance.length} manutenzioni scadute che necessitano attenzione immediata
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('MaintenanceList', { carId })}>
                <Text>Vedi Manutenzioni</Text>
              </TouchableOpacity>
            </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
             <View>
                <Text>Manutenzioni: {stats.maintenanceCount.toString()}</Text>
             </View>
            <View>
                <Text>Spese Totali: {formatCurrency(stats.totalExpenses)}</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View>
                <Text>Consumo Medio: {`${stats.avgConsumption?.toFixed(1) || '--'} L/100km`}</Text>
            </View>
            <View>
                <Text>Prossimo Servizio: {stats.nextMaintenanceDate ? formatDate(stats.nextMaintenanceDate) : 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.activitiesCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Attività Recenti</Text>
            <TouchableOpacity onPress={() => setActiveTab('maintenance')}>
              <Text style={styles.seeAllText}>Vedi tutto</Text>
            </TouchableOpacity>
          </View>

          {car.repairs.length === 0 ? ( // Changed from maintenanceRecords
             <View>
                <Text>Nessuna attività</Text>
                <Text>Le attività recenti appariranno qui</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AddMaintenance', { carId })}>
                    <Text>Aggiungi Manutenzione</Text>
                </TouchableOpacity>
             </View>
          ) : (
              <View style={styles.activitiesList}>
                {car.repairs.slice(0, 3).map((repair) => ( // Changed from maintenanceRecords
                   <View key={repair.id}>
                     <Text>{repair.description}</Text>
                     <Text>{`${formatDate(repair.scheduledDate)} • ${formatCurrency(repair.totalCost || 0)}`}</Text>
                     <Text>Status: {repair.status === 'completed' ? 'Completato' : repair.status === 'in-progress' ? 'In corso' : 'In attesa'}</Text>
                   </View>
                ))}
              </View>
          )}
        </View>
      </View>
  );

  const MaintenanceTab = () => (
      <View style={styles.tabContent}>
        <Text style={styles.comingSoonText}>Sezione Manutenzioni - In arrivo...</Text>
      </View>
  );

  const ExpensesTab = () => (
      <View style={styles.tabContent}>
        <Text style={styles.comingSoonText}>Sezione Spese - In arrivo...</Text>
      </View>
  );

  const DocumentsTab = () => (
      <View style={styles.tabContent}>
        <Text style={styles.comingSoonText}>Sezione Documenti - In arrivo...</Text>
      </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'maintenance': return <MaintenanceTab />;
      case 'expenses': return <ExpensesTab />;
      case 'documents': return <DocumentsTab />;
      default: return <OverviewTab />;
    }
  };

  return (
      <SafeAreaView style={[styles.container, { backgroundColor: fallbackTheme.background }]}>
        <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

        <View style={styles.header}>
          <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={fallbackTheme.text} />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>{car.model}</Text>
            <Text style={styles.headerSubtitle}>{car.licensePlate}</Text>
          </View>
          <TouchableOpacity
              style={styles.moreButton}
              onPress={() => {
                // Show action sheet
              }}
          >
            <MoreVertical size={24} color={fallbackTheme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TabButton id="overview" title="Panoramica" active={activeTab === 'overview'} />
            <TabButton id="maintenance" title="Manutenzioni" active={activeTab === 'maintenance'} />
            <TabButton id="expenses" title="Spese" active={activeTab === 'expenses'} />
            <TabButton id="documents" title="Documenti" active={activeTab === 'documents'} />
          </ScrollView>
        </View>

        <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={fallbackTheme.primary}
              />
            }
            showsVerticalScrollIndicator={false}
        >
          {renderTabContent()}
        </ScrollView>

        <View style={styles.quickActions}>
          <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('AddMaintenance', { carId })}
          >
            <Wrench size={24} color={fallbackTheme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('AddExpense', { carId })}
          >
            <DollarSign size={24} color={fallbackTheme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('AddFuel', { carId })}
          >
            <Fuel size={24} color={fallbackTheme.primary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={{ position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: fallbackTheme.primary, justifyContent: 'center', alignItems: 'center' }}
          onPress={() => navigation.navigate('AddMaintenance', { carId })}
        >
          <Plus size={24} color={'#ffffff'} />
        </TouchableOpacity>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: fallbackTheme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: fallbackTheme.border,
    backgroundColor: fallbackTheme.cardBackground,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: fallbackTheme.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: fallbackTheme.textSecondary,
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  tabsContainer: {
    backgroundColor: fallbackTheme.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: fallbackTheme.border,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: fallbackTheme.primary,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: fallbackTheme.textSecondary,
  },
  tabButtonTextActive: {
    color: fallbackTheme.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tabContent: {
    flex: 1,
  },
  carInfoCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: fallbackTheme.cardBackground,
    borderRadius: 8,
  },
  carHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  carMainInfo: {
    flex: 1,
  },
  carTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: fallbackTheme.text,
    marginBottom: 4,
  },
  carSubtitle: {
    fontSize: 16,
    color: fallbackTheme.textSecondary,
    marginBottom: 8,
  },
  carMileage: {
    fontSize: 18,
    fontWeight: '600',
    color: fallbackTheme.primary,
  },
  carActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: fallbackTheme.border,
  },
  carDetailsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: fallbackTheme.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: fallbackTheme.text,
    marginBottom: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
  },
  detailLabel: {
    fontSize: 14,
    color: fallbackTheme.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: fallbackTheme.text,
  },
  alertCard: {
    marginBottom: 16,
    borderWidth: 2,
    borderColor: fallbackTheme.error,
    padding: 16,
    backgroundColor: fallbackTheme.cardBackground,
    borderRadius: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: fallbackTheme.error,
    marginLeft: 12,
  },
  alertText: {
    fontSize: 14,
    color: fallbackTheme.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  statsSection: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  activitiesCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: fallbackTheme.cardBackground,
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: fallbackTheme.primary,
  },
  activitiesList: {
    gap: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: fallbackTheme.cardBackground,
    borderTopWidth: 1,
    borderTopColor: fallbackTheme.border,
  },
  quickActionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: fallbackTheme.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    color: fallbackTheme.textSecondary,
    textAlign: 'center',
    marginTop: 60,
  },
});

export default CarDetailScreen;
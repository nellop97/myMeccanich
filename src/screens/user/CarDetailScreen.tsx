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
  Share,
  Modal // Importato Modal
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
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
  BarChart3,
  X // Icona per chiudere il modal
} from 'lucide-react-native';

import { useStore } from '../../store';
import { useUserCarsStore } from '@/src/store/useCarsStore';

const { width: screenWidth } = Dimensions.get('window');

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
};

const CarDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { darkMode } = useStore();
  // Usa il hook corretto dallo store
  const { getCarById } = useUserCarsStore();

  const { carId } = route.params;
  const car = getCarById(carId);
  
  // Stato per gestire la visibilità del nuovo menu
  const [isActionMenuVisible, setActionMenuVisible] = useState(false);

  const stats = {
    maintenanceCount: car?.maintenanceRecords.length || 0,
    totalExpenses: car?.expenses.reduce((sum, expense) => sum + expense.amount, 0) || 0,
    avgConsumption: null,
    nextMaintenanceDate: null,
    overdueMaintenance: 0
  };

  const overdueMaintenance = [];
  const upcomingMaintenance = [];
  const hasIssues = overdueMaintenance.length > 0;

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  if (!car) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: fallbackTheme.background }]}>
        <View style={styles.centered}>
          <Text style={styles.headerTitle}>Auto non trovata</Text>
          <Text style={styles.headerSubtitle}>L'auto richiesta non è stata trovata.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Torna alla lista</Text>
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
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
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

  // Funzione per gestire la navigazione dal menu di azioni
  const handleActionNavigation = (screenName) => {
    setActionMenuVisible(false); // Chiude il menu
    navigation.navigate(screenName, { carId });
  };

  // ... (Componenti Tab non modificati)
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
              onPress={() => navigation.navigate('AddCar', { carId, mode: 'edit' })}
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

        {(car.color || car.vin || car.owner) && (
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
              {car.owner && (
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
        <TouchableOpacity 
          style={styles.alertCard}
          onPress={() => navigation.navigate('MaintenanceList', { carId, filter: 'overdue' })}
        >
          <View style={styles.alertHeader}>
            <AlertTriangle size={24} color={fallbackTheme.error} />
            <Text style={styles.alertTitle}>Attenzione Richiesta</Text>
          </View>
          <Text style={styles.alertText}>
            Hai {overdueMaintenance.length} manutenzioni scadute che richiedono la tua attenzione.
          </Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('MaintenanceList', { carId, filter: 'overdue' })}
            style={[styles.actionButton, { backgroundColor: fallbackTheme.error }]}
          >
            <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>
              Vedi Manutenzioni
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Statistiche</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: fallbackTheme.primary + '20' }]}>
            <Wrench size={20} color={fallbackTheme.primary} />
            <Text style={styles.statValue}>{stats.maintenanceCount}</Text>
            <Text style={styles.statLabel}>Manutenzioni</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: fallbackTheme.accent + '20' }]}>
            <DollarSign size={20} color={fallbackTheme.accent} />
            <Text style={styles.statValue}>{formatCurrency(stats.totalExpenses)}</Text>
            <Text style={styles.statLabel}>Spese Totali</Text>
          </View>
        </View>
      </View>

      <View style={styles.activitiesCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Attività Recenti</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('MaintenanceList', { carId })}
          >
            <Text style={styles.seeAllText}>Vedi tutte</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.activitiesList}>
          <Text style={styles.comingSoonText}>Nessuna attività recente</Text>
        </View>
      </View>
    </View>
  );

  const MaintenanceTab = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity 
        style={[styles.primaryButton, { marginBottom: 16 }]}
        onPress={() => navigation.navigate('AddMaintenance', { carId })}
      >
        <Plus size={20} color="#ffffff" />
        <Text style={styles.primaryButtonText}>Aggiungi Manutenzione</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('MaintenanceList', { carId })}>
        <Text style={styles.seeAllText}>Vai alla lista completa delle manutenzioni →</Text>
      </TouchableOpacity>
    </View>
  );

  const ExpensesTab = () => (
    <View style={styles.tabContent}>
       <TouchableOpacity 
        style={[styles.primaryButton, { marginBottom: 16 }]}
        onPress={() => navigation.navigate('AddExpense', { carId })}
      >
        <Plus size={20} color="#ffffff" />
        <Text style={styles.primaryButtonText}>Aggiungi Spesa</Text>
      </TouchableOpacity>
      <Text style={styles.comingSoonText}>Gestione spese in arrivo...</Text>
    </View>
  );
  
  const DocumentsTab = () => (
      <View style={styles.tabContent}>
          {/* ... */}
      </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: fallbackTheme.background }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={fallbackTheme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Dettagli Auto</Text>
          <Text style={styles.headerSubtitle}>{car.licensePlate}</Text>
        </View>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Alert.alert('Info', 'Le altre funzionalità saranno disponibili a breve!')}
        >
          <MoreVertical size={20} color={fallbackTheme.textSecondary} />
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
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'maintenance' && <MaintenanceTab />}
        {activeTab === 'expenses' && <ExpensesTab />}
        {activeTab === 'documents' && <DocumentsTab />}
      </ScrollView>
      
      {/* Menu Modal */}
      <Modal
        transparent={true}
        visible={isActionMenuVisible}
        animationType="fade"
        onRequestClose={() => setActionMenuVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setActionMenuVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Aggiungi nuovo...</Text>
            
            <TouchableOpacity style={styles.modalButton} onPress={() => handleActionNavigation('AddMaintenance')}>
              <Wrench size={22} color={fallbackTheme.primary} />
              <Text style={styles.modalButtonText}>Aggiungi Manutenzione</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalButton} onPress={() => handleActionNavigation('AddExpense')}>
              <DollarSign size={22} color={fallbackTheme.primary} />
              <Text style={styles.modalButtonText}>Aggiungi Spesa</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalButton} onPress={() => handleActionNavigation('AddFuel')}>
              <Fuel size={22} color={fallbackTheme.primary} />
              <Text style={styles.modalButtonText}>Aggiungi Rifornimento</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setActionMenuVisible(false)}>
              <X size={20} color={fallbackTheme.textSecondary} />
              <Text style={styles.modalCloseButtonText}>Chiudi</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Pulsante Flottante (FAB) che ora apre il menu */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setActionMenuVisible(true)}
      >
        <Plus size={24} color={'#ffffff'} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fallbackTheme.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
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
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: fallbackTheme.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: fallbackTheme.textSecondary,
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
  comingSoonText: {
    fontSize: 16,
    color: fallbackTheme.textSecondary,
    textAlign: 'center',
    marginTop: 60,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: fallbackTheme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  // Stili per il Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: fallbackTheme.cardBackground,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: fallbackTheme.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: fallbackTheme.background,
    marginBottom: 10,
  },
  modalButtonText: {
    fontSize: 18,
    color: fallbackTheme.text,
    marginLeft: 15,
    fontWeight: '500',
  },
  modalCloseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginTop: 10,
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: fallbackTheme.textSecondary,
    marginLeft: 8,
  },
});

export default CarDetailScreen;
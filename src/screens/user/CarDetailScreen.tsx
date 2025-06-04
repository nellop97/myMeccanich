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

import {
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  ModernCard,
  StatCard,
  ListItem,
  FloatingActionButton,
  EmptyState,
  theme
} from '../../components/shared/GlobalComponents';

import { useStore } from '../../store';
import { useUserCarsStore } from '../../store/userCarsStore';

const { width: screenWidth } = Dimensions.get('window');

const CarDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { darkMode } = useStore();
  const { getCarById, getCarStats, getOverdueMaintenance, getUpcomingMaintenance } = useUserCarsStore();

  const { carId } = route.params;
  const car = getCarById(carId);
  const stats = getCarStats(carId);

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, maintenance, expenses, documents

  if (!car) {
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          <EmptyState
              icon={AlertTriangle}
              title="Auto non trovata"
              subtitle="L'auto richiesta non è stata trovata"
              actionTitle="Torna alla lista"
              onAction={() => navigation.goBack()}
          />
        </SafeAreaView>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const overdueMaintenance = getOverdueMaintenance(carId);
  const upcomingMaintenance = getUpcomingMaintenance(carId);
  const hasIssues = overdueMaintenance.length > 0;

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
        message: `${car.make} ${car.model} (${car.year}) - ${car.licensePlate}\nChilometraggio: ${car.currentMileage?.toLocaleString()} km\nManutenzioni: ${stats.maintenanceCount}\nSpese totali: ${formatCurrency(stats.totalExpenses)}`,
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
        {/* Car Info Card */}
        <ModernCard style={styles.carInfoCard}>
          <View style={styles.carHeader}>
            <View style={styles.carMainInfo}>
              <Text style={styles.carTitle}>{car.make} {car.model}</Text>
              <Text style={styles.carSubtitle}>{car.year} • {car.licensePlate}</Text>
              <Text style={styles.carMileage}>
                {car.currentMileage?.toLocaleString()} km
              </Text>
            </View>
            <View style={styles.carActions}>
              <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('EditCar', { carId })}
              >
                <Edit3 size={20} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleShare}
              >
                <Share2 size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Car Details */}
          {(car.color || car.vin || car.purchaseDate) && (
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
                  {car.purchaseDate && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Acquisto</Text>
                        <Text style={styles.detailValue}>{formatDate(car.purchaseDate)}</Text>
                      </View>
                  )}
                </View>
              </View>
          )}
        </ModernCard>

        {/* Alerts */}
        {hasIssues && (
            <ModernCard style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <AlertTriangle size={24} color={theme.error} />
                <Text style={styles.alertTitle}>Richiede Attenzione</Text>
              </View>
              <Text style={styles.alertText}>
                {overdueMaintenance.length} manutenzioni scadute che necessitano attenzione immediata
              </Text>
              <PrimaryButton
                  title="Vedi Manutenzioni"
                  variant="error"
                  size="small"
                  onPress={() => navigation.navigate('MaintenanceList', { carId })}
              />
            </ModernCard>
        )}

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <StatCard
                title="Manutenzioni"
                value={stats.maintenanceCount.toString()}
                icon={Wrench}
                iconColor={theme.accent}
                onPress={() => navigation.navigate('MaintenanceList', { carId })}
            />
            <StatCard
                title="Spese Totali"
                value={formatCurrency(stats.totalExpenses)}
                icon={DollarSign}
                iconColor={theme.success}
                onPress={() => navigation.navigate('ExpensesList', { carId })}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
                title="Consumo Medio"
                value={`${stats.avgConsumption?.toFixed(1) || '--'} L/100km`}
                icon={Fuel}
                iconColor={theme.info}
                onPress={() => navigation.navigate('FuelLog', { carId })}
            />
            <StatCard
                title="Prossimo Servizio"
                value={stats.nextMaintenanceDate ? formatDate(stats.nextMaintenanceDate) : 'N/A'}
                icon={Calendar}
                iconColor={stats.overdueMaintenance > 0 ? theme.error : theme.primary}
                alert={stats.overdueMaintenance > 0}
                onPress={() => navigation.navigate('MaintenanceCalendar', { carId })}
            />
          </View>
        </div>

        {/* Recent Activities */}
        <ModernCard style={styles.activitiesCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Attività Recenti</Text>
            <TouchableOpacity onPress={() => setActiveTab('maintenance')}>
              <Text style={styles.seeAllText}>Vedi tutto</Text>
            </TouchableOpacity>
          </View>

          {car.maintenanceRecords.length === 0 ? (
              <EmptyState
                  icon={Activity}
                  title="Nessuna attività"
                  subtitle="Le attività recenti appariranno qui"
                  actionTitle="Aggiungi Manutenzione"
                  onAction={() => navigation.navigate('AddMaintenance', { carId })}
              />
          ) : (
              <View style={styles.activitiesList}>
                {car.maintenanceRecords.slice(0, 3).map((maintenance) => (
                    <ListItem
                        key={maintenance.id}
                        title={maintenance.description}
                        subtitle={`${formatDate(maintenance.date)} • ${formatCurrency(maintenance.cost || 0)}`}
                        icon={Wrench}
                        iconColor={theme.accent}
                        onPress={() => navigation.navigate('MaintenanceDetail', {
                          carId,
                          maintenanceId: maintenance.id
                        })}
                        badge={maintenance.status === 'completed' ? 'Completato' : 'In corso'}
                    />
                ))}
              </View>
          )}
        </ModernCard>
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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>{car.make} {car.model}</Text>
            <Text style={styles.headerSubtitle}>{car.licensePlate}</Text>
          </View>
          <TouchableOpacity
              style={styles.moreButton}
              onPress={() => {
                // Show action sheet
              }}
          >
            <MoreVertical size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TabButton id="overview" title="Panoramica" active={activeTab === 'overview'} />
            <TabButton id="maintenance" title="Manutenzioni" active={activeTab === 'maintenance'} />
            <TabButton id="expenses" title="Spese" active={activeTab === 'expenses'} />
            <TabButton id="documents" title="Documenti" active={activeTab === 'documents'} />
          </ScrollView>
        </View>

        {/* Content */}
        <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.primary}
              />
            }
            showsVerticalScrollIndicator={false}
        >
          {renderTabContent()}
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('AddMaintenance', { carId })}
          >
            <Wrench size={24} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('AddExpense', { carId })}
          >
            <DollarSign size={24} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('AddFuel', { carId })}
          >
            <Fuel size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Floating Action Button */}
        <FloatingActionButton
            onPress={() => navigation.navigate('AddMaintenance', { carId })}
            icon={Plus}
        />
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.cardBackground,
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
    color: theme.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  tabsContainer: {
    backgroundColor: theme.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: theme.primary,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  tabButtonTextActive: {
    color: theme.primary,
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
    color: theme.text,
    marginBottom: 4,
  },
  carSubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  carMileage: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primary,
  },
  carActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.border,
  },
  carDetailsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
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
    color: theme.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  alertCard: {
    marginBottom: 16,
    borderWidth: 2,
    borderColor: theme.error,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.error,
    marginLeft: 12,
  },
  alertText: {
    fontSize: 14,
    color: theme.textSecondary,
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
    color: theme.primary,
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
    backgroundColor: theme.cardBackground,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  quickActionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 60,
  },
});

export default CarDetailScreen;

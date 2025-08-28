// src/screens/user/CarOverviewScreen.tsx
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  StyleSheet
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  AlertTriangle,
  Car,
  Calendar,
  Settings,
  Edit
} from 'lucide-react-native';

import { useStore } from '../../store';
import { useCarsStore } from '../../store/useCarsStore';

interface RouteParams {
  carId: string;
}

const CarOverviewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { carId } = route.params as RouteParams;
  const { darkMode } = useStore();
  const { getCarById, getCarStats } = useCarsStore();

  const [refreshing, setRefreshing] = useState(false);

  const car = getCarById(carId);
  const stats = getCarStats(carId);

  if (!car) {
    return null;
  }

  const fallbackTheme = {
    background: darkMode ? '#121212' : '#f5f5f5',
    cardBackground: darkMode ? '#1e1e1e' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#a0a0a0' : '#666666',
    primary: '#007AFF',
    border: darkMode ? '#333333' : '#e0e0e0',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500'
  };

  const onRefresh = () => {
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

  const overdueMaintenance = car.repairs?.filter(repair => 
    repair.status === 'scheduled' && new Date(repair.scheduledDate) < new Date()
  ) || [];

  const hasIssues = overdueMaintenance.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: fallbackTheme.background }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: fallbackTheme.cardBackground, borderBottomColor: fallbackTheme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={fallbackTheme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={[styles.headerTitle, { color: fallbackTheme.text }]}>Panoramica</Text>
          <Text style={[styles.headerSubtitle, { color: fallbackTheme.textSecondary }]}>{car.model}</Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditCar', { carId })}
        >
          <Edit size={20} color={fallbackTheme.textSecondary} />
        </TouchableOpacity>
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
        {/* Car Info Card */}
        <View style={[styles.carInfoCard, { backgroundColor: fallbackTheme.cardBackground }]}>
          <View style={styles.carHeader}>
            <View style={styles.carMainInfo}>
              <Text style={[styles.carTitle, { color: fallbackTheme.text }]}>{car.model}</Text>
              <Text style={[styles.carSubtitle, { color: fallbackTheme.textSecondary }]}>
                {car.year} • {car.licensePlate}
              </Text>
              <Text style={[styles.carMileage, { color: fallbackTheme.primary }]}>
                {car.mileage?.toLocaleString() || 0} km
              </Text>
            </View>
            <View style={styles.carActions}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: fallbackTheme.border }]}
                onPress={() => navigation.navigate('EditCar', { carId })}
              >
                <Settings size={20} color={fallbackTheme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Car Details */}
          <View style={[styles.carDetailsSection, { borderTopColor: fallbackTheme.border }]}>
            <Text style={[styles.sectionTitle, { color: fallbackTheme.text }]}>Dettagli Veicolo</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: fallbackTheme.textSecondary }]}>Marca</Text>
                <Text style={[styles.detailValue, { color: fallbackTheme.text }]}>{car.make}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: fallbackTheme.textSecondary }]}>Modello</Text>
                <Text style={[styles.detailValue, { color: fallbackTheme.text }]}>{car.model}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: fallbackTheme.textSecondary }]}>Anno</Text>
                <Text style={[styles.detailValue, { color: fallbackTheme.text }]}>{car.year}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: fallbackTheme.textSecondary }]}>Carburante</Text>
                <Text style={[styles.detailValue, { color: fallbackTheme.text }]}>{car.fuelType || 'Non specificato'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: fallbackTheme.textSecondary }]}>VIN</Text>
                <Text style={[styles.detailValue, { color: fallbackTheme.text }]}>{car.vin || 'Non disponibile'}</Text>
              </View>
              {car.owner && (
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: fallbackTheme.textSecondary }]}>Proprietario</Text>
                  <Text style={[styles.detailValue, { color: fallbackTheme.text }]}>{car.owner}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Alert Card */}
        {hasIssues && (
          <View style={[styles.alertCard, { backgroundColor: fallbackTheme.cardBackground, borderColor: fallbackTheme.error }]}>
            <View style={styles.alertHeader}>
              <AlertTriangle size={24} color={fallbackTheme.error} />
              <Text style={[styles.alertTitle, { color: fallbackTheme.error }]}>Richiede Attenzione</Text>
            </View>
            <Text style={[styles.alertText, { color: fallbackTheme.textSecondary }]}>
              {overdueMaintenance.length} manutenzioni scadute che necessitano attenzione immediata
            </Text>
            <TouchableOpacity 
              style={[styles.alertButton, { backgroundColor: fallbackTheme.error }]}
              onPress={() => navigation.navigate('CarMaintenance', { carId })}
            >
              <Text style={styles.alertButtonText}>Vedi Manutenzioni</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Stats */}
        <View style={[styles.statsSection, { backgroundColor: fallbackTheme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: fallbackTheme.text }]}>Statistiche Rapide</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: fallbackTheme.primary }]}>
                {stats.maintenanceCount.toString()}
              </Text>
              <Text style={[styles.statLabel, { color: fallbackTheme.textSecondary }]}>Manutenzioni</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: fallbackTheme.primary }]}>
                {formatCurrency(stats.totalExpenses)}
              </Text>
              <Text style={[styles.statLabel, { color: fallbackTheme.textSecondary }]}>Spese Totali</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: fallbackTheme.primary }]}>
                {`${stats.avgConsumption?.toFixed(1) || '--'} L/100km`}
              </Text>
              <Text style={[styles.statLabel, { color: fallbackTheme.textSecondary }]}>Consumo Medio</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: fallbackTheme.primary }]}>
                {stats.nextMaintenanceDate ? formatDate(stats.nextMaintenanceDate) : 'N/A'}
              </Text>
              <Text style={[styles.statLabel, { color: fallbackTheme.textSecondary }]}>Prossimo Servizio</Text>
            </View>
          </View>
        </View>

        {/* Recent Activities */}
        <View style={[styles.activitiesCard, { backgroundColor: fallbackTheme.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: fallbackTheme.text }]}>Attività Recenti</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CarMaintenance', { carId })}>
              <Text style={[styles.seeAllText, { color: fallbackTheme.primary }]}>Vedi tutto</Text>
            </TouchableOpacity>
          </View>

          {car.repairs?.length === 0 ? (
            <View style={styles.emptyState}>
              <Car size={48} color={fallbackTheme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: fallbackTheme.text }]}>Nessuna attività</Text>
              <Text style={[styles.emptySubtitle, { color: fallbackTheme.textSecondary }]}>
                Le attività recenti appariranno qui
              </Text>
              <TouchableOpacity 
                style={[styles.emptyButton, { backgroundColor: fallbackTheme.primary }]}
                onPress={() => navigation.navigate('AddMaintenance', { carId })}
              >
                <Text style={styles.emptyButtonText}>Aggiungi Manutenzione</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.activitiesList}>
              {car.repairs?.slice(0, 3).map((repair) => (
                <View key={repair.id} style={[styles.activityItem, { borderBottomColor: fallbackTheme.border }]}>
                  <View style={styles.activityInfo}>
                    <Text style={[styles.activityTitle, { color: fallbackTheme.text }]}>
                      {repair.description}
                    </Text>
                    <Text style={[styles.activityDetails, { color: fallbackTheme.textSecondary }]}>
                      {formatDate(repair.scheduledDate)} • {formatCurrency(repair.totalCost || 0)}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: repair.status === 'completed' ? fallbackTheme.success + '20' : fallbackTheme.warning + '20' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: repair.status === 'completed' ? fallbackTheme.success : fallbackTheme.warning }
                    ]}>
                      {repair.status === 'completed' ? 'Completato' : repair.status === 'in-progress' ? 'In corso' : 'In attesa'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  editButton: {
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  carInfoCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
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
    marginBottom: 4,
  },
  carSubtitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  carMileage: {
    fontSize: 18,
    fontWeight: '600',
  },
  carActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  carDetailsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  alertCard: {
    marginBottom: 16,
    borderWidth: 2,
    padding: 16,
    borderRadius: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  alertText: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  alertButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  alertButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  statsSection: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  activitiesCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
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
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  activitiesList: {
    gap: 8,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityDetails: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default CarOverviewScreen;
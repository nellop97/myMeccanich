// src/screens/user/CarMaintenanceScreen.tsx
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  Plus,
  Wrench,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Filter,
} from 'lucide-react-native';
import { FAB } from 'react-native-paper';
import { useAppThemeManager } from '../../hooks/useTheme';
import { useUserData } from '../../hooks/useUserData';

const CarMaintenanceScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useAppThemeManager();
  const { vehicles, recentMaintenance, stats } = useUserData();
  const carId = route.params?.carId;

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, completed, pending

  const car = vehicles.find(v => v.id === carId);

  if (!car) {
    return null;
  }

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh data
    setRefreshing(false);
  };

  // Filter maintenance records for this specific car
  const carMaintenance = recentMaintenance.filter(m => m.vehicleId === carId);

  // Maintenance categories
  const maintenanceCategories = [
    { id: 'oil', name: 'Cambio Olio', icon: '🛢️', color: '#FF9500' },
    { id: 'brakes', name: 'Freni', icon: '🔧', color: '#FF3B30' },
    { id: 'tires', name: 'Pneumatici', icon: '🎯', color: '#34C759' },
    { id: 'engine', name: 'Motore', icon: '⚙️', color: '#007AFF' },
    { id: 'inspection', name: 'Revisione', icon: '✅', color: '#5856D6' },
  ];

  const MaintenanceCard = ({ maintenance }: any) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed': return colors.success;
        case 'pending': return colors.warning;
        case 'overdue': return colors.error;
        default: return colors.onSurfaceVariant;
      }
    };

    return (
      <TouchableOpacity
        style={[styles.maintenanceCard, { backgroundColor: colors.surface }]}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardIcon}>
            <Wrench size={20} color={colors.primary} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
              {maintenance.description || maintenance.type}
            </Text>
            <Text style={[styles.cardDate, { color: colors.onSurfaceVariant }]}>
              {new Date(maintenance.completedDate?.toDate?.() || maintenance.completedDate).toLocaleDateString('it-IT')}
            </Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={[styles.cardCost, { color: colors.primary }]}>
              €{maintenance.cost?.toFixed(2) || '0.00'}
            </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(maintenance.status) + '20' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: getStatusColor(maintenance.status) }
              ]}>
                {maintenance.status === 'completed' ? 'Completato' : 'In corso'}
              </Text>
            </View>
          </View>
        </View>

        {maintenance.notes && (
          <Text style={[styles.cardNotes, { color: colors.onSurfaceVariant }]}>
            {maintenance.notes}
          </Text>
        )}

        {maintenance.workshopName && (
          <View style={styles.cardFooter}>
            <MapPin size={14} color={colors.onSurfaceVariant} />
            <Text style={[styles.workshopName, { color: colors.onSurfaceVariant }]}>
              {maintenance.workshopName}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
            Manutenzioni
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
            {car.make} {car.model}
          </Text>
        </View>
        <TouchableOpacity onPress={() => {}}>
          <Filter size={24} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[styles.statValue, { color: colors.onPrimaryContainer }]}>
              {carMaintenance.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.onPrimaryContainer }]}>
              Interventi Totali
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.secondaryContainer }]}>
            <Text style={[styles.statValue, { color: colors.onSecondaryContainer }]}>
              €{carMaintenance.reduce((sum, m) => sum + (m.cost || 0), 0).toFixed(0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.onSecondaryContainer }]}>
              Spesa Totale
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.tertiaryContainer }]}>
            <Text style={[styles.statValue, { color: colors.onTertiaryContainer }]}>
              {car.currentMileage?.toLocaleString() || '0'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.onTertiaryContainer }]}>
              Km Attuali
            </Text>
          </View>
        </View>

        {/* Quick Categories */}
        <View style={styles.categoriesSection}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
            Categorie Rapide
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
          >
            {maintenanceCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryCard, { backgroundColor: colors.surface }]}
                onPress={() => navigation.navigate('AddMaintenance', { 
                  carId, 
                  category: category.id 
                })}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[styles.categoryName, { color: colors.onSurface }]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Maintenance List */}
        <View style={styles.listSection}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
            Storico Manutenzioni
          </Text>

          {carMaintenance.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Wrench size={48} color={colors.onSurfaceVariant} />
              <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
                Nessuna manutenzione registrata
              </Text>
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                Inizia ad aggiungere le manutenzioni per tenere traccia della storia del tuo veicolo
              </Text>
            </View>
          ) : (
            carMaintenance.map((maintenance) => (
              <MaintenanceCard key={maintenance.id} maintenance={maintenance} />
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AddMaintenance', { carId })}
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
    justifyContent: 'space-between',
    padding: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  categoriesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
  },
  categoryCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
    minWidth: 100,
    elevation: 1,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
  },
  listSection: {
    padding: 16,
    paddingTop: 0,
  },
  maintenanceCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 12,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  cardCost: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  cardNotes: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  workshopName: {
    fontSize: 12,
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default CarMaintenanceScreen;
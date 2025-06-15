// src/screens/user/CarMaintenanceScreen.tsx
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  StyleSheet,
  TextInput,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  MapPin,
  Wrench,
  Filter
} from 'lucide-react-native';

import { useStore } from '../../store';
import { useUserCarsStore } from '@/src/store/useCarsStore';

const { width: screenWidth } = Dimensions.get('window');

interface RouteParams {
  carId: string;
}

const CarMaintenanceScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { carId } = route.params as RouteParams;
  const { darkMode } = useStore();
  const { getCarById, getCarStats } = useUserCarsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

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
    warning: '#FF9500',
    info: '#5AC8FA'
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return fallbackTheme.success;
      case 'in-progress': return fallbackTheme.info;
      case 'scheduled': return fallbackTheme.warning;
      default: return fallbackTheme.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completato';
      case 'in-progress': return 'In corso';
      case 'scheduled': return 'Programmato';
      default: return 'Sconosciuto';
    }
  };

  const maintenanceRecords = car.maintenanceRecords || [];
  
  const filteredRecords = maintenanceRecords.filter(record => {
    const matchesSearch = record.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || record.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const maintenanceStats = {
    totalCount: maintenanceRecords.length,
    completedCount: maintenanceRecords.filter(r => r.status === 'completed').length,
    inProgressCount: maintenanceRecords.filter(r => r.status === 'in-progress').length,
    scheduledCount: maintenanceRecords.filter(r => r.status === 'scheduled').length,
    totalCost: maintenanceRecords.reduce((sum, r) => sum + (r.cost || 0), 0)
  };

  // Modern Filter Component using Segmented Control style
  const FilterSegmentedControl = () => (
    <View style={[styles.segmentedControl, { backgroundColor: fallbackTheme.border }]}>
      {[
        { key: 'all', label: 'Tutte', count: maintenanceStats.totalCount },
        { key: 'completed', label: 'Completate', count: maintenanceStats.completedCount },
        { key: 'scheduled', label: 'Programmate', count: maintenanceStats.scheduledCount }
      ].map((filter) => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.segmentedOption,
            selectedFilter === filter.key && [
              styles.segmentedOptionActive,
              { backgroundColor: fallbackTheme.primary }
            ]
          ]}
          onPress={() => setSelectedFilter(filter.key)}
        >
          <Text style={[
            styles.segmentedOptionText,
            { color: selectedFilter === filter.key ? '#ffffff' : fallbackTheme.textSecondary }
          ]}>
            {filter.label}
          </Text>
          {filter.count > 0 && (
            <View style={[
              styles.segmentedBadge,
              { backgroundColor: selectedFilter === filter.key ? 'rgba(255,255,255,0.3)' : fallbackTheme.textSecondary + '20' }
            ]}>
              <Text style={[
                styles.segmentedBadgeText,
                { color: selectedFilter === filter.key ? '#ffffff' : fallbackTheme.textSecondary }
              ]}>
                {filter.count}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const StatsCards = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.statsContainer}
      contentContainerStyle={styles.statsContent}
    >
      <View style={[styles.statCard, { backgroundColor: fallbackTheme.cardBackground }]}>
        <View style={[styles.statIcon, { backgroundColor: fallbackTheme.success + '20' }]}>
          <DollarSign size={20} color={fallbackTheme.success} />
        </View>
        <Text style={[styles.statValue, { color: fallbackTheme.text }]}>
          {formatCurrency(maintenanceStats.totalCost)}
        </Text>
        <Text style={[styles.statLabel, { color: fallbackTheme.textSecondary }]}>
          Costo Totale
        </Text>
      </View>

      <View style={[styles.statCard, { backgroundColor: fallbackTheme.cardBackground }]}>
        <View style={[styles.statIcon, { backgroundColor: fallbackTheme.info + '20' }]}>
          <CheckCircle size={20} color={fallbackTheme.info} />
        </View>
        <Text style={[styles.statValue, { color: fallbackTheme.text }]}>
          {maintenanceStats.completedCount}
        </Text>
        <Text style={[styles.statLabel, { color: fallbackTheme.textSecondary }]}>
          Completate
        </Text>
      </View>

      <View style={[styles.statCard, { backgroundColor: fallbackTheme.cardBackground }]}>
        <View style={[styles.statIcon, { backgroundColor: fallbackTheme.warning + '20' }]}>
          <Clock size={20} color={fallbackTheme.warning} />
        </View>
        <Text style={[styles.statValue, { color: fallbackTheme.text }]}>
          {maintenanceStats.scheduledCount}
        </Text>
        <Text style={[styles.statLabel, { color: fallbackTheme.textSecondary }]}>
          Programmate
        </Text>
      </View>
    </ScrollView>
  );

  const MaintenanceCard = ({ record }: { record: any }) => {
    const statusColor = getStatusColor(record.status);
    const isOverdue = record.status === 'scheduled' && new Date(record.date) < new Date();

    return (
      <TouchableOpacity
        style={[
          styles.maintenanceCard,
          { backgroundColor: fallbackTheme.cardBackground },
          isOverdue && { borderLeftColor: fallbackTheme.error, borderLeftWidth: 4 }
        ]}
        onPress={() => navigation.navigate('MaintenanceDetail', {
          carId: record.carId || carId,
          maintenanceId: record.id
        })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.categoryIcon, { backgroundColor: statusColor + '20' }]}>
              <Wrench size={20} color={statusColor} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.maintenanceTitle, { color: fallbackTheme.text }]}>
                {record.description}
              </Text>
              <Text style={[styles.carInfo, { color: fallbackTheme.textSecondary }]}>
                {formatDate(record.date)}
              </Text>
            </View>
          </View>
          <View style={styles.cardHeaderRight}>
            <Text style={[styles.costText, { color: fallbackTheme.text }]}>
              {formatCurrency(record.cost || 0)}
            </Text>
            <View style={[styles.statusChip, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusText(record.status)}
              </Text>
            </View>
          </View>
        </View>

        {record.notes && (
          <Text style={[styles.notesText, { color: fallbackTheme.textSecondary }]}>
            {record.notes}
          </Text>
        )}

        {record.workshopName && (
          <View style={styles.workshopInfo}>
            <MapPin size={14} color={fallbackTheme.textSecondary} />
            <Text style={[styles.workshopText, { color: fallbackTheme.textSecondary }]}>
              {record.workshopName}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
          <Text style={[styles.headerTitle, { color: fallbackTheme.text }]}>
            Manutenzioni
          </Text>
          <Text style={[styles.headerSubtitle, { color: fallbackTheme.textSecondary }]}>
            {car.make} {car.model}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: fallbackTheme.cardBackground }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: fallbackTheme.background, borderColor: fallbackTheme.border }]}>
          <Search size={20} color={fallbackTheme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: fallbackTheme.text }]}
            placeholder="Cerca manutenzioni..."
            placeholderTextColor={fallbackTheme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Stats Cards */}
      <StatsCards />

      {/* Modern Segmented Filter */}
      <View style={styles.filterContainer}>
        <FilterSegmentedControl />
      </View>

      {/* Maintenance List */}
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
        {filteredRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <Wrench size={64} color={fallbackTheme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: fallbackTheme.text }]}>
              {searchQuery ? "Nessun risultato" : "Nessuna manutenzione"}
            </Text>
            <Text style={[styles.emptySubtitle, { color: fallbackTheme.textSecondary }]}>
              {searchQuery
                ? "Prova a modificare i criteri di ricerca"
                : "Non ci sono ancora manutenzioni registrate per questo veicolo"
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: fallbackTheme.primary }]}
                onPress={() => navigation.navigate('AddMaintenance', { carId })}
              >
                <Plus size={20} color="#ffffff" />
                <Text style={styles.emptyButtonText}>Aggiungi Manutenzione</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.maintenanceList}>
            {filteredRecords.map((record) => (
              <MaintenanceCard key={record.id} record={record} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: fallbackTheme.primary }]}
        onPress={() => navigation.navigate('AddMaintenance', { carId })}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>
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
  },
  backButton: {
    marginRight: 12,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  
  // Stats Cards
  statsContainer: {
    paddingVertical: 8,
  },
  statsContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  
  // Modern Segmented Control
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
  },
  segmentedOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  segmentedOptionActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentedOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  segmentedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  segmentedBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  content: {
    flex: 1,
    padding: 16,
  },
  maintenanceList: {
    gap: 12,
  },
  maintenanceCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  maintenanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  carInfo: {
    fontSize: 14,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  costText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  workshopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workshopText: {
    fontSize: 14,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default CarMaintenanceScreen;
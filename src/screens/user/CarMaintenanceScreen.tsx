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
  Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  MapPin,
  Wrench
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

  const maintenanceRecords = car.repairs || [];
  
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
    totalCost: maintenanceRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0)
  };

  const StatusBadge = ({ status, size = 'normal' }: { status: string; size?: 'small' | 'normal' }) => {
    const statusColor = getStatusColor(status);
    const statusText = getStatusText(status);
    
    return (
      <View style={[
        styles.statusBadge, 
        { backgroundColor: statusColor + '20' },
        size === 'small' && styles.statusBadgeSmall
      ]}>
        <Text style={[
          styles.statusText,
          { color: statusColor },
          size === 'small' && styles.statusTextSmall
        ]}>
          {statusText}
        </Text>
      </View>
    );
  };

  const MaintenanceCard = ({ record }: { record: any }) => {
    const statusColor = getStatusColor(record.status);
    const isOverdue = record.status === 'scheduled' && new Date(record.scheduledDate) < new Date();

    return (
      <TouchableOpacity
        style={[
          styles.maintenanceCard,
          { backgroundColor: fallbackTheme.cardBackground },
          isOverdue && { borderColor: fallbackTheme.error, borderWidth: 2 }
        ]}
        onPress={() => navigation.navigate('MaintenanceDetail', {
          carId: record.carId || carId,
          maintenanceId: record.id
        })}
      >
        {/* Header */}
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
                {car.make} {car.model} • {car.licensePlate}
              </Text>
            </View>
          </View>
          <View style={styles.cardHeaderRight}>
            <StatusBadge status={record.status} size="small" />
          </View>
        </View>

        {/* Details */}
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Calendar size={16} color={fallbackTheme.textSecondary} />
            <Text style={[styles.detailText, { color: fallbackTheme.textSecondary }]}>
              {record.status === 'completed' ? 'Eseguito' : 'Programmato'}: {formatDate(record.scheduledDate)}
            </Text>
          </View>

          {record.workshop && (
            <View style={styles.detailRow}>
              <MapPin size={16} color={fallbackTheme.textSecondary} />
              <Text style={[styles.detailText, { color: fallbackTheme.textSecondary }]}>
                {record.workshop}
              </Text>
            </View>
          )}

          {record.totalCost && (
            <View style={styles.detailRow}>
              <DollarSign size={16} color={fallbackTheme.textSecondary} />
              <Text style={[styles.detailText, { color: fallbackTheme.textSecondary }]}>
                {formatCurrency(record.totalCost)}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: fallbackTheme.primary + '20' }]}
            onPress={() => navigation.navigate('MaintenanceDetail', {
              carId: record.carId || carId,
              maintenanceId: record.id
            })}
          >
            <FileText size={16} color={fallbackTheme.primary} />
            <Text style={[styles.actionButtonText, { color: fallbackTheme.primary }]}>
              Dettagli
            </Text>
          </TouchableOpacity>
          
          {record.status !== 'completed' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: fallbackTheme.success + '20' }]}
              onPress={() => {
                // Logica per completare la manutenzione
              }}
            >
              <CheckCircle size={16} color={fallbackTheme.success} />
              <Text style={[styles.actionButtonText, { color: fallbackTheme.success }]}>
                Completa
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const FilterChip = ({ title, value, active, count }: any) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        { backgroundColor: active ? fallbackTheme.primary : fallbackTheme.border },
        active && styles.filterChipActive
      ]}
      onPress={() => setSelectedFilter(value)}
    >
      <Text style={[
        styles.filterChipText,
        { color: active ? '#ffffff' : fallbackTheme.textSecondary }
      ]}>
        {title}
        {count !== undefined && (
          <Text style={[styles.filterChipCount]}>
            {' '}({count})
          </Text>
        )}
      </Text>
    </TouchableOpacity>
  );

  const StatCard = ({ title, value, icon: Icon, iconColor, alert }: any) => (
    <View style={[styles.statCard, { backgroundColor: fallbackTheme.cardBackground }]}>
      <View style={[styles.statIcon, { backgroundColor: iconColor + '20' }]}>
        <Icon size={20} color={iconColor} />
      </View>
      <View style={styles.statInfo}>
        <Text style={[styles.statValue, { color: fallbackTheme.text }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: fallbackTheme.textSecondary }]}>{title}</Text>
      </View>
      {alert && (
        <View style={[styles.alertDot, { backgroundColor: fallbackTheme.error }]} />
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: fallbackTheme.background }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: fallbackTheme.cardBackground, borderBottomColor: fallbackTheme.border }]}>
        <View style={styles.headerLeft}>
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
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: fallbackTheme.cardBackground }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: fallbackTheme.background, borderColor: fallbackTheme.border }]}>
          <Search size={20} color={fallbackTheme.textSecondary} />
          <Text
            style={[styles.searchInput, { color: fallbackTheme.text }]}
            placeholder="Cerca manutenzioni..."
            placeholderTextColor={fallbackTheme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
          <StatCard
            title="Costo Totale"
            value={formatCurrency(maintenanceStats.totalCost)}
            icon={DollarSign}
            iconColor={fallbackTheme.success}
          />
          <StatCard
            title="Completate"
            value={maintenanceStats.completedCount.toString()}
            icon={CheckCircle}
            iconColor={fallbackTheme.success}
          />
          <StatCard
            title="In Corso"
            value={maintenanceStats.inProgressCount.toString()}
            icon={Clock}
            iconColor={fallbackTheme.info}
            alert={maintenanceStats.inProgressCount > 0}
          />
          <StatCard
            title="Programmate"
            value={maintenanceStats.scheduledCount.toString()}
            icon={AlertTriangle}
            iconColor={fallbackTheme.warning}
            alert={maintenanceStats.scheduledCount > 0}
          />
        </ScrollView>
      </View>

      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: fallbackTheme.cardBackground }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterChip
            title="Tutte"
            value="all"
            active={selectedFilter === 'all'}
            count={maintenanceStats.totalCount}
          />
          <FilterChip
            title="Completate"
            value="completed"
            active={selectedFilter === 'completed'}
            count={maintenanceStats.completedCount}
          />
          <FilterChip
            title="In Corso"
            value="in-progress"
            active={selectedFilter === 'in-progress'}
            count={maintenanceStats.inProgressCount}
          />
          <FilterChip
            title="Programmate"
            value="scheduled"
            active={selectedFilter === 'scheduled'}
            count={maintenanceStats.scheduledCount}
          />
        </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  statsContainer: {
    paddingVertical: 8,
  },
  statsScroll: {
    paddingHorizontal: 16,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 12,
    minWidth: 140,
    position: 'relative',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
  },
  alertDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filtersContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
  },
  filterChipActive: {},
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipCount: {
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  maintenanceList: {
    gap: 16,
  },
  maintenanceCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
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
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextSmall: {
    fontSize: 10,
  },
  cardDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default CarMaintenanceScreen;
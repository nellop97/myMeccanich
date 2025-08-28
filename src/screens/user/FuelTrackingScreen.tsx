// src/screens/user/FuelTrackingScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Fuel,
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  DollarSign,
  BarChart3,
  PieChart,
  Filter,
  Download,
  ChevronRight,
  Car,
  Gauge,
  Activity,
  Info,
  X,
  Search,
  ArrowUp,
  ArrowDown,
} from 'lucide-react-native';
import { FAB, Chip, ProgressBar } from 'react-native-paper';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useAppThemeManager } from '../../hooks/useTheme';
import { useUserData } from '../../hooks/useUserData';
import { db, auth } from '../../services/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';

const { width: screenWidth } = Dimensions.get('window');

interface FuelRecord {
  id: string;
  vehicleId: string;
  date: Date;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  mileage: number;
  station?: string;
  location?: string;
  fuelType: 'gasoline' | 'diesel' | 'lpg' | 'electric' | 'hybrid';
  fullTank: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FuelStats {
  totalLiters: number;
  totalCost: number;
  avgConsumption: number;
  avgPricePerLiter: number;
  totalDistance: number;
  recordsCount: number;
  bestConsumption: number;
  worstConsumption: number;
  monthlyAvgCost: number;
  costPerKm: number;
}

const FuelTrackingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, isDark } = useAppThemeManager();
  const { vehicles, refreshData } = useUserData();

  const carId = route.params?.carId;
  const [selectedVehicle, setSelectedVehicle] = useState<string>(carId || vehicles[0]?.id || '');
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFuelType, setSelectedFuelType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'stats' | 'charts'>('stats');

  const fuelTypes = [
    { id: 'gasoline', label: 'Benzina', color: '#FF9500', icon: '⛽' },
    { id: 'diesel', label: 'Diesel', color: '#34C759', icon: '🛢️' },
    { id: 'lpg', label: 'GPL', color: '#007AFF', icon: '🔵' },
    { id: 'electric', label: 'Elettrico', color: '#5856D6', icon: '⚡' },
    { id: 'hybrid', label: 'Ibrido', color: '#FF3B30', icon: '🔋' },
  ];

  useEffect(() => {
    if (selectedVehicle) {
      loadFuelRecords();
    }
  }, [selectedVehicle, selectedPeriod]);

  const loadFuelRecords = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId || !selectedVehicle) return;

      const fuelRecordsRef = collection(db, 'users', userId, 'vehicles', selectedVehicle, 'fuelRecords');
      let q = query(fuelRecordsRef, orderBy('date', 'desc'));

      if (selectedPeriod !== 'all') {
        const now = new Date();
        let startDate = new Date();

        switch (selectedPeriod) {
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }

        q = query(q, where('date', '>=', Timestamp.fromDate(startDate)));
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const records = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as FuelRecord[];

        setFuelRecords(records);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Errore caricamento rifornimenti:', error);
      Alert.alert('Errore', 'Impossibile caricare i rifornimenti');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFuelRecords();
    await refreshData();
    setRefreshing(false);
  };

  const calculateStats = useMemo((): FuelStats => {
    if (fuelRecords.length === 0) {
      return {
        totalLiters: 0,
        totalCost: 0,
        avgConsumption: 0,
        avgPricePerLiter: 0,
        totalDistance: 0,
        recordsCount: 0,
        bestConsumption: 0,
        worstConsumption: 0,
        monthlyAvgCost: 0,
        costPerKm: 0,
      };
    }

    const totalLiters = fuelRecords.reduce((sum, record) => sum + record.liters, 0);
    const totalCost = fuelRecords.reduce((sum, record) => sum + record.totalCost, 0);
    const avgPricePerLiter = totalCost / totalLiters;

    const sortedRecords = [...fuelRecords].sort((a, b) => a.mileage - b.mileage);
    const totalDistance = sortedRecords.length > 1 
      ? sortedRecords[sortedRecords.length - 1].mileage - sortedRecords[0].mileage 
      : 0;

    const consumptionRecords = [];
    for (let i = 1; i < sortedRecords.length; i++) {
      const prevRecord = sortedRecords[i - 1];
      const currentRecord = sortedRecords[i];
      const distance = currentRecord.mileage - prevRecord.mileage;
      
      if (distance > 0 && currentRecord.fullTank) {
        const consumption = (currentRecord.liters / distance) * 100;
        consumptionRecords.push(consumption);
      }
    }

    const avgConsumption = consumptionRecords.length > 0
      ? consumptionRecords.reduce((sum, c) => sum + c, 0) / consumptionRecords.length
      : 0;

    const bestConsumption = consumptionRecords.length > 0 ? Math.min(...consumptionRecords) : 0;
    const worstConsumption = consumptionRecords.length > 0 ? Math.max(...consumptionRecords) : 0;

    const monthlyAvgCost = fuelRecords.length > 0 
      ? totalCost / Math.max(1, Math.ceil(fuelRecords.length / 4))
      : 0;

    const costPerKm = totalDistance > 0 ? totalCost / totalDistance : 0;

    return {
      totalLiters,
      totalCost,
      avgConsumption,
      avgPricePerLiter,
      totalDistance,
      recordsCount: fuelRecords.length,
      bestConsumption,
      worstConsumption,
      monthlyAvgCost,
      costPerKm,
    };
  }, [fuelRecords]);

  const filteredRecords = useMemo(() => {
    return fuelRecords.filter(record => {
      const matchesSearch = searchQuery === '' || 
        record.station?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFuelType = selectedFuelType === 'all' || record.fuelType === selectedFuelType;
      
      return matchesSearch && matchesFuelType;
    });
  }, [fuelRecords, searchQuery, selectedFuelType]);

  const chartData = useMemo(() => {
    const monthlyData = fuelRecords.reduce((acc, record) => {
      const monthKey = `${record.date.getFullYear()}-${record.date.getMonth() + 1}`;
      if (!acc[monthKey]) {
        acc[monthKey] = { cost: 0, liters: 0, count: 0 };
      }
      acc[monthKey].cost += record.totalCost;
      acc[monthKey].liters += record.liters;
      acc[monthKey].count += 1;
      return acc;
    }, {} as Record<string, { cost: number; liters: number; count: number }>);

    const sortedMonths = Object.keys(monthlyData).sort();
    const labels = sortedMonths.map(month => {
      const [year, monthNum] = month.split('-');
      return `${monthNum}/${year.slice(2)}`;
    });

    return {
      labels: labels.slice(-6),
      datasets: [{
        data: sortedMonths.slice(-6).map(month => monthlyData[month].cost),
        color: (opacity = 1) => colors.primary + Math.round(opacity * 255).toString(16),
        strokeWidth: 2,
      }],
    };
  }, [fuelRecords, colors.primary]);

  const renderStatsView = () => (
    <ScrollView style={styles.statsContainer}>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statIcon}>
            <DollarSign size={24} color={colors.primary} />
          </View>
          <Text style={[styles.statValue, { color: colors.onSurface }]}>
            €{calculateStats.totalCost.toFixed(2)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            Costo Totale
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statIcon}>
            <Fuel size={24} color={colors.secondary} />
          </View>
          <Text style={[styles.statValue, { color: colors.onSurface }]}>
            {calculateStats.totalLiters.toFixed(1)}L
          </Text>
          <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            Litri Totali
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statIcon}>
            <Gauge size={24} color={colors.tertiary} />
          </View>
          <Text style={[styles.statValue, { color: colors.onSurface }]}>
            {calculateStats.avgConsumption.toFixed(1)}L/100km
          </Text>
          <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            Consumo Medio
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statIcon}>
            <Activity size={24} color={colors.error} />
          </View>
          <Text style={[styles.statValue, { color: colors.onSurface }]}>
            €{calculateStats.avgPricePerLiter.toFixed(3)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
            Prezzo/Litro
          </Text>
        </View>
      </View>

      <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.chartTitle, { color: colors.onSurface }]}>
          Andamento Spese Mensili
        </Text>
        {chartData.labels.length > 0 ? (
          <LineChart
            data={chartData}
            width={screenWidth - 64}
            height={200}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => colors.primary + Math.round(opacity * 255).toString(16),
              labelColor: (opacity = 1) => colors.onSurfaceVariant + Math.round(opacity * 255).toString(16),
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: colors.primary,
              },
            }}
            bezier
            style={styles.chart}
          />
        ) : (
          <View style={styles.noDataChart}>
            <BarChart3 size={48} color={colors.onSurfaceVariant} />
            <Text style={[styles.noDataText, { color: colors.onSurfaceVariant }]}>
              Nessun dato disponibile
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.comparisonCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
          Confronto Consumi
        </Text>
        <View style={styles.comparisonRow}>
          <View style={styles.comparisonItem}>
            <ArrowUp size={20} color={colors.tertiary} />
            <Text style={[styles.comparisonLabel, { color: colors.onSurfaceVariant }]}>
              Migliore
            </Text>
            <Text style={[styles.comparisonValue, { color: colors.onSurface }]}>
              {calculateStats.bestConsumption.toFixed(1)}L/100km
            </Text>
          </View>
          <View style={styles.comparisonItem}>
            <ArrowDown size={20} color={colors.error} />
            <Text style={[styles.comparisonLabel, { color: colors.onSurfaceVariant }]}>
              Peggiore
            </Text>
            <Text style={[styles.comparisonValue, { color: colors.onSurface }]}>
              {calculateStats.worstConsumption.toFixed(1)}L/100km
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderListView = () => (
    <ScrollView style={styles.listContainer}>
      {filteredRecords.map((record) => (
        <TouchableOpacity
          key={record.id}
          style={[styles.recordCard, { backgroundColor: colors.surface }]}
          onPress={() => {/* Navigate to edit record */}}
        >
          <View style={styles.recordHeader}>
            <View style={styles.recordIcon}>
              <Fuel size={20} color={colors.primary} />
            </View>
            <View style={styles.recordInfo}>
              <Text style={[styles.recordDate, { color: colors.onSurface }]}>
                {record.date.toLocaleDateString('it-IT')}
              </Text>
              <Text style={[styles.recordStation, { color: colors.onSurfaceVariant }]}>
                {record.station || 'Stazione non specificata'}
              </Text>
            </View>
            <View style={styles.recordAmount}>
              <Text style={[styles.recordCost, { color: colors.onSurface }]}>
                €{record.totalCost.toFixed(2)}
              </Text>
              <Text style={[styles.recordLiters, { color: colors.onSurfaceVariant }]}>
                {record.liters.toFixed(1)}L
              </Text>
            </View>
          </View>
          
          <View style={styles.recordDetails}>
            <View style={styles.recordMeta}>
              <View style={styles.metaItem}>
                <Gauge size={14} color={colors.onSurfaceVariant} />
                <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {record.mileage.toLocaleString()} km
                </Text>
              </View>
              <View style={styles.metaItem}>
                <DollarSign size={14} color={colors.onSurfaceVariant} />
                <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  €{record.pricePerLiter.toFixed(3)}/L
                </Text>
              </View>
              {record.location && (
                <View style={styles.metaItem}>
                  <MapPin size={14} color={colors.onSurfaceVariant} />
                  <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                    {record.location}
                  </Text>
                </View>
              )}
            </View>
            
            {record.notes && (
              <Text style={[styles.recordNotes, { color: colors.onSurfaceVariant }]}>
                {record.notes}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <X size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
          Rifornimenti
        </Text>
        <TouchableOpacity onPress={() => setShowFilterModal(true)}>
          <Filter size={24} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.vehicleSelector}
        contentContainerStyle={styles.vehicleSelectorContent}
      >
        {vehicles.map(vehicle => (
          <TouchableOpacity
            key={vehicle.id}
            style={[
              styles.vehicleChip,
              { 
                backgroundColor: selectedVehicle === vehicle.id ? colors.primary : colors.surface,
                borderColor: colors.outline 
              }
            ]}
            onPress={() => setSelectedVehicle(vehicle.id)}
          >
            <Text style={[
              styles.vehicleChipText,
              { color: selectedVehicle === vehicle.id ? colors.onPrimary : colors.onSurface }
            ]}>
              {vehicle.brand} {vehicle.model}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.periodSelector}
        contentContainerStyle={styles.periodSelectorContent}
      >
        {(['week', 'month', 'year', 'all'] as const).map(period => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodChip,
              { 
                backgroundColor: selectedPeriod === period ? colors.secondary : colors.surface,
                borderColor: colors.outline 
              }
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[
              styles.periodChipText,
              { color: selectedPeriod === period ? colors.onSecondary : colors.onSurface }
            ]}>
              {period === 'week' ? 'Settimana' : 
               period === 'month' ? 'Mese' :
               period === 'year' ? 'Anno' : 'Tutto'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.viewToggle}>
        {(['stats', 'list'] as const).map(mode => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.toggleButton,
              { 
                backgroundColor: viewMode === mode ? colors.primary : colors.surface,
                borderColor: colors.outline 
              }
            ]}
            onPress={() => setViewMode(mode)}
          >
            {mode === 'stats' ? 
              <BarChart3 size={18} color={viewMode === mode ? colors.onPrimary : colors.onSurface} /> :
              <Calendar size={18} color={viewMode === mode ? colors.onPrimary : colors.onSurface} />
            }
            <Text style={[
              styles.toggleButtonText,
              { color: viewMode === mode ? colors.onPrimary : colors.onSurface }
            ]}>
              {mode === 'stats' ? 'Statistiche' : 'Lista'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <RefreshControl refreshing={refreshing} onRefresh={onRefresh}>
        {viewMode === 'stats' ? renderStatsView() : renderListView()}
      </RefreshControl>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AddFuelRecord', { carId: selectedVehicle })}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  vehicleSelector: {
    marginVertical: 8,
  },
  vehicleSelectorContent: {
    paddingHorizontal: 16,
  },
  vehicleChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  vehicleChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  periodSelector: {
    marginBottom: 8,
  },
  periodSelectorContent: {
    paddingHorizontal: 16,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  periodChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  viewToggle: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  statsContainer: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statIcon: {
    marginBottom: 8,
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
  chartCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  noDataChart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    marginTop: 12,
  },
  comparisonCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  comparisonItem: {
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 12,
    marginVertical: 4,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  recordCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  recordStation: {
    fontSize: 14,
    marginTop: 2,
  },
  recordAmount: {
    alignItems: 'flex-end',
  },
  recordCost: {
    fontSize: 16,
    fontWeight: '600',
  },
  recordLiters: {
    fontSize: 14,
    marginTop: 2,
  },
  recordDetails: {},
  recordMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  recordNotes: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default FuelTrackingScreen;
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
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

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
      const userId = auth().currentUser?.uid;
      if (!userId || !selectedVehicle) return;

      let query = firestore()
        .collection('users')
        .doc(userId)
        .collection('vehicles')
        .doc(selectedVehicle)
        .collection('fuelRecords')
        .orderBy('date', 'desc');

      // Apply period filter
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

        query = query.where('date', '>=', firestore.Timestamp.fromDate(startDate));
      }

      const snapshot = await query.get();

      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as FuelRecord[];

      setFuelRecords(records);
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

  // Calculate statistics
  const fuelStats = useMemo((): FuelStats => {
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

    // Filter records by fuel type if needed
    let filteredRecords = fuelRecords;
    if (selectedFuelType !== 'all') {
      filteredRecords = fuelRecords.filter(r => r.fuelType === selectedFuelType);
    }

    const totalLiters = filteredRecords.reduce((sum, r) => sum + r.liters, 0);
    const totalCost = filteredRecords.reduce((sum, r) => sum + r.totalCost, 0);
    const avgPricePerLiter = totalCost / totalLiters || 0;

    // Calculate consumption (L/100km)
    const consumptions: number[] = [];
    for (let i = 0; i < filteredRecords.length - 1; i++) {
      const current = filteredRecords[i];
      const next = filteredRecords[i + 1];

      if (current.fullTank && next.mileage < current.mileage) {
        const distance = current.mileage - next.mileage;
        if (distance > 0) {
          const consumption = (current.liters / distance) * 100;
          consumptions.push(consumption);
        }
      }
    }

    const avgConsumption = consumptions.length > 0
      ? consumptions.reduce((sum, c) => sum + c, 0) / consumptions.length
      : 0;

    const bestConsumption = consumptions.length > 0 ? Math.min(...consumptions) : 0;
    const worstConsumption = consumptions.length > 0 ? Math.max(...consumptions) : 0;

    // Calculate total distance
    const sortedRecords = [...filteredRecords].sort((a, b) => a.mileage - b.mileage);
    const totalDistance = sortedRecords.length > 1
      ? sortedRecords[sortedRecords.length - 1].mileage - sortedRecords[0].mileage
      : 0;

    // Calculate monthly average
    const months = new Set(filteredRecords.map(r => 
      `${r.date.getFullYear()}-${r.date.getMonth()}`
    )).size || 1;
    const monthlyAvgCost = totalCost / months;

    // Cost per km
    const costPerKm = totalDistance > 0 ? totalCost / totalDistance : 0;

    return {
      totalLiters,
      totalCost,
      avgConsumption,
      avgPricePerLiter,
      totalDistance,
      recordsCount: filteredRecords.length,
      bestConsumption,
      worstConsumption,
      monthlyAvgCost,
      costPerKm,
    };
  }, [fuelRecords, selectedFuelType]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const sortedRecords = [...fuelRecords].sort((a, b) => a.date.getTime() - b.date.getTime());
    const last6Records = sortedRecords.slice(-6);

    return {
      labels: last6Records.map(r => r.date.toLocaleDateString('it-IT', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          data: last6Records.map(r => r.pricePerLiter),
          color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  }, [fuelRecords]);

  const barChartData = useMemo(() => {
    const monthlyData = new Map<string, number>();

    fuelRecords.forEach(record => {
      const monthKey = record.date.toLocaleDateString('it-IT', { month: 'short' });
      monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + record.totalCost);
    });

    const entries = Array.from(monthlyData.entries()).slice(-6);

    return {
      labels: entries.map(e => e[0]),
      datasets: [
        {
          data: entries.map(e => e[1]),
        },
      ],
    };
  }, [fuelRecords]);

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);

  const renderStatsCard = (title: string, value: string | number, subtitle?: string, icon?: any, trend?: number) => {
    const Icon = icon || Info;

    return (
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <View style={styles.statHeader}>
          <View style={[styles.statIcon, { backgroundColor: colors.primaryContainer }]}>
            <Icon size={20} color={colors.onPrimaryContainer} />
          </View>
          {trend !== undefined && (
            <View style={styles.trendContainer}>
              {trend > 0 ? (
                <ArrowUp size={16} color={colors.error} />
              ) : (
                <ArrowDown size={16} color={colors.success} />
              )}
              <Text style={[styles.trendText, { color: trend > 0 ? colors.error : colors.success }]}>
                {Math.abs(trend)}%
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.statValue, { color: colors.onSurface }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.statSubtitle, { color: colors.onSurfaceVariant }]}>{subtitle}</Text>
        )}
      </View>
    );
  };

  const FuelRecordCard = ({ record }: { record: FuelRecord }) => {
    const fuelType = fuelTypes.find(t => t.id === record.fuelType);

    return (
      <TouchableOpacity
        style={[styles.recordCard, { backgroundColor: colors.surface }]}
        activeOpacity={0.7}
      >
        <View style={styles.recordHeader}>
          <View style={[styles.recordIcon, { backgroundColor: fuelType?.color + '20' }]}>
            <Text style={styles.recordIconEmoji}>{fuelType?.icon}</Text>
          </View>
          <View style={styles.recordInfo}>
            <Text style={[styles.recordDate, { color: colors.onSurface }]}>
              {record.date.toLocaleDateString('it-IT', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </Text>
            <View style={styles.recordDetails}>
              <Text style={[styles.recordDetailText, { color: colors.onSurfaceVariant }]}>
                {record.liters}L • €{record.pricePerLiter.toFixed(3)}/L
              </Text>
              {record.station && (
                <Text style={[styles.recordStation, { color: colors.onSurfaceVariant }]}>
                  {record.station}
                </Text>
              )}
            </View>
            <View style={styles.recordMeta}>
              <View style={styles.metaItem}>
                <Gauge size={12} color={colors.onSurfaceVariant} />
                <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                  {record.mileage.toLocaleString()} km
                </Text>
              </View>
              {record.fullTank && (
                <View style={[styles.fullTankBadge, { backgroundColor: colors.successContainer }]}>
                  <Text style={[styles.fullTankText, { color: colors.onSuccessContainer }]}>
                    Pieno
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.recordCost}>
          <Text style={[styles.recordCostValue, { color: colors.primary }]}>
            €{record.totalCost.toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStatisticsView = () => (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Vehicle Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.vehicleSelector}
      >
        {vehicles.map(vehicle => (
          <TouchableOpacity
            key={vehicle.id}
            style={[
              styles.vehicleChip,
              {
                backgroundColor: selectedVehicle === vehicle.id ? colors.primaryContainer : colors.surface,
                borderColor: selectedVehicle === vehicle.id ? colors.primary : colors.outline,
              }
            ]}
            onPress={() => setSelectedVehicle(vehicle.id)}
          >
            <Car size={16} color={selectedVehicle === vehicle.id ? colors.onPrimaryContainer : colors.onSurface} />
            <Text style={[
              styles.vehicleChipText,
              { color: selectedVehicle === vehicle.id ? colors.onPrimaryContainer : colors.onSurface }
            ]}>
              {vehicle.make} {vehicle.model}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Main Stats */}
      <View style={styles.mainStatsContainer}>
        <View style={[styles.mainStatCard, { backgroundColor: colors.primaryContainer }]}>
          <Text style={[styles.mainStatLabel, { color: colors.onPrimaryContainer }]}>
            Consumo Medio
          </Text>
          <Text style={[styles.mainStatValue, { color: colors.onPrimaryContainer }]}>
            {fuelStats.avgConsumption.toFixed(1)}
          </Text>
          <Text style={[styles.mainStatUnit, { color: colors.onPrimaryContainer }]}>
            L/100km
          </Text>
        </View>

        <View style={[styles.mainStatCard, { backgroundColor: colors.secondaryContainer }]}>
          <Text style={[styles.mainStatLabel, { color: colors.onSecondaryContainer }]}>
            Costo Medio
          </Text>
          <Text style={[styles.mainStatValue, { color: colors.onSecondaryContainer }]}>
            €{fuelStats.avgPricePerLiter.toFixed(3)}
          </Text>
          <Text style={[styles.mainStatUnit, { color: colors.onSecondaryContainer }]}>
            per litro
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {renderStatsCard('Spesa Totale', `€${fuelStats.totalCost.toFixed(2)}`, `${fuelStats.recordsCount} rifornimenti`, DollarSign)}
        {renderStatsCard('Litri Totali', fuelStats.totalLiters.toFixed(1), 'litri', Fuel)}
        {renderStatsCard('Distanza', fuelStats.totalDistance.toLocaleString(), 'km percorsi', Activity)}
        {renderStatsCard('€/km', fuelStats.costPerKm.toFixed(3), 'costo per km', TrendingUp)}
        {renderStatsCard('Media Mensile', `€${fuelStats.monthlyAvgCost.toFixed(2)}`, 'al mese', Calendar)}
        {renderStatsCard('Miglior Consumo', fuelStats.bestConsumption.toFixed(1), 'L/100km', TrendingDown)}
      </View>

      {/* Charts */}
      {fuelRecords.length > 0 && (
        <View style={styles.chartsSection}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
            Andamento Prezzi
          </Text>
          <LineChart
            data={chartData}
            width={screenWidth - 32}
            height={220}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 3,
              color: (opacity = 1) => colors.primary,
              labelColor: (opacity = 1) => colors.onSurface,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: colors.primary,
              },
            }}
            bezier
            style={styles.chart}
          />

          <Text style={[styles.sectionTitle, { color: colors.onBackground, marginTop: 24 }]}>
            Spesa Mensile
          </Text>
          <BarChart
            data={barChartData}
            width={screenWidth - 32}
            height={220}
            yAxisLabel="€"
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => colors.primary,
              labelColor: (opacity = 1) => colors.onSurface,
              style: {
                borderRadius: 16,
              },
            }}
            style={styles.chart}
          />
        </View>
      )}

      {/* Recent Records */}
      <View style={styles.recordsSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
            Ultimi Rifornimenti
          </Text>
          <TouchableOpacity onPress={() => setViewMode('list')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              Vedi tutti
            </Text>
          </TouchableOpacity>
        </View>

        {fuelRecords.slice(0, 5).map(record => (
          <FuelRecordCard key={record.id} record={record} />
        ))}
      </View>
    </ScrollView>
  );

  const renderListView = () => (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <Search size={20} color={colors.onSurfaceVariant} />
        <TextInput
          style={[styles.searchInput, { color: colors.onSurface }]}
          placeholder="Cerca rifornimenti..."
          placeholderTextColor={colors.onSurfaceVariant}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity onPress={() => setShowFilterModal(true)}>
          <Filter size={20} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Records List */}
      {fuelRecords.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Fuel size={48} color={colors.onSurfaceVariant} />
          <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
            Nessun rifornimento registrato
          </Text>
          <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            Inizia ad aggiungere i tuoi rifornimenti per tracciare i consumi
          </Text>
        </View>
      ) : (
        fuelRecords
          .filter(record => {
            if (searchQuery) {
              return record.station?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     record.notes?.toLowerCase().includes(searchQuery.toLowerCase());
            }
            return true;
          })
          .map(record => <FuelRecordCard key={record.id} record={record} />)
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Tabs */}
      <View style={[styles.headerTabs, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            viewMode === 'stats' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setViewMode('stats')}
        >
          <BarChart3 size={20} color={viewMode === 'stats' ? colors.primary : colors.onSurfaceVariant} />
          <Text style={[
            styles.tabText,
            { color: viewMode === 'stats' ? colors.primary : colors.onSurfaceVariant }
          ]}>
            Statistiche
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            viewMode === 'list' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setViewMode('list')}
        >
          <Fuel size={20} color={viewMode === 'list' ? colors.primary : colors.onSurfaceVariant} />
          <Text style={[
            styles.tabText,
            { color: viewMode === 'list' ? colors.primary : colors.onSurfaceVariant }
          ]}>
            Rifornimenti
          </Text>
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={[styles.periodSelector, { backgroundColor: colors.background }]}
      >
        {['week', 'month', 'year', 'all'].map(period => (
          <Chip
            key={period}
            selected={selectedPeriod === period}
            onPress={() => setSelectedPeriod(period as any)}
            style={styles.periodChip}
          >
            {period === 'week' ? 'Settimana' :
             period === 'month' ? 'Mese' :
             period === 'year' ? 'Anno' : 'Tutto'}
          </Chip>
        ))}
      </ScrollView>

      {/* Content */}
      {viewMode === 'stats' ? renderStatisticsView() : renderListView()}

      {/* FAB */}
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
  headerTabs: {
    flexDirection: 'row',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  periodSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  periodChip: {
    marginRight: 8,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  vehicleSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 60,
  },
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  vehicleChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mainStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  mainStatCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  mainStatLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  mainStatValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mainStatUnit: {
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  chartsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  recordsSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recordCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordIconEmoji: {
    fontSize: 20,
  },
  recordInfo: {
    flex: 1,
  },
  recordDate: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  recordDetails: {
    marginBottom: 4,
  },
  recordDetailText: {
    fontSize: 12,
  },
  recordStation: {
    fontSize: 12,
    marginTop: 2,
  },
  recordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
  fullTankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  fullTankText: {
    fontSize: 10,
    fontWeight: '500',
  },
  recordCost: {
    alignItems: 'flex-end',
  },
  recordCostValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  emptyState: {
    margin: 16,
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

export default FuelTrackingScreen;
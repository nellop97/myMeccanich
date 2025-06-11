// src/screens/user/CarExpensesScreen.tsx
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
  TrendingUp,
  TrendingDown,
  Fuel,
  Wrench,
  Car,
  CreditCard,
  PieChart
} from 'lucide-react-native';

import { useStore } from '../../store';
import { useUserCarsStore } from '@/src/store/useCarsStore';

const { width: screenWidth } = Dimensions.get('window');

interface RouteParams {
  carId: string;
}

interface Expense {
  id: string;
  carId: string;
  description: string;
  amount: number;
  category: 'fuel' | 'maintenance' | 'insurance' | 'parking' | 'other';
  date: string;
  location?: string;
  notes?: string;
}

const CarExpensesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { carId } = route.params as RouteParams;
  const { darkMode } = useStore();
  const { getCarById } = useUserCarsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const car = getCarById(carId);

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

  // Mock data - in una vera app questi dati verrebbero dal database
  const mockExpenses: Expense[] = [
    {
      id: '1',
      carId,
      description: 'Rifornimento',
      amount: 65.50,
      category: 'fuel',
      date: '2024-11-15',
      location: 'Eni Via Milano'
    },
    {
      id: '2',
      carId,
      description: 'Cambio olio motore',
      amount: 120.00,
      category: 'maintenance',
      date: '2024-11-10',
      location: 'Autofficina Rossi'
    },
    {
      id: '3',
      carId,
      description: 'Assicurazione mensile',
      amount: 85.00,
      category: 'insurance',
      date: '2024-11-01'
    },
    {
      id: '4',
      carId,
      description: 'Parcheggio centro',
      amount: 12.50,
      category: 'parking',
      date: '2024-11-14',
      location: 'Piazza Duomo'
    }
  ];

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'fuel': return Fuel;
      case 'maintenance': return Wrench;
      case 'insurance': return CreditCard;
      case 'parking': return Car;
      default: return DollarSign;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'fuel': return fallbackTheme.warning;
      case 'maintenance': return fallbackTheme.info;
      case 'insurance': return fallbackTheme.success;
      case 'parking': return fallbackTheme.primary;
      default: return fallbackTheme.textSecondary;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'fuel': return 'Carburante';
      case 'maintenance': return 'Manutenzione';
      case 'insurance': return 'Assicurazione';
      case 'parking': return 'Parcheggio';
      default: return 'Altro';
    }
  };

  const filteredExpenses = mockExpenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || expense.category === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const expenseStats = {
    totalAmount: mockExpenses.reduce((sum, exp) => sum + exp.amount, 0),
    fuelTotal: mockExpenses.filter(e => e.category === 'fuel').reduce((sum, e) => sum + e.amount, 0),
    maintenanceTotal: mockExpenses.filter(e => e.category === 'maintenance').reduce((sum, e) => sum + e.amount, 0),
    insuranceTotal: mockExpenses.filter(e => e.category === 'insurance').reduce((sum, e) => sum + e.amount, 0),
    otherTotal: mockExpenses.filter(e => e.category !== 'fuel' && e.category !== 'maintenance' && e.category !== 'insurance').reduce((sum, e) => sum + e.amount, 0),
    avgPerMonth: mockExpenses.reduce((sum, exp) => sum + exp.amount, 0) / 3 // Mock: ultimi 3 mesi
  };

  const ExpenseCard = ({ expense }: { expense: Expense }) => {
    const CategoryIcon = getCategoryIcon(expense.category);
    const categoryColor = getCategoryColor(expense.category);

    return (
      <TouchableOpacity
        style={[styles.expenseCard, { backgroundColor: fallbackTheme.cardBackground }]}
        onPress={() => navigation.navigate('ExpenseDetail', { expenseId: expense.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.categoryIcon, { backgroundColor: categoryColor + '20' }]}>
              <CategoryIcon size={20} color={categoryColor} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.expenseTitle, { color: fallbackTheme.text }]}>
                {expense.description}
              </Text>
              <Text style={[styles.categoryText, { color: fallbackTheme.textSecondary }]}>
                {getCategoryName(expense.category)}
              </Text>
            </View>
          </View>
          <View style={styles.cardHeaderRight}>
            <Text style={[styles.expenseAmount, { color: fallbackTheme.text }]}>
              {formatCurrency(expense.amount)}
            </Text>
            <Text style={[styles.expenseDate, { color: fallbackTheme.textSecondary }]}>
              {formatDate(expense.date)}
            </Text>
          </View>
        </View>

        {expense.location && (
          <View style={styles.expenseDetails}>
            <Text style={[styles.locationText, { color: fallbackTheme.textSecondary }]}>
              📍 {expense.location}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const StatCard = ({ title, value, icon: Icon, iconColor, trend }: any) => (
    <View style={[styles.statCard, { backgroundColor: fallbackTheme.cardBackground }]}>
      <View style={[styles.statIcon, { backgroundColor: iconColor + '20' }]}>
        <Icon size={20} color={iconColor} />
      </View>
      <View style={styles.statInfo}>
        <Text style={[styles.statValue, { color: fallbackTheme.text }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: fallbackTheme.textSecondary }]}>{title}</Text>
        {trend && (
          <View style={styles.trendContainer}>
            {trend > 0 ? (
              <TrendingUp size={12} color={fallbackTheme.error} />
            ) : (
              <TrendingDown size={12} color={fallbackTheme.success} />
            )}
            <Text style={[
              styles.trendText,
              { color: trend > 0 ? fallbackTheme.error : fallbackTheme.success }
            ]}>
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const FilterChip = ({ title, value, active, count }: any) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        { backgroundColor: active ? fallbackTheme.primary : fallbackTheme.border }
      ]}
      onPress={() => setSelectedFilter(value)}
    >
      <Text style={[
        styles.filterChipText,
        { color: active ? '#ffffff' : fallbackTheme.textSecondary }
      ]}>
        {title}
        {count !== undefined && (
          <Text style={styles.filterChipCount}>
            {' '}({count})
          </Text>
        )}
      </Text>
    </TouchableOpacity>
  );

  const PeriodButton = ({ title, value, active }: any) => (
    <TouchableOpacity
      style={[
        styles.periodButton,
        { 
          backgroundColor: active ? fallbackTheme.primary : 'transparent',
          borderColor: fallbackTheme.border
        }
      ]}
      onPress={() => setSelectedPeriod(value)}
    >
      <Text style={[
        styles.periodButtonText,
        { color: active ? '#ffffff' : fallbackTheme.textSecondary }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
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
              Spese
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
            placeholder="Cerca spese..."
            placeholderTextColor={fallbackTheme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Period Selection */}
      <View style={[styles.periodContainer, { backgroundColor: fallbackTheme.cardBackground }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <PeriodButton title="Settimana" value="week" active={selectedPeriod === 'week'} />
          <PeriodButton title="Mese" value="month" active={selectedPeriod === 'month'} />
          <PeriodButton title="Trimestre" value="quarter" active={selectedPeriod === 'quarter'} />
          <PeriodButton title="Anno" value="year" active={selectedPeriod === 'year'} />
        </ScrollView>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
          <StatCard
            title="Totale Spese"
            value={formatCurrency(expenseStats.totalAmount)}
            icon={DollarSign}
            iconColor={fallbackTheme.primary}
            trend={5}
          />
          <StatCard
            title="Carburante"
            value={formatCurrency(expenseStats.fuelTotal)}
            icon={Fuel}
            iconColor={fallbackTheme.warning}
            trend={-2}
          />
          <StatCard
            title="Manutenzione"
            value={formatCurrency(expenseStats.maintenanceTotal)}
            icon={Wrench}
            iconColor={fallbackTheme.info}
            trend={10}
          />
          <StatCard
            title="Media Mensile"
            value={formatCurrency(expenseStats.avgPerMonth)}
            icon={TrendingUp}
            iconColor={fallbackTheme.success}
          />
        </ScrollView>
      </View>

      {/* Category Chart Summary */}
      <View style={[styles.chartContainer, { backgroundColor: fallbackTheme.cardBackground }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: fallbackTheme.text }]}>Distribuzione per Categoria</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ExpenseAnalytics', { carId })}>
            <PieChart size={20} color={fallbackTheme.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.categoryBreakdown}>
          <View style={styles.categoryRow}>
            <View style={styles.categoryInfo}>
              <View style={[styles.categoryDot, { backgroundColor: fallbackTheme.warning }]} />
              <Text style={[styles.categoryLabel, { color: fallbackTheme.textSecondary }]}>Carburante</Text>
            </View>
            <Text style={[styles.categoryAmount, { color: fallbackTheme.text }]}>
              {formatCurrency(expenseStats.fuelTotal)}
            </Text>
          </View>
          <View style={styles.categoryRow}>
            <View style={styles.categoryInfo}>
              <View style={[styles.categoryDot, { backgroundColor: fallbackTheme.info }]} />
              <Text style={[styles.categoryLabel, { color: fallbackTheme.textSecondary }]}>Manutenzione</Text>
            </View>
            <Text style={[styles.categoryAmount, { color: fallbackTheme.text }]}>
              {formatCurrency(expenseStats.maintenanceTotal)}
            </Text>
          </View>
          <View style={styles.categoryRow}>
            <View style={styles.categoryInfo}>
              <View style={[styles.categoryDot, { backgroundColor: fallbackTheme.success }]} />
              <Text style={[styles.categoryLabel, { color: fallbackTheme.textSecondary }]}>Assicurazione</Text>
            </View>
            <Text style={[styles.categoryAmount, { color: fallbackTheme.text }]}>
              {formatCurrency(expenseStats.insuranceTotal)}
            </Text>
          </View>
        </View>
      </View>

      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: fallbackTheme.cardBackground }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterChip title="Tutte" value="all" active={selectedFilter === 'all'} />
          <FilterChip title="Carburante" value="fuel" active={selectedFilter === 'fuel'} />
          <FilterChip title="Manutenzione" value="maintenance" active={selectedFilter === 'maintenance'} />
          <FilterChip title="Assicurazione" value="insurance" active={selectedFilter === 'insurance'} />
          <FilterChip title="Parcheggio" value="parking" active={selectedFilter === 'parking'} />
          <FilterChip title="Altro" value="other" active={selectedFilter === 'other'} />
        </ScrollView>
      </View>

      {/* Expenses List */}
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
        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <DollarSign size={64} color={fallbackTheme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: fallbackTheme.text }]}>
              {searchQuery ? "Nessun risultato" : "Nessuna spesa"}
            </Text>
            <Text style={[styles.emptySubtitle, { color: fallbackTheme.textSecondary }]}>
              {searchQuery
                ? "Prova a modificare i criteri di ricerca"
                : "Non ci sono ancora spese registrate per questo veicolo"
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: fallbackTheme.primary }]}
                onPress={() => navigation.navigate('AddExpense', { carId })}
              >
                <Plus size={20} color="#ffffff" />
                <Text style={styles.emptyButtonText}>Aggiungi Spesa</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.expensesList}>
            {filteredExpenses.map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: fallbackTheme.primary }]}
        onPress={() => navigation.navigate('AddExpense', { carId })}
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
  periodContainer: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
    marginBottom: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 10,
    marginLeft: 2,
    fontWeight: '600',
  },
  chartContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryBreakdown: {
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 14,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
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
  expensesList: {
    gap: 12,
  },
  expenseCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  expenseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 14,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 12,
  },
  expenseDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  locationText: {
    fontSize: 14,
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

export default CarExpensesScreen;
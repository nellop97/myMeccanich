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
  TrendingUp,
  TrendingDown,
  Fuel,
  Wrench,
  Car,
  CreditCard,
  PieChart,
  BarChart3,
  MapPin
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
    return matchesSearch;
  });

  const expenseStats = {
    totalAmount: mockExpenses.reduce((sum, exp) => sum + exp.amount, 0),
    fuelTotal: mockExpenses.filter(e => e.category === 'fuel').reduce((sum, e) => sum + e.amount, 0),
    maintenanceTotal: mockExpenses.filter(e => e.category === 'maintenance').reduce((sum, e) => sum + e.amount, 0),
    insuranceTotal: mockExpenses.filter(e => e.category === 'insurance').reduce((sum, e) => sum + e.amount, 0),
    otherTotal: mockExpenses.filter(e => e.category !== 'fuel' && e.category !== 'maintenance' && e.category !== 'insurance').reduce((sum, e) => sum + e.amount, 0),
    avgPerMonth: mockExpenses.reduce((sum, exp) => sum + exp.amount, 0) / 3 // Mock: ultimi 3 mesi
  };

  // Period Selector Component
  const PeriodSelector = () => (
    <View style={[styles.periodSelector, { backgroundColor: fallbackTheme.border }]}>
      {[
        { key: 'week', label: 'Settimana' },
        { key: 'month', label: 'Mese' },
        { key: 'year', label: 'Anno' }
      ].map((period) => (
        <TouchableOpacity
          key={period.key}
          style={[
            styles.periodOption,
            selectedPeriod === period.key && [
              styles.periodOptionActive,
              { backgroundColor: fallbackTheme.primary }
            ]
          ]}
          onPress={() => setSelectedPeriod(period.key)}
        >
          <Text style={[
            styles.periodOptionText,
            { color: selectedPeriod === period.key ? '#ffffff' : fallbackTheme.textSecondary }
          ]}>
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Stats Overview Card
  const StatsOverviewCard = () => (
    <View style={[styles.card, { backgroundColor: fallbackTheme.cardBackground }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: fallbackTheme.text }]}>Panoramica Spese</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ExpenseAnalytics', { carId })}>
          <BarChart3 size={20} color={fallbackTheme.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.mainStat}>
        <Text style={[styles.mainStatValue, { color: fallbackTheme.primary }]}>
          {formatCurrency(expenseStats.totalAmount)}
        </Text>
        <View style={styles.trendIndicator}>
          <TrendingUp size={16} color={fallbackTheme.success} />
          <Text style={[styles.trendText, { color: fallbackTheme.success }]}>+5%</Text>
        </View>
      </View>
      
      <Text style={[styles.mainStatLabel, { color: fallbackTheme.textSecondary }]}>
        Totale questo mese
      </Text>
    </View>
  );

  // Category Breakdown Card
  const CategoryBreakdownCard = () => (
    <View style={[styles.card, { backgroundColor: fallbackTheme.cardBackground }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: fallbackTheme.text }]}>Per Categoria</Text>
        <TouchableOpacity>
          <PieChart size={20} color={fallbackTheme.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.categoryBreakdown}>
        {[
          { category: 'fuel', amount: expenseStats.fuelTotal, label: 'Carburante' },
          { category: 'maintenance', amount: expenseStats.maintenanceTotal, label: 'Manutenzione' },
          { category: 'insurance', amount: expenseStats.insuranceTotal, label: 'Assicurazione' },
          { category: 'other', amount: expenseStats.otherTotal, label: 'Altro' }
        ].filter(item => item.amount > 0).map((item) => {
          const percentage = (item.amount / expenseStats.totalAmount) * 100;
          const categoryColor = getCategoryColor(item.category);
          
          return (
            <View key={item.category} style={styles.categoryRow}>
              <View style={styles.categoryInfo}>
                <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
                <Text style={[styles.categoryLabel, { color: fallbackTheme.text }]}>
                  {item.label}
                </Text>
              </View>
              <View style={styles.categoryAmountInfo}>
                <Text style={[styles.categoryAmount, { color: fallbackTheme.text }]}>
                  {formatCurrency(item.amount)}
                </Text>
                <Text style={[styles.categoryPercentage, { color: fallbackTheme.textSecondary }]}>
                  {percentage.toFixed(1)}%
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );

  // Quick Stats Grid
  const QuickStatsGrid = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.statsContainer}
      contentContainerStyle={styles.statsContent}
    >
      <View style={[styles.statCard, { backgroundColor: fallbackTheme.cardBackground }]}>
        <View style={[styles.statIcon, { backgroundColor: fallbackTheme.warning + '20' }]}>
          <Fuel size={20} color={fallbackTheme.warning} />
        </View>
        <Text style={[styles.statValue, { color: fallbackTheme.text }]}>
          {formatCurrency(expenseStats.fuelTotal)}
        </Text>
        <Text style={[styles.statLabel, { color: fallbackTheme.textSecondary }]}>
          Carburante
        </Text>
      </View>

      <View style={[styles.statCard, { backgroundColor: fallbackTheme.cardBackground }]}>
        <View style={[styles.statIcon, { backgroundColor: fallbackTheme.info + '20' }]}>
          <Wrench size={20} color={fallbackTheme.info} />
        </View>
        <Text style={[styles.statValue, { color: fallbackTheme.text }]}>
          {formatCurrency(expenseStats.maintenanceTotal)}
        </Text>
        <Text style={[styles.statLabel, { color: fallbackTheme.textSecondary }]}>
          Manutenzione
        </Text>
      </View>

      <View style={[styles.statCard, { backgroundColor: fallbackTheme.cardBackground }]}>
        <View style={[styles.statIcon, { backgroundColor: fallbackTheme.success + '20' }]}>
          <TrendingUp size={20} color={fallbackTheme.success} />
        </View>
        <Text style={[styles.statValue, { color: fallbackTheme.text }]}>
          {formatCurrency(expenseStats.avgPerMonth)}
        </Text>
        <Text style={[styles.statLabel, { color: fallbackTheme.textSecondary }]}>
          Media Mensile
        </Text>
      </View>
    </ScrollView>
  );

  const ExpenseCard = ({ expense }: { expense: Expense }) => {
    const CategoryIcon = getCategoryIcon(expense.category);
    const categoryColor = getCategoryColor(expense.category);

    return (
      <TouchableOpacity
        style={[styles.expenseCard, { backgroundColor: fallbackTheme.cardBackground }]}
        onPress={() => navigation.navigate('ExpenseDetail', { expenseId: expense.id })}
      >
        <View style={styles.cardHeaderRow}>
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
            <MapPin size={12} color={fallbackTheme.textSecondary} />
            <Text style={[styles.locationText, { color: fallbackTheme.textSecondary }]}>
              {expense.location}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const groupExpensesByMonth = (expenses: Expense[]) => {
    const groups: { [key: string]: Expense[] } = {};
    
    expenses.forEach(expense => {
      const monthKey = new Date(expense.date).toLocaleDateString('it-IT', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(expense);
    });
    
    return groups;
  };

  const groupedExpenses = groupExpensesByMonth(filteredExpenses);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: fallbackTheme.background }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} translucent={false}/>

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
            Spese
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
            placeholder="Cerca spese..."
            placeholderTextColor={fallbackTheme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Period Selector */}
      <View style={styles.periodContainer}>
        <PeriodSelector />
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
        {/* Stats Cards */}
        <StatsOverviewCard />
        
        {/* Quick Stats Grid */}
        <QuickStatsGrid />
        
        {/* Category Breakdown */}
        <CategoryBreakdownCard />

        {/* Expenses List */}
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
            {Object.entries(groupedExpenses).map(([month, expenses]) => (
              <View key={month} style={styles.monthGroup}>
                <View style={styles.monthHeader}>
                  <Text style={[styles.monthTitle, { color: fallbackTheme.text }]}>
                    {month}
                  </Text>
                  <Text style={[styles.monthTotal, { color: fallbackTheme.primary }]}>
                    {formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}
                  </Text>
                </View>
                {expenses.map(expense => (
                  <ExpenseCard key={expense.id} expense={expense} />
                ))}
              </View>
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
  
  // Period Selector
  periodContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
  },
  periodOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  periodOptionActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  periodOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  content: {
    flex: 1,
    padding: 16,
  },
  
  // Cards
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // Main Stat
  mainStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mainStatValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginRight: 12,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  mainStatLabel: {
    fontSize: 14,
  },
  
  // Category Breakdown
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
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryAmountInfo: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryPercentage: {
    fontSize: 12,
  },
  
  // Stats Grid
  statsContainer: {
    marginBottom: 16,
  },
  statsContent: {
    paddingHorizontal: 0,
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  
  // Expenses List
  expensesList: {
    gap: 24,
  },
  monthGroup: {
    gap: 12,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  monthTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  expenseCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
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
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  locationText: {
    fontSize: 14,
    marginLeft: 6,
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

export default CarExpensesScreen;
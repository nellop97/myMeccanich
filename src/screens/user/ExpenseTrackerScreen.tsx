// src/screens/user/ExpenseTrackerScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  TextInput,
  Modal,
  Dimensions,
  Platform
} from 'react-native';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Car,
  Filter,
  Plus,
  Search,
  PieChart,
  BarChart3,
  FileText,
  Fuel,
  Wrench,
  Shield,
  Navigation,
  CreditCard,
  Download,
  ChevronRight
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store';
import { useUserCarsStore } from '../../store/useCarsStore';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

interface ExpenseCategory {
  id: string;
  name: string;
  icon: any;
  color: string;
  total: number;
  percentage: number;
}

const ExpenseTrackerScreen = () => {
  const navigation = useNavigation();
  const { darkMode } = useStore();
  const { cars, getAllCarsStats } = useUserCarsStore();
  
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year' | 'all'>('month');
  const [selectedCar, setSelectedCar] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('stats');

  const theme = {
    background: darkMode ? '#111827' : '#f3f4f6',
    cardBackground: darkMode ? '#1f2937' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#9ca3af' : '#6b7280',
    border: darkMode ? '#374151' : '#e5e7eb',
    accent: '#2563eb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    fuel: '#f59e0b',
    maintenance: '#3b82f6',
    insurance: '#10b981',
    parking: '#8b5cf6',
    toll: '#ef4444',
    other: '#6b7280',
  };

  // Calcola le statistiche delle spese
  const expenseStats = useMemo(() => {
    let allExpenses: any[] = [];
    
    // Raccogli tutte le spese dai veicoli
    const filteredCars = selectedCar 
      ? cars.filter(car => car.id === selectedCar)
      : cars;
    
    filteredCars.forEach(car => {
      car.expenses.forEach(expense => {
        allExpenses.push({
          ...expense,
          carId: car.id,
          carName: `${car.make} ${car.model}`
        });
      });
    });

    // Filtra per periodo
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    if (selectedPeriod === 'month') {
      allExpenses = allExpenses.filter(exp => 
        new Date(exp.date) >= startOfMonth
      );
    } else if (selectedPeriod === 'year') {
      allExpenses = allExpenses.filter(exp => 
        new Date(exp.date) >= startOfYear
      );
    }

    // Calcola totali per categoria
    const categoryTotals: Record<string, number> = {
      fuel: 0,
      maintenance: 0,
      insurance: 0,
      parking: 0,
      toll: 0,
      other: 0
    };

    allExpenses.forEach(expense => {
      categoryTotals[expense.category] += expense.amount;
    });

    const totalExpenses = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

    // Prepara dati categorie
    const categories: ExpenseCategory[] = [
      {
        id: 'fuel',
        name: 'Carburante',
        icon: Fuel,
        color: theme.fuel,
        total: categoryTotals.fuel,
        percentage: totalExpenses > 0 ? (categoryTotals.fuel / totalExpenses) * 100 : 0
      },
      {
        id: 'maintenance',
        name: 'Manutenzione',
        icon: Wrench,
        color: theme.maintenance,
        total: categoryTotals.maintenance,
        percentage: totalExpenses > 0 ? (categoryTotals.maintenance / totalExpenses) * 100 : 0
      },
      {
        id: 'insurance',
        name: 'Assicurazione',
        icon: Shield,
        color: theme.insurance,
        total: categoryTotals.insurance,
        percentage: totalExpenses > 0 ? (categoryTotals.insurance / totalExpenses) * 100 : 0
      },
      {
        id: 'parking',
        name: 'Parcheggio',
        icon: Car,
        color: theme.parking,
        total: categoryTotals.parking,
        percentage: totalExpenses > 0 ? (categoryTotals.parking / totalExpenses) * 100 : 0
      },
      {
        id: 'toll',
        name: 'Pedaggi',
        icon: Navigation,
        color: theme.toll,
        total: categoryTotals.toll,
        percentage: totalExpenses > 0 ? (categoryTotals.toll / totalExpenses) * 100 : 0
      },
      {
        id: 'other',
        name: 'Altro',
        icon: CreditCard,
        color: theme.other,
        total: categoryTotals.other,
        percentage: totalExpenses > 0 ? (categoryTotals.other / totalExpenses) * 100 : 0
      }
    ];

    // Calcola variazione rispetto al periodo precedente
    let previousPeriodTotal = 0;
    let previousExpenses = [];
    
    if (selectedPeriod === 'month') {
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      previousExpenses = allExpenses.filter(exp => {
        const date = new Date(exp.date);
        return date >= startOfPrevMonth && date <= endOfPrevMonth;
      });
    }
    
    previousPeriodTotal = previousExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const variation = previousPeriodTotal > 0 
      ? ((totalExpenses - previousPeriodTotal) / previousPeriodTotal) * 100
      : 0;

    return {
      total: totalExpenses,
      categories: categories.sort((a, b) => b.total - a.total),
      expenses: allExpenses.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
      variation,
      averagePerCar: filteredCars.length > 0 ? totalExpenses / filteredCars.length : 0
    };
  }, [cars, selectedCar, selectedPeriod]);

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

  const renderCategoryCard = (category: ExpenseCategory) => {
    const Icon = category.icon;
    
    return (
      <TouchableOpacity
        key={category.id}
        style={[styles.categoryCard, { backgroundColor: theme.cardBackground }]}
        activeOpacity={0.8}
      >
        <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
          <Icon size={24} color={category.color} />
        </View>
        
        <View style={styles.categoryInfo}>
          <Text style={[styles.categoryName, { color: theme.textSecondary }]}>
            {category.name}
          </Text>
          <Text style={[styles.categoryAmount, { color: theme.text }]}>
            {formatCurrency(category.total)}
          </Text>
        </View>
        
        <View style={styles.categoryPercentage}>
          <Text style={[styles.percentageText, { color: category.color }]}>
            {category.percentage.toFixed(1)}%
          </Text>
          <View style={[styles.percentageBar, { backgroundColor: theme.border }]}>
            <View 
              style={[
                styles.percentageFill, 
                { 
                  backgroundColor: category.color,
                  width: `${category.percentage}%`
                }
              ]} 
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderExpenseItem = ({ item }: { item: any }) => {
    const categoryConfig = expenseStats.categories.find(cat => cat.id === item.category);
    const Icon = categoryConfig?.icon || CreditCard;
    const color = categoryConfig?.color || theme.textSecondary;
    
    return (
      <TouchableOpacity
        style={[styles.expenseItem, { backgroundColor: theme.cardBackground }]}
        onPress={() => navigation.navigate('CarExpenses', { carId: item.carId })}
        activeOpacity={0.8}
      >
        <View style={[styles.expenseIcon, { backgroundColor: color + '20' }]}>
          <Icon size={20} color={color} />
        </View>
        
        <View style={styles.expenseInfo}>
          <Text style={[styles.expenseDescription, { color: theme.text }]}>
            {item.description}
          </Text>
          <Text style={[styles.expenseCar, { color: theme.textSecondary }]}>
            {item.carName} • {formatDate(item.date)}
          </Text>
        </View>
        
        <Text style={[styles.expenseAmount, { color: theme.text }]}>
          {formatCurrency(item.amount)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Gestione Spese</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Monitora le tue spese auto
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.accent }]}
          onPress={() => navigation.navigate('AddExpense', {})}
        >
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['month', 'year', 'all'] as const).map(period => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && { backgroundColor: theme.accent }
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[
              styles.periodButtonText,
              { color: selectedPeriod === period ? '#ffffff' : theme.textSecondary }
            ]}>
              {period === 'month' ? 'Mese' : period === 'year' ? 'Anno' : 'Tutto'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Total Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: theme.cardBackground }]}>
        <LinearGradient
          colors={[theme.accent, theme.accent + 'dd']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryGradient}
        >
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Totale Spese</Text>
            <Text style={styles.summaryAmount}>
              {formatCurrency(expenseStats.total)}
            </Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                {expenseStats.variation > 0 ? (
                  <TrendingUp size={16} color="#ffffff" />
                ) : (
                  <TrendingDown size={16} color="#ffffff" />
                )}
                <Text style={styles.summaryStatText}>
                  {expenseStats.variation > 0 ? '+' : ''}{expenseStats.variation.toFixed(1)}%
                </Text>
              </View>
              <View style={styles.summaryStat}>
                <Car size={16} color="#ffffff" />
                <Text style={styles.summaryStatText}>
                  {formatCurrency(expenseStats.averagePerCar)}/auto
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: theme.cardBackground }]}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={18} color={theme.text} />
          <Text style={[styles.filterButtonText, { color: theme.text }]}>
            {selectedCar ? cars.find(c => c.id === selectedCar)?.model : 'Tutti i veicoli'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'stats' && { backgroundColor: theme.accent }
            ]}
            onPress={() => setViewMode('stats')}
          >
            <PieChart size={18} color={viewMode === 'stats' ? '#ffffff' : theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'list' && { backgroundColor: theme.accent }
            ]}
            onPress={() => setViewMode('list')}
          >
            <FileText size={18} color={viewMode === 'list' ? '#ffffff' : theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'stats' ? (
        /* Statistics View */
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.categoriesSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Spese per Categoria
            </Text>
            {expenseStats.categories.map(renderCategoryCard)}
          </View>

          {/* Recent Expenses */}
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Spese Recenti
              </Text>
              <TouchableOpacity onPress={() => setViewMode('list')}>
                <Text style={[styles.seeAllText, { color: theme.accent }]}>
                  Vedi tutte
                </Text>
              </TouchableOpacity>
            </View>
            {expenseStats.expenses.slice(0, 5).map((expense, index) => (
              <View key={expense.id || index}>
                {renderExpenseItem({ item: expense })}
              </View>
            ))}
          </View>

          {/* Export Button */}
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: theme.cardBackground }]}
            activeOpacity={0.8}
          >
            <Download size={20} color={theme.accent} />
            <Text style={[styles.exportButtonText, { color: theme.accent }]}>
              Esporta Report Spese
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* List View */
        <FlatList
          data={expenseStats.expenses}
          renderItem={renderExpenseItem}
          keyExtractor={(item, index) => item.id || index.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <DollarSign size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Nessuna spesa registrata
              </Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Aggiungi la prima spesa per iniziare a monitorare i costi
              </Text>
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View 
            style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Filtra per veicolo
              </Text>
            </View>
            
            <TouchableOpacity
              style={[
                styles.filterOption,
                !selectedCar && { backgroundColor: theme.accent + '20' }
              ]}
              onPress={() => {
                setSelectedCar(null);
                setShowFilterModal(false);
              }}
            >
              <Text style={[
                styles.filterOptionText,
                { color: !selectedCar ? theme.accent : theme.text }
              ]}>
                Tutti i veicoli
              </Text>
            </TouchableOpacity>
            
            {cars.map(car => (
              <TouchableOpacity
                key={car.id}
                style={[
                  styles.filterOption,
                  selectedCar === car.id && { backgroundColor: theme.accent + '20' }
                ]}
                onPress={() => {
                  setSelectedCar(car.id);
                  setShowFilterModal(false);
                }}
              >
                <Car size={20} color={selectedCar === car.id ? theme.accent : theme.textSecondary} />
                <Text style={[
                  styles.filterOptionText,
                  { color: selectedCar === car.id ? theme.accent : theme.text }
                ]}>
                  {car.make} {car.model} - {car.licensePlate}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryCard: {
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryGradient: {
    padding: 20,
  },
  summaryContent: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginVertical: 8,
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 8,
  },
  summaryStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryStatText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 2,
  },
  viewToggleButton: {
    padding: 8,
    borderRadius: 6,
  },
  categoriesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 16,
  },
  categoryName: {
    fontSize: 14,
  },
  categoryAmount: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 2,
  },
  categoryPercentage: {
    alignItems: 'flex-end',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  percentageBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  percentageFill: {
    height: '100%',
    borderRadius: 2,
  },
  recentSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '500',
  },
  expenseCar: {
    fontSize: 12,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  filterOptionText: {
    fontSize: 16,
    flex: 1,
  },
});

export default ExpenseTrackerScreen;
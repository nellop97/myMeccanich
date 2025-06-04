// src/screens/user/ExpensesListScreen.tsx
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
    Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    DollarSign,
    Plus,
    Search,
    Filter,
    Calendar,
    TrendingUp,
    TrendingDown,
    Fuel,
    Wrench,
    FileText,
    CreditCard,
    ArrowLeft,
    Settings,
    PieChart,
    BarChart3
} from 'lucide-react-native';

import {
    PrimaryButton,
    SecondaryButton,
    StatusBadge,
    ModernCard,
    StatCard,
    FormInput,
    ListItem,
    FloatingActionButton,
    EmptyState,
    theme
} from '../../components/GlobalComponents';

import { useStore } from '../../store';
import { useUserCarsStore } from '../../store/userCarsStore';

const { width: screenWidth } = Dimensions.get('window');

const EXPENSE_CATEGORIES = {
    fuel: { name: 'Carburante', icon: Fuel, color: '#06b6d4' },
    maintenance: { name: 'Manutenzione', icon: Wrench, color: '#8b5cf6' },
    insurance: { name: 'Assicurazione', icon: FileText, color: '#10b981' },
    tax: { name: 'Tasse', icon: CreditCard, color: '#f59e0b' },
    parking: { name: 'Parcheggio', icon: DollarSign, color: '#6b7280' },
    tolls: { name: 'Pedaggi', icon: DollarSign, color: '#ef4444' },
    other: { name: 'Altro', icon: DollarSign, color: '#8b5cf6' }
};

const ExpensesListScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { darkMode } = useStore();
    const { cars, getCarById, getCarStats } = useUserCarsStore();

    // Get carId from route params if navigating from specific car
    const carId = route.params?.carId;
    const selectedCar = carId ? getCarById(carId) : null;

    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all'); // all, thisMonth, lastMonth, category
    const [selectedCarFilter, setSelectedCarFilter] = useState(carId || 'all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [dateRange, setDateRange] = useState('thisMonth'); // thisMonth, lastMonth, thisYear

    // Get all expense records
    const getAllExpenses = () => {
        let allExpenses: any[] = [];

        cars.forEach(car => {
            if (selectedCarFilter === 'all' || car.id === selectedCarFilter) {
                car.expenses.forEach(expense => {
                    allExpenses.push({
                        ...expense,
                        carId: car.id,
                        carInfo: `${car.make} ${car.model}`,
                        carPlate: car.licensePlate
                    });
                });
            }
        });

        return allExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    // Filter expenses
    const getFilteredExpenses = () => {
        let filtered = getAllExpenses();

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(expense =>
                expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                expense.carInfo.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(expense => expense.category === selectedCategory);
        }

        // Date range filter
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        switch (dateRange) {
            case 'thisMonth':
                filtered = filtered.filter(expense => {
                    const expenseDate = new Date(expense.date);
                    return expenseDate.getMonth() === thisMonth && expenseDate.getFullYear() === thisYear;
                });
                break;
            case 'lastMonth':
                const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
                const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
                filtered = filtered.filter(expense => {
                    const expenseDate = new Date(expense.date);
                    return expenseDate.getMonth() === lastMonth && expenseDate.getFullYear() === lastMonthYear;
                });
                break;
            case 'thisYear':
                filtered = filtered.filter(expense => {
                    const expenseDate = new Date(expense.date);
                    return expenseDate.getFullYear() === thisYear;
                });
                break;
        }

        return filtered;
    };

    const filteredExpenses = getFilteredExpenses();

    const onRefresh = async () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    // Get expense statistics
    const getExpenseStats = () => {
        const allExpenses = getAllExpenses();
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

        let totalAmount = 0;
        let thisMonthAmount = 0;
        let lastMonthAmount = 0;
        let categoryTotals: { [key: string]: number } = {};

        allExpenses.forEach(expense => {
            totalAmount += expense.amount;

            const expenseDate = new Date(expense.date);

            // This month
            if (expenseDate.getMonth() === thisMonth && expenseDate.getFullYear() === thisYear) {
                thisMonthAmount += expense.amount;
            }

            // Last month
            if (expenseDate.getMonth() === lastMonth && expenseDate.getFullYear() === lastMonthYear) {
                lastMonthAmount += expense.amount;
            }

            // Category totals
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        });

        const monthlyChange = lastMonthAmount > 0
            ? ((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100
            : 0;

        return {
            totalExpenses: allExpenses.length,
            totalAmount,
            thisMonthAmount,
            lastMonthAmount,
            monthlyChange,
            categoryTotals,
            avgMonthlyExpense: totalAmount / 12 // Simplified calculation
        };
    };

    const stats = getExpenseStats();

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

    const getCategoryInfo = (category: string) => {
        return EXPENSE_CATEGORIES[category] || EXPENSE_CATEGORIES.other;
    };

    const ExpenseCard = ({ expense }: { expense: any }) => {
        const categoryInfo = getCategoryInfo(expense.category);
        const IconComponent = categoryInfo.icon;

        return (
            <ModernCard
                style={styles.expenseCard}
                onPress={() => navigation.navigate('ExpenseDetail', {
                    carId: expense.carId,
                    expenseId: expense.id
                })}
            >
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
                            <IconComponent size={20} color={categoryInfo.color} />
                        </View>
                        <View style={styles.cardInfo}>
                            <Text style={styles.expenseTitle}>{expense.description}</Text>
                            <Text style={styles.carInfo}>{expense.carInfo} • {expense.carPlate}</Text>
                        </View>
                    </View>
                    <View style={styles.cardHeaderRight}>
                        <Text style={styles.expenseAmount}>
                            {formatCurrency(expense.amount)}
                        </Text>
                        <StatusBadge status={categoryInfo.name} size="small" />
                    </View>
                </View>

                {/* Details */}
                <View style={styles.cardDetails}>
                    <View style={styles.detailRow}>
                        <Calendar size={16} color={theme.textSecondary} />
                        <Text style={styles.detailText}>
                            {formatDate(expense.date)}
                        </Text>
                    </View>

                    {expense.mileage && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailText}>
                                {expense.mileage.toLocaleString()} km
                            </Text>
                        </View>
                    )}
                </View>
            </ModernCard>
        );
    };

    const FilterChip = ({ title, value, active, count }: any) => (
        <TouchableOpacity
            style={[styles.filterChip, active && styles.filterChipActive]}
            onPress={() => {
                if (value.startsWith('date_')) {
                    setDateRange(value.replace('date_', ''));
                } else if (value.startsWith('cat_')) {
                    setSelectedCategory(value.replace('cat_', ''));
                }
            }}
        >
            <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {title}
                {count !== undefined && (
                    <Text style={[styles.filterChipCount, active && styles.filterChipCountActive]}>
                        {' '}({count})
                    </Text>
                )}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    {selectedCar && (
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <ArrowLeft size={24} color={theme.text} />
                        </TouchableOpacity>
                    )}
                    <View style={styles.headerTitles}>
                        <Text style={styles.headerTitle}>
                            {selectedCar ? 'Spese Auto' : 'Tutte le Spese'}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            {selectedCar
                                ? `${selectedCar.make} ${selectedCar.model}`
                                : `${stats.totalExpenses} spese registrate`
                            }
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => navigation.navigate('ExpenseReports')}
                >
                    <BarChart3 size={20} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <FormInput
                    placeholder="Cerca spese..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    icon={Search}
                />
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <StatCard
                        title="Spese Totali"
                        value={formatCurrency(stats.totalAmount)}
                        icon={DollarSign}
                        iconColor={theme.success}
                        onPress={() => navigation.navigate('ExpenseReports')}
                    />
                    <StatCard
                        title="Questo Mese"
                        value={formatCurrency(stats.thisMonthAmount)}
                        subtitle={`${stats.monthlyChange >= 0 ? '+' : ''}${stats.monthlyChange.toFixed(1)}% vs mese scorso`}
                        icon={stats.monthlyChange >= 0 ? TrendingUp : TrendingDown}
                        iconColor={stats.monthlyChange >= 0 ? theme.success : theme.error}
                        trend={{
                            value: `${Math.abs(stats.monthlyChange).toFixed(1)}%`,
                            positive: stats.monthlyChange >= 0
                        }}
                    />
                    <StatCard
                        title="Media Mensile"
                        value={formatCurrency(stats.avgMonthlyExpense)}
                        icon={BarChart3}
                        iconColor={theme.info}
                    />
                </ScrollView>
            </View>

            {/* Date Range Filter */}
            <View style={styles.filtersContainer}>
                <Text style={styles.filterSectionTitle}>Periodo</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <FilterChip
                        title="Questo Mese"
                        value="date_thisMonth"
                        active={dateRange === 'thisMonth'}
                    />
                    <FilterChip
                        title="Mese Scorso"
                        value="date_lastMonth"
                        active={dateRange === 'lastMonth'}
                    />
                    <FilterChip
                        title="Quest'Anno"
                        value="date_thisYear"
                        active={dateRange === 'thisYear'}
                    />
                </ScrollView>
            </View>

            {/* Category Filter */}
            <View style={styles.filtersContainer}>
                <Text style={styles.filterSectionTitle}>Categoria</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <FilterChip
                        title="Tutte"
                        value="cat_all"
                        active={selectedCategory === 'all'}
                    />
                    {Object.entries(EXPENSE_CATEGORIES).map(([key, category]) => (
                        <FilterChip
                            key={key}
                            title={category.name}
                            value={`cat_${key}`}
                            active={selectedCategory === key}
                            count={stats.categoryTotals[key] ? Object.keys(stats.categoryTotals).length : 0}
                        />
                    ))}
                </ScrollView>
            </View>

            {/* Car Filter (if not from specific car) */}
            {!selectedCar && cars.length > 1 && (
                <View style={styles.carFilterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity
                            style={[styles.carFilterChip, selectedCarFilter === 'all' && styles.carFilterChipActive]}
                            onPress={() => setSelectedCarFilter('all')}
                        >
                            <Text style={[styles.carFilterText, selectedCarFilter === 'all' && styles.carFilterTextActive]}>
                                Tutte le auto
                            </Text>
                        </TouchableOpacity>
                        {cars.filter(car => car.isActive).map(car => (
                            <TouchableOpacity
                                key={car.id}
                                style={[styles.carFilterChip, selectedCarFilter === car.id && styles.carFilterChipActive]}
                                onPress={() => setSelectedCarFilter(car.id)}
                            >
                                <Text style={[styles.carFilterText, selectedCarFilter === car.id && styles.carFilterTextActive]}>
                                    {car.make} {car.model}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Expenses List */}
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
                {filteredExpenses.length === 0 ? (
                    <EmptyState
                        icon={DollarSign}
                        title={searchQuery ? "Nessun risultato" : "Nessuna spesa"}
                        subtitle={
                            searchQuery
                                ? "Prova a modificare i criteri di ricerca"
                                : selectedCar
                                    ? "Non ci sono ancora spese registrate per questo veicolo"
                                    : "Inizia a tracciare le spese delle tue auto"
                        }
                        actionTitle={!searchQuery ? "Aggiungi Spesa" : undefined}
                        onAction={!searchQuery ? () => navigation.navigate('AddExpense', { carId: selectedCar?.id }) : undefined}
                    />
                ) : (
                    <View style={styles.expensesList}>
                        {/* Monthly Groups */}
                        {Object.entries(
                            filteredExpenses.reduce((groups, expense) => {
                                const month = new Date(expense.date).toLocaleDateString('it-IT', {
                                    month: 'long',
                                    year: 'numeric'
                                });
                                if (!groups[month]) groups[month] = [];
                                groups[month].push(expense);
                                return groups;
                            }, {} as { [key: string]: any[] })
                        ).map(([month, expenses]) => (
                            <View key={month} style={styles.monthGroup}>
                                <Text style={styles.monthHeader}>{month}</Text>
                                <Text style={styles.monthTotal}>
                                    {formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}
                                </Text>
                                {expenses.map((expense) => (
                                    <ExpenseCard key={expense.id} expense={expense} />
                                ))}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Floating Action Button */}
            <FloatingActionButton
                onPress={() => navigation.navigate('AddExpense', { carId: selectedCar?.id })}
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        backgroundColor: theme.cardBackground,
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
        color: theme.text,
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 2,
    },
    settingsButton: {
        padding: 8,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        backgroundColor: theme.cardBackground,
    },
    statsContainer: {
        paddingVertical: 16,
        backgroundColor: theme.cardBackground,
    },
    filtersContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: theme.cardBackground,
    },
    filterSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 8,
    },
    carFilterContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: theme.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: 'transparent',
    },
    filterChipActive: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.textSecondary,
    },
    filterChipTextActive: {
        color: '#ffffff',
    },
    filterChipCount: {
        fontSize: 12,
        color: theme.textSecondary,
    },
    filterChipCountActive: {
        color: '#ffffff',
    },
    carFilterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        borderRadius: 16,
        backgroundColor: theme.border,
    },
    carFilterChipActive: {
        backgroundColor: theme.accent,
    },
    carFilterText: {
        fontSize: 12,
        fontWeight: '500',
        color: theme.textSecondary,
    },
    carFilterTextActive: {
        color: '#ffffff',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    expensesList: {
        gap: 16,
    },
    monthGroup: {
        marginBottom: 24,
    },
    monthHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 4,
    },
    monthTotal: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.primary,
        marginBottom: 12,
    },
    expenseCard: {
        marginBottom: 12,
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
    expenseTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 2,
    },
    carInfo: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    cardHeaderRight: {
        alignItems: 'flex-end',
        marginLeft: 12,
    },
    expenseAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 4,
    },
    cardDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        fontSize: 14,
        color: theme.textSecondary,
        marginLeft: 4,
    },
});

export default ExpensesListScreen;

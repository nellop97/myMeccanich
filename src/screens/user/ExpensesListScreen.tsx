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
    TextInput
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
    DollarSign,
    Plus,
    Search,
    Calendar,
    TrendingUp,
    TrendingDown,
    Fuel,
    Wrench,
    FileText,
    CreditCard,
    ArrowLeft,
    BarChart3
} from 'lucide-react-native';
import { useStore } from '../../store';
import { useUserCarsStore } from '@/src/store/useCarsStore';

const { width: screenWidth } = Dimensions.get('window');

// Theme object for consistent styling
const theme = {
    background: '#f3f4f6',
    cardBackground: '#ffffff',
    text: '#000000',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    primary: '#2563eb',
    accent: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    shadow: 'rgba(0, 0, 0, 0.1)',
};

// Local FormInput for Search
const FormInput = ({ icon: Icon, ...props }) => (
    <View style={styles.inputWrapper}>
        {Icon && <Icon size={20} color={theme.textSecondary} style={styles.inputIcon} />}
        <TextInput
            style={styles.input}
            placeholderTextColor={theme.textSecondary}
            {...props}
        />
    </View>
);

// Local StatCard
const StatCard = ({ title, value, subtitle, icon: Icon, iconColor, trend, onPress }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
        <View style={styles.statCardHeader}>
            <View style={[styles.statIconContainer, { backgroundColor: iconColor + '20' }]}>
                <Icon size={20} color={iconColor} />
            </View>
            <Text style={styles.statTitle}>{title}</Text>
        </View>
        <Text style={styles.statValue}>{value}</Text>
        {subtitle && <Text style={[styles.statSubtitle, { color: trend?.positive ? theme.success : theme.error }]}>{subtitle}</Text>}
    </TouchableOpacity>
);

// Local EmptyState
const EmptyState = ({ icon: Icon, title, subtitle, actionTitle, onAction }) => (
    <View style={styles.emptyStateContainer}>
        <Icon size={48} color={theme.textSecondary} style={{ marginBottom: 16 }} />
        <Text style={styles.emptyStateTitle}>{title}</Text>
        <Text style={styles.emptyStateSubtitle}>{subtitle}</Text>
        {actionTitle && (
            <TouchableOpacity style={styles.emptyStateButton} onPress={onAction}>
                <Text style={styles.emptyStateButtonText}>{actionTitle}</Text>
            </TouchableOpacity>
        )}
    </View>
);

// Local FloatingActionButton
const FloatingActionButton = ({ onPress, icon: Icon }) => (
    <TouchableOpacity style={styles.fab} onPress={onPress}>
        <Icon size={24} color="#ffffff" />
    </TouchableOpacity>
);

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
    const { cars, getCarById } = useUserCarsStore();

    if (darkMode) {
      theme.background = '#111827';
      theme.cardBackground = '#1f2937';
      theme.text = '#ffffff';
      theme.textSecondary = '#9ca3af';
      theme.border = '#374151';
      theme.shadow = 'rgba(0, 0, 0, 0.3)';
    }

    const carId = route.params?.carId;
    const selectedCar = carId ? getCarById(carId) : null;

    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [dateRange, setDateRange] = useState('thisMonth');
    const [selectedCarFilter, setSelectedCarFilter] = useState(carId || 'all');

    const getAllExpenses = () => {
        let allExpenses: any[] = [];
        cars.forEach(car => {
            if (selectedCarFilter === 'all' || car.id === selectedCarFilter) {
                (car.expenses || []).forEach(expense => {
                    allExpenses.push({ ...expense, carId: car.id, carInfo: `${car.make} ${car.model}`, carPlate: car.licensePlate });
                });
            }
        });
        return allExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const getFilteredExpenses = () => {
        let filtered = getAllExpenses();
        if (searchQuery) filtered = filtered.filter(e => e.description.toLowerCase().includes(searchQuery.toLowerCase()) || e.category.toLowerCase().includes(searchQuery.toLowerCase()) || e.carInfo.toLowerCase().includes(searchQuery.toLowerCase()));
        if (selectedCategory !== 'all') filtered = filtered.filter(e => e.category === selectedCategory);
        
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        switch (dateRange) {
            case 'thisMonth': filtered = filtered.filter(e => new Date(e.date).getMonth() === thisMonth && new Date(e.date).getFullYear() === thisYear); break;
            case 'lastMonth': const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1; const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear; filtered = filtered.filter(e => new Date(e.date).getMonth() === lastMonth && new Date(e.date).getFullYear() === lastMonthYear); break;
            case 'thisYear': filtered = filtered.filter(e => new Date(e.date).getFullYear() === thisYear); break;
        }
        return filtered;
    };

    const filteredExpenses = getFilteredExpenses();

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    const getExpenseStats = () => {
        const allExpenses = getAllExpenses();
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

        let totalAmount = 0, thisMonthAmount = 0, lastMonthAmount = 0;
        let categoryTotals: { [key: string]: number } = {};

        allExpenses.forEach(expense => {
            totalAmount += expense.amount;
            const expenseDate = new Date(expense.date);
            if (expenseDate.getMonth() === thisMonth && expenseDate.getFullYear() === thisYear) thisMonthAmount += expense.amount;
            if (expenseDate.getMonth() === lastMonth && expenseDate.getFullYear() === lastMonthYear) lastMonthAmount += expense.amount;
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        });

        const monthlyChange = lastMonthAmount > 0 ? ((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100 : 0;
        return { totalExpenses: allExpenses.length, totalAmount, thisMonthAmount, monthlyChange, categoryTotals, avgMonthlyExpense: totalAmount / 12 };
    };

    const stats = getExpenseStats();
    const formatCurrency = (amount: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
    const getCategoryInfo = (category: string) => EXPENSE_CATEGORIES[category] || EXPENSE_CATEGORIES.other;

    const ExpenseCard = ({ expense }: { expense: any }) => {
        const categoryInfo = getCategoryInfo(expense.category);
        const IconComponent = categoryInfo.icon;
        return (
            <TouchableOpacity style={styles.expenseCard} onPress={() => navigation.navigate('ExpenseDetail', { carId: expense.carId, expenseId: expense.id })}>
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
                        <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
                        <View style={styles.statusBadge}><Text style={styles.statusBadgeText}>{categoryInfo.name}</Text></View>
                    </View>
                </View>
                <View style={styles.cardDetails}>
                    <View style={styles.detailRow}><Calendar size={16} color={theme.textSecondary} /><Text style={styles.detailText}>{formatDate(expense.date)}</Text></View>
                    {expense.mileage && <View style={styles.detailRow}><Text style={styles.detailText}>{expense.mileage.toLocaleString()} km</Text></View>}
                </View>
            </TouchableOpacity>
        );
    };
    
    // ... rest of the component logic ...

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} translucent={false} />
        
            <View style={styles.header}>
                 {/* Header content here */}
            </View>

            <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary}/>}>
                {/* Search, Stats, Filters */}
                {filteredExpenses.length === 0 ? (
                    <EmptyState icon={DollarSign} title={searchQuery ? "Nessun risultato" : "Nessuna spesa"} subtitle={searchQuery ? "Prova a modificare i criteri di ricerca" : (selectedCar ? "Non ci sono ancora spese per questo veicolo" : "Inizia a tracciare le spese")} actionTitle={!searchQuery ? "Aggiungi Spesa" : undefined} onAction={!searchQuery ? () => navigation.navigate('AddExpense', { carId: selectedCar?.id }) : undefined} />
                ) : (
                    <View style={styles.expensesList}>
                        {Object.entries(filteredExpenses.reduce((groups, expense) => {
                            const month = new Date(expense.date).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
                            if (!groups[month]) groups[month] = [];
                            groups[month].push(expense);
                            return groups;
                        }, {} as { [key: string]: any[] })).map(([month, expenses]) => (
                            <View key={month} style={styles.monthGroup}>
                                <Text style={styles.monthHeader}>{month}</Text>
                                <Text style={styles.monthTotal}>{formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}</Text>
                                {expenses.map(expense => <ExpenseCard key={expense.id} expense={expense} />)}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            <FloatingActionButton onPress={() => navigation.navigate('AddExpense', { carId: selectedCar?.id })} icon={Plus} />
        </SafeAreaView>
    );
};

// Merged and updated styles
const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.cardBackground },
    //... other header styles
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 12, marginHorizontal: 16, marginTop: 16 },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, height: 50, color: theme.text, fontSize: 16 },
    statCard: { width: screenWidth * 0.5, backgroundColor: theme.cardBackground, borderRadius: 12, padding: 16, marginRight: 12, borderWidth: 1, borderColor: theme.border },
    statCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    statIconContainer: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    statTitle: { fontSize: 14, color: theme.textSecondary },
    statValue: { fontSize: 22, fontWeight: 'bold', color: theme.text },
    statSubtitle: { fontSize: 12, marginTop: 2 },
    emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 50 },
    emptyStateTitle: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginTop: 16, textAlign: 'center' },
    emptyStateSubtitle: { fontSize: 16, color: theme.textSecondary, marginTop: 8, textAlign: 'center' },
    emptyStateButton: { marginTop: 24, backgroundColor: theme.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    emptyStateButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
    fab: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 8 },
    expenseCard: { backgroundColor: theme.cardBackground, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    categoryIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    cardInfo: { flex: 1 },
    expenseTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 2 },
    carInfo: { fontSize: 14, color: theme.textSecondary },
    cardHeaderRight: { alignItems: 'flex-end', marginLeft: 12 },
    expenseAmount: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
    statusBadge: { backgroundColor: theme.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    statusBadgeText: { fontSize: 12, fontWeight: '500', color: theme.textSecondary },
    cardDetails: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    detailRow: { flexDirection: 'row', alignItems: 'center' },
    detailText: { fontSize: 14, color: theme.textSecondary, marginLeft: 4 },
    expensesList: { padding: 16, gap: 16 },
    monthGroup: { marginBottom: 24 },
    monthHeader: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
    monthTotal: { fontSize: 16, fontWeight: '600', color: theme.primary, marginBottom: 12 },
});


export default ExpensesListScreen;
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
    Wrench,
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
    User,
    ArrowLeft,
    Settings,
    TrendingUp,
    Archive
} from 'lucide-react-native';

import {
    PrimaryButton,
    StatusBadge,
    FormInput,
    SecondaryButton,
    ModernCard,
    StatCard,
    ListItem,
    FloatingActionButton,
    EmptyState,
    theme
} from '../../components/GlobalComponents';

import { useStore } from '../../store';
import { useUserCarsStore } from '../../store/userCarsStore';

const { width: screenWidth } = Dimensions.get('window');

const MaintenanceListScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { darkMode } = useStore();
    const { cars, getCarById, getCarStats } = useUserCarsStore();

    // Get carId from route params if navigating from specific car
    const carId = route.params?.carId;
    const selectedCar = carId ? getCarById(carId) : null;

    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all'); // all, upcoming, overdue, completed
    const [selectedCarFilter, setSelectedCarFilter] = useState(carId || 'all');

    // Get all maintenance records
    const getAllMaintenanceRecords = () => {
        let allRecords: any[] = [];

        cars.forEach(car => {
            if (selectedCarFilter === 'all' || car.id === selectedCarFilter) {
                car.maintenanceRecords.forEach(record => {
                    allRecords.push({
                        ...record,
                        carId: car.id,
                        carInfo: `${car.make} ${car.model}`,
                        carPlate: car.licensePlate
                    });
                });
            }
        });

        return allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    // Filter maintenance records
    const getFilteredRecords = () => {
        let filtered = getAllMaintenanceRecords();

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(record =>
                record.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                record.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                record.workshop?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                record.carInfo.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Status filter
        const now = new Date();
        switch (selectedFilter) {
            case 'upcoming':
                filtered = filtered.filter(record => {
                    if (!record.nextDueDate) return false;
                    const dueDate = new Date(record.nextDueDate);
                    return dueDate > now;
                });
                break;
            case 'overdue':
                filtered = filtered.filter(record => {
                    if (!record.nextDueDate) return false;
                    const dueDate = new Date(record.nextDueDate);
                    return dueDate < now;
                });
                break;
            case 'completed':
                filtered = filtered.filter(record => record.status === 'completed');
                break;
        }

        return filtered;
    };

    const filteredRecords = getFilteredRecords();

    const onRefresh = async () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    // Get overall maintenance stats
    const getMaintenanceStats = () => {
        const allRecords = getAllMaintenanceRecords();
        const now = new Date();

        let totalCost = 0;
        let upcomingCount = 0;
        let overdueCount = 0;
        let completedThisMonth = 0;

        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        allRecords.forEach(record => {
            totalCost += record.cost || 0;

            if (record.nextDueDate) {
                const dueDate = new Date(record.nextDueDate);
                if (dueDate > now) {
                    upcomingCount++;
                } else {
                    overdueCount++;
                }
            }

            if (record.status === 'completed') {
                const recordDate = new Date(record.date);
                if (recordDate.getMonth() === thisMonth && recordDate.getFullYear() === thisYear) {
                    completedThisMonth++;
                }
            }
        });

        return {
            totalRecords: allRecords.length,
            totalCost,
            upcomingCount,
            overdueCount,
            completedThisMonth
        };
    };

    const stats = getMaintenanceStats();

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

    const getMaintenanceStatusColor = (record: any) => {
        if (record.status === 'completed') return theme.success;
        if (!record.nextDueDate) return theme.textSecondary;

        const now = new Date();
        const dueDate = new Date(record.nextDueDate);
        const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

        if (daysDiff < 0) return theme.error; // Overdue
        if (daysDiff <= 7) return theme.warning; // Due soon
        return theme.info; // Future
    };

    const getMaintenanceStatusText = (record: any) => {
        if (record.status === 'completed') return 'Completato';
        if (!record.nextDueDate) return 'N/A';

        const now = new Date();
        const dueDate = new Date(record.nextDueDate);
        const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

        if (daysDiff < 0) return `Scaduto ${Math.abs(daysDiff)} giorni fa`;
        if (daysDiff === 0) return 'Scade oggi';
        if (daysDiff <= 7) return `Scade tra ${daysDiff} giorni`;
        return `Scade il ${formatDate(record.nextDueDate)}`;
    };

    const MaintenanceCard = ({ record }: { record: any }) => {
        const statusColor = getMaintenanceStatusColor(record);
        const statusText = getMaintenanceStatusText(record);
        const isOverdue = record.nextDueDate && new Date(record.nextDueDate) < new Date();

        return (
            <ModernCard
                style={[styles.maintenanceCard, isOverdue && styles.overdueCard]}
                onPress={() => navigation.navigate('MaintenanceDetail', {
                    carId: record.carId,
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
                            <Text style={styles.maintenanceTitle}>{record.description}</Text>
                            <Text style={styles.carInfo}>{record.carInfo} • {record.carPlate}</Text>
                        </View>
                    </View>
                    <View style={styles.cardHeaderRight}>
                        <StatusBadge status={statusText} size="small" />
                    </View>
                </View>

                {/* Details */}
                <View style={styles.cardDetails}>
                    <View style={styles.detailRow}>
                        <Calendar size={16} color={theme.textSecondary} />
                        <Text style={styles.detailText}>
                            Eseguito: {formatDate(record.date)}
                        </Text>
                    </View>

                    {record.workshop && (
                        <View style={styles.detailRow}>
                            <MapPin size={16} color={theme.textSecondary} />
                            <Text style={styles.detailText}>{record.workshop}</Text>
                        </View>
                    )}

                    {record.cost && (
                        <View style={styles.detailRow}>
                            <DollarSign size={16} color={theme.textSecondary} />
                            <Text style={styles.detailText}>
                                {formatCurrency(record.cost)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Actions */}
                <View style={styles.cardActions}>
                    <SecondaryButton
                        title="Dettagli"
                        size="small"
                        onPress={() => navigation.navigate('MaintenanceDetail', {
                            carId: record.carId,
                            maintenanceId: record.id
                        })}
                    />
                    {record.nextDueDate && new Date(record.nextDueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                        <PrimaryButton
                            title="Prenota"
                            size="small"
                            onPress={() => navigation.navigate('BookMaintenance', {
                                carId: record.carId,
                                category: record.category
                            })}
                        />
                    )}
                </View>
            </ModernCard>
        );
    };

    const FilterChip = ({ title, value, active, count }: any) => (
        <TouchableOpacity
            style={[styles.filterChip, active && styles.filterChipActive]}
            onPress={() => setSelectedFilter(value)}
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
                            {selectedCar ? 'Manutenzioni' : 'Tutte le Manutenzioni'}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            {selectedCar
                                ? `${selectedCar.make} ${selectedCar.model}`
                                : `${stats.totalRecords} interventi registrati`
                            }
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => navigation.navigate('MaintenanceSettings')}
                >
                    <Settings size={20} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <FormInput
                    placeholder="Cerca manutenzioni..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    icon={Search}
                />
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <StatCard
                        title="Costo Totale"
                        value={formatCurrency(stats.totalCost)}
                        icon={DollarSign}
                        iconColor={theme.success}
                        onPress={() => navigation.navigate('MaintenanceReports')}
                    />
                    <StatCard
                        title="In Scadenza"
                        value={stats.upcomingCount.toString()}
                        icon={Clock}
                        iconColor={theme.info}
                        alert={stats.upcomingCount > 0}
                        onPress={() => setSelectedFilter('upcoming')}
                    />
                    <StatCard
                        title="Scadute"
                        value={stats.overdueCount.toString()}
                        icon={AlertTriangle}
                        iconColor={stats.overdueCount > 0 ? theme.error : theme.success}
                        alert={stats.overdueCount > 0}
                        onPress={() => setSelectedFilter('overdue')}
                    />
                    <StatCard
                        title="Questo Mese"
                        value={stats.completedThisMonth.toString()}
                        icon={CheckCircle}
                        iconColor={theme.success}
                        onPress={() => setSelectedFilter('completed')}
                    />
                </ScrollView>
            </View>

            {/* Filter Chips */}
            <View style={styles.filtersContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <FilterChip
                        title="Tutte"
                        value="all"
                        active={selectedFilter === 'all'}
                        count={getAllMaintenanceRecords().length}
                    />
                    <FilterChip
                        title="In Scadenza"
                        value="upcoming"
                        active={selectedFilter === 'upcoming'}
                        count={stats.upcomingCount}
                    />
                    <FilterChip
                        title="Scadute"
                        value="overdue"
                        active={selectedFilter === 'overdue'}
                        count={stats.overdueCount}
                    />
                    <FilterChip
                        title="Completate"
                        value="completed"
                        active={selectedFilter === 'completed'}
                    />
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

            {/* Maintenance List */}
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
                {filteredRecords.length === 0 ? (
                    <EmptyState
                        icon={Wrench}
                        title={searchQuery ? "Nessun risultato" : "Nessuna manutenzione"}
                        subtitle={
                            searchQuery
                                ? "Prova a modificare i criteri di ricerca"
                                : selectedCar
                                    ? "Non ci sono ancora manutenzioni registrate per questo veicolo"
                                    : "Inizia a tracciare le manutenzioni delle tue auto"
                        }
                        actionTitle={!searchQuery ? "Aggiungi Manutenzione" : undefined}
                        onAction={!searchQuery ? () => navigation.navigate('AddMaintenance', { carId: selectedCar?.id }) : undefined}
                    />
                ) : (
                    <View style={styles.maintenanceList}>
                        {filteredRecords.map((record) => (
                            <MaintenanceCard key={record.id} record={record} />
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Floating Action Button */}
            <FloatingActionButton
                onPress={() => navigation.navigate('AddMaintenance', { carId: selectedCar?.id })}
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
        paddingVertical: 12,
        backgroundColor: theme.cardBackground,
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
    maintenanceList: {
        gap: 16,
    },
    maintenanceCard: {
        marginBottom: 16,
    },
    overdueCard: {
        borderWidth: 2,
        borderColor: theme.error,
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
        color: theme.text,
        marginBottom: 2,
    },
    carInfo: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    cardHeaderRight: {
        marginLeft: 12,
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
        color: theme.textSecondary,
        marginLeft: 8,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 12,
    },
});

export default MaintenanceListScreen;

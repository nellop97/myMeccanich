// src/screens/user/MaintenanceListScreen.tsx
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
    Wrench,
    Plus,
    Search,
    Filter,
    Calendar,
    DollarSign,
    Clock,
    CheckCircle,
    AlertTriangle,
    MapPin,
    ArrowLeft,
    Settings,
    Car,
    TrendingUp
} from 'lucide-react-native';
import { useStore } from '../../store';
import { useUserCarsStore, MaintenanceRecord } from '@/src/store/useCarsStore';

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

// Local components
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

const FloatingActionButton = ({ onPress, icon: Icon }) => (
    <TouchableOpacity style={styles.fab} onPress={onPress}>
        <Icon size={24} color="#ffffff" />
    </TouchableOpacity>
);

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

const StatusBadge = ({ status, size = 'normal' }) => {
    const getStatusStyle = () => {
        switch (status.toLowerCase()) {
            case 'completato':
            case 'completed':
                return { backgroundColor: theme.success + '20', color: theme.success };
            case 'programmato':
            case 'scheduled':
                return { backgroundColor: theme.info + '20', color: theme.info };
            case 'scaduto':
            case 'overdue':
                return { backgroundColor: theme.error + '20', color: theme.error };
            case 'in attesa':
            case 'pending':
                return { backgroundColor: theme.warning + '20', color: theme.warning };
            default:
                return { backgroundColor: theme.textSecondary + '20', color: theme.textSecondary };
        }
    };

    const statusStyle = getStatusStyle();
    const isSmall = size === 'small';

    return (
        <View style={[
            styles.statusBadge,
            { backgroundColor: statusStyle.backgroundColor },
            isSmall && styles.statusBadgeSmall
        ]}>
            <Text style={[
                styles.statusBadgeText,
                { color: statusStyle.color },
                isSmall && styles.statusBadgeTextSmall
            ]}>
                {status}
            </Text>
        </View>
    );
};

interface ExtendedMaintenanceRecord extends MaintenanceRecord {
    carId: string;
    carInfo: string;
    carPlate: string;
}

const MaintenanceListScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { darkMode } = useStore();
    const { cars, getCarById, getCarStats } = useUserCarsStore();
    
    // Adjust theme for dark mode
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
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [selectedCarFilter, setSelectedCarFilter] = useState(carId || 'all');
    const [showFilters, setShowFilters] = useState(false);

    // Get all maintenance records from store
    const getAllMaintenanceRecords = (): ExtendedMaintenanceRecord[] => {
        let allRecords: ExtendedMaintenanceRecord[] = [];

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
    const getFilteredRecords = (): ExtendedMaintenanceRecord[] => {
        let filtered = getAllMaintenanceRecords();

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(record =>
                record.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                record.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                record.workshopName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
                    if (record.status === 'completed') return false;
                    if (!record.nextDueDate) return false;
                    const dueDate = new Date(record.nextDueDate);
                    return dueDate < now;
                });
                break;
            case 'completed':
                filtered = filtered.filter(record => record.status === 'completed');
                break;
            case 'scheduled':
                filtered = filtered.filter(record => record.status === 'scheduled');
                break;
        }

        return filtered;
    };

    // Get maintenance statistics
    const getMaintenanceStats = () => {
        const allRecords = getAllMaintenanceRecords();
        const totalCost = allRecords.reduce((sum, record) => sum + (record.cost || 0), 0);
        const completedCount = allRecords.filter(record => record.status === 'completed').length;
        
        const now = new Date();
        const overdueCount = allRecords.filter(record => {
            if (record.status === 'completed') return false;
            if (!record.nextDueDate) return false;
            return new Date(record.nextDueDate) < now;
        }).length;

        const upcomingCount = allRecords.filter(record => {
            if (!record.nextDueDate) return false;
            const dueDate = new Date(record.nextDueDate);
            const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            return dueDate >= now && dueDate <= in30Days;
        }).length;

        return {
            totalRecords: allRecords.length,
            totalCost,
            completedCount,
            overdueCount,
            upcomingCount
        };
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('it-IT');
    };

    const getStatusInfo = (record: ExtendedMaintenanceRecord) => {
        if (record.status === 'completed') {
            return { text: 'Completato', color: theme.success };
        }
        
        if (record.status === 'scheduled') {
            return { text: 'Programmato', color: theme.info };
        }

        if (record.nextDueDate) {
            const dueDate = new Date(record.nextDueDate);
            const now = new Date();
            
            if (dueDate < now) {
                return { text: 'Scaduto', color: theme.error };
            } else {
                return { text: 'Programmato', color: theme.info };
            }
        }

        return { text: 'In attesa', color: theme.warning };
    };

    const isRecordOverdue = (record: ExtendedMaintenanceRecord) => {
        if (record.status === 'completed') return false;
        if (!record.nextDueDate) return false;
        return new Date(record.nextDueDate) < new Date();
    };

    const onRefresh = () => {
        setRefreshing(true);
        // In una vera app, qui ricaricheresti i dati dal server
        setTimeout(() => setRefreshing(false), 1000);
    };

    const filteredRecords = getFilteredRecords();
    const stats = getMaintenanceStats();

    const MaintenanceCard = ({ record }: { record: ExtendedMaintenanceRecord }) => {
        const statusInfo = getStatusInfo(record);
        const isOverdue = isRecordOverdue(record);

        return (
            <TouchableOpacity 
                style={[styles.maintenanceCard, isOverdue && styles.overdueCard]}
                onPress={() => navigation.navigate('MaintenanceDetail', { 
                    carId: record.carId, 
                    maintenanceId: record.id 
                })}
            >
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <View style={[styles.categoryIcon, { backgroundColor: statusInfo.color + '20' }]}>
                            <Wrench size={20} color={statusInfo.color} />
                        </View>
                        <View style={styles.cardInfo}>
                            <Text style={[styles.maintenanceTitle, { color: theme.text }]}>
                                {record.description}
                            </Text>
                            <Text style={[styles.carInfo, { color: theme.textSecondary }]}>
                                {record.carInfo} • {record.carPlate}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.cardHeaderRight}>
                        <StatusBadge status={statusInfo.text} size="small" />
                    </View>
                </View>

                {/* Details */}
                <View style={styles.cardDetails}>
                    <View style={styles.detailRow}>
                        <Calendar size={16} color={theme.textSecondary} />
                        <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                            Eseguito: {formatDate(record.date)}
                        </Text>
                    </View>

                    {record.workshopName && (
                        <View style={styles.detailRow}>
                            <MapPin size={16} color={theme.textSecondary} />
                            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                                {record.workshopName}
                            </Text>
                        </View>
                    )}

                    {record.cost > 0 && (
                        <View style={styles.detailRow}>
                            <DollarSign size={16} color={theme.textSecondary} />
                            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                                {formatCurrency(record.cost)}
                            </Text>
                        </View>
                    )}

                    {record.nextDueDate && (
                        <View style={styles.detailRow}>
                            <Clock size={16} color={isOverdue ? theme.error : theme.textSecondary} />
                            <Text style={[
                                styles.detailText, 
                                { color: isOverdue ? theme.error : theme.textSecondary }
                            ]}>
                                Prossimo: {formatDate(record.nextDueDate)}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
            
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.cardBackground }]}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        {selectedCar ? 'Manutenzioni' : 'Tutte le Manutenzioni'}
                    </Text>
                    {selectedCar && (
                        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                            {selectedCar.make} {selectedCar.model}
                        </Text>
                    )}
                </View>
                <TouchableOpacity 
                    style={styles.filterButton}
                    onPress={() => setShowFilters(!showFilters)}
                >
                    <Filter size={24} color={theme.text} />
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground }]}>
                <FormInput
                    placeholder="Cerca manutenzioni..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    icon={Search}
                />
            </View>

            {/* Statistics */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    <Text style={[styles.statNumber, { color: theme.text }]}>{stats.totalRecords}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Totale</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    <Text style={[styles.statNumber, { color: theme.success }]}>{stats.completedCount}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Completate</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    <Text style={[styles.statNumber, { color: theme.error }]}>{stats.overdueCount}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Scadute</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    <Text style={[styles.statNumber, { color: theme.primary }]}>{formatCurrency(stats.totalCost)}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Costo Totale</Text>
                </View>
            </ScrollView>

            {/* Filters */}
            {showFilters && (
                <View style={[styles.filtersContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {[
                            { id: 'all', name: 'Tutte' },
                            { id: 'completed', name: 'Completate' },
                            { id: 'scheduled', name: 'Programmate' },
                            { id: 'overdue', name: 'Scadute' },
                            { id: 'upcoming', name: 'Prossime' }
                        ].map(filter => (
                            <TouchableOpacity
                                key={filter.id}
                                style={[
                                    styles.filterChip,
                                    { borderColor: theme.border, backgroundColor: theme.background },
                                    selectedFilter === filter.id && { 
                                        backgroundColor: theme.primary, 
                                        borderColor: theme.primary 
                                    }
                                ]}
                                onPress={() => setSelectedFilter(filter.id)}
                            >
                                <Text style={[
                                    styles.filterText,
                                    { color: theme.text },
                                    selectedFilter === filter.id && { color: '#ffffff' }
                                ]}>
                                    {filter.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Car Filter */}
                    {!selectedCar && cars.length > 1 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carFilters}>
                            <TouchableOpacity
                                style={[
                                    styles.carFilterChip,
                                    { borderColor: theme.border, backgroundColor: theme.background },
                                    selectedCarFilter === 'all' && { 
                                        backgroundColor: theme.primary, 
                                        borderColor: theme.primary 
                                    }
                                ]}
                                onPress={() => setSelectedCarFilter('all')}
                            >
                                <Text style={[
                                    styles.carFilterText,
                                    { color: theme.text },
                                    selectedCarFilter === 'all' && { color: '#ffffff' }
                                ]}>
                                    Tutte le Auto
                                </Text>
                            </TouchableOpacity>
                            {cars.filter(car => car.isActive).map(car => (
                                <TouchableOpacity
                                    key={car.id}
                                    style={[
                                        styles.carFilterChip,
                                        { borderColor: theme.border, backgroundColor: theme.background },
                                        selectedCarFilter === car.id && { 
                                            backgroundColor: theme.primary, 
                                            borderColor: theme.primary 
                                        }
                                    ]}
                                    onPress={() => setSelectedCarFilter(car.id)}
                                >
                                    <Text style={[
                                        styles.carFilterText,
                                        { color: theme.text },
                                        selectedCarFilter === car.id && { color: '#ffffff' }
                                    ]}>
                                        {car.make} {car.model}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
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
                        onAction={!searchQuery ? () => navigation.navigate('AddMaintenance', { 
                            carId: selectedCar?.id 
                        }) : undefined}
                    />
                ) : (
                    filteredRecords.map((record) => (
                        <MaintenanceCard key={record.id} record={record} />
                    ))
                )}
            </ScrollView>

            <FloatingActionButton
                onPress={() => navigation.navigate('AddMaintenance', { carId: selectedCar?.id })}
                icon={Plus}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingVertical: 16, 
        borderBottomWidth: 1 
    },
    backButton: { marginRight: 12 },
    headerCenter: { flex: 1 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    headerSubtitle: { fontSize: 14, marginTop: 2 },
    filterButton: { marginLeft: 12 },
    searchContainer: { paddingHorizontal: 16, paddingTop: 16 },
    inputWrapper: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: theme.background, 
        borderWidth: 1, 
        borderColor: theme.border, 
        borderRadius: 12, 
        paddingHorizontal: 12 
    },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, height: 50, color: theme.text, fontSize: 16 },
    statsContainer: { paddingHorizontal: 16, paddingVertical: 16 },
    statCard: { 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        borderRadius: 12, 
        borderWidth: 1, 
        marginRight: 12, 
        minWidth: 80, 
        alignItems: 'center' 
    },
    statNumber: { fontSize: 18, fontWeight: 'bold' },
    statLabel: { fontSize: 12, marginTop: 2 },
    filtersContainer: { 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        borderTopWidth: 1 
    },
    filterChip: { 
        paddingHorizontal: 16, 
        paddingVertical: 8, 
        borderRadius: 20, 
        borderWidth: 1, 
        marginRight: 8 
    },
    filterText: { fontSize: 14, fontWeight: '500' },
    carFilters: { marginTop: 8 },
    carFilterChip: { 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 16, 
        borderWidth: 1, 
        marginRight: 8 
    },
    carFilterText: { fontSize: 12, fontWeight: '500' },
    content: { flex: 1, paddingHorizontal: 16 },
    maintenanceCard: { 
        backgroundColor: theme.cardBackground, 
        borderRadius: 16, 
        padding: 16, 
        marginBottom: 16, 
        borderWidth: 1, 
        borderColor: theme.border,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    },
    overdueCard: { borderColor: theme.error, borderWidth: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    cardHeaderLeft: { flexDirection: 'row', flex: 1 },
    cardHeaderRight: { marginLeft: 12 },
    categoryIcon: { 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 12 
    },
    cardInfo: { flex: 1 },
    maintenanceTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
    carInfo: { fontSize: 14 },
    cardDetails: { marginTop: 8 },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    detailText: { fontSize: 14, marginLeft: 8 },
    statusBadge: { 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 12 
    },
    statusBadgeSmall: { 
        paddingHorizontal: 8, 
        paddingVertical: 4 
    },
    statusBadgeText: { 
        fontSize: 12, 
        fontWeight: '600' 
    },
    statusBadgeTextSmall: { 
        fontSize: 10 
    },
    fab: { 
        position: 'absolute', 
        right: 20, 
        bottom: 20, 
        width: 60, 
        height: 60, 
        borderRadius: 30, 
        backgroundColor: theme.primary, 
        justifyContent: 'center', 
        alignItems: 'center', 
        elevation: 8,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
    },
    emptyStateContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 40, 
        marginTop: 50 
    },
    emptyStateTitle: { 
        fontSize: 22, 
        fontWeight: 'bold', 
        color: theme.text, 
        marginTop: 16, 
        textAlign: 'center' 
    },
    emptyStateSubtitle: { 
        fontSize: 16, 
        color: theme.textSecondary, 
        marginTop: 8, 
        textAlign: 'center' 
    },
    emptyStateButton: { 
        marginTop: 24, 
        backgroundColor: theme.primary, 
        paddingHorizontal: 24, 
        paddingVertical: 12, 
        borderRadius: 12 
    },
    emptyStateButtonText: { 
        color: '#ffffff', 
        fontSize: 16, 
        fontWeight: '600' 
    },
});

export default MaintenanceListScreen;
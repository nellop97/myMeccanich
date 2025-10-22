// src/screens/user/HomeScreen.tsx
// HomeScreen completa per Owner con Firebase + Responsive + Dark Mode

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Platform,
    RefreshControl,
    ActivityIndicator,
    useWindowDimensions,
    Alert,
} from 'react-native';
import {
    Plus,
    Car,
    Wrench,
    Calendar,
    DollarSign,
    Fuel,
    AlertCircle,
    TrendingUp,
    ChevronRight,
    Bell,
    Settings as SettingsIcon,
    Menu,
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppThemeManager } from '../../hooks/useTheme';

// Firebase
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    onSnapshot,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useStore } from '../../store';

// Services
import { VehicleViewRequestService } from '../../services/VehicleViewRequestService';

// ============================================
// INTERFACES
// ============================================
interface Vehicle {
    id: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    mileage: number;
    imageUrl?: string;
    mainImageUrl?: string;
    color?: string;
    ownerId: string;
    fuel?: string;
}

interface Deadline {
    id: string;
    vehicleId: string;
    type: 'insurance' | 'revision' | 'roadTax' | 'maintenance';
    description: string;
    dueDate: any;
    amount?: number;
    status: 'active' | 'completed' | 'overdue';
    priority: 'low' | 'medium' | 'high';
}

interface RecentActivity {
    id: string;
    vehicleId: string;
    type: 'maintenance' | 'fuel' | 'expense';
    description: string;
    date: any;
    cost: number;
    workshopName?: string;
}

interface MonthlyStats {
    totalExpenses: number;
    totalFuel: number;
    totalMaintenance: number;
    totalKm: number;
}

// ============================================
// HOMESCREEN COMPONENT
// ============================================
const HomeScreen = () => {
    const navigation = useNavigation();
    const { user } = useStore();
    const { colors, isDark } = useAppThemeManager();
    const { width } = useWindowDimensions();

    // Responsive
    const isDesktop = width >= 1024;
    const isTablet = width >= 768 && width < 1024;
    const isMobile = width < 768;

    // Stati
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
    const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({
        totalExpenses: 0,
        totalFuel: 0,
        totalMaintenance: 0,
        totalKm: 0,
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pendingViewRequests, setPendingViewRequests] = useState(0);

    // Dynamic theme colors
    const themeColors = React.useMemo(() => ({
        background: colors.background,
        surface: colors.surface,
        cardBackground: colors.surfaceVariant, // Grigio per le cards
        text: colors.onSurface,
        textSecondary: colors.onSurfaceVariant,
        border: colors.outline,
        primary: colors.primary,
        error: colors.error,
    }), [colors]);

    // ============================================
    // LOAD DATA
    // ============================================
    const loadData = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);

            // Carica veicoli
            const vehiclesQuery = query(
                collection(db, 'vehicles'),
                where('ownerId', '==', user.id),
                where('isActive', '==', true)
            );

            const vehiclesSnapshot = await getDocs(vehiclesQuery);
            const vehiclesList = vehiclesSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Vehicle[];

            setVehicles(vehiclesList);

            // Seleziona primo veicolo se disponibile
            if (vehiclesList.length > 0 && !selectedVehicle) {
                setSelectedVehicle(vehiclesList[0]);
            }

            // Carica scadenze
            if (vehiclesList.length > 0) {
                await loadDeadlines(vehiclesList);
                await loadRecentActivities(vehiclesList);
                await calculateMonthlyStats(vehiclesList);
            }

            // Carica richieste di visualizzazione pendenti
            await loadPendingViewRequests();
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Errore', 'Impossibile caricare i dati');
        } finally {
            setLoading(false);
        }
    }, [user?.id, selectedVehicle]);

    const loadDeadlines = async (vehiclesList: Vehicle[]) => {
        try {
            const vehicleIds = vehiclesList.map((v) => v.id);
            const deadlinesQuery = query(
                collection(db, 'deadlines'),
                where('vehicleId', 'in', vehicleIds),
                where('status', '==', 'active'),
                orderBy('dueDate', 'asc'),
                limit(10)
            );

            const snapshot = await getDocs(deadlinesQuery);
            const deadlinesList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Deadline[];

            setDeadlines(deadlinesList);
        } catch (error) {
            console.error('Error loading deadlines:', error);
        }
    };

    const loadRecentActivities = async (vehiclesList: Vehicle[]) => {
        try {
            const vehicleIds = vehiclesList.map((v) => v.id);
            const activitiesQuery = query(
                collection(db, 'activities'),
                where('vehicleId', 'in', vehicleIds),
                orderBy('date', 'desc'),
                limit(10)
            );

            const snapshot = await getDocs(activitiesQuery);
            const activitiesList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as RecentActivity[];

            setRecentActivities(activitiesList);
        } catch (error) {
            console.error('Error loading activities:', error);
        }
    };

    const calculateMonthlyStats = async (vehiclesList: Vehicle[]) => {
        // TODO: Implementa calcolo stats del mese corrente
        // Per ora dati mock
        setMonthlyStats({
            totalExpenses: 450.50,
            totalFuel: 180.00,
            totalMaintenance: 270.50,
            totalKm: 1250,
        });
    };

    const loadPendingViewRequests = async () => {
        try {
            if (!user?.id) return;

            const viewRequestService = VehicleViewRequestService.getInstance();
            const requests = await viewRequestService.getIncomingRequests(user.id);
            const pendingCount = requests.filter(r => r.status === 'pending').length;
            setPendingViewRequests(pendingCount);
        } catch (error) {
            console.error('Error loading view requests:', error);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    // Carica dati all'avvio
    useEffect(() => {
        loadData();
    }, []);

    // Ricarica dati quando la schermata diventa attiva (es. dopo aggiunta veicolo)
    useFocusEffect(
        useCallback(() => {
            console.log('🔄 HomeScreen focused - Reloading data...');
            loadData();
        }, [loadData])
    );

    // ============================================
    // RENDER HELPERS
    // ============================================
    const getDeadlineColor = (deadline: Deadline) => {
        const dueDate = deadline.dueDate?.toDate?.() || new Date(deadline.dueDate);
        const daysUntil = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil < 0) return '#ef4444'; // Scaduto
        if (daysUntil <= 30) return '#f59e0b'; // In scadenza
        return '#10b981'; // OK
    };

    const formatDate = (date: any) => {
        const d = date?.toDate?.() || new Date(date);
        return d.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'short',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount);
    };

    // ============================================
    // RENDER EMPTY STATE
    // ============================================
    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Caricamento...</Text>
            </View>
        );
    }

    if (vehicles.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>I Miei Veicoli</Text>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => navigation.navigate('Settings' as never)}
                    >
                        <SettingsIcon size={24} color="#64748b" />
                    </TouchableOpacity>
                </View>

                {/* Empty State */}
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                        <Car size={64} color="#cbd5e1" strokeWidth={1.5} />
                    </View>
                    <Text style={styles.emptyTitle}>Nessun Veicolo</Text>
                    <Text style={styles.emptyDescription}>
                        Inizia aggiungendo il tuo primo veicolo per tracciare manutenzioni, scadenze e spese.
                    </Text>
                    <TouchableOpacity
                        style={styles.emptyButton}
                        onPress={() => navigation.navigate('AddVehicle' as never)}
                    >
                        <Plus size={20} color="#fff" strokeWidth={2.5} />
                        <Text style={styles.emptyButtonText}>Aggiungi Veicolo</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ============================================
    // RENDER WEB LAYOUT (Desktop)
    // ============================================
    if (isDesktop || Platform.OS === 'web') {
        return (
            <View style={[styles.webContainer, { backgroundColor: themeColors.background }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.surface} />
                {/* Web Header */}
                <View style={[styles.webHeader, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
                    <View style={styles.webHeaderLeft}>
                        <Text style={[styles.webHeaderTitle, { color: themeColors.text }]}>MyMeccanich</Text>
                        <Text style={[styles.webHeaderGreeting, { color: themeColors.textSecondary }]}>
                            Ciao, {user?.name || 'Benvenuto'}
                        </Text>
                    </View>
                    <View style={styles.webHeaderRight}>
                        <TouchableOpacity
                            style={styles.webHeaderButton}
                            onPress={() => navigation.navigate('AddVehicle' as never)}
                        >
                            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
                            <Text style={styles.webHeaderButtonText}>Nuovo Veicolo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.webIconButton}
                            onPress={() => navigation.navigate('Reminders' as never)}
                        >
                            <Bell size={22} color="#1f2937" />
                            {deadlines.length > 0 && (
                                <View style={styles.webBadge}>
                                    <Text style={styles.webBadgeText}>{deadlines.length}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.webIconButton}
                            onPress={() => navigation.navigate('Settings' as never)}
                        >
                            <SettingsIcon size={22} color="#1f2937" />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView
                    style={styles.webContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    <View style={styles.webGrid}>
                        {/* Left Column - Vehicle & Stats */}
                        <View style={styles.webLeftColumn}>
                            {/* Selected Vehicle Card */}
                            {selectedVehicle && (
                                <View style={styles.webVehicleCard}>
                                    <LinearGradient
                                        colors={['#3b82f6', '#2563eb']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.webVehicleGradient}
                                    >
                                        <View style={styles.webVehicleHeader}>
                                            <View>
                                                <Text style={styles.webVehicleName}>
                                                    {selectedVehicle.make} {selectedVehicle.model}
                                                </Text>
                                                <Text style={styles.webVehiclePlate}>
                                                    {selectedVehicle.licensePlate}
                                                </Text>
                                                <View style={styles.webVehicleTag}>
                                                    <Text style={styles.webVehicleTagText}>
                                                        {selectedVehicle.year} • {selectedVehicle.fuel || 'Benzina'}
                                                    </Text>
                                                </View>
                                            </View>
                                            {selectedVehicle.imageUrl && (
                                                <Image
                                                    source={{ uri: selectedVehicle.imageUrl }}
                                                    style={styles.webVehicleImage}
                                                    resizeMode="contain"
                                                />
                                            )}
                                        </View>
                                        <TouchableOpacity
                                            style={styles.webVehicleButton}
                                            onPress={() =>
                                                navigation.navigate('CarDetail' as never, {
                                                    carId: selectedVehicle.id,
                                                } as never)
                                            }
                                        >
                                            <Text style={styles.webVehicleButtonText}>
                                                Vedi Dettagli
                                            </Text>
                                            <ChevronRight size={18} color="#fff" />
                                        </TouchableOpacity>
                                    </LinearGradient>
                                </View>
                            )}

                            {/* Monthly Stats Grid */}
                            <View style={styles.webStatsGrid}>
                                <View style={styles.webStatCard}>
                                    <View style={[styles.webStatIcon, { backgroundColor: '#dbeafe' }]}>
                                        <DollarSign size={28} color="#3b82f6" strokeWidth={2} />
                                    </View>
                                    <Text style={styles.webStatValue}>
                                        {formatCurrency(monthlyStats.totalExpenses)}
                                    </Text>
                                    <Text style={styles.webStatLabel}>Spese Totali</Text>
                                </View>
                                <View style={styles.webStatCard}>
                                    <View style={[styles.webStatIcon, { backgroundColor: '#fef3c7' }]}>
                                        <Fuel size={28} color="#f59e0b" strokeWidth={2} />
                                    </View>
                                    <Text style={styles.webStatValue}>
                                        {formatCurrency(monthlyStats.totalFuel)}
                                    </Text>
                                    <Text style={styles.webStatLabel}>Carburante</Text>
                                </View>
                                <View style={styles.webStatCard}>
                                    <View style={[styles.webStatIcon, { backgroundColor: '#dbeafe' }]}>
                                        <Wrench size={28} color="#3b82f6" strokeWidth={2} />
                                    </View>
                                    <Text style={styles.webStatValue}>
                                        {formatCurrency(monthlyStats.totalMaintenance)}
                                    </Text>
                                    <Text style={styles.webStatLabel}>Manutenzioni</Text>
                                </View>
                                <View style={styles.webStatCard}>
                                    <View style={[styles.webStatIcon, { backgroundColor: '#dcfce7' }]}>
                                        <TrendingUp size={28} color="#10b981" strokeWidth={2} />
                                    </View>
                                    <Text style={styles.webStatValue}>{monthlyStats.totalKm} km</Text>
                                    <Text style={styles.webStatLabel}>Percorsi</Text>
                                </View>
                            </View>

                            {/* Quick Actions */}
                            <View style={styles.webQuickActions}>
                                <Text style={styles.webSectionTitle}>Azioni Rapide</Text>
                                <View style={styles.webActionGrid}>
                                    <TouchableOpacity
                                        style={styles.webActionCard}
                                        onPress={() =>
                                            navigation.navigate('AddMaintenance' as never, {
                                                carId: selectedVehicle?.id,
                                            } as never)
                                        }
                                    >
                                        <View style={[styles.webActionIcon, { backgroundColor: '#dbeafe' }]}>
                                            <Wrench size={24} color="#3b82f6" />
                                        </View>
                                        <Text style={styles.webActionLabel}>Manutenzione</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.webActionCard}
                                        onPress={() =>
                                            navigation.navigate('AddFuel' as never, {
                                                carId: selectedVehicle?.id,
                                            } as never)
                                        }
                                    >
                                        <View style={[styles.webActionIcon, { backgroundColor: '#fef3c7' }]}>
                                            <Fuel size={24} color="#f59e0b" />
                                        </View>
                                        <Text style={styles.webActionLabel}>Rifornimento</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.webActionCard}
                                        onPress={() =>
                                            navigation.navigate('AddExpense' as never, {
                                                carId: selectedVehicle?.id,
                                            } as never)
                                        }
                                    >
                                        <View style={[styles.webActionIcon, { backgroundColor: '#dcfce7' }]}>
                                            <DollarSign size={24} color="#10b981" />
                                        </View>
                                        <Text style={styles.webActionLabel}>Spesa</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.webActionCard}
                                        onPress={() => navigation.navigate('Reminders' as never)}
                                    >
                                        <View style={[styles.webActionIcon, { backgroundColor: '#fce7f3' }]}>
                                            <Calendar size={24} color="#ec4899" />
                                        </View>
                                        <Text style={styles.webActionLabel}>Promemoria</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Right Column - Deadlines & Activities */}
                        <View style={styles.webRightColumn}>
                            {/* Deadlines */}
                            {deadlines.length > 0 && (
                                <View style={styles.webSection}>
                                    <View style={styles.webSectionHeader}>
                                        <Text style={styles.webSectionTitle}>Prossime Scadenze</Text>
                                        <TouchableOpacity
                                            onPress={() => navigation.navigate('Reminders' as never)}
                                        >
                                            <Text style={styles.webSectionLink}>Vedi tutte</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {deadlines.slice(0, 5).map((deadline) => (
                                        <TouchableOpacity
                                            key={deadline.id}
                                            style={styles.webDeadlineCard}
                                            onPress={() =>
                                                navigation.navigate('CarDetail' as never, {
                                                    carId: deadline.vehicleId,
                                                } as never)
                                            }
                                        >
                                            <View
                                                style={[
                                                    styles.webDeadlineIcon,
                                                    { backgroundColor: getDeadlineColor(deadline) + '20' },
                                                ]}
                                            >
                                                {deadline.type === 'insurance' && (
                                                    <AlertCircle
                                                        size={22}
                                                        color={getDeadlineColor(deadline)}
                                                    />
                                                )}
                                                {deadline.type === 'revision' && (
                                                    <Wrench size={22} color={getDeadlineColor(deadline)} />
                                                )}
                                                {deadline.type === 'roadTax' && (
                                                    <DollarSign
                                                        size={22}
                                                        color={getDeadlineColor(deadline)}
                                                    />
                                                )}
                                            </View>
                                            <View style={styles.webDeadlineInfo}>
                                                <Text style={styles.webDeadlineTitle}>
                                                    {deadline.description}
                                                </Text>
                                                <Text style={styles.webDeadlineDate}>
                                                    {formatDate(deadline.dueDate)}
                                                </Text>
                                            </View>
                                            <ChevronRight size={18} color="#94a3b8" />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Recent Activities */}
                            {recentActivities.length > 0 && (
                                <View style={styles.webSection}>
                                    <Text style={styles.webSectionTitle}>Attività Recenti</Text>
                                    {recentActivities.slice(0, 5).map((activity) => (
                                        <View key={activity.id} style={styles.webActivityCard}>
                                            <View
                                                style={[
                                                    styles.webActivityIcon,
                                                    {
                                                        backgroundColor:
                                                            activity.type === 'maintenance'
                                                                ? '#dbeafe'
                                                                : activity.type === 'fuel'
                                                                    ? '#fef3c7'
                                                                    : '#dcfce7',
                                                    },
                                                ]}
                                            >
                                                {activity.type === 'maintenance' && (
                                                    <Wrench size={22} color="#3b82f6" />
                                                )}
                                                {activity.type === 'fuel' && (
                                                    <Fuel size={22} color="#f59e0b" />
                                                )}
                                                {activity.type === 'expense' && (
                                                    <DollarSign size={22} color="#10b981" />
                                                )}
                                            </View>
                                            <View style={styles.webActivityInfo}>
                                                <Text style={styles.webActivityTitle}>
                                                    {activity.description}
                                                </Text>
                                                <Text style={styles.webActivityDate}>
                                                    {formatDate(activity.date)}
                                                    {activity.workshopName && ` • ${activity.workshopName}`}
                                                </Text>
                                            </View>
                                            <Text style={styles.webActivityAmount}>
                                                {formatCurrency(activity.cost)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Other Vehicles */}
                            {vehicles.length > 1 && (
                                <View style={styles.webSection}>
                                    <Text style={styles.webSectionTitle}>Altri Veicoli</Text>
                                    {vehicles
                                        .filter((v) => v.id !== selectedVehicle?.id)
                                        .map((vehicle) => (
                                            <TouchableOpacity
                                                key={vehicle.id}
                                                style={styles.webOtherVehicleCard}
                                                onPress={() => setSelectedVehicle(vehicle)}
                                            >
                                                <View style={styles.webOtherVehicleIcon}>
                                                    <Car size={24} color="#64748b" />
                                                </View>
                                                <View style={styles.webOtherVehicleInfo}>
                                                    <Text style={styles.webOtherVehicleName}>
                                                        {vehicle.make} {vehicle.model}
                                                    </Text>
                                                    <Text style={styles.webOtherVehiclePlate}>
                                                        {vehicle.licensePlate}
                                                    </Text>
                                                </View>
                                                <ChevronRight size={18} color="#94a3b8" />
                                            </TouchableOpacity>
                                        ))}
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    // ============================================
    // RENDER MOBILE LAYOUT
    // ============================================
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.surface} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
                <View>
                    <Text style={[styles.headerGreeting, { color: themeColors.text }]}>Ciao, {user?.name || 'Benvenuto'}</Text>
                    <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>
                        {vehicles.length} veicol{vehicles.length === 1 ? 'o' : 'i'}
                    </Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => navigation.navigate('Reminders' as never)}
                    >
                        <Bell size={24} color="#64748b" />
                        {deadlines.length > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{deadlines.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => navigation.navigate('Settings' as never)}
                    >
                        <SettingsIcon size={24} color="#64748b" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={[styles.scrollView, { backgroundColor: themeColors.background }]}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Veicolo Selezionato */}
                {selectedVehicle && (
                    <View style={styles.vehicleCard}>
                        <LinearGradient
                            colors={['#3b82f6', '#2563eb']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.vehicleGradient}
                        >
                            <View style={styles.vehicleHeader}>
                                <View style={styles.vehicleInfo}>
                                    <Text style={styles.vehicleName}>
                                        {selectedVehicle.make} {selectedVehicle.model}
                                    </Text>
                                    <Text style={styles.vehiclePlate}>
                                        {selectedVehicle.licensePlate}
                                    </Text>
                                    <View style={styles.vehicleTag}>
                                        <Text style={styles.vehicleTagText}>
                                            {selectedVehicle.year} • {selectedVehicle.fuel || 'Benzina'}
                                        </Text>
                                    </View>
                                </View>

                                {selectedVehicle.imageUrl && (
                                    <Image
                                        source={{ uri: selectedVehicle.imageUrl }}
                                        style={styles.vehicleImage}
                                        resizeMode="contain"
                                    />
                                )}
                            </View>

                            <View style={styles.vehicleActions}>
                                <TouchableOpacity
                                    style={styles.vehicleActionButton}
                                    onPress={() =>
                                        navigation.navigate('CarDetail' as never, {
                                            carId: selectedVehicle.id,
                                        } as never)
                                    }
                                >
                                    <Text style={styles.vehicleActionText}>Dettagli</Text>
                                    <ChevronRight size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>
                )}

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Questo Mese</Text>
                    <View style={[styles.statsGrid, isDesktop && styles.statsGridDesktop]}>
                        <View style={[styles.statCard, { backgroundColor: themeColors.cardBackground }]}>
                            <View style={[styles.statIcon, { backgroundColor: '#eff6ff' }]}>
                                <DollarSign size={24} color="#3b82f6" strokeWidth={2} />
                            </View>
                            <Text style={[styles.statValue, { color: themeColors.text }]}>{formatCurrency(monthlyStats.totalExpenses)}</Text>
                            <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Spese Totali</Text>
                        </View>

                        <View style={[styles.statCard, { backgroundColor: themeColors.cardBackground }]}>
                            <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                                <Fuel size={24} color="#f59e0b" strokeWidth={2} />
                            </View>
                            <Text style={[styles.statValue, { color: themeColors.text }]}>{formatCurrency(monthlyStats.totalFuel)}</Text>
                            <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Carburante</Text>
                        </View>

                        <View style={[styles.statCard, { backgroundColor: themeColors.cardBackground }]}>
                            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                                <Wrench size={24} color="#3b82f6" strokeWidth={2} />
                            </View>
                            <Text style={[styles.statValue, { color: themeColors.text }]}>{formatCurrency(monthlyStats.totalMaintenance)}</Text>
                            <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Manutenzioni</Text>
                        </View>

                        <View style={[styles.statCard, { backgroundColor: themeColors.cardBackground }]}>
                            <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                                <TrendingUp size={24} color="#10b981" strokeWidth={2} />
                            </View>
                            <Text style={[styles.statValue, { color: themeColors.text }]}>{monthlyStats.totalKm} km</Text>
                            <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Percorsi</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActionsContainer}>
                    <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Azioni Rapide</Text>
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={styles.quickActionButton}
                            onPress={() =>
                                navigation.navigate('AddMaintenance' as never, {
                                    carId: selectedVehicle?.id,
                                } as never)
                            }
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: '#dbeafe' }]}>
                                <Wrench size={20} color="#3b82f6" />
                            </View>
                            <Text style={styles.quickActionLabel}>Manutenzione</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickActionButton}
                            onPress={() =>
                                navigation.navigate('AddFuel' as never, {
                                    carId: selectedVehicle?.id,
                                } as never)
                            }
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: '#fef3c7' }]}>
                                <Fuel size={20} color="#f59e0b" />
                            </View>
                            <Text style={styles.quickActionLabel}>Rifornimento</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickActionButton}
                            onPress={() =>
                                navigation.navigate('AddExpense' as never, {
                                    carId: selectedVehicle?.id,
                                } as never)
                            }
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: '#dcfce7' }]}>
                                <DollarSign size={20} color="#10b981" />
                            </View>
                            <Text style={styles.quickActionLabel}>Spesa</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickActionButton}
                            onPress={() => navigation.navigate('Reminders' as never)}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: '#fce7f3' }]}>
                                <Calendar size={20} color="#ec4899" />
                            </View>
                            <Text style={styles.quickActionLabel}>Promemoria</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Vehicle View Requests Actions */}
                    <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 16 }]}>Trasferimento Veicoli</Text>
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={styles.quickActionButton}
                            onPress={() => navigation.navigate('RequestVehicleView' as never)}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: '#ede9fe' }]}>
                                <Car size={20} color="#8b5cf6" />
                            </View>
                            <Text style={styles.quickActionLabel}>Cerca Auto</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickActionButton}
                            onPress={() => navigation.navigate('MyVehicleViewRequests' as never)}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: '#e0f2fe' }]}>
                                <TrendingUp size={20} color="#0284c7" />
                            </View>
                            <Text style={styles.quickActionLabel}>Mie Richieste</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickActionButton}
                            onPress={() => navigation.navigate('ViewRequests' as never)}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: '#fef3c7' }]}>
                                <Bell size={20} color="#f59e0b" />
                                {pendingViewRequests > 0 && (
                                    <View style={styles.quickActionBadge}>
                                        <Text style={styles.quickActionBadgeText}>{pendingViewRequests}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.quickActionLabel}>Richieste</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Prossime Scadenze */}
                {deadlines.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Prossime Scadenze</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Reminders' as never)}>
                                <Text style={styles.sectionLink}>Vedi tutte</Text>
                            </TouchableOpacity>
                        </View>

                        {deadlines.slice(0, 3).map((deadline) => (
                            <TouchableOpacity
                                key={deadline.id}
                                style={[styles.deadlineCard, { backgroundColor: themeColors.cardBackground }]}
                                onPress={() =>
                                    navigation.navigate('CarDetail' as never, {
                                        carId: deadline.vehicleId,
                                    } as never)
                                }
                            >
                                <View
                                    style={[
                                        styles.deadlineIcon,
                                        { backgroundColor: getDeadlineColor(deadline) + '20' },
                                    ]}
                                >
                                    {deadline.type === 'insurance' && (
                                        <AlertCircle size={20} color={getDeadlineColor(deadline)} />
                                    )}
                                    {deadline.type === 'revision' && (
                                        <Wrench size={20} color={getDeadlineColor(deadline)} />
                                    )}
                                    {deadline.type === 'roadTax' && (
                                        <DollarSign size={20} color={getDeadlineColor(deadline)} />
                                    )}
                                </View>

                                <View style={styles.deadlineInfo}>
                                    <Text style={[styles.deadlineTitle, { color: themeColors.text }]}>{deadline.description}</Text>
                                    <Text style={[styles.deadlineDate, { color: themeColors.textSecondary }]}>
                                        Scade il {formatDate(deadline.dueDate)}
                                    </Text>
                                </View>

                                <ChevronRight size={20} color={themeColors.textSecondary} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Attività Recenti */}
                {recentActivities.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Attività Recenti</Text>
                            <TouchableOpacity>
                                <Text style={styles.sectionLink}>Vedi tutte</Text>
                            </TouchableOpacity>
                        </View>

                        {recentActivities.slice(0, 5).map((activity) => (
                            <View key={activity.id} style={[styles.activityCard, { backgroundColor: themeColors.cardBackground }]}>
                                <View
                                    style={[
                                        styles.activityIcon,
                                        {
                                            backgroundColor:
                                                activity.type === 'maintenance'
                                                    ? '#dbeafe'
                                                    : activity.type === 'fuel'
                                                        ? '#fef3c7'
                                                        : '#dcfce7',
                                        },
                                    ]}
                                >
                                    {activity.type === 'maintenance' && (
                                        <Wrench size={20} color="#3b82f6" />
                                    )}
                                    {activity.type === 'fuel' && <Fuel size={20} color="#f59e0b" />}
                                    {activity.type === 'expense' && (
                                        <DollarSign size={20} color="#10b981" />
                                    )}
                                </View>

                                <View style={styles.activityInfo}>
                                    <Text style={[styles.activityTitle, { color: themeColors.text }]}>{activity.description}</Text>
                                    <Text style={[styles.activityDate, { color: themeColors.textSecondary }]}>
                                        {formatDate(activity.date)}
                                        {activity.workshopName && ` • ${activity.workshopName}`}
                                    </Text>
                                </View>

                                <Text style={[styles.activityAmount, { color: themeColors.text }]}>
                                    {formatCurrency(activity.cost)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Le Mie Auto */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Le Mie Auto</Text>
                        <TouchableOpacity
                            style={[styles.addVehicleButton, isDesktop && styles.addVehicleButtonDesktop]}
                            onPress={() => navigation.navigate('AddVehicle' as never)}
                        >
                            <Plus size={18} color="#007AFF" strokeWidth={2.5} />
                            <Text style={styles.addVehicleButtonText}>Aggiungi</Text>
                        </TouchableOpacity>
                    </View>

                    {vehicles.length > 1 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.vehiclesScrollContent}
                        >
                            {vehicles
                                .filter((v) => v.id !== selectedVehicle?.id)
                                .map((vehicle) => (
                                    <TouchableOpacity
                                        key={vehicle.id}
                                        style={[styles.otherVehicleCard, { backgroundColor: themeColors.cardBackground }]}
                                        onPress={() => setSelectedVehicle(vehicle)}
                                    >
                                        <View style={[styles.otherVehicleIcon, { backgroundColor: isDark ? colors.surfaceContainer : '#F2F2F7' }]}>
                                            <Car size={24} color={themeColors.textSecondary} />
                                        </View>
                                        <Text style={[styles.otherVehicleName, { color: themeColors.text }]}>
                                            {vehicle.make} {vehicle.model}
                                        </Text>
                                        <Text style={[styles.otherVehiclePlate, { color: themeColors.textSecondary }]}>
                                            {vehicle.licensePlate}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                        </ScrollView>
                    )}
                </View>

                {/* Spacer finale */}
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

// ============================================
// STYLES - APPLE DESIGN STYLE
// ============================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 20,
        fontSize: 17,
        fontWeight: '400',
        color: '#8E8E93',
        letterSpacing: -0.4,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: Platform.OS === 'web' ? 0.5 : 0,
        borderBottomColor: '#E5E5EA',
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: '700',
        color: '#000000',
        letterSpacing: -0.8,
    },
    headerGreeting: {
        fontSize: 34,
        fontWeight: '700',
        color: '#000000',
        letterSpacing: -0.8,
    },
    headerSubtitle: {
        fontSize: 15,
        fontWeight: '400',
        color: '#8E8E93',
        marginTop: 4,
        letterSpacing: -0.3,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 16,
    },
    headerButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        borderRadius: 22,
        backgroundColor: '#F2F2F7',
    },
    badge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#FF3B30',
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: -0.2,
    },

    // ScrollView
    scrollView: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    scrollContent: {
        padding: 24,
    },
    scrollContentDesktop: {
        maxWidth: 1400,
        alignSelf: 'center',
        width: '100%',
        paddingHorizontal: 80,
        paddingVertical: 40,
    },

    // Empty State
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        backgroundColor: '#F2F2F7',
    },
    emptyIconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#E5E5EA',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    emptyTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: -0.6,
    },
    emptyDescription: {
        fontSize: 17,
        fontWeight: '400',
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
        maxWidth: 400,
        letterSpacing: -0.4,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#007AFF',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 14,
    },
    emptyButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: -0.4,
    },

    // Vehicle Card - Apple Style
    vehicleCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 32,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
            },
            android: {
                elevation: 3,
            },
            web: {
                boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
            },
        }),
    },
    vehicleGradient: {
        padding: 32,
    },
    vehicleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    vehicleInfo: {
        flex: 1,
    },
    vehicleName: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
        letterSpacing: -0.7,
    },
    vehiclePlate: {
        fontSize: 19,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.95)',
        marginBottom: 16,
        letterSpacing: 1.2,
    },
    vehicleTag: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    vehicleTagText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: -0.3,
    },
    vehicleImage: {
        width: 130,
        height: 90,
    },
    vehicleActions: {
        flexDirection: 'row',
        gap: 12,
    },
    vehicleActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    vehicleActionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: -0.3,
    },

    // Stats - Apple Style
    statsContainer: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 20,
        letterSpacing: -0.5,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    statsGridDesktop: {
        flexWrap: 'nowrap',
        gap: 20,
    },
    statCard: {
        flex: 1,
        minWidth: 160,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 1px 12px rgba(0,0,0,0.06)',
            },
        }),
    },
    statIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    statLabel: {
        fontSize: 14,
        fontWeight: '400',
        color: '#8E8E93',
        textAlign: 'center',
        letterSpacing: -0.3,
    },

    // Quick Actions - Apple Style
    quickActionsContainer: {
        marginBottom: 32,
    },
    quickActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    quickActionButton: {
        flex: 1,
        minWidth: 75,
        alignItems: 'center',
        gap: 12,
    },
    quickActionIcon: {
        width: 64,
        height: 64,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickActionLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
        textAlign: 'center',
        letterSpacing: -0.3,
    },
    quickActionBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    quickActionBadgeText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '700',
    },

    // Section - Apple Style
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionLink: {
        fontSize: 15,
        color: '#007AFF',
        fontWeight: '600',
        letterSpacing: -0.3,
    },

    // Deadline Card - Apple Style
    deadlineCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 18,
        marginBottom: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
            android: {
                elevation: 1,
            },
            web: {
                boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
            },
        }),
    },
    deadlineIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    deadlineInfo: {
        flex: 1,
    },
    deadlineTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 5,
        letterSpacing: -0.3,
    },
    deadlineDate: {
        fontSize: 14,
        fontWeight: '400',
        color: '#8E8E93',
        letterSpacing: -0.2,
    },

    // Activity Card - Apple Style
    activityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 18,
        marginBottom: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
            android: {
                elevation: 1,
            },
            web: {
                boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
            },
        }),
    },
    activityIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    activityInfo: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 5,
        letterSpacing: -0.3,
    },
    activityDate: {
        fontSize: 14,
        fontWeight: '400',
        color: '#8E8E93',
        letterSpacing: -0.2,
    },
    activityAmount: {
        fontSize: 17,
        fontWeight: '700',
        color: '#000000',
        letterSpacing: -0.4,
    },

    // Other Vehicles - Apple Style
    vehiclesScrollContent: {
        gap: 12,
    },
    otherVehicleCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginRight: 12,
        width: 150,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
            android: {
                elevation: 1,
            },
            web: {
                boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
            },
        }),
    },
    otherVehicleIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    otherVehicleName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000000',
        textAlign: 'center',
        marginBottom: 5,
        letterSpacing: -0.3,
    },
    otherVehiclePlate: {
        fontSize: 13,
        fontWeight: '400',
        color: '#8E8E93',
        letterSpacing: -0.2,
    },

    // Add Vehicle Button - Apple Style
    addVehicleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    addVehicleButtonDesktop: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    addVehicleButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#007AFF',
        letterSpacing: -0.3,
    },

    // ============================================
    // WEB-SPECIFIC STYLES
    // ============================================
    webContainer: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    webHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        paddingHorizontal: 40,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        ...(Platform.OS === 'web' && {
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }),
    },
    webHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 32,
    },
    webHeaderTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        letterSpacing: -0.5,
    },
    webHeaderGreeting: {
        fontSize: 16,
        fontWeight: '400',
        color: '#6b7280',
    },
    webHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    webHeaderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#3b82f6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
            transition: 'all 0.2s',
        }),
    },
    webHeaderButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ffffff',
    },
    webIconButton: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
            transition: 'all 0.2s',
        }),
    },
    webBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#ef4444',
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
        borderWidth: 2,
        borderColor: '#f3f4f6',
    },
    webBadgeText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '700',
    },
    webContent: {
        flex: 1,
    },
    webGrid: {
        flexDirection: 'row',
        maxWidth: 1600,
        alignSelf: 'center',
        width: '100%',
        paddingHorizontal: 40,
        paddingVertical: 32,
        gap: 32,
    },
    webLeftColumn: {
        flex: 2,
        gap: 24,
    },
    webRightColumn: {
        flex: 1,
        gap: 24,
    },

    // Web Vehicle Card
    webVehicleCard: {
        borderRadius: 16,
        overflow: 'hidden',
        ...(Platform.OS === 'web' && {
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }),
    },
    webVehicleGradient: {
        padding: 32,
    },
    webVehicleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    webVehicleName: {
        fontSize: 32,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8,
        letterSpacing: -0.8,
    },
    webVehiclePlate: {
        fontSize: 20,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.95)',
        marginBottom: 16,
        letterSpacing: 1.5,
    },
    webVehicleTag: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    webVehicleTagText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },
    webVehicleImage: {
        width: 200,
        height: 130,
    },
    webVehicleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 14,
        borderRadius: 12,
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
            transition: 'all 0.2s',
        }),
    },
    webVehicleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },

    // Web Stats Grid
    webStatsGrid: {
        flexDirection: 'row',
        gap: 20,
    },
    webStatCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f3f4f6',
        ...(Platform.OS === 'web' && {
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            cursor: 'pointer',
            transition: 'all 0.2s',
        }),
    },
    webStatIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    webStatValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 6,
        letterSpacing: -0.6,
    },
    webStatLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
        textAlign: 'center',
    },

    // Web Quick Actions
    webQuickActions: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 24,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        ...(Platform.OS === 'web' && {
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }),
    },
    webActionGrid: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 16,
    },
    webActionCard: {
        flex: 1,
        alignItems: 'center',
        gap: 12,
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
        }),
    },
    webActionIcon: {
        width: 70,
        height: 70,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        ...(Platform.OS === 'web' && {
            transition: 'all 0.2s',
        }),
    },
    webActionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
    },

    // Web Section
    webSection: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 24,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        ...(Platform.OS === 'web' && {
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }),
    },
    webSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    webSectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        letterSpacing: -0.4,
    },
    webSectionLink: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3b82f6',
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
        }),
    },

    // Web Deadline Card
    webDeadlineCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginHorizontal: -16,
        marginBottom: 4,
        borderRadius: 10,
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
            transition: 'all 0.2s',
        }),
    },
    webDeadlineIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    webDeadlineInfo: {
        flex: 1,
    },
    webDeadlineTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    webDeadlineDate: {
        fontSize: 13,
        fontWeight: '400',
        color: '#6b7280',
    },

    // Web Activity Card
    webActivityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginHorizontal: -16,
        marginBottom: 4,
        borderRadius: 10,
    },
    webActivityIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    webActivityInfo: {
        flex: 1,
    },
    webActivityTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    webActivityDate: {
        fontSize: 13,
        fontWeight: '400',
        color: '#6b7280',
    },
    webActivityAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },

    // Web Other Vehicle Card
    webOtherVehicleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginHorizontal: -16,
        marginBottom: 4,
        borderRadius: 10,
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
            transition: 'all 0.2s',
        }),
    },
    webOtherVehicleIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    webOtherVehicleInfo: {
        flex: 1,
    },
    webOtherVehicleName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    webOtherVehiclePlate: {
        fontSize: 13,
        fontWeight: '400',
        color: '#6b7280',
    },
});

export default HomeScreen;
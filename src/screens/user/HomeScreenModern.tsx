// src/screens/user/HomeScreenModern.tsx
// Nuovo design moderno per HomeScreen con stesse funzionalità
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
    Modal,
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
    Search,
    Package,
    X,
    MapPin,
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
// HOMESCREEN MODERN COMPONENT
// ============================================
const HomeScreenModern = () => {
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
    const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);

    // Tema moderno
    const theme = React.useMemo(() => ({
        background: isDark ? '#0a0a0a' : '#f8f9fa',
        surface: isDark ? '#1a1a1a' : '#ffffff',
        surfaceElevated: isDark ? '#252525' : '#ffffff',
        card: isDark ? '#1f1f1f' : '#ffffff',
        cardHover: isDark ? '#2a2a2a' : '#f5f5f5',
        text: isDark ? '#ffffff' : '#1a1a1a',
        textSecondary: isDark ? '#a0a0a0' : '#6b7280',
        textTertiary: isDark ? '#707070' : '#9ca3af',
        border: isDark ? '#2a2a2a' : '#e5e7eb',
        borderLight: isDark ? '#1f1f1f' : '#f3f4f6',
        primary: '#6366f1',
        primaryDark: '#4f46e5',
        primaryLight: '#818cf8',
        accent: '#ec4899',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
    }), [isDark]);

    // ============================================
    // LOAD DATA
    // ============================================
    const loadData = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);

            // Carica veicoli
            const vehiclesRef = collection(db, 'vehicles');
            const vehiclesQuery = query(
                vehiclesRef,
                where('ownerId', '==', user.id),
                orderBy('createdAt', 'desc')
            );
            const vehiclesSnapshot = await getDocs(vehiclesQuery);
            const vehiclesData = vehiclesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Vehicle[];

            setVehicles(vehiclesData);
            if (vehiclesData.length > 0 && !selectedVehicle) {
                setSelectedVehicle(vehiclesData[0]);
            }

            // Carica scadenze
            const deadlinesRef = collection(db, 'deadlines');
            const deadlinesQuery = query(
                deadlinesRef,
                where('userId', '==', user.id),
                where('status', '==', 'active'),
                orderBy('dueDate', 'asc'),
                limit(5)
            );
            const deadlinesSnapshot = await getDocs(deadlinesQuery);
            const deadlinesData = deadlinesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Deadline[];

            setDeadlines(deadlinesData);

            // Carica statistiche mensili
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const expensesRef = collection(db, 'expenses');
            const expensesQuery = query(
                expensesRef,
                where('userId', '==', user.id),
                where('date', '>=', firstDayOfMonth)
            );
            const expensesSnapshot = await getDocs(expensesQuery);

            let totalExpenses = 0;
            let totalFuel = 0;
            let totalMaintenance = 0;

            expensesSnapshot.docs.forEach(doc => {
                const data = doc.data();
                totalExpenses += data.amount || 0;
                if (data.category === 'fuel') totalFuel += data.amount || 0;
                if (data.category === 'maintenance') totalMaintenance += data.amount || 0;
            });

            setMonthlyStats({
                totalExpenses,
                totalFuel,
                totalMaintenance,
                totalKm: vehiclesData[0]?.mileage || 0,
            });

            // Carica richieste pendenti
            await loadPendingViewRequests();

        } catch (error) {
            console.error('❌ Errore caricamento dati:', error);
        } finally {
            setLoading(false);
        }
    }, [user, selectedVehicle]);

    const loadPendingViewRequests = async () => {
        if (!user?.id) return;
        try {
            const pending = await VehicleViewRequestService.getPendingRequestsCount(user.id);
            setPendingViewRequests(pending);
        } catch (error) {
            console.error('❌ Errore caricamento richieste:', error);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    useEffect(() => {
        loadData();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    // ============================================
    // RENDER HELPERS
    // ============================================
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount);
    };

    const formatDate = (date: any) => {
        const d = date?.toDate?.() || new Date(date);
        return d.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'short',
        });
    };

    // ============================================
    // RENDER ADD VEHICLE MODAL
    // ============================================
    const renderAddVehicleModal = () => (
        <Modal
            visible={showAddVehicleModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowAddVehicleModal(false)}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowAddVehicleModal(false)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={[styles.modalContent, { backgroundColor: theme.surface }]}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            Aggiungi Veicolo
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowAddVehicleModal(false)}
                            style={styles.modalCloseButton}
                        >
                            <X size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
                        Scegli se aggiungere un veicolo già in tuo possesso o cercarne uno da acquistare
                    </Text>

                    <View style={styles.modalOptions}>
                        <TouchableOpacity
                            style={[styles.modalOption, { backgroundColor: theme.card, borderColor: theme.border }]}
                            onPress={() => {
                                setShowAddVehicleModal(false);
                                navigation.navigate('AddVehicle' as never);
                            }}
                        >
                            <View style={[styles.modalOptionIcon, { backgroundColor: theme.primary + '15' }]}>
                                <Package size={28} color={theme.primary} />
                            </View>
                            <View style={styles.modalOptionContent}>
                                <Text style={[styles.modalOptionTitle, { color: theme.text }]}>
                                    Aggiungi il Mio Veicolo
                                </Text>
                                <Text style={[styles.modalOptionDescription, { color: theme.textSecondary }]}>
                                    Registra un veicolo che possiedi già
                                </Text>
                            </View>
                            <ChevronRight size={20} color={theme.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalOption, { backgroundColor: theme.card, borderColor: theme.border }]}
                            onPress={() => {
                                setShowAddVehicleModal(false);
                                navigation.navigate('RequestVehicleView' as never);
                            }}
                        >
                            <View style={[styles.modalOptionIcon, { backgroundColor: theme.accent + '15' }]}>
                                <Search size={28} color={theme.accent} />
                            </View>
                            <View style={styles.modalOptionContent}>
                                <Text style={[styles.modalOptionTitle, { color: theme.text }]}>
                                    Cerca Veicolo da Acquistare
                                </Text>
                                <Text style={[styles.modalOptionDescription, { color: theme.textSecondary }]}>
                                    Richiedi dati di un veicolo da comprare
                                </Text>
                            </View>
                            <ChevronRight size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );

    // ============================================
    // RENDER EMPTY STATE
    // ============================================
    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }, styles.centerContent]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Caricamento...</Text>
            </View>
        );
    }

    if (vehicles.length === 0) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

                {/* Header */}
                <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>I Miei Veicoli</Text>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => navigation.navigate('Settings' as never)}
                    >
                        <SettingsIcon size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Empty State Moderno */}
                <View style={styles.emptyStateModern}>
                    <View style={[styles.emptyIconContainer, { backgroundColor: theme.primary + '10' }]}>
                        <Car size={80} color={theme.primary} strokeWidth={1.5} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>Benvenuto!</Text>
                    <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}>
                        Inizia aggiungendo il tuo primo veicolo per tracciare manutenzioni, scadenze e spese.
                    </Text>
                    <TouchableOpacity
                        style={[styles.emptyButton, { backgroundColor: theme.primary }]}
                        onPress={() => setShowAddVehicleModal(true)}
                    >
                        <Plus size={22} color="#fff" strokeWidth={2.5} />
                        <Text style={styles.emptyButtonText}>Aggiungi Veicolo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.emptySecondaryLink}
                        onPress={() => navigation.navigate('MyVehicleViewRequests' as never)}
                    >
                        <Search size={18} color={theme.primary} />
                        <Text style={[styles.emptySecondaryLinkText, { color: theme.primary }]}>
                            O cerca un veicolo da acquistare
                        </Text>
                    </TouchableOpacity>
                </View>

                {renderAddVehicleModal()}
            </SafeAreaView>
        );
    }

    // ============================================
    // RENDER MAIN CONTENT
    // ============================================
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header Moderno */}
            <View style={[styles.headerModern, { backgroundColor: theme.surface }]}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.headerGreeting, { color: theme.textSecondary }]}>
                        Ciao,
                    </Text>
                    <Text style={[styles.headerName, { color: theme.text }]}>
                        {user?.name || 'Benvenuto'}
                    </Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={[styles.headerIconButton, { backgroundColor: theme.card }]}
                        onPress={() => navigation.navigate('ViewRequests' as never)}
                    >
                        <Bell size={20} color={pendingViewRequests > 0 ? theme.warning : theme.textSecondary} />
                        {pendingViewRequests > 0 && (
                            <View style={[styles.badge, { backgroundColor: theme.error }]}>
                                <Text style={styles.badgeText}>{pendingViewRequests}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.headerIconButton, { backgroundColor: theme.card }]}
                        onPress={() => navigation.navigate('Settings' as never)}
                    >
                        <SettingsIcon size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContentModern}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.primary}
                    />
                }
            >
                {/* Selected Vehicle Card Moderna */}
                {selectedVehicle && (
                    <LinearGradient
                        colors={[theme.primary, theme.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.vehicleCardModern}
                    >
                        <View style={styles.vehicleCardHeader}>
                            <View>
                                <Text style={styles.vehicleCardLabel}>Il Tuo Veicolo</Text>
                                <Text style={styles.vehicleCardName}>
                                    {selectedVehicle.make} {selectedVehicle.model}
                                </Text>
                                <Text style={styles.vehicleCardPlate}>
                                    {selectedVehicle.licensePlate}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.vehicleCardButton}
                                onPress={() => navigation.navigate('CarDetail' as never, { carId: selectedVehicle.id } as never)}
                            >
                                <ChevronRight size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.vehicleCardStats}>
                            <View style={styles.vehicleCardStat}>
                                <Text style={styles.vehicleCardStatLabel}>Anno</Text>
                                <Text style={styles.vehicleCardStatValue}>{selectedVehicle.year}</Text>
                            </View>
                            <View style={styles.vehicleCardStat}>
                                <Text style={styles.vehicleCardStatLabel}>Chilometri</Text>
                                <Text style={styles.vehicleCardStatValue}>
                                    {selectedVehicle.mileage.toLocaleString()}
                                </Text>
                            </View>
                            <View style={styles.vehicleCardStat}>
                                <Text style={styles.vehicleCardStatLabel}>Carburante</Text>
                                <Text style={styles.vehicleCardStatValue}>
                                    {selectedVehicle.fuel || 'N/D'}
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>
                )}

                {/* Quick Actions Moderne */}
                <View style={styles.sectionModern}>
                    <Text style={[styles.sectionTitleModern, { color: theme.text }]}>Azioni Rapide</Text>
                    <View style={styles.quickActionsGrid}>
                        <TouchableOpacity
                            style={[styles.quickActionCardModern, { backgroundColor: theme.card }]}
                            onPress={() => navigation.navigate('WorkshopSearch' as never)}
                        >
                            <View style={[styles.quickActionIconModern, { backgroundColor: theme.info + '15' }]}>
                                <MapPin size={24} color={theme.info} />
                            </View>
                            <Text style={[styles.quickActionLabel, { color: theme.text }]}>Prenota</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickActionCardModern, { backgroundColor: theme.card }]}
                            onPress={() => navigation.navigate('BookingsDashboard' as never)}
                        >
                            <View style={[styles.quickActionIconModern, { backgroundColor: theme.primary + '15' }]}>
                                <Calendar size={24} color={theme.primary} />
                            </View>
                            <Text style={[styles.quickActionLabel, { color: theme.text }]}>Appuntamenti</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickActionCardModern, { backgroundColor: theme.card }]}
                            onPress={() =>
                                navigation.navigate('AddMaintenance' as never, {
                                    carId: selectedVehicle?.id,
                                } as never)
                            }
                        >
                            <View style={[styles.quickActionIconModern, { backgroundColor: theme.success + '15' }]}>
                                <Wrench size={24} color={theme.success} />
                            </View>
                            <Text style={[styles.quickActionLabel, { color: theme.text }]}>Manutenzione</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.quickActionCardModern, { backgroundColor: theme.card }]}
                            onPress={() =>
                                navigation.navigate('AddFuel' as never, {
                                    carId: selectedVehicle?.id,
                                } as never)
                            }
                        >
                            <View style={[styles.quickActionIconModern, { backgroundColor: theme.warning + '15' }]}>
                                <Fuel size={24} color={theme.warning} />
                            </View>
                            <Text style={[styles.quickActionLabel, { color: theme.text }]}>Rifornimento</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats Cards Moderne */}
                <View style={styles.sectionModern}>
                    <Text style={[styles.sectionTitleModern, { color: theme.text }]}>Questo Mese</Text>
                    <View style={styles.statsGrid}>
                        <View style={[styles.statCardModern, { backgroundColor: theme.card }]}>
                            <View style={[styles.statIconModern, { backgroundColor: theme.error + '15' }]}>
                                <DollarSign size={20} color={theme.error} />
                            </View>
                            <Text style={[styles.statValue, { color: theme.text }]}>
                                {formatCurrency(monthlyStats.totalExpenses)}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Spese Totali</Text>
                        </View>

                        <View style={[styles.statCardModern, { backgroundColor: theme.card }]}>
                            <View style={[styles.statIconModern, { backgroundColor: theme.warning + '15' }]}>
                                <Fuel size={20} color={theme.warning} />
                            </View>
                            <Text style={[styles.statValue, { color: theme.text }]}>
                                {formatCurrency(monthlyStats.totalFuel)}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Carburante</Text>
                        </View>

                        <View style={[styles.statCardModern, { backgroundColor: theme.card }]}>
                            <View style={[styles.statIconModern, { backgroundColor: theme.success + '15' }]}>
                                <Wrench size={20} color={theme.success} />
                            </View>
                            <Text style={[styles.statValue, { color: theme.text }]}>
                                {formatCurrency(monthlyStats.totalMaintenance)}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Manutenzioni</Text>
                        </View>

                        <View style={[styles.statCardModern, { backgroundColor: theme.card }]}>
                            <View style={[styles.statIconModern, { backgroundColor: theme.info + '15' }]}>
                                <TrendingUp size={20} color={theme.info} />
                            </View>
                            <Text style={[styles.statValue, { color: theme.text }]}>
                                {monthlyStats.totalKm.toLocaleString()} km
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Percorsi</Text>
                        </View>
                    </View>
                </View>

                {/* Scadenze */}
                {deadlines.length > 0 && (
                    <View style={styles.sectionModern}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitleModern, { color: theme.text }]}>
                                Scadenze Prossime
                            </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Reminders' as never)}>
                                <Text style={[styles.seeAllText, { color: theme.primary }]}>
                                    Vedi tutte
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {deadlines.slice(0, 3).map((deadline) => {
                            const dueDate = deadline.dueDate?.toDate?.() || new Date(deadline.dueDate);
                            const daysUntil = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                            const isUrgent = daysUntil <= 30;

                            return (
                                <View
                                    key={deadline.id}
                                    style={[styles.deadlineCardModern, { backgroundColor: theme.card, borderColor: theme.border }]}
                                >
                                    <View style={[
                                        styles.deadlineIndicator,
                                        { backgroundColor: isUrgent ? theme.error + '15' : theme.success + '15' }
                                    ]}>
                                        <AlertCircle size={16} color={isUrgent ? theme.error : theme.success} />
                                    </View>
                                    <View style={styles.deadlineContent}>
                                        <Text style={[styles.deadlineTitle, { color: theme.text }]}>
                                            {deadline.description}
                                        </Text>
                                        <Text style={[styles.deadlineDate, { color: theme.textSecondary }]}>
                                            Scade il {formatDate(dueDate)} ({daysUntil} giorni)
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Altri Veicoli */}
                {vehicles.length > 1 && (
                    <View style={styles.sectionModern}>
                        <Text style={[styles.sectionTitleModern, { color: theme.text }]}>
                            Altri Veicoli
                        </Text>
                        {vehicles
                            .filter((v) => v.id !== selectedVehicle?.id)
                            .map((vehicle) => (
                                <TouchableOpacity
                                    key={vehicle.id}
                                    style={[styles.vehicleListItemModern, { backgroundColor: theme.card }]}
                                    onPress={() => setSelectedVehicle(vehicle)}
                                >
                                    <View style={[styles.vehicleIconSmall, { backgroundColor: theme.primary + '15' }]}>
                                        <Car size={20} color={theme.primary} />
                                    </View>
                                    <View style={styles.vehicleListInfo}>
                                        <Text style={[styles.vehicleListName, { color: theme.text }]}>
                                            {vehicle.make} {vehicle.model}
                                        </Text>
                                        <Text style={[styles.vehicleListPlate, { color: theme.textSecondary }]}>
                                            {vehicle.licensePlate}
                                        </Text>
                                    </View>
                                    <ChevronRight size={20} color={theme.textSecondary} />
                                </TouchableOpacity>
                            ))}
                    </View>
                )}

                {/* FAB */}
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: theme.primary }]}
                    onPress={() => setShowAddVehicleModal(true)}
                >
                    <Plus size={28} color="#fff" strokeWidth={2.5} />
                </TouchableOpacity>
            </ScrollView>

            {renderAddVehicleModal()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    headerButton: {
        padding: 8,
    },

    // Header Moderno
    headerModern: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    headerLeft: {},
    headerGreeting: {
        fontSize: 14,
        marginBottom: 2,
    },
    headerName: {
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    headerRight: {
        flexDirection: 'row',
        gap: 12,
    },
    headerIconButton: {
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },

    // ScrollView
    scrollView: {
        flex: 1,
    },
    scrollContentModern: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingBottom: 100,
    },

    // Vehicle Card Moderna
    vehicleCardModern: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 16,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    vehicleCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    vehicleCardLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    vehicleCardName: {
        color: '#fff',
        fontSize: 26,
        fontWeight: '700',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    vehicleCardPlate: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 16,
        fontWeight: '600',
    },
    vehicleCardButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    vehicleCardStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    vehicleCardStat: {
        alignItems: 'center',
    },
    vehicleCardStatLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginBottom: 4,
    },
    vehicleCardStatValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },

    // Sections Moderne
    sectionModern: {
        marginBottom: 28,
    },
    sectionTitleModern: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
        letterSpacing: -0.3,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '600',
    },

    // Quick Actions Moderne
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    quickActionCardModern: {
        flex: 1,
        minWidth: '47%',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    quickActionIconModern: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    quickActionLabel: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },

    // Stats Grid Moderna
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCardModern: {
        flex: 1,
        minWidth: '47%',
        padding: 16,
        borderRadius: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    statIconModern: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
    },

    // Deadline Cards Moderne
    deadlineCardModern: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        alignItems: 'center',
    },
    deadlineIndicator: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    deadlineContent: {
        flex: 1,
    },
    deadlineTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    deadlineDate: {
        fontSize: 12,
    },

    // Vehicle List Item Moderno
    vehicleListItemModern: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    vehicleIconSmall: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    vehicleListInfo: {
        flex: 1,
    },
    vehicleListName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    vehicleListPlate: {
        fontSize: 13,
    },

    // Empty State Moderno
    emptyStateModern: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: 80,
    },
    emptyIconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    emptyDescription: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        gap: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    emptyButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    emptySecondaryLink: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        gap: 8,
    },
    emptySecondaryLinkText: {
        fontSize: 15,
        fontWeight: '600',
    },

    // FAB
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
            },
            android: {
                elevation: 8,
            },
        }),
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 420,
        borderRadius: 24,
        padding: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.3,
                shadowRadius: 24,
            },
            android: {
                elevation: 16,
            },
        }),
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    modalCloseButton: {
        padding: 4,
    },
    modalDescription: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 24,
    },
    modalOptions: {
        gap: 12,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    modalOptionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    modalOptionContent: {
        flex: 1,
    },
    modalOptionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    modalOptionDescription: {
        fontSize: 13,
    },
});

export default HomeScreenModern;

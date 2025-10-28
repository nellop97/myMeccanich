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
    Eye,
    Settings as SettingsIcon,
    Menu,
    Search,
    Package,
    X,
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
    const [approvedViewRequests, setApprovedViewRequests] = useState(0);
    const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);

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
            if (!user?.id || !user?.email) {
                console.log('⚠️ No user ID or email, skipping view requests load');
                return;
            }

            console.log('📥 Loading view requests for user:', user.id, user.email);
            const viewRequestService = VehicleViewRequestService.getInstance();

            // Carica richieste ricevute (come proprietario)
            const incomingRequests = await viewRequestService.getIncomingRequests(user.id);
            console.log('📋 Total incoming requests:', incomingRequests.length);
            const pendingCount = incomingRequests.filter(r => r.status === 'pending').length;
            console.log('🔔 Pending incoming requests:', pendingCount);
            setPendingViewRequests(pendingCount);

            // Carica richieste inviate (come acquirente)
            const myRequests = await viewRequestService.getMyRequests(user.email);
            console.log('📤 Total my requests:', myRequests.length);
            const approvedCount = myRequests.filter(r => r.status === 'approved').length;
            console.log('✅ Approved my requests:', approvedCount);
            setApprovedViewRequests(approvedCount);
        } catch (error: any) {
            // Ignora errori di permessi Firebase - le regole potrebbero non essere ancora configurate
            if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
                console.warn('⚠️ Firestore rules not configured. Run: firebase deploy --only firestore:rules');
                setPendingViewRequests(0);
                setApprovedViewRequests(0);
            } else if (error?.message?.includes('index')) {
                console.warn('⚠️ Firestore index required. Click the link in the error or deploy indexes: firebase deploy --only firestore:indexes');
                console.error('Error loading view requests:', error);
                setPendingViewRequests(0);
                setApprovedViewRequests(0);
            } else {
                console.error('❌ Error loading view requests:', error);
            }
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

    // Polling automatico per richieste pendenti ogni 30 secondi
    useEffect(() => {
        const interval = setInterval(() => {
            if (user?.id) {
                console.log('🔔 Polling pending view requests...');
                loadPendingViewRequests();
            }
        }, 180000); // <-- 3 minuti

        return () => clearInterval(interval);
    }, [user?.id]);

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
                    style={[styles.modalContent, { backgroundColor: themeColors.surface }]}
                    onPress={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                            Cosa vuoi fare?
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowAddVehicleModal(false)}
                            style={styles.modalCloseButton}
                        >
                            <X size={24} color={themeColors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.modalDescription, { color: themeColors.textSecondary }]}>
                        Scegli se aggiungere un veicolo già in tuo possesso o cercarne uno da acquistare
                    </Text>

                    {/* Options */}
                    <View style={styles.modalOptions}>
                        {/* Aggiungi mio veicolo */}
                        <TouchableOpacity
                            style={[styles.modalOption, { backgroundColor: themeColors.cardBackground }]}
                            onPress={() => {
                                setShowAddVehicleModal(false);
                                navigation.navigate('AddVehicle' as never);
                            }}
                        >
                            <View style={[styles.modalOptionIcon, { backgroundColor: '#dbeafe' }]}>
                                <Package size={32} color="#3b82f6" />
                            </View>
                            <View style={styles.modalOptionContent}>
                                <Text style={[styles.modalOptionTitle, { color: themeColors.text }]}>
                                    Aggiungi il Mio Veicolo
                                </Text>
                                <Text style={[styles.modalOptionDescription, { color: themeColors.textSecondary }]}>
                                    Registra un veicolo che possiedi già per tracciare manutenzioni e spese
                                </Text>
                            </View>
                            <ChevronRight size={20} color={themeColors.textSecondary} />
                        </TouchableOpacity>

                        {/* Cerca veicolo da acquistare */}
                        <TouchableOpacity
                            style={[styles.modalOption, { backgroundColor: themeColors.cardBackground }]}
                            onPress={() => {
                                setShowAddVehicleModal(false);
                                navigation.navigate('RequestVehicleView' as never);
                            }}
                        >
                            <View style={[styles.modalOptionIcon, { backgroundColor: '#ede9fe' }]}>
                                <Search size={32} color="#8b5cf6" />
                            </View>
                            <View style={styles.modalOptionContent}>
                                <Text style={[styles.modalOptionTitle, { color: themeColors.text }]}>
                                    Cerca Veicolo da Acquistare
                                </Text>
                                <Text style={[styles.modalOptionDescription, { color: themeColors.textSecondary }]}>
                                    Richiedi di visualizzare i dati di un veicolo che vuoi comprare
                                </Text>
                            </View>
                            <ChevronRight size={20} color={themeColors.textSecondary} />
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
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Caricamento...</Text>
            </View>
        );
    }

    // ============================================
    // RENDER EMPTY STATE
    // ============================================
    if (vehicles.length === 0) {
        // Web empty state
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
                                onPress={() => setShowAddVehicleModal(true)}
                            >
                                <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
                                <Text style={styles.webHeaderButtonText}>Nuovo Veicolo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.webIconButton}
                                onPress={() => navigation.navigate('Settings' as never)}
                            >
                                <SettingsIcon size={22} color={themeColors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Web Empty State */}
                    <View style={[styles.webEmptyState, { backgroundColor: themeColors.background }]}>
                        <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E5EA' }]}>
                            <Car size={96} color={themeColors.textSecondary} strokeWidth={1.5} />
                        </View>
                        <Text style={[styles.webEmptyTitle, { color: themeColors.text }]}>Nessun Veicolo</Text>
                        <Text style={[styles.webEmptyDescription, { color: themeColors.textSecondary }]}>
                            Inizia aggiungendo il tuo primo veicolo per tracciare manutenzioni, scadenze e spese.
                        </Text>
                        <TouchableOpacity
                            style={[styles.webEmptyButton, { backgroundColor: themeColors.primary }]}
                            onPress={() => setShowAddVehicleModal(true)}
                        >
                            <Plus size={24} color="#fff" strokeWidth={2.5} />
                            <Text style={styles.webEmptyButtonText}>Aggiungi Primo Veicolo</Text>
                        </TouchableOpacity>

                        {/* Link to view sent requests */}
                        <TouchableOpacity
                            style={styles.emptySecondaryLink}
                            onPress={() => navigation.navigate('MyVehicleViewRequests' as never)}
                        >
                            <TrendingUp size={18} color={themeColors.primary} />
                            <Text style={[styles.emptySecondaryLinkText, { color: themeColors.primary }]}>
                                Visualizza le Mie Richieste Inviate
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Add Vehicle Modal */}
                    {renderAddVehicleModal()}
                </View>
            );
        }

        // Mobile empty state
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.surface} />

                {/* Header */}
                <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
                    <Text style={[styles.headerTitle, { color: themeColors.text }]}>I Miei Veicoli</Text>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => navigation.navigate('Settings' as never)}
                    >
                        <SettingsIcon size={24} color={themeColors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Empty State */}
                <View style={[styles.emptyState, { backgroundColor: themeColors.background }]}>
                    <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5EA' }]}>
                        <Car size={64} color={themeColors.textSecondary} strokeWidth={1.5} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Nessun Veicolo</Text>
                    <Text style={[styles.emptyDescription, { color: themeColors.textSecondary }]}>
                        Inizia aggiungendo il tuo primo veicolo per tracciare manutenzioni, scadenze e spese.
                    </Text>
                    <TouchableOpacity
                        style={[styles.emptyButton, { backgroundColor: themeColors.primary }]}
                        onPress={() => setShowAddVehicleModal(true)}
                    >
                        <Plus size={20} color="#fff" strokeWidth={2.5} />
                        <Text style={styles.emptyButtonText}>Aggiungi Veicolo</Text>
                    </TouchableOpacity>

                    {/* Link to view sent requests */}
                    <TouchableOpacity
                        style={styles.emptySecondaryLink}
                        onPress={() => navigation.navigate('MyVehicleViewRequests' as never)}
                    >
                        <TrendingUp size={16} color={themeColors.primary} />
                        <Text style={[styles.emptySecondaryLinkText, { color: themeColors.primary }]}>
                            Visualizza le Mie Richieste Inviate
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Add Vehicle Modal */}
                {renderAddVehicleModal()}
            </SafeAreaView>
        );
    }

    // ============================================
    // RENDER WEB LAYOUT (Desktop with vehicles)
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
                            onPress={() => setShowAddVehicleModal(true)}
                        >
                            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
                            <Text style={styles.webHeaderButtonText}>Nuovo Veicolo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.webIconButton}
                            onPress={() => navigation.navigate('ViewRequests' as never)}
                        >
                            <Bell size={22} color={pendingViewRequests > 0 ? "#f59e0b" : themeColors.textSecondary} />
                            {pendingViewRequests > 0 && (
                                <View style={styles.webBadge}>
                                    <Text style={styles.webBadgeText}>{pendingViewRequests}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.webIconButton}
                            onPress={() => navigation.navigate('MyVehicleViewRequests' as never)}
                        >
                            <Eye size={22} color={approvedViewRequests > 0 ? "#10b981" : themeColors.textSecondary} />
                            {approvedViewRequests > 0 && (
                                <View style={styles.webBadge}>
                                    <Text style={styles.webBadgeText}>{approvedViewRequests}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.webIconButton}
                            onPress={() => navigation.navigate('Reminders' as never)}
                        >
                            <Calendar size={22} color={deadlines.length > 0 ? "#f59e0b" : themeColors.textSecondary} />
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
                            <SettingsIcon size={22} color={themeColors.textSecondary} />
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
                                        onPress={() => navigation.navigate('WorkshopSearch' as never)}
                                    >
                                        <View style={[styles.webActionIcon, { backgroundColor: '#dbeafe' }]}>
                                            <Wrench size={24} color="#3b82f6" />
                                        </View>
                                        <Text style={styles.webActionTitle}>Prenota Servizio</Text>
                                        <Text style={styles.webActionDescription}>
                                            Cerca officina e prenota
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.webActionCard}
                                        onPress={() => navigation.navigate('BookingsDashboard' as never)}
                                    >
                                        <View style={[styles.webActionIcon, { backgroundColor: '#fef3c7' }]}>
                                            <Calendar size={24} color="#f59e0b" />
                                        </View>
                                        <Text style={styles.webActionTitle}>Prenotazioni</Text>
                                        <Text style={styles.webActionDescription}>
                                            Gestisci appuntamenti
                                        </Text>
                                    </TouchableOpacity>

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

                {/* Add Vehicle Modal */}
                {renderAddVehicleModal()}
            </View>
        );
    }

    // ============================================
    // RENDER MOBILE LAYOUT
    // ============================================
    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#f5f5f7' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

            {/* Liquid Glass Header */}
            <BlurView
                intensity={isDark ? 70 : 90}
                tint={isDark ? 'dark' : 'light'}
                style={styles.liquidHeader}
            >
                <SafeAreaView>
                    <View style={styles.liquidHeaderContent}>
                        <View style={styles.liquidHeaderTop}>
                            <View>
                                <Text style={[styles.liquidHeaderGreeting, { color: themeColors.text }]}>
                                    Ciao, {user?.name || 'Benvenuto'}
                                </Text>
                                <Text style={[styles.liquidHeaderSubtitle, { color: themeColors.textSecondary }]}>
                                    {vehicles.length} veicol{vehicles.length === 1 ? 'o' : 'i'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.liquidSettingsButton, {
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                                    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'
                                }]}
                                onPress={() => navigation.navigate('Settings' as never)}
                            >
                                <SettingsIcon size={22} color={themeColors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Quick Action Pills */}
                        <View style={styles.liquidActionPills}>
                            <TouchableOpacity
                                style={[styles.liquidPill, {
                                    backgroundColor: pendingViewRequests > 0
                                        ? isDark ? 'rgba(251,146,60,0.2)' : 'rgba(251,146,60,0.15)'
                                        : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                                    borderColor: pendingViewRequests > 0
                                        ? isDark ? 'rgba(251,146,60,0.3)' : 'rgba(251,146,60,0.25)'
                                        : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'
                                }]}
                                onPress={() => navigation.navigate('ViewRequests' as never)}
                            >
                                <Bell
                                    size={20}
                                    color={pendingViewRequests > 0 ? "#fb923c" : themeColors.text}
                                />
                                <Text style={[styles.liquidPillText, {
                                    color: pendingViewRequests > 0 ? "#fb923c" : themeColors.text
                                }]}>
                                    Richieste
                                </Text>
                                {pendingViewRequests > 0 && (
                                    <View style={styles.liquidBadge}>
                                        <Text style={styles.liquidBadgeText}>{pendingViewRequests}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.liquidPill, {
                                    backgroundColor: approvedViewRequests > 0
                                        ? isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)'
                                        : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                                    borderColor: approvedViewRequests > 0
                                        ? isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.25)'
                                        : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'
                                }]}
                                onPress={() => navigation.navigate('MyVehicleViewRequests' as never)}
                            >
                                <Eye
                                    size={20}
                                    color={approvedViewRequests > 0 ? "#10b981" : themeColors.text}
                                />
                                <Text style={[styles.liquidPillText, {
                                    color: approvedViewRequests > 0 ? "#10b981" : themeColors.text
                                }]}>
                                    Mie Richieste
                                </Text>
                                {approvedViewRequests > 0 && (
                                    <View style={styles.liquidBadge}>
                                        <Text style={styles.liquidBadgeText}>{approvedViewRequests}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.liquidPill, {
                                    backgroundColor: deadlines.length > 0
                                        ? isDark ? 'rgba(251,146,60,0.2)' : 'rgba(251,146,60,0.15)'
                                        : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                                    borderColor: deadlines.length > 0
                                        ? isDark ? 'rgba(251,146,60,0.3)' : 'rgba(251,146,60,0.25)'
                                        : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'
                                }]}
                                onPress={() => navigation.navigate('Reminders' as never)}
                            >
                                <Calendar
                                    size={20}
                                    color={deadlines.length > 0 ? "#fb923c" : themeColors.text}
                                />
                                <Text style={[styles.liquidPillText, {
                                    color: deadlines.length > 0 ? "#fb923c" : themeColors.text
                                }]}>
                                    Scadenze
                                </Text>
                                {deadlines.length > 0 && (
                                    <View style={styles.liquidBadge}>
                                        <Text style={styles.liquidBadgeText}>{deadlines.length}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </BlurView>

            <ScrollView
                style={[styles.scrollView, { backgroundColor: 'transparent' }]}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Liquid Glass Vehicle Card */}
                {selectedVehicle && (
                    <View style={styles.liquidVehicleCardContainer}>
                        <LinearGradient
                            colors={isDark
                                ? ['rgba(59,130,246,0.4)', 'rgba(37,99,235,0.5)']
                                : ['rgba(59,130,246,0.9)', 'rgba(37,99,235,1)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.liquidVehicleGradient}
                        >
                            <BlurView
                                intensity={isDark ? 40 : 30}
                                tint={isDark ? 'dark' : 'light'}
                                style={styles.liquidVehicleBlur}
                            >
                                <View style={styles.liquidVehicleHeader}>
                                    <View style={styles.liquidVehicleInfo}>
                                        <Text style={styles.liquidVehicleName}>
                                            {selectedVehicle.make} {selectedVehicle.model}
                                        </Text>
                                        <Text style={styles.liquidVehiclePlate}>
                                            {selectedVehicle.licensePlate}
                                        </Text>
                                        <View style={styles.liquidVehicleTag}>
                                            <Text style={styles.liquidVehicleTagText}>
                                                {selectedVehicle.year} • {selectedVehicle.fuel || 'Benzina'}
                                            </Text>
                                        </View>
                                    </View>

                                    {selectedVehicle.imageUrl && (
                                        <Image
                                            source={{ uri: selectedVehicle.imageUrl }}
                                            style={styles.liquidVehicleImage}
                                            resizeMode="contain"
                                        />
                                    )}
                                </View>

                                <TouchableOpacity
                                    style={styles.liquidVehicleButton}
                                    onPress={() =>
                                        navigation.navigate('CarDetail' as never, {
                                            carId: selectedVehicle.id,
                                        } as never)
                                    }
                                >
                                    <Text style={styles.liquidVehicleButtonText}>Vedi Dettagli</Text>
                                    <ChevronRight size={18} color="#fff" />
                                </TouchableOpacity>
                            </BlurView>
                        </LinearGradient>
                    </View>
                )}

                {/* Liquid Glass Stats */}
                <View style={styles.liquidStatsContainer}>
                    <Text style={[styles.liquidSectionTitle, { color: themeColors.text }]}>Questo Mese</Text>
                    <View style={styles.liquidStatsGrid}>
                        <BlurView
                            intensity={isDark ? 60 : 80}
                            tint={isDark ? 'dark' : 'light'}
                            style={[styles.liquidStatCard, {
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
                            }]}
                        >
                            <View style={[styles.liquidStatIcon, {
                                backgroundColor: isDark ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.15)'
                            }]}>
                                <DollarSign size={22} color="#3b82f6" strokeWidth={2.5} />
                            </View>
                            <Text style={[styles.liquidStatValue, { color: themeColors.text }]}>
                                {formatCurrency(monthlyStats.totalExpenses)}
                            </Text>
                            <Text style={[styles.liquidStatLabel, { color: themeColors.textSecondary }]}>
                                Spese Totali
                            </Text>
                        </BlurView>

                        <BlurView
                            intensity={isDark ? 60 : 80}
                            tint={isDark ? 'dark' : 'light'}
                            style={[styles.liquidStatCard, {
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
                            }]}
                        >
                            <View style={[styles.liquidStatIcon, {
                                backgroundColor: isDark ? 'rgba(251,146,60,0.25)' : 'rgba(251,146,60,0.15)'
                            }]}>
                                <Fuel size={22} color="#fb923c" strokeWidth={2.5} />
                            </View>
                            <Text style={[styles.liquidStatValue, { color: themeColors.text }]}>
                                {formatCurrency(monthlyStats.totalFuel)}
                            </Text>
                            <Text style={[styles.liquidStatLabel, { color: themeColors.textSecondary }]}>
                                Carburante
                            </Text>
                        </BlurView>

                        <BlurView
                            intensity={isDark ? 60 : 80}
                            tint={isDark ? 'dark' : 'light'}
                            style={[styles.liquidStatCard, {
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
                            }]}
                        >
                            <View style={[styles.liquidStatIcon, {
                                backgroundColor: isDark ? 'rgba(139,92,246,0.25)' : 'rgba(139,92,246,0.15)'
                            }]}>
                                <Wrench size={22} color="#8b5cf6" strokeWidth={2.5} />
                            </View>
                            <Text style={[styles.liquidStatValue, { color: themeColors.text }]}>
                                {formatCurrency(monthlyStats.totalMaintenance)}
                            </Text>
                            <Text style={[styles.liquidStatLabel, { color: themeColors.textSecondary }]}>
                                Manutenzioni
                            </Text>
                        </BlurView>

                        <BlurView
                            intensity={isDark ? 60 : 80}
                            tint={isDark ? 'dark' : 'light'}
                            style={[styles.liquidStatCard, {
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
                            }]}
                        >
                            <View style={[styles.liquidStatIcon, {
                                backgroundColor: isDark ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.15)'
                            }]}>
                                <TrendingUp size={22} color="#10b981" strokeWidth={2.5} />
                            </View>
                            <Text style={[styles.liquidStatValue, { color: themeColors.text }]}>
                                {monthlyStats.totalKm} km
                            </Text>
                            <Text style={[styles.liquidStatLabel, { color: themeColors.textSecondary }]}>
                                Percorsi
                            </Text>
                        </BlurView>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActionsContainer}>
                    <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Azioni Rapide</Text>
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={styles.quickActionButton}
                            onPress={() => navigation.navigate('WorkshopSearch' as never)}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: '#f0f9ff' }]}>
                                <Search size={20} color="#3b82f6" />
                            </View>
                            <Text style={styles.quickActionLabel}>Prenota</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickActionButton}
                            onPress={() => navigation.navigate('BookingsDashboard' as never)}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: '#fff7ed' }]}>
                                <Calendar size={20} color="#f59e0b" />
                            </View>
                            <Text style={styles.quickActionLabel}>Appuntamenti</Text>
                        </TouchableOpacity>

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
                                {approvedViewRequests > 0 && (
                                    <View style={styles.quickActionBadge}>
                                        <Text style={styles.quickActionBadgeText}>{approvedViewRequests}</Text>
                                    </View>
                                )}
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
                            onPress={() => setShowAddVehicleModal(true)}
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

            {/* Add Vehicle Modal */}
            {renderAddVehicleModal()}
        </View>
    );
};

// ============================================
// STYLES - LIQUID GLASS DESIGN
// ============================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f7',
    },

    // ============================================
    // LIQUID GLASS HEADER
    // ============================================
    liquidHeader: {
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: 'rgba(255,255,255,0.18)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
            },
            android: {
                elevation: 8,
            },
            web: {
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            },
        }),
    },
    liquidHeaderContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 24,
    },
    liquidHeaderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    liquidHeaderGreeting: {
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: -0.6,
        marginBottom: 4,
    },
    liquidHeaderSubtitle: {
        fontSize: 15,
        fontWeight: '500',
        letterSpacing: -0.2,
        opacity: 0.7,
    },
    liquidSettingsButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
            web: {
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            },
        }),
    },
    liquidActionPills: {
        gap: 10,
    },
    liquidPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 4,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            },
        }),
    },
    liquidPillText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 12,
        letterSpacing: -0.2,
    },
    liquidBadge: {
        backgroundColor: '#ef4444',
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        marginLeft: 8,
    },
    liquidBadgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: -0.2,
    },

    // ============================================
    // LIQUID GLASS VEHICLE CARD
    // ============================================
    liquidVehicleCardContainer: {
        marginBottom: 24,
        borderRadius: 28,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.3,
                shadowRadius: 24,
            },
            android: {
                elevation: 8,
            },
            web: {
                boxShadow: '0 12px 40px rgba(59,130,246,0.3)',
            },
        }),
    },
    liquidVehicleGradient: {
        borderRadius: 28,
    },
    liquidVehicleBlur: {
        padding: 24,
        borderRadius: 28,
        overflow: 'hidden',
    },
    liquidVehicleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    liquidVehicleInfo: {
        flex: 1,
    },
    liquidVehicleName: {
        fontSize: 26,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 6,
        letterSpacing: -0.6,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    liquidVehiclePlate: {
        fontSize: 18,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.95)',
        marginBottom: 12,
        letterSpacing: 1.5,
        textShadowColor: 'rgba(0,0,0,0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    liquidVehicleTag: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    liquidVehicleTagText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: -0.2,
    },
    liquidVehicleImage: {
        width: 120,
        height: 85,
        marginLeft: 12,
    },
    liquidVehicleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    liquidVehicleButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: -0.3,
    },

    // ============================================
    // LIQUID GLASS STATS
    // ============================================
    liquidStatsContainer: {
        marginBottom: 28,
    },
    liquidSectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: -0.5,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    liquidStatsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    liquidStatCard: {
        flex: 1,
        minWidth: 160,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            },
        }),
    },
    liquidStatIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    liquidStatValue: {
        fontSize: 19,
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: -0.4,
    },
    liquidStatLabel: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: -0.2,
        opacity: 0.7,
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

    // ScrollView
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
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
    },
    emptyIconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    emptyTitle: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: -0.6,
    },
    emptyDescription: {
        fontSize: 17,
        fontWeight: '400',
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
    emptySecondaryLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    emptySecondaryLinkText: {
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: -0.3,
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
    webEmptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingBottom: 80,
    },
    webEmptyTitle: {
        fontSize: 32,
        fontWeight: '700',
        marginTop: 24,
        marginBottom: 12,
    },
    webEmptyDescription: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        maxWidth: 500,
        marginBottom: 32,
    },
    webEmptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
            transition: 'all 0.2s',
        }),
    },
    webEmptyButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
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

    // Add Vehicle Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 500,
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
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
        gap: 16,
        ...Platform.select({
            web: {
                cursor: 'pointer',
                transition: 'all 0.2s',
            },
        }),
    },
    modalOptionIcon: {
        width: 64,
        height: 64,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOptionContent: {
        flex: 1,
    },
    modalOptionTitle: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 4,
    },
    modalOptionDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
});

export default HomeScreen;
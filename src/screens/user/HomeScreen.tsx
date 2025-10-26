// src/screens/user/HomeScreen.tsx
// HomeScreen Moderna e Completa - Design 2025 con Full Responsive e Integrazione Firebase

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Platform,
    RefreshControl,
    ActivityIndicator,
    useWindowDimensions,
    Alert,
    Modal,
    Animated,
    Pressable,
} from 'react-native';
import {
    Plus,
    Car,
    Wrench,
    Calendar,
    DollarSign,
    Fuel,
    AlertCircle,
    Bell,
    Settings as SettingsIcon,
    ChevronRight,
    X,
    Activity,
    Clock,
    UserPlus,
    CalendarPlus,
    Search,
    Eye,
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
    Timestamp,
    onSnapshot,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useStore } from '../../store';
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
    isActive?: boolean;
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

interface Appointment {
    id: string;
    workshopId: string;
    carId?: string;
    customerId: string;
    customerName: string;
    scheduledDate: string;
    scheduledTime?: string;
    description: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    workshopName?: string;
}

// ============================================
// MODERN STAT CARD COMPONENT
// ============================================
const ModernStatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    color, 
    trend,
    onPress,
    colors 
}: any) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={[
                styles.modernStatCard,
                { backgroundColor: colors.surface }
            ]}
        >
            <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
                <Icon size={20} color={color} strokeWidth={2.5} />
            </View>
            <View style={styles.statContent}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    {label}
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                    {value}
                </Text>
            </View>
            {trend !== undefined && trend !== null && (
                <View style={styles.statTrend}>
                    <Text style={[styles.statTrendText, { color: trend > 0 ? '#34C759' : '#FF3B30' }]}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

// ============================================
// MODERN VEHICLE CARD COMPONENT
// ============================================
const ModernVehicleCard = ({ vehicle, onPress, colors, isDark }: any) => {
    const gradientColors: [string, string] = vehicle.color 
        ? [vehicle.color, `${vehicle.color}CC`]
        : isDark 
            ? ['#1C1C1E', '#2C2C2E']
            : ['#667EEA', '#764BA2'];

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.9}
            style={[styles.modernVehicleCard, { backgroundColor: colors.surface }]}
        >
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.vehicleGradient}
            >
                <View style={styles.vehicleCardHeader}>
                    <View style={styles.vehicleMainInfo}>
                        <Text style={styles.vehicleCardMake}>
                            {vehicle.make} {vehicle.model}
                        </Text>
                        <Text style={styles.vehicleCardPlate}>
                            {vehicle.licensePlate}
                        </Text>
                    </View>
                    <View style={styles.vehicleCardBadge}>
                        <Text style={styles.vehicleCardYear}>{vehicle.year}</Text>
                    </View>
                </View>

                <View style={styles.vehicleCardFooter}>
                    <View style={styles.vehicleMetric}>
                        <Activity size={16} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.vehicleMetricText}>
                            {vehicle.mileage?.toLocaleString() || '0'} km
                        </Text>
                    </View>
                    <View style={styles.vehicleMetric}>
                        <Fuel size={16} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.vehicleMetricText}>
                            {vehicle.fuel || 'N/A'}
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

// ============================================
// MODERN DEADLINE CARD COMPONENT
// ============================================
const ModernDeadlineCard = ({ deadline, vehicle, onPress, colors }: any) => {
    const getDeadlineColor = () => {
        if (deadline.priority === 'high') return '#FF3B30';
        if (deadline.priority === 'medium') return '#FF9500';
        return '#34C759';
    };

    const getDeadlineIcon = () => {
        switch (deadline.type) {
            case 'insurance': return AlertCircle;
            case 'revision': return Wrench;
            case 'roadTax': return DollarSign;
            default: return Calendar;
        }
    };

    const Icon = getDeadlineIcon();
    const color = getDeadlineColor();

    const formatDate = (date: any) => {
        if (!date) return 'N/A';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={[styles.modernDeadlineCard, { backgroundColor: colors.surface }]}
        >
            <View style={[styles.deadlineColorStrip, { backgroundColor: color }]} />
            <View style={[styles.deadlineIconCircle, { backgroundColor: `${color}15` }]}>
                <Icon size={20} color={color} strokeWidth={2.5} />
            </View>
            <View style={styles.deadlineContent}>
                <Text style={[styles.deadlineTitle, { color: colors.text }]}>
                    {deadline.description}
                </Text>
                <View style={styles.deadlineMetaRow}>
                    <Text style={[styles.deadlineMeta, { color: colors.textSecondary }]}>
                        {vehicle?.make} {vehicle?.model}
                    </Text>
                    <Text style={[styles.deadlineDate, { color: colors.textSecondary }]}>
                        {formatDate(deadline.dueDate)}
                    </Text>
                </View>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
        </TouchableOpacity>
    );
};

// ============================================
// MODERN ACTIVITY CARD COMPONENT
// ============================================
const ModernActivityCard = ({ activity, vehicle, colors }: any) => {
    const getActivityIcon = () => {
        switch (activity.type) {
            case 'maintenance': return Wrench;
            case 'fuel': return Fuel;
            case 'expense': return DollarSign;
            default: return Activity;
        }
    };

    const getActivityColor = () => {
        switch (activity.type) {
            case 'maintenance': return '#667EEA';
            case 'fuel': return '#34C759';
            case 'expense': return '#FF9500';
            default: return '#8E8E93';
        }
    };

    const Icon = getActivityIcon();
    const color = getActivityColor();

    const formatDate = (date: any) => {
        if (!date) return 'N/A';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
    };

    return (
        <View style={[styles.modernActivityCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.activityIconCircle, { backgroundColor: `${color}15` }]}>
                <Icon size={18} color={color} strokeWidth={2.5} />
            </View>
            <View style={styles.activityContent}>
                <Text style={[styles.activityDescription, { color: colors.text }]}>
                    {activity.description}
                </Text>
                <View style={styles.activityMetaRow}>
                    <Text style={[styles.activityMeta, { color: colors.textSecondary }]}>
                        {vehicle?.make} {vehicle?.model}
                    </Text>
                    <Text style={[styles.activityDate, { color: colors.textSecondary }]}>
                        {formatDate(activity.date)}
                    </Text>
                </View>
            </View>
            <Text style={[styles.activityCost, { color: colors.text }]}>
                €{activity.cost?.toFixed(2) || '0.00'}
            </Text>
        </View>
    );
};

// ============================================
// APPOINTMENT CARD COMPONENT
// ============================================
const AppointmentCard = ({ appointment, colors }: any) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return '#34C759';
            case 'pending': return '#FF9500';
            case 'completed': return '#667EEA';
            case 'cancelled': return '#FF3B30';
            default: return '#8E8E93';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'confirmed': return 'Confermato';
            case 'pending': return 'In attesa';
            case 'completed': return 'Completato';
            case 'cancelled': return 'Annullato';
            default: return status;
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
        } catch {
            return dateString;
        }
    };

    const statusColor = getStatusColor(appointment.status);

    return (
        <View style={[styles.appointmentCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.appointmentColorStrip, { backgroundColor: statusColor }]} />
            <View style={[styles.appointmentIconCircle, { backgroundColor: `${statusColor}15` }]}>
                <Calendar size={20} color={statusColor} strokeWidth={2.5} />
            </View>
            <View style={styles.appointmentContent}>
                <Text style={[styles.appointmentTitle, { color: colors.text }]}>
                    {appointment.description || 'Appuntamento'}
                </Text>
                <View style={styles.appointmentMetaRow}>
                    <Text style={[styles.appointmentMeta, { color: colors.textSecondary }]}>
                        {appointment.workshopName || 'Officina'}
                    </Text>
                    <Text style={[styles.appointmentDate, { color: colors.textSecondary }]}>
                        {formatDate(appointment.scheduledDate)}
                        {appointment.scheduledTime && ` - ${appointment.scheduledTime}`}
                    </Text>
                </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                    {getStatusLabel(appointment.status)}
                </Text>
            </View>
        </View>
    );
};

// ============================================
// HOMESCREEN MODERN COMPONENT
// ============================================
const HomeScreen = () => {
    const navigation = useNavigation();
    const { user } = useStore();
    const { colors, isDark } = useAppThemeManager();
    const { width, height } = useWindowDimensions();

    // Responsive breakpoints
    const isDesktop = width >= 1024;
    const isTablet = width >= 768 && width < 1024;
    const isMobile = width < 768;

    // Stati
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
    
    // Stati separati per statistiche real-time (evita stale data)
    const [maintenanceCost, setMaintenanceCost] = useState(0);
    const [fuelCost, setFuelCost] = useState(0);
    const [otherExpensesCost, setOtherExpensesCost] = useState(0);
    const [totalKmDriven, setTotalKmDriven] = useState(0);

    // Calcolo totale con useMemo per evitare stale data
    const monthlyStats = useMemo<MonthlyStats>(() => ({
        totalMaintenance: maintenanceCost,
        totalFuel: fuelCost,
        totalExpenses: maintenanceCost + fuelCost + otherExpensesCost,
        totalKm: totalKmDriven,
    }), [maintenanceCost, fuelCost, otherExpensesCost, totalKmDriven]);
    
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pendingViewRequests, setPendingViewRequests] = useState(0);
    const [approvedViewRequests, setApprovedViewRequests] = useState(0);
    const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);

    // Animazioni
    const fadeAnim = useMemo(() => new Animated.Value(0), []);
    const slideAnim = useMemo(() => new Animated.Value(50), []);

    // Dynamic theme colors
    const themeColors = useMemo(() => ({
        background: colors.background,
        surface: colors.surface,
        surfaceVariant: colors.surfaceVariant,
        text: colors.onSurface,
        textSecondary: colors.onSurfaceVariant,
        border: colors.outline,
        primary: colors.primary,
        error: colors.error,
    }), [colors]);

    // ============================================
    // LOAD DATA FROM FIREBASE
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

            if (vehiclesList.length > 0 && !selectedVehicle) {
                setSelectedVehicle(vehiclesList[0]);
            }

            // Carica dati correlati se ci sono veicoli
            if (vehiclesList.length > 0) {
                await Promise.all([
                    loadDeadlines(vehiclesList),
                    loadRecentActivities(vehiclesList),
                    calculateMonthlyStats(vehiclesList),
                    loadUpcomingAppointments(),
                    loadPendingViewRequests(),
                ]);
            }

            // Animazioni di entrata
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
            ]).start();
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Errore', 'Impossibile caricare i dati');
        } finally {
            setLoading(false);
        }
    }, [user?.id, selectedVehicle, fadeAnim, slideAnim]);

    const loadDeadlines = async (vehiclesList: Vehicle[]) => {
        try {
            const vehicleIds = vehiclesList.map((v) => v.id);
            if (vehicleIds.length === 0) return;

            const deadlinesQuery = query(
                collection(db, 'deadlines'),
                where('vehicleId', 'in', vehicleIds.slice(0, 10)),
                where('status', '==', 'active'),
                orderBy('dueDate', 'asc'),
                limit(5)
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
            if (vehicleIds.length === 0) return;

            // Carica maintenance records
            const maintenanceQuery = query(
                collection(db, 'maintenance_records'),
                where('vehicleId', 'in', vehicleIds.slice(0, 10)),
                orderBy('date', 'desc'),
                limit(5)
            );

            const maintenanceSnapshot = await getDocs(maintenanceQuery);
            const maintenanceActivities = maintenanceSnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    vehicleId: data.vehicleId,
                    type: 'maintenance' as const,
                    description: data.description || data.type || 'Manutenzione',
                    date: data.date,
                    cost: data.cost || 0,
                    workshopName: data.workshopName,
                };
            });

            // Carica fuel records
            const fuelQuery = query(
                collection(db, 'fuel_records'),
                where('vehicleId', 'in', vehicleIds.slice(0, 10)),
                orderBy('date', 'desc'),
                limit(3)
            );

            const fuelSnapshot = await getDocs(fuelQuery);
            const fuelActivities = fuelSnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    vehicleId: data.vehicleId,
                    type: 'fuel' as const,
                    description: `Rifornimento ${data.liters || 0}L`,
                    date: data.date,
                    cost: data.totalCost || data.cost || 0,
                };
            });

            // Carica expenses
            const expensesQuery = query(
                collection(db, 'expenses'),
                where('vehicleId', 'in', vehicleIds.slice(0, 10)),
                orderBy('date', 'desc'),
                limit(3)
            );

            const expensesSnapshot = await getDocs(expensesQuery);
            const expenseActivities = expensesSnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    vehicleId: data.vehicleId,
                    type: 'expense' as const,
                    description: data.description || 'Spesa',
                    date: data.date,
                    cost: data.amount || data.cost || 0,
                };
            });

            // Combina e ordina tutte le attività
            const allActivities = [...maintenanceActivities, ...fuelActivities, ...expenseActivities]
                .sort((a, b) => {
                    const dateA = a.date?.toDate ? a.date.toDate().getTime() : new Date(a.date).getTime();
                    const dateB = b.date?.toDate ? b.date.toDate().getTime() : new Date(b.date).getTime();
                    return dateB - dateA;
                })
                .slice(0, 5);

            setRecentActivities(allActivities);
        } catch (error) {
            console.error('Error loading activities:', error);
        }
    };

    const calculateMonthlyStats = async (vehiclesList: Vehicle[]) => {
        try {
            const vehicleIds = vehiclesList.map((v) => v.id);
            if (vehicleIds.length === 0) return;

            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const firstDayTimestamp = Timestamp.fromDate(firstDayOfMonth);

            // Carica manutenzioni del mese
            const maintenanceQuery = query(
                collection(db, 'maintenance_records'),
                where('vehicleId', 'in', vehicleIds.slice(0, 10)),
                where('date', '>=', firstDayTimestamp),
                limit(100)
            );

            const maintenanceSnapshot = await getDocs(maintenanceQuery);
            const totalMaintenance = maintenanceSnapshot.docs.reduce((sum, doc) => {
                return sum + (doc.data().cost || 0);
            }, 0);

            // Carica rifornimenti del mese
            const fuelQuery = query(
                collection(db, 'fuel_records'),
                where('vehicleId', 'in', vehicleIds.slice(0, 10)),
                where('date', '>=', firstDayTimestamp),
                limit(100)
            );

            const fuelSnapshot = await getDocs(fuelQuery);
            const totalFuel = fuelSnapshot.docs.reduce((sum, doc) => {
                return sum + (doc.data().totalCost || doc.data().cost || 0);
            }, 0);

            // Carica spese del mese
            const expensesQuery = query(
                collection(db, 'expenses'),
                where('vehicleId', 'in', vehicleIds.slice(0, 10)),
                where('date', '>=', firstDayTimestamp),
                limit(100)
            );

            const expensesSnapshot = await getDocs(expensesQuery);
            const otherExpenses = expensesSnapshot.docs.reduce((sum, doc) => {
                return sum + (doc.data().amount || doc.data().cost || 0);
            }, 0);

            // Calcola km percorsi (approssimativo basato su rifornimenti)
            const totalKm = fuelSnapshot.docs.reduce((sum, doc) => {
                return sum + (doc.data().liters || 0) * 15; // Stima: 15km/litro
            }, 0);

            setMaintenanceCost(totalMaintenance);
            setFuelCost(totalFuel);
            setOtherExpensesCost(otherExpenses);
            setTotalKmDriven(Math.round(totalKm));
        } catch (error) {
            console.error('Error calculating monthly stats:', error);
            // Fallback a dati vuoti in caso di errore
            setMaintenanceCost(0);
            setFuelCost(0);
            setOtherExpensesCost(0);
            setTotalKmDriven(0);
        }
    };

    const loadUpcomingAppointments = async () => {
        try {
            if (!user?.id) return;

            const appointmentsQuery = query(
                collection(db, 'appointments'),
                where('customerId', '==', user.id),
                where('status', 'in', ['pending', 'confirmed']),
                orderBy('scheduledDate', 'asc'),
                limit(3)
            );

            const snapshot = await getDocs(appointmentsQuery);
            const appointmentsList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Appointment[];

            setUpcomingAppointments(appointmentsList);
        } catch (error) {
            console.error('Error loading appointments:', error);
        }
    };

    const loadPendingViewRequests = async () => {
        try {
            if (!user?.id || !user?.email) return;

            const viewRequestService = VehicleViewRequestService.getInstance();

            const incomingRequests = await viewRequestService.getIncomingRequests(user.id);
            const pendingCount = incomingRequests.filter(r => r.status === 'pending').length;
            setPendingViewRequests(pendingCount);

            const myRequests = await viewRequestService.getMyRequests(user.email);
            const approvedCount = myRequests.filter(r => r.status === 'approved').length;
            setApprovedViewRequests(approvedCount);
        } catch (error: any) {
            if (error?.code !== 'permission-denied') {
                console.error('Error loading view requests:', error);
            }
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

    // Real-time listeners per statistiche
    useEffect(() => {
        if (!user?.id || vehicles.length === 0) return;

        const vehicleIds = vehicles.map(v => v.id).slice(0, 10);
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayTimestamp = Timestamp.fromDate(firstDayOfMonth);

        // Listener per manutenzioni
        const maintenanceQuery = query(
            collection(db, 'maintenance_records'),
            where('vehicleId', 'in', vehicleIds),
            where('date', '>=', firstDayTimestamp),
            limit(100)
        );

        const unsubscribeMaintenance = onSnapshot(maintenanceQuery, (snapshot) => {
            const totalMaintenance = snapshot.docs.reduce((sum, doc) => sum + (doc.data().cost || 0), 0);
            setMaintenanceCost(totalMaintenance);
        });

        // Listener per carburante
        const fuelQuery = query(
            collection(db, 'fuel_records'),
            where('vehicleId', 'in', vehicleIds),
            where('date', '>=', firstDayTimestamp),
            limit(100)
        );

        const unsubscribeFuel = onSnapshot(fuelQuery, (snapshot) => {
            const totalFuel = snapshot.docs.reduce((sum, doc) => {
                const data = doc.data();
                return sum + (data.totalCost || data.cost || 0);
            }, 0);

            const totalKm = snapshot.docs.reduce((sum, doc) => {
                return sum + (doc.data().liters || 0) * 15;
            }, 0);

            setFuelCost(totalFuel);
            setTotalKmDriven(Math.round(totalKm));
        });

        // Listener per spese
        const expensesQuery = query(
            collection(db, 'expenses'),
            where('vehicleId', 'in', vehicleIds),
            where('date', '>=', firstDayTimestamp),
            limit(100)
        );

        const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
            const otherExpenses = snapshot.docs.reduce((sum, doc) => {
                return sum + (doc.data().amount || doc.data().cost || 0);
            }, 0);

            setOtherExpensesCost(otherExpenses);
        });

        return () => {
            unsubscribeMaintenance();
            unsubscribeFuel();
            unsubscribeExpenses();
        };
    }, [user?.id, vehicles.length]);

    // ============================================
    // LOADING STATE
    // ============================================
    if (loading && vehicles.length === 0) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={themeColors.primary} />
                    <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
                        Caricamento...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // ============================================
    // EMPTY STATE - Nessun veicolo
    // ============================================
    if (vehicles.length === 0) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                
                <View style={[styles.emptyHeader, { borderBottomColor: themeColors.border }]}>
                    <Text style={[styles.emptyHeaderTitle, { color: themeColors.text }]}>
                        MyMeccanica
                    </Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Settings' as never)}
                        style={styles.headerIconButton}
                    >
                        <SettingsIcon size={22} color={themeColors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={styles.emptyScrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={themeColors.primary}
                        />
                    }
                >
                    <View style={styles.emptyStateContainer}>
                        <View style={[styles.emptyIconCircle, { 
                            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7' 
                        }]}>
                            <Car size={80} color={themeColors.textSecondary} strokeWidth={1.5} />
                        </View>

                        <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                            Nessun Veicolo
                        </Text>
                        <Text style={[styles.emptyDescription, { color: themeColors.textSecondary }]}>
                            Inizia aggiungendo il tuo primo veicolo per tracciare{'\n'}
                            manutenzioni, scadenze e spese in modo intelligente.
                        </Text>

                        <TouchableOpacity
                            onPress={() => setShowAddVehicleModal(true)}
                            style={[styles.emptyPrimaryButton, { backgroundColor: themeColors.primary }]}
                            activeOpacity={0.8}
                        >
                            <Plus size={22} color="#FFFFFF" strokeWidth={2.5} />
                            <Text style={styles.emptyPrimaryButtonText}>
                                Aggiungi Veicolo
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {renderAddVehicleModal()}
            </SafeAreaView>
        );
    }

    // ============================================
    // RENDER FUNCTIONS
    // ============================================
    const renderHeader = () => (
        <View style={[styles.modernHeader, { 
            backgroundColor: themeColors.background,
            borderBottomColor: themeColors.border 
        }]}>
            <View style={styles.headerLeft}>
                <Text style={[styles.headerGreeting, { color: themeColors.textSecondary }]}>
                    Ciao, {user?.name?.split(' ')[0] || 'Benvenuto'}
                </Text>
                <Text style={[styles.headerTitle, { color: themeColors.text }]}>
                    I Tuoi Veicoli
                </Text>
            </View>
            <View style={styles.headerRight}>
                {pendingViewRequests > 0 && (
                    <TouchableOpacity
                        style={[styles.notificationButton, { backgroundColor: themeColors.surface }]}
                        onPress={() => navigation.navigate('ViewRequests' as never)}
                    >
                        <Bell size={20} color={themeColors.text} />
                        <View style={[styles.notificationBadge, { backgroundColor: '#FF3B30' }]}>
                            <Text style={styles.notificationBadgeText}>
                                {pendingViewRequests}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.headerIconButton}
                    onPress={() => navigation.navigate('Settings' as never)}
                >
                    <SettingsIcon size={22} color={themeColors.textSecondary} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderStats = () => (
        <View style={styles.statsSection}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Panoramica Mensile
            </Text>
            <View style={[
                styles.statsGrid,
                isDesktop && styles.statsGridDesktop,
                isTablet && styles.statsGridTablet,
            ]}>
                <ModernStatCard
                    icon={DollarSign}
                    label="Spese Totali"
                    value={`€${monthlyStats.totalExpenses.toFixed(2)}`}
                    color="#FF3B30"
                    colors={themeColors}
                    onPress={() => {
                        if (selectedVehicle) {
                            (navigation as any).navigate('ExpenseTracker', { carId: selectedVehicle.id });
                        }
                    }}
                />
                <ModernStatCard
                    icon={Fuel}
                    label="Carburante"
                    value={`€${monthlyStats.totalFuel.toFixed(2)}`}
                    color="#34C759"
                    colors={themeColors}
                    onPress={() => {
                        if (selectedVehicle) {
                            (navigation as any).navigate('FuelTracking', { carId: selectedVehicle.id });
                        }
                    }}
                />
                <ModernStatCard
                    icon={Wrench}
                    label="Manutenzioni"
                    value={`€${monthlyStats.totalMaintenance.toFixed(2)}`}
                    color="#667EEA"
                    colors={themeColors}
                    onPress={() => {
                        if (selectedVehicle) {
                            (navigation as any).navigate('MaintenanceHistory', { carId: selectedVehicle.id });
                        }
                    }}
                />
                <ModernStatCard
                    icon={Activity}
                    label="Km Percorsi"
                    value={`${monthlyStats.totalKm.toLocaleString()} km`}
                    color="#FF9500"
                    colors={themeColors}
                />
            </View>
        </View>
    );

    const renderVehicles = () => (
        <View style={styles.vehiclesSection}>
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                    Veicoli ({vehicles.length})
                </Text>
                <TouchableOpacity
                    onPress={() => setShowAddVehicleModal(true)}
                    style={[styles.addButton, { backgroundColor: themeColors.primary }]}
                >
                    <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.vehiclesScrollContent}
            >
                {vehicles.map((vehicle) => (
                    <ModernVehicleCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        colors={themeColors}
                        isDark={isDark}
                        onPress={() => {
                            setSelectedVehicle(vehicle);
                            (navigation as any).navigate('CarDetail', { carId: vehicle.id });
                        }}
                    />
                ))}
            </ScrollView>
        </View>
    );

    const renderAppointments = () => {
        if (upcomingAppointments.length === 0) return null;

        return (
            <View style={styles.appointmentsSection}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                        Prossimi Appuntamenti
                    </Text>
                    <TouchableOpacity onPress={() => {
                        Alert.alert(
                            'Nuovo Appuntamento',
                            'Vuoi prenotare un appuntamento con un meccanico?',
                            [
                                { text: 'Annulla', style: 'cancel' },
                                { text: 'Prenota', onPress: () => {
                                    Alert.alert('Info', 'Funzionalità di prenotazione in arrivo!');
                                }}
                            ]
                        );
                    }}>
                        <CalendarPlus size={22} color={themeColors.primary} strokeWidth={2} />
                    </TouchableOpacity>
                </View>
                {upcomingAppointments.map((appointment) => (
                    <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        colors={themeColors}
                    />
                ))}
            </View>
        );
    };

    const renderDeadlines = () => {
        if (deadlines.length === 0) return null;

        return (
            <View style={styles.deadlinesSection}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                        Scadenze Imminenti
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Reminders' as never)}>
                        <Text style={[styles.seeAllText, { color: themeColors.primary }]}>
                            Vedi Tutto
                        </Text>
                    </TouchableOpacity>
                </View>
                {deadlines.slice(0, 3).map((deadline) => {
                    const vehicle = vehicles.find(v => v.id === deadline.vehicleId);
                    return (
                        <ModernDeadlineCard
                            key={deadline.id}
                            deadline={deadline}
                            vehicle={vehicle}
                            colors={themeColors}
                            onPress={() => Alert.alert('Scadenza', deadline.description)}
                        />
                    );
                })}
            </View>
        );
    };

    const renderActivities = () => {
        if (recentActivities.length === 0) return null;

        return (
            <View style={styles.activitiesSection}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                        Attività Recenti
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('CarsList' as never)}>
                        <Text style={[styles.seeAllText, { color: themeColors.primary }]}>
                            Vedi Tutto
                        </Text>
                    </TouchableOpacity>
                </View>
                {recentActivities.slice(0, 3).map((activity) => {
                    const vehicle = vehicles.find(v => v.id === activity.vehicleId);
                    return (
                        <ModernActivityCard
                            key={activity.id}
                            activity={activity}
                            vehicle={vehicle}
                            colors={themeColors}
                        />
                    );
                })}
            </View>
        );
    };

    function renderAddVehicleModal() {
        return (
            <Modal
                visible={showAddVehicleModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowAddVehicleModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowAddVehicleModal(false)}
                >
                    <Pressable
                        style={[styles.modalContent, { backgroundColor: themeColors.surface }]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                                Aggiungi Veicolo
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowAddVehicleModal(false)}
                                style={styles.modalCloseButton}
                            >
                                <X size={24} color={themeColors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.modalDescription, { color: themeColors.textSecondary }]}>
                            Scegli come vuoi aggiungere il tuo veicolo
                        </Text>

                        <View style={styles.modalOptions}>
                            <TouchableOpacity
                                style={[styles.modalOption, { backgroundColor: themeColors.surfaceVariant }]}
                                onPress={() => {
                                    setShowAddVehicleModal(false);
                                    navigation.navigate('AddVehicle' as never);
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.modalOptionIcon, { backgroundColor: '#667EEA20' }]}>
                                    <Plus size={28} color="#667EEA" strokeWidth={2.5} />
                                </View>
                                <View style={styles.modalOptionContent}>
                                    <Text style={[styles.modalOptionTitle, { color: themeColors.text }]}>
                                        Inserimento Manuale
                                    </Text>
                                    <Text style={[styles.modalOptionDescription, { color: themeColors.textSecondary }]}>
                                        Inserisci i dati del veicolo manualmente
                                    </Text>
                                </View>
                                <ChevronRight size={20} color={themeColors.textSecondary} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalOption, { backgroundColor: themeColors.surfaceVariant }]}
                                onPress={() => {
                                    setShowAddVehicleModal(false);
                                    navigation.navigate('RequestVehicleView' as never);
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.modalOptionIcon, { backgroundColor: '#34C75920' }]}>
                                    <Search size={28} color="#34C759" strokeWidth={2.5} />
                                </View>
                                <View style={styles.modalOptionContent}>
                                    <Text style={[styles.modalOptionTitle, { color: themeColors.text }]}>
                                        Cerca Veicolo da Acquistare
                                    </Text>
                                    <Text style={[styles.modalOptionDescription, { color: themeColors.textSecondary }]}>
                                        Richiedi di visualizzare i dati di un veicolo
                                    </Text>
                                </View>
                                <ChevronRight size={20} color={themeColors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        );
    }

    // ============================================
    // RENDER PRINCIPALE
    // ============================================
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            
            {renderHeader()}

            <Animated.ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    isDesktop && styles.scrollContentDesktop,
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={themeColors.primary}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    }}
                >
                    {renderStats()}
                    {renderVehicles()}
                    {renderAppointments()}
                    {renderDeadlines()}
                    {renderActivities()}

                    <View style={{ height: 40 }} />
                </Animated.View>
            </Animated.ScrollView>

            {isMobile && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: themeColors.primary }]}
                    onPress={() => setShowAddVehicleModal(true)}
                    activeOpacity={0.9}
                    testID="add-vehicle-fab"
                >
                    <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>
            )}

            {renderAddVehicleModal()}
        </SafeAreaView>
    );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '500',
    },

    // Empty State
    emptyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    emptyHeaderTitle: {
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    headerIconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    emptyStateContainer: {
        alignItems: 'center',
        maxWidth: 400,
    },
    emptyIconCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    emptyTitle: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 12,
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    emptyDescription: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        marginBottom: 32,
    },
    emptyPrimaryButton: {
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
                shadowOpacity: 0.15,
                shadowRadius: 12,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    emptyPrimaryButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: -0.3,
    },

    // Modern Header
    modernHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerLeft: {
        flex: 1,
    },
    headerGreeting: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    notificationButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    notificationBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },

    // Scroll View
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    scrollContentDesktop: {
        paddingHorizontal: 40,
        maxWidth: 1400,
        alignSelf: 'center',
        width: '100%',
    },

    // Section Headers
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: -0.5,
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    seeAllText: {
        fontSize: 15,
        fontWeight: '600',
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Stats Section
    statsSection: {
        marginBottom: 32,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statsGridTablet: {
        gap: 16,
    },
    statsGridDesktop: {
        flexWrap: 'nowrap',
        gap: 20,
    },
    modernStatCard: {
        flex: 1,
        minWidth: '47%',
        borderRadius: 16,
        padding: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statContent: {
        flex: 1,
    },
    statLabel: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    statTrend: {
        position: 'absolute',
        top: 16,
        right: 16,
    },
    statTrendText: {
        fontSize: 12,
        fontWeight: '600',
    },

    // Vehicles Section
    vehiclesSection: {
        marginBottom: 32,
    },
    vehiclesScrollContent: {
        gap: 16,
        paddingRight: 20,
    },
    modernVehicleCard: {
        width: 300,
        borderRadius: 20,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    vehicleGradient: {
        padding: 20,
        minHeight: 160,
        justifyContent: 'space-between',
    },
    vehicleCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    vehicleMainInfo: {
        flex: 1,
    },
    vehicleCardMake: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    vehicleCardPlate: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
        letterSpacing: 1,
    },
    vehicleCardBadge: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    vehicleCardYear: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    vehicleCardFooter: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 16,
    },
    vehicleMetric: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    vehicleMetricText: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.9)',
    },

    // Appointments Section
    appointmentsSection: {
        marginBottom: 32,
    },
    appointmentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        position: 'relative',
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    appointmentColorStrip: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    },
    appointmentIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    appointmentContent: {
        flex: 1,
    },
    appointmentTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    appointmentMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    appointmentMeta: {
        fontSize: 13,
        fontWeight: '500',
    },
    appointmentDate: {
        fontSize: 13,
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginLeft: 8,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },

    // Deadlines Section
    deadlinesSection: {
        marginBottom: 32,
    },
    modernDeadlineCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        position: 'relative',
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    deadlineColorStrip: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    },
    deadlineIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    deadlineContent: {
        flex: 1,
    },
    deadlineTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    deadlineMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    deadlineMeta: {
        fontSize: 13,
        fontWeight: '500',
    },
    deadlineDate: {
        fontSize: 13,
        fontWeight: '500',
    },

    // Activities Section
    activitiesSection: {
        marginBottom: 32,
    },
    modernActivityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    activityIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
    },
    activityDescription: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    activityMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    activityMeta: {
        fontSize: 13,
        fontWeight: '500',
    },
    activityDate: {
        fontSize: 13,
        fontWeight: '500',
    },
    activityCost: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.3,
        marginLeft: 12,
    },

    // FAB
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
            },
            android: {
                elevation: 6,
            },
        }),
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 500,
        borderRadius: 24,
        padding: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
            },
            android: {
                elevation: 10,
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
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
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
        gap: 12,
    },
    modalOptionIcon: {
        width: 56,
        height: 56,
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

// src/screens/user/OwnerHomeScreen.tsx
import React, { useState, useEffect } from 'react';
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
    Pressable,
} from 'react-native';
import {
    Plus,
    User,
    Wrench,
    Calendar,
    CreditCard,
    Car,
    Clock,
    CheckCircle,
    AlertCircle,
    DollarSign,
    Settings,
    ChevronRight,
    Activity,
    Gauge,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    onSnapshot,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
// Date utilities - Nessuna libreria esterna richiesta

// ============================================================
// DATE UTILITIES (No external libraries)
// ============================================================
const formatDate = (date: Date, format: 'short' | 'long' | 'full' = 'long'): string => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return 'Data non valida';
    }

    const options: Intl.DateTimeFormatOptions =
        format === 'short'
            ? { day: '2-digit', month: 'short', year: 'numeric' }
            : format === 'long'
                ? { day: 'numeric', month: 'long', year: 'numeric' }
                : { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };

    return new Intl.DateTimeFormat('it-IT', options).format(date);
};

const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR',
    }).format(amount);
};

// ============================================================
// TYPES
// ============================================================
interface Vehicle {
    id: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    mileage: number;
    mainImageUrl?: string;
    images?: any[];
    ownerId: string;
    fuel?: string;
}

interface Deadline {
    id: string;
    vehicleId: string;
    type: 'tagliando' | 'revisione' | 'bollo' | 'assicurazione' | 'altro';
    title: string;
    dueDate: Date;
    amount?: number;
    status: 'previsto' | 'stimato' | 'fisso';
    priority?: 'high' | 'medium' | 'low';
}

interface RecentActivity {
    id: string;
    vehicleId: string;
    type: string;
    description: string;
    date: Date;
    cost: number;
    workshopName?: string;
}

// ============================================================
// OWNER HOME SCREEN
// ============================================================
const OwnerHomeScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
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
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // ============================================================
    // FIREBASE DATA LOADING
    // ============================================================
    useEffect(() => {
        if (!user?.uid) return;
        loadAllData();
    }, [user]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadVehicles(),
                loadDeadlines(),
                loadRecentActivities(),
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadVehicles = async () => {
        if (!user?.uid) return;

        try {
            const q = query(
                collection(db, 'vehicles'),
                where('ownerId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(q);
            const vehiclesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Vehicle[];

            setVehicles(vehiclesData);
            if (vehiclesData.length > 0 && !selectedVehicle) {
                setSelectedVehicle(vehiclesData[0]);
            }
        } catch (error) {
            console.error('Error loading vehicles:', error);
        }
    };

    const loadDeadlines = async () => {
        if (!user?.uid || !selectedVehicle?.id) return;

        try {
            const q = query(
                collection(db, 'deadlines'),
                where('vehicleId', '==', selectedVehicle.id),
                where('dueDate', '>', Timestamp.now()),
                orderBy('dueDate', 'asc'),
                limit(5)
            );

            const snapshot = await getDocs(q);
            const deadlinesData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    dueDate: data.dueDate?.toDate() || new Date(),
                };
            }) as Deadline[];

            // Se non ci sono scadenze reali, creiamo alcuni esempi
            if (deadlinesData.length === 0) {
                const mockDeadlines: Deadline[] = [
                    {
                        id: '1',
                        vehicleId: selectedVehicle.id,
                        type: 'tagliando',
                        title: 'Tagliando',
                        dueDate: addDays(new Date(), 30),
                        amount: 150,
                        status: 'previsto',
                    },
                    {
                        id: '2',
                        vehicleId: selectedVehicle.id,
                        type: 'revisione',
                        title: 'Revisione',
                        dueDate: addDays(new Date(), 45),
                        amount: 79,
                        status: 'stimato',
                    },
                    {
                        id: '3',
                        vehicleId: selectedVehicle.id,
                        type: 'bollo',
                        title: 'Bollo Auto',
                        dueDate: addDays(new Date(), 60),
                        amount: 250,
                        status: 'fisso',
                    },
                ];
                setDeadlines(mockDeadlines);
            } else {
                setDeadlines(deadlinesData);
            }
        } catch (error) {
            console.error('Error loading deadlines:', error);
        }
    };

    const loadRecentActivities = async () => {
        if (!user?.uid || !selectedVehicle?.id) return;

        try {
            const q = query(
                collection(db, 'maintenance_records'),
                where('vehicleId', '==', selectedVehicle.id),
                orderBy('date', 'desc'),
                limit(5)
            );

            const snapshot = await getDocs(q);
            const activitiesData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    vehicleId: data.vehicleId,
                    type: data.type,
                    description: data.description,
                    date: data.date?.toDate() || new Date(),
                    cost: data.cost || 0,
                    workshopName: data.workshopName,
                };
            }) as RecentActivity[];

            // Se non ci sono attività, creiamo alcuni esempi
            if (activitiesData.length === 0) {
                const mockActivities: RecentActivity[] = [
                    {
                        id: '1',
                        vehicleId: selectedVehicle.id,
                        type: 'maintenance',
                        description: 'Sostituzione Olio Motore',
                        date: new Date('2024-07-12'),
                        cost: 120,
                        workshopName: 'Officina Rossi',
                    },
                    {
                        id: '2',
                        vehicleId: selectedVehicle.id,
                        type: 'tires',
                        description: 'Cambio Gomme Invernali',
                        date: new Date('2023-11-10'),
                        cost: 450,
                        workshopName: 'Gommista di fiducia',
                    },
                ];
                setRecentActivities(mockActivities);
            } else {
                setRecentActivities(activitiesData);
            }
        } catch (error) {
            console.error('Error loading activities:', error);
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        loadAllData().finally(() => setRefreshing(false));
    }, [selectedVehicle]);

    // ============================================================
    // UI HELPERS
    // ============================================================
    const getDeadlineIcon = (type: string) => {
        switch (type) {
            case 'tagliando':
                return <Wrench size={20} color="#64748b" />;
            case 'revisione':
                return <CheckCircle size={20} color="#64748b" />;
            case 'bollo':
            case 'assicurazione':
                return <CreditCard size={20} color="#64748b" />;
            default:
                return <Calendar size={20} color="#64748b" />;
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'maintenance':
                return <Wrench size={20} color="#64748b" />;
            case 'tires':
                return <Car size={20} color="#64748b" />;
            default:
                return <Activity size={20} color="#64748b" />;
        }
    };

    // ============================================================
    // RENDER MOBILE
    // ============================================================
    const renderMobile = () => (
        <SafeAreaView style={[styles.container, styles.containerMobile]}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

            {/* Header Mobile */}
            <View style={styles.headerMobile}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => navigation.navigate('AddCarScreen' as never)}
                >
                    <Plus size={24} color="#1e293b" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>I miei veicoli</Text>

                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => navigation.navigate('Profile' as never)}
                >
                    <User size={24} color="#1e293b" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#3b82f6']}
                    />
                }
            >
                {/* Vehicle Card */}
                {selectedVehicle && (
                    <TouchableOpacity
                        style={styles.vehicleCard}
                        onPress={() => navigation.navigate('CarProfile', {
                            carId: selectedVehicle.id
                        } as never)}
                        activeOpacity={0.95}
                    >
                        {selectedVehicle.mainImageUrl ? (
                            <Image
                                source={{ uri: selectedVehicle.mainImageUrl }}
                                style={styles.vehicleImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[styles.vehicleImage, styles.vehicleImagePlaceholder]}>
                                <Car size={80} color="#cbd5e1" />
                            </View>
                        )}

                        <Text style={styles.vehicleModel}>{selectedVehicle.model}</Text>
                        <Text style={styles.vehiclePlate}>{selectedVehicle.licensePlate}</Text>

                        <TouchableOpacity style={styles.selectButton}>
                            <Text style={styles.selectButtonText}>Selezionata</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}

                {/* Deadlines Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Prossime scadenze</Text>

                    {deadlines.map((deadline) => (
                        <TouchableOpacity
                            key={deadline.id}
                            style={styles.deadlineItem}
                            onPress={() => navigation.navigate('DeadlineDetail', {
                                deadlineId: deadline.id
                            } as never)}
                        >
                            <View style={styles.deadlineIcon}>
                                {getDeadlineIcon(deadline.type)}
                            </View>

                            <View style={styles.deadlineContent}>
                                <Text style={styles.deadlineTitle}>{deadline.title}</Text>
                                <Text style={styles.deadlineDate}>
                                    Scadenza: {formatDate(deadline.dueDate, 'long')}
                                </Text>
                            </View>

                            <View style={styles.deadlineAmount}>
                                {deadline.amount && (
                                    <Text style={styles.amountText}>
                                        {formatCurrency(deadline.amount)}
                                    </Text>
                                )}
                                <Text style={styles.amountStatus}>{deadline.status}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Recent Activities */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Attività Recenti</Text>

                    {recentActivities.map((activity) => (
                        <TouchableOpacity
                            key={activity.id}
                            style={styles.activityItem}
                            onPress={() => navigation.navigate('MaintenanceDetail', {
                                maintenanceId: activity.id
                            } as never)}
                        >
                            <View style={styles.activityIcon}>
                                {getActivityIcon(activity.type)}
                            </View>

                            <View style={styles.activityContent}>
                                <Text style={styles.activityTitle}>{activity.description}</Text>
                                <Text style={styles.activityDate}>
                                    {formatDate(activity.date, 'long')}
                                    {activity.workshopName && ` - ${activity.workshopName}`}
                                </Text>
                            </View>

                            <Text style={styles.activityCost}>
                                {formatCurrency(activity.cost)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );

    // ============================================================
    // RENDER WEB/DESKTOP
    // ============================================================
    const renderDesktop = () => (
        <View style={[styles.container, styles.containerDesktop]}>
            <StatusBar barStyle="dark-content" />

            {/* Header Desktop */}
            <View style={styles.headerDesktop}>
                <View style={styles.headerDesktopContent}>
                    <Text style={styles.headerTitleDesktop}>Dashboard Veicoli</Text>
                    <Text style={styles.headerSubtitle}>
                        Benvenuto, {user?.displayName || user?.email}
                    </Text>
                </View>

                <View style={styles.headerActions}>
                    <Pressable
                        style={styles.headerActionButton}
                        onPress={() => navigation.navigate('AddVehicle' as never)}
                    >
                        <Plus size={20} color="#fff" />
                        <Text style={styles.headerActionText}>Aggiungi Veicolo</Text>
                    </Pressable>

                    <Pressable
                        style={styles.profileButton}
                        onPress={() => navigation.navigate('Profile' as never)}
                    >
                        <User size={20} color="#475569" />
                    </Pressable>
                </View>
            </View>

            <ScrollView
                style={styles.scrollViewDesktop}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            >
                <View style={styles.desktopGrid}>
                    {/* Left Column - Vehicle & Stats */}
                    <View style={styles.leftColumn}>
                        {/* Vehicle Selection */}
                        <View style={styles.cardDesktop}>
                            <Text style={styles.cardTitle}>I tuoi veicoli</Text>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.vehiclesScroll}
                            >
                                {vehicles.map((vehicle) => (
                                    <Pressable
                                        key={vehicle.id}
                                        style={[
                                            styles.vehicleCardDesktop,
                                            selectedVehicle?.id === vehicle.id && styles.vehicleCardSelected
                                        ]}
                                        onPress={() => {
                                            setSelectedVehicle(vehicle);
                                            loadDeadlines();
                                            loadRecentActivities();
                                        }}
                                    >
                                        {vehicle.mainImageUrl ? (
                                            <Image
                                                source={{ uri: vehicle.mainImageUrl }}
                                                style={styles.vehicleImageDesktop}
                                            />
                                        ) : (
                                            <View style={[styles.vehicleImageDesktop, styles.vehicleImagePlaceholder]}>
                                                <Car size={40} color="#cbd5e1" />
                                            </View>
                                        )}

                                        <View style={styles.vehicleInfoDesktop}>
                                            <Text style={styles.vehicleModelDesktop}>
                                                {vehicle.make} {vehicle.model}
                                            </Text>
                                            <Text style={styles.vehiclePlateDesktop}>
                                                {vehicle.licensePlate}
                                            </Text>
                                            <View style={styles.vehicleStats}>
                                                <View style={styles.statItem}>
                                                    <Gauge size={14} color="#64748b" />
                                                    <Text style={styles.statText}>
                                                        {vehicle.mileage?.toLocaleString()} km
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {selectedVehicle?.id === vehicle.id && (
                                            <View style={styles.selectedBadge}>
                                                <CheckCircle size={16} color="#fff" />
                                            </View>
                                        )}
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Quick Stats */}
                        <View style={styles.statsGrid}>
                            <View style={[styles.statCard, { backgroundColor: '#f0f9ff' }]}>
                                <View style={styles.statIconContainer}>
                                    <Calendar size={24} color="#0ea5e9" />
                                </View>
                                <Text style={styles.statValue}>{deadlines.length}</Text>
                                <Text style={styles.statLabel}>Scadenze</Text>
                            </View>

                            <View style={[styles.statCard, { backgroundColor: '#f0fdf4' }]}>
                                <View style={styles.statIconContainer}>
                                    <CheckCircle size={24} color="#22c55e" />
                                </View>
                                <Text style={styles.statValue}>{recentActivities.length}</Text>
                                <Text style={styles.statLabel}>Interventi</Text>
                            </View>

                            <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
                                <View style={styles.statIconContainer}>
                                    <DollarSign size={24} color="#f59e0b" />
                                </View>
                                <Text style={styles.statValue}>
                                    {formatCurrency(
                                        recentActivities.reduce((acc, a) => acc + a.cost, 0)
                                    )}
                                </Text>
                                <Text style={styles.statLabel}>Spese Totali</Text>
                            </View>
                        </View>
                    </View>

                    {/* Right Column - Deadlines & Activities */}
                    <View style={styles.rightColumn}>
                        {/* Deadlines */}
                        <View style={styles.cardDesktop}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Prossime Scadenze</Text>
                                <TouchableOpacity>
                                    <Text style={styles.viewAllLink}>Vedi tutte</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.deadlinesList}>
                                {deadlines.map((deadline) => (
                                    <Pressable
                                        key={deadline.id}
                                        style={styles.deadlineItemDesktop}
                                        onPress={() => navigation.navigate('DeadlineDetail', {
                                            deadlineId: deadline.id
                                        } as never)}
                                    >
                                        <View style={styles.deadlineLeft}>
                                            <View style={styles.deadlineIconDesktop}>
                                                {getDeadlineIcon(deadline.type)}
                                            </View>
                                            <View>
                                                <Text style={styles.deadlineTitleDesktop}>
                                                    {deadline.title}
                                                </Text>
                                                <Text style={styles.deadlineDateDesktop}>
                                                    {formatDate(deadline.dueDate, 'long')}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.deadlineRight}>
                                            {deadline.amount && (
                                                <Text style={styles.deadlineAmountDesktop}>
                                                    {formatCurrency(deadline.amount)}
                                                </Text>
                                            )}
                                            <View style={[
                                                styles.statusBadge,
                                                deadline.status === 'fisso' && styles.statusFixed,
                                                deadline.status === 'stimato' && styles.statusEstimated,
                                                deadline.status === 'previsto' && styles.statusExpected,
                                            ]}>
                                                <Text style={styles.statusText}>{deadline.status}</Text>
                                            </View>
                                        </View>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Recent Activities */}
                        <View style={styles.cardDesktop}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Attività Recenti</Text>
                                <TouchableOpacity>
                                    <Text style={styles.viewAllLink}>Vedi storico</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.activitiesList}>
                                {recentActivities.map((activity) => (
                                    <Pressable
                                        key={activity.id}
                                        style={styles.activityItemDesktop}
                                        onPress={() => navigation.navigate('MaintenanceDetail', {
                                            maintenanceId: activity.id
                                        } as never)}
                                    >
                                        <View style={styles.activityLeft}>
                                            <View style={styles.activityIconDesktop}>
                                                {getActivityIcon(activity.type)}
                                            </View>
                                            <View>
                                                <Text style={styles.activityTitleDesktop}>
                                                    {activity.description}
                                                </Text>
                                                <Text style={styles.activityDateDesktop}>
                                                    {formatDate(activity.date, 'short')}
                                                    {activity.workshopName && ` • ${activity.workshopName}`}
                                                </Text>
                                            </View>
                                        </View>

                                        <Text style={styles.activityCostDesktop}>
                                            {formatCurrency(activity.cost)}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );

    // ============================================================
    // MAIN RENDER
    // ============================================================
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Caricamento dati...</Text>
            </View>
        );
    }

    return isDesktop || isTablet ? renderDesktop() : renderMobile();
};

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
    // Container
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    containerMobile: {
        backgroundColor: '#fff',
    },
    containerDesktop: {
        backgroundColor: '#f1f5f9',
    },

    // Loading
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#64748b',
    },

    // ============================================================
    // MOBILE STYLES
    // ============================================================
    headerMobile: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1e293b',
    },

    scrollView: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },

    // Vehicle Card Mobile
    vehicleCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    vehicleImage: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        marginBottom: 16,
    },
    vehicleImagePlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    vehicleModel: {
        fontSize: 22,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    vehiclePlate: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 16,
    },
    selectButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
    },
    selectButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },

    // Sections
    section: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 16,
    },

    // Deadline Items
    deadlineItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    deadlineIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
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
        color: '#1e293b',
        marginBottom: 2,
    },
    deadlineDate: {
        fontSize: 14,
        color: '#64748b',
    },
    deadlineAmount: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2,
    },
    amountStatus: {
        fontSize: 12,
        color: '#64748b',
        fontStyle: 'italic',
    },

    // Activity Items
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2,
    },
    activityDate: {
        fontSize: 14,
        color: '#64748b',
    },
    activityCost: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },

    // ============================================================
    // DESKTOP STYLES
    // ============================================================
    headerDesktop: {
        backgroundColor: '#1e293b',
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerDesktopContent: {
        flex: 1,
    },
    headerTitleDesktop: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#94a3b8',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    headerActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#3b82f6',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    headerActionText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },

    scrollViewDesktop: {
        flex: 1,
    },

    desktopGrid: {
        flexDirection: 'row',
        padding: 24,
        gap: 24,
        maxWidth: 1400,
        alignSelf: 'center',
        width: '100%',
    },

    leftColumn: {
        flex: 2,
        gap: 24,
    },
    rightColumn: {
        flex: 3,
        gap: 24,
    },

    // Cards Desktop
    cardDesktop: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1e293b',
    },
    viewAllLink: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '500',
    },

    // Vehicle Cards Desktop
    vehiclesScroll: {
        marginTop: 16,
    },
    vehicleCardDesktop: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        marginRight: 16,
        width: 280,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    vehicleCardSelected: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    vehicleImageDesktop: {
        width: 80,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: '#e2e8f0',
    },
    vehicleInfoDesktop: {
        flex: 1,
    },
    vehicleModelDesktop: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2,
    },
    vehiclePlateDesktop: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 8,
    },
    vehicleStats: {
        flexDirection: 'row',
        gap: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
        color: '#64748b',
    },
    selectedBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    statCard: {
        flex: 1,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    statIconContainer: {
        marginBottom: 12,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: '#64748b',
    },

    // Deadlines Desktop
    deadlinesList: {
        gap: 12,
    },
    deadlineItemDesktop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#3b82f6',
    },
    deadlineLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    deadlineIconDesktop: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deadlineTitleDesktop: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2,
    },
    deadlineDateDesktop: {
        fontSize: 13,
        color: '#64748b',
    },
    deadlineRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    deadlineAmountDesktop: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusFixed: {
        backgroundColor: '#fee2e2',
    },
    statusEstimated: {
        backgroundColor: '#fef3c7',
    },
    statusExpected: {
        backgroundColor: '#dbeafe',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
    },

    // Activities Desktop
    activitiesList: {
        gap: 12,
    },
    activityItemDesktop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#10b981',
    },
    activityLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    activityIconDesktop: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityTitleDesktop: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2,
    },
    activityDateDesktop: {
        fontSize: 13,
        color: '#64748b',
    },
    activityCostDesktop: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
});

export default OwnerHomeScreen;
// src/screens/HomeScreen.tsx - CON FIREBASE REALE + RESPONSIVE WEB/MOBILE
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
} from 'react-native';
import {
    Plus,
    User,
    Wrench,
    Calendar,
    CreditCard,
    Fuel,
    Droplet,
    Gauge,
    Car,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store';
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

// ============================================================
// INTERFACES
// ============================================================
interface Vehicle {
    id: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    currentMileage: number;
    imageUrl?: string;
    mainImageUrl?: string;
    color?: string;
    ownerId: string;
}

interface Deadline {
    id: string;
    vehicleId: string;
    type: string;
    description: string;
    dueDate: any;
    amount?: number;
    status: string;
    priority: string;
}

interface Activity {
    id: string;
    vehicleId: string;
    type: string;
    description: string;
    date: any;
    cost: number;
    workshopName?: string;
    location?: string;
}

// ============================================================
// HOMESCREEN COMPONENT
// ============================================================
const HomeScreen = () => {
    const navigation = useNavigation();
    const { user } = useStore();
    const { width } = useWindowDimensions();

    // Responsive breakpoints
    const isDesktop = width >= 1024;
    const isTablet = width >= 768 && width < 1024;
    const isMobile = width < 768;

    // Stati
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedCar, setSelectedCar] = useState<Vehicle | null>(null);
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // ============================================================
    // LOAD DATA FROM FIREBASE
    // ============================================================
    useEffect(() => {
        if (!user?.id) return;

        loadData();

        // Setup real-time listeners
        const unsubscribeVehicles = setupVehiclesListener();
        const unsubscribeDeadlines = setupDeadlinesListener();
        const unsubscribeActivities = setupActivitiesListener();

        return () => {
            unsubscribeVehicles?.();
            unsubscribeDeadlines?.();
            unsubscribeActivities?.();
        };
    }, [user?.id]);

    const loadData = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);

            // Load vehicles
            await loadVehicles();

            setLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            setLoading(false);
        }
    };

    const loadVehicles = async () => {
        if (!user?.id) return;

        try {
            const vehiclesQuery = query(
                collection(db, 'vehicles'),
                where('ownerId', '==', user.id),
                where('isActive', '==', true),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(vehiclesQuery);
            const vehiclesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Vehicle[];

            setVehicles(vehiclesData);

            // Set first vehicle as selected
            if (vehiclesData.length > 0 && !selectedCar) {
                setSelectedCar(vehiclesData[0]);
            }
        } catch (error) {
            console.error('Error loading vehicles:', error);
        }
    };

    // Setup real-time listeners
    const setupVehiclesListener = () => {
        if (!user?.id) return;

        const q = query(
            collection(db, 'vehicles'),
            where('ownerId', '==', user.id),
            where('isActive', '==', true),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const vehiclesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Vehicle[];

            setVehicles(vehiclesData);

            if (vehiclesData.length > 0 && !selectedCar) {
                setSelectedCar(vehiclesData[0]);
            }
        });
    };

    const setupDeadlinesListener = () => {
        if (!selectedCar?.id) return;

        const q = query(
            collection(db, 'reminders'),
            where('vehicleId', '==', selectedCar.id),
            where('status', '==', 'active'),
            orderBy('dueDate', 'asc'),
            limit(5)
        );

        return onSnapshot(q, (snapshot) => {
            const deadlinesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Deadline[];

            setDeadlines(deadlinesData);
        });
    };

    const setupActivitiesListener = () => {
        if (!selectedCar?.id) return;

        const q = query(
            collection(db, 'maintenance_records'),
            where('vehicleId', '==', selectedCar.id),
            where('status', '==', 'completed'),
            orderBy('completedDate', 'desc'),
            limit(5)
        );

        return onSnapshot(q, (snapshot) => {
            const activitiesData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    vehicleId: data.vehicleId,
                    type: data.type,
                    description: data.description,
                    date: data.completedDate,
                    cost: data.cost || 0,
                    workshopName: data.workshopName,
                    location: data.workshopAddress,
                };
            }) as Activity[];

            setRecentActivities(activitiesData);
        });
    };

    // Refresh
    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    // ============================================================
    // HELPER FUNCTIONS
    // ============================================================
    const getIcon = (iconType: string, size = 24, color = '#64748b') => {
        switch (iconType) {
            case 'wrench':
            case 'maintenance':
                return <Wrench size={size} color={color} />;
            case 'calendar':
            case 'inspection':
                return <Calendar size={size} color={color} />;
            case 'card':
            case 'tax':
            case 'insurance':
                return <CreditCard size={size} color={color} />;
            case 'fuel':
                return <Fuel size={size} color={color} />;
            case 'gauge':
            case 'tires':
            case 'gomme':
                return <Gauge size={size} color={color} />;
            case 'droplet':
                return <Droplet size={size} color={color} />;
            default:
                return <Wrench size={size} color={color} />;
        }
    };

    const formatDate = (date: any): string => {
        if (!date) return '';

        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatAmount = (amount: number): string => {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount);
    };

    // ============================================================
    // LOADING STATE
    // ============================================================
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>Caricamento...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ============================================================
    // EMPTY STATE
    // ============================================================
    if (vehicles.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerButton} />
                    <Text style={styles.headerTitle}>I miei veicoli</Text>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => navigation.navigate('Profile' as never)}
                    >
                        <User size={28} color="#1e293b" strokeWidth={2.5} />
                    </TouchableOpacity>
                </View>

                {/* Empty State */}
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                        <Car size={64} color="#94a3b8" strokeWidth={1.5} />
                    </View>
                    <Text style={styles.emptyTitle}>Nessun veicolo</Text>
                    <Text style={styles.emptyDescription}>
                        Inizia aggiungendo il tuo primo veicolo per tracciare manutenzioni e spese
                    </Text>
                    <TouchableOpacity
                        style={styles.emptyButton}
                        onPress={() => navigation.navigate('AddCar' as never)}
                    >
                        <Plus size={20} color="#fff" />
                        <Text style={styles.emptyButtonText}>Aggiungi Veicolo</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ============================================================
    // RENDER MAIN CONTENT
    // ============================================================
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => navigation.navigate('AddCar' as never)}
                >
                    <Plus size={28} color="#1e293b" strokeWidth={2.5} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>I miei veicoli</Text>

                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => navigation.navigate('Profile' as never)}
                >
                    <User size={28} color="#1e293b" strokeWidth={2.5} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    isDesktop && styles.scrollContentDesktop,
                    isTablet && styles.scrollContentTablet,
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#3b82f6']}
                        tintColor="#3b82f6"
                    />
                }
            >
                {/* Main Content Container */}
                <View style={[
                    styles.contentContainer,
                    isDesktop && styles.contentContainerDesktop,
                ]}>
                    {/* Selected Car Card */}
                    <View style={[
                        styles.carCard,
                        isDesktop && styles.carCardDesktop,
                    ]}>
                        <Image
                            source={
                                selectedCar?.mainImageUrl || selectedCar?.imageUrl
                                    ? { uri: selectedCar.mainImageUrl || selectedCar.imageUrl }
                                    : require('../../../assets/car-placeholde.png')
                            }
                            style={styles.carImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.carName}>
                            {selectedCar?.make} {selectedCar?.model}
                        </Text>
                        <Text style={styles.carPlate}>{selectedCar?.licensePlate}</Text>

                        <TouchableOpacity
                            style={styles.selectedButton}
                            onPress={() => {
                                navigation.navigate('CarDetail' as never, {
                                    carId: selectedCar?.id
                                } as never);
                            }}
                        >
                            <Text style={styles.selectedButtonText}>Selezionata</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Sections Container - Side by side on desktop */}
                    <View style={[
                        styles.sectionsContainer,
                        isDesktop && styles.sectionsContainerDesktop,
                    ]}>
                        {/* Prossime Scadenze */}
                        <View style={[
                            styles.section,
                            isDesktop && styles.sectionDesktop,
                        ]}>
                            <Text style={styles.sectionTitle}>Prossime scadenze</Text>

                            {deadlines.length === 0 ? (
                                <View style={styles.emptySection}>
                                    <Text style={styles.emptySectionText}>
                                        Nessuna scadenza imminente
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.deadlinesList}>
                                    {deadlines.map((deadline) => (
                                        <TouchableOpacity
                                            key={deadline.id}
                                            style={styles.deadlineItem}
                                            onPress={() => {
                                                console.log('Apri dettaglio scadenza:', deadline.id);
                                            }}
                                        >
                                            <View style={styles.deadlineIconContainer}>
                                                {getIcon(deadline.type, 24, '#64748b')}
                                            </View>

                                            <View style={styles.deadlineContent}>
                                                <Text style={styles.deadlineTitle}>
                                                    {deadline.description}
                                                </Text>
                                                <Text style={styles.deadlineDate}>
                                                    Scadenza: {formatDate(deadline.dueDate)}
                                                </Text>
                                            </View>

                                            {deadline.amount && (
                                                <View style={styles.deadlineRight}>
                                                    <Text style={styles.deadlineAmount}>
                                                        {formatAmount(deadline.amount)}
                                                    </Text>
                                                    <Text style={styles.deadlineStatus}>
                                                        {deadline.status === 'active' ? 'Attiva' : 'Completata'}
                                                    </Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Attività Recenti */}
                        <View style={[
                            styles.section,
                            isDesktop && styles.sectionDesktop,
                        ]}>
                            <Text style={styles.sectionTitle}>Attività Recenti</Text>

                            {recentActivities.length === 0 ? (
                                <View style={styles.emptySection}>
                                    <Text style={styles.emptySectionText}>
                                        Nessuna attività registrata
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.activitiesList}>
                                    {recentActivities.map((activity) => (
                                        <TouchableOpacity
                                            key={activity.id}
                                            style={styles.activityItem}
                                            onPress={() => {
                                                console.log('Apri dettaglio attività:', activity.id);
                                            }}
                                        >
                                            <View style={styles.activityIconContainer}>
                                                {getIcon(activity.type, 24, '#64748b')}
                                            </View>

                                            <View style={styles.activityContent}>
                                                <Text style={styles.activityTitle}>
                                                    {activity.description}
                                                </Text>
                                                <Text style={styles.activitySubtitle}>
                                                    {formatDate(activity.date)}
                                                    {activity.workshopName && ` - ${activity.workshopName}`}
                                                </Text>
                                            </View>

                                            <Text style={styles.activityAmount}>
                                                {formatAmount(activity.cost)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Padding bottom */}
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748b',
        fontWeight: '500',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1e293b',
        letterSpacing: -0.3,
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    scrollContentTablet: {
        paddingHorizontal: 40,
    },
    scrollContentDesktop: {
        paddingHorizontal: 0,
    },
    contentContainer: {
        width: '100%',
    },
    contentContainerDesktop: {
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
        paddingHorizontal: 40,
    },

    // Car Card
    carCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        marginTop: 24,
        marginBottom: 8,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    carCardDesktop: {
        maxWidth: 600,
        alignSelf: 'center',
    },
    carImage: {
        width: '100%',
        height: 180,
        marginBottom: 16,
    },
    carName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    carPlate: {
        fontSize: 18,
        fontWeight: '500',
        color: '#64748b',
        marginBottom: 20,
        letterSpacing: 1,
    },
    selectedButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 48,
        paddingVertical: 14,
        borderRadius: 50,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    selectedButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.3,
    },

    // Sections Container
    sectionsContainer: {
        marginTop: 32,
        gap: 32,
    },
    sectionsContainerDesktop: {
        flexDirection: 'row',
        gap: 24,
        alignItems: 'flex-start',
    },

    // Section
    section: {
        flex: 1,
    },
    sectionDesktop: {
        minWidth: 0,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    emptySection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
    },
    emptySectionText: {
        fontSize: 15,
        color: '#94a3b8',
        textAlign: 'center',
    },

    // Deadlines
    deadlinesList: {
        gap: 12,
    },
    deadlineItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    deadlineIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    deadlineContent: {
        flex: 1,
    },
    deadlineTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
        letterSpacing: -0.2,
    },
    deadlineDate: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '400',
    },
    deadlineRight: {
        alignItems: 'flex-end',
    },
    deadlineAmount: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 2,
        letterSpacing: -0.3,
    },
    deadlineStatus: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },

    // Activities
    activitiesList: {
        gap: 12,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    activityIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    activityContent: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
        letterSpacing: -0.2,
    },
    activitySubtitle: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '400',
        lineHeight: 18,
    },
    activityAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        letterSpacing: -0.3,
    },

    // Empty State
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 12,
    },
    emptyDescription: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#3b82f6',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    emptyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default HomeScreen;
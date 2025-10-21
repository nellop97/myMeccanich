// src/screens/user/HomeScreen.tsx
// HomeScreen completa per Owner con Firebase + Responsive

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
    // RENDER MAIN CONTENT
    // ============================================
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerGreeting}>Ciao, {user?.name || 'Benvenuto'}</Text>
                    <Text style={styles.headerSubtitle}>
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
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    isDesktop && styles.scrollContentDesktop,
                ]}
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
                    <Text style={styles.sectionTitle}>Questo Mese</Text>
                    <View style={[styles.statsGrid, isDesktop && styles.statsGridDesktop]}>
                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#eff6ff' }]}>
                                <DollarSign size={24} color="#3b82f6" strokeWidth={2} />
                            </View>
                            <Text style={styles.statValue}>{formatCurrency(monthlyStats.totalExpenses)}</Text>
                            <Text style={styles.statLabel}>Spese Totali</Text>
                        </View>

                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                                <Fuel size={24} color="#f59e0b" strokeWidth={2} />
                            </View>
                            <Text style={styles.statValue}>{formatCurrency(monthlyStats.totalFuel)}</Text>
                            <Text style={styles.statLabel}>Carburante</Text>
                        </View>

                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                                <Wrench size={24} color="#3b82f6" strokeWidth={2} />
                            </View>
                            <Text style={styles.statValue}>{formatCurrency(monthlyStats.totalMaintenance)}</Text>
                            <Text style={styles.statLabel}>Manutenzioni</Text>
                        </View>

                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                                <TrendingUp size={24} color="#10b981" strokeWidth={2} />
                            </View>
                            <Text style={styles.statValue}>{monthlyStats.totalKm} km</Text>
                            <Text style={styles.statLabel}>Percorsi</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActionsContainer}>
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
                                style={styles.deadlineCard}
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
                                    <Text style={styles.deadlineTitle}>{deadline.description}</Text>
                                    <Text style={styles.deadlineDate}>
                                        Scade il {formatDate(deadline.dueDate)}
                                    </Text>
                                </View>

                                <ChevronRight size={20} color="#94a3b8" />
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
                            <View key={activity.id} style={styles.activityCard}>
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
                                    <Text style={styles.activityTitle}>{activity.description}</Text>
                                    <Text style={styles.activityDate}>
                                        {formatDate(activity.date)}
                                        {activity.workshopName && ` • ${activity.workshopName}`}
                                    </Text>
                                </View>

                                <Text style={styles.activityAmount}>
                                    {formatCurrency(activity.cost)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Altri Veicoli */}
                {vehicles.length > 1 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Altri Veicoli</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {vehicles
                                .filter((v) => v.id !== selectedVehicle?.id)
                                .map((vehicle) => (
                                    <TouchableOpacity
                                        key={vehicle.id}
                                        style={styles.otherVehicleCard}
                                        onPress={() => setSelectedVehicle(vehicle)}
                                    >
                                        <View style={styles.otherVehicleIcon}>
                                            <Car size={24} color="#64748b" />
                                        </View>
                                        <Text style={styles.otherVehicleName}>
                                            {vehicle.make} {vehicle.model}
                                        </Text>
                                        <Text style={styles.otherVehiclePlate}>
                                            {vehicle.licensePlate}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                        </ScrollView>
                    </View>
                )}

                {/* Spacer per FAB */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, isDesktop && styles.fabDesktop]}
                onPress={() => navigation.navigate('AddVehicle' as never)}
                activeOpacity={0.8}
            >
                <Plus size={28} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748b',
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            },
        }),
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
        letterSpacing: -0.5,
    },
    headerGreeting: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 2,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    headerButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#ef4444',
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
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
    scrollContent: {
        padding: 20,
    },
    scrollContentDesktop: {
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
    },

    // Empty State
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        textAlign: 'center',
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
        gap: 10,
        backgroundColor: '#3b82f6',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: '0 4px 8px rgba(59,130,246,0.3)',
            },
        }),
    },
    emptyButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: 0.3,
    },

    // Vehicle Card
    vehicleCard: {
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            },
        }),
    },
    vehicleGradient: {
        padding: 24,
    },
    vehicleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    vehicleInfo: {
        flex: 1,
    },
    vehicleName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    vehiclePlate: {
        fontSize: 18,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 12,
        letterSpacing: 1,
    },
    vehicleTag: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    vehicleTagText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    vehicleImage: {
        width: 120,
        height: 80,
    },
    vehicleActions: {
        flexDirection: 'row',
        gap: 12,
    },
    vehicleActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    vehicleActionText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },

    // Stats
    statsContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 16,
        letterSpacing: -0.3,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statsGridDesktop: {
        flexWrap: 'nowrap',
    },
    statCard: {
        flex: 1,
        minWidth: 150,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            },
        }),
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
    },

    // Quick Actions
    quickActionsContainer: {
        marginBottom: 24,
    },
    quickActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    quickActionButton: {
        flex: 1,
        minWidth: 70,
        alignItems: 'center',
        gap: 8,
    },
    quickActionIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickActionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1e293b',
        textAlign: 'center',
    },

    // Section
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionLink: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '600',
    },

    // Deadline Card
    deadlineCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            },
        }),
    },
    deadlineIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    deadlineInfo: {
        flex: 1,
    },
    deadlineTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    deadlineDate: {
        fontSize: 13,
        color: '#64748b',
    },

    // Activity Card
    activityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            },
        }),
    },
    activityIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    activityInfo: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    activityDate: {
        fontSize: 13,
        color: '#64748b',
    },
    activityAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },

    // Other Vehicles
    otherVehicleCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginRight: 12,
        width: 140,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            },
        }),
    },
    otherVehicleIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    otherVehicleName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        textAlign: 'center',
        marginBottom: 4,
    },
    otherVehiclePlate: {
        fontSize: 12,
        color: '#64748b',
    },

    // FAB
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
            },
            android: {
                elevation: 6,
            },
            web: {
                boxShadow: '0 6px 12px rgba(59,130,246,0.4)',
            },
        }),
    },
    fabDesktop: {
        bottom: 32,
        right: 32,
        width: 72,
        height: 72,
        borderRadius: 36,
    },
});

export default HomeScreen;
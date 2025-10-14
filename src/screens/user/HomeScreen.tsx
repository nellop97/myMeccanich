// src/screens/user/HomeScreen.tsx - VERSIONE AGGIORNATA CON NUOVO STILE
import React, { useState, useEffect, useCallback } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    StatusBar,
    RefreshControl,
    Alert,
    ActivityIndicator,
    Dimensions,
    Image,
} from 'react-native';
import { Text, Card, FAB } from 'react-native-paper';
import {
    Car,
    Plus,
    Wrench,
    Fuel,
    DollarSign,
    Bell,
    Calendar,
    ChevronRight,
    AlertCircle,
    TrendingUp,
    User,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

// Hooks
import { useAuth } from '../../hooks/useAuth';
import { useUserData } from '../../hooks/useUserData';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
    const navigation = useNavigation();

    // Hooks per dati
    const { user, logout } = useAuth();
    const {
        vehicles,
        recentMaintenance,
        upcomingReminders,
        recentFuelRecords,
        recentExpenses,
        loading,
        error,
        refreshData,
        stats,
        hasVehicles,
        hasOverdueReminders,
    } = useUserData();

    const [refreshing, setRefreshing] = useState(false);
    const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0);

    // Nome utente
    const userName = user?.firstName ||
        user?.displayName?.split(' ')[0] ||
        user?.email?.split('@')[0] ||
        'Utente';

    // Refresh dati
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refreshData();
        } catch (error) {
            console.error('Errore refresh:', error);
        } finally {
            setRefreshing(false);
        }
    }, [refreshData]);

    // Navigazione
    const handleNavigation = (screen: string, params?: any) => {
        navigation.navigate(screen as never, params as never);
    };

    // Formatta valuta
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Formatta data
    const formatDate = (date: any) => {
        if (!date) return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Loading
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Caricamento dati...</Text>
            </View>
        );
    }

    // Veicolo selezionato
    const selectedVehicle = vehicles[selectedVehicleIndex];

    // Promemoria del veicolo selezionato
    const vehicleReminders = upcomingReminders.filter(
        r => r.vehicleId === selectedVehicle?.id
    ).sort((a, b) => {
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (a.status !== 'overdue' && b.status === 'overdue') return 1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    // Storico manutenzioni del veicolo
    const vehicleMaintenance = recentMaintenance.filter(
        m => m.vehicleId === selectedVehicle?.id
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerGreeting}>Ciao, {userName}! 👋</Text>
                        <Text style={styles.headerSubtitle}>
                            {hasOverdueReminders
                                ? '⚠️ Hai scadenze da controllare'
                                : 'Tutto sotto controllo'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => handleNavigation('Profile', { userId: user?.uid })}
                    >
                        <User size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Sezione Veicoli */}
                {hasVehicles ? (
                    <View style={styles.vehicleSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>I miei veicoli</Text>
                            <TouchableOpacity onPress={() => handleNavigation('VehicleList')}>
                                <Text style={styles.seeAllLink}>Vedi tutti</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Card Veicolo */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            pagingEnabled
                            onMomentumScrollEnd={(event) => {
                                const index = Math.round(event.nativeEvent.contentOffset.x / (width - 40));
                                setSelectedVehicleIndex(index);
                            }}
                            contentContainerStyle={styles.vehicleCardsContainer}
                        >
                            {vehicles.map((vehicle, index) => (
                                <TouchableOpacity
                                    key={vehicle.id}
                                    style={styles.vehicleCard}
                                    onPress={() => handleNavigation('CarDetail', { carId: vehicle.id })}
                                    activeOpacity={0.9}
                                >
                                    <View style={styles.vehicleCardHeader}>
                                        <View>
                                            <Text style={styles.vehicleMake}>{vehicle.make} {vehicle.model}</Text>
                                            <Text style={styles.vehiclePlate}>{vehicle.licensePlate}</Text>
                                        </View>
                                        <View style={styles.selectedIndicator}>
                                            <Text style={styles.selectedIndicatorText}>Selezionata</Text>
                                        </View>
                                    </View>

                                    <View style={styles.vehicleStats}>
                                        <View style={styles.vehicleStat}>
                                            <Text style={styles.vehicleStatValue}>
                                                {vehicle.currentMileage?.toLocaleString() || '0'} km
                                            </Text>
                                            <Text style={styles.vehicleStatLabel}>Chilometraggio</Text>
                                        </View>
                                        <View style={styles.vehicleStat}>
                                            <Text style={styles.vehicleStatValue}>
                                                {vehicle.year}
                                            </Text>
                                            <Text style={styles.vehicleStatLabel}>Anno</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {vehicles.length > 1 && (
                            <View style={styles.paginationDots}>
                                {vehicles.map((_, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.dot,
                                            index === selectedVehicleIndex && styles.dotActive,
                                        ]}
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.emptyStateCard}>
                        <Car size={48} color="#64748b" />
                        <Text style={styles.emptyStateTitle}>Nessun veicolo</Text>
                        <Text style={styles.emptyStateText}>
                            Aggiungi il tuo primo veicolo per iniziare
                        </Text>
                        <TouchableOpacity
                            style={styles.addVehicleButton}
                            onPress={() => handleNavigation('AddCar')}
                        >
                            <Plus size={20} color="#fff" />
                            <Text style={styles.addVehicleButtonText}>Aggiungi Veicolo</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Promemoria di Oggi */}
                {vehicleReminders.length > 0 && (
                    <View style={styles.remindersSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Promemoria di Oggi</Text>
                            <TouchableOpacity onPress={() => handleNavigation('RemindersList')}>
                                <ChevronRight size={20} color="#3b82f6" />
                            </TouchableOpacity>
                        </View>

                        {vehicleReminders.slice(0, 2).map((reminder) => (
                            <TouchableOpacity
                                key={reminder.id}
                                style={[
                                    styles.reminderCard,
                                    reminder.status === 'overdue' && styles.reminderCardOverdue,
                                ]}
                                onPress={() => handleNavigation('ReminderDetail', { reminderId: reminder.id })}
                            >
                                <View style={[
                                    styles.reminderIcon,
                                    reminder.status === 'overdue'
                                        ? styles.reminderIconOverdue
                                        : styles.reminderIconNormal,
                                ]}>
                                    <Car size={24} color={reminder.status === 'overdue' ? '#ef4444' : '#3b82f6'} />
                                </View>
                                <View style={styles.reminderContent}>
                                    <Text style={styles.reminderTitle}>{reminder.title}</Text>
                                    <Text style={styles.reminderDate}>
                                        {reminder.status === 'overdue' ? 'Scadenza: ' : 'Scadenza: '}
                                        {formatDate(reminder.dueDate)}
                                    </Text>
                                </View>
                                <ChevronRight size={20} color="#64748b" />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Storico Manutenzioni */}
                {vehicleMaintenance.length > 0 && (
                    <View style={styles.maintenanceSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Storico Manutenzioni</Text>
                            <TouchableOpacity
                                onPress={() => handleNavigation('CarMaintenance', {
                                    carId: selectedVehicle?.id
                                })}
                            >
                                <Text style={styles.seeAllLink}>Vedi tutto</Text>
                            </TouchableOpacity>
                        </View>

                        {vehicleMaintenance.slice(0, 3).map((maintenance) => (
                            <TouchableOpacity
                                key={maintenance.id}
                                style={styles.maintenanceCard}
                                onPress={() => handleNavigation('MaintenanceDetail', {
                                    maintenanceId: maintenance.id
                                })}
                            >
                                <View style={styles.maintenanceIcon}>
                                    <Wrench size={20} color="#3b82f6" />
                                </View>
                                <View style={styles.maintenanceContent}>
                                    <Text style={styles.maintenanceTitle}>
                                        {maintenance.description || maintenance.type}
                                    </Text>
                                    <Text style={styles.maintenanceDate}>
                                        {formatDate(maintenance.completedDate)}
                                    </Text>
                                </View>
                                <ChevronRight size={20} color="#64748b" />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Quick Stats */}
                <View style={styles.statsSection}>
                    <Text style={styles.sectionTitle}>Statistiche</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#3b82f620' }]}>
                                <Car size={24} color="#3b82f6" />
                            </View>
                            <Text style={styles.statValue}>{stats.vehiclesCount}</Text>
                            <Text style={styles.statLabel}>Veicoli</Text>
                        </View>

                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#f59e0b20' }]}>
                                <Wrench size={24} color="#f59e0b" />
                            </View>
                            <Text style={styles.statValue}>{stats.maintenanceCount}</Text>
                            <Text style={styles.statLabel}>Manutenzioni</Text>
                        </View>

                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#10b98120' }]}>
                                <DollarSign size={24} color="#10b981" />
                            </View>
                            <Text style={styles.statValue}>
                                {formatCurrency(stats.totalExpenses + stats.totalFuelCost)}
                            </Text>
                            <Text style={styles.statLabel}>Spese</Text>
                        </View>
                    </View>
                </View>

                {/* Azioni Rapide */}
                <View style={styles.quickActionsSection}>
                    <Text style={styles.sectionTitle}>Azioni Rapide</Text>
                    <View style={styles.quickActionsGrid}>
                        <TouchableOpacity
                            style={styles.quickActionCard}
                            onPress={() => handleNavigation('AddMaintenance', {
                                carId: selectedVehicle?.id
                            })}
                        >
                            <Wrench size={24} color="#3b82f6" />
                            <Text style={styles.quickActionLabel}>Manutenzione</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickActionCard}
                            onPress={() => handleNavigation('AddFuel', {
                                carId: selectedVehicle?.id
                            })}
                        >
                            <Fuel size={24} color="#f59e0b" />
                            <Text style={styles.quickActionLabel}>Rifornimento</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickActionCard}
                            onPress={() => handleNavigation('AddExpense', {
                                carId: selectedVehicle?.id
                            })}
                        >
                            <DollarSign size={24} color="#10b981" />
                            <Text style={styles.quickActionLabel}>Spesa</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickActionCard}
                            onPress={() => handleNavigation('RemindersList')}
                        >
                            <Bell size={24} color="#ef4444" />
                            <Text style={styles.quickActionLabel}>Promemoria</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* FAB per aggiungere veicolo */}
            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => handleNavigation('AddCar')}
                color="#fff"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748b',
    },

    // Header
    header: {
        backgroundColor: '#3b82f6',
        paddingTop: 50,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerGreeting: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#e0e7ff',
    },
    profileButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },

    // Section Headers
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0f172a',
    },
    seeAllLink: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3b82f6',
    },

    // Vehicle Section
    vehicleSection: {
        paddingTop: 20,
        paddingHorizontal: 20,
    },
    vehicleCardsContainer: {
        paddingRight: 20,
    },
    vehicleCard: {
        width: width - 40,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    vehicleCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    vehicleMake: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 4,
    },
    vehiclePlate: {
        fontSize: 14,
        color: '#64748b',
    },
    selectedIndicator: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    selectedIndicatorText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    vehicleStats: {
        flexDirection: 'row',
        gap: 24,
    },
    vehicleStat: {
        flex: 1,
    },
    vehicleStatValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 4,
    },
    vehicleStatLabel: {
        fontSize: 12,
        color: '#64748b',
    },
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#e2e8f0',
    },
    dotActive: {
        backgroundColor: '#3b82f6',
        width: 24,
    },

    // Empty State
    emptyStateCard: {
        margin: 20,
        padding: 32,
        backgroundColor: '#fff',
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0f172a',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 24,
    },
    addVehicleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    addVehicleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },

    // Reminders Section
    remindersSection: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    reminderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    reminderCardOverdue: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    reminderIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    reminderIconNormal: {
        backgroundColor: '#eff6ff',
    },
    reminderIconOverdue: {
        backgroundColor: '#fef2f2',
    },
    reminderContent: {
        flex: 1,
    },
    reminderTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 4,
    },
    reminderDate: {
        fontSize: 14,
        color: '#64748b',
    },

    // Maintenance Section
    maintenanceSection: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    maintenanceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    maintenanceIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    maintenanceContent: {
        flex: 1,
    },
    maintenanceTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 4,
    },
    maintenanceDate: {
        fontSize: 14,
        color: '#64748b',
    },

    // Stats Section
    statsSection: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
    },

    // Quick Actions
    quickActionsSection: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    quickActionCard: {
        width: '22%',
        aspectRatio: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    quickActionLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#0f172a',
        marginTop: 8,
        textAlign: 'center',
    },

    // FAB
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#3b82f6',
    },
});

export default HomeScreen;
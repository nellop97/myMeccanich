// src/screens/user/HomeScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
    Car,
    Plus,
    User,
    Calendar,
    Wrench,
    Fuel,
    DollarSign,
    FileText,
    AlertCircle,
    CheckCircle,
} from 'lucide-react-native';

import { useStore } from '../../store';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isDesktop = width >= 1024;

const HomeScreen = () => {
    const navigation = useNavigation();
    const { user, cars } = useStore();
    const [refreshing, setRefreshing] = useState(false);
    const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0);

    const hasVehicles = cars && cars.length > 0;
    const selectedVehicle = hasVehicles ? cars[selectedVehicleIndex] : null;

    // Mock data - sostituisci con dati reali
    const [stats, setStats] = useState({
        upcomingMaintenances: 2,
        overdueReminders: 1,
        totalExpenses: 1250.50,
    });

    const hasOverdueReminders = stats.overdueReminders > 0;

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        // Simula refresh - sostituisci con logica reale
        setTimeout(() => {
            setRefreshing(false);
        }, 1500);
    }, []);

    const handleNavigation = (screen: string, params?: any) => {
        navigation.navigate(screen as never, params as never);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerTitle}>
                            Ciao, {user?.displayName?.split(' ')[0] || 'Utente'}! 👋
                        </Text>
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
                        <TouchableOpacity
                            style={styles.vehicleCard}
                            onPress={() => handleNavigation('CarDetail', { carId: selectedVehicle?.id })}
                            activeOpacity={0.9}
                        >
                            <View style={styles.vehicleCardHeader}>
                                <View>
                                    <Text style={styles.vehicleMake}>
                                        {selectedVehicle?.make} {selectedVehicle?.model}
                                    </Text>
                                    <Text style={styles.vehiclePlate}>{selectedVehicle?.licensePlate}</Text>
                                </View>
                                <View style={styles.selectedIndicator}>
                                    <Text style={styles.selectedIndicatorText}>Selezionata</Text>
                                </View>
                            </View>

                            <View style={styles.vehicleStats}>
                                <View style={styles.vehicleStat}>
                                    <Text style={styles.vehicleStatValue}>
                                        {selectedVehicle?.currentMileage?.toLocaleString() || '0'} km
                                    </Text>
                                    <Text style={styles.vehicleStatLabel}>Chilometraggio</Text>
                                </View>
                                <View style={styles.vehicleStat}>
                                    <Text style={styles.vehicleStatValue}>
                                        {selectedVehicle?.year || '-'}
                                    </Text>
                                    <Text style={styles.vehicleStatLabel}>Anno</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Pagination dots */}
                        {cars.length > 1 && (
                            <View style={styles.paginationDots}>
                                {cars.map((_, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => setSelectedVehicleIndex(index)}
                                    >
                                        <View
                                            style={[
                                                styles.dot,
                                                index === selectedVehicleIndex && styles.dotActive,
                                            ]}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                ) : (
                    // Empty State
                    <View style={styles.emptyStateCard}>
                        <View style={styles.emptyIconContainer}>
                            <Car size={48} color="#94a3b8" strokeWidth={1.5} />
                        </View>
                        <Text style={styles.emptyStateTitle}>Nessun veicolo</Text>
                        <Text style={styles.emptyStateText}>
                            Aggiungi il tuo primo veicolo per iniziare a tracciare manutenzioni e spese
                        </Text>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => handleNavigation('AddCar')}
                        >
                            <Plus size={20} color="#fff" />
                            <Text style={styles.addButtonText}>Aggiungi Veicolo</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Azioni Rapide */}
                {hasVehicles && (
                    <View style={styles.quickActionsSection}>
                        <Text style={styles.sectionTitle}>Azioni Rapide</Text>
                        <View style={[
                            styles.quickActionsGrid,
                            isDesktop && styles.quickActionsGridDesktop
                        ]}>
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
                                onPress={() => handleNavigation('AddDocument', {
                                    carId: selectedVehicle?.id
                                })}
                            >
                                <FileText size={24} color="#8b5cf6" />
                                <Text style={styles.quickActionLabel}>Documento</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Prossime Scadenze */}
                {hasVehicles && stats.upcomingMaintenances > 0 && (
                    <View style={styles.remindersSection}>
                        <Text style={styles.sectionTitle}>Prossime Scadenze</Text>

                        <TouchableOpacity
                            style={[
                                styles.reminderCard,
                                hasOverdueReminders && styles.reminderCardOverdue
                            ]}
                            onPress={() => handleNavigation('Reminders')}
                        >
                            <View style={styles.reminderIcon}>
                                {hasOverdueReminders ? (
                                    <AlertCircle size={24} color="#ef4444" />
                                ) : (
                                    <CheckCircle size={24} color="#10b981" />
                                )}
                            </View>
                            <View style={styles.reminderContent}>
                                <Text style={styles.reminderTitle}>
                                    {hasOverdueReminders ? 'Scadenze da controllare' : 'Manutenzioni in programma'}
                                </Text>
                                <Text style={styles.reminderText}>
                                    {stats.upcomingMaintenances} manutenzioni nei prossimi 30 giorni
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Statistiche Rapide */}
                {hasVehicles && (
                    <View style={styles.statsSection}>
                        <Text style={styles.sectionTitle}>Statistiche Rapide</Text>
                        <View style={[
                            styles.statsGrid,
                            isDesktop && styles.statsGridDesktop
                        ]}>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>€{stats.totalExpenses.toFixed(2)}</Text>
                                <Text style={styles.statLabel}>Spese Totali</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{stats.upcomingMaintenances}</Text>
                                <Text style={styles.statLabel}>Manutenzioni</Text>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* FAB per aggiungere veicolo */}
            {hasVehicles && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => handleNavigation('AddCar')}
                >
                    <Plus size={24} color="#fff" />
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },

    // Header
    header: {
        backgroundColor: '#3b82f6',
        paddingTop: Platform.OS === 'ios' ? 0 : 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#dbeafe',
    },
    profileButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Scroll View
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },

    // Section Header
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
    vehicleCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
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
    emptyIconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3b82f6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
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
        marginTop: 12,
    },
    quickActionsGridDesktop: {
        gap: 16,
    },
    quickActionCard: {
        flex: 1,
        minWidth: (width - 52) / 2,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    quickActionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
        marginTop: 12,
        textAlign: 'center',
    },

    // Reminders
    remindersSection: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    reminderCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginTop: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: '#10b981',
    },
    reminderCardOverdue: {
        borderLeftColor: '#ef4444',
    },
    reminderIcon: {
        marginRight: 16,
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
    reminderText: {
        fontSize: 14,
        color: '#64748b',
    },

    // Stats
    statsSection: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    statsGridDesktop: {
        gap: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        textTransform: 'uppercase',
    },

    // FAB
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});

export default HomeScreen;
// src/screens/user/HomeScreen.tsx
// HomeScreen Redesign - Apple-inspired with Liquid Glass Design

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
    Animated,
} from 'react-native';
import {
    Plus,
    Car,
    Wrench,
    Calendar,
    DollarSign,
    Fuel,
    Bell,
    Settings as SettingsIcon,
    ChevronRight,
    FileText,
    TrendingUp,
    Clock,
    Eye,
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
    getDocs,
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

interface QuickAction {
    id: string;
    icon: any;
    label: string;
    color: string;
    backgroundColor: string;
    onPress: () => void;
}

// ============================================
// GLASS CARD COMPONENT
// ============================================
const GlassCard = ({ children, style, onPress }: any) => {
    const { isDark } = useAppThemeManager();
    const [scaleAnim] = useState(new Animated.Value(1));

    const handlePressIn = () => {
        if (onPress) {
            Animated.spring(scaleAnim, {
                toValue: 0.97,
                useNativeDriver: true,
            }).start();
        }
    };

    const handlePressOut = () => {
        if (onPress) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 3,
                tension: 40,
                useNativeDriver: true,
            }).start();
        }
    };

    const cardContent = (
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
            {Platform.OS === 'web' || Platform.OS === 'ios' ? (
                <BlurView
                    intensity={Platform.OS === 'web' ? 40 : (isDark ? 30 : 60)}
                    tint={isDark ? 'dark' : 'light'}
                    style={[
                        styles.glassCard,
                        {
                            backgroundColor: isDark
                                ? 'rgba(30, 30, 30, 0.7)'
                                : 'rgba(255, 255, 255, 0.7)',
                            borderColor: isDark
                                ? 'rgba(255, 255, 255, 0.1)'
                                : 'rgba(0, 0, 0, 0.05)',
                        },
                        style
                    ]}
                >
                    {children}
                </BlurView>
            ) : (
                <View
                    style={[
                        styles.glassCard,
                        {
                            backgroundColor: isDark ? '#1a1a1a' : '#fff',
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        },
                        style
                    ]}
                >
                    {children}
                </View>
            )}
        </Animated.View>
    );

    if (onPress) {
        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                {cardContent}
            </TouchableOpacity>
        );
    }

    return cardContent;
};

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
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pendingViewRequests, setPendingViewRequests] = useState(0);

    // Dynamic theme colors
    const themeColors = React.useMemo(() => ({
        background: isDark ? '#000000' : '#F2F2F7',
        cardBg: isDark ? 'rgba(28, 28, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        text: colors.onSurface,
        textSecondary: colors.onSurfaceVariant,
        primary: '#007AFF',
        accent: '#5856D6',
    }), [colors, isDark]);

    // Quick Actions
    const quickActions: QuickAction[] = [
        {
            id: 'add-vehicle',
            icon: Plus,
            label: 'Aggiungi',
            color: '#007AFF',
            backgroundColor: isDark ? 'rgba(0, 122, 255, 0.2)' : '#E5F1FF',
            onPress: () => navigation.navigate('AddVehicle' as never),
        },
        {
            id: 'maintenance',
            icon: Wrench,
            label: 'Manutenzione',
            color: '#FF9500',
            backgroundColor: isDark ? 'rgba(255, 149, 0, 0.2)' : '#FFF4E5',
            onPress: () => navigation.navigate('MaintenanceHistory' as never),
        },
        {
            id: 'fuel',
            icon: Fuel,
            label: 'Carburante',
            color: '#34C759',
            backgroundColor: isDark ? 'rgba(52, 199, 89, 0.2)' : '#E8F8EC',
            onPress: () => navigation.navigate('FuelTracking' as never),
        },
        {
            id: 'expenses',
            icon: DollarSign,
            label: 'Spese',
            color: '#FF3B30',
            backgroundColor: isDark ? 'rgba(255, 59, 48, 0.2)' : '#FFE5E5',
            onPress: () => navigation.navigate('ExpenseTracker' as never),
        },
        {
            id: 'reminders',
            icon: Calendar,
            label: 'Promemoria',
            color: '#5856D6',
            backgroundColor: isDark ? 'rgba(88, 86, 214, 0.2)' : '#EFEFF4',
            onPress: () => navigation.navigate('Reminders' as never),
        },
        {
            id: 'view-requests',
            icon: Eye,
            label: 'Richieste',
            color: '#AF52DE',
            backgroundColor: isDark ? 'rgba(175, 82, 222, 0.2)' : '#F5EBFF',
            onPress: () => navigation.navigate('ViewRequests' as never),
        },
    ];

    // ============================================
    // LOAD DATA
    // ============================================
    const loadData = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);

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
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

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
    // RENDER VEHICLE CARD
    // ============================================
    const renderVehicleCard = (vehicle: Vehicle) => {
        // Supporta sia il nuovo campo mainImageUrl che il legacy imageUrl
        const mainImage = vehicle.mainImageUrl || vehicle.imageUrl;
        const hasMainImage = !!mainImage;
        
        return (
            <GlassCard
                key={vehicle.id}
                onPress={() => (navigation as any).navigate('CarDetail', { carId: vehicle.id })}
                style={styles.vehicleCard}
            >
                {hasMainImage && mainImage && (
                    <Image
                        source={{ uri: mainImage }}
                        style={styles.vehicleImage}
                        resizeMode="cover"
                    />
                )}
                {!hasMainImage && (
                    <View style={[styles.vehiclePlaceholder, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
                        <Car size={48} color={themeColors.textSecondary} strokeWidth={1.5} />
                    </View>
                )}

                <LinearGradient
                    colors={
                        isDark 
                            ? ['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']
                            : ['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']
                    }
                    style={styles.vehicleGradient}
                >
                    <View style={styles.vehicleInfo}>
                        <Text style={styles.vehicleName}>
                            {vehicle.make} {vehicle.model}
                        </Text>
                        <Text style={styles.vehicleDetails}>
                            {vehicle.year} • {vehicle.licensePlate}
                        </Text>
                        {vehicle.mileage > 0 && (
                            <View style={styles.vehicleStats}>
                                <TrendingUp size={14} color="#fff" />
                                <Text style={styles.vehicleStatsText}>
                                    {vehicle.mileage.toLocaleString('it-IT')} km
                                </Text>
                            </View>
                        )}
                    </View>
                    <ChevronRight size={24} color="#fff" strokeWidth={2} />
                </LinearGradient>
            </GlassCard>
        );
    };

    // ============================================
    // RENDER EMPTY STATE
    // ============================================
    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent, { backgroundColor: themeColors.background }]}>
                <ActivityIndicator size="large" color={themeColors.primary} />
                <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
                    Caricamento...
                </Text>
            </View>
        );
    }

    // ============================================
    // RENDER MAIN CONTENT
    // ============================================
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
            <StatusBar 
                barStyle={isDark ? 'light-content' : 'dark-content'} 
                backgroundColor={themeColors.background} 
            />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.greeting, { color: themeColors.textSecondary }]}>
                        Benvenuto,
                    </Text>
                    <Text style={[styles.userName, { color: themeColors.text }]}>
                        {user?.name || 'Utente'}
                    </Text>
                </View>
                <View style={styles.headerActions}>
                    {pendingViewRequests > 0 && (
                        <TouchableOpacity 
                            style={styles.notificationBadge}
                            onPress={() => navigation.navigate('ViewRequests' as never)}
                        >
                            <Bell size={24} color={themeColors.text} />
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{pendingViewRequests}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => navigation.navigate('Settings' as never)}>
                        <SettingsIcon size={24} color={themeColors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={themeColors.primary}
                    />
                }
            >
                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                        Azioni Rapide
                    </Text>
                    <View style={styles.quickActionsGrid}>
                        {quickActions.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                style={[
                                    styles.quickActionCard,
                                    { backgroundColor: action.backgroundColor },
                                    isDesktop && styles.quickActionCardDesktop
                                ]}
                                onPress={action.onPress}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                                    <action.icon size={24} color="#fff" strokeWidth={2} />
                                </View>
                                <Text style={[styles.quickActionLabel, { color: action.color }]}>
                                    {action.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Vehicles Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                            I Miei Veicoli
                        </Text>
                        {vehicles.length > 0 && (
                            <TouchableOpacity onPress={() => navigation.navigate('VehicleList' as never)}>
                                <Text style={[styles.seeAllText, { color: themeColors.primary }]}>
                                    Vedi tutti
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {vehicles.length === 0 ? (
                        <GlassCard style={styles.emptyCard}>
                            <View style={[
                                styles.emptyIconContainer, 
                                { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F2F2F7' }
                            ]}>
                                <Car size={64} color={themeColors.textSecondary} strokeWidth={1.5} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                                Nessun Veicolo
                            </Text>
                            <Text style={[styles.emptyDescription, { color: themeColors.textSecondary }]}>
                                Inizia aggiungendo il tuo primo veicolo per tracciare manutenzioni e spese
                            </Text>
                            <TouchableOpacity
                                style={[styles.addButton, { backgroundColor: themeColors.primary }]}
                                onPress={() => navigation.navigate('AddVehicle' as never)}
                            >
                                <Plus size={20} color="#fff" strokeWidth={2.5} />
                                <Text style={styles.addButtonText}>Aggiungi Veicolo</Text>
                            </TouchableOpacity>
                        </GlassCard>
                    ) : (
                        <View style={styles.vehiclesGrid}>
                            {vehicles.map(renderVehicleCard)}
                        </View>
                    )}
                </View>

                {/* Bottom Spacing */}
                <View style={{ height: 100 }} />
            </ScrollView>
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
    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '500',
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
    },
    greeting: {
        fontSize: 16,
        fontWeight: '500',
    },
    userName: {
        fontSize: 32,
        fontWeight: '700',
        marginTop: 4,
        letterSpacing: -0.5,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    notificationBadge: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },

    // ScrollView
    scrollView: {
        flex: 1,
    },

    // Section
    section: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    seeAllText: {
        fontSize: 16,
        fontWeight: '600',
    },

    // Quick Actions
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    quickActionCard: {
        width: '31%',
        minWidth: 100,
        aspectRatio: 1,
        borderRadius: 20,
        padding: 16,
        justifyContent: 'space-between',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    quickActionCardDesktop: {
        width: '15%',
    },
    quickActionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickActionLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
    },
    webActionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        letterSpacing: -0.3,
    },
    webActionDescription: {
        fontSize: 13,
        fontWeight: '400',
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 4,
    },

    // Glass Card
    glassCard: {
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
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
            web: {
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            },
        }),
    },

    // Vehicles
    vehiclesGrid: {
        gap: 16,
    },
    vehicleCard: {
        height: 200,
        position: 'relative',
        overflow: 'hidden',
    },
    vehicleImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    vehiclePlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    vehicleGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '70%',
        paddingHorizontal: 20,
        paddingVertical: 20,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    vehicleInfo: {
        flex: 1,
    },
    vehicleName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    vehicleDetails: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
    },
    vehicleStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
    },
    vehicleStatsText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },

    // Empty State
    emptyCard: {
        padding: 40,
        alignItems: 'center',
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    emptyDescription: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
        maxWidth: 320,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default HomeScreen;

// src/components/SkeletonLoader.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

// Skeleton singolo animato
export const Skeleton = ({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                    opacity,
                },
                style,
            ]}
        />
    );
};

// Skeleton per Card Veicolo
export const VehicleCardSkeleton = () => (
    <View style={styles.vehicleCard}>
        <View style={styles.vehicleCardHeader}>
            <View style={{ flex: 1 }}>
                <Skeleton width="60%" height={24} style={{ marginBottom: 8 }} />
                <Skeleton width="40%" height={16} />
            </View>
            <Skeleton width={80} height={30} borderRadius={12} />
        </View>
        <View style={styles.vehicleStats}>
            <View style={{ flex: 1 }}>
                <Skeleton width="70%" height={20} style={{ marginBottom: 4 }} />
                <Skeleton width="50%" height={14} />
            </View>
            <View style={{ flex: 1 }}>
                <Skeleton width="60%" height={20} style={{ marginBottom: 4 }} />
                <Skeleton width="40%" height={14} />
            </View>
        </View>
    </View>
);

// Skeleton per Card Promemoria
export const ReminderCardSkeleton = () => (
    <View style={styles.reminderCard}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={{ flex: 1, marginLeft: 12 }}>
            <Skeleton width="70%" height={18} style={{ marginBottom: 6 }} />
            <Skeleton width="50%" height={14} />
        </View>
        <Skeleton width={20} height={20} />
    </View>
);

// Skeleton per Card Manutenzione
export const MaintenanceCardSkeleton = () => (
    <View style={styles.maintenanceCard}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, marginLeft: 12 }}>
            <Skeleton width="60%" height={18} style={{ marginBottom: 6 }} />
            <Skeleton width="40%" height={14} />
        </View>
        <Skeleton width={20} height={20} />
    </View>
);

// Skeleton per Card Statistiche
export const StatCardSkeleton = () => (
    <View style={styles.statCard}>
        <Skeleton width={48} height={48} borderRadius={24} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={20} style={{ marginBottom: 4 }} />
        <Skeleton width="40%" height={14} />
    </View>
);

// Skeleton per Azione Rapida
export const QuickActionSkeleton = () => (
    <View style={styles.quickActionCard}>
        <Skeleton width={24} height={24} />
        <Skeleton width="70%" height={12} style={{ marginTop: 8 }} />
    </View>
);

// Skeleton per Header
export const HeaderSkeleton = () => (
    <View style={styles.header}>
        <View>
            <Skeleton width={200} height={28} style={{ marginBottom: 6 }} />
            <Skeleton width={150} height={16} />
        </View>
        <Skeleton width={40} height={40} borderRadius={20} />
    </View>
);

// Skeleton completo Homepage
export const HomeScreenSkeleton = () => (
    <View style={styles.container}>
        <HeaderSkeleton />

        <View style={styles.content}>
            {/* Veicolo */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Skeleton width={120} height={20} />
                    <Skeleton width={60} height={16} />
                </View>
                <VehicleCardSkeleton />
            </View>

            {/* Promemoria */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Skeleton width={150} height={20} />
                    <Skeleton width={20} height={20} />
                </View>
                <ReminderCardSkeleton />
                <ReminderCardSkeleton />
            </View>

            {/* Statistiche */}
            <View style={styles.section}>
                <Skeleton width={100} height={20} style={{ marginBottom: 16 }} />
                <View style={styles.statsGrid}>
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                </View>
            </View>

            {/* Azioni Rapide */}
            <View style={styles.section}>
                <Skeleton width={120} height={20} style={{ marginBottom: 16 }} />
                <View style={styles.quickActionsGrid}>
                    <QuickActionSkeleton />
                    <QuickActionSkeleton />
                    <QuickActionSkeleton />
                    <QuickActionSkeleton />
                </View>
            </View>
        </View>
    </View>
);

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#e2e8f0',
    },
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#3b82f6',
        padding: 20,
        paddingTop: 60,
        paddingBottom: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
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
        marginBottom: 16,
    },
    vehicleStats: {
        flexDirection: 'row',
        gap: 24,
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
});
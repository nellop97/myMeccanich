// src/components/SkeletonLoader.tsx
import { View } from 'react-native';
import { Skeleton } from 'react-native-paper';

export const VehicleCardSkeleton = () => (
    <View style={styles.vehicleCard}>
        <Skeleton.Text style={{ width: '60%', marginBottom: 8 }} />
        <Skeleton.Text style={{ width: '40%', marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', gap: 24 }}>
            <Skeleton.Text style={{ width: '40%' }} />
            <Skeleton.Text style={{ width: '40%' }} />
        </View>
    </View>
);
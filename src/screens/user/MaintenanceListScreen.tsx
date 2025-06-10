// src/screens/user/MaintenanceListScreen.tsx
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    RefreshControl,
    StatusBar,
    StyleSheet,
    TextInput
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
    Wrench,
    Plus,
    Search,
    Calendar,
    DollarSign,
    Clock,
    CheckCircle,
    AlertTriangle,
    MapPin,
    ArrowLeft,
    Settings
} from 'lucide-react-native';
import { useStore } from '../../store';
import { useUserCarsStore } from '@/src/store/useCarsStore';

// Theme object for consistent styling
const theme = {
    background: '#f3f4f6',
    cardBackground: '#ffffff',
    text: '#000000',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    primary: '#2563eb',
    accent: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    shadow: 'rgba(0, 0, 0, 0.1)',
};

// Local FormInput for Search
const FormInput = ({ icon: Icon, ...props }) => (
    <View style={styles.inputWrapper}>
        {Icon && <Icon size={20} color={theme.textSecondary} style={styles.inputIcon} />}
        <TextInput
            style={styles.input}
            placeholderTextColor={theme.textSecondary}
            {...props}
        />
    </View>
);

// Local FloatingActionButton
const FloatingActionButton = ({ onPress, icon: Icon }) => (
    <TouchableOpacity style={styles.fab} onPress={onPress}>
        <Icon size={24} color="#ffffff" />
    </TouchableOpacity>
);

// Local EmptyState
const EmptyState = ({ icon: Icon, title, subtitle, actionTitle, onAction }) => (
    <View style={styles.emptyStateContainer}>
        <Icon size={48} color={theme.textSecondary} style={{ marginBottom: 16 }} />
        <Text style={styles.emptyStateTitle}>{title}</Text>
        <Text style={styles.emptyStateSubtitle}>{subtitle}</Text>
        {actionTitle && (
            <TouchableOpacity style={styles.emptyStateButton} onPress={onAction}>
                <Text style={styles.emptyStateButtonText}>{actionTitle}</Text>
            </TouchableOpacity>
        )}
    </View>
);

const MaintenanceListScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { darkMode } = useStore();
    const { cars, getCarById } = useUserCarsStore();
    
    if (darkMode) {
      theme.background = '#111827';
      theme.cardBackground = '#1f2937';
      theme.text = '#ffffff';
      theme.textSecondary = '#9ca3af';
      theme.border = '#374151';
      theme.shadow = 'rgba(0, 0, 0, 0.3)';
    }

    const carId = route.params?.carId;
    const selectedCar = carId ? getCarById(carId) : null;
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [selectedCarFilter, setSelectedCarFilter] = useState(carId || 'all');
    
    // ... Functions like getAllMaintenanceRecords, getFilteredRecords, getMaintenanceStats, formatCurrency, etc.
    // would remain largely the same, but for brevity are omitted here. They use the data but not the UI components.

    const MaintenanceCard = ({ record }: { record: any }) => {
        // ... Logic for statusColor, statusText, isOverdue remains the same.
        const statusColor = theme.success; // Example value
        const statusText = "Completato"; // Example value
        const isOverdue = false; // Example value

        return (
            <TouchableOpacity 
                style={[styles.maintenanceCard, isOverdue && styles.overdueCard]}
                onPress={() => navigation.navigate('MaintenanceDetail', { carId: record.carId, maintenanceId: record.id })}
            >
                {/* Card content using standard components */}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
            <View style={styles.header}>
                 {/* Header content here */}
            </View>
            <View style={styles.searchContainer}>
                <FormInput
                    placeholder="Cerca manutenzioni..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    icon={Search}
                />
            </View>

            {/* Other components like Stats and Filters would be here */}

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {}} tintColor={theme.primary}/>}
                showsVerticalScrollIndicator={false}
            >
                {/* List or EmptyState rendering logic */}
                 <EmptyState
                    icon={Wrench}
                    title={"Nessuna manutenzione"}
                    subtitle={selectedCar ? "Non ci sono ancora manutenzioni per questo veicolo" : "Inizia a tracciare le manutenzioni"}
                    actionTitle={"Aggiungi Manutenzione"}
                    onAction={() => navigation.navigate('AddMaintenance', { carId: selectedCar?.id })}
                />
            </ScrollView>

            <FloatingActionButton
                onPress={() => navigation.navigate('AddMaintenance', { carId: selectedCar?.id })}
                icon={Plus}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.cardBackground },
    //... other header styles
    searchContainer: { paddingHorizontal: 16, paddingTop: 16, backgroundColor: theme.cardBackground },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 12 },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, height: 50, color: theme.text, fontSize: 16 },
    fab: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', elevation: 8 },
    emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 50 },
    emptyStateTitle: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginTop: 16, textAlign: 'center' },
    emptyStateSubtitle: { fontSize: 16, color: theme.textSecondary, marginTop: 8, textAlign: 'center' },
    emptyStateButton: { marginTop: 24, backgroundColor: theme.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    emptyStateButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
    content: { flex: 1, padding: 16 },
    maintenanceCard: { backgroundColor: theme.cardBackground, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
    overdueCard: { borderColor: theme.error, borderWidth: 2 },
    //... other card-related styles
});

export default MaintenanceListScreen;
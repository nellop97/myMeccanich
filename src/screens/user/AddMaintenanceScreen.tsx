// src/screens/user/AddMaintenanceScreen.tsx
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Alert,
    Switch,
    TextInput
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Controller, useForm } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    ArrowLeft,
    Calendar,
    DollarSign,
    FileText,
    MapPin,
    Save,
    Clock,
} from 'lucide-react-native';

import { useStore } from '../../store';
import { useUserCarsStore } from '@/src/store/useCarsStore';

// Theme object inspired by HomeScreen.tsx for consistent styling
const theme = {
    background: '#f3f4f6',
    cardBackground: '#ffffff',
    text: '#000000',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    primary: '#2563eb',
    error: '#ef4444',
    shadow: 'rgba(0, 0, 0, 0.1)',
};

// Local FormInput component to replace the one from GlobalComponents
const FormInput = ({ label, icon: Icon, error, required, ...props }) => (
    <View style={styles.inputContainer}>
        {label && (
            <Text style={styles.inputLabel}>
                {label} {required && <Text style={{ color: theme.error }}>*</Text>}
            </Text>
        )}
        <View style={[styles.inputWrapper, error && styles.inputWrapperError]}>
            {Icon && <Icon size={20} color={theme.textSecondary} style={styles.inputIcon} />}
            <TextInput
                style={styles.input}
                placeholderTextColor={theme.textSecondary}
                {...props}
            />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
);

interface MaintenanceFormData {
    carId: string;
    category: string;
    description: string;
    date: string;
    cost: string;
    mileage: string;
    workshop: string;
    notes: string;
    nextDueDate: string;
    nextDueMileage: string;
    reminder: boolean;
    reminderDays: string;
}

const MAINTENANCE_CATEGORIES = [
    { id: 'engine', name: 'Motore', icon: '🔧' },
    { id: 'oil', name: 'Cambio Olio', icon: '🛢️' },
    { id: 'brakes', name: 'Freni', icon: '🛑' },
    { id: 'tires', name: 'Pneumatici', icon: '🛞' },
    { id: 'filters', name: 'Filtri', icon: '🔧' },
    { id: 'battery', name: 'Batteria', icon: '🔋' },
    { id: 'electrical', name: 'Impianto Elettrico', icon: '⚡' },
    { id: 'cooling', name: 'Raffreddamento', icon: '❄️' },
    { id: 'transmission', name: 'Trasmissione', icon: '⚙️' },
    { id: 'inspection', name: 'Revisione', icon: '📋' },
    { id: 'bodywork', name: 'Carrozzeria', icon: '🚗' },
    { id: 'other', name: 'Altro', icon: '🔧' }
];

const AddMaintenanceScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { darkMode } = useStore(); // Assuming darkMode is still managed by a store
    const { cars, getCarById, addMaintenanceRecord } = useUserCarsStore();

    // Adjust theme for dark mode if needed
    if (darkMode) {
        theme.background = '#111827';
        theme.cardBackground = '#1f2937';
        theme.text = '#ffffff';
        theme.textSecondary = '#9ca3af';
        theme.border = '#374151';
        theme.shadow = 'rgba(0, 0, 0, 0.3)';
    }

    const preselectedCarId = route.params?.carId;
    const preselectedCategory = route.params?.category;

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showNextDuePicker, setShowNextDuePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedNextDueDate, setSelectedNextDueDate] = useState(new Date());

    const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<MaintenanceFormData>({
        defaultValues: {
            carId: preselectedCarId || (cars.length === 1 ? cars[0].id : ''),
            category: preselectedCategory || '',
            description: '',
            date: new Date().toISOString().split('T')[0],
            cost: '',
            mileage: '',
            workshop: '',
            notes: '',
            nextDueDate: '',
            nextDueMileage: '',
            reminder: true,
            reminderDays: '7'
        }
    });

    const selectedCarId = watch('carId');
    const selectedCategory = watch('category');
    const reminder = watch('reminder');

    const selectedCar = selectedCarId ? getCarById(selectedCarId) : null;

    const onSubmit = (data: MaintenanceFormData) => {
        if (!data.carId) {
            Alert.alert('Errore', 'Seleziona un veicolo');
            return;
        }
        if (!data.category) {
            Alert.alert('Errore', 'Seleziona una categoria');
            return;
        }
        if (!data.description.trim()) {
            Alert.alert('Errore', 'Inserisci una descrizione');
            return;
        }

        try {
            const maintenanceData = {
                category: data.category,
                description: data.description.trim(),
                date: data.date,
                cost: parseFloat(data.cost) || 0,
                mileage: parseInt(data.mileage) || selectedCar?.currentMileage || 0,
                workshop: data.workshop.trim() || undefined,
                notes: data.notes.trim() || undefined,
                nextDueDate: data.nextDueDate || undefined,
                nextDueMileage: parseInt(data.nextDueMileage) || undefined,
                reminder: data.reminder,
                reminderDays: parseInt(data.reminderDays) || 7,
                status: 'completed' as const
            };
            addMaintenanceRecord(data.carId, maintenanceData);
            Alert.alert('Successo', 'Manutenzione aggiunta con successo!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (error) {
            Alert.alert('Errore', 'Si è verificato un errore durante il salvataggio');
        }
    };

    const handleDateChange = (event: any, date?: Date) => {
        setShowDatePicker(false);
        if (date) {
            setSelectedDate(date);
            setValue('date', date.toISOString().split('T')[0]);
        }
    };

    const handleNextDueDateChange = (event: any, date?: Date) => {
        setShowNextDuePicker(false);
        if (date) {
            setSelectedNextDueDate(date);
            setValue('nextDueDate', date.toISOString().split('T')[0]);
        }
    };

    // Components are now defined within the file or are standard RN components
    const CategorySelector = () => (
        <View style={styles.categoryContainer}>
            <Text style={styles.sectionTitle}>Categoria Manutenzione</Text>
            <View style={styles.categoryGrid}>
                {MAINTENANCE_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
                        onPress={() => setValue('category', cat.id)}
                    >
                        <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                        <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>{cat.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const CarSelector = () => {
        if (preselectedCarId) return null;
        return (
            <View style={styles.carSelectorContainer}>
                <Text style={styles.sectionTitle}>Seleziona Veicolo</Text>
                <View style={styles.carsGrid}>
                    {cars.filter(car => car.isActive).map((car) => (
                        <TouchableOpacity
                            key={car.id}
                            style={[styles.carChip, selectedCarId === car.id && styles.carChipActive]}
                            onPress={() => setValue('carId', car.id)}
                        >
                            <Text style={[styles.carChipText, selectedCarId === car.id && styles.carChipTextActive]}>{car.make} {car.model}</Text>
                            <Text style={[styles.carChipPlate, selectedCarId === car.id && styles.carChipPlateActive]}>{car.licensePlate}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };
    
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={styles.headerTitle}>Nuova Manutenzione</Text>
                    <Text style={styles.headerSubtitle}>{selectedCar ? `${selectedCar.make} ${selectedCar.model}` : 'Registra un intervento'}</Text>
                </View>
            </View>

            <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <CarSelector />
                    <CategorySelector />

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Informazioni Base</Text>
                        <Controller
                            control={control}
                            name="description"
                            rules={{ required: 'Descrizione obbligatoria' }}
                            render={({ field: { onChange, value } }) => (
                                <FormInput
                                    label="Descrizione Intervento"
                                    placeholder="Es: Cambio olio motore e filtri"
                                    value={value}
                                    onChangeText={onChange}
                                    error={errors.description?.message}
                                    required
                                    icon={FileText}
                                />
                            )}
                        />
                        <View style={styles.row}>
                            <View style={styles.halfWidth}>
                                <Text style={styles.inputLabel}>Data Intervento *</Text>
                                <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                                    <Calendar size={20} color={theme.primary} />
                                    <Text style={styles.dateButtonText}>{new Date(watch('date')).toLocaleDateString('it-IT')}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.halfWidth}>
                                <Controller
                                    control={control}
                                    name="cost"
                                    render={({ field: { onChange, value } }) => (
                                        <FormInput label="Costo" placeholder="0.00" value={value} onChangeText={onChange} keyboardType="decimal-pad" icon={DollarSign} />
                                    )}
                                />
                            </View>
                        </View>
                        <View style={styles.row}>
                            <View style={styles.halfWidth}>
                                <Controller
                                    control={control}
                                    name="mileage"
                                    render={({ field: { onChange, value } }) => (
                                        <FormInput label="Chilometraggio" placeholder={selectedCar?.currentMileage?.toString() || "0"} value={value} onChangeText={onChange} keyboardType="numeric" />
                                    )}
                                />
                            </View>
                            <View style={styles.halfWidth}>
                                <Controller
                                    control={control}
                                    name="workshop"
                                    render={({ field: { onChange, value } }) => (
                                        <FormInput label="Officina" placeholder="Nome officina" value={value} onChangeText={onChange} icon={MapPin} />
                                    )}
                                />
                            </View>
                        </View>
                        <Controller
                            control={control}
                            name="notes"
                            render={({ field: { onChange, value } }) => (
                                <FormInput label="Note" placeholder="Note aggiuntive sull'intervento..." value={value} onChangeText={onChange} multiline />
                            )}
                        />
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Prossimo Intervento</Text>
                        <View style={styles.row}>
                            <View style={styles.halfWidth}>
                                <Text style={styles.inputLabel}>Data Scadenza</Text>
                                <TouchableOpacity style={styles.dateButton} onPress={() => setShowNextDuePicker(true)}>
                                    <Calendar size={20} color={theme.textSecondary} />
                                    <Text style={styles.dateButtonText}>{watch('nextDueDate') ? new Date(watch('nextDueDate')).toLocaleDateString('it-IT') : 'Seleziona data'}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.halfWidth}>
                                <Controller
                                    control={control}
                                    name="nextDueMileage"
                                    render={({ field: { onChange, value } }) => (
                                        <FormInput label="Chilometraggio Scadenza" placeholder="Es: 15000" value={value} onChangeText={onChange} keyboardType="numeric" />
                                    )}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Promemoria</Text>
                        <View style={styles.switchRow}>
                            <View style={styles.switchInfo}>
                                <Text style={styles.switchLabel}>Attiva Promemoria</Text>
                                <Text style={styles.switchDescription}>Ricevi notifiche prima della scadenza</Text>
                            </View>
                            <Controller
                                control={control}
                                name="reminder"
                                render={({ field: { onChange, value } }) => (
                                    <Switch value={value} onValueChange={onChange} trackColor={{ false: theme.border, true: theme.primary + '40' }} thumbColor={value ? theme.primary : '#f4f3f4'} />
                                )}
                            />
                        </View>
                        {reminder && (
                            <Controller
                                control={control}
                                name="reminderDays"
                                render={({ field: { onChange, value } }) => (
                                    <FormInput label="Giorni di Anticipo" placeholder="7" value={value} onChangeText={onChange} keyboardType="numeric" icon={Clock} />
                                )}
                            />
                        )}
                    </View>

                    <View style={styles.actionsContainer}>
                        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
                            <Text style={styles.secondaryButtonText}>Annulla</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit(onSubmit)}>
                             <Save size={18} color="#ffffff" />
                            <Text style={styles.primaryButtonText}>Salva Manutenzione</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {showDatePicker && <DateTimePicker value={selectedDate} mode="date" display="default" onChange={handleDateChange} maximumDate={new Date()} />}
            {showNextDuePicker && <DateTimePicker value={selectedNextDueDate} mode="date" display="default" onChange={handleNextDueDateChange} minimumDate={new Date()} />}
        </SafeAreaView>
    );
};

// Styles are now self-contained, using the local theme object
const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.cardBackground },
    backButton: { marginRight: 12 },
    headerTitles: { flex: 1 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: theme.text },
    headerSubtitle: { fontSize: 14, color: theme.textSecondary, marginTop: 2 },
    content: { flex: 1 },
    scrollContainer: { flex: 1, padding: 16 },
    sectionCard: { backgroundColor: theme.cardBackground, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border, shadowColor: theme.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16 },
    categoryContainer: { marginBottom: 16 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.cardBackground, marginBottom: 8 },
    categoryChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
    categoryEmoji: { fontSize: 16, marginRight: 6 },
    categoryText: { fontSize: 14, fontWeight: '500', color: theme.text },
    categoryTextActive: { color: '#ffffff' },
    carSelectorContainer: { marginBottom: 16 },
    carsGrid: { gap: 8 },
    carChip: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.cardBackground },
    carChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
    carChipText: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 2 },
    carChipTextActive: { color: '#ffffff' },
    carChipPlate: { fontSize: 14, color: theme.textSecondary },
    carChipPlateActive: { color: '#ffffff' },
    row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    halfWidth: { flex: 1 },
    inputContainer: { width: '100%', marginBottom: 8 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 12 },
    inputWrapperError: { borderColor: theme.error },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, height: 50, color: theme.text, fontSize: 16 },
    errorText: { color: theme.error, marginTop: 4, fontSize: 12 },
    dateButton: { flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: 16, borderWidth: 1, borderColor: theme.border, borderRadius: 12, backgroundColor: theme.background },
    dateButtonText: { fontSize: 16, color: theme.text, marginLeft: 8 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    switchInfo: { flex: 1, marginRight: 16 },
    switchLabel: { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 2 },
    switchDescription: { fontSize: 14, color: theme.textSecondary },
    actionsContainer: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 32 },
    primaryButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 12, shadowColor: theme.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
    primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    secondaryButton: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.cardBackground, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.border },
    secondaryButtonText: { color: theme.text, fontSize: 16, fontWeight: 'bold' }
});

export default AddMaintenanceScreen;
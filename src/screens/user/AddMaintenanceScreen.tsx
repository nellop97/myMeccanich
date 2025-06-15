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
    TextInput,
    Animated,
    Dimensions
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
    CheckCircle,
    AlertTriangle,
    Car,
    Wrench,
    Settings,
    Zap,
    Shield,
    Filter,
    Battery,
    Thermometer,
    Gauge
} from 'lucide-react-native';

import { useStore } from '../../store';
import { useUserCarsStore } from '@/src/store/useCarsStore';

const { width: screenWidth } = Dimensions.get('window');

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
    { id: 'oil', name: 'Cambio Olio', icon: 'droplet', color: '#FF9500', description: 'Olio motore e filtri' },
    { id: 'brakes', name: 'Freni', icon: 'disc', color: '#FF3B30', description: 'Pastiglie e dischi' },
    { id: 'tires', name: 'Pneumatici', icon: 'circle', color: '#34C759', description: 'Gomme e cerchi' },
    { id: 'engine', name: 'Motore', icon: 'cpu', color: '#007AFF', description: 'Controlli motore' },
    { id: 'electrical', name: 'Elettrico', icon: 'zap', color: '#5856D6', description: 'Impianto elettrico' },
    { id: 'battery', name: 'Batteria', icon: 'battery', color: '#FF9500', description: 'Batteria auto' },
    { id: 'cooling', name: 'Raffreddamento', icon: 'thermometer', color: '#5AC8FA', description: 'Sistema raffreddamento' },
    { id: 'transmission', name: 'Trasmissione', icon: 'settings', color: '#8E8E93', description: 'Cambio e frizione' },
    { id: 'inspection', name: 'Revisione', icon: 'shield', color: '#34C759', description: 'Controllo periodico' },
    { id: 'other', name: 'Altro', icon: 'wrench', color: '#8E8E93', description: 'Altro intervento' }
];

const AddMaintenanceScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { darkMode } = useStore();
    const { cars, getCarById, addMaintenance, addReminder, updateMileage } = useUserCarsStore();

    const fallbackTheme = {
        background: darkMode ? '#121212' : '#f5f5f5',
        cardBackground: darkMode ? '#1e1e1e' : '#ffffff',
        text: darkMode ? '#ffffff' : '#000000',
        textSecondary: darkMode ? '#a0a0a0' : '#666666',
        border: darkMode ? '#333333' : '#e0e0e0',
        primary: '#007AFF',
        error: '#FF3B30',
        success: '#34C759',
        warning: '#FF9500',
        info: '#5AC8FA',
        placeholder: darkMode ? '#666666' : '#999999'
    };

    const preselectedCarId = route.params?.carId;
    const preselectedCategory = route.params?.category;

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showNextDuePicker, setShowNextDuePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedNextDueDate, setSelectedNextDueDate] = useState(new Date());
    const [currentStep, setCurrentStep] = useState(0);

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

    const getMaintenanceType = (category: string) => {
        switch (category) {
            case 'oil':
            case 'filters':
                return 'routine';
            case 'inspection':
                return 'inspection';
            case 'engine':
            case 'brakes':
            case 'transmission':
            case 'electrical':
            case 'cooling':
            case 'battery':
            case 'tires':
                return 'repair';
            default:
                return 'other';
        }
    };

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
                description: data.description.trim(),
                date: data.date,
                mileage: parseInt(data.mileage) || selectedCar?.currentMileage || 0,
                cost: parseFloat(data.cost) || 0,
                type: getMaintenanceType(data.category),
                notes: data.notes.trim() || undefined,
                nextDueDate: data.nextDueDate || undefined,
                nextDueMileage: parseInt(data.nextDueMileage) || undefined,
                workshopName: data.workshop.trim() || undefined,
                status: 'completed' as const
            };

            const maintenanceId = addMaintenance(data.carId, maintenanceData);

            if (data.mileage && parseInt(data.mileage) > 0) {
                updateMileage(data.carId, parseInt(data.mileage));
            }

            if (data.reminder && (data.nextDueDate || data.nextDueMileage)) {
                const reminderData = {
                    title: `Prossima manutenzione: ${data.description}`,
                    description: `Prossimo intervento programmato per ${selectedCar?.make} ${selectedCar?.model}`,
                    type: 'maintenance' as const,
                    dueDate: data.nextDueDate || undefined,
                    dueMileage: parseInt(data.nextDueMileage) || undefined,
                    isActive: true
                };

                addReminder(data.carId, reminderData);
            }

            Alert.alert(
                'Successo', 
                'Manutenzione aggiunta con successo!', 
                [{ 
                    text: 'OK', 
                    onPress: () => navigation.goBack() 
                }]
            );
        } catch (error) {
            console.error('Errore durante il salvataggio:', error);
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

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Seleziona data';
        return new Date(dateString).toLocaleDateString('it-IT');
    };

    // Modern Input Component
    const ModernInput = ({ 
        label, 
        placeholder, 
        value, 
        onChangeText, 
        error, 
        required = false, 
        keyboardType = 'default',
        multiline = false,
        icon: Icon
    }: any) => (
        <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: fallbackTheme.text }]}>
                {label} {required && <Text style={{ color: fallbackTheme.error }}>*</Text>}
            </Text>
            <View style={[
                styles.inputWrapper, 
                { 
                    backgroundColor: fallbackTheme.cardBackground, 
                    borderColor: error ? fallbackTheme.error : fallbackTheme.border 
                },
                multiline && styles.textAreaWrapper
            ]}>
                {Icon && (
                    <View style={styles.inputIconContainer}>
                        <Icon size={20} color={fallbackTheme.textSecondary} />
                    </View>
                )}
                <TextInput
                    style={[
                        styles.input, 
                        { color: fallbackTheme.text },
                        multiline && styles.textAreaInput
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor={fallbackTheme.placeholder}
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    multiline={multiline}
                    numberOfLines={multiline ? 4 : 1}
                    textAlignVertical={multiline ? 'top' : 'center'}
                />
            </View>
            {error && (
                <Text style={[styles.errorText, { color: fallbackTheme.error }]}>
                    {error}
                </Text>
            )}
        </View>
    );

    // Category Selector Component
    const CategorySelector = () => (
        <View style={[styles.card, { backgroundColor: fallbackTheme.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: fallbackTheme.text }]}>
                Tipo di Manutenzione
            </Text>
            <View style={styles.categoryGrid}>
                {MAINTENANCE_CATEGORIES.map((category) => {
                    const isSelected = selectedCategory === category.id;
                    
                    return (
                        <TouchableOpacity
                            key={category.id}
                            style={[
                                styles.categoryCard,
                                { 
                                    backgroundColor: isSelected ? category.color + '20' : fallbackTheme.background,
                                    borderColor: isSelected ? category.color : fallbackTheme.border
                                }
                            ]}
                            onPress={() => setValue('category', category.id)}
                        >
                            <View style={[
                                styles.categoryIcon,
                                { backgroundColor: isSelected ? category.color : fallbackTheme.border }
                            ]}>
                                {category.id === 'oil' && <Zap size={20} color={isSelected ? '#ffffff' : fallbackTheme.textSecondary} />}
                                {category.id === 'brakes' && <AlertTriangle size={20} color={isSelected ? '#ffffff' : fallbackTheme.textSecondary} />}
                                {category.id === 'tires' && <Car size={20} color={isSelected ? '#ffffff' : fallbackTheme.textSecondary} />}
                                {category.id === 'engine' && <Settings size={20} color={isSelected ? '#ffffff' : fallbackTheme.textSecondary} />}
                                {category.id === 'electrical' && <Zap size={20} color={isSelected ? '#ffffff' : fallbackTheme.textSecondary} />}
                                {category.id === 'battery' && <Battery size={20} color={isSelected ? '#ffffff' : fallbackTheme.textSecondary} />}
                                {category.id === 'cooling' && <Thermometer size={20} color={isSelected ? '#ffffff' : fallbackTheme.textSecondary} />}
                                {category.id === 'transmission' && <Settings size={20} color={isSelected ? '#ffffff' : fallbackTheme.textSecondary} />}
                                {category.id === 'inspection' && <Shield size={20} color={isSelected ? '#ffffff' : fallbackTheme.textSecondary} />}
                                {category.id === 'other' && <Wrench size={20} color={isSelected ? '#ffffff' : fallbackTheme.textSecondary} />}
                            </View>
                            <Text style={[
                                styles.categoryName,
                                { color: isSelected ? category.color : fallbackTheme.text }
                            ]}>
                                {category.name}
                            </Text>
                            <Text style={[
                                styles.categoryDescription,
                                { color: isSelected ? category.color : fallbackTheme.textSecondary }
                            ]}>
                                {category.description}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    // Car Selector Component
    const CarSelector = () => {
        if (preselectedCarId) return null;

        return (
            <View style={[styles.card, { backgroundColor: fallbackTheme.cardBackground }]}>
                <Text style={[styles.cardTitle, { color: fallbackTheme.text }]}>
                    Seleziona Veicolo
                </Text>
                <View style={styles.carGrid}>
                    {cars.filter(car => car.isActive).map((car) => (
                        <TouchableOpacity
                            key={car.id}
                            style={[
                                styles.carCard,
                                { 
                                    backgroundColor: selectedCarId === car.id ? fallbackTheme.primary + '20' : fallbackTheme.background,
                                    borderColor: selectedCarId === car.id ? fallbackTheme.primary : fallbackTheme.border
                                }
                            ]}
                            onPress={() => setValue('carId', car.id)}
                        >
                            <View style={styles.carCardHeader}>
                                <Text style={[
                                    styles.carCardTitle,
                                    { color: selectedCarId === car.id ? fallbackTheme.primary : fallbackTheme.text }
                                ]}>
                                    {car.make} {car.model}
                                </Text>
                                <Text style={[
                                    styles.carCardPlate,
                                    { color: selectedCarId === car.id ? fallbackTheme.primary : fallbackTheme.textSecondary }
                                ]}>
                                    {car.licensePlate}
                                </Text>
                            </View>
                            <Text style={[
                                styles.carCardMileage,
                                { color: fallbackTheme.textSecondary }
                            ]}>
                                {car.currentMileage.toLocaleString()} km
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: fallbackTheme.background }]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: fallbackTheme.cardBackground, borderBottomColor: fallbackTheme.border }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color={fallbackTheme.text} />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={[styles.headerTitle, { color: fallbackTheme.text }]}>
                        Nuova Manutenzione
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: fallbackTheme.textSecondary }]}>
                        {selectedCar ? `${selectedCar.make} ${selectedCar.model}` : 'Registra un intervento'}
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView 
                    style={styles.scrollContainer} 
                    showsVerticalScrollIndicator={false} 
                    keyboardShouldPersistTaps="handled"
                >
                    <CarSelector />
                    <CategorySelector />

                    {/* Basic Information */}
                    <View style={[styles.card, { backgroundColor: fallbackTheme.cardBackground }]}>
                        <Text style={[styles.cardTitle, { color: fallbackTheme.text }]}>
                            Dettagli Intervento
                        </Text>

                        <Controller
                            control={control}
                            name="description"
                            rules={{ required: 'Descrizione obbligatoria' }}
                            render={({ field: { onChange, value } }) => (
                                <ModernInput
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
                                <Text style={[styles.inputLabel, { color: fallbackTheme.text }]}>
                                    Data Intervento <Text style={{ color: fallbackTheme.error }}>*</Text>
                                </Text>
                                <TouchableOpacity
                                    style={[styles.dateButton, { backgroundColor: fallbackTheme.cardBackground, borderColor: fallbackTheme.border }]}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Calendar size={20} color={fallbackTheme.primary} />
                                    <Text style={[styles.dateButtonText, { color: fallbackTheme.text }]}>
                                        {formatDate(watch('date'))}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.halfWidth}>
                                <Controller
                                    control={control}
                                    name="cost"
                                    render={({ field: { onChange, value } }) => (
                                        <ModernInput 
                                            label="Costo (€)" 
                                            placeholder="0.00" 
                                            value={value} 
                                            onChangeText={onChange} 
                                            keyboardType="decimal-pad" 
                                            icon={DollarSign} 
                                        />
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
                                        <ModernInput 
                                            label="Chilometraggio" 
                                            placeholder={selectedCar?.currentMileage?.toString() || "0"} 
                                            value={value} 
                                            onChangeText={onChange} 
                                            keyboardType="numeric"
                                            icon={Gauge}
                                        />
                                    )}
                                />
                            </View>

                            <View style={styles.halfWidth}>
                                <Controller
                                    control={control}
                                    name="workshop"
                                    render={({ field: { onChange, value } }) => (
                                        <ModernInput 
                                            label="Officina" 
                                            placeholder="Nome officina" 
                                            value={value} 
                                            onChangeText={onChange} 
                                            icon={MapPin} 
                                        />
                                    )}
                                />
                            </View>
                        </View>

                        <Controller
                            control={control}
                            name="notes"
                            render={({ field: { onChange, value } }) => (
                                <ModernInput 
                                    label="Note" 
                                    placeholder="Note aggiuntive sull'intervento..." 
                                    value={value} 
                                    onChangeText={onChange} 
                                    multiline 
                                />
                            )}
                        />
                    </View>

                    {/* Next Maintenance */}
                    <View style={[styles.card, { backgroundColor: fallbackTheme.cardBackground }]}>
                        <Text style={[styles.cardTitle, { color: fallbackTheme.text }]}>
                            Prossimo Intervento
                        </Text>

                        <View style={styles.row}>
                            <View style={styles.halfWidth}>
                                <Text style={[styles.inputLabel, { color: fallbackTheme.text }]}>
                                    Data Scadenza
                                </Text>
                                <TouchableOpacity
                                    style={[styles.dateButton, { backgroundColor: fallbackTheme.cardBackground, borderColor: fallbackTheme.border }]}
                                    onPress={() => setShowNextDuePicker(true)}
                                >
                                    <Calendar size={20} color={fallbackTheme.textSecondary} />
                                    <Text style={[styles.dateButtonText, { color: fallbackTheme.text }]}>
                                        {formatDate(watch('nextDueDate'))}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.halfWidth}>
                                <Controller
                                    control={control}
                                    name="nextDueMileage"
                                    render={({ field: { onChange, value } }) => (
                                        <ModernInput 
                                            label="Chilometraggio Scadenza" 
                                            placeholder="Es: 15000" 
                                            value={value} 
                                            onChangeText={onChange} 
                                            keyboardType="numeric"
                                            icon={Gauge}
                                        />
                                    )}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Reminder Settings */}
                    <View style={[styles.card, { backgroundColor: fallbackTheme.cardBackground }]}>
                        <Text style={[styles.cardTitle, { color: fallbackTheme.text }]}>
                            Promemoria
                        </Text>

                        <View style={styles.switchRow}>
                            <View style={styles.switchInfo}>
                                <Text style={[styles.switchLabel, { color: fallbackTheme.text }]}>
                                    Attiva Promemoria
                                </Text>
                                <Text style={[styles.switchDescription, { color: fallbackTheme.textSecondary }]}>
                                    Ricevi notifiche prima della scadenza
                                </Text>
                            </View>
                            <Controller
                                control={control}
                                name="reminder"
                                render={({ field: { onChange, value } }) => (
                                    <Switch 
                                        value={value} 
                                        onValueChange={onChange} 
                                        trackColor={{ false: fallbackTheme.border, true: fallbackTheme.primary + '40' }} 
                                        thumbColor={value ? fallbackTheme.primary : '#f4f3f4'} 
                                    />
                                )}
                            />
                        </View>

                        {reminder && (
                            <Controller
                                control={control}
                                name="reminderDays"
                                render={({ field: { onChange, value } }) => (
                                    <ModernInput 
                                        label="Giorni di Anticipo" 
                                        placeholder="7" 
                                        value={value} 
                                        onChangeText={onChange} 
                                        keyboardType="numeric" 
                                        icon={Clock} 
                                    />
                                )}
                            />
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity 
                            style={[styles.secondaryButton, { backgroundColor: fallbackTheme.border }]}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={[styles.secondaryButtonText, { color: fallbackTheme.textSecondary }]}>
                                Annulla
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.primaryButton, { backgroundColor: fallbackTheme.primary }]}
                            onPress={handleSubmit(onSubmit)}
                        >
                            <Save size={20} color="#ffffff" />
                            <Text style={styles.primaryButtonText}>Salva Manutenzione</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Date Pickers */}
            {showDatePicker && (
                <DateTimePicker 
                    value={selectedDate} 
                    mode="date" 
                    display="default" 
                    onChange={handleDateChange} 
                    maximumDate={new Date()} 
                />
            )}
            {showNextDuePicker && (
                <DateTimePicker 
                    value={selectedNextDueDate} 
                    mode="date" 
                    display="default" 
                    onChange={handleNextDueDateChange} 
                    minimumDate={new Date()} 
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        marginRight: 12,
    },
    headerTitles: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    content: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
        padding: 16,
    },
    
    // Card Styles
    card: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    
    // Category Grid
    categoryGrid: {
        gap: 12,
    },
    categoryCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'center',
    },
    categoryDescription: {
        fontSize: 12,
        textAlign: 'center',
    },
    
    // Car Grid
    carGrid: {
        gap: 12,
    },
    carCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
    },
    carCardHeader: {
        marginBottom: 8,
    },
    carCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    carCardPlate: {
        fontSize: 14,
        fontWeight: '600',
    },
    carCardMileage: {
        fontSize: 12,
    },
    
    // Input Styles
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    textAreaWrapper: {
        alignItems: 'flex-start',
        paddingVertical: 16,
    },
    inputIconContainer: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        minHeight: 20,
    },
    textAreaInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
    },
    
    // Layout
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfWidth: {
        flex: 1,
    },
    
    // Date Button
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderRadius: 12,
        gap: 12,
    },
    dateButtonText: {
        fontSize: 16,
    },
    
    // Switch Row
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    switchInfo: {
        flex: 1,
        marginRight: 16,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    switchDescription: {
        fontSize: 14,
    },
    
    // Action Buttons
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
        marginBottom: 32,
    },
    primaryButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AddMaintenanceScreen;
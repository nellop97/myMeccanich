// src/screens/user/AddMaintenanceScreen.tsx - COMPONENTE COMPLETO
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
    Dimensions,
    Modal
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
    Gauge,
    ChevronDown,
    X
} from 'lucide-react-native';

import { useStore } from '../../store';
import { useCarsStore } from '../../store/useCarsStore';

const { width: screenWidth } = Dimensions.get('window');

// ====================================
// INTERFACES
// ====================================

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

interface RouteParams {
    carId?: string;
    category?: string;
}

// ====================================
// CONSTANTS
// ====================================

const MAINTENANCE_CATEGORIES = [
    { 
        id: 'oil', 
        name: 'Cambio Olio', 
        icon: 'droplet', 
        color: '#FF9500', 
        description: 'Olio motore e filtri',
        IconComponent: Filter
    },
    { 
        id: 'brakes', 
        name: 'Freni', 
        icon: 'disc', 
        color: '#FF3B30', 
        description: 'Pastiglie e dischi',
        IconComponent: AlertTriangle
    },
    { 
        id: 'tires', 
        name: 'Pneumatici', 
        icon: 'circle', 
        color: '#34C759', 
        description: 'Gomme e cerchi',
        IconComponent: Car
    },
    { 
        id: 'engine', 
        name: 'Motore', 
        icon: 'cpu', 
        color: '#007AFF', 
        description: 'Controlli motore',
        IconComponent: Settings
    },
    { 
        id: 'electrical', 
        name: 'Elettrico', 
        icon: 'zap', 
        color: '#5856D6', 
        description: 'Impianto elettrico',
        IconComponent: Zap
    },
    { 
        id: 'battery', 
        name: 'Batteria', 
        icon: 'battery', 
        color: '#FF9500', 
        description: 'Batteria auto',
        IconComponent: Battery
    },
    { 
        id: 'cooling', 
        name: 'Raffreddamento', 
        icon: 'thermometer', 
        color: '#5AC8FA', 
        description: 'Sistema raffreddamento',
        IconComponent: Thermometer
    },
    { 
        id: 'transmission', 
        name: 'Trasmissione', 
        icon: 'settings', 
        color: '#8E8E93', 
        description: 'Cambio e frizione',
        IconComponent: Settings
    },
    { 
        id: 'inspection', 
        name: 'Revisione', 
        icon: 'shield', 
        color: '#34C759', 
        description: 'Controllo periodico',
        IconComponent: Shield
    },
    { 
        id: 'other', 
        name: 'Altro', 
        icon: 'wrench', 
        color: '#8E8E93', 
        description: 'Altro intervento',
        IconComponent: Wrench
    }
];

// ====================================
// CUSTOM COMPONENTS
// ====================================

interface ModernInputProps {
    label: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
    multiline?: boolean;
    numberOfLines?: number;
    icon?: any;
    error?: string;
}

const ModernInput: React.FC<ModernInputProps> = ({
    label,
    placeholder,
    value,
    onChangeText,
    keyboardType = 'default',
    multiline = false,
    numberOfLines = 1,
    icon: IconComponent,
    error
}) => {
    const { darkMode } = useStore();
    const theme = {
        cardBackground: darkMode ? '#1e1e1e' : '#ffffff',
        text: darkMode ? '#ffffff' : '#000000',
        textSecondary: darkMode ? '#a0a0a0' : '#666666',
        border: darkMode ? '#333333' : '#e0e0e0',
        primary: '#007AFF',
        error: '#FF3B30'
    };

    return (
        <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
            <View style={[
                styles.inputWrapper,
                { 
                    backgroundColor: theme.cardBackground,
                    borderColor: error ? theme.error : theme.border
                }
            ]}>
                {IconComponent && (
                    <IconComponent size={20} color={theme.textSecondary} style={styles.inputIcon} />
                )}
                <TextInput
                    style={[
                        styles.textInput,
                        { 
                            color: theme.text,
                            flex: 1,
                            textAlignVertical: multiline ? 'top' : 'center'
                        }
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor={theme.textSecondary}
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                />
            </View>
            {error && (
                <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
            )}
        </View>
    );
};

// ====================================
// MAIN COMPONENT
// ====================================

const AddMaintenanceScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { darkMode } = useStore();
    
    const { 
        vehicles: cars,
        getCarById, 
        addMaintenance,
        addReminder,
        updateMileage
    } = useCarsStore();

    // Route params
    const { carId: preselectedCarId, category: preselectedCategory } = route.params as RouteParams || {};

    // Theme
    const theme = {
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

    // State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showNextDuePicker, setShowNextDuePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedNextDueDate, setSelectedNextDueDate] = useState(new Date());
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form
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
    const selectedCategoryData = MAINTENANCE_CATEGORIES.find(cat => cat.id === selectedCategory);

    // Helper Functions
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

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Event Handlers
    const onSubmit = async (data: MaintenanceFormData) => {
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

        setIsLoading(true);

        try {
            // Prepara i dati della manutenzione
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

            // Aggiungi manutenzione
            const maintenanceId = await addMaintenance(data.carId, maintenanceData);

            // Aggiorna chilometraggio se fornito
            if (data.mileage && parseInt(data.mileage) > (selectedCar?.currentMileage || 0)) {
                await updateMileage(data.carId, parseInt(data.mileage));
            }

            // Crea promemoria se richiesto
            if (data.reminder && (data.nextDueDate || data.nextDueMileage)) {
                const reminderData = {
                    title: `Prossima manutenzione: ${data.description}`,
                    description: `Prossimo intervento programmato per ${selectedCar?.make} ${selectedCar?.model}`,
                    type: 'maintenance' as const,
                    dueDate: data.nextDueDate || undefined,
                    dueMileage: parseInt(data.nextDueMileage) || undefined,
                    isActive: true
                };

                await addReminder(data.carId, reminderData);
            }

            Alert.alert(
                'Successo', 
                'Manutenzione aggiunta con successo!',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );

        } catch (error: any) {
            console.error('Errore aggiunta manutenzione:', error);
            Alert.alert(
                'Errore',
                error.message || 'Errore durante il salvataggio della manutenzione'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setSelectedDate(selectedDate);
            setValue('date', selectedDate.toISOString().split('T')[0]);
        }
    };

    const handleNextDueDateChange = (event: any, selectedDate?: Date) => {
        setShowNextDuePicker(false);
        if (selectedDate) {
            setSelectedNextDueDate(selectedDate);
            setValue('nextDueDate', selectedDate.toISOString().split('T')[0]);
        }
    };

    // Render
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
            
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                {/* Header */}
                <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <ArrowLeft size={24} color={theme.text} />
                    </TouchableOpacity>
                    
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        Aggiungi Manutenzione
                    </Text>
                    
                    <TouchableOpacity 
                        onPress={handleSubmit(onSubmit)}
                        style={[
                            styles.saveButton, 
                            { 
                                backgroundColor: theme.primary,
                                opacity: isLoading ? 0.6 : 1
                            }
                        ]}
                        disabled={isLoading}
                    >
                        <Save size={20} color="white" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    
                    {/* Car Selection */}
                    {!preselectedCarId && cars.length > 1 && (
                        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Veicolo</Text>
                            <Controller
                                control={control}
                                name="carId"
                                rules={{ required: 'Seleziona un veicolo' }}
                                render={({ field: { onChange, value } }) => (
                                    <View>
                                        {cars.map((car) => (
                                            <TouchableOpacity
                                                key={car.id}
                                                style={[
                                                    styles.carOption,
                                                    { borderColor: theme.border },
                                                    value === car.id && { 
                                                        backgroundColor: theme.primary + '20', 
                                                        borderColor: theme.primary 
                                                    }
                                                ]}
                                                onPress={() => onChange(car.id)}
                                            >
                                                <Car size={20} color={value === car.id ? theme.primary : theme.textSecondary} />
                                                <Text style={[
                                                    styles.carOptionText,
                                                    { color: value === car.id ? theme.primary : theme.text }
                                                ]}>
                                                    {car.make} {car.model} - {car.licensePlate}
                                                </Text>
                                                {value === car.id && (
                                                    <CheckCircle size={20} color={theme.primary} />
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            />
                        </View>
                    )}

                    {/* Selected Car Info */}
                    {selectedCar && (
                        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Veicolo Selezionato</Text>
                            <View style={styles.selectedCarInfo}>
                                <Car size={24} color={theme.primary} />
                                <View style={styles.selectedCarDetails}>
                                    <Text style={[styles.selectedCarText, { color: theme.text }]}>
                                        {selectedCar.make} {selectedCar.model}
                                    </Text>
                                    <Text style={[styles.selectedCarPlate, { color: theme.textSecondary }]}>
                                        {selectedCar.licensePlate}
                                    </Text>
                                </View>
                                <View style={styles.selectedCarMileage}>
                                    <Text style={[styles.mileageValue, { color: theme.text }]}>
                                        {selectedCar.currentMileage?.toLocaleString() || '0'} km
                                    </Text>
                                    <Text style={[styles.mileageLabel, { color: theme.textSecondary }]}>
                                        Chilometraggio
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Category Selection */}
                    <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Categoria Manutenzione</Text>
                        <Controller
                            control={control}
                            name="category"
                            rules={{ required: 'Seleziona una categoria' }}
                            render={({ field: { onChange, value } }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.categorySelector,
                                        { borderColor: theme.border, backgroundColor: theme.cardBackground }
                                    ]}
                                    onPress={() => setShowCategoryModal(true)}
                                >
                                    {selectedCategoryData ? (
                                        <View style={styles.selectedCategoryContent}>
                                            <View style={[
                                                styles.categoryIcon,
                                                { backgroundColor: selectedCategoryData.color + '20' }
                                            ]}>
                                                <selectedCategoryData.IconComponent 
                                                    size={20} 
                                                    color={selectedCategoryData.color} 
                                                />
                                            </View>
                                            <View style={styles.categoryText}>
                                                <Text style={[styles.categoryName, { color: theme.text }]}>
                                                    {selectedCategoryData.name}
                                                </Text>
                                                <Text style={[styles.categoryDescription, { color: theme.textSecondary }]}>
                                                    {selectedCategoryData.description}
                                                </Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <Text style={[styles.placeholderText, { color: theme.placeholder }]}>
                                            Seleziona categoria
                                        </Text>
                                    )}
                                    <ChevronDown size={20} color={theme.textSecondary} />
                                </TouchableOpacity>
                            )}
                        />
                    </View>

                    {/* Basic Information */}
                    <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Informazioni Base</Text>
                        
                        <Controller
                            control={control}
                            name="description"
                            rules={{ required: 'Inserisci una descrizione' }}
                            render={({ field: { onChange, value } }) => (
                                <ModernInput 
                                    label="Descrizione *" 
                                    placeholder="Descrivi l'intervento eseguito" 
                                    value={value} 
                                    onChangeText={onChange} 
                                    icon={FileText}
                                    error={errors.description?.message}
                                />
                            )}
                        />

                        {/* Date Selection */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.inputLabel, { color: theme.text }]}>Data Intervento</Text>
                            <TouchableOpacity
                                style={[
                                    styles.dateSelector,
                                    { borderColor: theme.border, backgroundColor: theme.cardBackground }
                                ]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Calendar size={20} color={theme.textSecondary} />
                                <Text style={[styles.dateText, { color: theme.text }]}>
                                    {formatDate(selectedDate)}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.row}>
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
                                            keyboardType="numeric"
                                            icon={DollarSign}
                                        />
                                    )}
                                />
                            </View>

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
                        </View>

                        <Controller
                            control={control}
                            name="workshop"
                            render={({ field: { onChange, value } }) => (
                                <ModernInput 
                                    label="Officina" 
                                    placeholder="Nome officina (opzionale)" 
                                    value={value} 
                                    onChangeText={onChange} 
                                    icon={MapPin} 
                                />
                            )}
                        />

                        <Controller
                            control={control}
                            name="notes"
                            render={({ field: { onChange, value } }) => (
                                <ModernInput 
                                    label="Note" 
                                    placeholder="Note aggiuntive sull'intervento..." 
                                    value={value} 
                                    onChangeText={onChange} 
                                    multiline={true}
                                    numberOfLines={3}
                                    icon={FileText}
                                />
                            )}
                        />
                    </View>

                    {/* Next Maintenance */}
                    <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Prossima Manutenzione</Text>
                        
                        <View style={styles.row}>
                            <View style={styles.halfWidth}>
                                <View style={styles.inputContainer}>
                                    <Text style={[styles.inputLabel, { color: theme.text }]}>Prossima Data</Text>
                                    <TouchableOpacity
                                        style={[
                                            styles.dateSelector,
                                            { borderColor: theme.border, backgroundColor: theme.cardBackground }
                                        ]}
                                        onPress={() => setShowNextDuePicker(true)}
                                    >
                                        <Calendar size={20} color={theme.textSecondary} />
                                        <Text style={[styles.dateText, { color: theme.text }]}>
                                            {watch('nextDueDate') ? formatDate(selectedNextDueDate) : 'Opzionale'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.halfWidth}>
                                <Controller
                                    control={control}
                                    name="nextDueMileage"
                                    render={({ field: { onChange, value } }) => (
                                        <ModernInput 
                                            label="Prossimo Chilometraggio" 
                                            placeholder="km (opzionale)" 
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
                    <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Promemoria</Text>
                        
                        <Controller
                            control={control}
                            name="reminder"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.switchRow}>
                                    <View style={styles.switchLabel}>
                                        <Text style={[styles.switchText, { color: theme.text }]}>
                                            Crea promemoria
                                        </Text>
                                        <Text style={[styles.switchDescription, { color: theme.textSecondary }]}>
                                            Ti avviseremo quando sarà il momento della prossima manutenzione
                                        </Text>
                                    </View>
                                    <Switch
                                        value={value}
                                        onValueChange={onChange}
                                        trackColor={{ false: theme.border, true: theme.primary + '40' }}
                                        thumbColor={value ? theme.primary : theme.textSecondary}
                                    />
                                </View>
                            )}
                        />

                        {reminder && (
                            <Controller
                                control={control}
                                name="reminderDays"
                                render={({ field: { onChange, value } }) => (
                                    <ModernInput 
                                        label="Giorni di anticipo" 
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

                    {/* Bottom Spacing */}
                    <View style={styles.bottomSpacing} />
                </ScrollView>

                {/* Date Pickers */}
                {showDatePicker && (
                    <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                    />
                )}

                {showNextDuePicker && (
                    <DateTimePicker
                        value={selectedNextDueDate}
                        mode="date"
                        display="default"
                        onChange={handleNextDueDateChange}
                    />
                )}

                {/* Category Modal */}
                <Modal
                    visible={showCategoryModal}
                    animationType="slide"
                    presentationStyle="pageSheet"
                >
                    <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
                        <View style={[styles.modalHeader, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                Seleziona Categoria
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowCategoryModal(false)}
                                style={styles.closeButton}
                            >
                                <X size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalContent}>
                            {MAINTENANCE_CATEGORIES.map((category) => (
                                <TouchableOpacity
                                    key={category.id}
                                    style={[
                                        styles.categoryOption,
                                        { 
                                            backgroundColor: theme.cardBackground,
                                            borderColor: theme.border
                                        },
                                        selectedCategory === category.id && {
                                            backgroundColor: category.color + '20',
                                            borderColor: category.color
                                        }
                                    ]}
                                    onPress={() => {
                                        setValue('category', category.id);
                                        setShowCategoryModal(false);
                                    }}
                                >
                                    <View style={[
                                        styles.categoryIcon,
                                        { backgroundColor: category.color + '20' }
                                    ]}>
                                        <category.IconComponent 
                                            size={24} 
                                            color={category.color} 
                                        />
                                    </View>
                                    <View style={styles.categoryText}>
                                        <Text style={[styles.categoryName, { color: theme.text }]}>
                                            {category.name}
                                        </Text>
                                        <Text style={[styles.categoryDescription, { color: theme.textSecondary }]}>
                                            {category.description}
                                        </Text>
                                    </View>
                                    {selectedCategory === category.id && (
                                        <CheckCircle size={20} color={category.color} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </SafeAreaView>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// ====================================
// STYLES
// ====================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    flex: {
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
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 16,
    },
    saveButton: {
        padding: 8,
        borderRadius: 8,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    carOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 8,
    },
    carOptionText: {
        marginLeft: 12,
        fontSize: 16,
        flex: 1,
    },
    selectedCarInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectedCarDetails: {
        flex: 1,
        marginLeft: 12,
    },
    selectedCarText: {
        fontSize: 16,
        fontWeight: '500',
    },
    selectedCarPlate: {
        fontSize: 14,
        marginTop: 2,
    },
    selectedCarMileage: {
        alignItems: 'flex-end',
    },
    mileageValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    mileageLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    categorySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderRadius: 8,
        minHeight: 50,
    },
    selectedCategoryContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    categoryIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryText: {
        marginLeft: 12,
        flex: 1,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '500',
    },
    categoryDescription: {
        fontSize: 14,
        marginTop: 2,
    },
    placeholderText: {
        fontSize: 16,
        flex: 1,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        minHeight: 50,
    },
    inputIcon: {
        marginRight: 8,
    },
    textInput: {
        fontSize: 16,
        paddingVertical: 12,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderRadius: 8,
        minHeight: 50,
    },
    dateText: {
        marginLeft: 8,
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
        marginHorizontal: -6,
    },
    halfWidth: {
        flex: 1,
        marginHorizontal: 6,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    switchLabel: {
        flex: 1,
        marginRight: 12,
    },
    switchText: {
        fontSize: 16,
        fontWeight: '500',
    },
    switchDescription: {
        fontSize: 14,
        marginTop: 2,
    },
    bottomSpacing: {
        height: 40,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    closeButton: {
        padding: 4,
    },
    modalContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    categoryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 12,
    },
});

export default AddMaintenanceScreen;
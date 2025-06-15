// src/screens/user/AddFuelScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Switch,
    StyleSheet,
    Alert,
    Platform,
    StatusBar,
    KeyboardAvoidingView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
    ArrowLeft, 
    Calendar, 
    Save, 
    Droplets, 
    DollarSign, 
    Gauge, 
    MapPin,
    Fuel,
    Zap,
    Calculator
} from 'lucide-react-native';

import { useUserCarsStore } from '../../store/useCarsStore';
import { useStore } from '../../store';

interface FuelFormData {
    carId: string;
    date: string;
    mileage: string;
    liters: string;
    costPerLiter: string;
    totalCost: string;
    isFullTank: boolean;
    fuelType: string;
    stationName: string;
    notes: string;
}

const FUEL_TYPES = [
    { id: 'gasoline', name: 'Benzina', icon: Fuel, color: '#FF9500', description: 'Benzina senza piombo' },
    { id: 'diesel', name: 'Diesel', icon: Fuel, color: '#34C759', description: 'Gasolio per autotrazione' },
    { id: 'electric', name: 'Elettrica', icon: Zap, color: '#007AFF', description: 'Ricarica elettrica' },
    { id: 'hybrid', name: 'Ibrida', icon: Fuel, color: '#5AC8FA', description: 'Carburante + elettrico' }
];

const AddFuelScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { darkMode } = useStore();
    const { cars, addFuelRecord, getCarById } = useUserCarsStore();

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
    const selectedCar = preselectedCarId ? getCarById(preselectedCarId) : null;

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    
    const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<FuelFormData>({
        defaultValues: {
            carId: preselectedCarId || (cars.length === 1 ? cars[0].id : ''),
            date: new Date().toISOString().split('T')[0],
            mileage: selectedCar?.currentMileage.toString() || '',
            liters: '',
            costPerLiter: '',
            totalCost: '',
            isFullTank: true,
            fuelType: 'gasoline',
            stationName: '',
            notes: '',
        }
    });
    
    const liters = watch('liters');
    const costPerLiter = watch('costPerLiter');
    const totalCost = watch('totalCost');
    const selectedCarId = watch('carId');
    const selectedFuelType = watch('fuelType');

    const car = selectedCarId ? getCarById(selectedCarId) : null;

    // Auto-calculate total cost when liters and cost per liter change
    useEffect(() => {
        const lit = parseFloat(liters);
        const cpl = parseFloat(costPerLiter);
        if (!isNaN(lit) && !isNaN(cpl) && lit > 0 && cpl > 0) {
            const total = (lit * cpl).toFixed(2);
            setValue('totalCost', total);
        }
    }, [liters, costPerLiter, setValue]);

    // Auto-calculate liters when total cost and cost per liter change
    useEffect(() => {
        const total = parseFloat(totalCost);
        const cpl = parseFloat(costPerLiter);
        if (!isNaN(total) && !isNaN(cpl) && total > 0 && cpl > 0) {
            const lit = (total / cpl).toFixed(2);
            if (parseFloat(lit) !== parseFloat(liters)) {
                setValue('liters', lit);
            }
        }
    }, [totalCost, costPerLiter]);

    const onSubmit = (data: FuelFormData) => {
        if (!data.carId) {
            Alert.alert('Errore', 'Seleziona un veicolo');
            return;
        }

        if (!data.liters || parseFloat(data.liters) <= 0) {
            Alert.alert('Errore', 'Inserisci una quantità di carburante valida');
            return;
        }

        if (!data.totalCost || parseFloat(data.totalCost) <= 0) {
            Alert.alert('Errore', 'Inserisci un costo totale valido');
            return;
        }

        try {
            const fuelData = {
                date: data.date,
                mileage: parseInt(data.mileage, 10) || car?.currentMileage || 0,
                liters: parseFloat(data.liters),
                costPerLiter: parseFloat(data.costPerLiter) || parseFloat(data.totalCost) / parseFloat(data.liters),
                totalCost: parseFloat(data.totalCost),
                isFullTank: data.isFullTank,
                fuelType: data.fuelType as 'gasoline' | 'diesel' | 'electric' | 'hybrid',
                stationName: data.stationName || undefined,
                notes: data.notes || undefined,
            };

            addFuelRecord(data.carId, fuelData);

            Alert.alert('Successo', 'Rifornimento aggiunto con successo!', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            Alert.alert('Errore', 'Si è verificato un errore durante il salvataggio.');
        }
    };

    const handleDateChange = (event: any, date?: Date) => {
        setShowDatePicker(false);
        if (date) {
            setSelectedDate(date);
            setValue('date', date.toISOString().split('T')[0]);
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
        icon: Icon,
        suffix,
        disabled = false
    }: any) => (
        <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: fallbackTheme.text }]}>
                {label} {required && <Text style={{ color: fallbackTheme.error }}>*</Text>}
            </Text>
            <View style={[
                styles.inputWrapper, 
                { 
                    backgroundColor: disabled ? fallbackTheme.border + '20' : fallbackTheme.cardBackground, 
                    borderColor: error ? fallbackTheme.error : fallbackTheme.border 
                }
            ]}>
                {Icon && (
                    <View style={styles.inputIconContainer}>
                        <Icon size={20} color={fallbackTheme.textSecondary} />
                    </View>
                )}
                <TextInput
                    style={[
                        styles.input, 
                        { color: disabled ? fallbackTheme.textSecondary : fallbackTheme.text }
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor={fallbackTheme.placeholder}
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    editable={!disabled}
                />
                {suffix && (
                    <Text style={[styles.inputSuffix, { color: fallbackTheme.textSecondary }]}>
                        {suffix}
                    </Text>
                )}
            </View>
            {error && (
                <Text style={[styles.errorText, { color: fallbackTheme.error }]}>
                    {error}
                </Text>
            )}
        </View>
    );

    // Fuel Type Selector
    const FuelTypeSelector = () => (
        <View style={[styles.card, { backgroundColor: fallbackTheme.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: fallbackTheme.text }]}>
                Tipo di Carburante
            </Text>
            <View style={styles.fuelTypeGrid}>
                {FUEL_TYPES.map((fuelType) => {
                    const isSelected = selectedFuelType === fuelType.id;
                    const IconComponent = fuelType.icon;
                    
                    return (
                        <TouchableOpacity
                            key={fuelType.id}
                            style={[
                                styles.fuelTypeCard,
                                { 
                                    backgroundColor: isSelected ? fuelType.color + '20' : fallbackTheme.background,
                                    borderColor: isSelected ? fuelType.color : fallbackTheme.border
                                }
                            ]}
                            onPress={() => setValue('fuelType', fuelType.id)}
                        >
                            <View style={[
                                styles.fuelTypeIcon,
                                { backgroundColor: isSelected ? fuelType.color : fallbackTheme.border }
                            ]}>
                                <IconComponent size={20} color={isSelected ? '#ffffff' : fallbackTheme.textSecondary} />
                            </View>
                            <Text style={[
                                styles.fuelTypeName,
                                { color: isSelected ? fuelType.color : fallbackTheme.text }
                            ]}>
                                {fuelType.name}
                            </Text>
                            <Text style={[
                                styles.fuelTypeDescription,
                                { color: isSelected ? fuelType.color : fallbackTheme.textSecondary }
                            ]}>
                                {fuelType.description}
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
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color={fallbackTheme.text} />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={[styles.headerTitle, { color: fallbackTheme.text }]}>Nuovo Rifornimento</Text>
                    <Text style={[styles.headerSubtitle, { color: fallbackTheme.textSecondary }]}>
                        {car ? `${car.make} ${car.model}` : 'Registra un rifornimento'}
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView 
                    style={styles.scrollContainer} 
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <CarSelector />
                    <FuelTypeSelector />

                    {/* Basic Data */}
                    <View style={[styles.card, { backgroundColor: fallbackTheme.cardBackground }]}>
                        <Text style={[styles.cardTitle, { color: fallbackTheme.text }]}>
                            Dati Principali
                        </Text>

                        <View style={styles.row}>
                            <View style={styles.halfWidth}>
                                <Text style={[styles.inputLabel, { color: fallbackTheme.text }]}>
                                    Data <Text style={{ color: fallbackTheme.error }}>*</Text>
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
                                    name="mileage"
                                    rules={{ required: 'Chilometraggio obbligatorio' }}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <ModernInput
                                            label="Chilometraggio"
                                            placeholder="Es: 45000"
                                            value={value}
                                            onChangeText={onChange}
                                            keyboardType="numeric"
                                            error={errors.mileage?.message}
                                            required
                                            icon={Gauge}
                                            suffix="km"
                                        />
                                    )}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Quantity and Costs */}
                    <View style={[styles.card, { backgroundColor: fallbackTheme.cardBackground }]}>
                        <View style={styles.cardHeaderWithIcon}>
                            <Text style={[styles.cardTitle, { color: fallbackTheme.text }]}>
                                Quantità e Costi
                            </Text>
                            <View style={[styles.calculatorIcon, { backgroundColor: fallbackTheme.info + '20' }]}>
                                <Calculator size={16} color={fallbackTheme.info} />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.halfWidth}>
                                <Controller
                                    control={control}
                                    name="liters"
                                    rules={{ required: 'Litri obbligatori' }}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <ModernInput
                                            label="Quantità"
                                            placeholder="Es: 40.5"
                                            value={value}
                                            onChangeText={onChange}
                                            keyboardType="decimal-pad"
                                            error={errors.liters?.message}
                                            required
                                            icon={Droplets}
                                            suffix={selectedFuelType === 'electric' ? 'kWh' : 'L'}
                                        />
                                    )}
                                />
                            </View>

                            <View style={styles.halfWidth}>
                                <Controller
                                    control={control}
                                    name="costPerLiter"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <ModernInput
                                            label={selectedFuelType === 'electric' ? 'Prezzo / kWh' : 'Prezzo / Litro'}
                                            placeholder="Es: 1.85"
                                            value={value}
                                            onChangeText={onChange}
                                            keyboardType="decimal-pad"
                                            icon={DollarSign}
                                            suffix="€"
                                        />
                                    )}
                                />
                            </View>
                        </View>

                        <Controller
                            control={control}
                            name="totalCost"
                            rules={{ required: 'Costo totale obbligatorio' }}
                            render={({ field: { onChange, onBlur, value } }) => (
                                <ModernInput
                                    label="Costo Totale"
                                    placeholder="Calcolato automaticamente"
                                    value={value}
                                    onChangeText={onChange}
                                    keyboardType="decimal-pad"
                                    error={errors.totalCost?.message}
                                    required
                                    icon={DollarSign}
                                    suffix="€"
                                />
                            )}
                        />
                    </View>

                    {/* Additional Details */}
                    <View style={[styles.card, { backgroundColor: fallbackTheme.cardBackground }]}>
                        <Text style={[styles.cardTitle, { color: fallbackTheme.text }]}>
                            Dettagli Aggiuntivi
                        </Text>

                        {selectedFuelType !== 'electric' && (
                            <View style={styles.switchRow}>
                                <View style={styles.switchInfo}>
                                    <Text style={[styles.switchLabel, { color: fallbackTheme.text }]}>
                                        Pieno effettuato?
                                    </Text>
                                    <Text style={[styles.switchDescription, { color: fallbackTheme.textSecondary }]}>
                                        Serbatoio riempito completamente
                                    </Text>
                                </View>
                                <Controller
                                    control={control}
                                    name="isFullTank"
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
                        )}

                        <Controller
                            control={control}
                            name="stationName"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <ModernInput
                                    label="Stazione di servizio"
                                    placeholder="Nome distributore (opzionale)"
                                    value={value}
                                    onChangeText={onChange}
                                    icon={MapPin}
                                />
                            )}
                        />

                        <Controller
                            control={control}
                            name="notes"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <ModernInput
                                    label="Note"
                                    placeholder="Note aggiuntive (opzionale)"
                                    value={value}
                                    onChangeText={onChange}
                                />
                            )}
                        />
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
                            <Save size={18} color="#ffffff" />
                            <Text style={styles.primaryButtonText}>Salva Rifornimento</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Date Picker */}
            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1 
    },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center',
        paddingHorizontal: 20, 
        paddingVertical: 16, 
        borderBottomWidth: 1
    },
    headerTitles: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: { 
        fontSize: 24, 
        fontWeight: 'bold' 
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    content: { 
        flex: 1 
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
    cardHeaderWithIcon: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    calculatorIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Fuel Type Grid
    fuelTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    fuelTypeCard: {
        width: '47%',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        marginBottom: 8,
    },
    fuelTypeIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    fuelTypeName: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'center',
    },
    fuelTypeDescription: {
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
    inputIconContainer: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        minHeight: 20,
    },
    inputSuffix: {
        fontSize: 16,
        marginLeft: 8,
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
        paddingVertical: 8,
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

export default AddFuelScreen;
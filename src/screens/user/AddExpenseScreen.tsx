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
    TextInput,
    Animated
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Controller, useForm } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    ArrowLeft,
    Calendar,
    DollarSign,
    FileText,
    Save,
    Fuel,
    Wrench,
    CreditCard,
    Car,
    MapPin,
    Gauge,
    Camera,
    Paperclip,
    Plus
} from 'lucide-react-native';

import { useStore } from '../../store';
import { useUserCarsStore } from '../../store/useCarsStore';

interface ExpenseFormData {
    carId: string;
    category: string;
    description: string;
    date: string;
    amount: string;
    mileage: string;
    notes: string;
    includeInStats: boolean;
}

const EXPENSE_CATEGORIES = [
    { 
        id: 'fuel', 
        name: 'Carburante', 
        icon: Fuel, 
        color: '#FF9500',
        description: 'Benzina, diesel, GPL',
        suggestions: ['Rifornimento Benzina', 'Rifornimento Diesel', 'Rifornimento GPL', 'Ricarica Elettrica']
    },
    { 
        id: 'maintenance', 
        name: 'Manutenzione', 
        icon: Wrench, 
        color: '#5AC8FA',
        description: 'Riparazioni e servizi',
        suggestions: ['Cambio olio', 'Tagliando', 'Riparazione']
    },
    { 
        id: 'insurance', 
        name: 'Assicurazione', 
        icon: CreditCard, 
        color: '#34C759',
        description: 'Polizze e coperture',
        suggestions: ['Assicurazione RCA', 'Kasko', 'Furto e incendio']
    },
    { 
        id: 'tax', 
        name: 'Tasse', 
        icon: FileText, 
        color: '#FF3B30',
        description: 'Bollo e imposte',
        suggestions: ['Bollo auto', 'Tassa di circolazione']
    },
    { 
        id: 'parking', 
        name: 'Parcheggio', 
        icon: Car, 
        color: '#007AFF',
        description: 'Sosta e garage',
        suggestions: ['Parcheggio a pagamento', 'Garage mensile', 'ZTL']
    },
    { 
        id: 'tolls', 
        name: 'Pedaggi', 
        icon: MapPin, 
        color: '#8E8E93',
        description: 'Autostrade e tunnel',
        suggestions: ['Pedaggio autostradale', 'Telepass']
    },
    { 
        id: 'other', 
        name: 'Altro', 
        icon: DollarSign, 
        color: '#8E8E93',
        description: 'Altre spese',
        suggestions: []
    }
];

const AddExpenseScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { darkMode } = useStore();
    const { cars, getCarById, addExpense } = useUserCarsStore();

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
    const preselectedCategory = route.params?.category || '';

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<ExpenseFormData>({
        defaultValues: {
            carId: preselectedCarId || (cars.length === 1 ? cars[0].id : ''),
            category: preselectedCategory,
            description: '',
            date: new Date().toISOString().split('T')[0],
            amount: '',
            mileage: '',
            notes: '',
            includeInStats: true
        }
    });

    const selectedCarId = watch('carId');
    const selectedCategory = watch('category');

    const selectedCar = selectedCarId ? getCarById(selectedCarId) : null;
    const selectedCategoryData = EXPENSE_CATEGORIES.find(cat => cat.id === selectedCategory);

    const onSubmit = (data: ExpenseFormData) => {
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

        if (!data.amount || parseFloat(data.amount) <= 0) {
            Alert.alert('Errore', 'Inserisci un importo valido');
            return;
        }

        try {
            const expenseData = {
                category: data.category,
                description: data.description.trim(),
                date: data.date,
                amount: parseFloat(data.amount),
                mileage: parseInt(data.mileage) || selectedCar?.currentMileage || 0,
                notes: data.notes.trim() || undefined,
                includeInStats: data.includeInStats
            };

            addExpense(data.carId, expenseData);

            Alert.alert(
                'Successo',
                'Spesa aggiunta con successo!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
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
        icon: Icon,
        suffix
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

    // Category Selector Component
    const CategorySelector = () => (
        <View style={[styles.card, { backgroundColor: fallbackTheme.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: fallbackTheme.text }]}>
                Categoria Spesa
            </Text>
            <View style={styles.categoryGrid}>
                {EXPENSE_CATEGORIES.map((category) => {
                    const isSelected = selectedCategory === category.id;
                    const IconComponent = category.icon;
                    
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
                                <IconComponent size={20} color={isSelected ? '#ffffff' : fallbackTheme.textSecondary} />
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

    // Quick Suggestions for selected category
    const QuickSuggestions = () => {
        if (!selectedCategoryData || selectedCategoryData.suggestions.length === 0) return null;

        return (
            <View style={[styles.card, { backgroundColor: fallbackTheme.cardBackground }]}>
                <Text style={[styles.cardTitle, { color: fallbackTheme.text }]}>
                    Suggerimenti Rapidi
                </Text>
                <View style={styles.suggestionsGrid}>
                    {selectedCategoryData.suggestions.map((suggestion, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.suggestionChip, { backgroundColor: selectedCategoryData.color + '20' }]}
                            onPress={() => setValue('description', suggestion)}
                        >
                            <Text style={[styles.suggestionText, { color: selectedCategoryData.color }]}>
                                {suggestion}
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
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft size={24} color={fallbackTheme.text} />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={[styles.headerTitle, { color: fallbackTheme.text }]}>Nuova Spesa</Text>
                    <Text style={[styles.headerSubtitle, { color: fallbackTheme.textSecondary }]}>
                        {selectedCar ? `${selectedCar.make} ${selectedCar.model}` : 'Registra una spesa'}
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    style={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <CarSelector />
                    <CategorySelector />
                    <QuickSuggestions />

                    {/* Basic Information */}
                    <View style={[styles.card, { backgroundColor: fallbackTheme.cardBackground }]}>
                        <Text style={[styles.cardTitle, { color: fallbackTheme.text }]}>
                            Dettagli Spesa
                        </Text>

                        <Controller
                            control={control}
                            name="description"
                            rules={{ required: 'Descrizione obbligatoria' }}
                            render={({ field: { onChange, value } }) => (
                                <ModernInput
                                    label="Descrizione"
                                    placeholder="Es: Rifornimento benzina"
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
                                    name="amount"
                                    rules={{
                                        required: 'Importo obbligatorio',
                                        validate: value => parseFloat(value) > 0 || 'Importo deve essere maggiore di 0'
                                    }}
                                    render={({ field: { onChange, value } }) => (
                                        <ModernInput
                                            label="Importo"
                                            placeholder="0.00"
                                            value={value}
                                            onChangeText={onChange}
                                            keyboardType="decimal-pad"
                                            error={errors.amount?.message}
                                            required
                                            icon={DollarSign}
                                            suffix="€"
                                        />
                                    )}
                                />
                            </View>
                        </View>

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
                                    suffix="km"
                                />
                            )}
                        />

                        <Controller
                            control={control}
                            name="notes"
                            render={({ field: { onChange, value } }) => (
                                <ModernInput
                                    label="Note"
                                    placeholder="Note aggiuntive sulla spesa..."
                                    value={value}
                                    onChangeText={onChange}
                                    multiline
                                />
                            )}
                        />
                    </View>

                    {/* Receipt Upload */}
                    <View style={[styles.card, { backgroundColor: fallbackTheme.cardBackground }]}>
                        <Text style={[styles.cardTitle, { color: fallbackTheme.text }]}>
                            Scontrino/Ricevuta
                        </Text>
                        
                        <View style={styles.uploadButtons}>
                            <TouchableOpacity 
                                style={[styles.uploadButton, { backgroundColor: fallbackTheme.primary + '20', borderColor: fallbackTheme.primary }]}
                            >
                                <Camera size={24} color={fallbackTheme.primary} />
                                <Text style={[styles.uploadButtonText, { color: fallbackTheme.primary }]}>
                                    Scatta Foto
                                </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.uploadButton, { backgroundColor: fallbackTheme.border + '20', borderColor: fallbackTheme.border }]}
                            >
                                <Paperclip size={24} color={fallbackTheme.textSecondary} />
                                <Text style={[styles.uploadButtonText, { color: fallbackTheme.textSecondary }]}>
                                    Allega File
                                </Text>
                            </TouchableOpacity>
                        </View>
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
                            <Text style={styles.primaryButtonText}>Salva Spesa</Text>
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
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    categoryCard: {
        width: '47%',
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

    // Suggestions
    suggestionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    suggestionChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    suggestionText: {
        fontSize: 14,
        fontWeight: '600',
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

    // Upload Buttons
    uploadButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    uploadButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderWidth: 2,
        borderRadius: 12,
        borderStyle: 'dashed',
        gap: 8,
    },
    uploadButtonText: {
        fontSize: 14,
        fontWeight: '600',
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

export default AddExpenseScreen;
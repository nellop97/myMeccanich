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
    Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Controller, useForm } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    ArrowLeft,
    Calendar,
    DollarSign,
    FileText,
    Fuel,
    Wrench,
    Save,
    CreditCard,
    AlertTriangle,
    Camera,
    Paperclip
} from 'lucide-react-native';

import {
    PrimaryButton,
    SecondaryButton,
    ModernCard,
    FormInput,
    theme
} from '../../components/shared/GlobalComponents';

import { useStore } from '../../store';
import { useUserCarsStore } from '../../store/userCarsStore';

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
    { id: 'fuel', name: 'Carburante', icon: '⛽' },
    { id: 'maintenance', name: 'Manutenzione', icon: '🔧' },
    { id: 'insurance', name: 'Assicurazione', icon: '📄' },
    { id: 'tax', name: 'Tasse', icon: '💳' },
    { id: 'parking', name: 'Parcheggio', icon: '🅿️' },
    { id: 'tolls', name: 'Pedaggi', icon: '🛣️' },
    { id: 'other', name: 'Altro', icon: '💰' }
];

const AddExpenseScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { darkMode } = useStore();
    const { cars, getCarById, addExpense } = useUserCarsStore();

    const preselectedCarId = route.params?.carId;
    const preselectedCategory = route.params?.category || '';

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const { control, handleSubmit, formState: { errors }, watch, setValue, getValues } = useForm<ExpenseFormData>({
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

    const CategorySelector = () => (
        <View style={styles.categoryContainer}>
            <Text style={styles.sectionTitle}>Categoria Spesa</Text>
            <View style={styles.categoryGrid}>
                {EXPENSE_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        style={[
                            styles.categoryChip,
                            selectedCategory === cat.id && styles.categoryChipActive
                        ]}
                        onPress={() => setValue('category', cat.id)}
                    >
                        <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                        <Text style={[
                            styles.categoryText,
                            selectedCategory === cat.id && styles.categoryTextActive
                        ]}>
                            {cat.name}
                        </Text>
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
                            style={[
                                styles.carChip,
                                selectedCarId === car.id && styles.carChipActive
                            ]}
                            onPress={() => setValue('carId', car.id)}
                        >
                            <Text style={[
                                styles.carChipText,
                                selectedCarId === car.id && styles.carChipTextActive
                            ]}>
                                {car.make} {car.model}
                            </Text>
                            <Text style={[
                                styles.carChipPlate,
                                selectedCarId === car.id && styles.carChipPlateActive
                            ]}>
                                {car.licensePlate}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={styles.headerTitle}>Nuova Spesa</Text>
                    <Text style={styles.headerSubtitle}>
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
                    {/* Car Selector */}
                    <CarSelector />

                    {/* Category Selector */}
                    <CategorySelector />

                    {/* Basic Information */}
                    <ModernCard style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Informazioni Spesa</Text>

                        <Controller
                            control={control}
                            name="description"
                            rules={{ required: 'Descrizione obbligatoria' }}
                            render={({ field: { onChange, value } }) => (
                                <FormInput
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
                                <Text style={styles.inputLabel}>Data <Text style={styles.requiredStar}>*</Text></Text>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Calendar size={20} color={theme.primary} />
                                    <Text style={styles.dateButtonText}>
                                        {new Date(watch('date')).toLocaleDateString('it-IT')}
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
                                        <FormInput
                                            label="Importo"
                                            placeholder="0.00"
                                            value={value}
                                            onChangeText={onChange}
                                            keyboardType="decimal-pad"
                                            error={errors.amount?.message}
                                            required
                                            icon={DollarSign}
                                        />
                                    )}
                                />
                            </View>
                        </View>

                        <Controller
                            control={control}
                            name="mileage"
                            render={({ field: { onChange, value } }) => (
                                <FormInput
                                    label="Chilometraggio"
                                    placeholder={selectedCar?.currentMileage?.toString() || "0"}
                                    value={value}
                                    onChangeText={onChange}
                                    keyboardType="numeric"
                                />
                            )}
                        />

                        <Controller
                            control={control}
                            name="notes"
                            render={({ field: { onChange, value } }) => (
                                <FormInput
                                    label="Note"
                                    placeholder="Note aggiuntive sulla spesa..."
                                    value={value}
                                    onChangeText={onChange}
                                    multiline
                                />
                            )}
                        />
                    </ModernCard>

                    {/* Quick Fill Buttons for Fuel */}
                    {selectedCategory === 'fuel' && (
                        <ModernCard style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Riempimento Rapido</Text>
                            <View style={styles.quickFillButtons}>
                                <TouchableOpacity
                                    style={styles.quickFillButton}
                                    onPress={() => {
                                        setValue('description', 'Rifornimento Benzina');
                                    }}
                                >
                                    <Text style={styles.quickFillButtonText}>Benzina</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.quickFillButton}
                                    onPress={() => {
                                        setValue('description', 'Rifornimento Diesel');
                                    }}
                                >
                                    <Text style={styles.quickFillButtonText}>Diesel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.quickFillButton}
                                    onPress={() => {
                                        setValue('description', 'Rifornimento GPL');
                                    }}
                                >
                                    <Text style={styles.quickFillButtonText}>GPL</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.quickFillButton}
                                    onPress={() => {
                                        setValue('description', 'Rifornimento Metano');
                                    }}
                                >
                                    <Text style={styles.quickFillButtonText}>Metano</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.quickFillButton}
                                    onPress={() => {
                                        setValue('description', 'Ricarica Elettrica');
                                    }}
                                >
                                    <Text style={styles.quickFillButtonText}>Elettrica</Text>
                                </TouchableOpacity>
                            </View>
                        </ModernCard>
                    )}

                    {/* Upload Receipt Option */}
                    <ModernCard style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Scontrino/Ricevuta</Text>
                        <TouchableOpacity style={styles.uploadButton}>
                            <Camera size={24} color={theme.primary} />
                            <Text style={styles.uploadButtonText}>Scatta Foto Scontrino</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.uploadButton, styles.uploadButtonSecondary]}>
                            <Paperclip size={24} color={theme.text} />
                            <Text style={styles.uploadButtonTextSecondary}>Allega File</Text>
                        </TouchableOpacity>
                    </ModernCard>

                    {/* Actions */}
                    <View style={styles.actionsContainer}>
                        <SecondaryButton
                            title="Annulla"
                            onPress={() => navigation.goBack()}
                        />
                        <PrimaryButton
                            title="Salva Spesa"
                            icon={Save}
                            onPress={handleSubmit(onSubmit)}
                        />
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
        borderBottomColor: theme.border,
        backgroundColor: theme.cardBackground,
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
        color: theme.text,
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 2,
    },
    content: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
        padding: 16,
    },
    sectionCard: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 16,
    },
    categoryContainer: {
        marginBottom: 16,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.cardBackground,
        marginBottom: 8,
    },
    categoryChipActive: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
    },
    categoryEmoji: {
        fontSize: 16,
        marginRight: 6,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.text,
    },
    categoryTextActive: {
        color: '#ffffff',
    },
    carSelectorContainer: {
        marginBottom: 16,
    },
    carsGrid: {
        gap: 8,
    },
    carChip: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.cardBackground,
    },
    carChipActive: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
    },
    carChipText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 2,
    },
    carChipTextActive: {
        color: '#ffffff',
    },
    carChipPlate: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    carChipPlateActive: {
        color: '#ffffff',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    halfWidth: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 8,
    },
    requiredStar: {
        color: theme.error,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 12,
        backgroundColor: theme.cardBackground,
    },
    dateButtonText: {
        fontSize: 16,
        color: theme.text,
        marginLeft: 8,
    },
    quickFillButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    quickFillButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: theme.primary + '20',
    },
    quickFillButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.primary,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderWidth: 2,
        borderColor: theme.primary,
        borderRadius: 12,
        borderStyle: 'dashed',
        marginBottom: 12,
    },
    uploadButtonSecondary: {
        borderColor: theme.border,
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.primary,
        marginLeft: 12,
    },
    uploadButtonTextSecondary: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        marginLeft: 12,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
        marginBottom: 32,
    },
});

export default AddExpenseScreen;

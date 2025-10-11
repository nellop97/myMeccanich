// src/screens/user/AddCarScreen.tsx
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
    Dimensions,
    TextInput,
    ActivityIndicator,
    Modal
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UniversalDatePicker } from '../../components';
import {
    ArrowLeft,
    Calendar,
    Car,
    DollarSign,
    FileText,
    Save,
    Info,
    Key,
    Hash,
    Palette,
    Check,
    ChevronRight,
    ChevronLeft,
    Gauge,
    X
} from 'lucide-react-native';

// Import Firebase
import { db, auth } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { useAppThemeManager } from '../../hooks/useTheme';
import { useCarsStore } from '../../store/useCarsStore';

const { width: screenWidth } = Dimensions.get('window');

// Car colors
const CAR_COLORS = [
    { name: 'Bianco', value: '#FFFFFF', border: '#E5E5EA' },
    { name: 'Nero', value: '#000000' },
    { name: 'Argento', value: '#C0C0C0' },
    { name: 'Grigio', value: '#808080' },
    { name: 'Rosso', value: '#FF0000' },
    { name: 'Blu', value: '#0000FF' },
    { name: 'Verde', value: '#008000' },
    { name: 'Marrone', value: '#8B4513' },
    { name: 'Giallo', value: '#FFFF00' },
    { name: 'Arancione', value: '#FFA500' },
];

const AddCarScreen = () => {
    const navigation = useNavigation();
    const { colors, isDark } = useAppThemeManager();
    const { addVehicle: addCarToStore } = useCarsStore();

    // Form state
    const [formData, setFormData] = useState({
        make: '',
        model: '',
        year: '',
        color: CAR_COLORS[0].value,
        licensePlate: '',
        vin: '',
        purchaseDate: new Date(),
        purchasePrice: '',
        purchaseMileage: '',
        currentMileage: '',
        insuranceCompany: '',
        insuranceExpiry: new Date(),
        notes: '',
    });

    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Validation functions
    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        switch (step) {
            case 0: // Basic Info
                if (!formData.make.trim()) newErrors.make = 'Marca obbligatoria';
                if (!formData.model.trim()) newErrors.model = 'Modello obbligatorio';
                if (!formData.year.trim()) {
                    newErrors.year = 'Anno obbligatorio';
                } else if (parseInt(formData.year) < 1900 || parseInt(formData.year) > new Date().getFullYear() + 1) {
                    newErrors.year = 'Anno non valido';
                }
                break;
            case 1: // Identification
                if (!formData.licensePlate.trim()) newErrors.licensePlate = 'Targa obbligatoria';
                break;
            case 2: // Purchase Info
                if (formData.purchasePrice && isNaN(parseFloat(formData.purchasePrice))) {
                    newErrors.purchasePrice = 'Prezzo non valido';
                }
                if (formData.purchaseMileage && isNaN(parseInt(formData.purchaseMileage))) {
                    newErrors.purchaseMileage = 'Chilometraggio non valido';
                }
                if (formData.currentMileage && isNaN(parseInt(formData.currentMileage))) {
                    newErrors.currentMileage = 'Chilometraggio non valido';
                }
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            if (currentStep < 3) {
                setCurrentStep(currentStep + 1);
            } else {
                handleSubmit();
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            setErrors({});
        }
    };

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;

        setIsLoading(true);

        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Utente non autenticato');

            const carData = {
                userId: user.uid,
                make: formData.make.trim(),
                model: formData.model.trim(),
                year: parseInt(formData.year),
                color: formData.color,
                licensePlate: formData.licensePlate.trim().toUpperCase(),
                vin: formData.vin.trim().toUpperCase() || null,
                purchaseDate: formData.purchaseDate.toISOString(),
                purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
                purchaseMileage: formData.purchaseMileage ? parseInt(formData.purchaseMileage) : 0,
                currentMileage: formData.currentMileage ? parseInt(formData.currentMileage) :
                    formData.purchaseMileage ? parseInt(formData.purchaseMileage) : 0,
                insuranceCompany: formData.insuranceCompany.trim() || null,
                insuranceExpiry: formData.insuranceExpiry ? formData.insuranceExpiry.toISOString() : null,
                notes: formData.notes.trim() || null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                status: 'active',
            };

            const docRef = await addDoc(collection(db, 'vehicles'), carData);

            // Add to local store
            addCarToStore({
                id: docRef.id,
                ...carData,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            Alert.alert(
                'Successo',
                'Veicolo aggiunto con successo!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error) {
            console.error('Error adding car:', error);
            Alert.alert('Errore', 'Impossibile aggiungere il veicolo. Riprova.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderColorPicker = () => (
        <Modal
            visible={showColorPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowColorPicker(false)}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowColorPicker(false)}
            >
                <View style={[styles.colorPickerModal, { backgroundColor: colors.surface }]}>
                    <View style={styles.colorPickerHeader}>
                        <Text style={[styles.colorPickerTitle, { color: colors.onSurface }]}>
                            Seleziona Colore
                        </Text>
                        <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                            <X size={24} color={colors.onSurface} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.colorGrid}>
                        {CAR_COLORS.map((color) => (
                            <TouchableOpacity
                                key={color.value}
                                style={[
                                    styles.colorOption,
                                    {
                                        backgroundColor: color.value,
                                        borderColor: color.border || colors.outline,
                                    },
                                    formData.color === color.value && styles.colorOptionSelected,
                                ]}
                                onPress={() => {
                                    updateFormData('color', color.value);
                                    setShowColorPicker(false);
                                }}
                            >
                                {formData.color === color.value && (
                                    <Check size={20} color={color.value === '#FFFFFF' ? '#000' : '#FFF'} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    const renderStep = () => {
        switch (currentStep) {
            case 0: // Basic Info
                return (
                    <View style={styles.stepContent}>
                        <Text style={[styles.stepTitle, { color: colors.onSurface }]}>
                            Informazioni Base
                        </Text>

                        {/* Make */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Marca *
                            </Text>
                            <View style={[styles.inputContainer, {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: errors.make ? colors.error : colors.outline,
                            }]}>
                                <Car size={20} color={colors.primary} />
                                <TextInput
                                    style={[styles.input, { color: colors.onSurface }]}
                                    placeholder="es. Toyota, BMW, Fiat"
                                    placeholderTextColor={colors.onSurfaceVariant}
                                    value={formData.make}
                                    onChangeText={(text) => updateFormData('make', text)}
                                />
                            </View>
                            {errors.make && (
                                <Text style={[styles.errorText, { color: colors.error }]}>
                                    {errors.make}
                                </Text>
                            )}
                        </View>

                        {/* Model */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Modello *
                            </Text>
                            <View style={[styles.inputContainer, {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: errors.model ? colors.error : colors.outline,
                            }]}>
                                <Car size={20} color={colors.primary} />
                                <TextInput
                                    style={[styles.input, { color: colors.onSurface }]}
                                    placeholder="es. Corolla, Serie 3, Panda"
                                    placeholderTextColor={colors.onSurfaceVariant}
                                    value={formData.model}
                                    onChangeText={(text) => updateFormData('model', text)}
                                />
                            </View>
                            {errors.model && (
                                <Text style={[styles.errorText, { color: colors.error }]}>
                                    {errors.model}
                                </Text>
                            )}
                        </View>

                        {/* Year */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Anno *
                            </Text>
                            <View style={[styles.inputContainer, {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: errors.year ? colors.error : colors.outline,
                            }]}>
                                <Calendar size={20} color={colors.primary} />
                                <TextInput
                                    style={[styles.input, { color: colors.onSurface }]}
                                    placeholder="es. 2023"
                                    placeholderTextColor={colors.onSurfaceVariant}
                                    value={formData.year}
                                    onChangeText={(text) => updateFormData('year', text)}
                                    keyboardType="numeric"
                                    maxLength={4}
                                />
                            </View>
                            {errors.year && (
                                <Text style={[styles.errorText, { color: colors.error }]}>
                                    {errors.year}
                                </Text>
                            )}
                        </View>

                        {/* Color */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Colore
                            </Text>
                            <TouchableOpacity
                                style={[styles.inputContainer, {
                                    backgroundColor: colors.surfaceVariant,
                                    borderColor: colors.outline,
                                }]}
                                onPress={() => setShowColorPicker(true)}
                            >
                                <Palette size={20} color={colors.primary} />
                                <View style={styles.colorPreview}>
                                    <View
                                        style={[
                                            styles.colorSwatch,
                                            {
                                                backgroundColor: formData.color,
                                                borderColor: formData.color === '#FFFFFF' ? colors.outline : formData.color,
                                            },
                                        ]}
                                    />
                                    <Text style={[styles.colorName, { color: colors.onSurface }]}>
                                        {CAR_COLORS.find(c => c.value === formData.color)?.name || 'Seleziona'}
                                    </Text>
                                </View>
                                <ChevronRight size={20} color={colors.onSurfaceVariant} />
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            case 1: // Identification
                return (
                    <View style={styles.stepContent}>
                        <Text style={[styles.stepTitle, { color: colors.onSurface }]}>
                            Identificazione
                        </Text>

                        {/* License Plate */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Targa *
                            </Text>
                            <View style={[styles.inputContainer, {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: errors.licensePlate ? colors.error : colors.outline,
                            }]}>
                                <Key size={20} color={colors.primary} />
                                <TextInput
                                    style={[styles.input, { color: colors.onSurface }]}
                                    placeholder="es. AB123CD"
                                    placeholderTextColor={colors.onSurfaceVariant}
                                    value={formData.licensePlate}
                                    onChangeText={(text) => updateFormData('licensePlate', text.toUpperCase())}
                                    autoCapitalize="characters"
                                />
                            </View>
                            {errors.licensePlate && (
                                <Text style={[styles.errorText, { color: colors.error }]}>
                                    {errors.licensePlate}
                                </Text>
                            )}
                        </View>

                        {/* VIN */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Numero Telaio (VIN)
                            </Text>
                            <View style={[styles.inputContainer, {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: colors.outline,
                            }]}>
                                <Hash size={20} color={colors.primary} />
                                <TextInput
                                    style={[styles.input, { color: colors.onSurface }]}
                                    placeholder="es. WBADT43452G123456 (opzionale)"
                                    placeholderTextColor={colors.onSurfaceVariant}
                                    value={formData.vin}
                                    onChangeText={(text) => updateFormData('vin', text.toUpperCase())}
                                    autoCapitalize="characters"
                                    maxLength={17}
                                />
                            </View>
                            <Text style={[styles.helperText, { color: colors.onSurfaceVariant }]}>
                                17 caratteri alfanumerici
                            </Text>
                        </View>
                    </View>
                );

            case 2: // Purchase Info
                return (
                    <View style={styles.stepContent}>
                        <Text style={[styles.stepTitle, { color: colors.onSurface }]}>
                            Informazioni Acquisto
                        </Text>

                        {/* Purchase Date */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Data Acquisto
                            </Text>
                            <UniversalDatePicker
                                value={formData.purchaseDate}
                                onChange={(date) => updateFormData('purchaseDate', date)}
                                maximumDate={new Date()}
                            />
                        </View>

                        {/* Purchase Price */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Prezzo di Acquisto
                            </Text>
                            <View style={[styles.inputContainer, {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: errors.purchasePrice ? colors.error : colors.outline,
                            }]}>
                                <DollarSign size={20} color={colors.primary} />
                                <TextInput
                                    style={[styles.input, { color: colors.onSurface }]}
                                    placeholder="es. 15000"
                                    placeholderTextColor={colors.onSurfaceVariant}
                                    value={formData.purchasePrice}
                                    onChangeText={(text) => updateFormData('purchasePrice', text)}
                                    keyboardType="decimal-pad"
                                />
                                <Text style={[styles.currency, { color: colors.onSurfaceVariant }]}>
                                    €
                                </Text>
                            </View>
                            {errors.purchasePrice && (
                                <Text style={[styles.errorText, { color: colors.error }]}>
                                    {errors.purchasePrice}
                                </Text>
                            )}
                        </View>

                        {/* Purchase Mileage */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Chilometraggio all'Acquisto
                            </Text>
                            <View style={[styles.inputContainer, {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: errors.purchaseMileage ? colors.error : colors.outline,
                            }]}>
                                <Gauge size={20} color={colors.primary} />
                                <TextInput
                                    style={[styles.input, { color: colors.onSurface }]}
                                    placeholder="es. 50000"
                                    placeholderTextColor={colors.onSurfaceVariant}
                                    value={formData.purchaseMileage}
                                    onChangeText={(text) => updateFormData('purchaseMileage', text)}
                                    keyboardType="numeric"
                                />
                                <Text style={[styles.currency, { color: colors.onSurfaceVariant }]}>
                                    km
                                </Text>
                            </View>
                            {errors.purchaseMileage && (
                                <Text style={[styles.errorText, { color: colors.error }]}>
                                    {errors.purchaseMileage}
                                </Text>
                            )}
                        </View>

                        {/* Current Mileage */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Chilometraggio Attuale
                            </Text>
                            <View style={[styles.inputContainer, {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: errors.currentMileage ? colors.error : colors.outline,
                            }]}>
                                <Gauge size={20} color={colors.primary} />
                                <TextInput
                                    style={[styles.input, { color: colors.onSurface }]}
                                    placeholder="es. 55000"
                                    placeholderTextColor={colors.onSurfaceVariant}
                                    value={formData.currentMileage}
                                    onChangeText={(text) => updateFormData('currentMileage', text)}
                                    keyboardType="numeric"
                                />
                                <Text style={[styles.currency, { color: colors.onSurfaceVariant }]}>
                                    km
                                </Text>
                            </View>
                            {errors.currentMileage && (
                                <Text style={[styles.errorText, { color: colors.error }]}>
                                    {errors.currentMileage}
                                </Text>
                            )}
                        </View>
                    </View>
                );

            case 3: // Insurance & Notes
                return (
                    <View style={styles.stepContent}>
                        <Text style={[styles.stepTitle, { color: colors.onSurface }]}>
                            Assicurazione e Note
                        </Text>

                        {/* Insurance Company */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Compagnia Assicurativa
                            </Text>
                            <View style={[styles.inputContainer, {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: colors.outline,
                            }]}>
                                <FileText size={20} color={colors.primary} />
                                <TextInput
                                    style={[styles.input, { color: colors.onSurface }]}
                                    placeholder="es. Generali, Allianz"
                                    placeholderTextColor={colors.onSurfaceVariant}
                                    value={formData.insuranceCompany}
                                    onChangeText={(text) => updateFormData('insuranceCompany', text)}
                                />
                            </View>
                        </View>

                        {/* Insurance Expiry */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Scadenza Assicurazione
                            </Text>
                            <UniversalDatePicker
                                value={formData.insuranceExpiry}
                                onChange={(date) => updateFormData('insuranceExpiry', date)}
                                minimumDate={new Date()}
                            />
                        </View>

                        {/* Notes */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Note
                            </Text>
                            <View style={[styles.textAreaContainer, {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: colors.outline,
                            }]}>
                                <TextInput
                                    style={[styles.textArea, { color: colors.onSurface }]}
                                    placeholder="Aggiungi note o informazioni aggiuntive..."
                                    placeholderTextColor={colors.onSurfaceVariant}
                                    value={formData.notes}
                                    onChangeText={(text) => updateFormData('notes', text)}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>
                    </View>
                );

            default:
                return null;
        }
    };

    const steps = [
        { title: 'Info Base', icon: Car },
        { title: 'Identificazione', icon: Key },
        { title: 'Acquisto', icon: DollarSign },
        { title: 'Altro', icon: FileText },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.surface}
            />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft size={24} color={colors.onSurface} />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
                    Aggiungi Veicolo
                </Text>

                <View style={styles.headerRight} />
            </View>

            {/* Progress Indicator */}
            <View style={[styles.progressContainer, { backgroundColor: colors.surface }]}>
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;

                    return (
                        <React.Fragment key={index}>
                            <View style={styles.stepIndicator}>
                                <View
                                    style={[
                                        styles.stepCircle,
                                        {
                                            backgroundColor: isActive || isCompleted ? colors.primary : colors.surfaceVariant,
                                            borderColor: isActive ? colors.primary : colors.outline,
                                        },
                                    ]}
                                >
                                    {isCompleted ? (
                                        <Check size={16} color="#FFF" />
                                    ) : (
                                        <Icon size={16} color={isActive ? '#FFF' : colors.onSurfaceVariant} />
                                    )}
                                </View>
                                <Text
                                    style={[
                                        styles.stepLabel,
                                        {
                                            color: isActive ? colors.primary : colors.onSurfaceVariant,
                                        },
                                    ]}
                                >
                                    {step.title}
                                </Text>
                            </View>

                            {index < steps.length - 1 && (
                                <View
                                    style={[
                                        styles.stepConnector,
                                        {
                                            backgroundColor: isCompleted ? colors.primary : colors.outline,
                                        },
                                    ]}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {renderStep()}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Navigation Buttons */}
            <View style={[styles.footer, { backgroundColor: colors.surface }]}>
                {currentStep > 0 && (
                    <TouchableOpacity
                        style={[styles.footerButton, styles.backFooterButton, {
                            borderColor: colors.outline,
                        }]}
                        onPress={handleBack}
                        disabled={isLoading}
                    >
                        <ChevronLeft size={20} color={colors.onSurface} />
                        <Text style={[styles.backButtonText, { color: colors.onSurface }]}>
                            Indietro
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[
                        styles.footerButton,
                        styles.nextButton,
                        { backgroundColor: colors.primary },
                        currentStep === 0 && styles.fullWidthButton,
                    ]}
                    onPress={handleNext}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Text style={styles.nextButtonText}>
                                {currentStep === 3 ? 'Salva Veicolo' : 'Avanti'}
                            </Text>
                            {currentStep === 3 ? (
                                <Save size={20} color="#FFF" />
                            ) : (
                                <ChevronRight size={20} color="#FFF" />
                            )}
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {renderColorPicker()}
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 12,
    },
    headerRight: {
        width: 40,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    stepIndicator: {
        alignItems: 'center',
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    stepLabel: {
        fontSize: 10,
        fontWeight: '500',
    },
    stepConnector: {
        flex: 1,
        height: 2,
        marginHorizontal: 4,
        marginBottom: 20,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    stepContent: {
        paddingBottom: 20,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    input: {
        flex: 1,
        fontSize: 16,
        marginLeft: 12,
    },
    currency: {
        fontSize: 16,
        fontWeight: '500',
    },
    helperText: {
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    colorPreview: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
    },
    colorSwatch: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        marginRight: 8,
    },
    colorName: {
        fontSize: 16,
    },
    textAreaContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    textArea: {
        fontSize: 16,
        minHeight: 100,
    },
    footer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    footerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        gap: 8,
    },
    backFooterButton: {
        flex: 1,
        borderWidth: 1,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    nextButton: {
        flex: 1,
    },
    fullWidthButton: {
        flex: 1,
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorPickerModal: {
        width: screenWidth - 40,
        borderRadius: 20,
        padding: 20,
    },
    colorPickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    colorPickerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    colorOption: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorOptionSelected: {
        borderWidth: 4,
    },
});

export default AddCarScreen;
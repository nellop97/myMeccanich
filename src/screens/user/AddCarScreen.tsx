// src/screens/user/AddCarScreen.tsx - VERSIONE MODERNA E RAFFINATA
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
    Key,
    Hash,
    Palette,
    Check,
    ChevronRight,
    ChevronLeft,
    Gauge,
    X,
    Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { db, auth } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { useAppThemeManager } from '../../hooks/useTheme';
import { useCarsStore } from '../../store/useCarsStore';

const { width: screenWidth } = Dimensions.get('window');

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

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        switch (step) {
            case 0:
                if (!formData.make.trim()) newErrors.make = 'Marca obbligatoria';
                if (!formData.model.trim()) newErrors.model = 'Modello obbligatorio';
                if (!formData.year.trim()) {
                    newErrors.year = 'Anno obbligatorio';
                } else if (parseInt(formData.year) < 1900 || parseInt(formData.year) > new Date().getFullYear() + 1) {
                    newErrors.year = 'Anno non valido';
                }
                break;
            case 1:
                if (!formData.licensePlate.trim()) newErrors.licensePlate = 'Targa obbligatoria';
                break;
            case 2:
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

            const now = new Date();

            const firestoreData = {
                userId: user.uid,
                ownerId: user.uid,
                make: formData.make.trim(),
                model: formData.model.trim(),
                year: parseInt(formData.year),
                color: formData.color,
                licensePlate: formData.licensePlate.trim().toUpperCase(),
                vin: formData.vin.trim().toUpperCase() || null,
                purchaseDate: formData.purchaseDate,
                purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
                purchaseMileage: formData.purchaseMileage ? parseInt(formData.purchaseMileage) : 0,
                currentMileage: formData.currentMileage ? parseInt(formData.currentMileage) :
                    formData.purchaseMileage ? parseInt(formData.purchaseMileage) : 0,
                insuranceCompany: formData.insuranceCompany.trim() || null,
                insuranceExpiry: formData.insuranceExpiry || null,
                notes: formData.notes.trim() || null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                status: 'active',
                isActive: true,
            };

            const docRef = await addDoc(collection(db, 'vehicles'), firestoreData);

            const localStoreData = {
                id: docRef.id,
                userId: user.uid,
                ownerId: user.uid,
                make: formData.make.trim(),
                model: formData.model.trim(),
                year: parseInt(formData.year),
                color: formData.color,
                licensePlate: formData.licensePlate.trim().toUpperCase(),
                vin: formData.vin.trim().toUpperCase() || null,
                purchaseDate: formData.purchaseDate,
                purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
                purchaseMileage: formData.purchaseMileage ? parseInt(formData.purchaseMileage) : 0,
                currentMileage: formData.currentMileage ? parseInt(formData.currentMileage) :
                    formData.purchaseMileage ? parseInt(formData.purchaseMileage) : 0,
                insuranceCompany: formData.insuranceCompany.trim() || null,
                insuranceExpiry: formData.insuranceExpiry || null,
                notes: formData.notes.trim() || null,
                createdAt: now,
                updatedAt: now,
                status: 'active',
                isActive: true,
            };

            addCarToStore(localStoreData as any);

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
                        <TouchableOpacity 
                            onPress={() => setShowColorPicker(false)}
                            style={styles.closeButton}
                        >
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
                                    <View style={styles.checkmarkWrapper}>
                                        <Check size={20} color={color.value === '#FFFFFF' ? '#000' : '#FFF'} strokeWidth={3} />
                                    </View>
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
            case 0:
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.stepHeader}>
                            <Car size={28} color={colors.primary} strokeWidth={2.5} />
                            <Text style={[styles.stepTitle, { color: colors.onSurface }]}>
                                Informazioni Base
                            </Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Marca *
                            </Text>
                            <View style={[styles.modernInput, {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: errors.make ? colors.error : 'transparent',
                            }]}>
                                <Car size={20} color={colors.primary} strokeWidth={2.5} />
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

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Modello *
                            </Text>
                            <View style={[styles.modernInput, {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: errors.model ? colors.error : 'transparent',
                            }]}>
                                <Car size={20} color={colors.primary} strokeWidth={2.5} />
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

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Anno *
                            </Text>
                            <View style={[styles.modernInput, {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: errors.year ? colors.error : 'transparent',
                            }]}>
                                <Calendar size={20} color={colors.primary} strokeWidth={2.5} />
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

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Colore
                            </Text>
                            <TouchableOpacity
                                style={[styles.modernInput, {
                                    backgroundColor: colors.surfaceVariant,
                                }]}
                                onPress={() => setShowColorPicker(true)}
                            >
                                <Palette size={20} color={colors.primary} strokeWidth={2.5} />
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

            case 1:
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.stepHeader}>
                            <Key size={28} color={colors.primary} strokeWidth={2.5} />
                            <Text style={[styles.stepTitle, { color: colors.onSurface }]}>
                                Identificazione
                            </Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Targa *
                            </Text>
                            <View style={[styles.modernInput, {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: errors.licensePlate ? colors.error : 'transparent',
                            }]}>
                                <Key size={20} color={colors.primary} strokeWidth={2.5} />
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

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Numero Telaio (VIN)
                            </Text>
                            <View style={[styles.modernInput, {
                                backgroundColor: colors.surfaceVariant,
                            }]}>
                                <Hash size={20} color={colors.primary} strokeWidth={2.5} />
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

            case 2:
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.stepHeader}>
                            <DollarSign size={28} color={colors.primary} strokeWidth={2.5} />
                            <Text style={[styles.stepTitle, { color: colors.onSurface }]}>
                                Informazioni Acquisto
                            </Text>
                        </View>

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

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Prezzo di Acquisto
                            </Text>
                            <View style={[styles.modernInput, {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: errors.purchasePrice ? colors.error : 'transparent',
                            }]}>
                                <DollarSign size={20} color={colors.primary} strokeWidth={2.5} />
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

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Chilometraggio all'Acquisto
                            </Text>
                            <View style={[styles.modernInput, {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: errors.purchaseMileage ? colors.error : 'transparent',
                            }]}>
                                <Gauge size={20} color={colors.primary} strokeWidth={2.5} />
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

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Chilometraggio Attuale
                            </Text>
                            <View style={[styles.modernInput, {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: errors.currentMileage ? colors.error : 'transparent',
                            }]}>
                                <Gauge size={20} color={colors.primary} strokeWidth={2.5} />
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

            case 3:
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.stepHeader}>
                            <FileText size={28} color={colors.primary} strokeWidth={2.5} />
                            <Text style={[styles.stepTitle, { color: colors.onSurface }]}>
                                Assicurazione e Note
                            </Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Compagnia Assicurativa
                            </Text>
                            <View style={[styles.modernInput, {
                                backgroundColor: colors.surfaceVariant,
                            }]}>
                                <FileText size={20} color={colors.primary} strokeWidth={2.5} />
                                <TextInput
                                    style={[styles.input, { color: colors.onSurface }]}
                                    placeholder="es. Generali, Allianz"
                                    placeholderTextColor={colors.onSurfaceVariant}
                                    value={formData.insuranceCompany}
                                    onChangeText={(text) => updateFormData('insuranceCompany', text)}
                                />
                            </View>
                        </View>

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

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                                Note
                            </Text>
                            <View style={[styles.textAreaContainer, {
                                backgroundColor: colors.surfaceVariant,
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
                backgroundColor="transparent"
                translucent
            />

            <LinearGradient
                colors={isDark 
                    ? ['#1e1b4b', '#312e81'] 
                    : ['#6366f1', '#8b5cf6']
                }
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <ArrowLeft size={24} color="#fff" strokeWidth={2.5} />
                    </TouchableOpacity>

                    <View style={styles.headerTitleWrapper}>
                        <Sparkles size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.headerTitle}>Aggiungi Veicolo</Text>
                    </View>

                    <View style={styles.headerRight} />
                </View>
            </LinearGradient>

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
                                            backgroundColor: isActive || isCompleted 
                                                ? colors.primary 
                                                : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                        },
                                    ]}
                                >
                                    {isCompleted ? (
                                        <Check size={18} color="#FFF" strokeWidth={3} />
                                    ) : (
                                        <Icon 
                                            size={18} 
                                            color={isActive ? '#FFF' : colors.onSurfaceVariant} 
                                            strokeWidth={2.5}
                                        />
                                    )}
                                </View>
                                <Text
                                    style={[
                                        styles.stepLabel,
                                        {
                                            color: isActive ? colors.primary : colors.onSurfaceVariant,
                                            fontWeight: isActive ? '700' : '500',
                                        },
                                    ]}
                                >
                                    {step.title}
                                </Text>
                            </View>

                            {index < steps.length - 1 && (
                                <View style={styles.stepConnectorWrapper}>
                                    <View
                                        style={[
                                            styles.stepConnector,
                                            {
                                                backgroundColor: isCompleted 
                                                    ? colors.primary 
                                                    : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                            },
                                        ]}
                                    />
                                </View>
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

            <View style={[styles.footer, { 
                backgroundColor: colors.surface,
                borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            }]}>
                {currentStep > 0 && (
                    <TouchableOpacity
                        style={[styles.footerButton, styles.backFooterButton, {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        }]}
                        onPress={handleBack}
                        disabled={isLoading}
                    >
                        <ChevronLeft size={20} color={colors.onSurface} strokeWidth={2.5} />
                        <Text style={[styles.backButtonText, { color: colors.onSurface }]}>
                            Indietro
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[
                        styles.footerButton,
                        currentStep === 0 && styles.fullWidthButton,
                    ]}
                    onPress={handleNext}
                    disabled={isLoading}
                >
                    <LinearGradient
                        colors={['#6366f1', '#8b5cf6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.nextButtonGradient}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Text style={styles.nextButtonText}>
                                    {currentStep === 3 ? 'Salva Veicolo' : 'Avanti'}
                                </Text>
                                {currentStep === 3 ? (
                                    <Save size={20} color="#FFF" strokeWidth={2.5} />
                                ) : (
                                    <ChevronRight size={20} color="#FFF" strokeWidth={2.5} />
                                )}
                            </>
                        )}
                    </LinearGradient>
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
    headerGradient: {
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: -0.5,
    },
    headerRight: {
        width: 44,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    stepIndicator: {
        alignItems: 'center',
    },
    stepCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    stepLabel: {
        fontSize: 11,
    },
    stepConnectorWrapper: {
        flex: 1,
        alignItems: 'center',
        marginBottom: 26,
    },
    stepConnector: {
        width: '100%',
        height: 3,
        borderRadius: 1.5,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    stepContent: {
        paddingBottom: 20,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 28,
        gap: 12,
    },
    stepTitle: {
        fontSize: 26,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 10,
        letterSpacing: -0.2,
    },
    modernInput: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 2,
    },
    input: {
        flex: 1,
        fontSize: 16,
        marginLeft: 12,
        fontWeight: '500',
    },
    currency: {
        fontSize: 16,
        fontWeight: '600',
    },
    helperText: {
        fontSize: 13,
        marginTop: 6,
        marginLeft: 4,
    },
    errorText: {
        fontSize: 13,
        marginTop: 6,
        marginLeft: 4,
        fontWeight: '500',
    },
    colorPreview: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
    },
    colorSwatch: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        marginRight: 10,
    },
    colorName: {
        fontSize: 16,
        fontWeight: '500',
    },
    textAreaContainer: {
        paddingHorizontal: 18,
        paddingVertical: 16,
        borderRadius: 16,
    },
    textArea: {
        fontSize: 16,
        minHeight: 120,
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
    },
    footerButton: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    backFooterButton: {
        flex: 1,
    },
    fullWidthButton: {
        flex: 1,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    nextButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 24,
        gap: 10,
    },
    nextButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: -0.3,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorPickerModal: {
        width: screenWidth - 48,
        maxWidth: 400,
        borderRadius: 24,
        padding: 24,
    },
    colorPickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    colorPickerTitle: {
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'center',
    },
    colorOption: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorOptionSelected: {
        borderWidth: 4,
        transform: [{ scale: 1.1 }],
    },
    checkmarkWrapper: {
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 20,
        padding: 4,
    },
});

export default AddCarScreen;

// src/screens/user/AddCarScreen.tsx - FORM COMPLETO FIREBASE + RESPONSIVE
import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    useWindowDimensions,
    Image,
} from 'react-native';
import { TextInput, ProgressBar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Car,
    FileText,
    Settings as SettingsIcon,
    Image as ImageIcon,
    X,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

// Firebase
import {
    collection,
    addDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { useStore } from '../../store';

// ============================================================
// INTERFACES
// ============================================================
interface VehicleFormData {
    // Basic Info
    make: string;
    model: string;
    year: string;
    licensePlate: string;
    vin: string;
    color: string;

    // Technical Specs
    fuel: string;
    transmission: string;
    engineSize: string;
    power: string;
    bodyType: string;
    doors: string;
    seats: string;

    // Mileage & Purchase
    currentMileage: string;
    purchaseDate: string;
    purchasePrice: string;
    purchaseMileage: string;

    // Insurance
    insuranceCompany: string;
    insurancePolicy: string;
    insuranceExpiry: string;

    // Optional
    optionals: string[];
    notes: string;
}

// ============================================================
// ADDCARSCREEN COMPONENT
// ============================================================
const AddCarScreen = () => {
    const navigation = useNavigation();
    const { user } = useStore();
    const { width } = useWindowDimensions();

    // Responsive
    const isDesktop = width >= 1024;
    const isTablet = width >= 768 && width < 1024;
    const isMobile = width < 768;

    // Form state
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<string[]>([]);

    const [formData, setFormData] = useState<VehicleFormData>({
        make: '',
        model: '',
        year: '',
        licensePlate: '',
        vin: '',
        color: '',
        fuel: 'benzina',
        transmission: 'manuale',
        engineSize: '',
        power: '',
        bodyType: '',
        doors: '4',
        seats: '5',
        currentMileage: '',
        purchaseDate: '',
        purchasePrice: '',
        purchaseMileage: '',
        insuranceCompany: '',
        insurancePolicy: '',
        insuranceExpiry: '',
        optionals: [],
        notes: '',
    });

    const [errors, setErrors] = useState<Partial<VehicleFormData>>({});

    const totalSteps = 4;
    const progress = (currentStep + 1) / totalSteps;

    // ============================================================
    // VALIDATION
    // ============================================================
    const validateStep = (): boolean => {
        const newErrors: Partial<VehicleFormData> = {};

        if (currentStep === 0) {
            // Basic Info
            if (!formData.make.trim()) newErrors.make = 'Marca richiesta';
            if (!formData.model.trim()) newErrors.model = 'Modello richiesto';
            if (!formData.year.trim()) newErrors.year = 'Anno richiesto';
            else if (parseInt(formData.year) < 1900 || parseInt(formData.year) > new Date().getFullYear() + 1) {
                newErrors.year = 'Anno non valido';
            }
            if (!formData.licensePlate.trim()) newErrors.licensePlate = 'Targa richiesta';
        }

        if (currentStep === 1) {
            // Technical Specs
            if (!formData.fuel) newErrors.fuel = 'Tipo carburante richiesto';
            if (!formData.transmission) newErrors.transmission = 'Tipo cambio richiesto';
            if (formData.engineSize && isNaN(parseInt(formData.engineSize))) {
                newErrors.engineSize = 'Valore non valido';
            }
            if (formData.power && isNaN(parseInt(formData.power))) {
                newErrors.power = 'Valore non valido';
            }
        }

        if (currentStep === 2) {
            // Mileage
            if (!formData.currentMileage.trim()) newErrors.currentMileage = 'Chilometraggio richiesto';
            else if (isNaN(parseInt(formData.currentMileage))) {
                newErrors.currentMileage = 'Valore non valido';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ============================================================
    // NAVIGATION
    // ============================================================
    const handleNext = () => {
        if (validateStep()) {
            if (currentStep < totalSteps - 1) {
                setCurrentStep(currentStep + 1);
            } else {
                handleSubmit();
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        } else {
            navigation.goBack();
        }
    };

    // ============================================================
    // IMAGE PICKER
    // ============================================================
    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 0.8,
                aspect: [16, 9],
            });

            if (!result.canceled && result.assets) {
                const newImages = result.assets.map(asset => asset.uri);
                setImages([...images, ...newImages]);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Errore', 'Impossibile selezionare l\'immagine');
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    // ============================================================
    // SUBMIT TO FIREBASE
    // ============================================================
    const handleSubmit = async () => {
        if (!user?.id) {
            Alert.alert('Errore', 'Utente non autenticato');
            return;
        }

        setLoading(true);

        try {
            // Upload images first
            const uploadedImageUrls: string[] = [];

            for (const imageUri of images) {
                try {
                    const response = await fetch(imageUri);
                    const blob = await response.blob();

                    const filename = `vehicles/${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
                    const storageRef = ref(storage, filename);

                    await uploadBytes(storageRef, blob);
                    const downloadUrl = await getDownloadURL(storageRef);

                    uploadedImageUrls.push(downloadUrl);
                } catch (error) {
                    console.error('Error uploading image:', error);
                }
            }

            // Prepare vehicle data
            const vehicleData = {
                // Owner
                ownerId: user.id,
                ownerName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),

                // Basic Info
                make: formData.make.trim(),
                model: formData.model.trim(),
                year: parseInt(formData.year),
                licensePlate: formData.licensePlate.trim().toUpperCase(),
                vin: formData.vin.trim().toUpperCase() || null,
                color: formData.color.trim() || null,

                // Technical Specs
                fuel: formData.fuel,
                transmission: formData.transmission,
                engineSize: formData.engineSize ? parseInt(formData.engineSize) : null,
                power: formData.power ? parseInt(formData.power) : null,
                bodyType: formData.bodyType || null,
                doors: formData.doors ? parseInt(formData.doors) : null,
                seats: formData.seats ? parseInt(formData.seats) : null,

                // Mileage & Purchase
                currentMileage: parseInt(formData.currentMileage),
                purchaseDate: formData.purchaseDate || null,
                purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
                purchaseMileage: formData.purchaseMileage ? parseInt(formData.purchaseMileage) : null,

                // Insurance
                insuranceCompany: formData.insuranceCompany.trim() || null,
                insurancePolicy: formData.insurancePolicy.trim() || null,
                insuranceExpiry: formData.insuranceExpiry || null,

                // Optional & Notes
                optionals: formData.optionals,
                notes: formData.notes.trim() || null,

                // Images
                images: uploadedImageUrls.map((url, index) => ({
                    id: `img_${Date.now()}_${index}`,
                    url,
                    uploadedAt: new Date(),
                    isMain: index === 0,
                })),
                mainImageUrl: uploadedImageUrls[0] || null,
                imageUrl: uploadedImageUrls[0] || null,

                // Privacy
                privacySettings: {
                    showPersonalInfo: true,
                    showMileage: true,
                    showMaintenanceHistory: true,
                    showMaintenanceDetails: false,
                    showCosts: false,
                    showMechanics: false,
                    showDocuments: false,
                    showPhotos: true,
                    allowDataTransfer: false,
                    requirePinForTransfer: true,
                },

                // Metadata
                maintenanceCount: 0,
                documentsCount: 0,
                expensesTotal: 0,
                forSale: false,
                transferPending: false,
                isActive: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            // Add to Firestore
            const docRef = await addDoc(collection(db, 'vehicles'), vehicleData);

            console.log('✅ Vehicle added:', docRef.id);

            Alert.alert(
                'Successo! 🎉',
                'Veicolo aggiunto con successo',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );

        } catch (error) {
            console.error('Error adding vehicle:', error);
            Alert.alert('Errore', 'Impossibile aggiungere il veicolo. Riprova.');
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // UPDATE FORM DATA
    // ============================================================
    const updateField = (field: keyof VehicleFormData, value: string) => {
        setFormData({ ...formData, [field]: value });
        setErrors({ ...errors, [field]: '' });
    };

    // ============================================================
    // RENDER STEPS
    // ============================================================
    const renderStep0 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Informazioni Base</Text>
            <Text style={styles.stepSubtitle}>
                Inserisci i dati principali del veicolo
            </Text>

            <View style={[
                styles.formGrid,
                (isDesktop || isTablet) && styles.formGridDouble,
            ]}>
                {/* Marca */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        mode="outlined"
                        label="Marca *"
                        value={formData.make}
                        onChangeText={(text) => updateField('make', text)}
                        error={!!errors.make}
                        disabled={loading}
                        placeholder="es. Fiat"
                        style={styles.input}
                        theme={{ colors: { primary: '#3b82f6' } }}
                    />
                    {errors.make && <Text style={styles.errorText}>{errors.make}</Text>}
                </View>

                {/* Modello */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        mode="outlined"
                        label="Modello *"
                        value={formData.model}
                        onChangeText={(text) => updateField('model', text)}
                        error={!!errors.model}
                        disabled={loading}
                        placeholder="es. Panda"
                        style={styles.input}
                        theme={{ colors: { primary: '#3b82f6' } }}
                    />
                    {errors.model && <Text style={styles.errorText}>{errors.model}</Text>}
                </View>

                {/* Anno */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        mode="outlined"
                        label="Anno *"
                        value={formData.year}
                        onChangeText={(text) => updateField('year', text)}
                        error={!!errors.year}
                        disabled={loading}
                        placeholder="2020"
                        keyboardType="numeric"
                        maxLength={4}
                        style={styles.input}
                        theme={{ colors: { primary: '#3b82f6' } }}
                    />
                    {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}
                </View>

                {/* Targa */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        mode="outlined"
                        label="Targa *"
                        value={formData.licensePlate}
                        onChangeText={(text) => updateField('licensePlate', text.toUpperCase())}
                        error={!!errors.licensePlate}
                        disabled={loading}
                        placeholder="AB123CD"
                        autoCapitalize="characters"
                        style={styles.input}
                        theme={{ colors: { primary: '#3b82f6' } }}
                    />
                    {errors.licensePlate && <Text style={styles.errorText}>{errors.licensePlate}</Text>}
                </View>

                {/* VIN */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        mode="outlined"
                        label="VIN (opzionale)"
                        value={formData.vin}
                        onChangeText={(text) => updateField('vin', text.toUpperCase())}
                        disabled={loading}
                        placeholder="17 caratteri"
                        autoCapitalize="characters"
                        maxLength={17}
                        style={styles.input}
                        theme={{ colors: { primary: '#3b82f6' } }}
                    />
                </View>

                {/* Colore */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        mode="outlined"
                        label="Colore (opzionale)"
                        value={formData.color}
                        onChangeText={(text) => updateField('color', text)}
                        disabled={loading}
                        placeholder="es. Nero Metallizzato"
                        style={styles.input}
                        theme={{ colors: { primary: '#3b82f6' } }}
                    />
                </View>
            </View>
        </View>
    );

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Specifiche Tecniche</Text>
            <Text style={styles.stepSubtitle}>
                Dettagli tecnici del veicolo
            </Text>

            <View style={[
                styles.formGrid,
                (isDesktop || isTablet) && styles.formGridDouble,
            ]}>
                {/* Carburante */}
                <View style={styles.inputWrapper}>
                    <Text style={styles.selectLabel}>Carburante *</Text>
                    <View style={styles.selectContainer}>
                        {['benzina', 'diesel', 'gpl', 'metano', 'ibrida', 'elettrica'].map((fuel) => (
                            <TouchableOpacity
                                key={fuel}
                                style={[
                                    styles.selectOption,
                                    formData.fuel === fuel && styles.selectOptionActive,
                                ]}
                                onPress={() => updateField('fuel', fuel)}
                                disabled={loading}
                            >
                                <Text style={[
                                    styles.selectOptionText,
                                    formData.fuel === fuel && styles.selectOptionTextActive,
                                ]}>
                                    {fuel.charAt(0).toUpperCase() + fuel.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Cambio */}
                <View style={styles.inputWrapper}>
                    <Text style={styles.selectLabel}>Cambio *</Text>
                    <View style={styles.selectContainer}>
                        {['manuale', 'automatico', 'semiautomatico'].map((trans) => (
                            <TouchableOpacity
                                key={trans}
                                style={[
                                    styles.selectOption,
                                    formData.transmission === trans && styles.selectOptionActive,
                                ]}
                                onPress={() => updateField('transmission', trans)}
                                disabled={loading}
                            >
                                <Text style={[
                                    styles.selectOptionText,
                                    formData.transmission === trans && styles.selectOptionTextActive,
                                ]}>
                                    {trans.charAt(0).toUpperCase() + trans.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Cilindrata */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        mode="outlined"
                        label="Cilindrata (cc)"
                        value={formData.engineSize}
                        onChangeText={(text) => updateField('engineSize', text)}
                        error={!!errors.engineSize}
                        disabled={loading}
                        placeholder="1600"
                        keyboardType="numeric"
                        style={styles.input}
                        theme={{ colors: { primary: '#3b82f6' } }}
                    />
                    {errors.engineSize && <Text style={styles.errorText}>{errors.engineSize}</Text>}
                </View>

                {/* Potenza */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        mode="outlined"
                        label="Potenza (CV)"
                        value={formData.power}
                        onChangeText={(text) => updateField('power', text)}
                        error={!!errors.power}
                        disabled={loading}
                        placeholder="110"
                        keyboardType="numeric"
                        style={styles.input}
                        theme={{ colors: { primary: '#3b82f6' } }}
                    />
                    {errors.power && <Text style={styles.errorText}>{errors.power}</Text>}
                </View>

                {/* Tipo carrozzeria */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        mode="outlined"
                        label="Tipo Carrozzeria"
                        value={formData.bodyType}
                        onChangeText={(text) => updateField('bodyType', text)}
                        disabled={loading}
                        placeholder="es. Berlina"
                        style={styles.input}
                        theme={{ colors: { primary: '#3b82f6' } }}
                    />
                </View>

                {/* Porte */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        mode="outlined"
                        label="Numero Porte"
                        value={formData.doors}
                        onChangeText={(text) => updateField('doors', text)}
                        disabled={loading}
                        placeholder="4"
                        keyboardType="numeric"
                        maxLength={1}
                        style={styles.input}
                        theme={{ colors: { primary: '#3b82f6' } }}
                    />
                </View>

                {/* Posti */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        mode="outlined"
                        label="Numero Posti"
                        value={formData.seats}
                        onChangeText={(text) => updateField('seats', text)}
                        disabled={loading}
                        placeholder="5"
                        keyboardType="numeric"
                        maxLength={1}
                        style={styles.input}
                        theme={{ colors: { primary: '#3b82f6' } }}
                    />
                </View>
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Chilometraggio e Acquisto</Text>
            <Text style={styles.stepSubtitle}>
                Informazioni su chilometraggio e acquisto
            </Text>

            <View style={[
                styles.formGrid,
                (isDesktop || isTablet) && styles.formGridDouble,
            ]}>
                {/* Chilometraggio attuale */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        mode="outlined"
                        label="Chilometraggio Attuale *"
                        value={formData.currentMileage}
                        onChangeText={(text) => updateField('currentMileage', text)}
                        error={!!errors.currentMileage}
                        disabled={loading}
                        placeholder="45000"
                        keyboardType="numeric"
                        style={styles.input}
                        theme={{ colors: { primary: '#3b82f6' } }}
                    />
                    {errors.currentMileage && <Text style={styles.errorText}>{errors.currentMileage}</Text>}
                </View>

                {/* Data acquisto */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        mode="outlined"
                        label="Data Acquisto (gg/mm/aaaa)"
                        value={formData.purchaseDate}
                        onChangeText={(text) => updateField('purchaseDate', text)}
                        disabled={loading}
                        placeholder="01/01/2020"
                        keyboardType="numeric"
                        style={styles.input}
                        theme={{ colors: { primary: '#3b82f6' } }}
                    />
                </View>

                {/* Prezzo acquisto */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        mode="outlined"
                        label="Prezzo Acquisto (€)"
                        value={formData.purchasePrice}
                        onChangeText={(text) => updateField('purchasePrice', text)}
                        disabled={loading}
                        placeholder="15000"
                        keyboardType="numeric"
                        style={styles.input}
                        theme={{ colors: { primary: '#3b82f6' } }}
                    />
                </View>

                {/* Km acquisto */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        mode="outlined"
                        label="Km all'Acquisto"
                        value={formData.purchaseMileage}
                        onChangeText={(text) => updateField('purchaseMileage', text)}
                        disabled={loading}
                        placeholder="25000"
                        keyboardType="numeric"
                        style={styles.input}
                        theme={{ colors: { primary: '#3b82f6' } }}
                    />
                </View>

                {/* Compagnia assicurazione */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        mode="outlined"
                        label="Compagnia Assicurativa"
                        value={formData.insuranceCompany}
                        onChangeText={(text) => updateField('insuranceCompany', text)}
                        disabled={loading}
                        placeholder="es. Generali"
                        style={styles.input}
                        theme={{ colors: { primary: '#3b82f6' } }}
                    />
                </View>

                {/* Polizza */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        mode="outlined"
                        label="Numero Polizza"
                        value={formData.insurancePolicy}
                        onChangeText={(text) => updateField('insurancePolicy', text)}
                        disabled={loading}
                        placeholder="123456789"
                        style={styles.input}
                        theme={{ colors: { primary: '#3b82f6' } }}
                    />
                </View>

                {/* Scadenza assicurazione */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        mode="outlined"
                        label="Scadenza Assicurazione (gg/mm/aaaa)"
                        value={formData.insuranceExpiry}
                        onChangeText={(text) => updateField('insuranceExpiry', text)}
                        disabled={loading}
                        placeholder="31/12/2024"
                        keyboardType="numeric"
                        style={styles.input}
                        theme={{ colors: { primary: '#3b82f6' } }}
                    />
                </View>
            </View>
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Foto e Note</Text>
            <Text style={styles.stepSubtitle}>
                Aggiungi foto del veicolo e note aggiuntive
            </Text>

            {/* Image Picker */}
            <View style={styles.imageSection}>
                <TouchableOpacity
                    style={styles.imagePickerButton}
                    onPress={pickImage}
                    disabled={loading}
                >
                    <ImageIcon size={32} color="#3b82f6" />
                    <Text style={styles.imagePickerText}>Aggiungi Foto</Text>
                    <Text style={styles.imagePickerSubtext}>
                        {images.length === 0 ? 'Nessuna foto caricata' : `${images.length} foto`}
                    </Text>
                </TouchableOpacity>

                {/* Images Grid */}
                {images.length > 0 && (
                    <View style={styles.imagesGrid}>
                        {images.map((uri, index) => (
                            <View key={index} style={styles.imageContainer}>
                                <Image source={{ uri }} style={styles.imagePreview} />
                                <TouchableOpacity
                                    style={styles.removeImageButton}
                                    onPress={() => removeImage(index)}
                                >
                                    <X size={16} color="#fff" />
                                </TouchableOpacity>
                                {index === 0 && (
                                    <View style={styles.mainImageBadge}>
                                        <Text style={styles.mainImageText}>Principale</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </View>

            {/* Note */}
            <View style={styles.inputWrapper}>
                <TextInput
                    mode="outlined"
                    label="Note (opzionale)"
                    value={formData.notes}
                    onChangeText={(text) => updateField('notes', text)}
                    disabled={loading}
                    placeholder="Informazioni aggiuntive sul veicolo..."
                    multiline
                    numberOfLines={4}
                    style={[styles.input, styles.textArea]}
                    theme={{ colors: { primary: '#3b82f6' } }}
                />
            </View>
        </View>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 0: return renderStep0();
            case 1: return renderStep1();
            case 2: return renderStep2();
            case 3: return renderStep3();
            default: return null;
        }
    };

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={handleBack}
                        disabled={loading}
                    >
                        <ArrowLeft size={24} color="#1e293b" />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Aggiungi Veicolo</Text>
                        <Text style={styles.headerSubtitle}>
                            Passo {currentStep + 1} di {totalSteps}
                        </Text>
                    </View>

                    <View style={styles.headerButton} />
                </View>

                {/* Progress Bar */}
                <ProgressBar
                    progress={progress}
                    color="#3b82f6"
                    style={styles.progressBar}
                />

                {/* Form Content */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[
                        styles.scrollContent,
                        isDesktop && styles.scrollContentDesktop,
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {renderCurrentStep()}
                </ScrollView>

                {/* Footer Buttons */}
                <View style={[
                    styles.footer,
                    isDesktop && styles.footerDesktop,
                ]}>
                    <View style={[
                        styles.footerContent,
                        isDesktop && styles.footerContentDesktop,
                    ]}>
                        {currentStep > 0 && (
                            <TouchableOpacity
                                style={[styles.button, styles.buttonSecondary]}
                                onPress={handleBack}
                                disabled={loading}
                            >
                                <ArrowLeft size={20} color="#64748b" />
                                <Text style={styles.buttonSecondaryText}>Indietro</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.buttonPrimary,
                                loading && styles.buttonDisabled,
                                currentStep === 0 && styles.buttonFull,
                            ]}
                            onPress={handleNext}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.buttonPrimaryText}>
                                        {currentStep === totalSteps - 1 ? 'Completa' : 'Continua'}
                                    </Text>
                                    {currentStep === totalSteps - 1 ? (
                                        <Check size={20} color="#fff" />
                                    ) : (
                                        <ArrowRight size={20} color="#fff" />
                                    )}
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    progressBar: {
        height: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    scrollContentDesktop: {
        maxWidth: 900,
        alignSelf: 'center',
        width: '100%',
        paddingHorizontal: 40,
    },

    // Step Container
    stepContainer: {
        marginBottom: 24,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
    },
    stepSubtitle: {
        fontSize: 15,
        color: '#64748b',
        marginBottom: 24,
    },

    // Form Grid
    formGrid: {
        gap: 16,
    },
    formGridDouble: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    inputWrapper: {
        flex: 1,
        minWidth: 200,
    },
    input: {
        backgroundColor: '#fff',
    },
    textArea: {
        minHeight: 120,
    },
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
        marginLeft: 12,
    },

    // Select Options
    selectLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 12,
    },
    selectContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    selectOption: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    selectOptionActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    selectOptionText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    selectOptionTextActive: {
        color: '#fff',
    },

    // Image Section
    imageSection: {
        marginBottom: 24,
    },
    imagePickerButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
    },
    imagePickerText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3b82f6',
        marginTop: 12,
    },
    imagePickerSubtext: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 4,
    },
    imagesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 16,
    },
    imageContainer: {
        width: 100,
        height: 100,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    removeImageButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainImageBadge: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(59, 130, 246, 0.9)',
        paddingVertical: 4,
    },
    mainImageText: {
        fontSize: 11,
        color: '#fff',
        fontWeight: '600',
        textAlign: 'center',
    },

    // Footer
    footer: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        padding: 16,
    },
    footerDesktop: {
        paddingHorizontal: 40,
    },
    footerContent: {
        flexDirection: 'row',
        gap: 12,
    },
    footerContentDesktop: {
        maxWidth: 900,
        alignSelf: 'center',
        width: '100%',
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
    },
    buttonFull: {
        flex: 1,
    },
    buttonPrimary: {
        backgroundColor: '#3b82f6',
        flex: 2,
    },
    buttonSecondary: {
        backgroundColor: '#f1f5f9',
        flex: 1,
    },
    buttonDisabled: {
        backgroundColor: '#94a3b8',
    },
    buttonPrimaryText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    buttonSecondaryText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
    },
});

export default AddCarScreen;
// src/screens/mechanic/NewAppointmentScreen.tsx
// Versione corretta: fix prop name + gestione caso "nessuna auto esistente"

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    SafeAreaView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
    ArrowLeft,
    Car,
    User,
    FileText,
    Calendar,
    Euro,
    Save,
    Search,
    X,
    Clock,
    CheckCircle,
    Lightbulb,
    Info,
    Plus,
} from 'lucide-react-native';
import { useStore } from '../../store';
import { useWorkshopStore } from '../../store/workshopStore';
import CalendarAppointmentPicker from './CalendarAppointmentPicker';
import UserSearchModal from '../../components/UserSearchModal';
import QuickAddCustomerModal from '../../components/QuickAddCustomerModal';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';

const { width: screenWidth } = Dimensions.get('window');

interface SelectedCustomer {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
}

interface ExistingCar {
    id: string;
    make: string;
    model: string;
    year: string;
    licensePlate: string;
    vin?: string;
    color?: string;
    mileage?: number;
    lastService?: string;
}

const NewAppointmentScreen = () => {
    const navigation = useNavigation();
    const { user, darkMode } = useStore();
    const { addCar, fetchCars } = useWorkshopStore();

    const isDesktop = Platform.OS === 'web' && screenWidth > 768;
    const isTablet = screenWidth >= 768 && screenWidth < 1024;

    // Stati per il form veicolo
    const [vehicleData, setVehicleData] = useState({
        make: '',
        model: '',
        year: '',
        licensePlate: '',
        vin: '',
        color: '',
        mileage: '',
    });

    // Stati per la riparazione
    const [repairData, setRepairData] = useState({
        description: '',
        estimatedCost: '',
        laborCost: '',
        estimatedHours: '',
        notes: '',
    });

    // Stati per date e cliente
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null);

    // ⭐ NUOVI STATI per auto-suggerimento
    const [existingCars, setExistingCars] = useState<ExistingCar[]>([]);
    const [loadingExistingCars, setLoadingExistingCars] = useState(false);
    const [showCarSuggestions, setShowCarSuggestions] = useState(false);
    const [selectedExistingCar, setSelectedExistingCar] = useState<ExistingCar | null>(null);
    const [hasLoadedCars, setHasLoadedCars] = useState(false); // ⭐ Per mostrare messaggio "nessuna auto"

    // Stati UI
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [currentStep, setCurrentStep] = useState(1);

    const theme = {
        background: darkMode ? '#111827' : '#f3f4f6',
        cardBackground: darkMode ? '#1f2937' : '#ffffff',
        text: darkMode ? '#ffffff' : '#000000',
        textSecondary: darkMode ? '#9ca3af' : '#6b7280',
        border: darkMode ? '#374151' : '#e5e7eb',
        inputBackground: darkMode ? '#374151' : '#ffffff',
        placeholderColor: darkMode ? '#9ca3af' : '#6b7280',
        accent: '#2563eb',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
    };

    // ⭐ CARICA AUTO ESISTENTI DEL CLIENTE quando viene selezionato
    useEffect(() => {
        if (selectedCustomer?.id && user?.id) {
            loadCustomerExistingCars();
        } else {
            setExistingCars([]);
            setSelectedExistingCar(null);
            setHasLoadedCars(false);
        }
    }, [selectedCustomer]);

    const loadCustomerExistingCars = async () => {
        if (!selectedCustomer?.id || !user?.id) return;

        setLoadingExistingCars(true);
        setHasLoadedCars(false);
        try {
            const carsRef = collection(db, 'workshopCars');
            const q = query(
                carsRef,
                where('workshopId', '==', user.id),
                where('ownerId', '==', selectedCustomer.id)
            );

            const snapshot = await getDocs(q);
            const cars: ExistingCar[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    make: data.make || '',
                    model: data.model || '',
                    year: data.year || '',
                    licensePlate: data.licensePlate || '',
                    vin: data.vin,
                    color: data.color,
                    mileage: data.mileage,
                    lastService: data.repairs?.[data.repairs?.length - 1]?.description,
                };
            });

            setExistingCars(cars);
            setHasLoadedCars(true);

            // Mostra suggerimenti se ci sono auto, altrimenti mostra messaggio informativo
            if (cars.length > 0) {
                setShowCarSuggestions(true);
            }
        } catch (error) {
            console.error('Error loading existing cars:', error);
            setHasLoadedCars(true);
        } finally {
            setLoadingExistingCars(false);
        }
    };

    // ⭐ APPLICA AUTO ESISTENTE al form
    const applyExistingCar = (car: ExistingCar) => {
        setVehicleData({
            make: car.make,
            model: car.model,
            year: car.year,
            licensePlate: car.licensePlate,
            vin: car.vin || '',
            color: car.color || '',
            mileage: car.mileage?.toString() || '',
        });
        setSelectedExistingCar(car);
        setShowCarSuggestions(false);
        setCurrentStep(3); // Salta direttamente allo step riparazione
    };

    // Validazione step
    const validateStep = (step: number): boolean => {
        const newErrors: { [key: string]: string } = {};

        switch (step) {
            case 1:
                if (!selectedCustomer) {
                    newErrors.customer = 'Seleziona o aggiungi un cliente';
                }
                break;
            case 2:
                if (!vehicleData.make.trim()) newErrors.make = 'Marca richiesta';
                if (!vehicleData.model.trim()) newErrors.model = 'Modello richiesto';
                if (!vehicleData.licensePlate.trim()) newErrors.licensePlate = 'Targa richiesta';
                break;
            case 3:
                if (!repairData.description.trim()) newErrors.description = 'Descrizione richiesta';
                break;
            case 4:
                if (!startDate) newErrors.startDate = 'Seleziona almeno la data di inizio';
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            if (currentStep < 4) {
                setCurrentStep(currentStep + 1);
            } else {
                handleSubmit();
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            navigation.goBack();
        }
    };

    const handleSubmit = async () => {
        if (!validateStep(4) || !user?.id || !selectedCustomer) {
            Alert.alert('Errore', 'Completa tutti i campi obbligatori');
            return;
        }

        setIsSubmitting(true);

        try {
            const now = new Date().toISOString();

            const workshopCarData = {
                make: vehicleData.make.trim(),
                model: vehicleData.model.trim(),
                year: vehicleData.year || new Date().getFullYear().toString(),
                licensePlate: vehicleData.licensePlate.trim().toUpperCase(),
                vin: vehicleData.vin.trim() || null,
                color: vehicleData.color.trim() || null,
                mileage: vehicleData.mileage ? parseInt(vehicleData.mileage) : null,
                owner: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
                ownerId: selectedCustomer.id,
                ownerEmail: selectedCustomer.email,
                ownerPhone: selectedCustomer.phone || null,
                workshopId: user.id,
                mechanicId: user.id, // Aggiungi anche mechanicId per compatibilità
                status: 'in_progress', // Stato della riparazione
                entryDate: now,
                isActive: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                repairs: [
                    {
                        id: `repair_${Date.now()}`,
                        description: repairData.description.trim(),
                        scheduledDate: startDate,
                        deliveryDate: endDate || startDate,
                        totalCost: repairData.estimatedCost ? parseFloat(repairData.estimatedCost) : 0,
                        laborCost: repairData.laborCost ? parseFloat(repairData.laborCost) : 0,
                        estimatedHours: repairData.estimatedHours ? parseFloat(repairData.estimatedHours) : 0,
                        status: 'pending',
                        parts: [],
                        notes: repairData.notes.trim() || null,
                        mechanicId: user.id,
                        createdAt: now,
                        updatedAt: now,
                    },
                ],
            };

            const docRef = await addDoc(collection(db, 'workshopCars'), workshopCarData);
            console.log('✅ Veicolo aggiunto con ID:', docRef.id);

            await fetchCars(user.id);

            Alert.alert(
                'Successo!',
                `${vehicleData.make} ${vehicleData.model} aggiunto all'officina`,
                [{ text: 'OK', onPress: () => navigation.navigate('MechanicDashboard' as never) }]
            );
        } catch (error: any) {
            console.error('❌ Errore salvataggio:', error);
            Alert.alert('Errore', error.message || 'Impossibile salvare il veicolo');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ✅ FIX: Usa onSelectUser invece di onSelect
    const handleCustomerSelect = (customer: any) => {
        setSelectedCustomer(customer);
        setShowCustomerSearch(false);
        setErrors((prev) => ({ ...prev, customer: '' }));
    };

    const removeCustomer = () => {
        setSelectedCustomer(null);
        setExistingCars([]);
        setSelectedExistingCar(null);
        setShowCarSuggestions(false);
        setHasLoadedCars(false);
    };

    // ⭐ RENDER SUGGERIMENTI AUTO ESISTENTI o MESSAGGIO "NESSUNA AUTO"
    const renderCarSuggestionsOrEmptyState = () => {
        // Loading state
        if (loadingExistingCars) {
            return (
                <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border, padding: 24, alignItems: 'center' }]}>
                    <ActivityIndicator size="small" color={theme.accent} />
                    <Text style={[{ color: theme.textSecondary, marginTop: 8, fontSize: 14 }]}>
                        Caricamento auto del cliente...
                    </Text>
                </View>
            );
        }

        // Ha caricato e ci sono auto esistenti
        if (hasLoadedCars && existingCars.length > 0 && showCarSuggestions) {
            return (
                <View style={[styles.suggestionsCard, { backgroundColor: theme.cardBackground, borderColor: theme.accent }]}>
                    <View style={styles.suggestionsHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Lightbulb size={20} color={theme.accent} />
                            <Text style={[styles.suggestionsTitle, { color: theme.text }]}>
                                Auto già in archivio
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowCarSuggestions(false)}>
                            <X size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.suggestionsSubtitle, { color: theme.textSecondary }]}>
                        Questo cliente ha già portato {existingCars.length} {existingCars.length === 1 ? 'auto' : 'auto'}. Seleziona per compilare automaticamente.
                    </Text>

                    <FlatList
                        data={existingCars}
                        keyExtractor={(item) => item.id}
                        horizontal={isDesktop}
                        showsHorizontalScrollIndicator={false}
                        style={{ marginTop: 12 }}
                        contentContainerStyle={{ gap: 12 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.carSuggestionItem,
                                    {
                                        backgroundColor: darkMode ? '#374151' : '#f9fafb',
                                        borderColor: theme.border,
                                        minWidth: isDesktop ? 280 : undefined,
                                    },
                                ]}
                                onPress={() => applyExistingCar(item)}
                            >
                                <View style={styles.carSuggestionIcon}>
                                    <Car size={20} color={theme.accent} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.carSuggestionTitle, { color: theme.text }]}>
                                        {item.make} {item.model}
                                    </Text>
                                    <Text style={[styles.carSuggestionDetails, { color: theme.textSecondary }]}>
                                        {item.licensePlate} • {item.year}
                                    </Text>
                                    {item.lastService && (
                                        <Text style={[styles.carSuggestionLastService, { color: theme.textSecondary }]} numberOfLines={1}>
                                            Ultimo: {item.lastService}
                                        </Text>
                                    )}
                                </View>
                                <CheckCircle size={18} color={theme.success} />
                            </TouchableOpacity>
                        )}
                    />
                </View>
            );
        }

        // ⭐ Ha caricato ma NON ci sono auto - NUOVO MESSAGGIO
        if (hasLoadedCars && existingCars.length === 0) {
            return (
                <View style={[styles.emptyStateCard, { backgroundColor: darkMode ? '#1e3a5f' : '#eff6ff', borderColor: theme.info }]}>
                    <View style={styles.emptyStateHeader}>
                        <Info size={20} color={theme.info} />
                        <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
                            Primo accesso
                        </Text>
                    </View>
                    <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                        Questo cliente non ha ancora portato auto nella tua officina. Compila i dati del veicolo per iniziare.
                    </Text>
                    <TouchableOpacity
                        style={[styles.emptyStateButton, { backgroundColor: theme.accent }]}
                        onPress={() => setCurrentStep(2)}
                    >
                        <Plus size={18} color="#ffffff" />
                        <Text style={styles.emptyStateButtonText}>Aggiungi Veicolo</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return null;
    };

    // Render Step Indicator
    const renderStepIndicator = () => {
        const steps = ['Cliente', 'Veicolo', 'Riparazione', 'Date'];

        return (
            <View style={styles.stepIndicatorContainer}>
                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isActive = stepNumber === currentStep;
                    const isCompleted = stepNumber < currentStep;

                    return (
                        <View key={stepNumber} style={styles.stepItem}>
                            <View
                                style={[
                                    styles.stepCircle,
                                    {
                                        backgroundColor: isActive || isCompleted ? theme.accent : theme.border,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.stepNumber,
                                        { color: isActive || isCompleted ? '#ffffff' : theme.textSecondary },
                                    ]}
                                >
                                    {stepNumber}
                                </Text>
                            </View>
                            <Text
                                style={[
                                    styles.stepLabel,
                                    {
                                        color: isActive ? theme.text : theme.textSecondary,
                                        fontWeight: isActive ? '600' : '400',
                                    },
                                ]}
                            >
                                {step}
                            </Text>
                            {stepNumber < steps.length && (
                                <View
                                    style={[
                                        styles.stepLine,
                                        {
                                            backgroundColor: isCompleted ? theme.accent : theme.border,
                                        },
                                    ]}
                                />
                            )}
                        </View>
                    );
                })}
            </View>
        );
    };

    // Render Step 1: Cliente
    const renderCustomerStep = () => (
        <View style={styles.stepContent}>
            <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <View style={styles.cardHeader}>
                    <User size={20} color={theme.accent} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Cliente</Text>
                </View>

                {!selectedCustomer ? (
                    <View style={styles.emptyState}>
                        <User size={48} color={theme.textSecondary} />
                        <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                            Nessun cliente selezionato
                        </Text>
                        <TouchableOpacity
                            style={[styles.primaryButton, { backgroundColor: theme.accent }]}
                            onPress={() => setShowCustomerSearch(true)}
                        >
                            <Search size={20} color="#ffffff" />
                            <Text style={styles.primaryButtonText}>Cerca Cliente Esistente</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.secondaryButton, { borderColor: theme.accent }]}
                            onPress={() => setShowQuickAdd(true)}
                        >
                            <User size={20} color={theme.accent} />
                            <Text style={[styles.secondaryButtonText, { color: theme.accent }]}>
                                Aggiungi Nuovo Cliente
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={[styles.selectedCustomer, { backgroundColor: darkMode ? '#374151' : '#f9fafb' }]}>
                        <View style={styles.customerInfo}>
                            <View style={[styles.customerAvatar, { backgroundColor: theme.accent }]}>
                                <Text style={styles.customerAvatarText}>
                                    {selectedCustomer.firstName[0]}
                                    {selectedCustomer.lastName[0]}
                                </Text>
                            </View>
                            <View style={styles.customerDetails}>
                                <Text style={[styles.customerName, { color: theme.text }]}>
                                    {selectedCustomer.firstName} {selectedCustomer.lastName}
                                </Text>
                                <Text style={[styles.customerContact, { color: theme.textSecondary }]}>
                                    {selectedCustomer.email}
                                </Text>
                                {selectedCustomer.phone && (
                                    <Text style={[styles.customerContact, { color: theme.textSecondary }]}>
                                        {selectedCustomer.phone}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <TouchableOpacity onPress={removeCustomer} style={styles.removeButton}>
                            <X size={20} color={theme.error} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* ⭐ MOSTRA SUGGERIMENTI AUTO o MESSAGGIO se non ci sono auto */}
            {renderCarSuggestionsOrEmptyState()}
        </View>
    );

    // Render Step 2: Veicolo
    const renderVehicleStep = () => (
        <View style={styles.stepContent}>
            <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <View style={styles.cardHeader}>
                    <Car size={20} color={theme.accent} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Dati Veicolo</Text>
                </View>

                {selectedExistingCar && (
                    <View style={[styles.infoBar, { backgroundColor: darkMode ? '#1e3a5f' : '#e0f2fe' }]}>
                        <CheckCircle size={16} color={theme.success} />
                        <Text style={[styles.infoBarText, { color: theme.text }]}>
                            Auto caricata dall'archivio. Puoi modificare i dati se necessario.
                        </Text>
                    </View>
                )}

                <View style={styles.formGrid}>
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Marca *</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: theme.inputBackground,
                                    borderColor: errors.make ? theme.error : theme.border,
                                    color: theme.text,
                                },
                            ]}
                            value={vehicleData.make}
                            onChangeText={(text) => {
                                setVehicleData({ ...vehicleData, make: text });
                                setErrors({ ...errors, make: '' });
                            }}
                            placeholder="Es. Ford"
                            placeholderTextColor={theme.placeholderColor}
                        />
                        {errors.make && (
                            <Text style={[styles.errorText, { color: theme.error }]}>{errors.make}</Text>
                        )}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Modello *</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: theme.inputBackground,
                                    borderColor: errors.model ? theme.error : theme.border,
                                    color: theme.text,
                                },
                            ]}
                            value={vehicleData.model}
                            onChangeText={(text) => {
                                setVehicleData({ ...vehicleData, model: text });
                                setErrors({ ...errors, model: '' });
                            }}
                            placeholder="Es. Fiesta"
                            placeholderTextColor={theme.placeholderColor}
                        />
                        {errors.model && (
                            <Text style={[styles.errorText, { color: theme.error }]}>{errors.model}</Text>
                        )}
                    </View>

                    <View style={[styles.formGroup, isDesktop && styles.formGroupHalf]}>
                        <Text style={[styles.label, { color: theme.text }]}>Anno</Text>
                        <TextInput
                            style={[
                                styles.input,
                                { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text },
                            ]}
                            value={vehicleData.year}
                            onChangeText={(text) => setVehicleData({ ...vehicleData, year: text })}
                            placeholder="2020"
                            placeholderTextColor={theme.placeholderColor}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={[styles.formGroup, isDesktop && styles.formGroupHalf]}>
                        <Text style={[styles.label, { color: theme.text }]}>Targa *</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: theme.inputBackground,
                                    borderColor: errors.licensePlate ? theme.error : theme.border,
                                    color: theme.text,
                                },
                            ]}
                            value={vehicleData.licensePlate}
                            onChangeText={(text) => {
                                setVehicleData({ ...vehicleData, licensePlate: text.toUpperCase() });
                                setErrors({ ...errors, licensePlate: '' });
                            }}
                            placeholder="XX123XX"
                            placeholderTextColor={theme.placeholderColor}
                            autoCapitalize="characters"
                        />
                        {errors.licensePlate && (
                            <Text style={[styles.errorText, { color: theme.error }]}>{errors.licensePlate}</Text>
                        )}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>VIN (opzionale)</Text>
                        <TextInput
                            style={[
                                styles.input,
                                { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text },
                            ]}
                            value={vehicleData.vin}
                            onChangeText={(text) => setVehicleData({ ...vehicleData, vin: text })}
                            placeholder="17 caratteri"
                            placeholderTextColor={theme.placeholderColor}
                        />
                    </View>

                    <View style={[styles.formGroup, isDesktop && styles.formGroupHalf]}>
                        <Text style={[styles.label, { color: theme.text }]}>Colore</Text>
                        <TextInput
                            style={[
                                styles.input,
                                { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text },
                            ]}
                            value={vehicleData.color}
                            onChangeText={(text) => setVehicleData({ ...vehicleData, color: text })}
                            placeholder="Es. Bianco"
                            placeholderTextColor={theme.placeholderColor}
                        />
                    </View>

                    <View style={[styles.formGroup, isDesktop && styles.formGroupHalf]}>
                        <Text style={[styles.label, { color: theme.text }]}>Chilometraggio</Text>
                        <TextInput
                            style={[
                                styles.input,
                                { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text },
                            ]}
                            value={vehicleData.mileage}
                            onChangeText={(text) => setVehicleData({ ...vehicleData, mileage: text })}
                            placeholder="80000"
                            placeholderTextColor={theme.placeholderColor}
                            keyboardType="numeric"
                        />
                    </View>
                </View>
            </View>
        </View>
    );

    // Render Step 3: Riparazione
    const renderRepairStep = () => (
        <View style={styles.stepContent}>
            <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <View style={styles.cardHeader}>
                    <FileText size={20} color={theme.accent} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Dettagli Riparazione</Text>
                </View>

                <View style={styles.formGrid}>
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Descrizione Intervento *</Text>
                        <TextInput
                            style={[
                                styles.input,
                                styles.textArea,
                                {
                                    backgroundColor: theme.inputBackground,
                                    borderColor: errors.description ? theme.error : theme.border,
                                    color: theme.text,
                                },
                            ]}
                            placeholder="Descrivi l'intervento da effettuare"
                            placeholderTextColor={theme.placeholderColor}
                            value={repairData.description}
                            onChangeText={(text) => {
                                setRepairData({ ...repairData, description: text });
                                setErrors({ ...errors, description: '' });
                            }}
                            multiline
                            numberOfLines={4}
                        />
                        {errors.description && (
                            <Text style={[styles.errorText, { color: theme.error }]}>{errors.description}</Text>
                        )}
                    </View>

                    <View style={[styles.formRow, { flexWrap: isDesktop ? 'nowrap' : 'wrap' }]}>
                        <View style={[styles.formGroup, { flex: 1, minWidth: 200 }]}>
                            <Text style={[styles.label, { color: theme.text }]}>Preventivo Totale (€)</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text },
                                ]}
                                placeholder="500"
                                placeholderTextColor={theme.placeholderColor}
                                value={repairData.estimatedCost}
                                onChangeText={(text) => setRepairData({ ...repairData, estimatedCost: text })}
                                keyboardType="decimal-pad"
                            />
                        </View>

                        <View style={[styles.formGroup, { flex: 1, minWidth: 200 }]}>
                            <Text style={[styles.label, { color: theme.text }]}>Costo Manodopera (€)</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text },
                                ]}
                                placeholder="150"
                                placeholderTextColor={theme.placeholderColor}
                                value={repairData.laborCost}
                                onChangeText={(text) => setRepairData({ ...repairData, laborCost: text })}
                                keyboardType="decimal-pad"
                            />
                        </View>

                        <View style={[styles.formGroup, { flex: 1, minWidth: 200 }]}>
                            <Text style={[styles.label, { color: theme.text }]}>Ore Stimate</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text },
                                ]}
                                placeholder="3"
                                placeholderTextColor={theme.placeholderColor}
                                value={repairData.estimatedHours}
                                onChangeText={(text) => setRepairData({ ...repairData, estimatedHours: text })}
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Note Aggiuntive</Text>
                        <TextInput
                            style={[
                                styles.input,
                                styles.textArea,
                                { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text },
                            ]}
                            placeholder="Note o specifiche particolari"
                            placeholderTextColor={theme.placeholderColor}
                            value={repairData.notes}
                            onChangeText={(text) => setRepairData({ ...repairData, notes: text })}
                            multiline
                            numberOfLines={3}
                        />
                    </View>
                </View>
            </View>
        </View>
    );

    // Render Step 4: Date
    const renderDateStep = () => (
        <View style={styles.stepContent}>
            <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <View style={styles.cardHeader}>
                    <Calendar size={20} color={theme.accent} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Periodo di Lavorazione</Text>
                </View>

                <CalendarAppointmentPicker
                    startDate={startDate}
                    endDate={endDate}
                    onPeriodChange={(start, end) => {
                        setStartDate(start);
                        setEndDate(end);
                        setErrors({ ...errors, startDate: '' });
                    }}
                    theme={theme}
                />

                {errors.startDate && (
                    <Text style={[styles.errorText, { color: theme.error }]}>{errors.startDate}</Text>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Nuovo Veicolo in Officina</Text>
                <View style={{ width: 40 }} />
            </View>

            {renderStepIndicator()}

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {currentStep === 1 && renderCustomerStep()}
                    {currentStep === 2 && renderVehicleStep()}
                    {currentStep === 3 && renderRepairStep()}
                    {currentStep === 4 && renderDateStep()}
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={[styles.footer, { backgroundColor: theme.cardBackground, borderTopColor: theme.border }]}>
                <View style={styles.footerButtons}>
                    {currentStep > 1 && (
                        <TouchableOpacity
                            style={[styles.footerButton, styles.secondaryButton, { borderColor: theme.border }]}
                            onPress={handleBack}
                            disabled={isSubmitting}
                        >
                            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Indietro</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.footerButton,
                            styles.primaryButton,
                            { backgroundColor: theme.accent, flex: currentStep === 1 ? 1 : undefined },
                        ]}
                        onPress={handleNext}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <>
                                {currentStep === 4 ? <Save size={18} color="#ffffff" /> : null}
                                <Text style={styles.primaryButtonText}>
                                    {currentStep === 4 ? 'Salva' : 'Avanti'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* ✅ FIX: Usa onSelectUser */}
            <UserSearchModal
                visible={showCustomerSearch}
                onClose={() => setShowCustomerSearch(false)}
                onSelectUser={handleCustomerSelect}
                darkMode={darkMode}
            />

            <QuickAddCustomerModal
                visible={showQuickAdd}
                onClose={() => setShowQuickAdd(false)}
                onCustomerAdded={handleCustomerSelect}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    stepIndicatorContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 16,
        justifyContent: 'space-between',
    },
    stepItem: { flex: 1, alignItems: 'center', position: 'relative' },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        zIndex: 1,
    },
    stepNumber: { fontSize: 14, fontWeight: '600' },
    stepLabel: { fontSize: 12, textAlign: 'center' },
    stepLine: {
        position: 'absolute',
        top: 16,
        left: '50%',
        right: '-50%',
        height: 2,
        zIndex: 0,
    },
    scrollView: { flex: 1 },
    scrollViewContent: { padding: 16 },
    stepContent: { flex: 1 },
    card: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
    formGrid: { gap: 16 },
    formRow: { flexDirection: 'row', gap: 16 },
    formGroup: { marginBottom: 8 },
    formGroupHalf: { width: '48%' },
    label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    errorText: { fontSize: 12, marginTop: 4 },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 12,
    },
    buttonGroup: { flexDirection: 'row', gap: 12, marginTop: 16 },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        gap: 8,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 1,
        gap: 8,
    },
    secondaryButtonText: { fontSize: 16, fontWeight: '600' },
    selectedCustomer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 8,
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    customerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    customerAvatarText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    customerDetails: { flex: 1 },
    customerName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
    customerContact: { fontSize: 14, marginBottom: 2 },
    removeButton: { padding: 8 },
    suggestionsCard: {
        borderRadius: 12,
        borderWidth: 2,
        padding: 16,
        marginBottom: 16,
    },
    suggestionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    suggestionsTitle: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
    suggestionsSubtitle: { fontSize: 14, lineHeight: 20 },
    carSuggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        gap: 12,
    },
    carSuggestionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e0f2fe',
    },
    carSuggestionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
    carSuggestionDetails: { fontSize: 13, marginBottom: 2 },
    carSuggestionLastService: {
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 2,
    },
    infoBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    infoBarText: { fontSize: 13, flex: 1 },
    // ⭐ NUOVI STILI per empty state "nessuna auto"
    emptyStateCard: {
        borderRadius: 12,
        borderWidth: 2,
        padding: 16,
        marginBottom: 16,
    },
    emptyStateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    emptyStateTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    emptyStateText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    emptyStateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 6,
        alignSelf: 'flex-start',
    },
    emptyStateButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        borderTopWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    footerButtons: { flexDirection: 'row', gap: 12 },
    footerButton: { flex: 1 },
});

export default NewAppointmentScreen;
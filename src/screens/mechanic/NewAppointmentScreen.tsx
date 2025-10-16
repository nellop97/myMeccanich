// src/screens/mechanic/NewAppointmentScreen.tsx
// Schermata completa per aggiungere un veicolo in officina
// Responsive per Web e Mobile

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
} from 'lucide-react-native';
import { useStore } from '../../store';
import { useWorkshopStore } from '../../store/workshopStore';
import CalendarAppointmentPicker from './CalendarAppointmentPicker';
import UserSearchModal from '../../components/UserSearchModal';
import QuickAddCustomerModal from '../../components/QuickAddCustomerModal';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

const { width: screenWidth } = Dimensions.get('window');

interface SelectedCustomer {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
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

    // Stati UI
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [currentStep, setCurrentStep] = useState(1); // 1: Cliente, 2: Veicolo, 3: Riparazione, 4: Date

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
    };

    // Validazione step
    const validateStep = (step: number): boolean => {
        const newErrors: { [key: string]: string } = {};

        switch (step) {
            case 1: // Cliente
                if (!selectedCustomer) {
                    newErrors.customer = 'Seleziona o aggiungi un cliente';
                }
                break;
            case 2: // Veicolo
                if (!vehicleData.make.trim()) newErrors.make = 'Marca richiesta';
                if (!vehicleData.model.trim()) newErrors.model = 'Modello richiesto';
                if (!vehicleData.licensePlate.trim()) newErrors.licensePlate = 'Targa richiesta';
                break;
            case 3: // Riparazione
                if (!repairData.description.trim()) newErrors.description = 'Descrizione richiesta';
                break;
            case 4: // Date
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
            // 1. Prepara dati veicolo
            const workshopCarData = {
                // Dati veicolo
                make: vehicleData.make.trim(),
                model: vehicleData.model.trim(),
                year: vehicleData.year || new Date().getFullYear().toString(),
                licensePlate: vehicleData.licensePlate.trim().toUpperCase(),
                vin: vehicleData.vin.trim() || null,
                color: vehicleData.color.trim() || null,
                mileage: vehicleData.mileage ? parseInt(vehicleData.mileage) : null,

                // Dati proprietario
                owner: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
                ownerId: selectedCustomer.id,
                ownerEmail: selectedCustomer.email,
                ownerPhone: selectedCustomer.phone || null,

                // Metadata officina
                workshopId: user.id,
                entryDate: new Date().toISOString(),
                isActive: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),

                // Array riparazioni con prima riparazione
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
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    },
                ],
            };

            // 2. Salva su Firestore
            const docRef = await addDoc(collection(db, 'workshopCars'), workshopCarData);
            console.log('✅ Veicolo aggiunto con ID:', docRef.id);

            // 3. Ricarica dati officina
            await fetchCars(user.id);

            // 4. Mostra successo e torna indietro
            Alert.alert(
                'Successo!',
                `${vehicleData.make} ${vehicleData.model} aggiunto all'officina`,
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error: any) {
            console.error('❌ Errore salvataggio:', error);
            Alert.alert('Errore', error.message || 'Impossibile salvare il veicolo');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCustomerSelect = (customer: any) => {
        setSelectedCustomer(customer);
        setShowCustomerSearch(false);
        setErrors((prev) => ({ ...prev, customer: '' }));
    };

    const removeCustomer = () => {
        setSelectedCustomer(null);
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
                    <View style={[styles.selectedCustomer, { backgroundColor: theme.accent + '10' }]}>
                        <View style={styles.customerInfo}>
                            <View style={[styles.customerAvatar, { backgroundColor: theme.accent }]}>
                                <Text style={styles.customerAvatarText}>
                                    {selectedCustomer.firstName.charAt(0)}
                                    {selectedCustomer.lastName.charAt(0)}
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
                                        📞 {selectedCustomer.phone}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <TouchableOpacity onPress={removeCustomer} style={styles.removeButton}>
                            <X size={20} color={theme.error} />
                        </TouchableOpacity>
                    </View>
                )}

                {errors.customer && (
                    <Text style={[styles.errorText, { color: theme.error }]}>{errors.customer}</Text>
                )}
            </View>
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

                <View style={styles.formGrid}>
                    {/* Marca */}
                    <View style={[styles.formGroup, isDesktop && styles.formGroupHalf]}>
                        <Text style={[styles.label, { color: theme.text }]}>
                            Marca <Text style={{ color: theme.error }}>*</Text>
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: theme.inputBackground,
                                    color: theme.text,
                                    borderColor: errors.make ? theme.error : theme.border,
                                },
                            ]}
                            placeholder="es. Fiat"
                            placeholderTextColor={theme.placeholderColor}
                            value={vehicleData.make}
                            onChangeText={(text) => {
                                setVehicleData({ ...vehicleData, make: text });
                                setErrors({ ...errors, make: '' });
                            }}
                        />
                        {errors.make && <Text style={[styles.errorText, { color: theme.error }]}>{errors.make}</Text>}
                    </View>

                    {/* Modello */}
                    <View style={[styles.formGroup, isDesktop && styles.formGroupHalf]}>
                        <Text style={[styles.label, { color: theme.text }]}>
                            Modello <Text style={{ color: theme.error }}>*</Text>
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: theme.inputBackground,
                                    color: theme.text,
                                    borderColor: errors.model ? theme.error : theme.border,
                                },
                            ]}
                            placeholder="es. Panda"
                            placeholderTextColor={theme.placeholderColor}
                            value={vehicleData.model}
                            onChangeText={(text) => {
                                setVehicleData({ ...vehicleData, model: text });
                                setErrors({ ...errors, model: '' });
                            }}
                        />
                        {errors.model && <Text style={[styles.errorText, { color: theme.error }]}>{errors.model}</Text>}
                    </View>

                    {/* Targa */}
                    <View style={[styles.formGroup, isDesktop && styles.formGroupHalf]}>
                        <Text style={[styles.label, { color: theme.text }]}>
                            Targa <Text style={{ color: theme.error }}>*</Text>
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: theme.inputBackground,
                                    color: theme.text,
                                    borderColor: errors.licensePlate ? theme.error : theme.border,
                                },
                            ]}
                            placeholder="es. AB123CD"
                            placeholderTextColor={theme.placeholderColor}
                            value={vehicleData.licensePlate}
                            onChangeText={(text) => {
                                setVehicleData({ ...vehicleData, licensePlate: text.toUpperCase() });
                                setErrors({ ...errors, licensePlate: '' });
                            }}
                            autoCapitalize="characters"
                        />
                        {errors.licensePlate && (
                            <Text style={[styles.errorText, { color: theme.error }]}>{errors.licensePlate}</Text>
                        )}
                    </View>

                    {/* Anno */}
                    <View style={[styles.formGroup, isDesktop && styles.formGroupHalf]}>
                        <Text style={[styles.label, { color: theme.text }]}>Anno</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: theme.inputBackground,
                                    color: theme.text,
                                    borderColor: theme.border,
                                },
                            ]}
                            placeholder="es. 2020"
                            placeholderTextColor={theme.placeholderColor}
                            value={vehicleData.year}
                            onChangeText={(text) => setVehicleData({ ...vehicleData, year: text })}
                            keyboardType="numeric"
                            maxLength={4}
                        />
                    </View>

                    {/* VIN */}
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>VIN (Telaio)</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: theme.inputBackground,
                                    color: theme.text,
                                    borderColor: theme.border,
                                },
                            ]}
                            placeholder="Numero telaio (opzionale)"
                            placeholderTextColor={theme.placeholderColor}
                            value={vehicleData.vin}
                            onChangeText={(text) => setVehicleData({ ...vehicleData, vin: text.toUpperCase() })}
                            autoCapitalize="characters"
                        />
                    </View>

                    {/* Colore e Chilometri */}
                    <View style={[styles.formGroup, isDesktop && styles.formGroupHalf]}>
                        <Text style={[styles.label, { color: theme.text }]}>Colore</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: theme.inputBackground,
                                    color: theme.text,
                                    borderColor: theme.border,
                                },
                            ]}
                            placeholder="es. Bianco"
                            placeholderTextColor={theme.placeholderColor}
                            value={vehicleData.color}
                            onChangeText={(text) => setVehicleData({ ...vehicleData, color: text })}
                        />
                    </View>

                    <View style={[styles.formGroup, isDesktop && styles.formGroupHalf]}>
                        <Text style={[styles.label, { color: theme.text }]}>Chilometraggio</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: theme.inputBackground,
                                    color: theme.text,
                                    borderColor: theme.border,
                                },
                            ]}
                            placeholder="es. 50000"
                            placeholderTextColor={theme.placeholderColor}
                            value={vehicleData.mileage}
                            onChangeText={(text) => setVehicleData({ ...vehicleData, mileage: text })}
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
                    {/* Descrizione */}
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>
                            Descrizione Lavoro <Text style={{ color: theme.error }}>*</Text>
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                styles.textArea,
                                {
                                    backgroundColor: theme.inputBackground,
                                    color: theme.text,
                                    borderColor: errors.description ? theme.error : theme.border,
                                },
                            ]}
                            placeholder="Descrivi il lavoro da eseguire..."
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

                    {/* Costo stimato e manodopera */}
                    <View style={[styles.formGroup, isDesktop && styles.formGroupHalf]}>
                        <Text style={[styles.label, { color: theme.text }]}>Costo Stimato (€)</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: theme.inputBackground,
                                    color: theme.text,
                                    borderColor: theme.border,
                                },
                            ]}
                            placeholder="es. 500"
                            placeholderTextColor={theme.placeholderColor}
                            value={repairData.estimatedCost}
                            onChangeText={(text) => setRepairData({ ...repairData, estimatedCost: text })}
                            keyboardType="decimal-pad"
                        />
                    </View>

                    <View style={[styles.formGroup, isDesktop && styles.formGroupHalf]}>
                        <Text style={[styles.label, { color: theme.text }]}>Costo Manodopera (€)</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: theme.inputBackground,
                                    color: theme.text,
                                    borderColor: theme.border,
                                },
                            ]}
                            placeholder="es. 200"
                            placeholderTextColor={theme.placeholderColor}
                            value={repairData.laborCost}
                            onChangeText={(text) => setRepairData({ ...repairData, laborCost: text })}
                            keyboardType="decimal-pad"
                        />
                    </View>

                    {/* Ore stimate */}
                    <View style={[styles.formGroup, isDesktop && styles.formGroupHalf]}>
                        <Text style={[styles.label, { color: theme.text }]}>Ore Stimate</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: theme.inputBackground,
                                    color: theme.text,
                                    borderColor: theme.border,
                                },
                            ]}
                            placeholder="es. 4"
                            placeholderTextColor={theme.placeholderColor}
                            value={repairData.estimatedHours}
                            onChangeText={(text) => setRepairData({ ...repairData, estimatedHours: text })}
                            keyboardType="decimal-pad"
                        />
                    </View>

                    {/* Note */}
                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Note Aggiuntive</Text>
                        <TextInput
                            style={[
                                styles.input,
                                styles.textArea,
                                {
                                    backgroundColor: theme.inputBackground,
                                    color: theme.text,
                                    borderColor: theme.border,
                                },
                            ]}
                            placeholder="Eventuali note o specifiche..."
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
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Nuovo Veicolo in Officina</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Step Indicator */}
            {renderStepIndicator()}

            {/* Content */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={100}
            >
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
                    {currentStep === 1 && renderCustomerStep()}
                    {currentStep === 2 && renderVehicleStep()}
                    {currentStep === 3 && renderRepairStep()}
                    {currentStep === 4 && renderDateStep()}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer Buttons */}
            <View style={[styles.footer, { backgroundColor: theme.cardBackground, borderTopColor: theme.border }]}>
                <View style={styles.footerButtons}>
                    {currentStep > 1 && (
                        <TouchableOpacity
                            style={[styles.footerButton, styles.secondaryButton, { borderColor: theme.border }]}
                            onPress={handleBack}
                        >
                            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Indietro</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.footerButton, styles.primaryButton, { backgroundColor: theme.accent }]}
                        onPress={handleNext}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <>
                                {currentStep < 4 ? (
                                    <Text style={styles.primaryButtonText}>Continua</Text>
                                ) : (
                                    <>
                                        <Save size={20} color="#ffffff" />
                                        <Text style={styles.primaryButtonText}>Salva</Text>
                                    </>
                                )}
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Modals */}
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
                darkMode={darkMode}
            />
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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    stepIndicatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    stepItem: {
        alignItems: 'center',
        flex: 1,
        position: 'relative',
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        zIndex: 1,
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: '600',
    },
    stepLabel: {
        fontSize: 12,
        textAlign: 'center',
    },
    stepLine: {
        position: 'absolute',
        top: 16,
        left: '50%',
        right: '-50%',
        height: 2,
        zIndex: 0,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        padding: 16,
    },
    stepContent: {
        flex: 1,
    },
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
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    formGrid: {
        gap: 16,
    },
    formGroup: {
        marginBottom: 8,
    },
    formGroupHalf: {
        width: '48%',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 12,
    },
    emptyStateText: {
        fontSize: 14,
        marginBottom: 8,
    },
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
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
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
    customerDetails: {
        flex: 1,
    },
    customerName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    customerContact: {
        fontSize: 14,
        marginBottom: 2,
    },
    removeButton: {
        padding: 8,
    },
    footer: {
        borderTopWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    footerButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    footerButton: {
        flex: 1,
    },
});

export default NewAppointmentScreen;
// src/screens/user/AddVehicleScreen.tsx
// Wizard principale per aggiunta veicolo - Multipiattaforma

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    useWindowDimensions,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store';

// Steps
import VehicleBasicInfoStep from './AddVehicle/VehicleBasicInfoStep';
import VehicleTechnicalDetailsStep from './AddVehicle/VehicleTechnicalDetailsStep';
import VehicleDeadlinesDocumentsStep from './AddVehicle/VehicleDeadlinesDocumentsStep';
import VehicleSummaryStep from './AddVehicle/VehicleSummaryStep';
import VehicleImagesStep from './AddVehicle/VehicleImagesStep';
// Types
import { VehicleFormData, AddVehicleStep } from '../../types/addVehicle.types';

// Firebase
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

const AddVehicleScreen = () => {
    const navigation = useNavigation();
    const { user } = useStore();
    const { width } = useWindowDimensions();

    // Responsive
    const isDesktop = width >= 1024;
    const isTablet = width >= 768 && width < 1024;
    const isMobile = width < 768;

    // Stati
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<VehicleFormData>({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        licensePlate: '',
        fuelType: '',
        transmission: '',
    });

    const [steps, setSteps] = useState<AddVehicleStep[]>([
        { id: 1, title: 'Dati Base', isValid: false, isCompleted: false },
        { id: 2, title: 'Dettagli Tecnici', isValid: false, isCompleted: false },
        { id: 3, title: 'Foto', isValid: true, isCompleted: false }, // NUOVO
        { id: 4, title: 'Scadenze', isValid: true, isCompleted: false },
        { id: 5, title: 'Riepilogo', isValid: true, isCompleted: false },
    ]);

    // Aggiorna form data
    const updateFormData = (data: Partial<VehicleFormData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
    };

    // Valida step corrente
    const validateCurrentStep = (): boolean => {
        switch (currentStep) {
            case 1:
                return !!(
                    formData.make &&
                    formData.model &&
                    formData.year &&
                    formData.licensePlate
                );
            case 2:
                return !!formData.fuelType;
            case 3:
                return true; // Foto opzionali
            case 4:
                return true; // Scadenze opzionali
            case 5:
                return true; // Riepilogo finale
            default:
                return false;
        }
    };

    // Vai allo step successivo
    const handleNext = () => {
        if (!validateCurrentStep()) {
            Alert.alert('Attenzione', 'Compila tutti i campi obbligatori');
            return;
        }

        // Marca step corrente come completato
        setSteps((prevSteps) =>
            prevSteps.map((step) =>
                step.id === currentStep
                    ? { ...step, isValid: true, isCompleted: true }
                    : step
            )
        );

        // Permetti di andare fino allo step 5 (ci sono 5 step totali)
        if (currentStep < 5) {
            setCurrentStep(currentStep + 1);
        }
    };

    // Torna allo step precedente
    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            navigation.goBack();
        }
    };

    // Salva veicolo su Firebase
    const handleSubmit = async () => {
        if (!user?.id) {
            Alert.alert('Errore', 'Utente non autenticato');
            return;
        }

        setIsSubmitting(true);

        try {
            console.log('📝 Salvando veicolo per utente:', user.id);

            // Helper per serializzare le date
            const serializeDate = (date: any): string | null => {
                if (!date) return null;
                if (typeof date === 'string') return date;
                if (date instanceof Date) return date.toISOString();
                // Se è un oggetto Timestamp di Firebase
                if (date.toDate && typeof date.toDate === 'function') {
                    return date.toDate().toISOString();
                }
                return null;
            };

            // Prepara dati per Firestore (solo valori primitivi e serializzabili)
            const vehicleData = {
                // ✅ ID Utente (richiesto dalle security rules)
                userId: user.id,
                ownerId: user.id, // Mantieni per compatibilità

                // Dati base
                make: formData.make,
                model: formData.model,
                year: Number(formData.year),
                licensePlate: formData.licensePlate.toUpperCase(),

                // Dettagli tecnici
                fuel: formData.fuelType || 'benzina',
                fuelType: formData.fuelType || 'benzina', // Aggiungi anche fuelType
                transmission: formData.transmission || 'manuale',
                engineSize: formData.engineSize ? Number(formData.engineSize) : null,
                power: formData.power ? Number(formData.power) : null,
                vin: formData.vin || null,
                registrationDate: serializeDate(formData.registrationDate),
                color: formData.color || 'Bianco',
                bodyType: formData.bodyType || null,
                doors: Number(formData.doors || 4),
                seats: Number(formData.seats || 5),

                // Chilometraggio
                mileage: Number(formData.currentMileage || 0),
                currentMileage: Number(formData.currentMileage || 0),
                lastUpdatedMileage: new Date().toISOString(),

                // Immagini (se presenti)
                mainImageUrl: formData.mainImage || null,
                imageUrl: formData.mainImage || null, // Per compatibilità
                images: formData.images || [],
                photos: formData.images || [], // Per compatibilità

                // Scadenze (serializzate)
                insuranceExpiry: serializeDate(formData.insurance?.expiryDate),
                insuranceCompany: formData.insurance?.company || null,
                revisionExpiry: serializeDate(formData.revision?.expiryDate),
                roadTaxExpiry: serializeDate(formData.roadTax?.expiryDate),

                // Note
                notes: formData.notes || null,

                // Metadata
                ownerName: user.name || user.email || 'Utente',
                isActive: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),

                // Contatori iniziali
                maintenanceCount: 0,
                documentsCount: formData.additionalDocuments?.length || 0,
                expensesTotal: 0,

                // Privacy settings di default
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

                // Array opzionali
                optionals: formData.optionals || [],
            };

            console.log('📤 Dati veicolo da salvare:', {
                make: vehicleData.make,
                model: vehicleData.model,
                userId: vehicleData.userId,
                ownerId: vehicleData.ownerId,
            });

            // Salva su Firestore
            const docRef = await addDoc(collection(db, 'vehicles'), vehicleData);

            console.log('✅ Veicolo creato con ID:', docRef.id);

            // Mostra successo e redirect alla Home
            Alert.alert(
                'Veicolo Aggiunto!',
                `${formData.make} ${formData.model} è stato aggiunto correttamente.`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Redirect alla Home dell'Owner
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Home' as never }],
                            });
                        },
                    },
                ]
            );
        } catch (error: any) {
            console.error('❌ Errore creazione veicolo:', error);

            // Messaggio di errore più dettagliato
            let errorMessage = 'Si è verificato un errore durante il salvataggio.';

            if (error.code === 'permission-denied') {
                errorMessage = 'Permessi insufficienti. Verifica di essere autenticato.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert('Errore', errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render step corrente
    const renderCurrentStep = () => {
        const stepProps = {
            formData,
            updateFormData,
            onNext: handleNext,
            onBack: handleBack,
        };

        switch (currentStep) {
            case 1:
                return <VehicleBasicInfoStep {...stepProps} />;
            case 2:
                return <VehicleTechnicalDetailsStep {...stepProps} />;
            case 3: // NUOVO
                return (
                    <VehicleImagesStep
                        formData={formData}
                        updateFormData={updateFormData}
                        onNext={handleNext}
                        onBack={handleBack}
                        userId={user.id}
                    />
                );
            case 4:
                return <VehicleDeadlinesDocumentsStep {...stepProps} />;
            case 5:
                return (
                    <VehicleSummaryStep
                        {...stepProps}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1e293b" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <ChevronLeft size={24} color="#fff" strokeWidth={2.5} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Aggiungi il tuo Veicolo</Text>

                <View style={{ width: 40 }} />
            </View>

            {/* Step Indicator */}
            <View
                style={[
                    styles.stepIndicatorContainer,
                    isDesktop && styles.stepIndicatorContainerDesktop,
                ]}
            >
                {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                        <View style={styles.stepItem}>
                            <View
                                style={[
                                    styles.stepCircle,
                                    currentStep === step.id && styles.stepCircleActive,
                                    step.isCompleted && styles.stepCircleCompleted,
                                ]}
                            >
                                {step.isCompleted ? (
                                    <Text style={styles.stepCheckmark}>✓</Text>
                                ) : (
                                    <Text
                                        style={[
                                            styles.stepNumber,
                                            currentStep === step.id && styles.stepNumberActive,
                                        ]}
                                    >
                                        {step.id}
                                    </Text>
                                )}
                            </View>
                            {!isMobile && (
                                <Text
                                    style={[
                                        styles.stepLabel,
                                        currentStep === step.id && styles.stepLabelActive,
                                    ]}
                                >
                                    {step.title}
                                </Text>
                            )}
                        </View>

                        {index < steps.length - 1 && (
                            <View
                                style={[
                                    styles.stepConnector,
                                    step.isCompleted && styles.stepConnectorCompleted,
                                ]}
                            />
                        )}
                    </React.Fragment>
                ))}
            </View>

            {/* Content */}
            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View
                    style={[
                        styles.contentInner,
                        isDesktop && styles.contentInnerDesktop,
                    ]}
                >
                    {renderCurrentStep()}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1e293b',
        paddingHorizontal: 16,
        paddingVertical: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            },
        }),
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        letterSpacing: -0.3,
    },

    // Step Indicator
    stepIndicatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        paddingVertical: 24,
        paddingHorizontal: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            },
        }),
    },
    stepIndicatorContainerDesktop: {
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
    },
    stepItem: {
        alignItems: 'center',
        gap: 8,
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepCircleActive: {
        backgroundColor: '#3b82f6',
    },
    stepCircleCompleted: {
        backgroundColor: '#10b981',
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    stepNumberActive: {
        color: '#fff',
    },
    stepCheckmark: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '700',
    },
    stepLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    stepLabelActive: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    stepConnector: {
        flex: 1,
        height: 2,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 8,
    },
    stepConnectorCompleted: {
        backgroundColor: '#10b981',
    },

    // Content
    content: {
        flex: 1,
    },
    contentInner: {
        flex: 1,
    },
    contentInnerDesktop: {
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
    },
});

export default AddVehicleScreen;
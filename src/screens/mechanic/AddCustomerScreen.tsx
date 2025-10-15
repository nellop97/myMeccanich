// src/screens/mechanic/AddCustomerScreen.tsx
import React, { useState, useEffect } from 'react';
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
    Switch,
} from 'react-native';
import { TextInput, ProgressBar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    User,
    Mail,
    Phone,
    MapPin,
    Building,
    CreditCard,
    FileText,
    Save,
    X,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react-native';

// Firebase
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    getDoc,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useStore } from '../../store';
import { useInvoicingStore } from '../../store/invoicingStore';

// ============================================================
// INTERFACES
// ============================================================
interface CustomerFormData {
    // Basic Info
    name: string;
    email: string;
    phone: string;
    isCompany: boolean;

    // Company Info
    companyName: string;
    vatNumber: string;
    fiscalCode: string;
    sdiCode: string;
    pecEmail: string;

    // Address
    address: string;
    city: string;
    postalCode: string;
    province: string;
    country: string;

    // Additional
    notes: string;
    preferredPaymentMethod: string;
    paymentTerms: string;
}

interface FormErrors {
    [key: string]: string;
}

// ============================================================
// COMPONENT
// ============================================================
const AddCustomerScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { width, height } = useWindowDimensions();
    const { user, darkMode } = useStore();

    // Responsive breakpoints
    const isDesktop = width >= 1024;
    const isTablet = width >= 768 && width < 1024;
    const isMobile = width < 768;
    const isLargeScreen = width >= 1440;

    // Edit mode
    const customerId = route.params?.customerId;
    const isEditing = !!customerId;

    // Form state
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    const [formData, setFormData] = useState<CustomerFormData>({
        name: '',
        email: '',
        phone: '',
        isCompany: false,
        companyName: '',
        vatNumber: '',
        fiscalCode: '',
        sdiCode: '',
        pecEmail: '',
        address: '',
        city: '',
        postalCode: '',
        province: '',
        country: 'Italia',
        notes: '',
        preferredPaymentMethod: 'bonifico',
        paymentTerms: '30gg',
    });

    // Theme configuration
    const theme = {
        // Backgrounds
        mainBg: darkMode ? '#0f1419' : '#f8f9fa',
        cardBg: darkMode ? '#1a1f2e' : '#ffffff',
        inputBg: darkMode ? '#232936' : '#f3f4f6',

        // Text
        text: darkMode ? '#ffffff' : '#1f2937',
        textSecondary: darkMode ? '#9ca3af' : '#6b7280',
        textMuted: darkMode ? '#6b7280' : '#9ca3af',
        placeholder: darkMode ? '#6b7280' : '#9ca3af',

        // Borders
        border: darkMode ? '#2d3748' : '#e5e7eb',
        borderLight: darkMode ? '#374151' : '#f3f4f6',

        // Colors
        primary: '#2563eb',
        primaryDark: '#1d4ed8',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',

        // Interactive
        hover: darkMode ? '#2d3748' : '#f9fafb',
        focus: '#2563eb20',
        disabled: darkMode ? '#374151' : '#e5e7eb',
    };

    const totalSteps = 4; // Basic, Company, Address, Additional

    // ============================================================
    // LOAD CUSTOMER DATA (Edit mode)
    // ============================================================
    useEffect(() => {
        if (isEditing && customerId) {
            loadCustomerData();
        }
    }, [customerId]);

    const loadCustomerData = async () => {
        if (!customerId) return;

        setLoadingData(true);
        try {
            const docRef = doc(db, 'customers', customerId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setFormData({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    isCompany: data.isCompany || false,
                    companyName: data.companyName || '',
                    vatNumber: data.vatNumber || '',
                    fiscalCode: data.fiscalCode || '',
                    sdiCode: data.sdiCode || '',
                    pecEmail: data.pecEmail || '',
                    address: data.address || '',
                    city: data.city || '',
                    postalCode: data.postalCode || '',
                    province: data.province || '',
                    country: data.country || 'Italia',
                    notes: data.notes || '',
                    preferredPaymentMethod: data.preferredPaymentMethod || 'bonifico',
                    paymentTerms: data.paymentTerms || '30gg',
                });
            }
        } catch (error) {
            console.error('Error loading customer:', error);
            Alert.alert('Errore', 'Impossibile caricare i dati del cliente');
        } finally {
            setLoadingData(false);
        }
    };

    // ============================================================
    // VALIDATION
    // ============================================================
    const validateStep = (): boolean => {
        const newErrors: FormErrors = {};

        switch (currentStep) {
            case 0: // Basic Info
                if (!formData.name.trim()) {
                    newErrors.name = 'Nome richiesto';
                }
                if (!formData.email.trim()) {
                    newErrors.email = 'Email richiesta';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                    newErrors.email = 'Email non valida';
                }
                if (!formData.phone.trim()) {
                    newErrors.phone = 'Telefono richiesto';
                }
                break;

            case 1: // Company Info
                if (formData.isCompany) {
                    if (!formData.companyName.trim()) {
                        newErrors.companyName = 'Ragione sociale richiesta';
                    }
                    if (!formData.vatNumber.trim()) {
                        newErrors.vatNumber = 'P.IVA richiesta';
                    } else if (!/^\d{11}$/.test(formData.vatNumber.replace(/\s/g, ''))) {
                        newErrors.vatNumber = 'P.IVA non valida (11 cifre)';
                    }
                }
                break;

            case 2: // Address
                if (!formData.address.trim()) {
                    newErrors.address = 'Indirizzo richiesto';
                }
                if (!formData.city.trim()) {
                    newErrors.city = 'Città richiesta';
                }
                if (!formData.postalCode.trim()) {
                    newErrors.postalCode = 'CAP richiesto';
                } else if (!/^\d{5}$/.test(formData.postalCode)) {
                    newErrors.postalCode = 'CAP non valido (5 cifre)';
                }
                break;
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
    // SUBMIT
    // ============================================================
    const handleSubmit = async () => {
        if (!validateStep()) return;

        setLoading(true);
        try {
            const customerData = {
                ...formData,
                ownerId: user?.uid || user?.id,
                updatedAt: serverTimestamp(),
                ...(isEditing ? {} : { createdAt: serverTimestamp() }),
            };

            if (isEditing && customerId) {
                // Update existing customer
                const docRef = doc(db, 'customers', customerId);
                await updateDoc(docRef, customerData);
                Alert.alert('Successo', 'Cliente aggiornato con successo!');
            } else {
                // Create new customer
                await addDoc(collection(db, 'customers'), customerData);
                Alert.alert('Successo', 'Cliente aggiunto con successo!');
            }

            navigation.navigate('CustomersList' as never);
        } catch (error) {
            console.error('Error saving customer:', error);
            Alert.alert('Errore', 'Impossibile salvare il cliente');
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // RENDER STEPS
    // ============================================================
    const renderStepIndicator = () => {
        const steps = [
            { label: 'Dati Base', icon: User },
            { label: 'Azienda', icon: Building },
            { label: 'Indirizzo', icon: MapPin },
            { label: 'Extra', icon: FileText },
        ];

        if (isMobile) {
            // Mobile: Progress bar
            return (
                <View style={styles.mobileProgress}>
                    <ProgressBar
                        progress={(currentStep + 1) / totalSteps}
                        color={theme.primary}
                        style={{
                            height: 4,
                            backgroundColor: theme.border,
                            borderRadius: 2,
                        }}
                    />
                    <Text style={[styles.stepText, { color: theme.textSecondary }]}>
                        Passo {currentStep + 1} di {totalSteps}
                    </Text>
                </View>
            );
        }

        // Desktop/Tablet: Step indicators
        return (
            <View style={[
                styles.stepsContainer,
                isDesktop && styles.desktopSteps,
            ]}>
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;

                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.stepItem,
                                isActive && { borderBottomColor: theme.primary },
                            ]}
                            onPress={() => index <= currentStep && setCurrentStep(index)}
                            disabled={index > currentStep}
                        >
                            <View style={[
                                styles.stepIcon,
                                {
                                    backgroundColor: isActive ? theme.primary :
                                        isCompleted ? theme.success :
                                            theme.border,
                                },
                            ]}>
                                {isCompleted ? (
                                    <Check size={16} color="#fff" />
                                ) : (
                                    <Icon size={16} color={isActive ? '#fff' : theme.textMuted} />
                                )}
                            </View>
                            <Text style={[
                                styles.stepLabel,
                                { color: isActive ? theme.text : theme.textSecondary },
                            ]}>
                                {step.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    const renderBasicInfo = () => (
        <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>
                Informazioni di Base
            </Text>
            <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
                Inserisci i dati principali del cliente
            </Text>

            <View style={[styles.inputGroup, isDesktop && styles.desktopInputGroup]}>
                <View style={[styles.inputWrapper, isDesktop && styles.flexInput]}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>
                        Nome Completo *
                    </Text>
                    <TextInput
                        mode="outlined"
                        value={formData.name}
                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                        placeholder="Mario Rossi"
                        error={!!errors.name}
                        outlineColor={theme.border}
                        activeOutlineColor={theme.primary}
                        textColor={theme.text}
                        style={[
                            styles.input,
                            { backgroundColor: theme.inputBg },
                        ]}
                        left={<TextInput.Icon icon={() => <User size={20} color={theme.textMuted} />} />}
                    />
                    {errors.name && (
                        <Text style={styles.errorText}>{errors.name}</Text>
                    )}
                </View>

                <View style={[styles.inputWrapper, isDesktop && styles.flexInput]}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>
                        Email *
                    </Text>
                    <TextInput
                        mode="outlined"
                        value={formData.email}
                        onChangeText={(text) => setFormData({ ...formData, email: text })}
                        placeholder="mario.rossi@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        error={!!errors.email}
                        outlineColor={theme.border}
                        activeOutlineColor={theme.primary}
                        textColor={theme.text}
                        style={[
                            styles.input,
                            { backgroundColor: theme.inputBg },
                        ]}
                        left={<TextInput.Icon icon={() => <Mail size={20} color={theme.textMuted} />} />}
                    />
                    {errors.email && (
                        <Text style={styles.errorText}>{errors.email}</Text>
                    )}
                </View>

                <View style={[styles.inputWrapper, isDesktop && styles.flexInput]}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>
                        Telefono *
                    </Text>
                    <TextInput
                        mode="outlined"
                        value={formData.phone}
                        onChangeText={(text) => setFormData({ ...formData, phone: text })}
                        placeholder="+39 333 1234567"
                        keyboardType="phone-pad"
                        error={!!errors.phone}
                        outlineColor={theme.border}
                        activeOutlineColor={theme.primary}
                        textColor={theme.text}
                        style={[
                            styles.input,
                            { backgroundColor: theme.inputBg },
                        ]}
                        left={<TextInput.Icon icon={() => <Phone size={20} color={theme.textMuted} />} />}
                    />
                    {errors.phone && (
                        <Text style={styles.errorText}>{errors.phone}</Text>
                    )}
                </View>

                <View style={[styles.switchWrapper, { backgroundColor: theme.cardBg }]}>
                    <View style={styles.switchContent}>
                        <Building size={24} color={theme.primary} />
                        <View style={styles.switchTextContainer}>
                            <Text style={[styles.switchLabel, { color: theme.text }]}>
                                Cliente Aziendale
                            </Text>
                            <Text style={[styles.switchDescription, { color: theme.textSecondary }]}>
                                Abilita per inserire dati aziendali e fatturazione
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={formData.isCompany}
                        onValueChange={(value) => setFormData({ ...formData, isCompany: value })}
                        trackColor={{ false: theme.border, true: theme.primary }}
                        thumbColor={formData.isCompany ? '#fff' : '#f4f3f4'}
                    />
                </View>
            </View>
        </View>
    );

    const renderCompanyInfo = () => (
        <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>
                Dati Aziendali
            </Text>
            <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
                {formData.isCompany ? 'Inserisci i dati per la fatturazione' : 'Salta questo passaggio per clienti privati'}
            </Text>

            {formData.isCompany ? (
                <View style={[styles.inputGroup, isDesktop && styles.desktopInputGroup]}>
                    <View style={[styles.inputWrapper, isDesktop && styles.fullWidth]}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>
                            Ragione Sociale *
                        </Text>
                        <TextInput
                            mode="outlined"
                            value={formData.companyName}
                            onChangeText={(text) => setFormData({ ...formData, companyName: text })}
                            placeholder="Rossi Auto S.r.l."
                            error={!!errors.companyName}
                            outlineColor={theme.border}
                            activeOutlineColor={theme.primary}
                            textColor={theme.text}
                            style={[
                                styles.input,
                                { backgroundColor: theme.inputBg },
                            ]}
                            left={<TextInput.Icon icon={() => <Building size={20} color={theme.textMuted} />} />}
                        />
                        {errors.companyName && (
                            <Text style={styles.errorText}>{errors.companyName}</Text>
                        )}
                    </View>

                    <View style={[styles.inputRow, isDesktop && styles.desktopRow]}>
                        <View style={styles.flexInput}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>
                                Partita IVA *
                            </Text>
                            <TextInput
                                mode="outlined"
                                value={formData.vatNumber}
                                onChangeText={(text) => setFormData({ ...formData, vatNumber: text })}
                                placeholder="12345678901"
                                keyboardType="numeric"
                                maxLength={11}
                                error={!!errors.vatNumber}
                                outlineColor={theme.border}
                                activeOutlineColor={theme.primary}
                                textColor={theme.text}
                                style={[
                                    styles.input,
                                    { backgroundColor: theme.inputBg },
                                ]}
                            />
                            {errors.vatNumber && (
                                <Text style={styles.errorText}>{errors.vatNumber}</Text>
                            )}
                        </View>

                        <View style={styles.flexInput}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>
                                Codice Fiscale
                            </Text>
                            <TextInput
                                mode="outlined"
                                value={formData.fiscalCode}
                                onChangeText={(text) => setFormData({ ...formData, fiscalCode: text })}
                                placeholder="RSSMRA80A01H501Z"
                                autoCapitalize="characters"
                                maxLength={16}
                                outlineColor={theme.border}
                                activeOutlineColor={theme.primary}
                                textColor={theme.text}
                                style={[
                                    styles.input,
                                    { backgroundColor: theme.inputBg },
                                ]}
                            />
                        </View>
                    </View>

                    <View style={[styles.inputRow, isDesktop && styles.desktopRow]}>
                        <View style={styles.flexInput}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>
                                Codice SDI
                            </Text>
                            <TextInput
                                mode="outlined"
                                value={formData.sdiCode}
                                onChangeText={(text) => setFormData({ ...formData, sdiCode: text })}
                                placeholder="ABC123D"
                                autoCapitalize="characters"
                                maxLength={7}
                                outlineColor={theme.border}
                                activeOutlineColor={theme.primary}
                                textColor={theme.text}
                                style={[
                                    styles.input,
                                    { backgroundColor: theme.inputBg },
                                ]}
                            />
                        </View>

                        <View style={styles.flexInput}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>
                                Email PEC
                            </Text>
                            <TextInput
                                mode="outlined"
                                value={formData.pecEmail}
                                onChangeText={(text) => setFormData({ ...formData, pecEmail: text })}
                                placeholder="amministrazione@pec.azienda.it"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                outlineColor={theme.border}
                                activeOutlineColor={theme.primary}
                                textColor={theme.text}
                                style={[
                                    styles.input,
                                    { backgroundColor: theme.inputBg },
                                ]}
                            />
                        </View>
                    </View>
                </View>
            ) : (
                <View style={[styles.emptyStateCard, { backgroundColor: theme.cardBg }]}>
                    <Building size={48} color={theme.border} />
                    <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                        Cliente privato - nessun dato aziendale richiesto
                    </Text>
                </View>
            )}
        </View>
    );

    const renderAddress = () => (
        <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>
                Indirizzo
            </Text>
            <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
                Inserisci l'indirizzo completo del cliente
            </Text>

            <View style={[styles.inputGroup, isDesktop && styles.desktopInputGroup]}>
                <View style={[styles.inputWrapper, isDesktop && styles.fullWidth]}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>
                        Indirizzo *
                    </Text>
                    <TextInput
                        mode="outlined"
                        value={formData.address}
                        onChangeText={(text) => setFormData({ ...formData, address: text })}
                        placeholder="Via Roma, 1"
                        error={!!errors.address}
                        outlineColor={theme.border}
                        activeOutlineColor={theme.primary}
                        textColor={theme.text}
                        style={[
                            styles.input,
                            { backgroundColor: theme.inputBg },
                        ]}
                        left={<TextInput.Icon icon={() => <MapPin size={20} color={theme.textMuted} />} />}
                    />
                    {errors.address && (
                        <Text style={styles.errorText}>{errors.address}</Text>
                    )}
                </View>

                <View style={[styles.inputRow, isDesktop && styles.desktopRow]}>
                    <View style={[styles.flexInput, { flex: 2 }]}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>
                            Città *
                        </Text>
                        <TextInput
                            mode="outlined"
                            value={formData.city}
                            onChangeText={(text) => setFormData({ ...formData, city: text })}
                            placeholder="Milano"
                            error={!!errors.city}
                            outlineColor={theme.border}
                            activeOutlineColor={theme.primary}
                            textColor={theme.text}
                            style={[
                                styles.input,
                                { backgroundColor: theme.inputBg },
                            ]}
                        />
                        {errors.city && (
                            <Text style={styles.errorText}>{errors.city}</Text>
                        )}
                    </View>

                    <View style={styles.flexInput}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>
                            CAP *
                        </Text>
                        <TextInput
                            mode="outlined"
                            value={formData.postalCode}
                            onChangeText={(text) => setFormData({ ...formData, postalCode: text })}
                            placeholder="20100"
                            keyboardType="numeric"
                            maxLength={5}
                            error={!!errors.postalCode}
                            outlineColor={theme.border}
                            activeOutlineColor={theme.primary}
                            textColor={theme.text}
                            style={[
                                styles.input,
                                { backgroundColor: theme.inputBg },
                            ]}
                        />
                        {errors.postalCode && (
                            <Text style={styles.errorText}>{errors.postalCode}</Text>
                        )}
                    </View>

                    <View style={styles.flexInput}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>
                            Provincia
                        </Text>
                        <TextInput
                            mode="outlined"
                            value={formData.province}
                            onChangeText={(text) => setFormData({ ...formData, province: text })}
                            placeholder="MI"
                            autoCapitalize="characters"
                            maxLength={2}
                            outlineColor={theme.border}
                            activeOutlineColor={theme.primary}
                            textColor={theme.text}
                            style={[
                                styles.input,
                                { backgroundColor: theme.inputBg },
                            ]}
                        />
                    </View>
                </View>

                <View style={[styles.inputWrapper, isDesktop && styles.halfWidth]}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>
                        Paese
                    </Text>
                    <TextInput
                        mode="outlined"
                        value={formData.country}
                        onChangeText={(text) => setFormData({ ...formData, country: text })}
                        placeholder="Italia"
                        outlineColor={theme.border}
                        activeOutlineColor={theme.primary}
                        textColor={theme.text}
                        style={[
                            styles.input,
                            { backgroundColor: theme.inputBg },
                        ]}
                    />
                </View>
            </View>
        </View>
    );

    const renderAdditionalInfo = () => (
        <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>
                Informazioni Aggiuntive
            </Text>
            <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
                Preferenze di pagamento e note
            </Text>

            <View style={[styles.inputGroup, isDesktop && styles.desktopInputGroup]}>
                <View style={[styles.inputRow, isDesktop && styles.desktopRow]}>
                    <View style={styles.flexInput}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>
                            Metodo di Pagamento Preferito
                        </Text>
                        <View style={[styles.radioGroup, { backgroundColor: theme.inputBg }]}>
                            {['bonifico', 'contanti', 'carta', 'assegno'].map((method) => (
                                <TouchableOpacity
                                    key={method}
                                    style={[
                                        styles.radioOption,
                                        formData.preferredPaymentMethod === method && {
                                            backgroundColor: theme.primary + '20',
                                            borderColor: theme.primary,
                                        },
                                    ]}
                                    onPress={() => setFormData({ ...formData, preferredPaymentMethod: method })}
                                >
                                    <Text style={[
                                        styles.radioText,
                                        { color: theme.text },
                                        formData.preferredPaymentMethod === method && { color: theme.primary }
                                    ]}>
                                        {method.charAt(0).toUpperCase() + method.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.flexInput}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>
                            Termini di Pagamento
                        </Text>
                        <View style={[styles.radioGroup, { backgroundColor: theme.inputBg }]}>
                            {['immediato', '30gg', '60gg', '90gg'].map((term) => (
                                <TouchableOpacity
                                    key={term}
                                    style={[
                                        styles.radioOption,
                                        formData.paymentTerms === term && {
                                            backgroundColor: theme.primary + '20',
                                            borderColor: theme.primary,
                                        },
                                    ]}
                                    onPress={() => setFormData({ ...formData, paymentTerms: term })}
                                >
                                    <Text style={[
                                        styles.radioText,
                                        { color: theme.text },
                                        formData.paymentTerms === term && { color: theme.primary }
                                    ]}>
                                        {term === 'immediato' ? 'Immediato' : term.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                <View style={[styles.inputWrapper, isDesktop && styles.fullWidth]}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>
                        Note
                    </Text>
                    <TextInput
                        mode="outlined"
                        value={formData.notes}
                        onChangeText={(text) => setFormData({ ...formData, notes: text })}
                        placeholder="Aggiungi note o informazioni aggiuntive..."
                        multiline
                        numberOfLines={4}
                        outlineColor={theme.border}
                        activeOutlineColor={theme.primary}
                        textColor={theme.text}
                        style={[
                            styles.input,
                            styles.textArea,
                            { backgroundColor: theme.inputBg },
                        ]}
                    />
                </View>
            </View>
        </View>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 0:
                return renderBasicInfo();
            case 1:
                return renderCompanyInfo();
            case 2:
                return renderAddress();
            case 3:
                return renderAdditionalInfo();
            default:
                return null;
        }
    };

    // ============================================================
    // MAIN RENDER
    // ============================================================
    if (loadingData) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.mainBg }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                        Caricamento dati...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.mainBg }]}>
            <StatusBar
                barStyle={darkMode ? 'light-content' : 'dark-content'}
                backgroundColor={theme.mainBg}
            />

            {/* Header */}
            <View style={[
                styles.header,
                { backgroundColor: theme.cardBg },
                isDesktop && styles.desktopHeader,
            ]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {isEditing ? 'Modifica Cliente' : 'Aggiungi Cliente'}
                </Text>

                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.primary }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Save size={20} color="#fff" />
                            <Text style={styles.saveButtonText}>Salva</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Content */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.scrollContent,
                        isDesktop && styles.desktopScrollContent,
                    ]}
                >
                    {/* Main Card */}
                    <View style={[
                        styles.mainCard,
                        { backgroundColor: theme.cardBg },
                        isDesktop && styles.desktopCard,
                        isLargeScreen && styles.largeScreenCard,
                    ]}>
                        {/* Step Indicator */}
                        {renderStepIndicator()}

                        {/* Step Content */}
                        {renderCurrentStep()}

                        {/* Navigation Buttons */}
                        <View style={[
                            styles.navigationButtons,
                            isDesktop && styles.desktopNavButtons,
                        ]}>
                            <TouchableOpacity
                                style={[
                                    styles.navButton,
                                    styles.backNavButton,
                                    {
                                        backgroundColor: theme.cardBg,
                                        borderColor: theme.border,
                                    },
                                    currentStep === 0 && styles.disabledButton,
                                ]}
                                onPress={handleBack}
                                disabled={currentStep === 0}
                            >
                                <ChevronLeft size={20} color={currentStep === 0 ? theme.textMuted : theme.text} />
                                <Text style={[
                                    styles.navButtonText,
                                    { color: currentStep === 0 ? theme.textMuted : theme.text }
                                ]}>
                                    Indietro
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.navButton,
                                    styles.nextNavButton,
                                    { backgroundColor: theme.primary },
                                ]}
                                onPress={handleNext}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.nextButtonText}>
                                            {currentStep === totalSteps - 1 ? 'Conferma' : 'Avanti'}
                                        </Text>
                                        {currentStep === totalSteps - 1 ? (
                                            <Check size={20} color="#fff" />
                                        ) : (
                                            <ChevronRight size={20} color="#fff" />
                                        )}
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
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
    },

    // Loading
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2d3748',
    },
    desktopHeader: {
        paddingHorizontal: 40,
        paddingVertical: 20,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        flex: 1,
        marginLeft: 16,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },

    // Content
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    desktopScrollContent: {
        alignItems: 'center',
        padding: 40,
    },

    // Main Card
    mainCard: {
        borderRadius: 20,
        padding: 24,
        width: '100%',
    },
    desktopCard: {
        maxWidth: 800,
        padding: 40,
    },
    largeScreenCard: {
        maxWidth: 1000,
    },

    // Progress
    mobileProgress: {
        marginBottom: 24,
        gap: 8,
    },
    stepText: {
        fontSize: 14,
        textAlign: 'center',
    },

    // Steps
    stepsContainer: {
        flexDirection: 'row',
        marginBottom: 32,
        borderBottomWidth: 1,
        borderBottomColor: '#2d3748',
    },
    desktopSteps: {
        marginBottom: 40,
    },
    stepItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 16,
        gap: 8,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    stepIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepLabel: {
        fontSize: 14,
        fontWeight: '600',
    },

    // Step Content
    stepContent: {
        marginBottom: 32,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    stepDescription: {
        fontSize: 16,
        marginBottom: 24,
    },

    // Inputs
    inputGroup: {
        gap: 20,
    },
    desktopInputGroup: {
        gap: 24,
    },
    inputWrapper: {
        gap: 6,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 16,
    },
    desktopRow: {
        gap: 20,
    },
    flexInput: {
        flex: 1,
        gap: 6,
    },
    fullWidth: {
        width: '100%',
    },
    halfWidth: {
        width: '48%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    input: {
        fontSize: 16,
        borderRadius: 12,
    },
    textArea: {
        minHeight: 120,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: 4,
    },

    // Switch
    switchWrapper: {
        padding: 20,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    switchContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    switchTextContainer: {
        flex: 1,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    switchDescription: {
        fontSize: 14,
    },

    // Radio
    radioGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        padding: 12,
        borderRadius: 12,
    },
    radioOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#374151',
    },
    radioText: {
        fontSize: 14,
        fontWeight: '500',
    },

    // Empty State
    emptyStateCard: {
        padding: 40,
        borderRadius: 16,
        alignItems: 'center',
        gap: 16,
    },
    emptyStateText: {
        fontSize: 16,
        textAlign: 'center',
    },

    // Navigation
    navigationButtons: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 32,
    },
    desktopNavButtons: {
        justifyContent: 'space-between',
        marginTop: 40,
    },
    navButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    backNavButton: {
        borderWidth: 1,
    },
    nextNavButton: {
        // Specific styles
    },
    navButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.5,
    },
});

export default AddCustomerScreen;
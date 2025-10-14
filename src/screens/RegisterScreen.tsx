// src/screens/RegisterScreen.tsx - VERSIONE RESPONSIVE WEB/MOBILE
import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Platform,
    KeyboardAvoidingView,
    Alert,
    Animated,
    Dimensions,
    useWindowDimensions,
} from 'react-native';
import {Text, ProgressBar, TextInput, ActivityIndicator} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import {
    Mail,
    Lock,
    User,
    Phone,
    Building,
    ArrowRight,
    ArrowLeft,
    Car,
    Wrench,
    CheckCircle,
    MapPin,
    FileText,
} from 'lucide-react-native';

// Firebase
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Analytics
import { logRegistration } from '../utils/analytics';

// Store
import { useStore } from '../store';

type UserType = 'owner' | 'mechanic';

interface FormData {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phone: string;
    workshopName?: string;
    vatNumber?: string;
    address?: string;
}

const RegisterScreen = () => {
    const navigation = useNavigation();
    const { setUser } = useStore();
    const { width } = useWindowDimensions();

    // Determina se è desktop/tablet (breakpoint)
    const isDesktop = width >= 768;
    const isTablet = width >= 600 && width < 768;
    const isMobile = width < 600;

    // Stati
    const [currentStep, setCurrentStep] = useState(0);
    const [userType, setUserType] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        workshopName: '',
        vatNumber: '',
        address: '',
    });
    const [errors, setErrors] = useState<Partial<FormData>>({});

    // Animazioni
    const fadeAnim = useState(new Animated.Value(1))[0];
    const slideAnim = useState(new Animated.Value(0))[0];

    const totalSteps = 3;
    const progress = (currentStep + 1) / totalSteps;

    // Animazione cambio step
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, [currentStep]);

    // Validazione
    const validateStep = () => {
        const newErrors: Partial<FormData> = {};

        if (currentStep === 1) {
            if (!formData.email.trim()) {
                newErrors.email = 'Email richiesta';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                newErrors.email = 'Email non valida';
            }

            if (!formData.password) {
                newErrors.password = 'Password richiesta';
            } else if (formData.password.length < 6) {
                newErrors.password = 'Password troppo corta (min. 6 caratteri)';
            }

            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Le password non coincidono';
            }
        }

        if (currentStep === 2) {
            if (!formData.firstName.trim()) {
                newErrors.firstName = 'Nome richiesto';
            }
            if (!formData.lastName.trim()) {
                newErrors.lastName = 'Cognome richiesto';
            }
            if (userType === 'mechanic') {
                if (!formData.workshopName?.trim()) {
                    newErrors.workshopName = 'Nome officina richiesto';
                }
                if (!formData.phone?.trim()) {
                    newErrors.phone = 'Numero di telefono richiesto';
                }
                if (!formData.address?.trim()) {
                    newErrors.address = 'Indirizzo richiesto';
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Navigazione
    const handleNext = () => {
        if (validateStep()) {
            if (currentStep < totalSteps - 1) {
                fadeAnim.setValue(0);
                slideAnim.setValue(20);
                setCurrentStep(currentStep + 1);
            } else {
                handleRegister();
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

    // Registrazione
    const handleRegister = async () => {
        if (!validateStep()) return;

        setLoading(true);

        try {
            console.log('🔐 Inizio registrazione...');

            // 1. Crea utente Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email.trim(),
                formData.password
            );

            const userId = userCredential.user.uid;
            console.log('✅ Utente creato su Firebase Auth:', userId);

            // 2. Determina tipo per Firestore
            const firestoreUserType = userType === 'owner' ? 'user' : 'mechanic';

            // 3. Prepara dati utente
            const userData: any = {
                uid: userId,
                email: formData.email.trim(),
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
                userType: firestoreUserType,
                role: userType,
                phone: formData.phone?.trim() || null,
                emailVerified: false,
                loginProvider: 'email',
                profileComplete: true,
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp(),
            };

            // 4. Aggiungi campi specifici per meccanici
            if (userType === 'mechanic') {
                userData.workshopName = formData.workshopName?.trim() || null;
                userData.address = formData.address?.trim() || null;
                userData.vatNumber = formData.vatNumber?.trim() || null;
                userData.rating = 0;
                userData.reviewsCount = 0;
                userData.verified = false;
            }

            // 5. Salva su Firestore
            await setDoc(doc(db, 'users', userId), userData);
            console.log('✅ Dati salvati su Firestore');

            // 6. Analytics
            logRegistration(userType || 'owner');

            // 7. Aggiorna Store
            setUser({
                id: userId,
                uid: userId,
                name: userData.name,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                isLoggedIn: true,
                isMechanic: userType === 'mechanic',
                userType: firestoreUserType,
                role: userType,
                phoneNumber: userData.phone || undefined,
                emailVerified: false,
                profileComplete: true,
                ...(userType === 'mechanic' && {
                    workshopName: userData.workshopName,
                    workshopAddress: userData.address,
                    vatNumber: userData.vatNumber,
                    rating: 0,
                    reviewsCount: 0,
                    verified: false,
                }),
            });

            // 8. Successo
            Alert.alert(
                'Successo! 🎉',
                `Benvenuto ${formData.firstName}! Il tuo account è stato creato.`,
                [{ text: 'OK' }]
            );
        } catch (error: any) {
            console.error('❌ Errore registrazione:', error);

            let errorMessage = 'Errore durante la registrazione';

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Email già registrata';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password troppo debole';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Errore di connessione';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Email non valida';
            }

            Alert.alert('Errore', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // RENDER STEPS
    // ============================================================

    const renderUserTypeSelection = () => (
        <View style={[styles.stepContainer, isDesktop && styles.stepContainerDesktop]}>
            <Text style={styles.stepTitle}>Scegli il tuo profilo</Text>
            <Text style={styles.stepSubtitle}>
                Seleziona il tipo di account che vuoi creare
            </Text>

            <View style={[styles.userTypeContainer, isDesktop && styles.userTypeContainerDesktop]}>
                {/* Owner Card */}
                <TouchableOpacity
                    style={[
                        styles.userTypeCard,
                        userType === 'owner' && styles.userTypeCardActive,
                        isDesktop && styles.userTypeCardDesktop,
                    ]}
                    onPress={() => setUserType('owner')}
                    disabled={loading}
                >
                    <View style={[
                        styles.userTypeIconContainer,
                        userType === 'owner' && styles.userTypeIconContainerActive
                    ]}>
                        <Car size={isDesktop ? 36 : 32} color={userType === 'owner' ? '#3b82f6' : '#64748b'} />
                    </View>
                    <Text style={[
                        styles.userTypeTitle,
                        userType === 'owner' && styles.userTypeTitleActive
                    ]}>
                        Proprietario Auto
                    </Text>
                    <Text style={styles.userTypeDescription}>
                        Gestisci le tue automobili, manutenzioni e documenti
                    </Text>
                    {userType === 'owner' && (
                        <View style={styles.userTypeCheckmark}>
                            <CheckCircle size={24} color="#3b82f6" />
                        </View>
                    )}
                </TouchableOpacity>

                {/* Mechanic Card */}
                <TouchableOpacity
                    style={[
                        styles.userTypeCard,
                        userType === 'mechanic' && styles.userTypeCardActive,
                        isDesktop && styles.userTypeCardDesktop,
                    ]}
                    onPress={() => setUserType('mechanic')}
                    disabled={loading}
                >
                    <View style={[
                        styles.userTypeIconContainer,
                        userType === 'mechanic' && styles.userTypeIconContainerActive
                    ]}>
                        <Wrench size={isDesktop ? 36 : 32} color={userType === 'mechanic' ? '#3b82f6' : '#64748b'} />
                    </View>
                    <Text style={[
                        styles.userTypeTitle,
                        userType === 'mechanic' && styles.userTypeTitleActive
                    ]}>
                        Meccanico / Officina
                    </Text>
                    <Text style={styles.userTypeDescription}>
                        Gestisci clienti, riparazioni e fatturazione
                    </Text>
                    {userType === 'mechanic' && (
                        <View style={styles.userTypeCheckmark}>
                            <CheckCircle size={24} color="#3b82f6" />
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderCredentialsStep = () => (
        <View style={[styles.stepContainer, isDesktop && styles.stepContainerDesktop]}>
            <Text style={styles.stepTitle}>Crea il tuo account</Text>
            <Text style={styles.stepSubtitle}>
                Inserisci email e password per iniziare
            </Text>

            <View style={[styles.formContainer, isDesktop && styles.formContainerDesktop]}>
                {/* Email */}
                <View style={styles.inputWrapper}>
                    <Mail size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                        mode="outlined"
                        label="Email"
                        value={formData.email}
                        onChangeText={(text) => {
                            setFormData({ ...formData, email: text });
                            setErrors({ ...errors, email: '' });
                        }}
                        error={!!errors.email}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                        disabled={loading}
                        theme={{
                            colors: {
                                primary: '#3b82f6',
                                outline: errors.email ? '#ef4444' : '#e2e8f0',
                            },
                        }}
                    />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                {/* Password */}
                <View style={styles.inputWrapper}>
                    <Lock size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                        mode="outlined"
                        label="Password"
                        value={formData.password}
                        onChangeText={(text) => {
                            setFormData({ ...formData, password: text });
                            setErrors({ ...errors, password: '' });
                        }}
                        error={!!errors.password}
                        secureTextEntry
                        autoCapitalize="none"
                        style={styles.input}
                        disabled={loading}
                        theme={{
                            colors: {
                                primary: '#3b82f6',
                                outline: errors.password ? '#ef4444' : '#e2e8f0',
                            },
                        }}
                    />
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                {/* Confirm Password */}
                <View style={styles.inputWrapper}>
                    <Lock size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                        mode="outlined"
                        label="Conferma Password"
                        value={formData.confirmPassword}
                        onChangeText={(text) => {
                            setFormData({ ...formData, confirmPassword: text });
                            setErrors({ ...errors, confirmPassword: '' });
                        }}
                        error={!!errors.confirmPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        style={styles.input}
                        disabled={loading}
                        theme={{
                            colors: {
                                primary: '#3b82f6',
                                outline: errors.confirmPassword ? '#ef4444' : '#e2e8f0',
                            },
                        }}
                    />
                </View>
                {errors.confirmPassword && (
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
            </View>
        </View>
    );

    const renderPersonalInfoStep = () => (
        <View style={[styles.stepContainer, isDesktop && styles.stepContainerDesktop]}>
            <Text style={styles.stepTitle}>
                Dati {userType === 'mechanic' ? 'Officina' : 'Personali'}
            </Text>
            <Text style={styles.stepSubtitle}>
                {userType === 'mechanic'
                    ? 'Completa il profilo della tua officina'
                    : 'Completa il tuo profilo personale'}
            </Text>

            <ScrollView
                style={styles.formScrollContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.formContainer, isDesktop && styles.formContainerDesktop]}>
                    {/* Nome e Cognome - Side by side on desktop */}
                    <View style={[isDesktop && styles.rowInputs]}>
                        <View style={[styles.inputWrapper, isDesktop && styles.halfWidth]}>
                            <User size={20} color="#64748b" style={styles.inputIcon} />
                            <TextInput
                                mode="outlined"
                                label="Nome"
                                value={formData.firstName}
                                onChangeText={(text) => {
                                    setFormData({ ...formData, firstName: text });
                                    setErrors({ ...errors, firstName: '' });
                                }}
                                error={!!errors.firstName}
                                style={styles.input}
                                disabled={loading}
                                theme={{
                                    colors: {
                                        primary: '#3b82f6',
                                        outline: errors.firstName ? '#ef4444' : '#e2e8f0',
                                    },
                                }}
                            />
                        </View>
                        {errors.firstName && !isDesktop && (
                            <Text style={styles.errorText}>{errors.firstName}</Text>
                        )}

                        <View style={[styles.inputWrapper, isDesktop && styles.halfWidth]}>
                            <User size={20} color="#64748b" style={styles.inputIcon} />
                            <TextInput
                                mode="outlined"
                                label="Cognome"
                                value={formData.lastName}
                                onChangeText={(text) => {
                                    setFormData({ ...formData, lastName: text });
                                    setErrors({ ...errors, lastName: '' });
                                }}
                                error={!!errors.lastName}
                                style={styles.input}
                                disabled={loading}
                                theme={{
                                    colors: {
                                        primary: '#3b82f6',
                                        outline: errors.lastName ? '#ef4444' : '#e2e8f0',
                                    },
                                }}
                            />
                        </View>
                        {errors.lastName && !isDesktop && (
                            <Text style={styles.errorText}>{errors.lastName}</Text>
                        )}
                    </View>

                    {/* Errori desktop */}
                    {isDesktop && (
                        <View style={styles.rowInputs}>
                            {errors.firstName && (
                                <Text style={[styles.errorText, styles.halfWidth]}>
                                    {errors.firstName}
                                </Text>
                            )}
                            {errors.lastName && (
                                <Text style={[styles.errorText, styles.halfWidth]}>
                                    {errors.lastName}
                                </Text>
                            )}
                        </View>
                    )}

                    {/* Campi specifici per meccanico */}
                    {userType === 'mechanic' && (
                        <>
                            {/* Workshop Name */}
                            <View style={styles.inputWrapper}>
                                <Building size={20} color="#64748b" style={styles.inputIcon} />
                                <TextInput
                                    mode="outlined"
                                    label="Nome Officina"
                                    value={formData.workshopName}
                                    onChangeText={(text) => {
                                        setFormData({ ...formData, workshopName: text });
                                        setErrors({ ...errors, workshopName: '' });
                                    }}
                                    error={!!errors.workshopName}
                                    style={styles.input}
                                    disabled={loading}
                                    theme={{
                                        colors: {
                                            primary: '#3b82f6',
                                            outline: errors.workshopName ? '#ef4444' : '#e2e8f0',
                                        },
                                    }}
                                />
                            </View>
                            {errors.workshopName && (
                                <Text style={styles.errorText}>{errors.workshopName}</Text>
                            )}

                            {/* Phone */}
                            <View style={styles.inputWrapper}>
                                <Phone size={20} color="#64748b" style={styles.inputIcon} />
                                <TextInput
                                    mode="outlined"
                                    label="Telefono"
                                    value={formData.phone}
                                    onChangeText={(text) => {
                                        setFormData({ ...formData, phone: text });
                                        setErrors({ ...errors, phone: '' });
                                    }}
                                    error={!!errors.phone}
                                    keyboardType="phone-pad"
                                    style={styles.input}
                                    disabled={loading}
                                    theme={{
                                        colors: {
                                            primary: '#3b82f6',
                                            outline: errors.phone ? '#ef4444' : '#e2e8f0',
                                        },
                                    }}
                                />
                            </View>
                            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

                            {/* Address */}
                            <View style={styles.inputWrapper}>
                                <MapPin size={20} color="#64748b" style={styles.inputIcon} />
                                <TextInput
                                    mode="outlined"
                                    label="Indirizzo"
                                    value={formData.address}
                                    onChangeText={(text) => {
                                        setFormData({ ...formData, address: text });
                                        setErrors({ ...errors, address: '' });
                                    }}
                                    error={!!errors.address}
                                    style={styles.input}
                                    disabled={loading}
                                    theme={{
                                        colors: {
                                            primary: '#3b82f6',
                                            outline: errors.address ? '#ef4444' : '#e2e8f0',
                                        },
                                    }}
                                />
                            </View>
                            {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}

                            {/* VAT Number */}
                            <View style={styles.inputWrapper}>
                                <FileText size={20} color="#64748b" style={styles.inputIcon} />
                                <TextInput
                                    mode="outlined"
                                    label="Partita IVA (opzionale)"
                                    value={formData.vatNumber}
                                    onChangeText={(text) => {
                                        setFormData({ ...formData, vatNumber: text });
                                    }}
                                    keyboardType="numeric"
                                    style={styles.input}
                                    disabled={loading}
                                    theme={{
                                        colors: {
                                            primary: '#3b82f6',
                                            outline: '#e2e8f0',
                                        },
                                    }}
                                />
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>
        </View>
    );

    const renderStep = () => {
        return (
            <Animated.View
                style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                }}
            >
                {currentStep === 0 && renderUserTypeSelection()}
                {currentStep === 1 && renderCredentialsStep()}
                {currentStep === 2 && renderPersonalInfoStep()}
            </Animated.View>
        );
    };

    // ============================================================
    // RENDER PRINCIPALE
    // ============================================================

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.container}>
                {/* Header con Progress Bar */}
                <View style={[styles.header, isDesktop && styles.headerDesktop]}>
                    <View style={[styles.headerContent, isDesktop && styles.headerContentDesktop]}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleBack}
                            disabled={loading}
                        >
                            <ArrowLeft size={20} color="#64748b" />
                        </TouchableOpacity>
                        <View style={styles.progressContainer}>
                            <Text style={styles.progressText}>
                                Passo {currentStep + 1} di {totalSteps}
                            </Text>
                            <ProgressBar
                                progress={progress}
                                color="#3b82f6"
                                style={styles.progressBar}
                            />
                        </View>
                        <View style={styles.backButton} />
                    </View>
                </View>

                {/* Content */}
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        isDesktop && styles.scrollContentDesktop
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    {renderStep()}
                </ScrollView>

                {/* Footer con bottoni */}
                <View style={[styles.footer, isDesktop && styles.footerDesktop]}>
                    <View style={[styles.footerContent, isDesktop && styles.footerContentDesktop]}>
                        {currentStep > 0 && (
                            <TouchableOpacity
                                style={[styles.backButtonFooter, isDesktop && styles.backButtonFooterDesktop]}
                                onPress={handleBack}
                                disabled={loading}
                            >
                                <ArrowLeft size={20} color="#64748b" />
                                <Text style={styles.backButtonText}>Indietro</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[
                                styles.nextButton,
                                loading && styles.nextButtonDisabled,
                                currentStep === 0 && !userType && styles.nextButtonDisabled,
                                isDesktop && styles.nextButtonDesktop,
                                currentStep === 0 && styles.nextButtonFull,
                            ]}
                            onPress={handleNext}
                            disabled={loading || (currentStep === 0 && !userType)}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.nextButtonText}>
                                        {currentStep === totalSteps - 1 ? 'Completa' : 'Continua'}
                                    </Text>
                                    <ArrowRight size={20} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
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
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: 16,
    },
    headerDesktop: {
        paddingTop: 20,
    },
    headerContent: {
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerContentDesktop: {
        maxWidth: 900,
        width: '100%',
        alignSelf: 'center',
    },
    backButton: {
        padding: 8,
        width: 40,
    },
    progressContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    progressText: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 8,
        textAlign: 'center',
        fontWeight: '600',
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        backgroundColor: '#e2e8f0',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
    },
    scrollContentDesktop: {
        paddingVertical: 48,
        paddingHorizontal: 32,
    },
    stepContainer: {
        width: '100%',
    },
    stepContainerDesktop: {
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
    },
    stepTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'center',
    },
    stepSubtitle: {
        fontSize: 15,
        color: '#64748b',
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: 22,
    },
    userTypeContainer: {
        gap: 16,
    },
    userTypeContainerDesktop: {
        flexDirection: 'row',
        gap: 24,
    },
    userTypeCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        position: 'relative',
    },
    userTypeCardDesktop: {
        flex: 1,
        minHeight: 280,
    },
    userTypeCardActive: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    userTypeIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    userTypeIconContainerActive: {
        backgroundColor: '#dbeafe',
    },
    userTypeTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    userTypeTitleActive: {
        color: '#3b82f6',
    },
    userTypeDescription: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
    userTypeCheckmark: {
        position: 'absolute',
        top: 16,
        right: 16,
    },
    formContainer: {
        width: '100%',
    },
    formContainerDesktop: {
        maxWidth: 600,
        alignSelf: 'center',
    },
    formScrollContainer: {
        maxHeight: 400,
    },
    rowInputs: {
        flexDirection: 'row',
        gap: 16,
    },
    halfWidth: {
        flex: 1,
    },
    inputWrapper: {
        position: 'relative',
        marginBottom: 16,
    },
    inputIcon: {
        position: 'absolute',
        left: 16,
        top: 28,
        zIndex: 1,
    },
    input: {
        backgroundColor: '#fff',
        paddingLeft: 48,
    },
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: -12,
        marginBottom: 8,
        marginLeft: 16,
    },
    footer: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    footerDesktop: {
        paddingVertical: 24,
    },
    footerContent: {
        flexDirection: 'row',
        gap: 12,
    },
    footerContentDesktop: {
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
    },
    backButtonFooter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        gap: 8,
    },
    backButtonFooterDesktop: {
        maxWidth: 200,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
    },
    nextButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#3b82f6',
        gap: 8,
    },
    nextButtonDesktop: {
        flex: 1,
    },
    nextButtonFull: {
        flex: 1,
    },
    nextButtonDisabled: {
        backgroundColor: '#94a3b8',
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});

export default RegisterScreen;
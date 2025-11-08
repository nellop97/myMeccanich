// src/screens/OAuthRegistrationScreen.tsx - Completa registrazione OAuth
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
    useWindowDimensions,
    ActivityIndicator,
} from 'react-native';
import { Text, ProgressBar, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import {
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
import { doc, getDoc } from 'firebase/firestore';

// Services
import { authService } from '../services/AuthService';

// Analytics
import { logRegistration } from '../utils/analytics';

// Store
import { useStore } from '../store';

type UserType = 'owner' | 'mechanic';

interface FormData {
    phone?: string;
    workshopName?: string;
    vatNumber?: string;
    address?: string;
}

const OAuthRegistrationScreen = () => {
    const navigation = useNavigation();
    const { setUser } = useStore();
    const { width } = useWindowDimensions();

    // Determina se è desktop/tablet
    const isDesktop = width >= 768;

    // Stati
    const [currentStep, setCurrentStep] = useState(0);
    const [userType, setUserType] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [formData, setFormData] = useState<FormData>({
        phone: '',
        workshopName: '',
        vatNumber: '',
        address: '',
    });
    const [errors, setErrors] = useState<Partial<FormData>>({});

    // Animazioni
    const fadeAnim = useState(new Animated.Value(1))[0];
    const slideAnim = useState(new Animated.Value(0))[0];

    const totalSteps = 2;
    const progress = (currentStep + 1) / totalSteps;

    // Carica dati utente OAuth
    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        const user = auth.currentUser;
        if (!user) {
            Alert.alert('Errore', 'Nessun utente autenticato');
            navigation.navigate('Login' as never);
            return;
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            setUserData(userDoc.data());
        }
    };

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

        if (currentStep === 1 && userType === 'mechanic') {
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
                handleCompleteRegistration();
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        } else {
            // Logout e torna al login
            authService.logout();
            navigation.navigate('Login' as never);
        }
    };

    // Completa registrazione
    const handleCompleteRegistration = async () => {
        if (!validateStep() || !userType) return;

        setLoading(true);

        try {
            console.log('🔐 Completamento registrazione OAuth...');

            // Completa il profilo
            const updatedProfile = await authService.completeOAuthProfile(
                userType,
                {
                    workshopName: formData.workshopName,
                    phone: formData.phone,
                    address: formData.address,
                    vatNumber: formData.vatNumber,
                }
            );

            console.log('✅ Profilo completato:', updatedProfile);

            // Analytics
            logRegistration(userType);

            // Aggiorna Store
            const firestoreUserType = userType === 'owner' ? 'user' : 'mechanic';
            setUser({
                id: updatedProfile.uid,
                uid: updatedProfile.uid,
                name: updatedProfile.displayName || `${updatedProfile.firstName} ${updatedProfile.lastName}`,
                email: updatedProfile.email,
                firstName: updatedProfile.firstName,
                lastName: updatedProfile.lastName,
                isLoggedIn: true,
                isMechanic: userType === 'mechanic',
                userType: firestoreUserType,
                role: userType,
                phoneNumber: formData.phone || undefined,
                emailVerified: updatedProfile.emailVerified || false,
                profileComplete: true,
                photoURL: updatedProfile.photoURL,
                ...(userType === 'mechanic' && {
                    workshopName: formData.workshopName,
                    workshopAddress: formData.address,
                    vatNumber: formData.vatNumber,
                    rating: 0,
                    reviewsCount: 0,
                    verified: false,
                }),
            });

            // Successo - redirect automatico tramite AppNavigator
            Alert.alert(
                'Benvenuto! 🎉',
                `Il tuo profilo ${userType === 'mechanic' ? 'officina' : 'proprietario'} è stato completato.`,
                [{ text: 'OK' }]
            );
        } catch (error: any) {
            console.error('❌ Errore completamento registrazione:', error);
            Alert.alert('Errore', error.message || 'Errore durante il completamento della registrazione');
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // RENDER STEPS
    // ============================================================

    const renderUserTypeSelection = () => (
        <View style={[styles.stepContainer, isDesktop && styles.stepContainerDesktop]}>
            <Text style={styles.stepTitle}>Completa il tuo profilo</Text>
            <Text style={styles.stepSubtitle}>
                Ciao {userData?.firstName || 'utente'}! Seleziona il tipo di account
            </Text>

            {/* Info utente OAuth */}
            <View style={styles.oauthInfoCard}>
                <Text style={styles.oauthInfoLabel}>Email:</Text>
                <Text style={styles.oauthInfoValue}>{userData?.email}</Text>
                {userData?.displayName && (
                    <>
                        <Text style={styles.oauthInfoLabel}>Nome:</Text>
                        <Text style={styles.oauthInfoValue}>{userData.displayName}</Text>
                    </>
                )}
            </View>

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

    const renderAdditionalInfoStep = () => (
        <View style={[styles.stepContainer, isDesktop && styles.stepContainerDesktop]}>
            <Text style={styles.stepTitle}>
                {userType === 'mechanic' ? 'Dati Officina' : 'Dati Aggiuntivi (opzionali)'}
            </Text>
            <Text style={styles.stepSubtitle}>
                {userType === 'mechanic'
                    ? 'Completa il profilo della tua officina'
                    : 'Aggiungi informazioni aggiuntive al tuo profilo'}
            </Text>

            <ScrollView
                style={styles.formScrollContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.formContainer, isDesktop && styles.formContainerDesktop]}>
                    {userType === 'mechanic' ? (
                        <>
                            {/* Workshop Name */}
                            <View style={styles.inputWrapper}>
                                <Building size={20} color="#64748b" style={styles.inputIcon} />
                                <TextInput
                                    mode="outlined"
                                    label="Nome Officina *"
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
                                    label="Telefono *"
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
                                    label="Indirizzo *"
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
                    ) : (
                        <>
                            {/* Phone (opzionale per owner) */}
                            <View style={styles.inputWrapper}>
                                <Phone size={20} color="#64748b" style={styles.inputIcon} />
                                <TextInput
                                    mode="outlined"
                                    label="Telefono (opzionale)"
                                    value={formData.phone}
                                    onChangeText={(text) => {
                                        setFormData({ ...formData, phone: text });
                                    }}
                                    keyboardType="phone-pad"
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
                            <Text style={styles.helperText}>
                                Puoi saltare questo passaggio e completarlo in seguito dal tuo profilo
                            </Text>
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
                {currentStep === 1 && renderAdditionalInfoStep()}
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
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
    },
    oauthInfoCard: {
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    oauthInfoLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
        marginTop: 8,
    },
    oauthInfoValue: {
        fontSize: 14,
        color: '#1e293b',
        marginBottom: 4,
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
    helperText: {
        fontSize: 12,
        color: '#64748b',
        marginTop: -8,
        marginBottom: 16,
        marginLeft: 16,
        fontStyle: 'italic',
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

export default OAuthRegistrationScreen;

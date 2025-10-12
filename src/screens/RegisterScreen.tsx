// src/screens/RegisterScreen.tsx - VERSIONE AGGIORNATA CON NUOVO DESIGN SYSTEM
import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Dimensions,
    StatusBar,
    Alert,
    Animated,
    TouchableOpacity,
} from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Mail,
    Lock,
    User,
    Phone,
    ArrowRight,
    ArrowLeft,
    CheckCircle,
    Car,
    Wrench,
    UserPlus,
} from 'lucide-react-native';

// Firebase
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Custom Components & Hooks
import {
    ThemedInput,
    GradientButton,
    GlassCard,
    DividerWithText,
    SocialButton,
} from '../components/CommonComponents';
import { useAppThemeManager } from '../hooks/useTheme';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isSmallScreen = width < 375;

type UserType = 'user' | 'mechanic';

interface FormData {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phone: string;
    workshopName?: string;
}

const RegisterScreen = () => {
    const navigation = useNavigation();
    const { colors, isDark } = useAppThemeManager();

    // Form State
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
    });

    const [errors, setErrors] = useState<Partial<FormData>>({});

    // Animation Values
    const fadeAnim = useState(new Animated.Value(0))[0];
    const slideAnim = useState(new Animated.Value(30))[0];

    // Calculate progress
    const totalSteps = userType === 'mechanic' ? 3 : 2;
    const progress = (currentStep + 1) / totalSteps;

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 20,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, [currentStep]);

    // ============================================
    // VALIDATION
    // ============================================
    const validateStep = (): boolean => {
        const newErrors: Partial<FormData> = {};

        if (currentStep === 0 && !userType) {
            Alert.alert('Errore', 'Seleziona il tipo di utente');
            return false;
        }

        if (currentStep === 1) {
            // Validate email
            if (!formData.email.trim()) {
                newErrors.email = 'Email richiesta';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                newErrors.email = 'Email non valida';
            }

            // Validate password
            if (!formData.password) {
                newErrors.password = 'Password richiesta';
            } else if (formData.password.length < 6) {
                newErrors.password = 'Password troppo corta (min. 6 caratteri)';
            }

            // Validate confirm password
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Le password non coincidono';
            }
        }

        if (currentStep === 2) {
            // Validate personal info
            if (!formData.firstName.trim()) {
                newErrors.firstName = 'Nome richiesto';
            }
            if (!formData.lastName.trim()) {
                newErrors.lastName = 'Cognome richiesto';
            }

            // Mechanic specific
            if (userType === 'mechanic' && !formData.workshopName?.trim()) {
                newErrors.workshopName = 'Nome officina richiesto';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ============================================
    // NAVIGATION
    // ============================================
    const handleNext = () => {
        if (validateStep()) {
            if (currentStep < totalSteps - 1) {
                setCurrentStep(currentStep + 1);
                fadeAnim.setValue(0);
                slideAnim.setValue(30);
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        tension: 20,
                        friction: 7,
                        useNativeDriver: true,
                    }),
                ]).start();
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

    // ============================================
    // REGISTRATION HANDLER
    // ============================================
    const handleRegister = async () => {
        if (!validateStep()) return;

        setLoading(true);

        try {
            // Create Firebase user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email.trim(),
                formData.password
            );

            const userId = userCredential.user.uid;

            // Save user data to Firestore
            await setDoc(doc(db, 'users', userId), {
                email: formData.email.trim(),
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                phone: formData.phone.trim(),
                isMechanic: userType === 'mechanic',
                workshopName: userType === 'mechanic' ? formData.workshopName : null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            Alert.alert('Successo', 'Registrazione completata!', [
                {
                    text: 'OK',
                    onPress: () => navigation.navigate('Login' as never),
                },
            ]);
        } catch (error: any) {
            console.error('Registration error:', error);

            let errorMessage = 'Errore durante la registrazione';

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Email già registrata';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password troppo debole';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Errore di connessione';
            }

            Alert.alert('Errore', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // RENDER STEPS
    // ============================================
    const renderUserTypeSelection = () => (
        <Animated.View
            style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
            }}
        >
            <View style={styles.stepHeader}>
                <Text style={[styles.stepTitle, { color: colors.onSurface }]}>
                    Chi sei?
                </Text>
                <Text style={[styles.stepSubtitle, { color: colors.onSurfaceVariant }]}>
                    Seleziona il tipo di account da creare
                </Text>
            </View>

            <View style={styles.userTypeContainer}>
                {/* User Card */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setUserType('user')}
                >
                    <GlassCard
                        style={[
                            styles.userTypeCard,
                            userType === 'user' && {
                                borderColor: colors.primary,
                                borderWidth: 2,
                            },
                        ]}
                    >
                        <View
                            style={[
                                styles.userTypeIcon,
                                { backgroundColor: `${colors.primary}20` },
                            ]}
                        >
                            <Car size={32} color={colors.primary} />
                        </View>
                        <Text style={[styles.userTypeTitle, { color: colors.onSurface }]}>
                            Proprietario
                        </Text>
                        <Text style={[styles.userTypeDesc, { color: colors.onSurfaceVariant }]}>
                            Gestisci le tue auto, manutenzioni e spese
                        </Text>
                        {userType === 'user' && (
                            <View style={styles.selectedBadge}>
                                <CheckCircle size={20} color={colors.primary} />
                            </View>
                        )}
                    </GlassCard>
                </TouchableOpacity>

                {/* Mechanic Card */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setUserType('mechanic')}
                >
                    <GlassCard
                        style={[
                            styles.userTypeCard,
                            userType === 'mechanic' && {
                                borderColor: colors.secondary,
                                borderWidth: 2,
                            },
                        ]}
                    >
                        <View
                            style={[
                                styles.userTypeIcon,
                                { backgroundColor: `${colors.secondary}20` },
                            ]}
                        >
                            <Wrench size={32} color={colors.secondary} />
                        </View>
                        <Text style={[styles.userTypeTitle, { color: colors.onSurface }]}>
                            Meccanico
                        </Text>
                        <Text style={[styles.userTypeDesc, { color: colors.onSurfaceVariant }]}>
                            Gestisci la tua officina e i clienti
                        </Text>
                        {userType === 'mechanic' && (
                            <View style={styles.selectedBadge}>
                                <CheckCircle size={20} color={colors.secondary} />
                            </View>
                        )}
                    </GlassCard>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    const renderCredentialsStep = () => (
        <Animated.View
            style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
            }}
        >
            <View style={styles.stepHeader}>
                <Text style={[styles.stepTitle, { color: colors.onSurface }]}>
                    Crea il tuo account
                </Text>
                <Text style={[styles.stepSubtitle, { color: colors.onSurfaceVariant }]}>
                    Inserisci email e password
                </Text>
            </View>

            <GlassCard>
                <ThemedInput
                    label="Email"
                    placeholder="tua@email.com"
                    value={formData.email}
                    onChangeText={(text) => {
                        setFormData({ ...formData, email: text });
                        setErrors({ ...errors, email: '' });
                    }}
                    error={errors.email}
                    icon={Mail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                />

                <ThemedInput
                    label="Password"
                    placeholder="Minimo 6 caratteri"
                    value={formData.password}
                    onChangeText={(text) => {
                        setFormData({ ...formData, password: text });
                        setErrors({ ...errors, password: '' });
                    }}
                    error={errors.password}
                    icon={Lock}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!loading}
                />

                <ThemedInput
                    label="Conferma Password"
                    placeholder="Ripeti la password"
                    value={formData.confirmPassword}
                    onChangeText={(text) => {
                        setFormData({ ...formData, confirmPassword: text });
                        setErrors({ ...errors, confirmPassword: '' });
                    }}
                    error={errors.confirmPassword}
                    icon={Lock}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!loading}
                />
            </GlassCard>
        </Animated.View>
    );

    const renderPersonalInfoStep = () => (
        <Animated.View
            style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
            }}
        >
            <View style={styles.stepHeader}>
                <Text style={[styles.stepTitle, { color: colors.onSurface }]}>
                    Informazioni personali
                </Text>
                <Text style={[styles.stepSubtitle, { color: colors.onSurfaceVariant }]}>
                    Dicci qualcosa su di te
                </Text>
            </View>

            <GlassCard>
                <ThemedInput
                    label="Nome"
                    placeholder="Mario"
                    value={formData.firstName}
                    onChangeText={(text) => {
                        setFormData({ ...formData, firstName: text });
                        setErrors({ ...errors, firstName: '' });
                    }}
                    error={errors.firstName}
                    icon={User}
                    autoCapitalize="words"
                    editable={!loading}
                />

                <ThemedInput
                    label="Cognome"
                    placeholder="Rossi"
                    value={formData.lastName}
                    onChangeText={(text) => {
                        setFormData({ ...formData, lastName: text });
                        setErrors({ ...errors, lastName: '' });
                    }}
                    error={errors.lastName}
                    icon={User}
                    autoCapitalize="words"
                    editable={!loading}
                />

                <ThemedInput
                    label="Telefono (opzionale)"
                    placeholder="+39 123 456 7890"
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    icon={Phone}
                    keyboardType="phone-pad"
                    editable={!loading}
                />

                {userType === 'mechanic' && (
                    <ThemedInput
                        label="Nome Officina"
                        placeholder="Auto Service Rossi"
                        value={formData.workshopName}
                        onChangeText={(text) => {
                            setFormData({ ...formData, workshopName: text });
                            setErrors({ ...errors, workshopName: '' });
                        }}
                        error={errors.workshopName}
                        icon={Wrench}
                        autoCapitalize="words"
                        editable={!loading}
                    />
                )}
            </GlassCard>
        </Animated.View>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 0:
                return renderUserTypeSelection();
            case 1:
                return renderCredentialsStep();
            case 2:
                return renderPersonalInfoStep();
            default:
                return null;
        }
    };

    // ============================================
    // RENDER
    // ============================================
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />

            {/* Background Gradient */}
            <LinearGradient
                colors={
                    isDark
                        ? ['#000000', '#1A1A1A', '#2C2C2E']
                        : ['#F8F9FA', '#E8EAED', '#FFFFFF']
                }
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <ProgressBar
                    progress={progress}
                    color={colors.primary}
                    style={styles.progressBar}
                />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.content}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View
                                style={[
                                    styles.logoCircle,
                                    { backgroundColor: `${colors.primary}15` },
                                ]}
                            >
                                <UserPlus size={40} color={colors.primary} />
                            </View>
                            <Text style={[styles.mainTitle, { color: colors.onSurface }]}>
                                Registrazione
                            </Text>
                        </View>

                        {/* Steps Content */}
                        {renderCurrentStep()}

                        {/* Navigation Buttons */}
                        <View style={styles.buttonContainer}>
                            {currentStep > 0 && (
                                <GradientButton
                                    variant="outlined"
                                    title="Indietro"
                                    onPress={handleBack}
                                    icon={ArrowLeft}
                                    disabled={loading}
                                    style={styles.backButton}
                                />
                            )}

                            <GradientButton
                                title={currentStep === totalSteps - 1 ? 'Completa' : 'Avanti'}
                                onPress={handleNext}
                                loading={loading}
                                disabled={loading}
                                icon={ArrowRight}
                                style={styles.nextButton}
                            />
                        </View>

                        {/* Login Link */}
                        {currentStep === 0 && (
                            <View style={styles.loginContainer}>
                                <Text style={[styles.loginText, { color: colors.onSurfaceVariant }]}>
                                    Hai già un account?{' '}
                                </Text>
                                <GradientButton
                                    variant="text"
                                    title="Accedi"
                                    onPress={() => navigation.navigate('Login' as never)}
                                />
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    progressContainer: {
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingHorizontal: 20,
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: isWeb ? 40 : 24,
        paddingVertical: 24,
    },
    content: {
        width: '100%',
        maxWidth: 480,
        alignSelf: 'center',
    },

    // Header
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: -0.5,
    },

    // Steps
    stepHeader: {
        marginBottom: 24,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: -0.3,
    },
    stepSubtitle: {
        fontSize: 15,
        lineHeight: 22,
        letterSpacing: 0.15,
    },

    // User Type Selection
    userTypeContainer: {
        gap: 16,
    },
    userTypeCard: {
        position: 'relative',
        alignItems: 'center',
        paddingVertical: 32,
    },
    userTypeIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    userTypeTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    userTypeDesc: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    selectedBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
    },

    // Buttons
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    backButton: {
        flex: 1,
    },
    nextButton: {
        flex: 2,
    },

    // Login Link
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    loginText: {
        fontSize: 15,
    },
});

export default RegisterScreen;
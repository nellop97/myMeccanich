// src/screens/RegisterScreen.tsx - VERSIONE AGGIORNATA CON NUOVO STILE
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
} from 'react-native';
import { Text, ProgressBar, TextInput, Button } from 'react-native-paper';
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
} from 'lucide-react-native';

// Firebase
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

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

    const totalSteps = userType === 'mechanic' ? 3 : 3;
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
            // Validazione credenziali
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
            // Validazione dati personali
            if (!formData.firstName.trim()) {
                newErrors.firstName = 'Nome richiesto';
            }
            if (!formData.lastName.trim()) {
                newErrors.lastName = 'Cognome richiesto';
            }
            if (userType === 'mechanic' && !formData.workshopName?.trim()) {
                newErrors.workshopName = 'Nome officina richiesto';
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
            // Crea utente Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email.trim(),
                formData.password
            );

            const userId = userCredential.user.uid;

            // Salva dati utente in Firestore
            await setDoc(doc(db, 'users', userId), {
                uid: userId,
                email: formData.email.trim(),
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
                phone: formData.phone.trim(),
                role: userType,
                userType: userType === 'owner' ? 'user' : 'mechanic',
                workshopName: userType === 'mechanic' ? formData.workshopName?.trim() : null,
                vatNumber: userType === 'mechanic' ? formData.vatNumber?.trim() : null,
                address: formData.address?.trim() || null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isActive: true,
                profileComplete: true,
                emailVerified: false,
            });

            Alert.alert(
                'Successo! 🎉',
                'Registrazione completata. Benvenuto!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('Login' as never),
                    },
                ]
            );
        } catch (error: any) {
            console.error('Errore registrazione:', error);

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

    // Render Steps
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

    const renderUserTypeSelection = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Chi sei?</Text>
            <Text style={styles.stepSubtitle}>
                Scegli il tipo di account che desideri creare
            </Text>

            <View style={styles.userTypeContainer}>
                {/* Proprietario */}
                <TouchableOpacity
                    style={[
                        styles.userTypeCard,
                        userType === 'owner' && styles.userTypeCardSelected,
                    ]}
                    onPress={() => setUserType('owner')}
                >
                    <View style={[styles.iconCircle, { backgroundColor: '#3b82f620' }]}>
                        <Car size={32} color="#3b82f6" />
                    </View>
                    <Text style={styles.userTypeTitle}>Proprietario Auto</Text>
                    <Text style={styles.userTypeDesc}>
                        Gestisci le tue auto, manutenzioni e scadenze
                    </Text>
                    {userType === 'owner' && (
                        <View style={styles.selectedBadge}>
                            <CheckCircle size={20} color="#10b981" />
                        </View>
                    )}
                </TouchableOpacity>

                {/* Meccanico */}
                <TouchableOpacity
                    style={[
                        styles.userTypeCard,
                        userType === 'mechanic' && styles.userTypeCardSelected,
                    ]}
                    onPress={() => setUserType('mechanic')}
                >
                    <View style={[styles.iconCircle, { backgroundColor: '#f59e0b20' }]}>
                        <Wrench size={32} color="#f59e0b" />
                    </View>
                    <Text style={styles.userTypeTitle}>Meccanico/Officina</Text>
                    <Text style={styles.userTypeDesc}>
                        Gestisci clienti, interventi e fatturazione
                    </Text>
                    {userType === 'mechanic' && (
                        <View style={styles.selectedBadge}>
                            <CheckCircle size={20} color="#10b981" />
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderCredentialsStep = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Credenziali</Text>
            <Text style={styles.stepSubtitle}>
                Inserisci email e password per il tuo account
            </Text>

            <View style={styles.inputContainer}>
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
                        autoComplete="email"
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
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Dati Personali</Text>
            <Text style={styles.stepSubtitle}>
                {userType === 'mechanic'
                    ? 'Completa il profilo della tua officina'
                    : 'Completa il tuo profilo'}
            </Text>

            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
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
                        autoCapitalize="words"
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
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

                <View style={styles.inputWrapper}>
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
                        autoCapitalize="words"
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
                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

                <View style={styles.inputWrapper}>
                    <Phone size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                        mode="outlined"
                        label="Telefono (opzionale)"
                        value={formData.phone}
                        onChangeText={(text) => setFormData({ ...formData, phone: text })}
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

                {userType === 'mechanic' && (
                    <>
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
                                autoCapitalize="words"
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

                        <View style={styles.inputWrapper}>
                            <TextInput
                                mode="outlined"
                                label="Partita IVA (opzionale)"
                                value={formData.vatNumber}
                                onChangeText={(text) => setFormData({ ...formData, vatNumber: text })}
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

                        <View style={styles.inputWrapper}>
                            <TextInput
                                mode="outlined"
                                label="Indirizzo (opzionale)"
                                value={formData.address}
                                onChangeText={(text) => setFormData({ ...formData, address: text })}
                                style={styles.input}
                                disabled={loading}
                                multiline
                                numberOfLines={2}
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
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <ProgressBar progress={progress} color="#3b82f6" style={styles.progressBar} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.content}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.mainTitle}>Registrazione</Text>
                            <Text style={styles.mainSubtitle}>
                                Passo {currentStep + 1} di {totalSteps}
                            </Text>
                        </View>

                        {/* Step Content */}
                        {renderStep()}

                        {/* Navigation Buttons */}
                        <View style={styles.buttonContainer}>
                            {currentStep > 0 && (
                                <TouchableOpacity
                                    style={[styles.button, styles.backButton]}
                                    onPress={handleBack}
                                    disabled={loading}
                                >
                                    <ArrowLeft size={20} color="#64748b" />
                                    <Text style={styles.backButtonText}>Indietro</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    styles.nextButton,
                                    (currentStep === 0 && !userType) || loading
                                        ? styles.buttonDisabled
                                        : {},
                                ]}
                                onPress={handleNext}
                                disabled={(currentStep === 0 && !userType) || loading}
                            >
                                <Text style={styles.nextButtonText}>
                                    {loading
                                        ? 'Attendi...'
                                        : currentStep === totalSteps - 1
                                            ? 'Completa'
                                            : 'Avanti'}
                                </Text>
                                {!loading && <ArrowRight size={20} color="#fff" />}
                            </TouchableOpacity>
                        </View>

                        {/* Login Link */}
                        {currentStep === 0 && (
                            <View style={styles.loginContainer}>
                                <Text style={styles.loginText}>Hai già un account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
                                    <Text style={styles.loginLink}>Accedi</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    progressContainer: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
        backgroundColor: '#e2e8f0',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
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
    mainTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 8,
    },
    mainSubtitle: {
        fontSize: 16,
        color: '#64748b',
    },

    // Steps
    stepContainer: {
        marginBottom: 24,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 8,
    },
    stepSubtitle: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 24,
    },

    // User Type Cards
    userTypeContainer: {
        gap: 16,
    },
    userTypeCard: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        position: 'relative',
    },
    userTypeCardSelected: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    iconCircle: {
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
        color: '#0f172a',
        marginBottom: 8,
    },
    userTypeDesc: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
    },
    selectedBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
    },

    // Input Container
    inputContainer: {
        gap: 16,
    },
    inputWrapper: {
        position: 'relative',
    },
    input: {
        backgroundColor: '#fff',
    },
    inputIcon: {
        position: 'absolute',
        left: 12,
        top: 20,
        zIndex: 1,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        marginTop: -12,
        marginLeft: 4,
    },

    // Buttons
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 32,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    backButton: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#e2e8f0',
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
    },
    nextButton: {
        flex: 2,
        backgroundColor: '#3b82f6',
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    buttonDisabled: {
        opacity: 0.5,
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
        color: '#64748b',
    },
    loginLink: {
        fontSize: 15,
        fontWeight: '600',
        color: '#3b82f6',
    },
});

export default RegisterScreen;
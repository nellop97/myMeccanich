// src/screens/RegisterScreen.tsx - VERSIONE CORRETTA
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
import { Text, ProgressBar, TextInput } from 'react-native-paper';
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
                    newErrors.phone = 'Numero di telefono richiesto per meccanici';
                }
                if (!formData.address?.trim()) {
                    newErrors.address = 'Indirizzo richiesto per meccanici';
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

    // ============================================================
    // REGISTRAZIONE CORRETTA CON TUTTI I CAMPI NECESSARI
    // ============================================================
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

            // 2. Determina il tipo di utente per Firestore
            const firestoreUserType = userType === 'owner' ? 'user' : 'mechanic';

            // 3. Prepara i dati utente base (comuni a tutti)
            const baseUserData = {
                uid: userId,
                email: formData.email.trim(),
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
                phone: formData.phone.trim() || '',
                role: userType,
                userType: firestoreUserType,
                loginProvider: 'email',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isActive: true,
                profileComplete: true,
                emailVerified: false,
            };

            // 4. Aggiungi campi specifici per il meccanico
            let userData;

            if (userType === 'mechanic') {
                // ✅ TUTTI I CAMPI NECESSARI PER IL MECCANICO
                userData = {
                    ...baseUserData,
                    workshopName: formData.workshopName?.trim() || '',
                    vatNumber: formData.vatNumber?.trim() || '',
                    address: formData.address?.trim() || '',
                    mechanicLicense: '', // Campo vuoto ma presente
                    rating: 0, // Rating iniziale
                    reviewsCount: 0, // Numero recensioni iniziale
                    verified: false, // Account non verificato inizialmente
                };

                console.log('✅ Dati meccanico preparati:', {
                    workshopName: userData.workshopName,
                    vatNumber: userData.vatNumber,
                    address: userData.address,
                    rating: userData.rating,
                    reviewsCount: userData.reviewsCount,
                    verified: userData.verified,
                });
            } else {
                // Dati per proprietario auto
                userData = {
                    ...baseUserData,
                    workshopName: null,
                    vatNumber: null,
                    address: formData.address?.trim() || null,
                };
            }

            // 5. Salva su Firestore
            await setDoc(doc(db, 'users', userId), userData);
            console.log('✅ Dati utente salvati su Firestore');

            // 6. Log analytics
            await logRegistration(firestoreUserType);
            console.log('✅ Analytics registrato');

            // 7. Aggiorna lo store Zustand con TUTTI i dati necessari
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
                phoneNumber: userData.phone || undefined,
                emailVerified: false,
                loginProvider: 'email',
                // Dati specifici meccanico
                ...(userType === 'mechanic' && {
                    workshopName: userData.workshopName || undefined,
                    workshopAddress: userData.address || undefined,
                    vatNumber: userData.vatNumber || undefined,
                    mechanicLicense: userData.mechanicLicense || undefined,
                    rating: userData.rating,
                    reviewsCount: userData.reviewsCount,
                    verified: userData.verified,
                }),
            });

            console.log('✅ Store aggiornato con:', {
                isMechanic: userType === 'mechanic',
                userType: firestoreUserType,
                hasAllFields: userType === 'mechanic' ?
                    'rating' in userData && 'verified' in userData : true,
            });

            // 8. Mostra successo
            Alert.alert(
                'Successo! 🎉',
                `Benvenuto ${formData.firstName}! Il tuo account è stato creato.`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // La navigazione sarà gestita automaticamente da AppNavigator
                            console.log('✅ Registrazione completata, redirect automatico...');
                        },
                    },
                ]
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
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Scegli il tuo profilo</Text>
            <Text style={styles.stepSubtitle}>
                Seleziona come vuoi utilizzare l'app
            </Text>

            <View style={styles.userTypeContainer}>
                {/* Proprietario auto */}
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
                        Gestisci le tue auto e le manutenzioni
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
            <Text style={styles.stepTitle}>Dati {userType === 'mechanic' ? 'Officina' : 'Personali'}</Text>
            <Text style={styles.stepSubtitle}>
                {userType === 'mechanic'
                    ? 'Completa il profilo della tua officina'
                    : 'Completa il tuo profilo'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.inputContainer}>
                    {/* Nome */}
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

                    {/* Cognome */}
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

                    {/* Telefono */}
                    <View style={styles.inputWrapper}>
                        <Phone size={20} color="#64748b" style={styles.inputIcon} />
                        <TextInput
                            mode="outlined"
                            label={userType === 'mechanic' ? 'Telefono *' : 'Telefono (opzionale)'}
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

                    {/* Campi specifici per meccanico */}
                    {userType === 'mechanic' && (
                        <>
                            {/* Nome Officina */}
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

                            {/* Indirizzo */}
                            <View style={styles.inputWrapper}>
                                <MapPin size={20} color="#64748b" style={styles.inputIcon} />
                                <TextInput
                                    mode="outlined"
                                    label="Indirizzo Officina *"
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
                            {errors.address && (
                                <Text style={styles.errorText}>{errors.address}</Text>
                            )}

                            {/* Partita IVA */}
                            <View style={styles.inputWrapper}>
                                <FileText size={20} color="#64748b" style={styles.inputIcon} />
                                <TextInput
                                    mode="outlined"
                                    label="Partita IVA (opzionale)"
                                    value={formData.vatNumber}
                                    onChangeText={(text) => {
                                        setFormData({ ...formData, vatNumber: text });
                                        setErrors({ ...errors, vatNumber: '' });
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
                {/* Header con progress */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Crea Account</Text>
                    <ProgressBar
                        progress={progress}
                        color="#3b82f6"
                        style={styles.progressBar}
                    />
                    <Text style={styles.stepIndicator}>
                        Step {currentStep + 1} di {totalSteps}
                    </Text>
                </View>

                {/* Contenuto step */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {renderStep()}
                </ScrollView>

                {/* Footer con pulsanti */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBack}
                        disabled={loading}
                    >
                        <ArrowLeft size={20} color="#64748b" />
                        <Text style={styles.backButtonText}>
                            {currentStep === 0 ? 'Login' : 'Indietro'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.nextButton,
                            (loading || (currentStep === 0 && !userType)) && styles.nextButtonDisabled,
                        ]}
                        onPress={handleNext}
                        disabled={loading || (currentStep === 0 && !userType)}
                    >
                        <Text style={styles.nextButtonText}>
                            {loading ? 'Caricamento...' : currentStep === totalSteps - 1 ? 'Registrati' : 'Avanti'}
                        </Text>
                        {!loading && <ArrowRight size={20} color="#fff" />}
                    </TouchableOpacity>
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
        padding: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 16,
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
        backgroundColor: '#e2e8f0',
    },
    stepIndicator: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 8,
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    stepContainer: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    stepSubtitle: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 32,
        lineHeight: 24,
    },
    userTypeContainer: {
        gap: 16,
    },
    userTypeCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        borderWidth: 2,
        borderColor: '#e2e8f0',
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
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
    },
    userTypeDesc: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
    selectedBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: '#d1fae5',
        borderRadius: 20,
        padding: 4,
    },
    inputContainer: {
        gap: 16,
    },
    inputWrapper: {
        position: 'relative',
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
        marginTop: -8,
        marginLeft: 16,
    },
    footer: {
        flexDirection: 'row',
        padding: 24,
        gap: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    backButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        gap: 8,
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
        paddingHorizontal: 24,
        borderRadius: 12,
        backgroundColor: '#3b82f6',
        gap: 8,
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
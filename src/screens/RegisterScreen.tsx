// src/screens/RegisterScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Platform,
    KeyboardAvoidingView,
    Dimensions,
} from 'react-native';
import {
    Text,
    TextInput,
    Button,
    HelperText,
    Divider,
    Card,
    Checkbox,
    RadioButton,
    Chip,
    ProgressBar,
    ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Firebase imports dal nuovo sistema
import { auth, db, handleAuthError, isWeb } from '../services/firebase';
import {
    createUserWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    User
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Import tema
import { useAppThemeManager, useThemedStyles } from '../hooks/useTheme';

interface FormData {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: 'owner' | 'mechanic';
    // Campi aggiuntivi per meccanici
    workshopName?: string;
    vatNumber?: string;
    address?: string;
    specializations?: string[];
}

const RegisterScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useAppThemeManager();
    const { dynamicStyles } = useThemedStyles();

    // State form
    const [formData, setFormData] = useState<FormData>({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'owner',
        workshopName: '',
        vatNumber: '',
        address: '',
        specializations: [],
    });

    const [errors, setErrors] = useState<Partial<FormData>>({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    // Responsive
    const screenWidth = Dimensions.get('window').width;
    const isDesktop = screenWidth > 768;

    // Specializzazioni disponibili per meccanici
    const mechanicSpecializations = [
        'Motori', 'Elettronica', 'Carrozzeria', 'Gomme',
        'Climatizzazione', 'Freni', 'Cambio', 'Diagnostica'
    ];

    // Gestione autenticazione
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            if (user) {
                console.log('✅ Utente registrato:', user.email);

                // Naviga alla dashboard appropriata
                if (formData.role === 'mechanic') {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'HomeMechanic' }],
                    });
                } else {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Main' }],
                    });
                }
            }
        });

        return unsubscribe;
    }, [navigation, formData.role]);

    // Validazione form
    const validateStep = (step: number): boolean => {
        const newErrors: Partial<FormData> = {};

        if (step === 1) {
            // Validazione dati base
            if (!formData.firstName) newErrors.firstName = 'Nome richiesto';
            if (!formData.lastName) newErrors.lastName = 'Cognome richiesto';
            if (!formData.phone) {
                newErrors.phone = 'Telefono richiesto';
            } else if (!/^[0-9+\s-]{10,}$/.test(formData.phone)) {
                newErrors.phone = 'Numero di telefono non valido';
            }
        } else if (step === 2) {
            // Validazione credenziali
            if (!formData.email) {
                newErrors.email = 'Email richiesta';
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = 'Email non valida';
            }
            if (!formData.password) {
                newErrors.password = 'Password richiesta';
            } else if (formData.password.length < 6) {
                newErrors.password = 'Password deve essere almeno 6 caratteri';
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Le password non corrispondono';
            }
        } else if (step === 3 && formData.role === 'mechanic') {
            // Validazione dati meccanico
            if (!formData.workshopName) newErrors.workshopName = 'Nome officina richiesto';
            if (!formData.vatNumber) {
                newErrors.vatNumber = 'Partita IVA richiesta';
            } else if (!/^[0-9]{11}$/.test(formData.vatNumber.replace(/\s/g, ''))) {
                newErrors.vatNumber = 'Partita IVA non valida';
            }
            if (!formData.address) newErrors.address = 'Indirizzo richiesto';
            if (!formData.specializations || formData.specializations.length === 0) {
                newErrors.specializations = ['Seleziona almeno una specializzazione'];
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Gestione registrazione
    const handleRegister = async () => {
        if (!validateStep(currentStep)) return;
        if (!acceptedTerms) {
            Alert.alert('Errore', 'Devi accettare i termini e condizioni');
            return;
        }

        setLoading(true);
        try {
            // Crea utente con email e password
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            const user = userCredential.user;

            // Aggiorna profilo con nome
            await updateProfile(user, {
                displayName: `${formData.firstName} ${formData.lastName}`,
            });

            // Prepara dati utente per Firestore
            const userData: any = {
                uid: user.uid,
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                displayName: `${formData.firstName} ${formData.lastName}`,
                phone: formData.phone,
                role: formData.role,
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp(),
                emailVerified: false,
                photoURL: '',
            };

            // Aggiungi dati specifici per meccanici
            if (formData.role === 'mechanic') {
                userData.workshopName = formData.workshopName;
                userData.vatNumber = formData.vatNumber;
                userData.address = formData.address;
                userData.specializations = formData.specializations;
            }

            // Salva in Firestore
            await setDoc(doc(db, 'users', user.uid), userData);

            console.log('✅ Registrazione completata');
            Alert.alert('Successo', 'Registrazione completata con successo!');

        } catch (error: any) {
            console.error('❌ Errore registrazione:', error);
            Alert.alert('Errore di registrazione', handleAuthError(error));
        } finally {
            setLoading(false);
        }
    };

    // Registrazione con Google
    const handleGoogleRegister = async () => {
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');

            let result;
            if (isWeb) {
                try {
                    result = await signInWithPopup(auth, provider);
                } catch (popupError: any) {
                    if (popupError.code === 'auth/popup-blocked') {
                        await signInWithRedirect(auth, provider);
                        return;
                    }
                    throw popupError;
                }
            } else {
                Alert.alert('Info', 'Google Sign-In disponibile prossimamente su mobile');
                return;
            }

            // Crea profilo utente per nuovo utente Google
            if (result?.user) {
                const userData = {
                    uid: result.user.uid,
                    email: result.user.email,
                    displayName: result.user.displayName || '',
                    firstName: result.user.displayName?.split(' ')[0] || '',
                    lastName: result.user.displayName?.split(' ').slice(1).join(' ') || '',
                    photoURL: result.user.photoURL || '',
                    phone: '',
                    role: formData.role, // Usa il ruolo selezionato
                    createdAt: serverTimestamp(),
                    lastLoginAt: serverTimestamp(),
                    provider: 'google',
                };

                // Se meccanico, chiedi dati aggiuntivi
                if (formData.role === 'mechanic') {
                    Alert.alert(
                        'Completa registrazione',
                        'Completa il tuo profilo meccanico dal pannello impostazioni dopo il login'
                    );
                }

                await setDoc(doc(db, 'users', result.user.uid), userData);
            }
        } catch (error: any) {
            console.error('Errore Google Sign-In:', error);
            Alert.alert('Errore', handleAuthError(error));
        } finally {
            setLoading(false);
        }
    };

    // Navigazione tra step
    const nextStep = () => {
        if (validateStep(currentStep)) {
            if (currentStep === 2 && formData.role === 'owner') {
                // Se proprietario, salta step 3 (dati officina)
                handleRegister();
            } else if (currentStep < 3) {
                setCurrentStep(currentStep + 1);
            } else {
                handleRegister();
            }
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Toggle specializzazioni
    const toggleSpecialization = (spec: string) => {
        const specs = formData.specializations || [];
        if (specs.includes(spec)) {
            setFormData({
                ...formData,
                specializations: specs.filter(s => s !== spec),
            });
        } else {
            setFormData({
                ...formData,
                specializations: [...specs, spec],
            });
        }
    };

    // Render Step 1 - Dati personali
    const renderStep1 = () => (
        <View style={styles.stepContent}>
            <Text variant="titleLarge" style={styles.stepTitle}>
                Informazioni personali
            </Text>

            <TextInput
                mode="outlined"
                label="Nome"
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                left={<TextInput.Icon icon="account" />}
                error={!!errors.firstName}
                disabled={loading}
            />
            <HelperText type="error" visible={!!errors.firstName}>
                {errors.firstName}
            </HelperText>

            <TextInput
                mode="outlined"
                label="Cognome"
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                left={<TextInput.Icon icon="account" />}
                error={!!errors.lastName}
                disabled={loading}
            />
            <HelperText type="error" visible={!!errors.lastName}>
                {errors.lastName}
            </HelperText>

            <TextInput
                mode="outlined"
                label="Telefono"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                left={<TextInput.Icon icon="phone" />}
                error={!!errors.phone}
                disabled={loading}
            />
            <HelperText type="error" visible={!!errors.phone}>
                {errors.phone}
            </HelperText>

            <View style={styles.roleSection}>
                <Text variant="titleMedium">Tipo di account</Text>
                <RadioButton.Group
                    onValueChange={(value) => setFormData({ ...formData, role: value as 'owner' | 'mechanic' })}
                    value={formData.role}
                >
                    <TouchableOpacity
                        style={styles.radioItem}
                        onPress={() => setFormData({ ...formData, role: 'owner' })}
                        disabled={loading}
                    >
                        <RadioButton value="owner" />
                        <View style={styles.radioContent}>
                            <Text variant="bodyLarge">Proprietario Auto</Text>
                            <Text variant="bodySmall" style={styles.radioDescription}>
                                Per gestire le tue auto personali
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.radioItem}
                        onPress={() => setFormData({ ...formData, role: 'mechanic' })}
                        disabled={loading}
                    >
                        <RadioButton value="mechanic" />
                        <View style={styles.radioContent}>
                            <Text variant="bodyLarge">Meccanico/Officina</Text>
                            <Text variant="bodySmall" style={styles.radioDescription}>
                                Per gestire un'officina e i clienti
                            </Text>
                        </View>
                    </TouchableOpacity>
                </RadioButton.Group>
            </View>
        </View>
    );

    // Render Step 2 - Credenziali
    const renderStep2 = () => (
        <View style={styles.stepContent}>
            <Text variant="titleLarge" style={styles.stepTitle}>
                Credenziali di accesso
            </Text>

            <TextInput
                mode="outlined"
                label="Email"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                left={<TextInput.Icon icon="email" />}
                error={!!errors.email}
                disabled={loading}
            />
            <HelperText type="error" visible={!!errors.email}>
                {errors.email}
            </HelperText>

            <TextInput
                mode="outlined"
                label="Password"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry={!showPassword}
                left={<TextInput.Icon icon="lock" />}
                right={
                    <TextInput.Icon
                        icon={showPassword ? 'eye-off' : 'eye'}
                        onPress={() => setShowPassword(!showPassword)}
                    />
                }
                error={!!errors.password}
                disabled={loading}
            />
            <HelperText type="error" visible={!!errors.password}>
                {errors.password}
            </HelperText>

            <TextInput
                mode="outlined"
                label="Conferma Password"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                secureTextEntry={!showConfirmPassword}
                left={<TextInput.Icon icon="lock-check" />}
                right={
                    <TextInput.Icon
                        icon={showConfirmPassword ? 'eye-off' : 'eye'}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                }
                error={!!errors.confirmPassword}
                disabled={loading}
            />
            <HelperText type="error" visible={!!errors.confirmPassword}>
                {errors.confirmPassword}
            </HelperText>

            <TouchableOpacity
                style={styles.termsContainer}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
                disabled={loading}
            >
                <Checkbox status={acceptedTerms ? 'checked' : 'unchecked'} />
                <Text style={styles.termsText}>
                    Accetto i{' '}
                    <Text style={{ color: colors.primary }}>Termini e Condizioni</Text>
                    {' '}e la{' '}
                    <Text style={{ color: colors.primary }}>Privacy Policy</Text>
                </Text>
            </TouchableOpacity>
        </View>
    );

    // Render Step 3 - Dati officina (solo meccanici)
    const renderStep3 = () => (
        <View style={styles.stepContent}>
            <Text variant="titleLarge" style={styles.stepTitle}>
                Dati Officina
            </Text>

            <TextInput
                mode="outlined"
                label="Nome Officina"
                value={formData.workshopName}
                onChangeText={(text) => setFormData({ ...formData, workshopName: text })}
                left={<TextInput.Icon icon="store" />}
                error={!!errors.workshopName}
                disabled={loading}
            />
            <HelperText type="error" visible={!!errors.workshopName}>
                {errors.workshopName}
            </HelperText>

            <TextInput
                mode="outlined"
                label="Partita IVA"
                value={formData.vatNumber}
                onChangeText={(text) => setFormData({ ...formData, vatNumber: text })}
                keyboardType="numeric"
                left={<TextInput.Icon icon="file-document" />}
                error={!!errors.vatNumber}
                disabled={loading}
            />
            <HelperText type="error" visible={!!errors.vatNumber}>
                {errors.vatNumber}
            </HelperText>

            <TextInput
                mode="outlined"
                label="Indirizzo"
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                left={<TextInput.Icon icon="map-marker" />}
                error={!!errors.address}
                disabled={loading}
                multiline
                numberOfLines={2}
            />
            <HelperText type="error" visible={!!errors.address}>
                {errors.address}
            </HelperText>

            <View style={styles.specializationsSection}>
                <Text variant="titleMedium">Specializzazioni</Text>
                <View style={styles.chipsContainer}>
                    {mechanicSpecializations.map((spec) => (
                        <Chip
                            key={spec}
                            selected={formData.specializations?.includes(spec)}
                            onPress={() => toggleSpecialization(spec)}
                            style={styles.chip}
                            disabled={loading}
                        >
                            {spec}
                        </Chip>
                    ))}
                </View>
                {errors.specializations && (
                    <HelperText type="error" visible={true}>
                        {errors.specializations[0]}
                    </HelperText>
                )}
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <LinearGradient
                colors={isDark ? ['#1a1a1a', '#2d2d2d'] : ['#2196F3', '#1976D2']}
                style={styles.backgroundGradient}
            />

            <ScrollView
                contentContainerStyle={[
                    styles.scrollContainer,
                    { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.formContainer, isDesktop && styles.formContainerDesktop]}>
                    <Card style={styles.card}>
                        <Card.Content style={styles.cardContent}>
                            {/* Header */}
                            <View style={styles.header}>
                                <MaterialCommunityIcons
                                    name="car-wrench"
                                    size={60}
                                    color={colors.primary}
                                />
                                <Text variant="headlineMedium" style={styles.title}>
                                    Registrazione
                                </Text>
                            </View>

                            {/* Progress bar */}
                            <ProgressBar
                                progress={currentStep / 3}
                                color={colors.primary}
                                style={styles.progressBar}
                            />

                            {/* Render current step */}
                            {currentStep === 1 && renderStep1()}
                            {currentStep === 2 && renderStep2()}
                            {currentStep === 3 && formData.role === 'mechanic' && renderStep3()}

                            {/* Navigation buttons */}
                            <View style={styles.navigationButtons}>
                                {currentStep > 1 && (
                                    <Button
                                        mode="outlined"
                                        onPress={prevStep}
                                        disabled={loading}
                                        style={styles.navButton}
                                    >
                                        Indietro
                                    </Button>
                                )}

                                <Button
                                    mode="contained"
                                    onPress={nextStep}
                                    loading={loading}
                                    disabled={loading}
                                    style={[styles.navButton, currentStep === 1 && styles.fullWidth]}
                                >
                                    {currentStep === 3 || (currentStep === 2 && formData.role === 'owner')
                                        ? 'Registrati'
                                        : 'Avanti'}
                                </Button>
                            </View>

                            {/* Divider */}
                            {currentStep === 1 && (
                                <>
                                    <View style={styles.dividerContainer}>
                                        <Divider style={styles.divider} />
                                        <Text style={styles.dividerText}>oppure</Text>
                                        <Divider style={styles.divider} />
                                    </View>

                                    {/* Social registration */}
                                    <Button
                                        mode="outlined"
                                        onPress={handleGoogleRegister}
                                        disabled={loading}
                                        icon="google"
                                        style={styles.socialButton}
                                    >
                                        Registrati con Google
                                    </Button>

                                    {/* Link login */}
                                    <View style={styles.footer}>
                                        <Text>Hai già un account?</Text>
                                        <Button
                                            mode="text"
                                            onPress={() => navigation.navigate('Login')}
                                            disabled={loading}
                                        >
                                            Accedi
                                        </Button>
                                    </View>
                                </>
                            )}
                        </Card.Content>
                    </Card>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    formContainer: {
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
    },
    formContainerDesktop: {
        maxWidth: 600,
    },
    card: {
        elevation: 8,
    },
    cardContent: {
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        marginTop: 16,
        fontWeight: 'bold',
    },
    progressBar: {
        marginBottom: 24,
        height: 6,
        borderRadius: 3,
    },
    stepContent: {
        marginBottom: 24,
    },
    stepTitle: {
        marginBottom: 16,
        textAlign: 'center',
    },
    roleSection: {
        marginTop: 16,
    },
    radioItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    radioContent: {
        flex: 1,
        marginLeft: 8,
    },
    radioDescription: {
        opacity: 0.6,
        marginTop: 2,
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
    },
    termsText: {
        flex: 1,
        marginLeft: 8,
    },
    specializationsSection: {
        marginTop: 16,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
        gap: 8,
    },
    chip: {
        marginBottom: 8,
    },
    navigationButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    navButton: {
        flex: 1,
    },
    fullWidth: {
        flex: 2,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    divider: {
        flex: 1,
    },
    dividerText: {
        marginHorizontal: 16,
        opacity: 0.6,
    },
    socialButton: {
        marginBottom: 16,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default RegisterScreen;
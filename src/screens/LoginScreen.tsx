// src/screens/LoginScreen.tsx
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
    Card,
    Text,
    TextInput,
    Button,
    Checkbox,
    Divider,
    HelperText,
    Surface,
    ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// Firebase imports dal nuovo sistema
import { auth, db, handleAuthError, isWeb } from '../services/firebase';
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    User
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Import tema
import { useAppThemeManager, useThemedStyles } from '../hooks/useTheme';

const LoginScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useAppThemeManager();
    const { dynamicStyles } = useThemedStyles();

    // State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [initializing, setInitializing] = useState(true);

    // Responsive
    const screenWidth = Dimensions.get('window').width;
    const isDesktop = screenWidth > 768;

    // Gestione autenticazione
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            if (user) {
                console.log('✅ Utente autenticato:', user.email);

                // Aggiorna ultimo accesso
                try {
                    await updateDoc(doc(db, 'users', user.uid), {
                        lastLoginAt: serverTimestamp(),
                    });
                } catch (error) {
                    console.error('Errore aggiornamento ultimo accesso:', error);
                }

                // Naviga alla dashboard appropriata
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                const userData = userDoc.data();

                if (userData?.role === 'mechanic') {
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
            setInitializing(false);
        });

        return unsubscribe;
    }, [navigation]);

    // Check redirect result per Google Sign-In su web
    useEffect(() => {
        if (isWeb) {
            getRedirectResult(auth)
                .then(async (result) => {
                    if (result) {
                        console.log('✅ Google Sign-In completato');
                        await handleGoogleUser(result.user);
                    }
                })
                .catch((error) => {
                    console.error('Errore redirect Google:', error);
                });
        }
    }, []);

    // Validazione form
    const validateForm = (): boolean => {
        let valid = true;
        setEmailError('');
        setPasswordError('');

        if (!email) {
            setEmailError('Email richiesta');
            valid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            setEmailError('Email non valida');
            valid = false;
        }

        if (!password) {
            setPasswordError('Password richiesta');
            valid = false;
        } else if (password.length < 6) {
            setPasswordError('Password troppo corta (min. 6 caratteri)');
            valid = false;
        }

        return valid;
    };

    // Login con email e password
    const handleLogin = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('✅ Login successful:', userCredential.user.email);
            // Il redirect è gestito da onAuthStateChanged
        } catch (error: any) {
            console.error('❌ Login error:', error);
            Alert.alert('Errore di accesso', handleAuthError(error));
        } finally {
            setLoading(false);
        }
    };

    // Gestione utente Google
    const handleGoogleUser = async (user: User) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (!userDoc.exists()) {
                // Nuovo utente - crea profilo
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || '',
                    photoURL: user.photoURL || '',
                    role: 'owner', // Default per nuovi utenti Google
                    createdAt: serverTimestamp(),
                    lastLoginAt: serverTimestamp(),
                    provider: 'google',
                });
            } else {
                // Utente esistente - aggiorna ultimo accesso
                await updateDoc(doc(db, 'users', user.uid), {
                    lastLoginAt: serverTimestamp(),
                });
            }
        } catch (error) {
            console.error('Errore gestione utente Google:', error);
        }
    };

    // Login con Google
    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');

            if (isWeb) {
                // Web: usa signInWithPopup o redirect
                try {
                    const result = await signInWithPopup(auth, provider);
                    await handleGoogleUser(result.user);
                } catch (popupError: any) {
                    if (popupError.code === 'auth/popup-blocked') {
                        // Fallback a redirect se popup bloccato
                        await signInWithRedirect(auth, provider);
                    } else {
                        throw popupError;
                    }
                }
            } else {
                // Mobile: implementazione futura con expo-auth-session
                Alert.alert('Info', 'Google Sign-In disponibile prossimamente su mobile');
            }
        } catch (error: any) {
            console.error('Errore Google Sign-In:', error);
            Alert.alert('Errore', handleAuthError(error));
        } finally {
            setLoading(false);
        }
    };

    // Login con Apple (solo iOS)
    const handleAppleLogin = () => {
        Alert.alert('Info', 'Apple Sign-In sarà disponibile nella prossima versione');
    };

    // Se sta ancora inizializzando, mostra loading
    if (initializing) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 16 }}>Caricamento...</Text>
            </View>
        );
    }

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
                            {/* Logo e titolo */}
                            <View style={styles.header}>
                                <MaterialCommunityIcons
                                    name="car-wrench"
                                    size={60}
                                    color={colors.primary}
                                />
                                <Text variant="headlineMedium" style={styles.title}>
                                    MyMechanic
                                </Text>
                                <Text variant="bodyLarge" style={styles.subtitle}>
                                    Accedi al tuo account
                                </Text>
                            </View>

                            {/* Form */}
                            <View style={styles.form}>
                                <TextInput
                                    mode="outlined"
                                    label="Email"
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        setEmailError('');
                                    }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    left={<TextInput.Icon icon="email" />}
                                    error={!!emailError}
                                    disabled={loading}
                                />
                                <HelperText type="error" visible={!!emailError}>
                                    {emailError}
                                </HelperText>

                                <TextInput
                                    mode="outlined"
                                    label="Password"
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        setPasswordError('');
                                    }}
                                    secureTextEntry={!showPassword}
                                    autoComplete="password"
                                    left={<TextInput.Icon icon="lock" />}
                                    right={
                                        <TextInput.Icon
                                            icon={showPassword ? 'eye-off' : 'eye'}
                                            onPress={() => setShowPassword(!showPassword)}
                                        />
                                    }
                                    error={!!passwordError}
                                    disabled={loading}
                                />
                                <HelperText type="error" visible={!!passwordError}>
                                    {passwordError}
                                </HelperText>

                                {/* Opzioni */}
                                <View style={styles.options}>
                                    <TouchableOpacity
                                        style={styles.checkboxContainer}
                                        onPress={() => setRememberMe(!rememberMe)}
                                        disabled={loading}
                                    >
                                        <Checkbox status={rememberMe ? 'checked' : 'unchecked'} />
                                        <Text>Ricordami</Text>
                                    </TouchableOpacity>

                                    <Button
                                        mode="text"
                                        onPress={() => Alert.alert('Info', 'Recupero password disponibile prossimamente')}
                                        disabled={loading}
                                    >
                                        Password dimenticata?
                                    </Button>
                                </View>

                                {/* Pulsante login */}
                                <Button
                                    mode="contained"
                                    onPress={handleLogin}
                                    loading={loading}
                                    disabled={loading}
                                    style={styles.loginButton}
                                    contentStyle={styles.loginButtonContent}
                                >
                                    Accedi
                                </Button>

                                {/* Divider */}
                                <View style={styles.dividerContainer}>
                                    <Divider style={styles.divider} />
                                    <Text style={styles.dividerText}>oppure</Text>
                                    <Divider style={styles.divider} />
                                </View>

                                {/* Social login */}
                                <View style={styles.socialButtons}>
                                    <Button
                                        mode="outlined"
                                        onPress={handleGoogleLogin}
                                        disabled={loading}
                                        icon="google"
                                        style={styles.socialButton}
                                    >
                                        Google
                                    </Button>

                                    {Platform.OS === 'ios' && (
                                        <Button
                                            mode="outlined"
                                            onPress={handleAppleLogin}
                                            disabled={loading}
                                            icon="apple"
                                            style={styles.socialButton}
                                        >
                                            Apple
                                        </Button>
                                    )}
                                </View>

                                {/* Link registrazione */}
                                <View style={styles.footer}>
                                    <Text>Non hai un account?</Text>
                                    <Button
                                        mode="text"
                                        onPress={() => navigation.navigate('Register')}
                                        disabled={loading}
                                    >
                                        Registrati
                                    </Button>
                                </View>
                            </View>
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
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
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
        maxWidth: 400,
        alignSelf: 'center',
    },
    formContainerDesktop: {
        maxWidth: 450,
    },
    card: {
        elevation: 8,
    },
    cardContent: {
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        marginTop: 16,
        fontWeight: 'bold',
    },
    subtitle: {
        marginTop: 8,
        opacity: 0.7,
    },
    form: {
        gap: 8,
    },
    options: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 8,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loginButton: {
        marginTop: 16,
    },
    loginButtonContent: {
        paddingVertical: 8,
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
    socialButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    socialButton: {
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
});

export default LoginScreen;
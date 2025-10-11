// ========================================
// 2. LOGIN SCREEN COMPLETO CON REDIRECT
// ========================================
// Path: src/screens/LoginScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Platform,
    KeyboardAvoidingView,
    Dimensions,
    StatusBar,
    Animated,
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
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';

// Firebase imports
import {
    signInWithEmailAndPassword,
    onAuthStateChanged
} from 'firebase/auth';
import {
    doc,
    getDoc,
    setDoc
} from 'firebase/firestore';
import { auth, db, getFirebaseErrorMessage, isWeb } from '../services/firebase';

// Import tema
import { useAppThemeManager, useThemedStyles } from '../hooks/useTheme';

// Tipo per la navigazione
type LoginScreenNavigationProp = StackNavigationProp<any>;

const LoginScreen: React.FC = () => {
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const insets = useSafeAreaInsets();

    // Sistema di temi
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

    // Responsive
    const screenWidth = Dimensions.get('window').width;
    const isTablet = screenWidth >= 768;
    const isDesktop = screenWidth >= 1024;

    // Animazioni - usando useRef per evitare ricreazione ad ogni render
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    // Animazione di entrata
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim]);

    // ====================================
    // LISTENER PER AUTENTICAZIONE E REDIRECT
    // ====================================
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log('🔍 Utente autenticato, verifico il tipo...');
                await handleUserRedirect(user);
            }
        });

        return () => unsubscribe();
    }, [navigation]);

    // ====================================
    // FUNZIONE DI REDIRECT BASATA SUL TIPO UTENTE
    // ====================================
    const handleUserRedirect = async (user: any) => {
        try {
            // Ottieni i dati dell'utente da Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (userDoc.exists()) {
                const userData = userDoc.data();
                console.log('👤 Tipo utente:', userData.userType);

                // Redirect basato sul tipo di utente
                if (userData.userType === 'mechanic') {
                    console.log('🔧 Redirect a Dashboard Meccanico');
                    // Reset dello stack per evitare che l'utente possa tornare al login
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'HomeMechanic' as never }],
                    });
                } else {
                    console.log('🚗 Redirect a Dashboard Utente');
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Home' as never }],
                    });
                }
            } else {
                // Se non esiste il documento, crealo con dati base
                console.log('📝 Creando profilo utente...');
                await setDoc(doc(db, 'users', user.uid), {
                    email: user.email,
                    displayName: user.displayName || '',
                    userType: 'user', // Default a user
                    createdAt: new Date().toISOString(),
                    photoURL: user.photoURL || '',
                });

                // Redirect a user dashboard di default
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' as never }],
                });
            }
        } catch (error) {
            console.error('❌ Errore durante il redirect:', error);
            Alert.alert('Errore', 'Impossibile determinare il tipo di utente');
        }
    };

    // ====================================
    // VALIDAZIONE FORM
    // ====================================
    const validateForm = (): boolean => {
        let valid = true;

        // Reset errori
        setEmailError('');
        setPasswordError('');

        // Valida email
        if (!email.trim()) {
            setEmailError('Email richiesta');
            valid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            setEmailError('Email non valida');
            valid = false;
        }

        // Valida password
        if (!password.trim()) {
            setPasswordError('Password richiesta');
            valid = false;
        } else if (password.length < 6) {
            setPasswordError('Password troppo corta');
            valid = false;
        }

        return valid;
    };

    // ====================================
    // GESTIONE LOGIN
    // ====================================
    const handleLogin = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('✅ Login successful:', userCredential.user.email);

            // Il redirect verrà gestito automaticamente dal listener onAuthStateChanged

        } catch (error: any) {
            console.error('❌ Login error:', error);
            const errorMessage = getFirebaseErrorMessage(error);
            Alert.alert('Errore di accesso', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // ====================================
    // GESTIONE GOOGLE LOGIN (PLACEHOLDER)
    // ====================================
    const handleGoogleLogin = async () => {
        Alert.alert('Info', 'Google Sign-In sarà disponibile nella prossima versione');
    };

    // ====================================
    // GESTIONE APPLE LOGIN (PLACEHOLDER)
    // ====================================
    const handleAppleLogin = () => {
        Alert.alert('Info', 'Apple Sign-In sarà disponibile nella prossima versione');
    };

    // ====================================
    // STYLES
    // ====================================
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
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
            justifyContent: isDesktop ? 'center' : 'flex-start',
            paddingHorizontal: 20,
            paddingTop: isDesktop ? 0 : insets.top + 40,
            paddingBottom: insets.bottom + 20,
        },
        animatedContainer: {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
        },
        header: {
            alignItems: 'center',
            marginBottom: 40,
        },
        headerIcon: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.surface,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
            elevation: 2,
        },
        title: {
            fontSize: 32,
            fontWeight: 'bold',
            color: colors.primary,
            marginBottom: 8,
        },
        subtitle: {
            fontSize: 16,
            color: colors.onSurfaceVariant,
            textAlign: 'center',
        },
        loginCard: {
            borderRadius: 16,
            backgroundColor: colors.surface,
            elevation: 2,
            maxWidth: isDesktop ? 480 : '100%',
            alignSelf: 'center',
            width: '100%',
        },
        input: {
            marginBottom: 8,
            backgroundColor: colors.surface,
        },
        optionsRow: {
            flexDirection: isTablet ? 'row' : 'column',
            justifyContent: 'space-between',
            alignItems: isTablet ? 'center' : 'flex-start',
            marginVertical: 16,
            gap: isTablet ? 0 : 8,
        },
        checkboxRow: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        checkboxLabel: {
            marginLeft: 4,
            fontSize: 14,
            color: colors.onSurface,
        },
        forgotPasswordLink: {
            alignSelf: isTablet ? 'auto' : 'flex-end',
        },
        forgotPasswordText: {
            color: colors.primary,
            fontSize: 14,
            fontWeight: '500',
        },
        loginButton: {
            marginTop: 8,
            marginBottom: 24,
            borderRadius: 12,
        },
        buttonContent: {
            height: 48,
        },
        dividerContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 24,
        },
        divider: {
            flex: 1,
            backgroundColor: colors.outline,
        },
        dividerText: {
            marginHorizontal: 16,
            fontSize: 12,
            color: colors.onSurfaceVariant,
        },
        socialButtonsContainer: {
            gap: 12,
            marginBottom: 24,
        },
        socialButton: {
            borderRadius: 12,
            borderColor: colors.outline,
        },
        registerContainer: {
            alignItems: 'center',
            paddingTop: 24,
            paddingBottom: insets.bottom + 20,
        },
        registerTextContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        registerText: {
            fontSize: 14,
            color: colors.onSurfaceVariant,
        },
        registerLink: {
            color: colors.primary,
            fontWeight: '600',
            fontSize: 14,
        },
    });

    // ====================================
    // RENDER
    // ====================================
    return (
        <View style={styles.container}>
            {/* Background Gradient */}
            <LinearGradient
                colors={isDark ?
                    ['#000000', '#1C1C1E', '#2C2C2E'] :
                    ['#FAFAFA', '#F5F5F5', '#FFFFFF']
                }
                style={styles.backgroundGradient}
            />

            {/* Status Bar */}
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <Animated.View style={[styles.header, styles.animatedContainer]}>
                        <Surface style={styles.headerIcon} elevation={0}>
                            <MaterialCommunityIcons
                                name="car-wrench"
                                size={40}
                                color={colors.primary}
                            />
                        </Surface>
                        <Text style={styles.title}>MyMeccanic</Text>
                        <Text style={styles.subtitle}>
                            Gestisci la tua auto o la tua officina
                        </Text>
                    </Animated.View>

                    {/* Login Form */}
                    <Animated.View style={styles.animatedContainer}>
                        <Card style={styles.loginCard}>
                            <Card.Content>
                                {/* Email Input */}
                                <TextInput
                                    label="Email"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    error={!!emailError}
                                    mode="outlined"
                                    style={styles.input}
                                    outlineStyle={{ borderColor: colors.outline }}
                                    activeOutlineColor={colors.primary}
                                    left={<TextInput.Icon icon="email" iconColor={colors.primary} />}
                                />
                                <HelperText type="error" visible={!!emailError}>
                                    {emailError}
                                </HelperText>

                                {/* Password Input */}
                                <TextInput
                                    label="Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    error={!!passwordError}
                                    mode="outlined"
                                    style={styles.input}
                                    outlineStyle={{ borderColor: colors.outline }}
                                    activeOutlineColor={colors.primary}
                                    left={<TextInput.Icon icon="lock" iconColor={colors.primary} />}
                                    right={
                                        <TextInput.Icon
                                            icon={showPassword ? "eye-off" : "eye"}
                                            iconColor={colors.primary}
                                            onPress={() => setShowPassword(!showPassword)}
                                        />
                                    }
                                />
                                <HelperText type="error" visible={!!passwordError}>
                                    {passwordError}
                                </HelperText>

                                {/* Options Row */}
                                <View style={styles.optionsRow}>
                                    <View style={styles.checkboxRow}>
                                        <Checkbox
                                            status={rememberMe ? 'checked' : 'unchecked'}
                                            onPress={() => setRememberMe(!rememberMe)}
                                            color={colors.primary}
                                        />
                                        <Text style={styles.checkboxLabel}>
                                            Ricordami
                                        </Text>
                                    </View>
                                    <TouchableOpacity style={styles.forgotPasswordLink}>
                                        <Text style={styles.forgotPasswordText}>
                                            Password dimenticata?
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Login Button */}
                                <Button
                                    mode="contained"
                                    onPress={handleLogin}
                                    loading={loading}
                                    disabled={loading}
                                    style={styles.loginButton}
                                    contentStyle={styles.buttonContent}
                                    buttonColor={colors.primary}
                                >
                                    {loading ? 'Accesso in corso...' : 'Accedi'}
                                </Button>

                                {/* Divider */}
                                <View style={styles.dividerContainer}>
                                    <Divider style={styles.divider} />
                                    <Text style={styles.dividerText}>oppure</Text>
                                    <Divider style={styles.divider} />
                                </View>

                                {/* Social Login Buttons */}
                                <View style={styles.socialButtonsContainer}>
                                    <Button
                                        mode="outlined"
                                        onPress={handleGoogleLogin}
                                        disabled={loading}
                                        style={styles.socialButton}
                                        contentStyle={styles.buttonContent}
                                        icon="google"
                                        textColor={colors.onSurfaceVariant}
                                    >
                                        Continua con Google
                                    </Button>

                                    {Platform.OS === 'ios' && (
                                        <Button
                                            mode="outlined"
                                            onPress={handleAppleLogin}
                                            disabled={loading}
                                            style={styles.socialButton}
                                            contentStyle={styles.buttonContent}
                                            icon="apple"
                                            textColor={colors.onSurfaceVariant}
                                        >
                                            Continua con Apple
                                        </Button>
                                    )}
                                </View>
                            </Card.Content>
                        </Card>
                    </Animated.View>

                    {/* Register Link */}
                    <View style={styles.registerContainer}>
                        <View style={styles.registerTextContainer}>
                            <Text style={styles.registerText}>
                                Non hai un account?{' '}
                            </Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Register' as never)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.registerLink}>
                                    Registrati
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default LoginScreen;
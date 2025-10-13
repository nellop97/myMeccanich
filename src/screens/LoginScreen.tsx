// src/screens/LoginScreen.tsx - VERSIONE MODERNA
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
} from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, ArrowRight, Smartphone } from 'lucide-react-native';

// Firebase
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

// Custom Components & Hooks
import {
    ThemedInput,
    GradientButton,
    GlassCard,
    DividerWithText,
    SocialButton,
} from '../components/CommonComponents';
import { useAppThemeManager } from '../hooks/useTheme';
import { useStore } from '../store';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isSmallScreen = width < 375;

const LoginScreen = () => {
    const navigation = useNavigation();
    const { colors, isDark } = useAppThemeManager();
    const { setUser } = useStore();

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [loading, setLoading] = useState(false);

    // Animation Values
    const fadeAnim = useState(new Animated.Value(0))[0];
    const slideAnim = useState(new Animated.Value(30))[0];

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 20,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // ============================================
    // VALIDATION
    // ============================================
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            setEmailError('Email richiesta');
            return false;
        }
        if (!emailRegex.test(email)) {
            setEmailError('Email non valida');
            return false;
        }
        setEmailError('');
        return true;
    };

    const validatePassword = (password: string): boolean => {
        if (!password) {
            setPasswordError('Password richiesta');
            return false;
        }
        if (password.length < 6) {
            setPasswordError('Password troppo corta (min. 6 caratteri)');
            return false;
        }
        setPasswordError('');
        return true;
    };

    // ============================================
    // LOGIN HANDLER
    // ============================================
    const handleLogin = async () => {
        // Validate
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);

        if (!isEmailValid || !isPasswordValid) return;

        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email.trim(),
                password
            );

            // Update store
            setUser({
                id: userCredential.user.uid,
                email: userCredential.user.email || '',
                name: userCredential.user.displayName || '',
                isLoggedIn: true,
            });

            Alert.alert('Successo', 'Accesso effettuato!');
        } catch (error: any) {
            console.error('Login error:', error);

            // Friendly error messages
            let errorMessage = 'Errore durante l\'accesso';

            if (error.code === 'auth/invalid-credential') {
                errorMessage = 'Email o password non corretti';
            } else if (error.code === 'auth/user-not-found') {
                errorMessage = 'Utente non trovato';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Password non corretta';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Troppi tentativi. Riprova più tardi';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Errore di connessione. Verifica la tua rete';
            }

            Alert.alert('Errore', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // SOCIAL LOGIN HANDLERS
    // ============================================
    const handleGoogleLogin = () => {
        Alert.alert('In arrivo', 'Login Google in sviluppo');
    };

    const handleAppleLogin = () => {
        Alert.alert('In arrivo', 'Login Apple in sviluppo');
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

            {/* Decorative Elements */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View
                        style={[
                            styles.content,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            },
                        ]}
                    >
                        {/* Logo/Icon Section */}
                        <View style={styles.logoContainer}>
                            <View
                                style={[
                                    styles.logoCircle,
                                    {
                                        backgroundColor: isDark
                                            ? 'rgba(10, 132, 255, 0.15)'
                                            : 'rgba(0, 122, 255, 0.1)',
                                    },
                                ]}
                            >
                                <Smartphone size={48} color={colors.primary} />
                            </View>
                        </View>

                        {/* Header */}
                        <View style={styles.header}>
                            <Text
                                style={[
                                    styles.title,
                                    { color: colors.onSurface },
                                ]}
                            >
                                Bentornato! 👋
                            </Text>
                            <Text
                                style={[
                                    styles.subtitle,
                                    { color: colors.onSurfaceVariant },
                                ]}
                            >
                                Accedi per gestire la tua auto
                            </Text>
                        </View>

                        {/* Login Card */}
                        <GlassCard style={styles.formCard}>
                            {/* Email Input */}
                            <ThemedInput
                                label="Email"
                                placeholder="tua@email.com"
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    setEmailError('');
                                }}
                                error={emailError}
                                icon={Mail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                            />

                            {/* Password Input */}
                            <ThemedInput
                                label="Password"
                                placeholder="Inserisci la password"
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    setPasswordError('');
                                }}
                                error={passwordError}
                                icon={Lock}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                            />

                            {/* Forgot Password Link */}
                            <GradientButton
                                variant="text"
                                title="Password dimenticata?"
                                onPress={() => Alert.alert('In arrivo', 'Recupero password in sviluppo')}
                            />

                            {/* Login Button */}
                            <GradientButton
                                title="Accedi"
                                onPress={handleLogin}
                                loading={loading}
                                disabled={loading}
                                icon={ArrowRight}
                                style={styles.loginButton}
                            />
                        </GlassCard>

                        {/* Divider */}
                        <DividerWithText text="Oppure continua con" />

                        {/* Social Login Buttons */}
                        <View style={styles.socialContainer}>
                            <SocialButton
                                onPress={handleGoogleLogin}
                                icon={Mail}
                                provider="Google"
                                loading={loading}
                            />
                            {Platform.OS === 'ios' && (
                                <SocialButton
                                    onPress={handleAppleLogin}
                                    icon={Smartphone}
                                    provider="Apple"
                                    loading={loading}
                                />
                            )}
                        </View>

                        {/* Register Link */}
                        <View style={styles.registerContainer}>
                            <Text style={[styles.registerText, { color: colors.onSurfaceVariant }]}>
                                Non hai un account?{' '}
                            </Text>
                            <GradientButton
                                variant="text"
                                title="Registrati"
                                onPress={() => navigation.navigate('Register' as never)}
                            />
                        </View>
                    </Animated.View>
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
    decorativeCircle1: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(0, 122, 255, 0.05)',
    },
    decorativeCircle2: {
        position: 'absolute',
        bottom: -150,
        left: -150,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: 'rgba(94, 92, 230, 0.05)',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: isWeb ? 40 : 24,
        paddingVertical: isWeb ? 60 : 40,
    },
    content: {
        width: '100%',
        maxWidth: 440,
        alignSelf: 'center',
    },

    // Logo Section
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Header
    header: {
        marginBottom: 32,
        alignItems: isWeb ? 'center' : 'flex-start',
    },
    title: {
        fontSize: isSmallScreen ? 28 : 32,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: -0.5,
        textAlign: isWeb ? 'center' : 'left',
    },
    subtitle: {
        fontSize: isSmallScreen ? 15 : 16,
        lineHeight: 24,
        letterSpacing: 0.15,
        textAlign: isWeb ? 'center' : 'left',
    },

    // Form Card
    formCard: {
        marginBottom: 8,
    },
    loginButton: {
        marginTop: 8,
    },

    // Social Login
    socialContainer: {
        marginBottom: 16,
    },

    // Register Section
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    registerText: {
        fontSize: 15,
        letterSpacing: 0.15,
    },
});

export default LoginScreen;
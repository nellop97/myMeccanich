// src/screens/LoginScreen.tsx - VERSIONE COMPLETA CON TOAST POPUP
import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

// Firebase
import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Auth Service
import { authService } from '../services/AuthService';

// Store
import { useStore } from '../store';

// Toast Component
import Toast from '../components/Toast';

const LoginScreen = () => {
    const navigation = useNavigation();
    const { setUser } = useStore();

    // Stati
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingGoogle, setLoadingGoogle] = useState(false);
    const [loadingApple, setLoadingApple] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    // 🆕 STATI PER TOAST POPUP
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'error' | 'success'>('error');

    // ============================================================
    // VALIDAZIONE
    // ============================================================
    const validateForm = (): boolean => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email.trim()) {
            newErrors.email = 'Email richiesta';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Email non valida';
        }

        if (!password) {
            newErrors.password = 'Password richiesta';
        } else if (password.length < 6) {
            newErrors.password = 'Password troppo corta';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 🆕 FUNZIONE PER MOSTRARE TOAST
    const showToast = (message: string, type: 'error' | 'success' = 'error') => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
    };

    // ============================================================
    // LOGIN CON GESTIONE ERRORI VIA TOAST
    // ============================================================
    const handleLogin = async () => {
        if (!validateForm()) return;

        setLoading(true);

        try {
            console.log('🔐 Inizio login...');

            // 1. Login Firebase Auth
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email.trim(),
                password
            );

            const userId = userCredential.user.uid;
            console.log('✅ Login Firebase Auth riuscito:', userId);

            // 2. Recupera dati utente da Firestore
            const userDocRef = doc(db, 'users', userId);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                throw new Error('Profilo utente non trovato');
            }

            const userData = userDocSnap.data();
            console.log('📄 Dati utente letti:', {
                userType: userData.userType,
                role: userData.role,
                email: userData.email,
            });

            // 3. Aggiorna ultimo accesso
            await updateDoc(userDocRef, {
                lastLoginAt: serverTimestamp(),
            });

            // 4. Determina tipo utente
            const isMechanic =
                userData.userType === 'mechanic' ||
                userData.role === 'mechanic';

            console.log('👤 Tipo utente determinato:', {
                isMechanic,
                userType: userData.userType,
                role: userData.role,
            });

            // 5. AGGIORNA STORE IMMEDIATAMENTE
            const storeData = {
                id: userId,
                uid: userId,
                name: userData.name || `${userData.firstName} ${userData.lastName}`,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                isLoggedIn: true,
                isMechanic,
                userType: userData.userType,
                role: userData.role,
                phoneNumber: userData.phone || undefined,
                emailVerified: userData.emailVerified || false,
                loginProvider: userData.loginProvider || 'email',
                profileComplete: userData.profileComplete || false,

                // Dati specifici per meccanico
                ...(isMechanic && {
                    workshopName: userData.workshopName || undefined,
                    workshopAddress: userData.address || undefined,
                    vatNumber: userData.vatNumber || undefined,
                    mechanicLicense: userData.mechanicLicense || undefined,
                    rating: userData.rating ?? 0,
                    reviewsCount: userData.reviewsCount ?? 0,
                    verified: userData.verified ?? false,
                }),

                address: userData.address || undefined,
                photoURL: userData.photoURL || undefined,
            };

            setUser(storeData);
            console.log('✅ Login completato, redirect automatico...');

            // 🆕 MOSTRA TOAST DI SUCCESSO (opzionale)
            // showToast(`Bentornato ${userData.firstName}!`, 'success');

        } catch (error: any) {
            console.error('❌ Errore login:', error);

            // 🆕 GESTIONE ERRORI CON TOAST INVECE DI ALERT
            let errorMessage = 'Errore durante il login. Riprova.';

            if (error.code === 'auth/user-not-found') {
                errorMessage = 'Utente non trovato. Verifica l\'email o registrati.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Password errata. Riprova o reimposta la password.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Email non valida.';
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = 'Account disabilitato. Contatta il supporto.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Errore di connessione. Verifica la tua rete.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Troppi tentativi. Riprova tra qualche minuto.';
            } else if (error.code === 'auth/invalid-credential') {
                errorMessage = 'Credenziali non valide. Verifica email e password.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            // 🆕 MOSTRA TOAST ERRORE
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // SOCIAL LOGIN
    // ============================================================

    const handleGoogleSignIn = async () => {
        setLoadingGoogle(true);
        try {
            const userProfile = await authService.signInWithGoogle();

            if (userProfile) {
                // Aggiorna store
                const isMechanic = userProfile.role === 'mechanic';
                setUser({
                    id: userProfile.uid,
                    uid: userProfile.uid,
                    name: userProfile.displayName,
                    email: userProfile.email,
                    firstName: userProfile.firstName,
                    lastName: userProfile.lastName,
                    photoURL: userProfile.photoURL,
                    isLoggedIn: true,
                    isMechanic,
                    userType: isMechanic ? 'mechanic' : 'user',
                    role: userProfile.role,
                    loginProvider: 'google',
                    ...(isMechanic && {
                        workshopName: userProfile.workshopName,
                        workshopAddress: userProfile.address,
                        vatNumber: userProfile.vatNumber,
                    }),
                });

                console.log('✅ Login Google completato');
            } else {
                showToast('Login Google annullato', 'error');
            }
        } catch (error: any) {
            console.error('❌ Errore Google Sign In:', error);
            showToast(error.message || 'Errore durante il login con Google', 'error');
        } finally {
            setLoadingGoogle(false);
        }
    };

    const handleAppleSignIn = async () => {
        if (Platform.OS !== 'ios') {
            showToast('Apple Sign In è disponibile solo su iOS', 'error');
            return;
        }

        setLoadingApple(true);
        try {
            const userProfile = await authService.signInWithApple();

            if (userProfile) {
                // Aggiorna store
                const isMechanic = userProfile.role === 'mechanic';
                setUser({
                    id: userProfile.uid,
                    uid: userProfile.uid,
                    name: userProfile.displayName,
                    email: userProfile.email,
                    firstName: userProfile.firstName,
                    lastName: userProfile.lastName,
                    photoURL: userProfile.photoURL,
                    isLoggedIn: true,
                    isMechanic,
                    userType: isMechanic ? 'mechanic' : 'user',
                    role: userProfile.role,
                    loginProvider: 'apple',
                    ...(isMechanic && {
                        workshopName: userProfile.workshopName,
                        workshopAddress: userProfile.address,
                        vatNumber: userProfile.vatNumber,
                    }),
                });

                console.log('✅ Login Apple completato');
            } else {
                showToast('Login Apple annullato', 'error');
            }
        } catch (error: any) {
            console.error('❌ Errore Apple Sign In:', error);
            showToast(error.message || 'Errore durante il login con Apple', 'error');
        } finally {
            setLoadingApple(false);
        }
    };

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            {/* 🆕 TOAST POPUP (si mostra sopra tutto) */}
            <Toast
                visible={toastVisible}
                message={toastMessage}
                type={toastType}
                onHide={() => setToastVisible(false)}
                position="top"
                duration={4000}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoText}>MM</Text>
                        </View>
                    </View>
                    <Text style={styles.title}>Bentornato!</Text>
                    <Text style={styles.subtitle}>
                        Accedi per gestire le tue automobili
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {/* Email */}
                    <View style={styles.inputWrapper}>
                        <View style={styles.iconContainer}>
                            <Mail size={20} color="#64748b" />
                        </View>
                        <TextInput
                            mode="outlined"
                            label="Email"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                setErrors({ ...errors, email: '' });
                            }}
                            error={!!errors.email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            disabled={loading}
                            style={styles.input}
                            textColor="#1e293b"
                            theme={{
                                colors: {
                                    primary: '#3b82f6',
                                    outline: errors.email ? '#ef4444' : '#e2e8f0',
                                    onSurfaceVariant: '#64748b',
                                    text: '#1e293b',
                                },
                            }}
                        />
                    </View>
                    {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

                    {/* Password */}
                    <View style={styles.inputWrapper}>
                        <View style={styles.iconContainer}>
                            <Lock size={20} color="#64748b" />
                        </View>
                        <TextInput
                            mode="outlined"
                            label="Password"
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                setErrors({ ...errors, password: '' });
                            }}
                            error={!!errors.password}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            disabled={loading}
                            style={styles.input}
                            textColor="#1e293b"
                            right={
                                <TextInput.Icon
                                    icon={() =>
                                        showPassword ? (
                                            <EyeOff size={20} color="#64748b" />
                                        ) : (
                                            <Eye size={20} color="#64748b" />
                                        )
                                    }
                                    onPress={() => setShowPassword(!showPassword)}
                                />
                            }
                            theme={{
                                colors: {
                                    primary: '#3b82f6',
                                    outline: errors.password ? '#ef4444' : '#e2e8f0',
                                    onSurfaceVariant: '#64748b',
                                    text: '#1e293b',
                                },
                            }}
                        />
                    </View>
                    {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

                    {/* Password dimenticata */}
                    <TouchableOpacity
                        style={styles.forgotPassword}
                        onPress={() => {
                            navigation.navigate('ForgotPassword' as never);
                        }}
                        disabled={loading}
                    >
                        <Text style={styles.forgotPasswordText}>
                            Password dimenticata?
                        </Text>
                    </TouchableOpacity>

                    {/* Pulsante Login */}
                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>Accedi</Text>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OPPURE</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Google Sign In */}
                    <TouchableOpacity
                        style={[styles.socialButton, styles.googleButton]}
                        onPress={handleGoogleSignIn}
                        disabled={loading || loadingGoogle || loadingApple}
                    >
                        {loadingGoogle ? (
                            <ActivityIndicator color="#1f1f1f" />
                        ) : (
                            <>
                                <Image
                                    source={{ uri: 'https://www.google.com/favicon.ico' }}
                                    style={styles.socialIcon}
                                />
                                <Text style={styles.googleButtonText}>Continua con Google</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Apple Sign In (solo iOS) */}
                    {Platform.OS === 'ios' && (
                        <TouchableOpacity
                            style={[styles.socialButton, styles.appleButton]}
                            onPress={handleAppleSignIn}
                            disabled={loading || loadingGoogle || loadingApple}
                        >
                            {loadingApple ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Image
                                        source={{ uri: 'https://www.apple.com/favicon.ico' }}
                                        style={styles.socialIcon}
                                    />
                                    <Text style={styles.appleButtonText}>Continua con Apple</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Registrazione */}
                    <TouchableOpacity
                        style={styles.registerButton}
                        onPress={() => navigation.navigate('Register' as never)}
                        disabled={loading || loadingGoogle || loadingApple}
                    >
                        <Text style={styles.registerButtonText}>
                            Non hai un account?{' '}
                            <Text style={styles.registerButtonTextBold}>Registrati</Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        MyMeccanich © 2025
                    </Text>
                </View>
            </ScrollView>
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
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoContainer: {
        marginBottom: 24,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3b82f6',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 24,
    },
    form: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    inputWrapper: {
        position: 'relative',
        marginBottom: 16,
    },
    iconContainer: {
        position: 'absolute',
        left: 16,
        top: 28,
        zIndex: 1,
        pointerEvents: 'none',
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
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '600',
    },
    loginButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#3b82f6',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    loginButtonDisabled: {
        backgroundColor: '#94a3b8',
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e2e8f0',
    },
    dividerText: {
        fontSize: 12,
        color: '#94a3b8',
        marginHorizontal: 16,
        fontWeight: '600',
    },
    registerButton: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    registerButtonText: {
        fontSize: 14,
        color: '#64748b',
    },
    registerButtonTextBold: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    footer: {
        marginTop: 48,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#94a3b8',
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    googleButton: {
        backgroundColor: '#fff',
        borderColor: '#e2e8f0',
    },
    appleButton: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    socialIcon: {
        width: 20,
        height: 20,
        marginRight: 12,
    },
    googleButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f1f1f',
    },
    appleButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
});

export default LoginScreen;
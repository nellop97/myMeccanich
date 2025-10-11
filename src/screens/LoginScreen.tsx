// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useStore } from '../store';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { CommonActions } from '@react-navigation/native';

const LoginScreen: React.FC = () => {
    const navigation = useNavigation();
    const { setUser } = useStore();

    // Stati locali
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // ====================================
    // 🔑 REDIRECT DOPO LOGIN - PARTE MODIFICATA
    // ====================================
    const handlePostLoginRedirect = async (user: any) => {
        try {
            console.log('👤 Controllo tipo utente per:', user.uid);

            // Leggi il documento utente da Firestore
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                console.log('📄 Dati utente trovati:', userData);

                // Determina se è meccanico o utente normale
                const isMechanic = userData.userType === 'mechanic';

                // ✅ CORREZIONE PRINCIPALE: Usa "Main" per utenti, "HomeMechanic" per meccanici
                if (isMechanic) {
                    console.log('🔧 Redirect a Dashboard Meccanico');

                    // Reset completo dello stack di navigazione
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: 'HomeMechanic' }],
                        })
                    );
                } else {
                    console.log('🚗 Redirect a Dashboard Utente');

                    // ✅ USA "Main" invece di "Home"
                    // "Main" è il Tab Navigator che contiene "Home" e "Settings"
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: 'Main' }],
                        })
                    );
                }
            } else {
                // Se il documento non esiste, crealo con dati base
                console.log('📝 Creando profilo utente...');
                await setDoc(doc(db, 'users', user.uid), {
                    email: user.email,
                    displayName: user.displayName || '',
                    userType: 'user', // Default a user normale
                    createdAt: new Date().toISOString(),
                    photoURL: user.photoURL || '',
                });

                // Redirect a dashboard utente di default
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: 'Main' }],
                    })
                );
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
            setPasswordError('Password troppo corta (minimo 6 caratteri)');
            valid = false;
        }

        return valid;
    };

    // ====================================
    // GESTIONE LOGIN
    // ====================================
    const handleLogin = async () => {
        // Valida il form
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            console.log('🔐 Tentativo di login per:', email);

            // Effettua il login con Firebase
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email.trim(),
                password
            );

            const user = userCredential.user;
            console.log('✅ Login riuscito per:', user.email);

            // Salva i dati dell'utente nello store
            setUser({
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || '',
                photoURL: user.photoURL || '',
                isLoggedIn: true,
            });

            // Redirect basato sul tipo di utente
            await handlePostLoginRedirect(user);

        } catch (error: any) {
            console.error('❌ Errore login:', error);

            let errorMessage = 'Credenziali non valide';

            // Gestione errori specifici
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Utente non trovato';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Password errata';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Email non valida';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'Account disabilitato';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Troppi tentativi. Riprova più tardi';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Errore di connessione';
                    break;
                default:
                    errorMessage = 'Errore durante il login';
            }

            Alert.alert('Errore', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // ====================================
    // UI
    // ====================================
    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.content}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Bentornato! 👋</Text>
                            <Text style={styles.subtitle}>
                                Accedi al tuo account per continuare
                            </Text>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            {/* Campo Email */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Email</Text>
                                <View style={[
                                    styles.inputWrapper,
                                    emailError ? styles.inputError : null
                                ]}>
                                    <Mail size={20} color="#666" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="tua@email.com"
                                        value={email}
                                        onChangeText={(text) => {
                                            setEmail(text);
                                            setEmailError('');
                                        }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!loading}
                                    />
                                </View>
                                {emailError ? (
                                    <Text style={styles.errorText}>{emailError}</Text>
                                ) : null}
                            </View>

                            {/* Campo Password */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Password</Text>
                                <View style={[
                                    styles.inputWrapper,
                                    passwordError ? styles.inputError : null
                                ]}>
                                    <Lock size={20} color="#666" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Password"
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            setPasswordError('');
                                        }}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!loading}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={styles.eyeIcon}
                                        disabled={loading}
                                    >
                                        {showPassword ? (
                                            <EyeOff size={20} color="#666" />
                                        ) : (
                                            <Eye size={20} color="#666" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                                {passwordError ? (
                                    <Text style={styles.errorText}>{passwordError}</Text>
                                ) : null}
                            </View>

                            {/* Pulsante Login */}
                            <TouchableOpacity
                                style={[
                                    styles.loginButton,
                                    loading && styles.loginButtonDisabled
                                ]}
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.loginButtonText}>Accedi</Text>
                                )}
                            </TouchableOpacity>

                            {/* Link Registrazione */}
                            <View style={styles.registerContainer}>
                                <Text style={styles.registerText}>
                                    Non hai un account?{' '}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('Register' as never)}
                                    activeOpacity={0.7}
                                    disabled={loading}
                                >
                                    <Text style={styles.registerLink}>
                                        Registrati
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

// ====================================
// STILI
// ====================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        lineHeight: 22,
    },
    form: {
        gap: 20,
    },
    inputContainer: {
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingHorizontal: 16,
        height: 52,
    },
    inputError: {
        borderColor: '#FF3B30',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1A1A1A',
        height: '100%',
    },
    eyeIcon: {
        padding: 4,
    },
    errorText: {
        fontSize: 12,
        color: '#FF3B30',
        marginTop: 4,
        marginLeft: 4,
    },
    loginButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    loginButtonDisabled: {
        backgroundColor: '#99C7FF',
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    registerText: {
        fontSize: 14,
        color: '#666',
    },
    registerLink: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
    },
});

export default LoginScreen;
// src/screens/ForgotPasswordScreen.tsx - IMPLEMENTAZIONE COMPLETA
import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react-native';

// Firebase
import { auth } from '../services/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const ForgotPasswordScreen = () => {
    const navigation = useNavigation();

    // Stati
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [error, setError] = useState('');
    const [validationError, setValidationError] = useState('');

    // ============================================================
    // VALIDAZIONE EMAIL
    // ============================================================
    const validateEmail = (): boolean => {
        if (!email.trim()) {
            setValidationError('Email richiesta');
            return false;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setValidationError('Email non valida');
            return false;
        }

        setValidationError('');
        return true;
    };

    // ============================================================
    // RESET PASSWORD
    // ============================================================
    const handleResetPassword = async () => {
        setError('');

        if (!validateEmail()) return;

        setLoading(true);

        try {
            console.log('📧 Invio email di reset password...');

            await sendPasswordResetEmail(auth, email.trim(), {
                // URL a cui l'utente sarà reindirizzato dopo il reset
                // Puoi personalizzarlo con il deep link della tua app
                url: 'https://yourdomain.com/login',
                handleCodeInApp: false,
            });

            console.log('✅ Email di reset inviata con successo');
            setEmailSent(true);

        } catch (error: any) {
            console.error('❌ Errore reset password:', error);

            let errorMessage = 'Errore durante l\'invio dell\'email. Riprova.';

            if (error.code === 'auth/user-not-found') {
                errorMessage = 'Nessun utente trovato con questa email.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Email non valida.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Errore di connessione. Verifica la tua rete.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Troppi tentativi. Riprova tra qualche minuto.';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // RENDER SUCCESS STATE
    // ============================================================
    if (emailSent) {
        return (
            <View style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.successContainer}>
                        <View style={styles.successIconContainer}>
                            <CheckCircle size={64} color="#10b981" />
                        </View>

                        <Text style={styles.successTitle}>Email Inviata!</Text>

                        <Text style={styles.successMessage}>
                            Ti abbiamo inviato un'email con le istruzioni per reimpostare la tua password.
                        </Text>

                        <View style={styles.successInfo}>
                            <Text style={styles.successInfoText}>
                                📧 Controlla la tua casella di posta:
                            </Text>
                            <Text style={styles.successEmail}>{email}</Text>
                        </View>

                        <View style={styles.successTips}>
                            <Text style={styles.successTipsTitle}>Non trovi l'email?</Text>
                            <Text style={styles.successTip}>• Controlla la cartella spam</Text>
                            <Text style={styles.successTip}>• Verifica di aver inserito l'email corretta</Text>
                            <Text style={styles.successTip}>• Attendi qualche minuto</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.backToLoginButton}
                            onPress={() => navigation.goBack()}
                        >
                            <ArrowLeft size={20} color="#fff" />
                            <Text style={styles.backToLoginButtonText}>Torna al Login</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.resendButton}
                            onPress={() => {
                                setEmailSent(false);
                                setEmail('');
                            }}
                        >
                            <Text style={styles.resendButtonText}>
                                Invia di nuovo l'email
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        );
    }

    // ============================================================
    // RENDER FORM
    // ============================================================
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    disabled={loading}
                >
                    <ArrowLeft size={20} color="#64748b" />
                    <Text style={styles.backButtonText}>Indietro</Text>
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <View style={styles.iconCircle}>
                            <Mail size={32} color="#3b82f6" />
                        </View>
                    </View>
                    <Text style={styles.title}>Password Dimenticata?</Text>
                    <Text style={styles.subtitle}>
                        Inserisci la tua email e ti invieremo le istruzioni per reimpostare la password
                    </Text>
                </View>

                {/* Error Banner */}
                {error !== '' && (
                    <View style={styles.errorBanner}>
                        <View style={styles.errorBannerContent}>
                            <AlertCircle size={20} color="#ef4444" />
                            <Text style={styles.errorBannerText}>{error}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setError('')}
                            style={styles.errorBannerClose}
                        >
                            <Text style={styles.errorBannerCloseText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Form */}
                <View style={styles.form}>
                    <View style={styles.inputWrapper}>
                        <Mail size={20} color="#64748b" style={styles.inputIcon} />
                        <TextInput
                            mode="outlined"
                            label="Email"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                setValidationError('');
                                setError('');
                            }}
                            error={!!validationError}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoFocus
                            disabled={loading}
                            style={styles.input}
                            theme={{
                                colors: {
                                    primary: '#3b82f6',
                                    outline: validationError ? '#ef4444' : '#e2e8f0',
                                },
                            }}
                        />
                    </View>
                    {validationError && (
                        <Text style={styles.errorText}>{validationError}</Text>
                    )}

                    {/* Info Box */}
                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            💡 Riceverai un'email con un link per reimpostare la password.
                            Il link sarà valido per 1 ora.
                        </Text>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleResetPassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>
                                Invia Email di Reset
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Ricordi la password?{' '}
                        <Text
                            style={styles.footerLink}
                            onPress={() => navigation.goBack()}
                        >
                            Torna al Login
                        </Text>
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
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 32,
        alignSelf: 'flex-start',
    },
    backButtonText: {
        fontSize: 16,
        color: '#64748b',
        fontWeight: '600',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        marginBottom: 24,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#dbeafe',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    errorBanner: {
        backgroundColor: '#fee2e2',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    errorBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    errorBannerText: {
        fontSize: 14,
        color: '#dc2626',
        fontWeight: '500',
        flex: 1,
    },
    errorBannerClose: {
        padding: 4,
    },
    errorBannerCloseText: {
        fontSize: 20,
        color: '#dc2626',
        fontWeight: 'bold',
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
    infoBox: {
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    infoText: {
        fontSize: 13,
        color: '#1e40af',
        lineHeight: 20,
    },
    submitButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3b82f6',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        backgroundColor: '#94a3b8',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    footer: {
        marginTop: 32,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#64748b',
    },
    footerLink: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    // Success State Styles
    successContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    successIconContainer: {
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 16,
    },
    successMessage: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    successInfo: {
        backgroundColor: '#f0fdf4',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    successInfoText: {
        fontSize: 14,
        color: '#166534',
        marginBottom: 8,
        fontWeight: '600',
    },
    successEmail: {
        fontSize: 15,
        color: '#15803d',
        fontWeight: 'bold',
    },
    successTips: {
        backgroundColor: '#fffbeb',
        borderRadius: 12,
        padding: 20,
        marginBottom: 32,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: '#fef3c7',
    },
    successTipsTitle: {
        fontSize: 14,
        color: '#92400e',
        fontWeight: '600',
        marginBottom: 12,
    },
    successTip: {
        fontSize: 13,
        color: '#a16207',
        marginBottom: 6,
        lineHeight: 20,
    },
    backToLoginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 32,
        marginBottom: 16,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#3b82f6',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    backToLoginButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    resendButton: {
        paddingVertical: 12,
    },
    resendButtonText: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '600',
    },
});

export default ForgotPasswordScreen;
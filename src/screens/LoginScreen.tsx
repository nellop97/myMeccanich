// src/screens/LoginScreen.tsx - VERSIONE AGGIORNATA E SICURA
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import {
  Button,
  Card,
  Checkbox,
  Divider,
  HelperText,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '../hooks/useAuth';
import { AuthStackParamList } from '../navigation/AppNavigator';

const { width: screenWidth } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const {
    loginWithEmail,
    loginWithGoogle,
    loginWithApple,
    resetPassword,
    loading
  } = useAuth();

  // Stati del form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Validazione
  const validateEmail = (text: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!text.trim()) {
      setEmailError('L\'email è obbligatoria');
      return false;
    } else if (!emailRegex.test(text)) {
      setEmailError('Inserisci un indirizzo email valido');
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };

  const validatePassword = (text: string): boolean => {
    if (!text.trim()) {
      setPasswordError('La password è obbligatoria');
      return false;
    } else if (text.length < 6) {
      setPasswordError('La password deve avere almeno 6 caratteri');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };

  // 🔒 GESTORI EVENTI - SEMPLIFICATI
  const handleLogin = async (): Promise<void> => {
    console.log('🔑 Avvio processo di login...');

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      console.log('❌ Validazione fallita');
      return;
    }

    console.log('🚀 Chiamata loginWithEmail...');
    const result = await loginWithEmail(email, password);

    if (result.success) {
      console.log('✅ Login riuscito! La navigazione sarà gestita automaticamente dal auth state change');
      // 🔒 NON SERVE PIÙ GESTIRE LA NAVIGAZIONE MANUALMENTE
      // Il listener onAuthStateChanged nell'AppNavigator si occuperà automaticamente
      // di reindirizzare l'utente alla schermata corretta
    } else {
      console.log('❌ Login fallito:', result.error);
    }
  };

  const handleGoogleLogin = async (): Promise<void> => {
    console.log('🔍 Avvio Google login...');
    const result = await loginWithGoogle();
    if (result.success) {
      console.log('✅ Login Google riuscito!');
      // 🔒 Anche qui, la navigazione è automatica
    }
  };

  const handleAppleLogin = async (): Promise<void> => {
    console.log('🍎 Avvio Apple login...');
    const result = await loginWithApple();
    if (result.success) {
      console.log('✅ Login Apple riuscito!');
      // 🔒 Anche qui, la navigazione è automatica
    }
  };

  const handleForgotPassword = async (): Promise<void> => {
    if (!validateEmail(email)) {
      return;
    }

    await resetPassword(email);
  };

  const handleEmailChange = (text: string): void => {
    setEmail(text);
    if (emailError) {
      setEmailError('');
    }
  };

  const handlePasswordChange = (text: string): void => {
    setPassword(text);
    if (passwordError) {
      setPasswordError('');
    }
  };

  const handleRegisterPress = (): void => {
    navigation.navigate('Register');
  };

  return (
      <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <MaterialCommunityIcons
                name="car-wrench"
                size={60}
                color={theme.colors.primary}
            />
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>
              MyMeccanic
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Gestisci la tua auto o la tua officina
            </Text>
          </View>

          {/* Form Card */}
          <Card style={styles.card} elevation={2}>
            <Card.Content style={styles.cardContent}>
              <Text style={[styles.formTitle, { color: theme.colors.onSurface }]}>
                Accedi al tuo account
              </Text>

              {/* Email Input */}
              <TextInput
                  label="Email"
                  value={email}
                  onChangeText={handleEmailChange}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={!!emailError}
                  style={styles.input}
                  left={<TextInput.Icon icon="email" />}
              />
              <HelperText type="error" visible={!!emailError}>
                {emailError}
              </HelperText>

              {/* Password Input */}
              <TextInput
                  label="Password"
                  value={password}
                  onChangeText={handlePasswordChange}
                  mode="outlined"
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  error={!!passwordError}
                  style={styles.input}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                        icon={showPassword ? "eye-off" : "eye"}
                        onPress={() => setShowPassword(!showPassword)}
                    />
                  }
              />
              <HelperText type="error" visible={!!passwordError}>
                {passwordError}
              </HelperText>

              {/* Remember Me & Forgot Password */}
              <View style={styles.optionsRow}>
                <View style={styles.checkboxRow}>
                  <Checkbox
                      status={rememberMe ? 'checked' : 'unchecked'}
                      onPress={() => setRememberMe(!rememberMe)}
                  />
                  <Text style={[styles.checkboxLabel, { color: theme.colors.onSurface }]}>
                    Ricordami
                  </Text>
                </View>

                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={[styles.linkText, { color: theme.colors.primary }]}>
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
              >
                {loading ? 'Accesso in corso...' : 'Accedi'}
              </Button>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <Divider style={styles.divider} />
                <Text style={[styles.dividerText, { color: theme.colors.onSurfaceVariant }]}>
                  oppure
                </Text>
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
                >
                  Google
                </Button>

                {Platform.OS === 'ios' && (
                    <Button
                        mode="outlined"
                        onPress={handleAppleLogin}
                        disabled={loading}
                        style={styles.socialButton}
                        contentStyle={styles.buttonContent}
                        icon="apple"
                    >
                      Apple
                    </Button>
                )}
              </View>
            </Card.Content>
          </Card>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={[styles.registerText, { color: theme.colors.onSurfaceVariant }]}>
              Non hai un account?{' '}
            </Text>
            <TouchableOpacity onPress={handleRegisterPress}>
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                Registrati qui
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  card: {
    marginBottom: 20,
    borderRadius: 12,
  },
  cardContent: {
    padding: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: 20,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  socialButton: {
    flex: 1,
    borderRadius: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
  },
});

export default LoginScreen;

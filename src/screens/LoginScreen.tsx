// src/screens/LoginScreen.tsx - VERSIONE AGGIORNATA
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import {
  Button,
  Card,
  Checkbox,
  Divider,
  HelperText,
  Text,
  TextInput,
  useTheme
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '../hooks/useAuth';
import { AuthStackParamList } from '../navigation/AppNavigator';

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

  // Gestori eventi
  const handleLogin = async (): Promise<void> => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    const result = await loginWithEmail(email, password);
    if (result.success) {
      // La navigazione sarà gestita automaticamente dal auth state change
      console.log('Login effettuato con successo');
    }
  };

  const handleGoogleLogin = async (): Promise<void> => {
    const result = await loginWithGoogle();
    if (result.success) {
      console.log('Login Google effettuato con successo');
    }
  };

  const handleAppleLogin = async (): Promise<void> => {
    const result = await loginWithApple();
    if (result.success) {
      console.log('Login Apple effettuato con successo');
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

  return (
      <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
        >
          <Card style={styles.card}>
            <Card.Content>
              {/* Header */}
              <View style={styles.header}>
                <MaterialCommunityIcons
                    name="car-wrench"
                    size={64}
                    color={theme.colors.primary}
                />
                <Text variant="headlineMedium" style={styles.title}>
                  MyMeccanick
                </Text>
                <Text variant="bodyLarge" style={styles.subtitle}>
                  Gestisci le tue automobili
                </Text>
              </View>

              {/* Social Login */}
              <Button
                  mode="outlined"
                  onPress={handleGoogleLogin}
                  loading={loading}
                  disabled={loading}
                  icon="google"
                  style={styles.socialButton}
              >
                Accedi con Google
              </Button>

              {Platform.OS === 'ios' && (
                  <Button
                      mode="outlined"
                      onPress={handleAppleLogin}
                      loading={loading}
                      disabled={loading}
                      icon="apple"
                      style={styles.socialButton}
                  >
                    Accedi con Apple
                  </Button>
              )}

              <View style={styles.dividerContainer}>
                <Divider style={styles.divider} />
                <Text variant="bodySmall" style={styles.dividerText}>OPPURE</Text>
                <Divider style={styles.divider} />
              </View>

              {/* Email/Password Form */}
              <TextInput
                  label="Email"
                  value={email}
                  onChangeText={handleEmailChange}
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

              <TextInput
                  label="Password"
                  value={password}
                  onChangeText={handlePasswordChange}
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
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                    style={styles.rememberMeContainer}
                    onPress={() => setRememberMe(!rememberMe)}
                >
                  <Checkbox
                      status={rememberMe ? 'checked' : 'unchecked'}
                      onPress={() => setRememberMe(!rememberMe)}
                  />
                  <Text variant="bodyMedium">Ricordami</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text variant="bodyMedium" style={styles.forgotPassword}>
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
              >
                Accedi
              </Button>

              {/* Register Link */}
              <View style={styles.registerContainer}>
                <Text variant="bodyMedium">Non hai ancora un account? </Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Register')}
                    disabled={loading}
                >
                  <Text variant="bodyMedium" style={styles.registerLink}>
                    Registrati
                  </Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>
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
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    marginTop: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
  },
  socialButton: {
    marginBottom: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
  },
  input: {
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forgotPassword: {
    color: '#6200ee',
  },
  loginButton: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerLink: {
    color: '#6200ee',
    fontWeight: '600',
  },
});

export default LoginScreen;

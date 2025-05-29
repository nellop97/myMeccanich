// src/screens/LoginScreen.tsx
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  Button,
  Checkbox,
  Divider,
  HelperText,
  IconButton,
  Text,
  TextInput,
  useTheme
} from 'react-native-paper';
import { AuthStackParamList } from '../navigation/AppNavigator';
import { useStore } from '../store';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { setUser } = useStore();
  const theme = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!text) {
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

  const validatePassword = (text: string) => {
    if (!text) {
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

  const handleLogin = async () => {
    // Validazione
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simula una chiamata API di login 
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Login completato con successo
      setUser({
        id: '123',
        name: 'Nome Utente',
        email: email,
        isLoggedIn: true,
      });
      
      // Il reindirizzamento principale avverrà automaticamente tramite 
      // la logica dell'AppNavigator poiché abbiamo aggiornato lo stato utente
    } catch (error) {
      console.error('Errore di login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          {/* Placeholder per il logo. Sostituiscilo con la tua immagine */}
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>MyApp</Text>
          </View>
          <Text variant="headlineMedium" style={styles.appName}>MyApp</Text>
        </View>

        <View style={styles.formContainer}>
          <Text variant="titleLarge" style={styles.title}>Accedi</Text>
          
          {/* Campo Email */}
          <TextInput
            label="Email"
            value={email}
            onChangeText={text => {
              setEmail(text);
              if (emailError) validateEmail(text);
            }}
            onBlur={() => validateEmail(email)}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
            style={styles.input}
            error={!!emailError}
          />
          {emailError ? <HelperText type="error">{emailError}</HelperText> : null}
          
          {/* Campo Password */}
          <TextInput
            label="Password"
            value={password}
            onChangeText={text => {
              setPassword(text);
              if (passwordError) validatePassword(text);
            }}
            onBlur={() => validatePassword(password)}
            mode="outlined"
            secureTextEntry={!showPassword}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
            error={!!passwordError}
          />
          {passwordError ? <HelperText type="error">{passwordError}</HelperText> : null}
          
          {/* Opzioni aggiuntive */}
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setRememberMe(!rememberMe)}
            >
              <Checkbox
                status={rememberMe ? 'checked' : 'unchecked'}
                onPress={() => setRememberMe(!rememberMe)}
              />
              <Text variant="bodyMedium">Ricordami</Text>
            </TouchableOpacity>
            
            <TouchableOpacity>
              <Text variant="bodyMedium" style={{color: theme.colors.primary}}>
                Password dimenticata?
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Pulsante di Login */}
          <Button 
            mode="contained" 
            onPress={handleLogin}
            style={styles.loginButton}
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Accesso in corso...' : 'Accedi'}
          </Button>
          
          {/* Divisore */}
          <View style={styles.dividerContainer}>
            <Divider style={styles.divider} />
            <Text variant="bodySmall" style={styles.dividerText}>oppure</Text>
            <Divider style={styles.divider} />
          </View>
          
          {/* Pulsanti Social */}
          <View style={styles.socialButtonsContainer}>
            <IconButton
              icon="google"
              mode="contained"
              size={24}
              onPress={() => {}}
              style={styles.socialButton}
            />
            <IconButton
              icon="facebook"
              mode="contained"
              size={24}
              onPress={() => {}}
              style={styles.socialButton}
            />
            <IconButton
              icon="apple"
              mode="contained"
              size={24}
              onPress={() => {}}
              style={styles.socialButton}
            />
          </View>
          
          {/* Link Registrazione */}
          <View style={styles.registerContainer}>
            <Text variant="bodyMedium">Non hai ancora un account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text 
                variant="bodyMedium" 
                style={{color: theme.colors.primary, fontWeight: 'bold'}}
              >
                Registrati
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  appName: {
    marginTop: 8,
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    marginBottom: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    marginBottom: 8,
  },
  optionsRow: {
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
    paddingVertical: 6,
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
    marginHorizontal: 8,
    color: '#888',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  socialButton: {
    marginHorizontal: 12,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
});
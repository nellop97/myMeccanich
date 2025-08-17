// src/screens/LoginScreen.tsx - AGGIORNATA CON NUOVO SISTEMA TEMA
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Platform,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  TouchableOpacity,
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
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Importa i servizi Firebase
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, getFirebaseErrorMessage, isWeb } from '../services/firebase';

// Importa il nuovo sistema di temi
import { useAppThemeManager, useThemedStyles } from '../hooks/useTheme';

// Gestione Google Sign-In cross-platform
let GoogleSignin: any = null;
let AuthSession: any = null;

// Import condizionali per evitare errori
if (!isWeb) {
  try {
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  } catch (e) {
    console.warn('Google Sign-In non disponibile:', e);
  }
} else {
  try {
    AuthSession = require('expo-auth-session');
  } catch (e) {
    console.warn('Expo Auth Session non disponibile:', e);
  }
}

const GOOGLE_CONFIG = {
  webClientId: "619020396283-9qv0q1q1q1q1q1q1q1q1q1q1q1q1q1q1.apps.googleusercontent.com",
  iosClientId: "619020396283-ios.apps.googleusercontent.com",
  androidClientId: "619020396283-android.apps.googleusercontent.com",
  scopes: ['openid', 'profile', 'email'],
};

const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Nuovo sistema di temi
  const { colors, isDark, toggleTheme } = useAppThemeManager();
  const { dynamicStyles } = useThemedStyles();
  
  // Responsive hooks
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  
  // Animazioni
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  
  useEffect(() => {
    const onChange = (result: any) => {
      setScreenData(result.window);
    };
    
    const subscription = Dimensions.addEventListener('change', onChange);
    
    // Animazione di entrata
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
    
    return () => subscription?.remove();
  }, []);

  // Stati del form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Stati di validazione
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Calcolo responsive
  const isTablet = screenData.width >= 768;
  const isDesktop = screenData.width >= 1024;
  
  // Configurazione layout responsive
  const getContentMaxWidth = () => {
    if (isDesktop) return 1200;
    if (isTablet) return 800;
    return screenData.width;
  };

  const getCardMargin = () => {
    if (isDesktop) return 40;
    if (isTablet) return 24;
    return 16;
  };

  const getHeaderSize = () => {
    if (isDesktop) return 80;
    if (isTablet) return 70;
    return 60;
  };

  // Validazione
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError && validateEmail(text)) {
      setEmailError('');
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError && text.length >= 6) {
      setPasswordError('');
    }
  };

  // Gestione login email/password
  const handleLogin = async () => {
    // Reset errori
    setEmailError('');
    setPasswordError('');

    // Validazione
    let hasErrors = false;

    if (!email) {
      setEmailError('Email richiesta');
      hasErrors = true;
    } else if (!validateEmail(email)) {
      setEmailError('Email non valida');
      hasErrors = true;
    }

    if (!password) {
      setPasswordError('Password richiesta');
      hasErrors = true;
    } else if (password.length < 6) {
      setPasswordError('La password deve essere di almeno 6 caratteri');
      hasErrors = true;
    }

    if (hasErrors) return;

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login successful:', userCredential.user.email);
      
      // Il navigation avverrà automaticamente tramite AuthNavigator
      
    } catch (error: any) {
      console.error('❌ Login error:', error);
      const errorMessage = getFirebaseErrorMessage(error);
      Alert.alert('Errore di accesso', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Gestione Google Sign-In
  const handleGoogleLogin = async () => {
    if (isWeb) {
      try {
        const provider = new GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        Alert.alert('Info', 'Google Sign-In per web sarà disponibile nella versione finale');
        
      } catch (error: any) {
        console.error('❌ Google Sign-In error (web):', error);
        Alert.alert('Errore', 'Errore durante l\'accesso con Google');
      }
    } else {
      if (!GoogleSignin) {
        Alert.alert('Errore', 'Google Sign-In non disponibile');
        return;
      }

      try {
        await GoogleSignin.hasPlayServices();
        const { idToken } = await GoogleSignin.signIn();
        
        const googleCredential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, googleCredential);
        
        console.log('✅ Google Sign-In successful:', userCredential.user.email);
        
      } catch (error: any) {
        console.error('❌ Google Sign-In error (mobile):', error);
        if (error.code !== 'SIGN_IN_CANCELLED') {
          Alert.alert('Errore', 'Errore durante l\'accesso con Google');
        }
      }
    }
  };

  // Gestione Apple Sign-In (solo iOS)
  const handleAppleLogin = () => {
    Alert.alert('Apple Sign-In', 'Disponibile nella versione finale');
  };

  // Calcolo padding bottom responsive
  const getBottomPadding = () => {
    const basePadding = Math.max(insets.bottom, 16);
    if (isDesktop) return basePadding + 40;
    if (isTablet) return basePadding + 24;
    return basePadding;
  };

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
    contentContainer: {
      flex: 1,
      maxWidth: getContentMaxWidth(),
      alignSelf: 'center',
      width: '100%',
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: isDesktop ? 'center' : 'flex-start',
      paddingHorizontal: getCardMargin(),
      paddingTop: isDesktop ? 40 : Math.max(insets.top + 20, 40),
    },
    
    // Theme toggle button
    themeToggleContainer: {
      position: 'absolute',
      top: insets.top + 10,
      right: 20,
      zIndex: 1000,
    },
    themeToggle: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 20,
      padding: 8,
      ...dynamicStyles.cardShadow,
    },
    
    // Layout a due colonne per desktop
    desktopLayout: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 60,
      minHeight: '100%',
    },
    desktopLeftSide: {
      flex: 1,
      maxWidth: 500,
      alignItems: 'center',
    },
    desktopRightSide: {
      width: 400,
    },

    // Header
    header: {
      alignItems: 'center',
      marginBottom: isDesktop ? 0 : 40,
    },
    headerIcon: {
      marginBottom: 16,
      padding: 20,
      borderRadius: 40,
      backgroundColor: colors.primaryContainer,
      ...dynamicStyles.cardShadow,
    },
    title: {
      fontSize: isDesktop ? 42 : isTablet ? 36 : 32,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
      color: colors.onBackground,
    },
    subtitle: {
      fontSize: isDesktop ? 18 : isTablet ? 16 : 14,
      textAlign: 'center',
      color: colors.onSurfaceVariant,
      maxWidth: isDesktop ? 400 : 300,
      lineHeight: 22,
    },

    // Card del form
    card: {
      width: '100%',
      maxWidth: isDesktop ? 400 : undefined,
      alignSelf: 'center',
      backgroundColor: colors.surface,
      borderRadius: 24,
      ...dynamicStyles.cardShadow,
      overflow: 'hidden',
    },
    cardGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 6,
    },
    cardContent: {
      padding: isDesktop ? 32 : isTablet ? 28 : 24,
    },
    formTitle: {
      fontSize: isDesktop ? 24 : isTablet ? 22 : 20,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 24,
      color: colors.onSurface,
    },

    // Input fields
    input: {
      marginBottom: 8,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
    },
    
    // Options row
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

    // Buttons
    loginButton: {
      marginTop: 8,
      marginBottom: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
    },
    buttonContent: {
      height: 48,
    },

    // Divider
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
      backgroundColor: colors.surface,
      paddingHorizontal: 8,
    },

    // Social buttons
    socialButtonsContainer: {
      gap: 12,
      marginBottom: 24,
    },
    socialButton: {
      borderRadius: 12,
      borderColor: colors.outline,
      backgroundColor: colors.surfaceVariant,
    },

    // Register link
    registerContainer: {
      alignItems: 'center',
      paddingTop: 24,
      paddingBottom: getBottomPadding(),
    },
    registerContainerAndroid: {
      paddingBottom: getBottomPadding() + 20,
    },
    registerTextContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
    },
    registerText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },
    registerLinkContainer: {
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
    },
    registerLink: {
      color: colors.primary,
      fontWeight: '600',
      fontSize: 14,
      textDecorationLine: isWeb ? 'underline' : 'none',
    },
    registerButton: {
      minWidth: 'auto',
      marginLeft: -8, // Compensa il padding del button
    },

    // Web-specific features
    webFeatures: {
      marginTop: isDesktop ? 40 : 24,
      padding: 20,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 16,
      alignItems: 'center',
      ...dynamicStyles.cardShadow,
    },
    webFeaturesTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 12,
      textAlign: 'center',
      color: colors.onSurfaceVariant,
    },
    webFeaturesList: {
      gap: 8,
    },
    webFeatureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    webFeatureText: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
    },

    // Animations
    animatedContainer: {
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }],
    },
  });

  // Theme Toggle Component
  const ThemeToggle = () => (
    <View style={styles.themeToggleContainer}>
      <TouchableOpacity
        style={styles.themeToggle}
        onPress={toggleTheme}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={isDark ? 'weather-sunny' : 'weather-night'}
          size={24}
          color={colors.primary}
        />
      </TouchableOpacity>
    </View>
  );

  // Render per desktop
  const renderDesktopLayout = () => (
    <View style={styles.desktopLayout}>
      {/* Lato sinistro - Branding e features */}
      <Animated.View style={[styles.desktopLeftSide, styles.animatedContainer]}>
        <View style={styles.header}>
          <Surface style={styles.headerIcon} elevation={0}>
            <MaterialCommunityIcons
              name="car-wrench"
              size={getHeaderSize()}
              color={colors.primary}
            />
          </Surface>
          <Text style={styles.title}>
            MyMeccanic
          </Text>
          <Text style={styles.subtitle}>
            La piattaforma completa per la gestione delle automobili. 
            Perfetta per proprietari di auto e officine meccaniche.
          </Text>
        </View>

        {/* Features per web */}
        <View style={styles.webFeatures}>
          <Text style={styles.webFeaturesTitle}>
            Cosa puoi fare con MyMeccanic
          </Text>
          <View style={styles.webFeaturesList}>
            {[
              'Gestire tutti gli interventi di manutenzione',
              'Tenere traccia di scadenze e promemoria',
              'Gestire anagrafica veicoli e clienti',
              'Emettere fatture e gestire contabilità',
              'Comunicazione digitale centralizzata'
            ].map((feature, index) => (
              <View key={index} style={styles.webFeatureItem}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={16}
                  color={colors.success}
                />
                <Text style={styles.webFeatureText}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Lato destro - Form di login */}
      <Animated.View style={[styles.desktopRightSide, styles.animatedContainer]}>
        {renderLoginForm()}
      </Animated.View>
    </View>
  );

  // Render del form di login
  const renderLoginForm = () => (
    <Card style={styles.card} elevation={0}>
      {/* Gradient accent */}
      <LinearGradient
        colors={dynamicStyles.primaryGradient}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
      
      <Card.Content style={styles.cardContent}>
        <Text style={styles.formTitle}>
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
          onChangeText={handlePasswordChange}
          mode="outlined"
          secureTextEntry={!showPassword}
          autoComplete="password"
          error={!!passwordError}
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

        {/* Remember Me & Forgot Password */}
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
          <Text style={styles.dividerText}>
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
            textColor={colors.onSurfaceVariant}
          >
            Continua con Google
          </Button>

          {(Platform.OS === 'ios' || isWeb) && (
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
  );

  // Render del link di registrazione
  const renderRegisterLink = () => (
    <View style={[
      styles.registerContainer,
      Platform.OS === 'android' && styles.registerContainerAndroid
    ]}>
      <View style={styles.registerTextContainer}>
        <Text style={styles.registerText}>
          Non hai un account?{' '}
        </Text>
        {isWeb ? (
          // Versione web con Button per migliore accessibilità
          <Button
            mode="text"
            onPress={() => navigation.navigate('Register' as never)}
            compact
            textColor={colors.primary}
            style={styles.registerButton}
          >
            Registrati
          </Button>
        ) : (
          // Versione mobile con TouchableOpacity
          <TouchableOpacity 
            onPress={() => navigation.navigate('Register' as never)}
            style={styles.registerLinkContainer}
            activeOpacity={0.7}
          >
            <Text style={styles.registerLink}>
              Registrati
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

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
      
      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Status Bar */}
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent={false}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.contentContainer}>
          {isDesktop ? (
            // Layout desktop con due colonne
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {renderDesktopLayout()}
              {renderRegisterLink()}
            </ScrollView>
          ) : (
            // Layout mobile tradizionale
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              {/* Header mobile */}
              <Animated.View style={[styles.header, styles.animatedContainer]}>
                <Surface style={styles.headerIcon} elevation={0}>
                  <MaterialCommunityIcons
                    name="car-wrench"
                    size={getHeaderSize()}
                    color={colors.primary}
                  />
                </Surface>
                <Text style={styles.title}>
                  MyMeccanic
                </Text>
                <Text style={styles.subtitle}>
                  Gestisci la tua auto o la tua officina
                </Text>
              </Animated.View>

              {/* Form */}
              <Animated.View style={styles.animatedContainer}>
                {renderLoginForm()}
              </Animated.View>
              
              {/* Register link */}
              {renderRegisterLink()}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;
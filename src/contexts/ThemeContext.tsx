// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import { MD3LightTheme, MD3DarkTheme, PaperProvider, configureFonts } from 'react-native-paper';
import { useStore } from '../store';

// Definizione dei colori personalizzati per l'app
const lightColors = {
  primary: '#007AFF',
  primaryContainer: '#E3F2FD',
  secondary: '#5856D6',
  secondaryContainer: '#F3E5F5',
  tertiary: '#FF9500',
  tertiaryContainer: '#FFF3E0',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  surfaceContainer: '#FAFAFA',
  background: '#FAFAFA',
  outline: '#E0E0E0',
  outlineVariant: '#F0F0F0',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#1976D2',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#4527A0',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#E65100',
  onSurface: '#1C1B1F',
  onSurfaceVariant: '#49454F',
  onBackground: '#1C1B1F',
  error: '#FF3B30',
  errorContainer: '#FFEBEE',
  onError: '#FFFFFF',
  onErrorContainer: '#C62828',
  success: '#34C759',
  warning: '#FF9500',
  info: '#007AFF',
  
  // Colori personalizzati per l'app auto
  carPrimary: '#1976D2',
  mechanicPrimary: '#FF6B35',
  cardElevation: 'rgba(0, 0, 0, 0.1)',
  glassMorphism: 'rgba(255, 255, 255, 0.1)',
};

const darkColors = {
  primary: '#0A84FF',
  primaryContainer: '#1565C0',
  secondary: '#5E5CE6',
  secondaryContainer: '#512DA8',
  tertiary: '#FF9F0A',
  tertiaryContainer: '#F57C00',
  surface: '#1C1C1E',
  surfaceVariant: '#2C2C2E',
  surfaceContainer: '#3A3A3C',
  background: '#000000',
  outline: '#3A3A3C',
  outlineVariant: '#48484A',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#BBDEFB',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#D1C4E9',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#FFE0B2',
  onSurface: '#FFFFFF',
  onSurfaceVariant: '#CAC4CF',
  onBackground: '#FFFFFF',
  error: '#FF453A',
  errorContainer: '#5F2120',
  onError: '#FFFFFF',
  onErrorContainer: '#FFCCCB',
  success: '#30D158',
  warning: '#FF9F0A',
  info: '#0A84FF',
  
  // Colori personalizzati per l'app auto
  carPrimary: '#42A5F5',
  mechanicPrimary: '#FF8A65',
  cardElevation: 'rgba(255, 255, 255, 0.1)',
  glassMorphism: 'rgba(0, 0, 0, 0.3)',
};

// Font configuration
const fontConfig = {
  displayLarge: {
    fontFamily: 'System',
    fontSize: 57,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 64,
  },
  displayMedium: {
    fontFamily: 'System',
    fontSize: 45,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 52,
  },
  headlineLarge: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 40,
  },
  headlineMedium: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 36,
  },
  titleLarge: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 28,
  },
  bodyLarge: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  labelLarge: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
};

// Temi personalizzati
const customLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...lightColors,
  },
  fonts: configureFonts({ config: fontConfig }),
};

const customDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkColors,
  },
  fonts: configureFonts({ config: fontConfig }),
};

// Interfaccia per il tema esteso
interface ExtendedTheme {
  colors: typeof lightColors;
  fonts: any;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark' | 'auto') => void;
  themeMode: 'light' | 'dark' | 'auto';
}

// Context
const ThemeContext = createContext<ExtendedTheme | undefined>(undefined);

// Provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const { darkMode, preferences, setDarkMode, updatePreferences } = useStore();
  const [currentTheme, setCurrentTheme] = useState(customLightTheme);

  // Determina il tema da usare basandosi sulle preferenze
  const determineTheme = () => {
    let shouldUseDark = false;

    switch (preferences.theme) {
      case 'dark':
        shouldUseDark = true;
        break;
      case 'light':
        shouldUseDark = false;
        break;
      case 'auto':
        shouldUseDark = systemColorScheme === 'dark';
        break;
      default:
        shouldUseDark = darkMode;
    }

    return shouldUseDark;
  };

  // Effect per aggiornare il tema quando cambiano le preferenze o il tema di sistema
  useEffect(() => {
    const shouldUseDark = determineTheme();
    
    if (shouldUseDark !== darkMode) {
      setDarkMode(shouldUseDark);
    }

    setCurrentTheme(shouldUseDark ? customDarkTheme : customLightTheme);
    
    // Aggiorna la status bar
    StatusBar.setBarStyle(shouldUseDark ? 'light-content' : 'dark-content', true);
  }, [preferences.theme, systemColorScheme, darkMode]);

  // Funzioni per gestire il tema
  const toggleTheme = () => {
    const newMode = darkMode ? 'light' : 'dark';
    updatePreferences({ theme: newMode });
  };

  const setThemeMode = (mode: 'light' | 'dark' | 'auto') => {
    updatePreferences({ theme: mode });
  };

  const contextValue: ExtendedTheme = {
    colors: currentTheme.colors,
    fonts: currentTheme.fonts,
    isDark: darkMode,
    toggleTheme,
    setThemeMode,
    themeMode: preferences.theme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <PaperProvider theme={currentTheme}>
        <StatusBar
          barStyle={darkMode ? 'light-content' : 'dark-content'}
          backgroundColor={currentTheme.colors.surface}
          translucent={false}
        />
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};

// Hook personalizzato per usare il tema
export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook per ottenere solo i colori (compatibilità con useTheme di Paper)
export const useThemeColors = () => {
  const { colors } = useAppTheme();
  return colors;
};

// Utility per creare stili responsive con tema
export const createThemedStyles = (darkMode: boolean) => ({
  // Gradient backgrounds
  gradientPrimary: darkMode ? ['#1565C0', '#0A84FF'] : ['#007AFF', '#1976D2'],
  gradientSecondary: darkMode ? ['#512DA8', '#5E5CE6'] : ['#5856D6', '#7B1FA2'],
  
  // Shadows
  cardShadow: darkMode ? {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  } : {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Glass morphism effect
  glassMorphism: darkMode ? {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } : {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },

  // Animation colors
  rippleColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
  overlayColor: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
});

// Export dei temi per uso diretto se necessario
export { customLightTheme, customDarkTheme, lightColors, darkColors };
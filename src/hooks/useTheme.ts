// src/hooks/useTheme.ts
import { useAppTheme } from '../contexts/ThemeContext';
import { useStore } from '../store';

/**
 * Hook unificato per gestire il tema nell'app
 * Combina il nuovo sistema di temi con lo store esistente
 */
export const useAppThemeManager = () => {
  const { colors, isDark, toggleTheme, setThemeMode, themeMode } = useAppTheme();
  const { preferences, updatePreferences } = useStore();

  // Funzioni helper per la gestione del tema
  const setLightMode = () => setThemeMode('light');
  const setDarkMode = () => setThemeMode('dark');
  const setAutoMode = () => setThemeMode('auto');

  // Funzione per cambiare tema con opzioni specifiche
  const changeTheme = (mode: 'light' | 'dark' | 'auto') => {
    updatePreferences({ theme: mode });
    setThemeMode(mode);
  };

  // Status del tema corrente
  const themeStatus = {
    isLight: !isDark,
    isDark: isDark,
    isAuto: themeMode === 'auto',
    currentMode: themeMode,
  };

  return {
    // Colori del tema corrente
    colors,
    
    // Status del tema
    ...themeStatus,
    
    // Funzioni di controllo
    toggleTheme,
    setLightMode,
    setDarkMode,
    setAutoMode,
    changeTheme,
    
    // Preferenze utente
    userPreferences: preferences,
    updatePreferences,
  };
};

/**
 * Hook semplificato per ottenere solo i colori del tema
 * Utile quando serve solo accedere ai colori senza gestire il tema
 */
export const useColors = () => {
  const { colors } = useAppTheme();
  return colors;
};

/**
 * Hook per ottenere gli stili dinamici basati sul tema
 */
export const useThemedStyles = () => {
  const { colors, isDark } = useAppTheme();
  
  return {
    colors,
    isDark,
    
    // Stili comuni dinamici
    dynamicStyles: {
      // Shadows adattivi
      cardShadow: isDark ? {
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

      // Effetto glass morphism
      glassMorphism: {
        backgroundColor: isDark 
          ? 'rgba(255, 255, 255, 0.1)' 
          : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderWidth: 1,
        borderColor: isDark 
          ? 'rgba(255, 255, 255, 0.2)' 
          : 'rgba(0, 0, 0, 0.1)',
      },

      // Gradienti per i bottoni
      primaryGradient: isDark 
        ? ['#1565C0', '#0A84FF'] 
        : ['#007AFF', '#1976D2'],
      
      secondaryGradient: isDark 
        ? ['#512DA8', '#5E5CE6'] 
        : ['#5856D6', '#7B1FA2'],

      // Colori per overlay e ripple
      rippleColor: isDark 
        ? 'rgba(255, 255, 255, 0.2)' 
        : 'rgba(0, 0, 0, 0.1)',
      
      overlayColor: isDark 
        ? 'rgba(0, 0, 0, 0.7)' 
        : 'rgba(0, 0, 0, 0.5)',

      // Border radius standard
      borderRadius: {
        small: 8,
        medium: 12,
        large: 16,
        extraLarge: 24,
        round: 50,
      },

      // Spacing standardizzato
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 40,
      },

      // Dimensioni font responsive
      fontSize: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
        huge: 32,
      },
    }
  };
};

/**
 * Hook per componenti che devono reagire ai cambiamenti di tema
 */
export const useThemeReactive = (callback?: (isDark: boolean) => void) => {
  const { isDark } = useAppTheme();
  
  React.useEffect(() => {
    if (callback) {
      callback(isDark);
    }
  }, [isDark, callback]);

  return { isDark };
};

/**
 * Hook per la gestione delle preferenze tema avanzate
 */
export const useThemePreferences = () => {
  const { preferences, updatePreferences } = useStore();
  const { setThemeMode } = useAppTheme();

  const updateThemePreference = (newTheme: 'light' | 'dark' | 'auto') => {
    updatePreferences({ theme: newTheme });
    setThemeMode(newTheme);
  };

  const resetThemeToDefault = () => {
    updateThemePreference('auto');
  };

  const getThemeLabel = (theme: string) => {
    switch (theme) {
      case 'light': return 'Modalità Chiara';
      case 'dark': return 'Modalità Scura';
      case 'auto': return 'Automatico (Sistema)';
      default: return 'Sconosciuto';
    }
  };

  return {
    currentTheme: preferences.theme,
    updateThemePreference,
    resetThemeToDefault,
    getThemeLabel,
    allPreferences: preferences,
    updatePreferences,
  };
};
// src/screens/mechanic/mechanicTheme.ts - Design token unici dell'area meccanico
import { Platform, TextStyle, useWindowDimensions, ViewStyle } from 'react-native';
import { useAppTheme } from '../../contexts/ThemeContext';

const lightTheme = {
  isDark: false,

  // Sfondi
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceVariant: '#f1f5f9',
  inputBackground: '#f1f5f9',
  hover: '#f1f5f9',
  overlay: 'rgba(15, 23, 42, 0.5)',

  // Testo
  text: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  placeholder: '#64748b',

  // Bordi
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  disabled: '#e2e8f0',

  // Colori semantici
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#dbeafe',
  onPrimaryLight: '#1d4ed8',
  onPrimary: '#ffffff',
  switchThumbOff: '#f4f3f4',
  secondary: '#7c3aed',
  secondaryLight: '#ede9fe',
  success: '#047857',
  successLight: '#d1fae5',
  warning: '#b45309',
  warningLight: '#fef3c7',
  error: '#dc2626',
  errorLight: '#fee2e2',
  neutral: '#475569',
  neutralLight: '#f1f5f9',
};

export type MechanicTheme = typeof lightTheme;

const darkTheme: MechanicTheme = {
  isDark: true,

  // Sfondi
  background: '#0f172a',
  surface: '#1e293b',
  surfaceVariant: '#334155',
  inputBackground: '#334155',
  hover: '#334155',
  overlay: 'rgba(0, 0, 0, 0.6)',

  // Testo
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  placeholder: '#94a3b8',

  // Bordi
  border: '#334155',
  borderLight: '#1e293b',
  disabled: '#334155',

  // Colori semantici
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  primaryLight: '#1e3a8a',
  onPrimaryLight: '#bfdbfe',
  onPrimary: '#ffffff',
  switchThumbOff: '#f4f3f4',
  secondary: '#a855f7',
  secondaryLight: '#581c87',
  success: '#10b981',
  successLight: '#065f46',
  warning: '#f59e0b',
  warningLight: '#78350f',
  error: '#ef4444',
  errorLight: '#7f1d1d',
  neutral: '#94a3b8',
  neutralLight: '#334155',
};

// Valori validi in entrambi i temi, per gli StyleSheet statici
export const mechanicStaticColors = {
  onPrimary: '#ffffff',
  primary: '#2563eb',
  error: '#ef4444',
  primaryTint: 'rgba(59, 130, 246, 0.15)',
  divider: 'rgba(148, 163, 184, 0.25)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: '#000000',
};

export const mechanicRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const mechanicSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Area minima di tocco dei controlli (iOS 44pt, Android 48dp)
export const MECHANIC_MIN_TOUCH = 44;

// Pulsanti: stessa forma ovunque, il colore resta alla schermata
const buttonBase: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: MECHANIC_MIN_TOUCH,
  borderRadius: mechanicRadius.md,
  gap: mechanicSpacing.sm,
};

export const mechanicButton: Record<'primary' | 'secondary' | 'compact' | 'header' | 'icon', ViewStyle> = {
  primary: { ...buttonBase, paddingHorizontal: mechanicSpacing.lg, paddingVertical: 12 },
  secondary: { ...buttonBase, paddingHorizontal: mechanicSpacing.lg, paddingVertical: 12, borderWidth: 1 },
  compact: { ...buttonBase, paddingHorizontal: 12, paddingVertical: mechanicSpacing.sm },
  header: { ...buttonBase, paddingHorizontal: mechanicSpacing.md },
  icon: { ...buttonBase, minWidth: MECHANIC_MIN_TOUCH, gap: 0 },
};

export const mechanicButtonText: Record<'primary' | 'compact', TextStyle> = {
  primary: { fontSize: 16, fontWeight: '600' },
  compact: { fontSize: 14, fontWeight: '600' },
};

// Card: bordo per il tema scuro, ombra leggera per quello chiaro.
// Il colore del bordo arriva dalla schermata (theme.border)
export const mechanicCard: ViewStyle = {
  borderRadius: mechanicRadius.xl,
  borderWidth: 1,
  padding: mechanicSpacing.md,
  elevation: 2,
  shadowColor: mechanicStaticColors.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
};

export const MECHANIC_BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
};

// Stesso tema per schermate, sidebar e layout: segue la modalità scelta in ThemeContext
export const useMechanicTheme = (): MechanicTheme => {
  const { isDark } = useAppTheme();
  return isDark ? darkTheme : lightTheme;
};

// Valori calcolati a ogni render, così il layout segue resize e rotazione
export const useMechanicBreakpoints = () => {
  const { width, height } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= MECHANIC_BREAKPOINTS.desktop;
  const isTablet = !isDesktop && width >= MECHANIC_BREAKPOINTS.tablet;
  const isMobile = width < MECHANIC_BREAKPOINTS.tablet;

  return { width, height, isDesktop, isTablet, isMobile };
};

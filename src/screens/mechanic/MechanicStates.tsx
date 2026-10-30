// src/screens/mechanic/MechanicStates.tsx - Stati di caricamento e vuoto delle schermate meccanico
import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { mechanicButton, mechanicButtonText, useMechanicTheme } from './mechanicTheme';

interface MechanicLoadingStateProps {
  text: string;
}

export const MechanicLoadingState: React.FC<MechanicLoadingStateProps> = ({ text }) => {
  const theme = useMechanicTheme();

  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.loadingText, { color: theme.textSecondary }]}>{text}</Text>
    </View>
  );
};

interface MechanicEmptyStateProps {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionIcon?: React.ComponentType<{ size?: number; color?: string }>;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const MechanicEmptyState: React.FC<MechanicEmptyStateProps> = ({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  style,
  children,
}) => {
  const theme = useMechanicTheme();

  return (
    <View style={[styles.empty, style]}>
      <Icon size={48} color={theme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <TouchableOpacity
          style={[styles.emptyAction, { backgroundColor: theme.primary }]}
          onPress={onAction}
          accessibilityRole="button"
        >
          {ActionIcon ? <ActionIcon size={20} color={theme.onPrimary} /> : null}
          <Text style={[mechanicButtonText.primary, { color: theme.onPrimary }]}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyAction: {
    ...mechanicButton.primary,
    marginTop: 12,
  },
});

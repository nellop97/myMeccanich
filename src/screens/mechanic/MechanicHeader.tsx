// src/screens/mechanic/MechanicHeader.tsx - Header unico delle schermate meccanico
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { mechanicRadius, useMechanicTheme } from './mechanicTheme';

interface MechanicHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  leading?: React.ReactNode;
  right?: React.ReactNode;
}

const MechanicHeader: React.FC<MechanicHeaderProps> = ({ title, subtitle, onBack, leading, right }) => {
  const theme = useMechanicTheme();

  return (
    <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      {onBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Torna indietro"
        >
          <ArrowLeft size={24} color={theme.text} strokeWidth={2} />
        </TouchableOpacity>
      )}

      {leading ? <View style={styles.leading}>{leading}</View> : null}

      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mechanicRadius.md,
  },
  leading: {
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default MechanicHeader;

// src/screens/mechanic/InventoryChip.tsx - Chip di selezione delle schermate di magazzino
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { MECHANIC_MIN_TOUCH, mechanicRadius, mechanicSpacing, useMechanicTheme } from './mechanicTheme';

interface InventoryChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

const InventoryChip: React.FC<InventoryChipProps> = ({ label, selected, onPress, disabled = false }) => {
  const theme = useMechanicTheme();
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected, checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.primaryLight : hovered ? theme.hover : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}
    >
      <Text style={[styles.label, { color: selected ? theme.onPrimaryLight : theme.text }]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    minHeight: MECHANIC_MIN_TOUCH,
    paddingHorizontal: mechanicSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: mechanicRadius.full,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default InventoryChip;

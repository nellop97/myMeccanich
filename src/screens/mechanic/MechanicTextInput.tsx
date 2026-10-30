// src/screens/mechanic/MechanicTextInput.tsx - Campo di testo unico delle schermate meccanico
import React, { useState } from 'react';
import { Platform, StyleProp, StyleSheet, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';
import { Search } from 'lucide-react-native';
import { MECHANIC_MIN_TOUCH, mechanicRadius, useMechanicTheme } from './mechanicTheme';

interface MechanicTextInputProps extends TextInputProps {
  variant?: 'form' | 'search';
  error?: boolean;
  left?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

const MechanicTextInput: React.FC<MechanicTextInputProps> = ({
  variant = 'form',
  error = false,
  left,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...inputProps
}) => {
  const theme = useMechanicTheme();
  const [focused, setFocused] = useState(false);
  const readOnly = inputProps.editable === false;

  const borderColor = readOnly
    ? 'transparent'
    : error
      ? theme.error
      : focused
        ? theme.primary
        : theme.border;

  const icon = left ?? (variant === 'search' ? <Search size={20} color={theme.textSecondary} /> : null);

  return (
    <View
      style={[
        styles.container,
        inputProps.multiline && styles.containerMultiline,
        { borderColor, backgroundColor: readOnly ? 'transparent' : theme.inputBackground },
        containerStyle,
      ]}
    >
      {icon}
      <TextInput
        placeholderTextColor={theme.placeholder}
        {...inputProps}
        style={[styles.input, inputProps.multiline && styles.inputMultiline, { color: theme.text }, style]}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MECHANIC_MIN_TOUCH,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: mechanicRadius.md,
    gap: 8,
  },
  containerMultiline: {
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    fontSize: 16,
    // Su web il bordo del contenitore mostra già il focus
    ...(Platform.OS === 'web' ? ({ outlineWidth: 0 } as TextStyle) : null),
  },
  inputMultiline: {
    textAlignVertical: 'top',
  },
});

export default MechanicTextInput;

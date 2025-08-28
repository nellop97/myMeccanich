import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import { Calendar } from 'lucide-react-native';
import { useAppThemeManager } from '../hooks/useTheme';

// Import condizionale per DateTimePicker
let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  minimumDate,
  maximumDate,
}) => {
  const { colors } = useAppThemeManager();
  const [showPicker, setShowPicker] = useState(false);
  const [webDate, setWebDate] = useState(value.toISOString().split('T')[0]);

  const handleWebChange = (dateString: string) => {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      onChange(date);
      setWebDate(dateString);
    }
  };

  if (Platform.OS === 'web') {
    // Fallback per Web usando input HTML5
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        {label && (
          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
            {label}
          </Text>
        )}
        <View style={styles.webInputContainer}>
          <Calendar size={20} color={colors.primary} />
          <input
            type="date"
            value={webDate}
            onChange={(e) => handleWebChange(e.target.value)}
            min={minimumDate?.toISOString().split('T')[0]}
            max={maximumDate?.toISOString().split('T')[0]}
            style={{
              flex: 1,
              padding: 12,
              fontSize: 16,
              border: 'none',
              background: 'transparent',
              color: colors.onSurface,
              outline: 'none',
            }}
          />
        </View>
      </View>
    );
  }

  // Native implementation per iOS/Android
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface }]}
      onPress={() => setShowPicker(true)}
    >
      <Calendar size={20} color={colors.primary} />
      <View style={styles.content}>
        {label && (
          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
            {label}
          </Text>
        )}
        <Text style={[styles.value, { color: colors.onSurface }]}>
          {value.toLocaleDateString('it-IT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {showPicker && DateTimePicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(event: any, selectedDate?: Date) => {
            setShowPicker(false);
            if (selectedDate) {
              onChange(selectedDate);
            }
          }}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
  },
  webInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
});
// ===========================================
// src/components/DocumentPicker.tsx
// ===========================================
import React from 'react';
import {
  TouchableOpacity,
  Text,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import { Upload } from 'lucide-react-native';
import { useAppThemeManager } from '../hooks/useTheme';

// Import condizionale per Document Picker
let RNDocumentPicker: any = null;
if (Platform.OS !== 'web') {
  RNDocumentPicker = require('react-native-document-picker');
}

interface DocumentPickerProps {
  onSelect: (file: any) => void;
  label?: string;
  accept?: string[];
}

export const DocumentPicker: React.FC<DocumentPickerProps> = ({
  onSelect,
  label = 'Seleziona Documento',
  accept = ['pdf', 'images'],
}) => {
  const { colors } = useAppThemeManager();

  const handleWebPick = () => {
    // Crea un input file nascosto per il web
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept.includes('pdf') ? '.pdf,.jpg,.jpeg,.png' : '.jpg,.jpeg,.png';

    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        // Converti il file web in formato compatibile
        const reader = new FileReader();
        reader.onload = () => {
          onSelect({
            uri: reader.result,
            name: file.name,
            size: file.size,
            type: file.type,
          });
        };
        reader.readAsDataURL(file);
      }
    };

    input.click();
  };

  const handleNativePick = async () => {
    if (!RNDocumentPicker) {
      Alert.alert('Errore', 'Document picker non disponibile');
      return;
    }

    try {
      const types = accept.includes('pdf')
        ? [RNDocumentPicker.types.pdf, RNDocumentPicker.types.images]
        : [RNDocumentPicker.types.images];

      const result = await RNDocumentPicker.pick({ type: types });

      if (result && result[0]) {
        onSelect(result[0]);
      }
    } catch (err) {
      if (!RNDocumentPicker.isCancel(err)) {
        Alert.alert('Errore', 'Errore nella selezione del documento');
      }
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.primaryContainer }]}
      onPress={Platform.OS === 'web' ? handleWebPick : handleNativePick}
    >
      <Upload size={20} color={colors.onPrimaryContainer} />
      <Text style={[styles.buttonText, { color: colors.onPrimaryContainer }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

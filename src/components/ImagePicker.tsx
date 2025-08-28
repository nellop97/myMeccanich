// ===========================================
// src/components/ImagePicker.tsx
// ===========================================
import React from 'react';
import {
  TouchableOpacity,
  Text,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import { Camera } from 'lucide-react-native';
import { useAppThemeManager } from '../hooks/useTheme';

// Import condizionale per Image Picker
let RNImagePicker: any = null;
if (Platform.OS !== 'web') {
  RNImagePicker = require('react-native-image-picker');
}

interface ImagePickerProps {
  onSelect: (image: any) => void;
  label?: string;
  mode?: 'camera' | 'gallery' | 'both';
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  onSelect,
  label = 'Seleziona Immagine',
  mode = 'both',
}) => {
  const { colors } = useAppThemeManager();

  const handleWebPick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (mode === 'camera' && 'capture' in input) {
      (input as any).capture = 'environment';
    }

    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          onSelect({
            uri: reader.result,
            fileName: file.name,
            fileSize: file.size,
            type: file.type,
          });
        };
        reader.readAsDataURL(file);
      }
    };

    input.click();
  };

  const handleNativePick = async () => {
    if (!RNImagePicker) {
      Alert.alert('Errore', 'Image picker non disponibile');
      return;
    }

    const options = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    if (mode === 'both') {
      // Mostra ActionSheet per scegliere
      Alert.alert(
        'Seleziona Immagine',
        'Scegli da dove prendere l\'immagine',
        [
          {
            text: 'Camera',
            onPress: () => {
              RNImagePicker.launchCamera(options, (response: any) => {
                if (!response.didCancel && !response.errorMessage && response.assets) {
                  const asset = response.assets[0];
                  if (asset) {
                    onSelect(asset);
                  }
                }
              });
            }
          },
          {
            text: 'Galleria',
            onPress: () => {
              RNImagePicker.launchImageLibrary(options, (response: any) => {
                if (!response.didCancel && !response.errorMessage && response.assets) {
                  const asset = response.assets[0];
                  if (asset) {
                    onSelect(asset);
                  }
                }
              });
            }
          },
          {
            text: 'Annulla',
            style: 'cancel'
          }
        ]
      );
    } else {
      // Usa direttamente il mode specificato
      const picker = mode === 'camera' 
        ? RNImagePicker.launchCamera
        : RNImagePicker.launchImageLibrary;

      picker(options, (response: any) => {
        if (!response.didCancel && !response.errorMessage && response.assets) {
          const asset = response.assets[0];
          if (asset) {
            onSelect(asset);
          }
        }
      });
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.secondaryContainer }]}
      onPress={Platform.OS === 'web' ? handleWebPick : handleNativePick}
    >
      <Camera size={20} color={colors.onSecondaryContainer} />
      <Text style={[styles.buttonText, { color: colors.onSecondaryContainer }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
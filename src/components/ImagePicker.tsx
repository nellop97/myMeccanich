// ===========================================
// src/components/ImagePicker.tsx
// ===========================================
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
    // Lazy load per evitare errori su web
    const ImagePickerModule = await import('react-native-image-picker');

    const options = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    const picker = mode === 'camera' 
      ? ImagePickerModule.launchCamera
      : ImagePickerModule.launchImageLibrary;

    picker(options, (response) => {
      if (!response.didCancel && !response.errorMessage && response.assets) {
        const asset = response.assets[0];
        if (asset) {
          onSelect(asset);
        }
      }
    });
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

const pickerStyles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
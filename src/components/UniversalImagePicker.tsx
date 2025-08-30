// src/components/UniversalImagePicker.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Alert,
    Image,
    ScrollView,
} from 'react-native';
import {
    Camera,
    Image as ImageIcon,
    Upload,
    X,
    Plus,
} from 'lucide-react-native';
import * as ExpoImagePicker from 'expo-image-picker';
import { useAppThemeManager } from '../hooks/useTheme';

interface ImageAsset {
    uri: string;
    width?: number;
    height?: number;
    type?: string;
    fileName?: string;
    fileSize?: number;
}

interface UniversalImagePickerProps {
    onImagesSelected: (images: ImageAsset[]) => void;
    multiple?: boolean;
    maxImages?: number;
    quality?: number;
    showCameraOption?: boolean;
    showGalleryOption?: boolean;
    label?: string;
    disabled?: boolean;
}

export const UniversalImagePicker: React.FC<UniversalImagePickerProps> = ({
    onImagesSelected,
    multiple = false,
    maxImages = 5,
    quality = 0.8,
    showCameraOption = true,
    showGalleryOption = true,
    label = 'Seleziona immagini',
    disabled = false,
}) => {
    const { colors, isDark } = useAppThemeManager();
    const [selectedImages, setSelectedImages] = useState<ImageAsset[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const requestPermissions = async () => {
        if (Platform.OS === 'web') return true;

        const cameraPermission = await ExpoImagePicker.requestCameraPermissionsAsync();
        const mediaLibraryPermission = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();

        return (
            cameraPermission.status === 'granted' &&
            mediaLibraryPermission.status === 'granted'
        );
    };

    const pickFromGallery = async () => {
        try {
            setIsLoading(true);
            const result = await ExpoImagePicker.launchImageLibraryAsync({
                mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: multiple,
                quality,
                allowsEditing: !multiple,
                aspect: [4, 3],
            });

            if (!result.canceled && result.assets) {
                const images: ImageAsset[] = result.assets.map(asset => ({
                    uri: asset.uri,
                    width: asset.width,
                    height: asset.height,
                    type: asset.type,
                    fileName: asset.fileName || `image_${Date.now()}.jpg`,
                    fileSize: asset.fileSize,
                }));

                handleImagesSelected(images);
            }
        } catch (error) {
            Alert.alert('Errore', 'Errore durante la selezione delle immagini');
        } finally {
            setIsLoading(false);
        }
    };

    const takePhoto = async () => {
        try {
            setIsLoading(true);
            const hasPermission = await requestPermissions();
            
            if (!hasPermission) {
                Alert.alert('Permessi necessari', 'Sono necessari i permessi per camera e galleria');
                return;
            }

            const result = await ExpoImagePicker.launchCameraAsync({
                mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
                quality,
                allowsEditing: true,
                aspect: [4, 3],
            });

            if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];
                const image: ImageAsset = {
                    uri: asset.uri,
                    width: asset.width,
                    height: asset.height,
                    type: asset.type,
                    fileName: `photo_${Date.now()}.jpg`,
                    fileSize: asset.fileSize,
                };

                handleImagesSelected([image]);
            }
        } catch (error) {
            Alert.alert('Errore', 'Errore durante lo scatto della foto');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImagesSelected = (images: ImageAsset[]) => {
        const newImages = multiple 
            ? [...selectedImages, ...images].slice(0, maxImages)
            : images;
        
        setSelectedImages(newImages);
        onImagesSelected(newImages);
    };

    const removeImage = (index: number) => {
        const newImages = selectedImages.filter((_, i) => i !== index);
        setSelectedImages(newImages);
        onImagesSelected(newImages);
    };

    return (
        <View style={styles.container}>
            {label && (
                <Text style={[styles.label, { color: colors.onSurface }]}>
                    {label}
                </Text>
            )}

            <View style={styles.buttonContainer}>
                {showGalleryOption && (
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            { 
                                backgroundColor: colors.primary + '20',
                                borderColor: colors.primary,
                            }
                        ]}
                        onPress={pickFromGallery}
                        disabled={disabled || isLoading}
                    >
                        <ImageIcon size={20} color={colors.primary} />
                        <Text style={[styles.buttonText, { color: colors.primary }]}>
                            Galleria
                        </Text>
                    </TouchableOpacity>
                )}

                {showCameraOption && (
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            { 
                                backgroundColor: colors.secondary + '20',
                                borderColor: colors.secondary,
                            }
                        ]}
                        onPress={takePhoto}
                        disabled={disabled || isLoading}
                    >
                        <Camera size={20} color={colors.secondary} />
                        <Text style={[styles.buttonText, { color: colors.secondary }]}>
                            Fotocamera
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {selectedImages.length > 0 && (
                <ScrollView 
                    horizontal 
                    style={styles.imagePreview}
                    showsHorizontalScrollIndicator={false}
                >
                    {selectedImages.map((image, index) => (
                        <View key={index} style={styles.imageContainer}>
                            <Image source={{ uri: image.uri }} style={styles.image} />
                            <TouchableOpacity
                                style={[styles.removeButton, { backgroundColor: colors.error }]}
                                onPress={() => removeImage(index)}
                            >
                                <X size={16} color="white" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        gap: 8,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    imagePreview: {
        marginTop: 12,
    },
    imageContainer: {
        position: 'relative',
        marginRight: 8,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    removeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default UniversalImagePicker;
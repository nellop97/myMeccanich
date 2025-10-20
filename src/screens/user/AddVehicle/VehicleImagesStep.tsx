import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
    Image,
    ActivityIndicator,
} from 'react-native';
import { Camera, Upload, X, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../services/firebase';

interface VehicleImagesStepProps {
    formData: any;
    updateFormData: (data: any) => void;
    onNext: () => void;
    onBack: () => void;
    userId: string;
}

interface UploadingImage {
    uri: string;
    fileName: string;
    progress: number;
    status: 'uploading' | 'success' | 'error';
    url?: string;
}

const VehicleImagesStep: React.FC<VehicleImagesStepProps> = ({
                                                                 formData,
                                                                 updateFormData,
                                                                 onNext,
                                                                 onBack,
                                                                 userId,
                                                             }) => {
    const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Richiedi permessi fotocamera/galleria
    const requestPermissions = async () => {
        if (Platform.OS !== 'web') {
            const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
            const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
                Alert.alert(
                    'Permessi Necessari',
                    'Servono i permessi per accedere alla fotocamera e galleria'
                );
                return false;
            }
        }
        return true;
    };

    // Seleziona immagini dalla galleria
    const pickImages = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 0.8,
                allowsEditing: false,
            });

            if (!result.canceled && result.assets) {
                uploadImages(result.assets);
            }
        } catch (error) {
            console.error('Errore selezione immagini:', error);
            Alert.alert('Errore', 'Impossibile selezionare le immagini');
        }
    };

    // Scatta foto con fotocamera
    const takePhoto = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchCameraAsync({
                quality: 0.8,
                allowsEditing: true,
                aspect: [16, 9],
            });

            if (!result.canceled && result.assets) {
                uploadImages(result.assets);
            }
        } catch (error) {
            console.error('Errore cattura foto:', error);
            Alert.alert('Errore', 'Impossibile scattare la foto');
        }
    };

    // Upload immagini su Firebase Storage
    const uploadImages = async (assets: any[]) => {
        setIsUploading(true);

        // Prepara array di immagini in upload
        const newUploadingImages: UploadingImage[] = assets.map((asset) => ({
            uri: asset.uri,
            fileName: asset.fileName || `photo_${Date.now()}.jpg`,
            progress: 0,
            status: 'uploading' as const,
        }));

        setUploadingImages((prev) => [...prev, ...newUploadingImages]);

        try {
            const uploadPromises = assets.map((asset, index) =>
                uploadSingleImage(
                    asset,
                    newUploadingImages.length > 0 ? uploadingImages.length + index : index
                )
            );

            const uploadedUrls = await Promise.all(uploadPromises);

            // Aggiorna formData con i nuovi URL
            updateFormData({
                images: [...(formData.images || []), ...uploadedUrls.filter(Boolean)],
            });

            Alert.alert('Successo', `${uploadedUrls.length} foto caricate!`);
        } catch (error) {
            console.error('Errore upload:', error);
            Alert.alert('Errore', 'Alcune foto non sono state caricate');
        } finally {
            setIsUploading(false);
        }
    };

    // Upload singola immagine
    const uploadSingleImage = async (
        asset: any,
        index: number
    ): Promise<string | null> => {
        try {
            // Converti URI in Blob
            const response = await fetch(asset.uri);
            const blob = await response.blob();

            // Crea riferimento Firebase Storage
            const timestamp = Date.now();
            const fileName = asset.fileName || `photo_${timestamp}.jpg`;
            const storagePath = `vehicles/${userId}/photos/${timestamp}_${fileName}`;
            const storageRef = ref(storage, storagePath);

            // Upload con monitoraggio progresso
            const uploadTask = uploadBytesResumable(storageRef, blob);

            return new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const progress =
                            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

                        // Aggiorna progress
                        setUploadingImages((prev) =>
                            prev.map((img, i) =>
                                i === index
                                    ? { ...img, progress: Math.round(progress) }
                                    : img
                            )
                        );
                    },
                    (error) => {
                        console.error('Errore upload:', error);
                        setUploadingImages((prev) =>
                            prev.map((img, i) =>
                                i === index ? { ...img, status: 'error' } : img
                            )
                        );
                        reject(error);
                    },
                    async () => {
                        // Upload completato
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                        setUploadingImages((prev) =>
                            prev.map((img, i) =>
                                i === index
                                    ? { ...img, status: 'success', url: downloadURL }
                                    : img
                            )
                        );

                        resolve(downloadURL);
                    }
                );
            });
        } catch (error) {
            console.error('Errore upload singola immagine:', error);
            return null;
        }
    };

    // Rimuovi immagine
    const removeImage = (index: number) => {
        setUploadingImages((prev) => prev.filter((_, i) => i !== index));

        const images = formData.images || [];
        updateFormData({
            images: images.filter((_: any, i: number) => i !== index),
        });
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Foto del Veicolo</Text>
                <Text style={styles.subtitle}>
                    Aggiungi foto del tuo veicolo (opzionale)
                </Text>
            </View>

            {/* Pulsanti Upload */}
            <View style={styles.uploadButtons}>
                <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={pickImages}
                    disabled={isUploading}
                >
                    <Upload size={24} color="#3b82f6" />
                    <Text style={styles.uploadButtonText}>Galleria</Text>
                </TouchableOpacity>

                {Platform.OS !== 'web' && (
                    <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={takePhoto}
                        disabled={isUploading}
                    >
                        <Camera size={24} color="#3b82f6" />
                        <Text style={styles.uploadButtonText}>Fotocamera</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Immagini in Upload / Caricate */}
            {uploadingImages.length > 0 && (
                <View style={styles.imagesContainer}>
                    {uploadingImages.map((image, index) => (
                        <View key={index} style={styles.imageCard}>
                            <Image
                                source={{ uri: image.uri }}
                                style={styles.imagePreview}
                                resizeMode="cover"
                            />

                            {/* Progress Overlay */}
                            {image.status === 'uploading' && (
                                <View style={styles.progressOverlay}>
                                    <ActivityIndicator size="small" color="#fff" />
                                    <Text style={styles.progressText}>
                                        {image.progress}%
                                    </Text>
                                    {/* Progress Bar */}
                                    <View style={styles.progressBarContainer}>
                                        <View
                                            style={[
                                                styles.progressBar,
                                                { width: `${image.progress}%` },
                                            ]}
                                        />
                                    </View>
                                </View>
                            )}

                            {/* Success */}
                            {image.status === 'success' && (
                                <View style={styles.successOverlay}>
                                    <Check size={24} color="#fff" />
                                </View>
                            )}

                            {/* Error */}
                            {image.status === 'error' && (
                                <View style={styles.errorOverlay}>
                                    <Text style={styles.errorText}>❌ Errore</Text>
                                </View>
                            )}

                            {/* Rimuovi */}
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => removeImage(index)}
                            >
                                <X size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            {/* Info */}
            <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                    💡 Le foto aiutano a identificare meglio il veicolo e possono essere
                    utili per la manutenzione
                </Text>
            </View>

            {/* Navigation Buttons */}
            <View style={styles.navigationButtons}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={onBack}
                    disabled={isUploading}
                >
                    <Text style={styles.backButtonText}>Indietro</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.nextButton,
                        isUploading && styles.nextButtonDisabled,
                    ]}
                    onPress={onNext}
                    disabled={isUploading}
                >
                    <Text style={styles.nextButtonText}>
                        {isUploading ? 'Caricamento...' : 'Continua'}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8fafc',
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748b',
    },
    uploadButtons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    uploadButton: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 20,
        alignItems: 'center',
        gap: 8,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3b82f6',
    },
    imagesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    imageCard: {
        width: '48%',
        aspectRatio: 1,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    progressOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    progressText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    progressBarContainer: {
        width: '80%',
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 3,
        overflow: 'hidden',
        marginTop: 8,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#3b82f6',
        borderRadius: 3,
    },
    successOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 20,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoBox: {
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    infoText: {
        fontSize: 14,
        color: '#1e40af',
        lineHeight: 20,
    },
    navigationButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    backButton: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e2e8f0',
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
    },
    nextButton: {
        flex: 1,
        backgroundColor: '#3b82f6',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
    },
    nextButtonDisabled: {
        opacity: 0.5,
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});

export default VehicleImagesStep;
// src/services/ImageService.ts - VERSIONE AGGIORNATA CON EXPO
import * as ExpoImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import UploadService from './UploadService';

interface ImageOptions {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
    base64?: boolean;
    compress?: boolean;
    maxWidth?: number;
    maxHeight?: number;
}

interface PickedImage {
    uri: string;
    width?: number;
    height?: number;
    type?: string;
    fileName?: string;
    fileSize?: number;
    base64?: string;
}

export class ImageService {
    private static instance: ImageService;

    static getInstance(): ImageService {
        if (!ImageService.instance) {
            ImageService.instance = new ImageService();
        }
        return ImageService.instance;
    }

    /**
     * Richiedi permessi camera e galleria
     */
    async requestPermissions(): Promise<boolean> {
        try {
            if (Platform.OS === 'web') {
                return true; // I permessi sono gestiti dal browser
            }

            const cameraPermission = await ExpoImagePicker.requestCameraPermissionsAsync();
            const mediaLibraryPermission = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();

            return (
                cameraPermission.status === 'granted' &&
                mediaLibraryPermission.status === 'granted'
            );
        } catch (error) {
            console.error('Errore richiesta permessi:', error);
            return false;
        }
    }

    /**
     * Seleziona immagine dalla galleria
     */
    async pickImage(options: ImageOptions = {}): Promise<PickedImage | null> {
        const {
            allowsEditing = true,
            aspect = [4, 3],
            quality = 0.8,
            base64 = false,
            compress = true,
            maxWidth = 1920,
            maxHeight = 1080,
        } = options;

        try {
            const result = await ExpoImagePicker.launchImageLibraryAsync({
                mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
                allowsEditing,
                aspect,
                quality,
                base64,
            });

            if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];

                if (compress) {
                    return await this.compressImage(asset.uri, {
                        maxWidth,
                        maxHeight,
                        quality,
                    });
                }

                return {
                    uri: asset.uri,
                    width: asset.width,
                    height: asset.height,
                    type: asset.type,
                    fileName: asset.fileName || `image_${Date.now()}.jpg`,
                    base64: asset.base64,
                };
            }

            return null;
        } catch (error) {
            console.error('Errore selezione immagine:', error);
            return null;
        }
    }

    /**
     * Scatta foto con la camera
     */
    async takePhoto(options: ImageOptions = {}): Promise<PickedImage | null> {
        const {
            allowsEditing = true,
            aspect = [4, 3],
            quality = 0.8,
            base64 = false,
            compress = true,
            maxWidth = 1920,
            maxHeight = 1080,
        } = options;

        try {
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                throw new Error('Permessi camera non concessi');
            }

            const result = await ExpoImagePicker.launchCameraAsync({
                mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
                allowsEditing,
                aspect,
                quality,
                base64,
            });

            if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];

                if (compress) {
                    return await this.compressImage(asset.uri, {
                        maxWidth,
                        maxHeight,
                        quality,
                    });
                }

                return {
                    uri: asset.uri,
                    width: asset.width,
                    height: asset.height,
                    type: asset.type,
                    fileName: `photo_${Date.now()}.jpg`,
                    base64: asset.base64,
                };
            }

            return null;
        } catch (error) {
            console.error('Errore scatto foto:', error);
            return null;
        }
    }

    /**
     * Seleziona multiple immagini
     */
    async pickMultipleImages(
        maxImages: number = 5,
        options: ImageOptions = {}
    ): Promise<PickedImage[]> {
        const {
            quality = 0.8,
            compress = true,
            maxWidth = 1920,
            maxHeight = 1080,
        } = options;

        try {
            const result = await ExpoImagePicker.launchImageLibraryAsync({
                mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                selectionLimit: maxImages,
                quality,
            });

            if (!result.canceled && result.assets) {
                const images: PickedImage[] = [];

                for (const asset of result.assets) {
                    if (compress) {
                        const compressed = await this.compressImage(asset.uri, {
                            maxWidth,
                            maxHeight,
                            quality,
                        });
                        images.push(compressed);
                    } else {
                        images.push({
                            uri: asset.uri,
                            width: asset.width,
                            height: asset.height,
                            type: asset.type,
                            fileName: asset.fileName || `image_${Date.now()}.jpg`,
                        });
                    }
                }

                return images;
            }

            return [];
        } catch (error) {
            console.error('Errore selezione multipla:', error);
            return [];
        }
    }

    /**
     * Comprimi immagine
     */
    async compressImage(
        uri: string,
        options: {
            maxWidth?: number;
            maxHeight?: number;
            quality?: number;
            format?: 'jpeg' | 'png';
        } = {}
    ): Promise<PickedImage> {
        const {
            maxWidth = 1920,
            maxHeight = 1080,
            quality = 0.8,
            format = 'jpeg',
        } = options;

        try {
            // Ottieni dimensioni originali
            const originalInfo = await this.getImageInfo(uri);

            // Calcola le nuove dimensioni mantenendo l'aspect ratio
            const { width, height } = this.calculateDimensions(
                originalInfo.width,
                originalInfo.height,
                maxWidth,
                maxHeight
            );

            // Manipola l'immagine
            const manipResult = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width, height } }],
                {
                    compress: quality,
                    format: format === 'png'
                        ? ImageManipulator.SaveFormat.PNG
                        : ImageManipulator.SaveFormat.JPEG,
                }
            );

            return {
                uri: manipResult.uri,
                width: manipResult.width,
                height: manipResult.height,
                type: `image/${format}`,
                fileName: `compressed_${Date.now()}.${format}`,
            };
        } catch (error) {
            console.error('Errore compressione immagine:', error);
            // In caso di errore, ritorna l'immagine originale
            return {
                uri,
                fileName: `image_${Date.now()}.jpg`,
            };
        }
    }

    /**
     * Ottieni informazioni immagine
     */
    private async getImageInfo(uri: string): Promise<{ width: number; height: number }> {
        try {
            if (Platform.OS === 'web') {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        resolve({ width: img.width, height: img.height });
                    };
                    img.src = uri;
                });
            } else {
                // Per mobile, usa le dimensioni fornite da Expo
                // In alternativa, potresti usare una libreria come react-native-image-size
                return { width: 1920, height: 1080 }; // Default fallback
            }
        } catch (error) {
            return { width: 1920, height: 1080 };
        }
    }

    /**
     * Calcola dimensioni mantenendo aspect ratio
     */
    private calculateDimensions(
        originalWidth: number,
        originalHeight: number,
        maxWidth: number,
        maxHeight: number
    ): { width: number; height: number } {
        const aspectRatio = originalWidth / originalHeight;

        let width = originalWidth;
        let height = originalHeight;

        if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
        }

        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }

        return {
            width: Math.round(width),
            height: Math.round(height),
        };
    }

    /**
     * Upload immagine con progresso
     */
    async uploadImage(
        uri: string,
        path: string,
        onProgress?: (progress: number) => void
    ): Promise<{ url: string; path: string }> {
        try {
            return await UploadService.uploadImage(uri, {
                path,
                onProgress,
                compress: true,
                quality: 0.8,
            });
        } catch (error) {
            console.error('Errore upload immagine:', error);
            throw error;
        }
    }

    /**
     * Upload multiple immagini
     */
    async uploadMultipleImages(
        images: PickedImage[],
        basePath: string,
        onProgress?: (progress: number) => void
    ): Promise<Array<{ url: string; path: string }>> {
        const results = [];
        const totalImages = images.length;

        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            const fileName = image.fileName || `image_${Date.now()}_${i}.jpg`;
            const path = `${basePath}/${fileName}`;

            const result = await this.uploadImage(
                image.uri,
                path,
                (progress) => {
                    const totalProgress = ((i + progress / 100) / totalImages) * 100;
                    onProgress?.(totalProgress);
                }
            );

            results.push(result);
        }

        return results;
    }

    /**
     * Converti immagine in Base64
     */
    async imageToBase64(uri: string): Promise<string> {
        try {
            if (Platform.OS === 'web') {
                const response = await fetch(uri);
                const blob = await response.blob();
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } else {
                // Per mobile, usa Expo FileSystem se necessario
                // import * as FileSystem from 'expo-file-system';
                // const base64 = await FileSystem.readAsStringAsync(uri, {
                //   encoding: FileSystem.EncodingType.Base64,
                // });
                // return `data:image/jpeg;base64,${base64}`;

                // Per ora ritorna l'URI
                return uri;
            }
        } catch (error) {
            console.error('Errore conversione base64:', error);
            return uri;
        }
    }

    /**
     * Valida tipo immagine
     */
    isValidImageType(mimeType: string): boolean {
        const validTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/heic',
            'image/heif',
        ];
        return validTypes.includes(mimeType?.toLowerCase());
    }

    /**
     * Ottieni estensione dal MIME type
     */
    getExtensionFromMimeType(mimeType: string): string {
        const mimeToExt: { [key: string]: string } = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'image/heic': 'heic',
            'image/heif': 'heif',
        };
        return mimeToExt[mimeType?.toLowerCase()] || 'jpg';
    }
}

// Export singleton instance
export default ImageService.getInstance();
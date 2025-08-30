import { Platform } from 'react-native';
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    UploadTaskSnapshot,
} from 'firebase/storage';
import { storage } from './firebase';
import * as ImageManipulator from 'expo-image-manipulator';

interface UploadOptions {
    path: string;
    onProgress?: (progress: number) => void;
    compress?: boolean;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
}

export class UploadService {
    private static instance: UploadService;

    static getInstance(): UploadService {
        if (!UploadService.instance) {
            UploadService.instance = new UploadService();
        }
        return UploadService.instance;
    }

    /**
     * Comprimi l'immagine prima dell'upload
     */
    async compressImage(
        uri: string,
        options: {
            maxWidth?: number;
            maxHeight?: number;
            quality?: number;
        } = {}
    ): Promise<string> {
        const { maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = options;

        try {
            const manipResult = await ImageManipulator.manipulateAsync(
                uri,
                [
                    {
                        resize: {
                            width: maxWidth,
                            height: maxHeight,
                        },
                    },
                ],
                {
                    compress: quality,
                    format: ImageManipulator.SaveFormat.JPEG,
                }
            );

            return manipResult.uri;
        } catch (error) {
            console.error('Errore compressione immagine:', error);
            return uri; // Ritorna l'URI originale in caso di errore
        }
    }

    /**
     * Upload di un'immagine su Firebase Storage
     */
    async uploadImage(
        uri: string,
        options: UploadOptions
    ): Promise<{ url: string; path: string }> {
        const {
            path,
            onProgress,
            compress = true,
            maxWidth = 1920,
            maxHeight = 1080,
            quality = 0.8,
        } = options;

        try {
            // Comprimi l'immagine se richiesto
            let imageUri = uri;
            if (compress && Platform.OS !== 'web') {
                imageUri = await this.compressImage(uri, {
                    maxWidth,
                    maxHeight,
                    quality,
                });
            }

            // Crea un blob dall'immagine
            const blob = await this.uriToBlob(imageUri);

            // Crea riferimento Storage
            const storageRef = ref(storage, path);

            // Upload con monitoraggio progresso
            const uploadTask = uploadBytesResumable(storageRef, blob);

            return new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot: UploadTaskSnapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        onProgress?.(progress);
                    },
                    (error) => {
                        console.error('Errore upload:', error);
                        reject(error);
                    },
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve({
                            url: downloadURL,
                            path: uploadTask.snapshot.ref.fullPath,
                        });
                    }
                );
            });
        } catch (error) {
            console.error('Errore durante upload:', error);
            throw error;
        }
    }

    /**
     * Upload multiplo di immagini
     */
    async uploadMultipleImages(
        images: Array<{ uri: string; fileName: string }>,
        basePath: string,
        options: Omit<UploadOptions, 'path'> = {}
    ): Promise<Array<{ url: string; path: string; fileName: string }>> {
        const uploads = images.map(async (image) => {
            const path = `${basePath}/${Date.now()}_${image.fileName}`;
            const result = await this.uploadImage(image.uri, {
                ...options,
                path,
            });
            return {
                ...result,
                fileName: image.fileName,
            };
        });

        return Promise.all(uploads);
    }

    /**
     * Converti URI in Blob
     */
    private async uriToBlob(uri: string): Promise<Blob> {
        if (Platform.OS === 'web') {
            // Per Web, l'URI è già un data URL o blob URL
            const response = await fetch(uri);
            return response.blob();
        } else {
            // Per Mobile
            const response = await fetch(uri);
            return response.blob();
        }
    }

    /**
     * Genera un nome file univoco
     */
    generateFileName(originalName?: string): string {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const extension = originalName?.split('.').pop() || 'jpg';
        return `${timestamp}_${randomString}.${extension}`;
    }

    /**
     * Valida il tipo di file
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
        return validTypes.includes(mimeType.toLowerCase());
    }

    /**
     * Ottieni le dimensioni del file in formato leggibile
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}

export default UploadService.getInstance();
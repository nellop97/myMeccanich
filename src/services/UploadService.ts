// src/services/UploadService.ts - Servizio completo per upload file su Firebase Storage
import { Platform } from 'react-native';
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    UploadTaskSnapshot,
    deleteObject,
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
    fileType?: string;
}

interface UploadResult {
    url: string;
    path: string;
    size?: number;
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
    ): Promise<UploadResult> {
        const {
            path,
            onProgress,
            compress = true,
            maxWidth = 1920,
            maxHeight = 1080,
            quality = 0.8,
        } = options;

        try {
            console.log('📤 Inizio upload immagine:', {
                path,
                compress,
                uri: uri.substring(0, 50) + '...',
            });

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
                        console.error('❌ Errore upload immagine:', error);
                        reject(error);
                    },
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        const result = {
                            url: downloadURL,
                            path: uploadTask.snapshot.ref.fullPath,
                            size: uploadTask.snapshot.totalBytes,
                        };

                        console.log('✅ Upload immagine completato:', {
                            url: result.url.substring(0, 50) + '...',
                            path: result.path,
                            size: this.formatFileSize(result.size),
                        });

                        resolve(result);
                    }
                );
            });
        } catch (error) {
            console.error('❌ Errore durante upload immagine:', error);
            throw error;
        }
    }

    /**
     * Upload di un documento generico (PDF, DOC, etc.)
     */
    async uploadDocument(
        uri: string,
        options: UploadOptions
    ): Promise<UploadResult> {
        const { path, onProgress } = options;

        try {
            console.log('📤 Inizio upload documento:', {
                path,
                uri: uri.substring(0, 50) + '...',
            });

            // Crea un blob dal documento
            const blob = await this.uriToBlob(uri);

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
                        console.error('❌ Errore upload documento:', error);
                        reject(error);
                    },
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        const result = {
                            url: downloadURL,
                            path: uploadTask.snapshot.ref.fullPath,
                            size: uploadTask.snapshot.totalBytes,
                        };

                        console.log('✅ Upload documento completato:', {
                            url: result.url.substring(0, 50) + '...',
                            path: result.path,
                            size: this.formatFileSize(result.size),
                        });

                        resolve(result);
                    }
                );
            });
        } catch (error) {
            console.error('❌ Errore durante upload documento:', error);
            throw error;
        }
    }

    /**
     * Upload generico (auto-detect immagine o documento)
     */
    async uploadFile(
        uri: string,
        options: UploadOptions
    ): Promise<UploadResult> {
        const { fileType, ...uploadOptions } = options;

        // Determina se è un'immagine
        const isImage = fileType?.startsWith('image/') || this.isValidImageType(fileType || '');

        if (isImage) {
            return await this.uploadImage(uri, uploadOptions);
        } else {
            return await this.uploadDocument(uri, uploadOptions);
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
            const path = `${basePath}/${this.generateFileName(image.fileName)}`;
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
     * Upload multiplo di file (immagini + documenti)
     */
    async uploadMultipleFiles(
        files: Array<{ uri: string; fileName: string; fileType?: string }>,
        basePath: string,
        options: Omit<UploadOptions, 'path'> = {}
    ): Promise<Array<{ url: string; path: string; fileName: string; size?: number }>> {
        const uploads = files.map(async (file) => {
            const path = `${basePath}/${this.generateFileName(file.fileName)}`;
            const result = await this.uploadFile(file.uri, {
                ...options,
                path,
                fileType: file.fileType,
            });
            return {
                ...result,
                fileName: file.fileName,
            };
        });

        return Promise.all(uploads);
    }

    /**
     * Cancella file da Storage
     */
    async deleteFile(path: string): Promise<void> {
        try {
            const storageRef = ref(storage, path);
            await deleteObject(storageRef);
            console.log('🗑️ File eliminato:', path);
        } catch (error) {
            console.error('❌ Errore eliminazione file:', error);
            throw error;
        }
    }

    /**
     * Cancella multipli file
     */
    async deleteMultipleFiles(paths: string[]): Promise<void> {
        const deletes = paths.map(path => this.deleteFile(path));
        await Promise.all(deletes);
    }

    /**
     * Converti URI in Blob
     */
    private async uriToBlob(uri: string): Promise<Blob> {
        const response = await fetch(uri);
        return response.blob();
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
     * Valida il tipo di file immagine
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
     * Valida il tipo di documento
     */
    isValidDocumentType(mimeType: string): boolean {
        const validTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv',
        ];
        return validTypes.includes(mimeType.toLowerCase());
    }

    /**
     * Ottieni estensione da MIME type
     */
    getExtensionFromMimeType(mimeType: string): string {
        const mimeToExt: { [key: string]: string } = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'application/pdf': 'pdf',
            'application/msword': 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'application/vnd.ms-excel': 'xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
            'text/plain': 'txt',
            'text/csv': 'csv',
        };
        return mimeToExt[mimeType] || 'bin';
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
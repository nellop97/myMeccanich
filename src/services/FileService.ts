// src/services/FileService.ts
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

export class FileService {
    private static instance: FileService;

    static getInstance(): FileService {
        if (!FileService.instance) {
            FileService.instance = new FileService();
        }
        return FileService.instance;
    }

    /**
     * Converte un file URI in Base64
     */
    async fileToBase64(uri: string): Promise<string> {
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
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            return `data:image/jpeg;base64,${base64}`;
        }
    }

    /**
     * Salva un file nel dispositivo
     */
    async saveFile(uri: string, fileName: string): Promise<boolean> {
        try {
            if (Platform.OS === 'web') {
                // Download per web
                const link = document.createElement('a');
                link.href = uri;
                link.download = fileName;
                link.click();
                return true;
            } else {
                // Richiedi permessi
                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status !== 'granted') {
                    throw new Error('Permesso negato');
                }

                // Salva nel rullino fotografico se è un'immagine
                if (uri.includes('image')) {
                    const asset = await MediaLibrary.createAssetAsync(uri);
                    await MediaLibrary.createAlbumAsync('MyMeccanich', asset, false);
                } else {
                    // Per altri file, usa il file system
                    const fileUri = FileSystem.documentDirectory + fileName;
                    await FileSystem.copyAsync({
                        from: uri,
                        to: fileUri,
                    });
                }
                return true;
            }
        } catch (error) {
            console.error('Errore salvataggio file:', error);
            return false;
        }
    }

    /**
     * Condividi un file
     */
    async shareFile(uri: string, title?: string): Promise<void> {
        if (Platform.OS === 'web') {
            // Web Share API se disponibile
            if (navigator.share) {
                await navigator.share({
                    title: title || 'Condividi file',
                    files: [await this.uriToFile(uri, 'file')],
                });
            } else {
                // Fallback: apri in nuova tab
                window.open(uri, '_blank');
            }
        } else {
            // Mobile sharing
            if (!(await Sharing.isAvailableAsync())) {
                throw new Error('Condivisione non disponibile');
            }
            await Sharing.shareAsync(uri, {
                dialogTitle: title || 'Condividi file',
            });
        }
    }

    /**
     * Converte URI in File object (solo web)
     */
    private async uriToFile(uri: string, fileName: string): Promise<File> {
        const response = await fetch(uri);
        const blob = await response.blob();
        return new File([blob], fileName, { type: blob.type });
    }

    /**
     * Ottieni MIME type dal file
     */
    getMimeType(fileName: string): string {
        const extension = fileName.split('.').pop()?.toLowerCase();
        const mimeTypes: {[key: string]: string} = {
            'pdf': 'application/pdf',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'txt': 'text/plain',
            'json': 'application/json',
        };
        return mimeTypes[extension || ''] || 'application/octet-stream';
    }

    /**
     * Valida dimensione file
     */
    validateFileSize(sizeInBytes: number, maxSizeInMB: number): boolean {
        return sizeInBytes <= maxSizeInMB * 1024 * 1024;
    }

    /**
     * Genera nome file univoco
     */
    generateUniqueFileName(originalName: string): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extension = originalName.split('.').pop();
        const baseName = originalName.replace(/\.[^/.]+$/, '');
        return `${baseName}_${timestamp}_${random}.${extension}`;
    }
}

export default FileService.getInstance();
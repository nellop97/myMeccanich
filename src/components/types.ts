// src/components/pickers/types.ts
// Tipi TypeScript per tutti i componenti picker

// ============= IMAGE PICKER TYPES =============
export interface ImageAsset {
    uri: string;
    fileName?: string;
    fileSize?: number;
    type?: string;
    base64?: string;
    width?: number;
    height?: number;
    exif?: any;
}

export interface UniversalImagePickerProps {
    onImagesSelected: (images: ImageAsset[]) => void;
    multiple?: boolean;
    maxImages?: number;
    label?: string;
    mode?: 'camera' | 'gallery' | 'both';
    showPreview?: boolean;
    compress?: boolean;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
}

// ============= DOCUMENT PICKER TYPES =============
export interface DocumentAsset {
    uri: string;
    name: string;
    size?: number;
    type?: string;
    mimeType?: string;
}

export interface UniversalDocumentPickerProps {
    onDocumentsSelected: (documents: DocumentAsset[]) => void;
    accept?: DocumentType[];
    multiple?: boolean;
    maxFiles?: number;
    maxSize?: number; // in MB
    label?: string;
    showPreview?: boolean;
}

export type DocumentType =
    | 'pdf'
    | 'doc'
    | 'docx'
    | 'excel'
    | 'image'
    | 'text'
    | 'video'
    | 'audio'
    | '*';

// ============= DATE PICKER TYPES =============
export interface UniversalDatePickerProps {
    value: Date;
    onChange: (date: Date) => void;
    label?: string;
    placeholder?: string;
    mode?: DatePickerMode;
    minimumDate?: Date;
    maximumDate?: Date;
    disabled?: boolean;
    error?: string;
    helperText?: string;
    showCalendar?: boolean;
    locale?: string;
    format?: DateFormat;
}

export type DatePickerMode = 'date' | 'time' | 'datetime';
export type DateFormat = 'short' | 'medium' | 'long' | 'full';

// ============= UPLOAD SERVICE TYPES =============
export interface UploadOptions {
    path: string;
    onProgress?: (progress: number) => void;
    compress?: boolean;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
}

export interface UploadResult {
    url: string;
    path: string;
    size?: number;
    type?: string;
}

// ============= FILE SERVICE TYPES =============
export interface FileMetadata {
    name: string;
    size: number;
    type: string;
    lastModified?: Date;
    extension?: string;
}

export interface FileValidationOptions {
    maxSize?: number; // in MB
    allowedTypes?: string[];
    allowedExtensions?: string[];
}

// ============= COMMON TYPES =============
export interface PickerError {
    code: string;
    message: string;
    details?: any;
}

export interface ProgressEvent {
    loaded: number;
    total: number;
    percentage: number;
}

// ============= THEME TYPES =============
export interface PickerTheme {
    primary: string;
    primaryContainer: string;
    onPrimary: string;
    onPrimaryContainer: string;
    surface: string;
    surfaceVariant: string;
    onSurface: string;
    onSurfaceVariant: string;
    outline: string;
    error: string;
    onError: string;
    background: string;
    onBackground: string;
}

// ============= VALIDATION HELPERS =============
export const FileValidation = {
    isValidSize: (sizeInBytes: number, maxSizeInMB: number): boolean => {
        return sizeInBytes <= maxSizeInMB * 1024 * 1024;
    },

    isValidType: (mimeType: string, allowedTypes: string[]): boolean => {
        return allowedTypes.some(type => {
            if (type === '*') return true;
            if (type.endsWith('/*')) {
                const category = type.split('/')[0];
                return mimeType.startsWith(category + '/');
            }
            return mimeType === type;
        });
    },

    getFileExtension: (fileName: string): string => {
        const parts = fileName.split('.');
        return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
    },

    formatFileSize: (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },
};

// ============= CONSTANTS =============
export const PICKER_CONSTANTS = {
    MAX_FILE_SIZE_MB: 10,
    MAX_IMAGE_WIDTH: 1920,
    MAX_IMAGE_HEIGHT: 1080,
    DEFAULT_IMAGE_QUALITY: 0.8,
    MAX_IMAGES_DEFAULT: 5,
    MAX_FILES_DEFAULT: 5,

    ACCEPTED_IMAGE_TYPES: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
    ],

    ACCEPTED_DOCUMENT_TYPES: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
    ],
};

// ============= EXPORT ALL =============
export type {
    ImageAsset as PickerImageAsset,
    DocumentAsset as PickerDocumentAsset,
    UploadOptions as PickerUploadOptions,
    UploadResult as PickerUploadResult,
};
// src/components/pickers/index.ts
// Export unificato per tutti i picker

export { UniversalImagePicker } from './UniversalImagePicker';
export { UniversalDatePicker } from './UniversalDatePicker';
export { UniversalDocumentPicker } from './UniversalDocumentPicker';

// Alias per retrocompatibilità
export { UniversalImagePicker as ImagePicker } from './UniversalImagePicker';
export { UniversalDatePicker as DatePicker } from './UniversalDatePicker';
export { UniversalDocumentPicker as DocumentPicker } from './UniversalDocumentPicker';

// Types export
export type {
    ImageAsset,
    DocumentAsset,
    DatePickerMode,
} from './types';
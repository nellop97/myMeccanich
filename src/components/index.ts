// src/components/pickers/index.ts
// Export centralizzato per tutti i picker universali

// Import dei componenti
import UniversalImagePicker from './UniversalImagePicker';
import UniversalDatePicker from './UniversalDatePicker';
import UniversalDocumentPicker from './UniversalDocumentPicker';

// Export principali
export {
    UniversalImagePicker,
    UniversalDatePicker,
    UniversalDocumentPicker,
};

// Alias per retrocompatibilità (se necessario durante la migrazione)
export {
    UniversalImagePicker as ImagePicker,
    UniversalDatePicker as DatePicker,
    UniversalDocumentPicker as DocumentPicker,
};

// Export di default per import semplificati
export default {
    Image: UniversalImagePicker,
    Date: UniversalDatePicker,
    Document: UniversalDocumentPicker,
};

// Type exports are included in the component files themselves

// Utility function per verificare la disponibilità dei componenti
export const checkPickerAvailability = () => {
    return {
        imagePicker: true, // Sempre disponibile con Expo
        datePicker: true, // Sempre disponibile
        documentPicker: true, // Sempre disponibile
        platform: require('react-native').Platform.OS,
    };
};
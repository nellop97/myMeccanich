// src/utils/formValidation.ts
// Utility per validazione form multi-step

/**
 * Validazione email RFC 5322 compliant
 */
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

/**
 * Validazione targa italiana (formato AB123CD o vecchio formato)
 */
export const validateItalianLicensePlate = (plate: string): boolean => {
    const newFormat = /^[A-Z]{2}\d{3}[A-Z]{2}$/; // AB123CD
    const oldFormat = /^[A-Z]{2}\d{4,6}[A-Z]{0,2}$/; // Vecchio formato
    const cleanPlate = plate.toUpperCase().replace(/\s/g, '');
    return newFormat.test(cleanPlate) || oldFormat.test(cleanPlate);
};

/**
 * Validazione VIN (Vehicle Identification Number)
 * 17 caratteri alfanumerici senza I, O, Q
 */
export const validateVIN = (vin: string): boolean => {
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    return vinRegex.test(vin.toUpperCase());
};

/**
 * Validazione telefono italiano (formato flessibile)
 */
export const validateItalianPhone = (phone: string): boolean => {
    // Rimuove spazi, trattini, parentesi
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    // Accetta +39, 0039, oppure direttamente il numero
    const phoneRegex = /^(\+39|0039)?[0-9]{9,10}$/;
    return phoneRegex.test(cleanPhone);
};

/**
 * Validazione anno veicolo (1900 - anno corrente + 1)
 */
export const validateYear = (year: string | number): boolean => {
    const yearNum = typeof year === 'string' ? parseInt(year, 10) : year;
    const currentYear = new Date().getFullYear();
    return yearNum >= 1900 && yearNum <= currentYear + 1;
};

/**
 * Validazione importo monetario (max 2 decimali)
 */
export const validateAmount = (amount: string): boolean => {
    const amountRegex = /^\d+(\.\d{1,2})?$/;
    return amountRegex.test(amount);
};

/**
 * Formatta targa italiana (aggiunge spazio tra numeri e lettere)
 */
export const formatLicensePlate = (plate: string): string => {
    const cleanPlate = plate.toUpperCase().replace(/\s/g, '');

    // Formato nuovo AB123CD -> AB 123 CD
    if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(cleanPlate)) {
        return `${cleanPlate.slice(0, 2)} ${cleanPlate.slice(2, 5)} ${cleanPlate.slice(5)}`;
    }

    return cleanPlate;
};

/**
 * Formatta numero di telefono italiano
 */
export const formatPhoneNumber = (phone: string): string => {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Rimuove prefisso internazionale se presente
    let number = cleanPhone;
    if (cleanPhone.startsWith('+39')) {
        number = cleanPhone.slice(3);
    } else if (cleanPhone.startsWith('0039')) {
        number = cleanPhone.slice(4);
    }

    // Formatta con spazi (es. 333 1234567 -> 333 123 4567)
    if (number.length === 10) {
        return `${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
    } else if (number.length === 9) {
        return `${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
    }

    return number;
};

/**
 * Formatta importo in euro
 */
export const formatCurrency = (amount: number | string): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR',
    }).format(num);
};

/**
 * Capitalizza prima lettera di ogni parola
 */
export const capitalize = (text: string): string => {
    return text
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Validatore generico per campo obbligatorio
 */
export const validateRequired = (value: string | number | null | undefined, fieldName: string): string | null => {
    if (!value || (typeof value === 'string' && !value.trim())) {
        return `${fieldName} è obbligatorio`;
    }
    return null;
};

/**
 * Validatore completo per form cliente
 */
export interface CustomerFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
}

export interface ValidationErrors {
    [key: string]: string;
}

export const validateCustomerForm = (data: CustomerFormData): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Nome
    if (!data.firstName.trim()) {
        errors.firstName = 'Nome è obbligatorio';
    } else if (data.firstName.trim().length < 2) {
        errors.firstName = 'Nome troppo corto (minimo 2 caratteri)';
    }

    // Cognome
    if (!data.lastName.trim()) {
        errors.lastName = 'Cognome è obbligatorio';
    } else if (data.lastName.trim().length < 2) {
        errors.lastName = 'Cognome troppo corto (minimo 2 caratteri)';
    }

    // Email
    if (!data.email.trim()) {
        errors.email = 'Email è obbligatoria';
    } else if (!validateEmail(data.email)) {
        errors.email = 'Email non valida';
    }

    // Telefono (opzionale ma se presente deve essere valido)
    if (data.phone && data.phone.trim() && !validateItalianPhone(data.phone)) {
        errors.phone = 'Numero di telefono non valido';
    }

    return errors;
};

/**
 * Validatore completo per form veicolo
 */
export interface VehicleFormData {
    make: string;
    model: string;
    year?: string;
    licensePlate: string;
    vin?: string;
    color?: string;
    mileage?: string;
}

export const validateVehicleForm = (data: VehicleFormData): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Marca
    if (!data.make.trim()) {
        errors.make = 'Marca è obbligatoria';
    } else if (data.make.trim().length < 2) {
        errors.make = 'Marca troppo corta (minimo 2 caratteri)';
    }

    // Modello
    if (!data.model.trim()) {
        errors.model = 'Modello è obbligatorio';
    } else if (data.model.trim().length < 2) {
        errors.model = 'Modello troppo corto (minimo 2 caratteri)';
    }

    // Targa
    if (!data.licensePlate.trim()) {
        errors.licensePlate = 'Targa è obbligatoria';
    } else if (!validateItalianLicensePlate(data.licensePlate)) {
        errors.licensePlate = 'Targa non valida (formato: AB123CD)';
    }

    // Anno (opzionale ma se presente deve essere valido)
    if (data.year && !validateYear(data.year)) {
        errors.year = 'Anno non valido';
    }

    // VIN (opzionale ma se presente deve essere valido)
    if (data.vin && data.vin.trim() && !validateVIN(data.vin)) {
        errors.vin = 'VIN non valido (17 caratteri, senza I, O, Q)';
    }

    // Chilometraggio (opzionale ma deve essere numero positivo)
    if (data.mileage && data.mileage.trim()) {
        const mileageNum = parseInt(data.mileage, 10);
        if (isNaN(mileageNum) || mileageNum < 0) {
            errors.mileage = 'Chilometraggio non valido';
        } else if (mileageNum > 1000000) {
            errors.mileage = 'Chilometraggio troppo alto';
        }
    }

    return errors;
};

/**
 * Validatore completo per form riparazione
 */
export interface RepairFormData {
    description: string;
    estimatedCost?: string;
    laborCost?: string;
    estimatedHours?: string;
    notes?: string;
}

export const validateRepairForm = (data: RepairFormData): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Descrizione
    if (!data.description.trim()) {
        errors.description = 'Descrizione è obbligatoria';
    } else if (data.description.trim().length < 10) {
        errors.description = 'Descrizione troppo corta (minimo 10 caratteri)';
    }

    // Costo stimato (opzionale ma deve essere valido)
    if (data.estimatedCost && data.estimatedCost.trim()) {
        if (!validateAmount(data.estimatedCost)) {
            errors.estimatedCost = 'Importo non valido';
        } else {
            const amount = parseFloat(data.estimatedCost);
            if (amount < 0) {
                errors.estimatedCost = 'Importo non può essere negativo';
            } else if (amount > 100000) {
                errors.estimatedCost = 'Importo troppo alto';
            }
        }
    }

    // Costo manodopera (opzionale ma deve essere valido)
    if (data.laborCost && data.laborCost.trim()) {
        if (!validateAmount(data.laborCost)) {
            errors.laborCost = 'Importo non valido';
        } else {
            const amount = parseFloat(data.laborCost);
            if (amount < 0) {
                errors.laborCost = 'Importo non può essere negativo';
            } else if (amount > 50000) {
                errors.laborCost = 'Importo troppo alto';
            }
        }
    }

    // Ore stimate (opzionale ma deve essere valido)
    if (data.estimatedHours && data.estimatedHours.trim()) {
        const hours = parseFloat(data.estimatedHours);
        if (isNaN(hours) || hours < 0) {
            errors.estimatedHours = 'Ore non valide';
        } else if (hours > 1000) {
            errors.estimatedHours = 'Ore troppo alte';
        }
    }

    return errors;
};

/**
 * Validatore per date
 */
export const validateDateRange = (
    startDate: string | null,
    endDate: string | null
): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!startDate) {
        errors.startDate = 'Data di inizio è obbligatoria';
        return errors;
    }

    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Non permette date passate
    if (start < today) {
        errors.startDate = 'La data non può essere nel passato';
    }

    // Se c'è data di fine, deve essere >= data inizio
    if (endDate) {
        const end = new Date(endDate);
        if (end < start) {
            errors.endDate = 'La data di fine deve essere successiva alla data di inizio';
        }
    }

    return errors;
};

/**
 * Utility per sanitizzare input (rimuove caratteri pericolosi)
 */
export const sanitizeInput = (input: string): string => {
    return input
        .replace(/<script[^>]*>.*?<\/script>/gi, '') // Rimuove script tags
        .replace(/<[^>]+>/g, '') // Rimuove HTML tags
        .trim();
};

/**
 * Debounce per validazione in real-time
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

/**
 * Formatta data in italiano
 */
export const formatDate = (date: Date | string, format: 'short' | 'long' = 'short'): string => {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (format === 'short') {
        return d.toLocaleDateString('it-IT'); // 15/10/2025
    } else {
        return d.toLocaleDateString('it-IT', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }); // venerdì 15 ottobre 2025
    }
};

/**
 * Calcola giorni lavorativi tra due date (esclude weekend)
 */
export const calculateWorkingDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    const current = new Date(start);

    while (current <= end) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            // Non domenica (0) e non sabato (6)
            count++;
        }
        current.setDate(current.getDate() + 1);
    }

    return count;
};

/**
 * Helper per gestire errori in modo consistente
 */
export const handleFormError = (error: any): string => {
    if (error.code === 'auth/email-already-in-use') {
        return 'Questa email è già registrata';
    } else if (error.code === 'auth/invalid-email') {
        return 'Email non valida';
    } else if (error.code === 'auth/weak-password') {
        return 'Password troppo debole';
    } else if (error.code === 'permission-denied') {
        return 'Non hai i permessi per questa operazione';
    } else if (error.code === 'unavailable') {
        return 'Servizio temporaneamente non disponibile';
    } else if (error.message) {
        return error.message;
    } else {
        return 'Si è verificato un errore imprevisto';
    }
};

export default {
    validateEmail,
    validateItalianLicensePlate,
    validateVIN,
    validateItalianPhone,
    validateYear,
    validateAmount,
    formatLicensePlate,
    formatPhoneNumber,
    formatCurrency,
    capitalize,
    validateRequired,
    validateCustomerForm,
    validateVehicleForm,
    validateRepairForm,
    validateDateRange,
    sanitizeInput,
    debounce,
    formatDate,
    calculateWorkingDays,
    handleFormError,
};
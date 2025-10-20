// src/utils/validationUtils.ts
// Utility per validazione dati veicolo

import { VehicleFormData } from '../types/addVehicle.types';

// ============================================
// VALIDATORI SINGOLI
// ============================================

/**
 * Valida formato targa italiana
 * Formati supportati:
 * - Nuovo: XX123YY (2 lettere, 3 numeri, 2 lettere)
 * - Vecchio: XX12345 (2 lettere, 5 numeri)
 */
export const validateLicensePlate = (plate: string): boolean => {
    if (!plate || plate.length === 0) return false;

    const normalized = plate.toUpperCase().replace(/\s/g, '');

    // Formato nuovo: AB123CD
    const newFormat = /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/;
    // Formato vecchio: AB12345
    const oldFormat = /^[A-Z]{2}[0-9]{5}$/;

    return newFormat.test(normalized) || oldFormat.test(normalized);
};

/**
 * Valida VIN (Vehicle Identification Number)
 * - 17 caratteri alfanumerici
 * - Escluse lettere I, O, Q per evitare confusione con 1, 0
 */
export const validateVIN = (vin: string): boolean => {
    if (!vin || vin.length !== 17) return false;

    const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/i;
    return vinPattern.test(vin);
};

/**
 * Valida anno di produzione
 * Range: 1950 - anno corrente + 1
 */
export const validateYear = (year: number): boolean => {
    const currentYear = new Date().getFullYear();
    return year >= 1950 && year <= currentYear + 1;
};

/**
 * Valida cilindrata
 * Range ragionevole: 50cc - 10000cc
 */
export const validateEngineSize = (cc?: number): boolean => {
    if (!cc) return true; // Opzionale
    return cc >= 50 && cc <= 10000;
};

/**
 * Valida potenza
 * Range ragionevole: 1CV - 2000CV
 */
export const validatePower = (hp?: number): boolean => {
    if (!hp) return true; // Opzionale
    return hp >= 1 && hp <= 2000;
};

/**
 * Valida data (non nel futuro per date immatricolazione/acquisto)
 */
export const validatePastDate = (date?: Date): boolean => {
    if (!date) return true; // Opzionale
    return date <= new Date();
};

/**
 * Valida data futura (per scadenze)
 */
export const validateFutureDate = (date?: Date): boolean => {
    if (!date) return true; // Opzionale
    return date >= new Date();
};

// ============================================
// VALIDATORI PER STEP
// ============================================

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

/**
 * Valida Step 1 - Dati Base
 */
export const validateStep1 = (data: VehicleFormData): ValidationResult => {
    const errors: Record<string, string> = {};

    if (!data.make || data.make.trim().length === 0) {
        errors.make = 'La marca è obbligatoria';
    }

    if (!data.model || data.model.trim().length === 0) {
        errors.model = 'Il modello è obbligatorio';
    }

    if (!data.year) {
        errors.year = 'L\'anno è obbligatorio';
    } else if (!validateYear(data.year)) {
        errors.year = 'Anno non valido';
    }

    if (!data.licensePlate || data.licensePlate.trim().length === 0) {
        errors.licensePlate = 'La targa è obbligatoria';
    } else if (!validateLicensePlate(data.licensePlate)) {
        errors.licensePlate = 'Formato targa non valido (es. AB123CD)';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

/**
 * Valida Step 2 - Dettagli Tecnici
 */
export const validateStep2 = (data: VehicleFormData): ValidationResult => {
    const errors: Record<string, string> = {};

    if (!data.fuelType) {
        errors.fuelType = 'Il tipo di carburante è obbligatorio';
    }

    if (data.engineSize && !validateEngineSize(data.engineSize)) {
        errors.engineSize = 'Cilindrata non valida (50-10000 cc)';
    }

    if (data.power && !validatePower(data.power)) {
        errors.power = 'Potenza non valida (1-2000 CV)';
    }

    if (data.vin && !validateVIN(data.vin)) {
        errors.vin = 'VIN non valido (17 caratteri alfanumerici)';
    }

    if (data.registrationDate && !validatePastDate(data.registrationDate)) {
        errors.registrationDate = 'La data di immatricolazione non può essere futura';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

/**
 * Valida Step 3 - Scadenze (tutti opzionali)
 */
export const validateStep3 = (data: VehicleFormData): ValidationResult => {
    const errors: Record<string, string> = {};

    // Tutte le scadenze sono opzionali, ma se inserite devono essere future
    if (
        data.insurance?.expiryDate &&
        !validateFutureDate(data.insurance.expiryDate)
    ) {
        errors.insuranceExpiry = 'La scadenza deve essere futura';
    }

    if (
        data.revision?.expiryDate &&
        !validateFutureDate(data.revision.expiryDate)
    ) {
        errors.revisionExpiry = 'La scadenza deve essere futura';
    }

    if (data.roadTax?.expiryDate && !validateFutureDate(data.roadTax.expiryDate)) {
        errors.roadTaxExpiry = 'La scadenza deve essere futura';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

/**
 * Valida form completo
 */
export const validateCompleteForm = (data: VehicleFormData): ValidationResult => {
    const step1 = validateStep1(data);
    const step2 = validateStep2(data);
    const step3 = validateStep3(data);

    return {
        isValid: step1.isValid && step2.isValid && step3.isValid,
        errors: {
            ...step1.errors,
            ...step2.errors,
            ...step3.errors,
        },
    };
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Formatta targa in maiuscolo e rimuove spazi
 */
export const formatLicensePlate = (plate: string): string => {
    return plate.toUpperCase().replace(/\s/g, '');
};

/**
 * Formatta VIN in maiuscolo
 */
export const formatVIN = (vin: string): string => {
    return vin.toUpperCase().replace(/\s/g, '');
};

/**
 * Formatta data in formato italiano
 */
export const formatDate = (date?: Date): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

/**
 * Formatta data per input HTML
 */
export const formatDateForInput = (date?: Date): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
};

/**
 * Controlla se una scadenza è prossima (entro 30 giorni)
 */
export const isDeadlineClose = (date?: Date): boolean => {
    if (!date) return false;
    const today = new Date();
    const deadline = new Date(date);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
};

/**
 * Controlla se una scadenza è scaduta
 */
export const isDeadlineExpired = (date?: Date): boolean => {
    if (!date) return false;
    return new Date(date) < new Date();
};

/**
 * Calcola giorni rimanenti alla scadenza
 */
export const getDaysUntilDeadline = (date?: Date): number => {
    if (!date) return 0;
    const today = new Date();
    const deadline = new Date(date);
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Ottiene label di stato scadenza
 */
export const getDeadlineStatus = (
    date?: Date
): 'expired' | 'close' | 'ok' | 'none' => {
    if (!date) return 'none';
    if (isDeadlineExpired(date)) return 'expired';
    if (isDeadlineClose(date)) return 'close';
    return 'ok';
};

/**
 * Ottiene colore per stato scadenza
 */
export const getDeadlineColor = (date?: Date): string => {
    const status = getDeadlineStatus(date);
    switch (status) {
        case 'expired':
            return '#ef4444'; // Rosso
        case 'close':
            return '#f59e0b'; // Arancione
        case 'ok':
            return '#10b981'; // Verde
        default:
            return '#64748b'; // Grigio
    }
};

// ============================================
// SANITIZE FORM DATA
// ============================================

/**
 * Pulisce e prepara i dati del form per Firestore
 */
export const sanitizeFormData = (data: VehicleFormData) => {
    return {
        // Dati base - obbligatori
        make: data.make.trim(),
        model: data.model.trim(),
        year: data.year,
        licensePlate: formatLicensePlate(data.licensePlate),

        // Dettagli tecnici
        fuel: data.fuelType || 'benzina',
        transmission: data.transmission || 'manuale',
        engineSize: data.engineSize || null,
        power: data.power || null,
        vin: data.vin ? formatVIN(data.vin) : null,
        registrationDate: data.registrationDate || null,
        color: data.color || 'Bianco',
        bodyType: data.bodyType || null,
        doors: data.doors || 4,
        seats: data.seats || 5,

        // Scadenze
        insuranceExpiry: data.insurance?.expiryDate || null,
        insuranceCompany: data.insurance?.company?.trim() || null,
        insurancePolicyNumber: data.insurance?.policyNumber?.trim() || null,
        revisionExpiry: data.revision?.expiryDate || null,
        roadTaxExpiry: data.roadTax?.expiryDate || null,

        // Metadata
        currentMileage: data.currentMileage || 0,
        purchaseDate: data.purchaseDate || null,
        purchasePrice: data.purchasePrice || null,
        notes: data.notes?.trim() || null,
    };
};

// ============================================
// EXPORT TUTTI I VALIDATORI
// ============================================

export const validators = {
    licensePlate: validateLicensePlate,
    vin: validateVIN,
    year: validateYear,
    engineSize: validateEngineSize,
    power: validatePower,
    pastDate: validatePastDate,
    futureDate: validateFutureDate,
    step1: validateStep1,
    step2: validateStep2,
    step3: validateStep3,
    complete: validateCompleteForm,
};

export const formatters = {
    licensePlate: formatLicensePlate,
    vin: formatVIN,
    date: formatDate,
    dateForInput: formatDateForInput,
};

export const deadlineUtils = {
    isClose: isDeadlineClose,
    isExpired: isDeadlineExpired,
    getDaysUntil: getDaysUntilDeadline,
    getStatus: getDeadlineStatus,
    getColor: getDeadlineColor,
};
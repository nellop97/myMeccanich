// src/types/addVehicle.types.ts
// Tipi per il flusso di aggiunta veicolo

export interface VehicleFormData {
    // Step 1 - Dati Base
    make: string;
    model: string;
    year: number;
    licensePlate: string;

    // Step 2 - Dettagli Tecnici
    fuelType: 'benzina' | 'diesel' | 'gpl' | 'metano' | 'ibrida' | 'elettrica' | '';
    transmission: 'manuale' | 'automatico' | 'semiautomatico' | '';
    engineSize?: number; // cc
    power?: number; // CV
    vin?: string;
    registrationDate?: Date;
    color?: string;
    bodyType?: string;
    doors?: number;
    seats?: number;

    // Step 3 - Scadenze e Documenti
    insurance?: {
        expiryDate?: Date;
        company?: string;
        policyNumber?: string;
        documentUri?: string;
    };
    revision?: {
        expiryDate?: Date;
        documentUri?: string;
    };
    roadTax?: {
        expiryDate?: Date;
        documentUri?: string;
    };
    additionalDocuments?: Array<{
        id: string;
        name: string;
        uri: string;
        type: string;
        uploadedAt: Date;
    }>;

    // Metadata
    currentMileage?: number;
    purchaseDate?: Date;
    purchasePrice?: number;
    notes?: string;
    images?: string[];
}

export interface AddVehicleStep {
    id: number;
    title: string;
    isValid: boolean;
    isCompleted: boolean;
}

export interface FieldError {
    field: string;
    message: string;
}

// Validation schema per ogni step
export interface ValidationSchema {
    step1: {
        make: boolean;
        model: boolean;
        year: boolean;
        licensePlate: boolean;
    };
    step2: {
        fuelType: boolean;
        // Altri campi opzionali
    };
    step3: {
        // Tutti opzionali
    };
}

// Picker options
export const FUEL_TYPES = [
    { id: 'benzina', label: 'Benzina', icon: '⛽' },
    { id: 'diesel', label: 'Diesel', icon: '🛢️' },
    { id: 'gpl', label: 'GPL', icon: '💨' },
    { id: 'metano', label: 'Metano', icon: '🌿' },
    { id: 'ibrida', label: 'Ibrida', icon: '🔋' },
    { id: 'elettrica', label: 'Elettrica', icon: '⚡' },
];

export const TRANSMISSION_TYPES = [
    { id: 'manuale', label: 'Manuale' },
    { id: 'automatico', label: 'Automatico' },
    { id: 'semiautomatico', label: 'Semi-Automatico' },
];

export const BODY_TYPES = [
    'Berlina',
    'Station Wagon',
    'SUV',
    'Crossover',
    'Coupé',
    'Cabrio',
    'Monovolume',
    'Citycar',
    'Sportiva',
    'Pick-up',
    'Van',
];

export const CAR_COLORS = [
    { id: 'white', name: 'Bianco', hex: '#FFFFFF', border: '#E5E7EB' },
    { id: 'black', name: 'Nero', hex: '#000000' },
    { id: 'silver', name: 'Argento', hex: '#C0C0C0' },
    { id: 'gray', name: 'Grigio', hex: '#808080' },
    { id: 'red', name: 'Rosso', hex: '#DC2626' },
    { id: 'blue', name: 'Blu', hex: '#2563EB' },
    { id: 'green', name: 'Verde', hex: '#16A34A' },
    { id: 'yellow', name: 'Giallo', hex: '#EAB308' },
    { id: 'orange', name: 'Arancione', hex: '#EA580C' },
    { id: 'brown', name: 'Marrone', hex: '#92400E' },
];

// Auto popolari per autocomplete
export const POPULAR_MAKES = [
    'Abarth', 'Alfa Romeo', 'Audi', 'BMW', 'Citroën', 'Dacia',
    'Fiat', 'Ford', 'Honda', 'Hyundai', 'Jeep', 'Kia',
    'Lancia', 'Mazda', 'Mercedes-Benz', 'Mini', 'Nissan', 'Opel',
    'Peugeot', 'Renault', 'Seat', 'Škoda', 'Smart', 'Tesla',
    'Toyota', 'Volkswagen', 'Volvo',
];

// Utility per validazione anno
export const getValidYears = (): number[] => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = currentYear + 1; i >= 1950; i--) {
        years.push(i);
    }
    return years;
};

// Utility per validazione targa italiana
export const validateItalianLicensePlate = (plate: string): boolean => {
    // Formato nuovo: XX123YY (2 lettere, 3 numeri, 2 lettere)
    const newFormat = /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/;
    // Formato vecchio: XX12345 (2 lettere, 5 numeri)
    const oldFormat = /^[A-Z]{2}[0-9]{5}$/;

    return newFormat.test(plate.toUpperCase()) || oldFormat.test(plate.toUpperCase());
};

// Utility per validazione VIN
export const validateVIN = (vin: string): boolean => {
    // VIN è lungo 17 caratteri alfanumerici
    return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
};
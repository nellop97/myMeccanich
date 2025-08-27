// =====================================================
// 1. STRUTTURA DATABASE FIRESTORE
// =====================================================
// src/types/database.types.ts

export interface Vehicle {
  id: string;
  ownerId: string;
  ownerName?: string;
  
  // Dati base veicolo
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string;
  registrationDate?: Date;
  
  // Specifiche tecniche
  mileage: number;
  fuel: 'benzina' | 'diesel' | 'gpl' | 'metano' | 'ibrida' | 'elettrica';
  transmission: 'manuale' | 'automatico' | 'semiautomatico';
  engineSize?: number; // in cc
  power?: number; // in CV
  color: string;
  bodyType?: string;
  doors?: number;
  seats?: number;
  
  // Optional e dotazioni
  optionals: string[];
  
  // Immagini
  images: VehicleImage[];
  mainImageUrl?: string;
  
  // Privacy settings
  privacySettings: PrivacySettings;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  
  // Contatori
  maintenanceCount: number;
  documentsCount: number;
  expensesTotal?: number;
  
  // Stato vendita
  forSale?: boolean;
  salePrice?: number;
  transferPending?: boolean;
  transferToEmail?: string;
}

export interface VehicleImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  uploadedAt: Date;
  isMain: boolean;
}

export interface PrivacySettings {
  showPersonalInfo: boolean;
  showMileage: boolean;
  showMaintenanceHistory: boolean;
  showMaintenanceDetails: boolean;
  showCosts: boolean;
  showMechanics: boolean;
  showDocuments: boolean;
  showPhotos: boolean;
  allowDataTransfer: boolean;
  requirePinForTransfer: boolean;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  ownerId: string;
  
  // Informazioni intervento
  date: Date;
  type: 'tagliando' | 'gomme' | 'freni' | 'carrozzeria' | 'motore' | 'elettronica' | 'altro';
  description: string;
  mileage: number;
  
  // Costi (privati di default)
  cost?: number;
  laborCost?: number;
  partsCost?: number;
  
  // Officina e meccanico
  workshopId?: string;
  workshopName?: string;
  workshopAddress?: string;
  mechanicName?: string;
  mechanicPhone?: string;
  
  // Ricambi utilizzati
  parts: MaintenancePart[];
  
  // Dettagli aggiuntivi
  notes?: string;
  warranty: boolean;
  warrantyExpiry?: Date;
  nextServiceDate?: Date;
  nextServiceMileage?: number;
  
  // Documenti allegati
  documents: MaintenanceDocument[];
  invoiceNumber?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isVisible: boolean; // per privacy
}

export interface MaintenancePart {
  name: string;
  partNumber?: string;
  quantity: number;
  unitPrice?: number;
  brand?: string;
}

export interface MaintenanceDocument {
  id: string;
  type: 'fattura' | 'ricevuta' | 'foto' | 'certificato' | 'altro';
  name: string;
  url: string;
  uploadedAt: Date;
}

export interface VehicleTransfer {
  id: string;
  vehicleId: string;
  
  // Parti coinvolte
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  
  buyerId?: string; // null finché non accetta
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  
  // Sicurezza
  transferPin: string; // hash del PIN
  pinAttempts: number;
  maxPinAttempts: number;
  
  // Dati da trasferire
  transferData: {
    basicInfo: boolean;
    maintenanceHistory: boolean;
    documents: boolean;
    photos: boolean;
  };
  
  // Stati
  status: 'pending' | 'accepted' | 'completed' | 'cancelled' | 'expired';
  
  // Date
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  
  // Notifiche
  notificationsSent: {
    created: boolean;
    reminder: boolean;
    accepted: boolean;
    completed: boolean;
  };
}

export interface AccessLog {
  id: string;
  userId: string;
  vehicleId: string;
  action: 'view_profile' | 'view_maintenance' | 'view_documents' | 'edit' | 'transfer' | 'delete';
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  platform: 'web' | 'ios' | 'android';
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
}
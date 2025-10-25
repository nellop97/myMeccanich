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
  quantity: number | string; // Support both number and text (e.g., "2", "4 pezzi", "set")
  unitPrice?: number;
  brand?: string;
  cost?: number; // Total cost for this part
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

// =====================================================
// 2. SISTEMA DI PRENOTAZIONE MECCANICO
// =====================================================

export interface Workshop {
  id: string;
  ownerId: string; // mechanic user id

  // Informazioni base
  name: string;
  description?: string;
  email: string;
  phone: string;

  // Indirizzo
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };

  // Dati fiscali
  vatNumber?: string;
  taxCode?: string;

  // Orari di apertura
  businessHours: {
    [key: string]: { // 'monday', 'tuesday', etc.
      isOpen: boolean;
      openTime?: string; // "08:00"
      closeTime?: string; // "18:00"
      breakStart?: string;
      breakEnd?: string;
    };
  };

  // Servizi offerti
  services: WorkshopService[];
  specializations: string[]; // es: "BMW", "Mercedes", "elettriche", etc.

  // Immagini
  logo?: string;
  coverImage?: string;
  galleryImages: string[];

  // Rating e recensioni
  rating: number; // 0-5
  reviewCount: number;
  totalBookings: number;

  // Impostazioni prenotazione
  bookingSettings: {
    autoAccept: boolean; // auto-accetta prenotazioni o richiede conferma
    minAdvanceHours: number; // ore minime di preavviso
    maxAdvanceDays: number; // giorni massimi per prenotare in anticipo
    allowEmergency: boolean; // permetti prenotazioni urgenti
  };

  // Stato
  isVerified: boolean;
  isActive: boolean;
  isTrustedByUser?: boolean; // per meccanici di fiducia dell'utente

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkshopService {
  id: string;
  name: string;
  description?: string;
  category: 'routine' | 'repair' | 'diagnostic' | 'bodywork' | 'electrical' | 'custom';
  estimatedDuration: number; // in minuti
  priceFrom?: number;
  priceTo?: number;
  isAvailable: boolean;
}

export interface BookingRequest {
  id: string;

  // Parti coinvolte
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;

  workshopId: string;
  workshopName: string;
  mechanicId: string;

  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleLicensePlate: string;
  currentMileage: number;

  // Tipo di prenotazione
  bookingType: 'routine' | 'custom' | 'emergency';

  // Dettagli servizio
  serviceId?: string; // se è un servizio di routine
  serviceName: string;
  serviceCategory?: string;

  // Descrizione problema/richiesta
  problemDescription: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';

  // Date proposte
  preferredDates: Date[]; // date proposte dall'utente
  selectedDate?: Date; // data confermata
  estimatedDuration?: number; // minuti

  // Preventivo
  quoteId?: string;
  quotedPrice?: number;
  quoteStatus?: 'pending' | 'approved' | 'rejected';

  // Stato prenotazione
  status: 'pending' | 'quote_requested' | 'quote_sent' | 'date_proposed' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';

  // Conversazione/proposte
  proposals: BookingProposal[];
  messages: BookingMessage[];

  // Completamento
  completedAt?: Date;
  actualCost?: number;
  invoiceId?: string;
  maintenanceRecordId?: string;

  // Note
  userNotes?: string;
  mechanicNotes?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date; // se non confermato entro questa data

  // Notifiche
  notifications: {
    userNotified: boolean;
    mechanicNotified: boolean;
    readyNotificationSent: boolean;
  };
}

export interface BookingProposal {
  id: string;
  proposedBy: 'user' | 'mechanic';
  proposedDate: Date;
  estimatedDuration?: number;
  estimatedCost?: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'counter_proposed';
  createdAt: Date;
}

export interface BookingMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'mechanic';
  message: string;
  attachments?: MessageAttachment[];
  createdAt: Date;
  isRead: boolean;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'document' | 'audio';
  url: string;
  name: string;
  size?: number;
}

export interface Quote {
  id: string;
  bookingRequestId: string;

  // Parti coinvolte
  userId: string;
  workshopId: string;
  mechanicId: string;
  vehicleId: string;

  // Dettagli preventivo
  services: QuoteService[];
  parts: QuotePart[];

  // Costi
  laborCost: number;
  partsCost: number;
  additionalCosts: QuoteAdditionalCost[];
  subtotal: number;
  vatRate: number; // percentuale IVA
  vatAmount: number;
  totalCost: number;

  // Tempi
  estimatedDuration: number; // minuti
  estimatedCompletionDate?: Date;

  // Validità
  validUntil: Date;

  // Note
  notes?: string;
  terms?: string; // termini e condizioni

  // Stato
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';

  // Revisioni
  revisionNumber: number;
  previousQuoteId?: string;

  // Azioni utente
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteService {
  id: string;
  name: string;
  description?: string;
  duration: number; // minuti
  laborCost: number;
}

export interface QuotePart {
  id: string;
  name: string;
  partNumber?: string;
  brand?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  availability?: 'in_stock' | 'order_required' | 'unavailable';
  estimatedDeliveryDays?: number;
}

export interface QuoteAdditionalCost {
  id: string;
  description: string;
  amount: number;
}

export interface UserNotification {
  id: string;
  userId: string;

  // Tipo notifica
  type: 'booking_confirmed' | 'booking_cancelled' | 'quote_received' | 'date_proposed' | 'vehicle_ready' | 'reminder' | 'message_received' | 'general';

  // Contenuto
  title: string;
  message: string;

  // Riferimenti
  bookingRequestId?: string;
  quoteId?: string;
  workshopId?: string;

  // Azione
  actionUrl?: string; // deep link per navigare alla schermata corretta
  actionLabel?: string; // es: "Visualizza preventivo", "Accetta data"

  // Stato
  isRead: boolean;
  readAt?: Date;

  // Priority
  priority: 'low' | 'medium' | 'high';

  // Metadata
  createdAt: Date;
  expiresAt?: Date;
}

export interface TrustedWorkshop {
  id: string;
  userId: string;
  workshopId: string;
  addedAt: Date;
  notes?: string;
}
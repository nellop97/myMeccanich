// scripts/setupFirestore.ts
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Per compatibilità con ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leggi il service account key dinamicamente
let serviceAccount: any;
try {
  const serviceAccountPath = join(__dirname, 'serviceAccountKey.json');
  const serviceAccountContent = readFileSync(serviceAccountPath, 'utf8');
  serviceAccount = JSON.parse(serviceAccountContent);
  console.log('✅ Service account key caricato correttamente');
} catch (error) {
  console.error('❌ Errore caricamento service account key:', error);
  console.error('Assicurati che il file scripts/serviceAccountKey.json esista e sia valido');
  process.exit(1);
}

// Inizializza Firebase Admin
const app = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(app);

// Dati di esempio per il seeding
const sampleData = {
  users: [
    {
      id: 'user_123',
      email: 'mario.rossi@example.com',
      name: 'Mario Rossi',
      userType: 'owner',
      isEmailVerified: true,
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
      isActive: true,
      settings: {
        language: 'it',
        currency: 'EUR',
        notifications: {
          maintenance: true,
          documents: true,
          reminders: true,
          marketing: false,
        },
        privacy: {
          shareDataWithWorkshops: true,
          allowMarketingEmails: false,
        },
      },
    },
    {
      id: 'mechanic_456',
      email: 'officina@example.com',
      name: 'Giuseppe Bianchi',
      userType: 'mechanic',
      isEmailVerified: true,
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
      isActive: true,
      workshopInfo: {
        name: 'Officina Bianchi',
        address: 'Via Roma 123, Milano',
        phone: '+39 02 123456',
        email: 'info@officinameccanica.it',
        vatNumber: 'IT12345678901',
        specializations: ['auto', 'moto'],
        certifications: ['ISO 9001', 'Bosch Certified'],
        workingHours: {
          monday: { open: '08:00', close: '18:00', isClosed: false },
          tuesday: { open: '08:00', close: '18:00', isClosed: false },
          wednesday: { open: '08:00', close: '18:00', isClosed: false },
          thursday: { open: '08:00', close: '18:00', isClosed: false },
          friday: { open: '08:00', close: '18:00', isClosed: false },
          saturday: { open: '08:00', close: '12:00', isClosed: false },
          sunday: { open: '', close: '', isClosed: true },
        },
      },
      settings: {
        language: 'it',
        currency: 'EUR',
        notifications: {
          maintenance: true,
          documents: true,
          reminders: true,
          marketing: true,
        },
        privacy: {
          shareDataWithWorkshops: true,
          allowMarketingEmails: true,
        },
      },
    },
  ],

  workshops: [
    {
      id: 'workshop_456',
      ownerId: 'mechanic_456',
      name: 'Officina Bianchi',
      description: 'Officina specializzata in riparazioni auto e moto dal 1985',
      address: {
        street: 'Via Roma 123',
        city: 'Milano',
        postalCode: '20100',
        country: 'Italia',
        coordinates: {
          latitude: 45.4642,
          longitude: 9.1900,
        },
      },
      contactInfo: {
        phone: '+39 02 123456',
        email: 'info@officinameccanica.it',
        website: 'www.officinameccanica.it',
      },
      businessInfo: {
        vatNumber: 'IT12345678901',
        fiscalCode: 'BNCGPP70A01F205X',
      },
      services: ['tagliando', 'riparazione', 'diagnosi', 'gommista', 'elettrauto'],
      specializations: ['Fiat', 'Volkswagen', 'BMW'],
      certifications: ['ISO 9001', 'Bosch Certified'],
      workingHours: {
        monday: { open: '08:00', close: '18:00', isClosed: false },
        tuesday: { open: '08:00', close: '18:00', isClosed: false },
        wednesday: { open: '08:00', close: '18:00', isClosed: false },
        thursday: { open: '08:00', close: '18:00', isClosed: false },
        friday: { open: '08:00', close: '18:00', isClosed: false },
        saturday: { open: '08:00', close: '12:00', isClosed: false },
        sunday: { open: '', close: '', isClosed: true },
      },
      rating: {
        average: 4.5,
        totalReviews: 127,
      },
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
  ],

  vehicles: [
    {
      id: 'vehicle_789',
      ownerId: 'user_123',
      make: 'Fiat',
      model: '500',
      variant: '1.2 Lounge',
      year: 2020,
      licensePlate: 'AB123CD',
      vin: 'ZFA3120000J123456',
      color: 'Bianco Gelato',
      engine: {
        type: 'gasoline',
        displacement: 1242,
        power: 69,
        emissions: 'Euro 6',
      },
      transmission: 'manual',
      fuelCapacity: 35,
      purchaseInfo: {
        date: '2020-03-15',
        price: 18500,
        mileage: 0,
        dealer: 'Concessionaria Fiat Milano',
      },
      currentMileage: 25000,
      lastMileageUpdate: Timestamp.now(),
      insurance: {
        company: 'UnipolSai',
        policyNumber: 'POL123456789',
        expiryDate: '2025-12-15',
        premium: 650,
      },
      inspection: {
        lastDate: '2024-03-10',
        nextDate: '2026-03-10',
        isValid: true,
      },
      maintenanceSchedule: {
        'tagliando': {
          intervalKm: 15000,
          intervalMonths: 12,
          lastDone: {
            date: '2024-02-15',
            mileage: 20000,
          },
        },
        'cambio_olio': {
          intervalKm: 15000,
          intervalMonths: 12,
        },
      },
      images: [],
      notes: 'Auto in ottime condizioni, sempre garage',
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      sharedWith: ['mechanic_456'],
    },
  ],

  maintenance_records: [
    {
      id: 'maintenance_101',
      vehicleId: 'vehicle_789',
      ownerId: 'user_123',
      workshopId: 'workshop_456',
      mechanicId: 'mechanic_456',
      type: 'routine',
      category: 'tagliando',
      title: 'Tagliando 20.000 km',
      description: 'Tagliando completo con cambio olio, filtri e controlli',
      scheduledDate: '2024-02-15',
      completedDate: '2024-02-15',
      mileage: 20000,
      laborCost: 80,
      partsCost: 120,
      totalCost: 200,
      taxAmount: 44,
      status: 'completed',
      priority: 'medium',
      parts: [
        {
          id: 'part_1',
          name: 'Olio motore 5W30',
          brand: 'Castrol',
          partNumber: 'GTX5W30',
          quantity: 4,
          unitCost: 15,
          warranty: {
            duration: 12,
            terms: 'Garanzia costruttore',
          },
        },
        {
          id: 'part_2',
          name: 'Filtro olio',
          brand: 'Mann',
          partNumber: 'W712/75',
          quantity: 1,
          unitCost: 12,
        },
      ],
      nextService: {
        description: 'Prossimo tagliando',
        dueMileage: 35000,
        estimatedCost: 220,
      },
      warranty: {
        duration: 12,
        terms: 'Garanzia lavoro 12 mesi',
        expiryDate: '2025-02-15',
      },
      notes: 'Tutto regolare, nessun problema riscontrato',
      isInvoiced: true,
      invoiceId: 'invoice_201',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
  ],

  invoices: [
    {
      id: 'invoice_201',
      invoiceNumber: 'FT-2024-001',
      workshopId: 'workshop_456',
      customerId: 'user_123',
      vehicleId: 'vehicle_789',
      issueDate: '2024-02-15',
      dueDate: '2024-03-15',
      status: 'paid',
      subtotal: 200,
      taxRate: 22,
      taxAmount: 44,
      totalAmount: 244,
      paidAmount: 244,
      items: [
        {
          type: 'labor',
          description: 'Manodopera tagliando',
          quantity: 1,
          unitPrice: 80,
          total: 80,
          taxRate: 22,
        },
        {
          type: 'part',
          description: 'Olio motore + filtri',
          quantity: 1,
          unitPrice: 120,
          total: 120,
          taxRate: 22,
          maintenanceRecordId: 'maintenance_101',
        },
      ],
      maintenanceRecordIds: ['maintenance_101'],
      paymentInfo: {
        method: 'card',
        paidDate: '2024-02-15',
        transactionId: 'TXN123456',
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
  ],

  fuel_records: [
    {
      id: 'fuel_301',
      vehicleId: 'vehicle_789',
      ownerId: 'user_123',
      date: '2024-06-20',
      mileage: 25000,
      fuelType: 'gasoline',
      quantity: 32.5,
      pricePerUnit: 1.65,
      totalCost: 53.63,
      isFullTank: true,
      station: {
        name: 'Eni',
        address: 'Via Milano 45, Milano',
        coordinates: {
          latitude: 45.4642,
          longitude: 9.1900,
        },
      },
      consumption: 14.8,
      distanceTraveled: 480,
      notes: 'Primo rifornimento dopo tagliando',
      createdAt: Timestamp.now(),
    },
  ],

  expenses: [
    {
      id: 'expense_401',
      vehicleId: 'vehicle_789',
      ownerId: 'user_123',
      description: 'Assicurazione RCA annuale',
      amount: 650,
      category: 'insurance',
      date: '2024-12-15',
      vendor: 'UnipolSai',
      isRecurring: true,
      recurrencePattern: {
        frequency: 'yearly',
        nextDue: '2025-12-15',
      },
      notes: 'Polizza rinnovata con sconto fedeltà',
      tags: ['assicurazione', 'rca'],
      createdAt: Timestamp.now(),
    },
  ],

  documents: [
    {
      id: 'doc_501',
      vehicleId: 'vehicle_789',
      ownerId: 'user_123',
      name: 'Assicurazione RCA 2024',
      type: 'insurance',
      issueDate: '2024-12-15',
      expiryDate: '2025-12-15',
      documentNumber: 'POL123456789',
      issuer: 'UnipolSai',
      hasExpiryAlert: true,
      alertDaysBefore: 30,
      notes: 'Polizza con copertura furto e incendio',
      tags: ['assicurazione', 'rca', '2024'],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
  ],

  reminders: [
    {
      id: 'reminder_601',
      vehicleId: 'vehicle_789',
      ownerId: 'user_123',
      title: 'Prossimo tagliando',
      description: 'Tagliando programmato a 35.000 km',
      type: 'maintenance',
      triggerType: 'both',
      dueMileage: 35000,
      alertSettings: {
        enabled: true,
        advance: 1000, // 1000 km prima
        repeat: false,
        channels: ['push', 'email'],
      },
      status: 'active',
      priority: 'medium',
      relatedId: 'maintenance_101',
      relatedType: 'maintenance_record',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
  ],

  reviews: [
    {
      id: 'review_701',
      workshopId: 'workshop_456',
      customerId: 'user_123',
      maintenanceRecordId: 'maintenance_101',
      rating: 5,
      title: 'Servizio eccellente',
      comment: 'Officina molto professionale, lavoro eseguito perfettamente e nei tempi previsti.',
      serviceRating: 5,
      priceRating: 4,
      timelinessRating: 5,
      qualityRating: 5,
      isVerified: true,
      isVisible: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
  ],
};

// Funzione per creare le collezioni con dati di esempio
async function setupFirestore() {
  console.log('🚀 Iniziando setup Firestore...');

  try {
    // Crea le collezioni e inserisce i dati di esempio
    for (const [collectionName, documents] of Object.entries(sampleData)) {
      console.log(`📝 Creando collezione: ${collectionName}`);
      
      for (const doc of documents) {
        await db.collection(collectionName).doc(doc.id).set(doc);
        console.log(`  ✅ Documento ${doc.id} creato`);
      }
    }

    // Crea gli indici (questi vanno creati manualmente nella console Firebase)
    console.log('\n📊 Ricorda di creare questi indici nella Firebase Console:');
    console.log('maintenance_records: vehicleId + completedDate (desc)');
    console.log('fuel_records: vehicleId + date (desc)');
    console.log('expenses: vehicleId + date (desc)');
    console.log('reminders: ownerId + status + dueDate (asc)');
    console.log('reviews: workshopId + isVisible + createdAt (desc)');

    console.log('\n🎉 Setup Firestore completato con successo!');
    
  } catch (error) {
    console.error('❌ Errore durante il setup:', error);
  }
}

// Funzione per creare solo la struttura senza dati
async function createEmptyStructure() {
  console.log('📁 Creando struttura vuota...');

  const collections = [
    'users', 'workshops', 'vehicles', 'maintenance_records',
    'invoices', 'fuel_records', 'expenses', 'documents',
    'reminders', 'reviews'
  ];

  for (const collectionName of collections) {
    try {
      // Crea un documento temporaneo per inizializzare la collezione
      const tempDoc = await db.collection(collectionName).add({
        _temp: true,
        createdAt: Timestamp.now(),
      });
      
      // Elimina il documento temporaneo
      await tempDoc.delete();
      
      console.log(`✅ Collezione ${collectionName} creata`);
    } catch (error) {
      console.error(`❌ Errore creando ${collectionName}:`, error);
    }
  }

  console.log('🎉 Struttura vuota creata!');
}

// Funzione per aggiornare le regole di sicurezza
async function setupSecurityRules() {
  console.log('🔒 Le regole di sicurezza devono essere configurate manualmente nella Firebase Console');
  console.log('Vai su: https://console.firebase.google.com > Firestore > Regole');
  
  const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(ownerId) {
      return isAuthenticated() && request.auth.uid == ownerId;
    }
    
    function isSharedUser(sharedWith) {
      return isAuthenticated() && request.auth.uid in sharedWith;
    }
    
    function hasWorkshopAccess(workshopId) {
      return isAuthenticated() && request.auth.uid == workshopId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      
      // Allow reading basic workshop info for public listings
      allow read: if isAuthenticated() && 
        resource.data.userType == 'mechanic' && 
        resource.data.isActive == true;
    }
    
    // Workshops collection  
    match /workshops/{workshopId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && 
        resource.data.ownerId == request.auth.uid;
    }
    
    // Vehicles collection
    match /vehicles/{vehicleId} {
      allow read, write: if isAuthenticated() && 
        (isOwner(resource.data.ownerId) ||
         isSharedUser(resource.data.get('sharedWith', [])));
    }
    
    // Maintenance records
    match /maintenance_records/{recordId} {
      allow read, write: if isAuthenticated() && 
        (isOwner(resource.data.ownerId) ||
         request.auth.uid == resource.data.get('mechanicId', '') ||
         hasWorkshopAccess(resource.data.get('workshopId', '')));
    }
    
    // Invoices
    match /invoices/{invoiceId} {
      allow read, write: if isAuthenticated() && 
        (hasWorkshopAccess(resource.data.get('workshopId', '')) ||
         isOwner(resource.data.customerId));
    }
    
    // Fuel records
    match /fuel_records/{recordId} {
      allow read, write: if isOwner(resource.data.ownerId);
    }
    
    // Expenses
    match /expenses/{recordId} {
      allow read, write: if isOwner(resource.data.ownerId);
    }
    
    // Documents
    match /documents/{documentId} {
      allow read, write: if isOwner(resource.data.ownerId);
    }
    
    // Reminders
    match /reminders/{reminderId} {
      allow read, write: if isOwner(resource.data.ownerId);
    }
    
    // Reviews
    match /reviews/{reviewId} {
      allow read: if isAuthenticated() && resource.data.isVisible == true;
      allow write: if isAuthenticated() && 
        (isOwner(resource.data.customerId) ||
         hasWorkshopAccess(resource.data.workshopId));
    }
  }
}`;

  console.log('\nCopia e incolla queste regole:\n');
  console.log(rules);
}

// Script principale
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'setup':
      await setupFirestore();
      break;
    case 'empty':
      await createEmptyStructure();
      break;
    case 'rules':
      await setupSecurityRules();
      break;
    case 'full':
      await createEmptyStructure();
      await setupFirestore();
      await setupSecurityRules();
      break;
    default:
      console.log(`
🛠️  Script Setup Firestore

Comandi disponibili:
  npm run setup:firestore setup    - Crea collezioni con dati di esempio
  npm run setup:firestore empty    - Crea solo la struttura vuota
  npm run setup:firestore rules    - Mostra le regole di sicurezza
  npm run setup:firestore full     - Setup completo (struttura + dati + regole)

Prima di eseguire:
1. Installa firebase-admin: npm install firebase-admin
2. Scarica il service account key da Firebase Console
3. Salvalo come serviceAccountKey.json in questa directory
      `);
  }

  process.exit(0);
}

// Esegui lo script se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { setupFirestore, createEmptyStructure, setupSecurityRules };
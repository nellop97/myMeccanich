import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as serviceAccount from './serviceAccountKey.json';

const app = initializeApp({
  credential: cert(serviceAccount as any),
});

const db = getFirestore(app);

async function setupFirestore() {
  console.log('🚀 Configurazione struttura database in corso...');

  try {
    // Struttura collezioni principali
    const collections = [
      'users',
      'vehicles',
      'appointments',
      'invoices',
      'customers',
      'maintenance_records',
      'expenses',
      'fuel_records',
      'workshop_settings',
      'notifications'
    ];

    // Inizializza collezioni
    for (const collectionName of collections) {
      const tempDoc = await db.collection(collectionName).add({
        _temp: true,
        _created: Timestamp.now()
      });
      await tempDoc.delete();
      console.log(`✅ ${collectionName} inizializzata`);
    }

    // Dati di esempio per sviluppo
    await createSampleData();

    console.log('\n🎉 Database configurato con successo!');

  } catch (error) {
    console.error('❌ Errore durante la configurazione:', error);
  }

  process.exit(0);
}

async function createSampleData() {
  console.log('\n📝 Creazione dati di esempio...');

  // Utente proprietario auto di esempio
  const sampleUser = {
    uid: 'user_sample_123',
    email: 'mario.rossi@example.com',
    firstName: 'Mario',
    lastName: 'Rossi',
    name: 'Mario Rossi',
    phone: '+39 333 1234567',
    userType: 'user',
    isEmailVerified: true,
    createdAt: Timestamp.now(),
    lastLoginAt: Timestamp.now(),
    isActive: true,
    profileComplete: true,
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
  };

  // Meccanico di esempio
  const sampleMechanic = {
    uid: 'mechanic_sample_456',
    email: 'giuseppe.bianchi@officinameccanica.it',
    firstName: 'Giuseppe',
    lastName: 'Bianchi',
    name: 'Giuseppe Bianchi',
    phone: '+39 02 12345678',
    userType: 'mechanic',
    isEmailVerified: true,
    createdAt: Timestamp.now(),
    lastLoginAt: Timestamp.now(),
    isActive: true,
    profileComplete: true,
    verified: true,
    rating: 4.8,
    reviewsCount: 156,
    // Dati specifici officina
    workshopName: 'Officina Meccanica Bianchi',
    address: 'Via Roma 123, 20100 Milano (MI)',
    vatNumber: 'IT12345678901',
    mechanicLicense: 'LIC123456789',
    specializations: ['auto', 'moto', 'elettrico'],
    certifications: ['ISO 9001', 'Bosch Certified', 'Tesla Certified'],
    workingHours: {
      monday: { open: '08:00', close: '18:00', isClosed: false },
      tuesday: { open: '08:00', close: '18:00', isClosed: false },
      wednesday: { open: '08:00', close: '18:00', isClosed: false },
      thursday: { open: '08:00', close: '18:00', isClosed: false },
      friday: { open: '08:00', close: '18:00', isClosed: false },
      saturday: { open: '08:00', close: '13:00', isClosed: false },
      sunday: { open: '00:00', close: '00:00', isClosed: true },
    },
    settings: {
      language: 'it',
      currency: 'EUR',
      notifications: {
        appointments: true,
        invoices: true,
        reviews: true,
        marketing: false,
      },
      privacy: {
        shareContactWithCustomers: true,
        allowMarketingEmails: false,
      },
    },
  };

  // Auto di esempio per l'utente
  const sampleVehicle = {
    id: 'vehicle_sample_001',
    userId: 'user_sample_123',
    brand: 'Fiat',
    model: 'Punto',
    year: 2018,
    licensePlate: 'AB123CD',
    vin: '1HGBH41JXMN109186',
    fuelType: 'gasoline',
    kilometers: 85000,
    color: 'Bianco',
    engineSize: '1.2',
    transmission: 'manual',
    insuranceExpiry: '2024-12-31',
    revisionExpiry: '2024-06-15',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    isActive: true,
    notes: 'Auto in buone condizioni',
  };

  // Cliente di esempio per il meccanico
  const sampleCustomer = {
    id: 'customer_sample_001',
    mechanicId: 'mechanic_sample_456',
    name: 'Marco Verdi',
    email: 'marco.verdi@email.com',
    phone: '+39 339 9876543',
    address: 'Via Milano 45, 20100 Milano',
    type: 'private',
    fiscalCode: 'VRDMRC85M12F205X',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    isActive: true,
    totalSpent: 1250.50,
    lastService: Timestamp.now(),
    notes: 'Cliente affidabile',
  };

  // Salva i dati di esempio
  await db.collection('users').doc(sampleUser.uid).set(sampleUser);
  await db.collection('users').doc(sampleMechanic.uid).set(sampleMechanic);
  await db.collection('vehicles').doc(sampleVehicle.id).set(sampleVehicle);
  await db.collection('customers').doc(sampleCustomer.id).set(sampleCustomer);

  console.log('✅ Dati di esempio creati');
}

if (require.main === module) {
  setupFirestore();
}
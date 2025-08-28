// =====================================================
// 5. SCRIPT INIZIALIZZAZIONE DATABASE
// =====================================================
// scripts/initializeFirestore.ts

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as serviceAccount from './serviceAccountKey.json';

const app = initializeApp({
  credential: cert(serviceAccount as any),
});

const db = getFirestore(app);

async function initializeCollections() {
  console.log('🚀 Inizializzazione database Firestore...\n');

  try {
    // 1. Crea collezioni con documenti di esempio
    const collections = [
      {
        name: 'vehicles',
        sampleDoc: {
          ownerId: 'sample_user_id',
          ownerName: 'Mario Rossi',
          make: 'BMW',
          model: 'Serie 3',
          year: 2021,
          vin: 'WBAWB72020P123456',
          licensePlate: 'AB123CD',
          mileage: 35000,
          fuel: 'diesel',
          transmission: 'automatico',
          color: 'Nero Metallizzato',
          engineSize: 1995,
          power: 190,
          bodyType: 'berlina',
          doors: 4,
          seats: 5,
          optionals: [
            'Navigatore satellitare',
            'Sedili in pelle',
            'Sensori di parcheggio',
            'Cruise control adattivo',
            'Apple CarPlay'
          ],
          images: [],
          privacySettings: {
            showPersonalInfo: true,
            showMileage: true,
            showMaintenanceHistory: true,
            showMaintenanceDetails: false,
            showCosts: false,
            showMechanics: false,
            showDocuments: false,
            showPhotos: true,
            allowDataTransfer: false,
            requirePinForTransfer: true
          },
          maintenanceCount: 0,
          documentsCount: 0,
          expensesTotal: 0,
          forSale: false,
          transferPending: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        name: 'maintenance_records',
        sampleDoc: {
          vehicleId: 'sample_vehicle_id',
          ownerId: 'sample_user_id',
          date: new Date('2024-10-15'),
          type: 'tagliando',
          description: 'Tagliando completo 30.000 km',
          mileage: 30000,
          cost: 350,
          laborCost: 150,
          partsCost: 200,
          workshopName: 'Officina BMW Service',
          workshopAddress: 'Via Roma 123, Milano',
          mechanicName: 'Luigi Bianchi',
          parts: [
            {
              name: 'Olio motore 5W-30',
              quantity: 5,
              unitPrice: 15,
              brand: 'Castrol'
            },
            {
              name: 'Filtro olio',
              quantity: 1,
              unitPrice: 25,
              brand: 'BMW Original'
            }
          ],
          notes: 'Sostituiti tutti i filtri. Controllo freni OK.',
          warranty: true,
          warrantyExpiry: new Date('2025-10-15'),
          nextServiceDate: new Date('2025-04-15'),
          nextServiceMileage: 45000,
          documents: [],
          isVisible: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        name: 'vehicle_transfers',
        sampleDoc: {
          vehicleId: 'sample_vehicle_id',
          sellerId: 'seller_user_id',
          sellerName: 'Mario Rossi',
          sellerEmail: 'mario@example.com',
          buyerName: 'Luigi Verdi',
          buyerEmail: 'luigi@example.com',
          transferPin: 'hashed_pin_here',
          pinAttempts: 0,
          maxPinAttempts: 5,
          transferData: {
            basicInfo: true,
            maintenanceHistory: true,
            documents: false,
            photos: true
          },
          status: 'pending',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          notificationsSent: {
            created: false,
            reminder: false,
            accepted: false,
            completed: false
          }
        }
      },
      {
        name: 'access_logs',
        sampleDoc: {
          userId: 'sample_user_id',
          vehicleId: 'sample_vehicle_id',
          action: 'view_profile',
          details: 'Visualizzazione profilo veicolo',
          platform: 'web',
          timestamp: new Date()
        }
      },
      {
        name: 'users',
        sampleDoc: {
          email: 'user@example.com',
          name: 'Mario Rossi',
          userType: 'user',
          phoneNumber: '+39 123 456 7890',
          address: 'Via Roma 123, Milano',
          settings: {
            theme: 'auto',
            language: 'it',
            notifications: {
              maintenance: true,
              expenses: true,
              documents: true,
              reminders: true
            }
          },
          createdAt: new Date(),
          lastLoginAt: new Date()
        }
      }
    ];

    // Crea ogni collezione
    for (const col of collections) {
      console.log(`📁 Creazione collezione: ${col.name}`);
      
      try {
        const docRef = db.collection(col.name).doc('_sample_');
        await docRef.set(col.sampleDoc);
        console.log(`✅ Collezione ${col.name} creata con successo`);
        
        // Elimina il documento di esempio
        await docRef.delete();
      } catch (error) {
        console.log(`⚠️ Collezione ${col.name} già esistente o errore:`, error);
      }
    }

    // 2. Crea indici composti
    console.log('\n📊 Creazione indici consigliati...');
    console.log(`
    Vai alla Firebase Console e crea questi indici composti:
    
    1. vehicles:
       - ownerId (ASC) + updatedAt (DESC)
       - transferPending (ASC) + createdAt (DESC)
    
    2. maintenance_records:
       - vehicleId (ASC) + date (DESC)
       - vehicleId (ASC) + type (ASC) + date (DESC)
       - ownerId (ASC) + nextServiceDate (ASC)
    
    3. vehicle_transfers:
       - buyerEmail (ASC) + status (ASC)
       - status (ASC) + expiresAt (ASC)
    
    4. access_logs:
       - userId (ASC) + timestamp (DESC)
       - vehicleId (ASC) + timestamp (DESC)
    `);

    console.log('\n✨ Inizializzazione completata!');

  } catch (error) {
    console.error('❌ Errore durante l\'inizializzazione:', error);
  }
}

// Esegui inizializzazione
initializeCollections().then(() => {
  process.exit(0);
});
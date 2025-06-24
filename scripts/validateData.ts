// scripts/validateData.ts - Validazione struttura database
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as serviceAccount from './serviceAccountKey.json';

const app = initializeApp({
  credential: cert(serviceAccount as any),
});

const db = getFirestore(app);

async function validateData() {
  console.log('🔍 Validando struttura database...\n');
  
  try {
    const expectedCollections = [
      'users', 'workshops', 'vehicles', 'maintenance_records',
      'invoices', 'fuel_records', 'expenses', 'documents',
      'reminders', 'reviews'
    ];
    
    console.log('📋 Controllo collezioni:');
    const results = [];
    
    for (const collectionName of expectedCollections) {
      try {
        const snapshot = await db.collection(collectionName).limit(1).get();
        const exists = !snapshot.empty;
        const status = exists ? '✅' : '❌';
        console.log(`${status} ${collectionName}: ${exists ? 'esistente' : 'non trovata'}`);
        results.push({ name: collectionName, exists, count: 0 });
      } catch (error) {
        console.log(`❌ ${collectionName}: errore di accesso`);
        results.push({ name: collectionName, exists: false, count: 0 });
      }
    }
    
    console.log('\n📊 Conteggio documenti:');
    for (const result of results) {
      if (result.exists) {
        try {
          const snapshot = await db.collection(result.name).get();
          result.count = snapshot.size;
          console.log(`${result.name}: ${result.count} documenti`);
        } catch (error) {
          console.log(`${result.name}: errore nel conteggio`);
        }
      }
    }
    
    // Controllo struttura documenti di esempio
    console.log('\n🔍 Controllo struttura documenti:');
    
    const usersSnapshot = await db.collection('users').limit(1).get();
    if (!usersSnapshot.empty) {
      const userData = usersSnapshot.docs[0].data();
      const requiredFields = ['email', 'name', 'userType', 'settings'];
      
      for (const field of requiredFields) {
        const hasField = field in userData;
        console.log(`${hasField ? '✅' : '❌'} users.${field}: ${hasField ? 'presente' : 'mancante'}`);
      }
    }
    
    const vehiclesSnapshot = await db.collection('vehicles').limit(1).get();
    if (!vehiclesSnapshot.empty) {
      const vehicleData = vehiclesSnapshot.docs[0].data();
      const requiredFields = ['make', 'model', 'year', 'ownerId'];
      
      for (const field of requiredFields) {
        const hasField = field in vehicleData;
        console.log(`${hasField ? '✅' : '❌'} vehicles.${field}: ${hasField ? 'presente' : 'mancante'}`);
      }
    }
    
    // Sommario finale
    const existingCollections = results.filter(r => r.exists).length;
    const totalDocuments = results.reduce((sum, r) => sum + r.count, 0);
    
    console.log('\n📈 Sommario:');
    console.log(`Collezioni esistenti: ${existingCollections}/${expectedCollections.length}`);
    console.log(`Documenti totali: ${totalDocuments}`);
    
    if (existingCollections === expectedCollections.length && totalDocuments > 0) {
      console.log('🎉 Database configurato correttamente!');
    } else if (existingCollections > 0) {
      console.log('⚠️  Setup parziale - esegui: npm run setup:firestore full');
    } else {
      console.log('❌ Database non configurato - esegui: npm run setup:firestore full');
    }
    
  } catch (error) {
    console.error('❌ Errore durante validazione:', error);
  }
  
  process.exit(0);
}

if (require.main === module) {
  validateData();
}
// scripts/clearDatabase.ts - Pulizia database (ATTENZIONE!)
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as serviceAccount from './serviceAccountKey.json';

const app = initializeApp({
  credential: cert(serviceAccount as any),
});

const db = getFirestore(app);

async function clearDatabase() {
  const confirm = process.argv[2];
  
  if (confirm !== '--confirm') {
    console.log('⚠️  ATTENZIONE: Questo comando cancellerà TUTTI i dati!');
    console.log('Per confermare: npm run db:clear -- --confirm');
    process.exit(1);
  }
  
  console.log('🗑️  Iniziando pulizia database...');
  console.log('⚠️  ULTIMA POSSIBILITÀ DI FERMARE (Ctrl+C)');
  
  // Attendi 5 secondi per permettere cancellazione
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    const collections = [
      'users', 'workshops', 'vehicles', 'maintenance_records',
      'invoices', 'fuel_records', 'expenses', 'documents',
      'reminders', 'reviews'
    ];
    
    for (const collectionName of collections) {
      console.log(`🗑️  Cancellando ${collectionName}...`);
      
      const snapshot = await db.collection(collectionName).get();
      const batch = db.batch();
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`  ✅ ${snapshot.size} documenti cancellati`);
    }
    
    console.log('\n🎉 Database pulito!');
    
  } catch (error) {
    console.error('❌ Errore durante pulizia:', error);
  }
  
  process.exit(0);
}

if (require.main === module) {
  clearDatabase();
}
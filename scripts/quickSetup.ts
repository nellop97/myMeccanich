import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as serviceAccount from './serviceAccountKey.json';

const app = initializeApp({
  credential: cert(serviceAccount as any),
});

const db = getFirestore(app);

async function quickSetup() {
  console.log('⚡ Quick setup in corso...');
  
  try {
    // Crea solo le collezioni essenziali per sviluppo rapido
    const essentialCollections = [
      'users', 
      'vehicles', 
      'maintenance_records', 
      'expenses',
      'fuel_records'
    ];
    
    for (const collectionName of essentialCollections) {
      // Crea documento temporaneo per inizializzare collezione
      const tempDoc = await db.collection(collectionName).add({ 
        _temp: true,
        _created: new Date().toISOString() 
      });
      
      // Elimina subito il documento temporaneo
      await tempDoc.delete();
      
      console.log(`✅ ${collectionName} inizializzata`);
    }
    
    console.log('\n🎉 Quick setup completato!');
    console.log('💡 Per dati di esempio esegui: npm run setup:firestore setup');
    
  } catch (error) {
    console.error('❌ Errore durante quick setup:', error);
  }
  
  process.exit(0);
}

if (require.main === module) {
  quickSetup();
}
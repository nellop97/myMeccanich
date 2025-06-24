// scripts/backupFirestore.ts - Backup database (opzionale)
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as serviceAccount from './serviceAccountKey.json';

const app = initializeApp({
  credential: cert(serviceAccount as any),
});

const db = getFirestore(app);

async function backupFirestore() {
  console.log('💾 Iniziando backup Firestore...');
  
  try {
    const collections = [
      'users', 'workshops', 'vehicles', 'maintenance_records',
      'invoices', 'fuel_records', 'expenses', 'documents',
      'reminders', 'reviews'
    ];
    
    const backupData: any = {};
    const timestamp = new Date().toISOString().split('T')[0];
    
    for (const collectionName of collections) {
      console.log(`📁 Backup ${collectionName}...`);
      const snapshot = await db.collection(collectionName).get();
      
      backupData[collectionName] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`  ✅ ${snapshot.size} documenti salvati`);
    }
    
    // Crea cartella backup se non esiste
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    // Salva backup
    const backupFile = path.join(backupDir, `firestore-backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`\n🎉 Backup completato: ${backupFile}`);
    console.log(`📊 Collezioni: ${Object.keys(backupData).length}`);
    console.log(`📄 Documenti totali: ${Object.values(backupData).reduce((sum: number, docs: any) => sum + docs.length, 0)}`);
    
  } catch (error) {
    console.error('❌ Errore durante backup:', error);
  }
  
  process.exit(0);
}

if (require.main === module) {
  backupFirestore();
}
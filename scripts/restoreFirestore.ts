// scripts/restoreFirestore.ts - Ripristino da backup
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as serviceAccount from './serviceAccountKey.json';

const app = initializeApp({
  credential: cert(serviceAccount as any),
});

const db = getFirestore(app);

async function restoreFirestore() {
  const backupFile = process.argv[2];
  
  if (!backupFile) {
    console.log('❌ Specifica il file di backup: npm run db:restore backup-file.json');
    process.exit(1);
  }
  
  console.log(`🔄 Ripristinando da: ${backupFile}`);
  
  try {
    const backupPath = path.join(__dirname, 'backups', backupFile);
    
    if (!fs.existsSync(backupPath)) {
      console.log(`❌ File non trovato: ${backupPath}`);
      process.exit(1);
    }
    
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    for (const [collectionName, documents] of Object.entries(backupData)) {
      console.log(`📁 Ripristinando ${collectionName}...`);
      
      const docs = documents as any[];
      for (const doc of docs) {
        const { id, ...data } = doc;
        await db.collection(collectionName).doc(id).set(data);
      }
      
      console.log(`  ✅ ${docs.length} documenti ripristinati`);
    }
    
    console.log('\n🎉 Ripristino completato!');
    
  } catch (error) {
    console.error('❌ Errore durante ripristino:', error);
  }
  
  process.exit(0);
}

if (require.main === module) {
  restoreFirestore();
}
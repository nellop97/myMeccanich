// scripts/migrateData.ts - Migrazione dati per aggiornamenti schema
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as serviceAccount from './serviceAccountKey.json';

const app = initializeApp({
  credential: cert(serviceAccount as any),
});

const db = getFirestore(app);

async function migrateData() {
  console.log('🔄 Iniziando migrazione dati...');
  
  try {
    // Esempio: Aggiorna veicoli senza campo 'sharedWith'
    console.log('📁 Migrando veicoli...');
    const vehiclesSnapshot = await db.collection('vehicles').get();
    
    let migrated = 0;
    for (const doc of vehiclesSnapshot.docs) {
      const data = doc.data();
      
      const updates: any = {};
      
      // Aggiungi campo sharedWith se mancante
      if (!data.sharedWith) {
        updates.sharedWith = [];
      }
      
      // Aggiungi campo isActive se mancante
      if (data.isActive === undefined) {
        updates.isActive = true;
      }
      
      // Aggiungi updatedAt se mancante
      if (!data.updatedAt) {
        updates.updatedAt = FieldValue.serverTimestamp();
      }
      
      // Aggiorna solo se ci sono modifiche
      if (Object.keys(updates).length > 0) {
        await doc.ref.update(updates);
        migrated++;
        console.log(`  ✅ Veicolo ${doc.id} migrato`);
      }
    }
    
    console.log(`📊 Veicoli migrati: ${migrated}/${vehiclesSnapshot.size}`);
    
    // Esempio: Migra maintenance_records
    console.log('📁 Migrando maintenance records...');
    const maintenanceSnapshot = await db.collection('maintenance_records').get();
    
    migrated = 0;
    for (const doc of maintenanceSnapshot.docs) {
      const data = doc.data();
      const updates: any = {};
      
      // Aggiungi campo priority se mancante
      if (!data.priority) {
        updates.priority = 'medium';
      }
      
      // Converti date string in Timestamp se necessario
      if (data.completedDate && typeof data.completedDate === 'string') {
        updates.completedDate = new Date(data.completedDate);
      }
      
      if (Object.keys(updates).length > 0) {
        await doc.ref.update(updates);
        migrated++;
        console.log(`  ✅ Record manutenzione ${doc.id} migrato`);
      }
    }
    
    console.log(`📊 Record manutenzione migrati: ${migrated}/${maintenanceSnapshot.size}`);
    
    // Esempio: Migra utenti
    console.log('📁 Migrando utenti...');
    const usersSnapshot = await db.collection('users').get();
    
    migrated = 0;
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      const updates: any = {};
      
      // Aggiungi settings di default se mancanti
      if (!data.settings) {
        updates.settings = {
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
        };
      }
      
      // Aggiungi isActive se mancante
      if (data.isActive === undefined) {
        updates.isActive = true;
      }
      
      if (Object.keys(updates).length > 0) {
        await doc.ref.update(updates);
        migrated++;
        console.log(`  ✅ Utente ${doc.id} migrato`);
      }
    }
    
    console.log(`📊 Utenti migrati: ${migrated}/${usersSnapshot.size}`);
    
    console.log('\n🎉 Migrazione completata!');
    
  } catch (error) {
    console.error('❌ Errore durante migrazione:', error);
  }
  
  process.exit(0);
}

if (require.main === module) {
  migrateData();
}
// =====================================================
// 3. SERVIZIO MANUTENZIONE
// =====================================================
// src/services/MaintenanceService.ts

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { MaintenanceRecord, MaintenancePart } from '../types/database.types';
import { SecurityService } from '../security/SecurityService';

export class MaintenanceService {
  private static instance: MaintenanceService;
  private maintenanceCollection = 'maintenance_records';
  private security = SecurityService.getInstance();

  private constructor() {}

  static getInstance(): MaintenanceService {
    if (!MaintenanceService.instance) {
      MaintenanceService.instance = new MaintenanceService();
    }
    return MaintenanceService.instance;
  }

  // Ottieni storico manutenzione di un veicolo
  async getVehicleMaintenanceHistory(
    vehicleId: string,
    userId: string
  ): Promise<MaintenanceRecord[]> {
    try {
      console.log('🔍 Getting maintenance history for vehicleId:', vehicleId);
      console.log('🔍 User ID:', userId);

      // Log accesso
      await this.security.logDataAccess(userId, vehicleId, 'view_maintenance');

      // Prima prova una query semplice senza orderBy per vedere se ci sono record
      const simpleQuery = query(
        collection(db, this.maintenanceCollection),
        where('vehicleId', '==', vehicleId),
        where('isVisible', '==', true)
      );

      console.log('🔍 Executing simple query without orderBy...');
      const simpleSnapshot = await getDocs(simpleQuery);
      console.log('📊 Simple query found', simpleSnapshot.size, 'records');

      if (simpleSnapshot.size === 0) {
        console.warn('⚠️ No records found for vehicleId:', vehicleId);
        console.log('💡 Check if records exist with vehicleId:', vehicleId);

        // Query per vedere TUTTI i record senza filtri
        const allRecordsQuery = query(
          collection(db, this.maintenanceCollection),
          limit(10)
        );
        const allSnapshot = await getDocs(allRecordsQuery);
        console.log('📊 Total records in collection:', allSnapshot.size);

        if (allSnapshot.size > 0) {
          console.log('📋 Sample records:');
          allSnapshot.docs.slice(0, 3).forEach(doc => {
            const data = doc.data();
            console.log(`  - ID: ${doc.id}, vehicleId: ${data.vehicleId}, isVisible: ${data.isVisible}`);
          });
        }

        return [];
      }

      // Se ci sono record, prova con orderBy
      try {
        console.log('🔍 Executing query with orderBy...');
        const q = query(
          collection(db, this.maintenanceCollection),
          where('vehicleId', '==', vehicleId),
          where('isVisible', '==', true),
          orderBy('date', 'desc')
        );

        const querySnapshot = await getDocs(q);
        console.log('✅ Query with orderBy successful, found', querySnapshot.size, 'records');

        return querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            nextServiceDate: data.nextServiceDate?.toDate(),
            warrantyExpiry: data.warrantyExpiry?.toDate()
          } as MaintenanceRecord;
        });
      } catch (orderByError: any) {
        console.error('❌ Query with orderBy failed:', orderByError.message);

        if (orderByError.message?.includes('index')) {
          console.error('🔴 MISSING INDEX! You need to create a composite index in Firestore.');
          console.error('🔗 Index URL should be in the error message above.');
          console.error('📝 Required index: vehicleId (Ascending) + isVisible (Ascending) + date (Descending)');
        }

        // Fallback: restituisci i record senza ordinamento
        console.log('⚠️ Returning unordered records as fallback');
        return simpleSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            nextServiceDate: data.nextServiceDate?.toDate(),
            warrantyExpiry: data.warrantyExpiry?.toDate()
          } as MaintenanceRecord;
        }).sort((a, b) => {
          // Ordina localmente per data
          return b.date.getTime() - a.date.getTime();
        });
      }
    } catch (error: any) {
      console.error('❌ Error getting maintenance history:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      throw error;
    }
  }

  // Helper per pulire i dati prima dell'invio a Firestore
  private sanitizeData(data: any): any {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(data)) {
      // Salta campi undefined
      if (value === undefined) continue;

      // Salta campi null (opzionale, dipende dalla logica)
      // if (value === null) continue;

      // Salta campi NaN
      if (typeof value === 'number' && isNaN(value)) continue;

      // Salta campi Infinity
      if (value === Infinity || value === -Infinity) continue;

      // Gestisci array
      if (Array.isArray(value)) {
        // Salta array vuoti per campi opzionali (parts, documents)
        if (value.length === 0 && (key === 'parts' || key === 'documents')) {
          continue;
        }
        // Sanitizza ogni elemento dell'array
        const cleanedArray = value
          .map(item => typeof item === 'object' && item !== null ? this.sanitizeData(item) : item)
          .filter(item => item !== undefined && item !== null);

        if (cleanedArray.length > 0) {
          sanitized[key] = cleanedArray;
        }
      }
      // Gestisci Timestamp di Firebase (lascialo com'è)
      else if (value && typeof value === 'object' &&
               (value.constructor?.name === 'Timestamp' ||
                value.toDate !== undefined ||
                value.seconds !== undefined)) {
        sanitized[key] = value;
      }
      // Gestisci oggetti nested
      else if (value && typeof value === 'object') {
        const cleaned = this.sanitizeData(value);
        // Solo se l'oggetto pulito ha almeno una proprietà
        if (Object.keys(cleaned).length > 0) {
          sanitized[key] = cleaned;
        }
      }
      // Gestisci stringhe vuote (opzionale)
      else if (typeof value === 'string' && value.trim() === '') {
        continue; // Salta stringhe vuote
      }
      // Aggiungi valore valido
      else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  // Aggiungi record manutenzione
  async addMaintenanceRecord(
    record: Omit<MaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const docRef = doc(collection(db, this.maintenanceCollection));

      console.log('=== MAINTENANCE RECORD DEBUG ===');
      console.log('Original record:', JSON.stringify(record, null, 2));

      // Pulisci i dati prima dell'invio
      const cleanedRecord = this.sanitizeData(record);

      console.log('Cleaned record:', JSON.stringify(cleanedRecord, null, 2));

      const maintenanceRecord = {
        ...cleanedRecord,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isVisible: true
      };

      // Log dettagliato di ogni campo
      Object.entries(maintenanceRecord).forEach(([key, value]) => {
        console.log(`Field "${key}":`, typeof value, value);
      });

      console.log('Final record to Firestore:', maintenanceRecord);
      console.log('=== END DEBUG ===');

      console.log('Calling setDoc with docId:', docRef.id);

      // TEST: Prova con dati minimali
      const minimalRecord = {
        vehicleId: cleanedRecord.vehicleId,
        ownerId: cleanedRecord.ownerId,
        type: cleanedRecord.type,
        description: cleanedRecord.description,
        date: cleanedRecord.date,
        mileage: cleanedRecord.mileage,
        cost: cleanedRecord.cost || 0,
        warranty: cleanedRecord.warranty || false,
        isVisible: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log('MINIMAL RECORD TEST:', minimalRecord);

      try {
        await setDoc(docRef, minimalRecord);
        console.log('✅ setDoc with minimal record completed successfully!');
      } catch (setDocError: any) {
        console.error('❌ setDoc failed with minimal record');
        console.error('Error:', setDocError);
        console.error('Error code:', setDocError?.code);
        console.error('Error message:', setDocError?.message);

        // Prova con Timestamp invece di serverTimestamp
        console.log('Trying with Timestamp.now() instead of serverTimestamp...');
        const withTimestamp = {
          ...minimalRecord,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        await setDoc(docRef, withTimestamp);
        console.log('✅ Worked with Timestamp.now()!');
      }

      // Aggiorna contatore manutenzioni del veicolo
      // TEMPORANEAMENTE COMMENTATO PER DEBUG
      try {
        console.log('Updating vehicle maintenance count...');
        await this.updateVehicleMaintenanceCount(record.vehicleId);
        console.log('✅ Vehicle maintenance count updated!');
      } catch (countError) {
        console.warn('⚠️ Failed to update maintenance count, but record was saved:', countError);
        // Non bloccare il salvataggio se il contatore fallisce
      }

      return docRef.id;
    } catch (error: any) {
      console.error('=== FIRESTORE ERROR ===');
      console.error('Error adding maintenance record:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('=== END ERROR ===');
      throw error;
    }
  }

  // Aggiorna record manutenzione
  async updateMaintenanceRecord(
    recordId: string,
    updates: Partial<MaintenanceRecord>
  ): Promise<void> {
    try {
      const docRef = doc(db, this.maintenanceCollection, recordId);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating maintenance record:', error);
      throw error;
    }
  }

  // Filtra manutenzioni per tipo
  async filterMaintenanceByType(
    vehicleId: string,
    type: MaintenanceRecord['type']
  ): Promise<MaintenanceRecord[]> {
    try {
      const q = query(
        collection(db, this.maintenanceCollection),
        where('vehicleId', '==', vehicleId),
        where('type', '==', type),
        where('isVisible', '==', true),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as MaintenanceRecord;
      });
    } catch (error) {
      console.error('Error filtering maintenance:', error);
      throw error;
    }
  }

  // Cerca manutenzioni per testo
  async searchMaintenance(
    vehicleId: string,
    searchText: string
  ): Promise<MaintenanceRecord[]> {
    try {
      // Prima ottieni tutti i record del veicolo
      const all = await this.getVehicleMaintenanceHistory(vehicleId, 'search');
      
      // Poi filtra localmente (Firestore non supporta full-text search nativo)
      const searchLower = searchText.toLowerCase();
      
      return all.filter(record => 
        record.description.toLowerCase().includes(searchLower) ||
        record.workshopName?.toLowerCase().includes(searchLower) ||
        record.mechanicName?.toLowerCase().includes(searchLower) ||
        record.parts.some(part => 
          part.name.toLowerCase().includes(searchLower)
        )
      );
    } catch (error) {
      console.error('Error searching maintenance:', error);
      throw error;
    }
  }

  // Ottieni prossime manutenzioni
  async getUpcomingMaintenance(userId: string): Promise<MaintenanceRecord[]> {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const q = query(
        collection(db, this.maintenanceCollection),
        where('ownerId', '==', userId),
        where('nextServiceDate', '<=', Timestamp.fromDate(thirtyDaysFromNow)),
        where('nextServiceDate', '>=', Timestamp.now()),
        orderBy('nextServiceDate', 'asc')
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate(),
          nextServiceDate: data.nextServiceDate?.toDate()
        } as MaintenanceRecord;
      });
    } catch (error) {
      console.error('Error getting upcoming maintenance:', error);
      throw error;
    }
  }

  // Calcola statistiche manutenzione
  async getMaintenanceStats(vehicleId: string): Promise<{
    totalCount: number;
    totalCost: number;
    byType: Record<string, number>;
    lastMaintenance?: Date;
    nextMaintenance?: Date;
  }> {
    try {
      const records = await this.getVehicleMaintenanceHistory(vehicleId, 'stats');
      
      const stats = {
        totalCount: records.length,
        totalCost: 0,
        byType: {} as Record<string, number>,
        lastMaintenance: undefined as Date | undefined,
        nextMaintenance: undefined as Date | undefined
      };

      records.forEach(record => {
        // Somma costi
        if (record.cost) {
          stats.totalCost += record.cost;
        }

        // Conta per tipo
        if (!stats.byType[record.type]) {
          stats.byType[record.type] = 0;
        }
        stats.byType[record.type]++;

        // Trova ultima manutenzione
        if (!stats.lastMaintenance || record.date > stats.lastMaintenance) {
          stats.lastMaintenance = record.date;
        }

        // Trova prossima manutenzione
        if (record.nextServiceDate) {
          const now = new Date();
          if (record.nextServiceDate > now) {
            if (!stats.nextMaintenance || record.nextServiceDate < stats.nextMaintenance) {
              stats.nextMaintenance = record.nextServiceDate;
            }
          }
        }
      });

      return stats;
    } catch (error) {
      console.error('Error calculating stats:', error);
      throw error;
    }
  }

  // Aggiorna contatore manutenzioni del veicolo
  private async updateVehicleMaintenanceCount(vehicleId: string): Promise<void> {
    try {
      const records = await this.getVehicleMaintenanceHistory(vehicleId, 'system');

      const vehicleRef = doc(db, 'vehicles', vehicleId);

      // Prepara i dati da aggiornare
      const updateData: any = {
        maintenanceCount: records.length,
        updatedAt: serverTimestamp()
      };

      // Solo se ci sono record, aggiungi la data dell'ultima manutenzione
      if (records.length > 0 && records[0]?.date) {
        // Converti Date in Timestamp di Firebase
        updateData.lastMaintenanceDate = Timestamp.fromDate(records[0].date);
      }

      console.log('Updating vehicle with data:', updateData);
      await updateDoc(vehicleRef, updateData);
      console.log('✅ Vehicle maintenance count updated successfully');
    } catch (error) {
      console.error('❌ Error updating vehicle maintenance count:', error);
      // Non bloccare il flusso, solo logga l'errore
    }
  }
}
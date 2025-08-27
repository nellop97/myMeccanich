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
import { SecurityService } from './SecurityService';

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
      // Log accesso
      await this.security.logDataAccess(userId, vehicleId, 'view_maintenance');

      const q = query(
        collection(db, this.maintenanceCollection),
        where('vehicleId', '==', vehicleId),
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
          updatedAt: data.updatedAt?.toDate(),
          nextServiceDate: data.nextServiceDate?.toDate(),
          warrantyExpiry: data.warrantyExpiry?.toDate()
        } as MaintenanceRecord;
      });
    } catch (error) {
      console.error('Error getting maintenance history:', error);
      throw error;
    }
  }

  // Aggiungi record manutenzione
  async addMaintenanceRecord(
    record: Omit<MaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const docRef = doc(collection(db, this.maintenanceCollection));
      
      const maintenanceRecord = {
        ...record,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isVisible: true
      };

      await setDoc(docRef, maintenanceRecord);

      // Aggiorna contatore manutenzioni del veicolo
      await this.updateVehicleMaintenanceCount(record.vehicleId);

      return docRef.id;
    } catch (error) {
      console.error('Error adding maintenance record:', error);
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
      await updateDoc(vehicleRef, {
        maintenanceCount: records.length,
        lastMaintenanceDate: records[0]?.date || null,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating vehicle maintenance count:', error);
    }
  }
}
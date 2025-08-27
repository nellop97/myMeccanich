// =====================================================
// 4. SERVIZIO TRASFERIMENTO PROPRIETÀ
// =====================================================
// src/services/TransferService.ts

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { VehicleTransfer } from '../types/database.types';
import * as Crypto from 'expo-crypto';
import emailjs from '@emailjs/browser';

export class TransferService {
  private static instance: TransferService;
  private transfersCollection = 'vehicle_transfers';
  private maxPinAttempts = 5;
  private transferValidityDays = 30;

  private constructor() {
    // Inizializza EmailJS
    emailjs.init('firebase-adminsdk-fbsvc@mymecanich.iam.gserviceaccount.com');
  }

  static getInstance(): TransferService {
    if (!TransferService.instance) {
      TransferService.instance = new TransferService();
    }
    return TransferService.instance;
  }

  // Crea nuovo trasferimento
  async createTransfer(
    vehicleId: string,
    sellerId: string,
    sellerName: string,
    sellerEmail: string,
    buyerData: {
      name: string;
      email: string;
      phone?: string;
    },
    transferData: VehicleTransfer['transferData'],
    pin: string
  ): Promise<string> {
    try {
      // Hash del PIN
      const hashedPin = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pin
      );

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.transferValidityDays);

      const docRef = doc(collection(db, this.transfersCollection));
      
      const transfer: Omit<VehicleTransfer, 'id'> = {
        vehicleId,
        sellerId,
        sellerName,
        sellerEmail,
        buyerName: buyerData.name,
        buyerEmail: buyerData.email,
        buyerPhone: buyerData.phone,
        transferPin: hashedPin,
        pinAttempts: 0,
        maxPinAttempts: this.maxPinAttempts,
        transferData,
        status: 'pending',
        createdAt: new Date(),
        expiresAt,
        notificationsSent: {
          created: false,
          reminder: false,
          accepted: false,
          completed: false
        }
      };

      await setDoc(docRef, {
        ...transfer,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt)
      });

      // Invia email al compratore
      await this.sendTransferNotification(docRef.id, buyerData.email, buyerData.name);

      // Aggiorna stato veicolo
      await this.updateVehicleTransferStatus(vehicleId, true, buyerData.email);

      return docRef.id;
    } catch (error) {
      console.error('Error creating transfer:', error);
      throw error;
    }
  }

  // Verifica PIN trasferimento
  async verifyTransferPin(
    transferId: string,
    pin: string
  ): Promise<{ success: boolean; attemptsRemaining?: number }> {
    try {
      const docRef = doc(db, this.transfersCollection, transferId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return { success: false };
      }

      const transfer = docSnap.data() as VehicleTransfer;

      // Controlla se scaduto
      if (transfer.expiresAt.toDate() < new Date()) {
        await this.cancelTransfer(transferId, 'expired');
        return { success: false };
      }

      // Controlla tentativi
      if (transfer.pinAttempts >= transfer.maxPinAttempts) {
        await this.cancelTransfer(transferId, 'max_attempts');
        return { success: false };
      }

      // Verifica PIN
      const hashedPin = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pin
      );

      if (hashedPin === transfer.transferPin) {
        // PIN corretto - accetta trasferimento
        await this.acceptTransfer(transferId);
        return { success: true };
      } else {
        // PIN errato - incrementa tentativi
        const newAttempts = transfer.pinAttempts + 1;
        await updateDoc(docRef, {
          pinAttempts: newAttempts
        });

        return {
          success: false,
          attemptsRemaining: transfer.maxPinAttempts - newAttempts
        };
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      throw error;
    }
  }

  // Accetta trasferimento
  private async acceptTransfer(transferId: string): Promise<void> {
    try {
      const docRef = doc(db, this.transfersCollection, transferId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return;

      const transfer = docSnap.data() as VehicleTransfer;

      // Aggiorna stato trasferimento
      await updateDoc(docRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      });

      // Trasferisci dati selezionati
      await this.transferVehicleData(transfer);

      // Invia notifiche
      await this.sendAcceptanceNotification(
        transfer.sellerEmail,
        transfer.buyerEmail
      );
    } catch (error) {
      console.error('Error accepting transfer:', error);
      throw error;
    }
  }

  // Trasferisci dati veicolo
  private async transferVehicleData(transfer: VehicleTransfer): Promise<void> {
    try {
      const vehicleRef = doc(db, 'vehicles', transfer.vehicleId);
      const vehicleSnap = await getDoc(vehicleRef);

      if (!vehicleSnap.exists()) return;

      const vehicle = vehicleSnap.data();
      const updates: any = {
        ownerId: transfer.buyerEmail, // Usa email come ID temporaneo
        ownerName: transfer.buyerName,
        transferPending: false,
        transferToEmail: null,
        updatedAt: serverTimestamp()
      };

      // Applica privacy settings in base ai dati trasferiti
      if (!transfer.transferData.maintenanceHistory) {
        updates.maintenanceCount = 0;
        updates.lastMaintenanceDate = null;
      }

      if (!transfer.transferData.documents) {
        updates.documentsCount = 0;
      }

      if (!transfer.transferData.photos) {
        updates.images = [];
        updates.mainImageUrl = null;
      }

      await updateDoc(vehicleRef, updates);

      // Nascondi/trasferisci manutenzioni
      if (transfer.transferData.maintenanceHistory) {
        await this.transferMaintenanceRecords(
          transfer.vehicleId,
          transfer.buyerEmail,
          !transfer.transferData.maintenanceDetails
        );
      }

      // Completa trasferimento
      await updateDoc(doc(db, this.transfersCollection, transfer.id), {
        status: 'completed',
        completedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error transferring vehicle data:', error);
      throw error;
    }
  }

  // Trasferisci record manutenzione
  private async transferMaintenanceRecords(
    vehicleId: string,
    newOwnerId: string,
    hideCosts: boolean
  ): Promise<void> {
    try {
      const q = query(
        collection(db, 'maintenance_records'),
        where('vehicleId', '==', vehicleId)
      );

      const querySnapshot = await getDocs(q);

      const batch = [];
      for (const doc of querySnapshot.docs) {
        const updates: any = {
          ownerId: newOwnerId,
          updatedAt: serverTimestamp()
        };

        if (hideCosts) {
          updates.cost = null;
          updates.laborCost = null;
          updates.partsCost = null;
          updates.mechanicName = null;
          updates.mechanicPhone = null;
        }

        batch.push(updateDoc(doc.ref, updates));
      }

      await Promise.all(batch);
    } catch (error) {
      console.error('Error transferring maintenance records:', error);
      throw error;
    }
  }

  // Cancella trasferimento
  async cancelTransfer(
    transferId: string,
    reason: 'expired' | 'cancelled' | 'max_attempts'
  ): Promise<void> {
    try {
      const docRef = doc(db, this.transfersCollection, transferId);
      
      await updateDoc(docRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancelReason: reason
      });

      // Ripristina stato veicolo
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const transfer = docSnap.data() as VehicleTransfer;
        await this.updateVehicleTransferStatus(transfer.vehicleId, false, null);
      }
    } catch (error) {
      console.error('Error cancelling transfer:', error);
      throw error;
    }
  }

  // Aggiorna stato trasferimento veicolo
  private async updateVehicleTransferStatus(
    vehicleId: string,
    pending: boolean,
    buyerEmail: string | null
  ): Promise<void> {
    try {
      const vehicleRef = doc(db, 'vehicles', vehicleId);
      
      await updateDoc(vehicleRef, {
        transferPending: pending,
        transferToEmail: buyerEmail,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating vehicle transfer status:', error);
      throw error;
    }
  }

  // Invia notifica email trasferimento
  private async sendTransferNotification(
    transferId: string,
    buyerEmail: string,
    buyerName: string
  ): Promise<void> {
    try {
      // Usa EmailJS o altro servizio email
      await emailjs.send('service_id', 'template_id', {
        to_email: buyerEmail,
        to_name: buyerName,
        transfer_link: `https://yourapp.com/accept-transfer/${transferId}`,
        expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
      });

      // Aggiorna flag notifica
      await updateDoc(doc(db, this.transfersCollection, transferId), {
        'notificationsSent.created': true
      });
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  // Invia notifica accettazione
  private async sendAcceptanceNotification(
    sellerEmail: string,
    buyerEmail: string
  ): Promise<void> {
    try {
      // Notifica al venditore
      await emailjs.send('service_id', 'template_acceptance', {
        to_email: sellerEmail,
        buyer_email: buyerEmail
      });

      // Notifica al compratore
      await emailjs.send('service_id', 'template_welcome', {
        to_email: buyerEmail
      });
    } catch (error) {
      console.error('Error sending acceptance notification:', error);
    }
  }

  // Ottieni trasferimenti attivi per un utente
  async getActiveTransfers(userEmail: string): Promise<VehicleTransfer[]> {
    try {
      const q = query(
        collection(db, this.transfersCollection),
        where('buyerEmail', '==', userEmail),
        where('status', '==', 'pending')
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VehicleTransfer));
    } catch (error) {
      console.error('Error getting active transfers:', error);
      throw error;
    }
  }

  // Controlla trasferimenti scaduti
  async checkExpiredTransfers(): Promise<void> {
    try {
      const q = query(
        collection(db, this.transfersCollection),
        where('status', '==', 'pending'),
        where('expiresAt', '<=', Timestamp.now())
      );

      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        await this.cancelTransfer(doc.id, 'expired');
      }
    } catch (error) {
      console.error('Error checking expired transfers:', error);
    }
  }
}
// =====================================================
// VEHICLE VIEW REQUEST SERVICE
// Gestisce le richieste di visualizzazione dati veicolo
// =====================================================

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
  Timestamp,
  addDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import * as Crypto from 'expo-crypto';

export interface VehicleViewRequest {
  id: string;
  vehicleId: string;

  // Proprietario del veicolo
  ownerId: string;
  ownerName: string;
  ownerEmail: string;

  // Richiedente (acquirente potenziale)
  requesterId?: string; // null se non ancora registrato
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;

  // Informazioni veicolo
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };

  // Messaggio/motivazione
  message?: string;

  // Sicurezza e validazione
  accessCode: string; // Codice univoco per accesso
  expiresAt: Date;
  maxViews: number;
  viewsCount: number;

  // Dati visibili (impostati dal proprietario)
  visibleData: {
    basicInfo: boolean;
    maintenanceHistory: boolean;
    maintenanceDetails: boolean; // Include costi
    documents: boolean;
    photos: boolean;
  };

  // Stato
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'revoked';

  // Date
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  lastViewedAt?: Date;

  // Notifiche
  notificationsSent: {
    requestCreated: boolean;
    requestApproved: boolean;
    requestRejected: boolean;
    expirationWarning: boolean;
  };
}

export class VehicleViewRequestService {
  private static instance: VehicleViewRequestService;
  private viewRequestsCollection = 'vehicle_view_requests';
  private viewAccessLogsCollection = 'vehicle_view_logs';
  private defaultExpiryDays = 7; // 7 giorni di validità
  private defaultMaxViews = 10; // Massimo 10 visualizzazioni

  private constructor() {}

  static getInstance(): VehicleViewRequestService {
    if (!VehicleViewRequestService.instance) {
      VehicleViewRequestService.instance = new VehicleViewRequestService();
    }
    return VehicleViewRequestService.instance;
  }

  /**
   * Crea una nuova richiesta di visualizzazione
   */
  async createViewRequest(
    vehicleId: string,
    requesterData: {
      name: string;
      email: string;
      phone?: string;
      message?: string;
    }
  ): Promise<string> {
    try {
      // Recupera informazioni veicolo
      const vehicleRef = doc(db, 'vehicles', vehicleId);
      const vehicleSnap = await getDoc(vehicleRef);

      if (!vehicleSnap.exists()) {
        throw new Error('Veicolo non trovato');
      }

      const vehicle = vehicleSnap.data();

      // Genera codice di accesso univoco
      const accessCode = await this.generateAccessCode();

      // Calcola data di scadenza
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.defaultExpiryDays);

      const docRef = doc(collection(db, this.viewRequestsCollection));

      const viewRequest: Omit<VehicleViewRequest, 'id'> = {
        vehicleId,
        ownerId: vehicle.ownerId,
        ownerName: vehicle.ownerName || 'Proprietario',
        ownerEmail: vehicle.ownerEmail || '',
        requesterName: requesterData.name,
        requesterEmail: requesterData.email.toLowerCase(),
        requesterPhone: requesterData.phone,
        vehicleInfo: {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          licensePlate: vehicle.licensePlate
        },
        message: requesterData.message,
        accessCode,
        expiresAt,
        maxViews: this.defaultMaxViews,
        viewsCount: 0,
        visibleData: {
          basicInfo: true, // Sempre visibili
          maintenanceHistory: false,
          maintenanceDetails: false,
          documents: false,
          photos: true
        },
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        notificationsSent: {
          requestCreated: false,
          requestApproved: false,
          requestRejected: false,
          expirationWarning: false
        }
      };

      await setDoc(docRef, viewRequest);

      // Invia notifica al proprietario
      await this.notifyOwner(docRef.id, vehicle.ownerId, requesterData.name);

      return docRef.id;
    } catch (error) {
      console.error('Error creating view request:', error);
      throw error;
    }
  }

  /**
   * Approva una richiesta di visualizzazione
   */
  async approveViewRequest(
    requestId: string,
    visibleData: VehicleViewRequest['visibleData']
  ): Promise<void> {
    try {
      const docRef = doc(db, this.viewRequestsCollection, requestId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Richiesta non trovata');
      }

      const request = docSnap.data() as VehicleViewRequest;

      // Verifica che non sia scaduta
      if (request.expiresAt.toDate() < new Date()) {
        throw new Error('Richiesta scaduta');
      }

      await updateDoc(docRef, {
        status: 'approved',
        visibleData,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Invia notifica al richiedente
      await this.notifyRequester(requestId, request.requesterEmail, 'approved');

      // Log dell'approvazione
      await this.logViewAccess(requestId, request.ownerId, 'approved');
    } catch (error) {
      console.error('Error approving view request:', error);
      throw error;
    }
  }

  /**
   * Rifiuta una richiesta di visualizzazione
   */
  async rejectViewRequest(requestId: string, reason?: string): Promise<void> {
    try {
      const docRef = doc(db, this.viewRequestsCollection, requestId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Richiesta non trovata');
      }

      const request = docSnap.data() as VehicleViewRequest;

      await updateDoc(docRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        rejectionReason: reason || 'Rifiutata dal proprietario'
      });

      // Invia notifica al richiedente
      await this.notifyRequester(requestId, request.requesterEmail, 'rejected');

      // Log del rifiuto
      await this.logViewAccess(requestId, request.ownerId, 'rejected');
    } catch (error) {
      console.error('Error rejecting view request:', error);
      throw error;
    }
  }

  /**
   * Revoca una richiesta approvata
   */
  async revokeViewRequest(requestId: string): Promise<void> {
    try {
      const docRef = doc(db, this.viewRequestsCollection, requestId);

      await updateDoc(docRef, {
        status: 'revoked',
        updatedAt: serverTimestamp()
      });

      // Log della revoca
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const request = docSnap.data() as VehicleViewRequest;
        await this.logViewAccess(requestId, request.ownerId, 'revoked');
      }
    } catch (error) {
      console.error('Error revoking view request:', error);
      throw error;
    }
  }

  /**
   * Ottiene i dati del veicolo per una richiesta approvata
   */
  async getVehicleDataForRequest(requestId: string, userEmail: string): Promise<any> {
    try {
      const docRef = doc(db, this.viewRequestsCollection, requestId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Richiesta non trovata');
      }

      const request = docSnap.data() as VehicleViewRequest;

      // Verifica autorizzazione
      if (request.requesterEmail.toLowerCase() !== userEmail.toLowerCase()) {
        throw new Error('Non autorizzato ad accedere a questa richiesta');
      }

      // Verifica stato
      if (request.status !== 'approved') {
        throw new Error('Richiesta non approvata');
      }

      // Verifica scadenza
      if (request.expiresAt.toDate() < new Date()) {
        await updateDoc(docRef, { status: 'expired' });
        throw new Error('Richiesta scaduta');
      }

      // Verifica limite visualizzazioni
      if (request.viewsCount >= request.maxViews) {
        throw new Error('Limite visualizzazioni raggiunto');
      }

      // Recupera dati veicolo
      const vehicleRef = doc(db, 'vehicles', request.vehicleId);
      const vehicleSnap = await getDoc(vehicleRef);

      if (!vehicleSnap.exists()) {
        throw new Error('Veicolo non trovato');
      }

      const vehicle = vehicleSnap.data();
      const filteredData: any = {};

      // Filtra dati in base alle impostazioni
      if (request.visibleData.basicInfo) {
        filteredData.basicInfo = {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          licensePlate: vehicle.licensePlate,
          vin: vehicle.vin,
          color: vehicle.color,
          fuel: vehicle.fuel,
          transmission: vehicle.transmission,
          mileage: vehicle.mileage,
          engineSize: vehicle.engineSize,
          power: vehicle.power,
          bodyType: vehicle.bodyType,
          doors: vehicle.doors,
          seats: vehicle.seats
        };
      }

      if (request.visibleData.photos && vehicle.images) {
        filteredData.photos = vehicle.images;
      }

      // Recupera storico manutenzione se autorizzato
      if (request.visibleData.maintenanceHistory) {
        const maintenanceData = await this.getMaintenanceHistory(
          request.vehicleId,
          request.visibleData.maintenanceDetails
        );
        filteredData.maintenanceHistory = maintenanceData;
      }

      // Incrementa contatore visualizzazioni
      await updateDoc(docRef, {
        viewsCount: request.viewsCount + 1,
        lastViewedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Log dell'accesso
      await this.logViewAccess(requestId, userEmail, 'viewed');

      return {
        request,
        vehicleData: filteredData
      };
    } catch (error) {
      console.error('Error getting vehicle data:', error);
      throw error;
    }
  }

  /**
   * Ottiene le richieste in arrivo per un proprietario
   */
  async getIncomingRequests(ownerId: string): Promise<VehicleViewRequest[]> {
    try {
      const q = query(
        collection(db, this.viewRequestsCollection),
        where('ownerId', '==', ownerId),
        where('status', 'in', ['pending', 'approved']),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VehicleViewRequest));
    } catch (error) {
      console.error('Error getting incoming requests:', error);
      throw error;
    }
  }

  /**
   * Ottiene le richieste inviate da un utente
   */
  async getMyRequests(userEmail: string): Promise<VehicleViewRequest[]> {
    try {
      const q = query(
        collection(db, this.viewRequestsCollection),
        where('requesterEmail', '==', userEmail.toLowerCase()),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VehicleViewRequest));
    } catch (error) {
      console.error('Error getting my requests:', error);
      throw error;
    }
  }

  /**
   * Verifica se esiste già una richiesta pendente per un veicolo
   */
  async hasExistingRequest(vehicleId: string, userEmail: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, this.viewRequestsCollection),
        where('vehicleId', '==', vehicleId),
        where('requesterEmail', '==', userEmail.toLowerCase()),
        where('status', 'in', ['pending', 'approved'])
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking existing request:', error);
      return false;
    }
  }

  /**
   * Cerca un veicolo per targa
   */
  async findVehicleByPlate(licensePlate: string): Promise<any> {
    try {
      const q = query(
        collection(db, 'vehicles'),
        where('licensePlate', '==', licensePlate.toUpperCase().trim())
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error finding vehicle:', error);
      throw error;
    }
  }

  // =====================================================
  // METODI PRIVATI
  // =====================================================

  /**
   * Genera un codice di accesso univoco
   */
  private async generateAccessCode(): Promise<string> {
    const randomString = `${Date.now()}-${Math.random()}`;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      randomString
    );
    return hash.substring(0, 12).toUpperCase();
  }

  /**
   * Recupera lo storico manutenzione filtrato
   */
  private async getMaintenanceHistory(
    vehicleId: string,
    includeDetails: boolean
  ): Promise<any[]> {
    try {
      const q = query(
        collection(db, 'maintenance_records'),
        where('vehicleId', '==', vehicleId),
        where('isVisible', '==', true),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();

        if (!includeDetails) {
          // Nascondi costi e dettagli meccanico
          delete data.cost;
          delete data.laborCost;
          delete data.partsCost;
          delete data.mechanicName;
          delete data.mechanicPhone;
          delete data.workshopName;
          delete data.workshopAddress;
        }

        return {
          id: doc.id,
          ...data
        };
      });
    } catch (error) {
      console.error('Error getting maintenance history:', error);
      return [];
    }
  }

  /**
   * Log degli accessi
   */
  private async logViewAccess(
    requestId: string,
    userId: string,
    action: string
  ): Promise<void> {
    try {
      await addDoc(collection(db, this.viewAccessLogsCollection), {
        requestId,
        userId,
        action,
        timestamp: serverTimestamp(),
        platform: 'mobile' // Può essere 'web' o 'mobile'
      });
    } catch (error) {
      console.error('Error logging access:', error);
    }
  }

  /**
   * Notifica al proprietario (placeholder - implementare con servizio notifiche)
   */
  private async notifyOwner(
    requestId: string,
    ownerId: string,
    requesterName: string
  ): Promise<void> {
    try {
      // TODO: Implementare invio notifica push/email
      console.log(`Notifica inviata a ${ownerId}: ${requesterName} vuole vedere il tuo veicolo`);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Notifica al richiedente (placeholder)
   */
  private async notifyRequester(
    requestId: string,
    requesterEmail: string,
    status: 'approved' | 'rejected'
  ): Promise<void> {
    try {
      // TODO: Implementare invio notifica push/email
      const message = status === 'approved'
        ? 'La tua richiesta è stata approvata!'
        : 'La tua richiesta è stata rifiutata';
      console.log(`Notifica inviata a ${requesterEmail}: ${message}`);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Controlla richieste scadute (da eseguire periodicamente)
   */
  async checkExpiredRequests(): Promise<void> {
    try {
      const q = query(
        collection(db, this.viewRequestsCollection),
        where('status', 'in', ['pending', 'approved']),
        where('expiresAt', '<=', Timestamp.now())
      );

      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        await updateDoc(doc.ref, {
          status: 'expired',
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error checking expired requests:', error);
    }
  }
}

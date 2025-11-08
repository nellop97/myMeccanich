// src/services/InAppNotificationService.ts
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface InAppNotification {
  id: string;
  userId: string; // Email dell'utente destinatario
  type: 'transfer_request' | 'transfer_accepted' | 'reminder' | 'maintenance' | 'document' | 'booking';
  title: string;
  message: string;
  data?: {
    transferId?: string;
    transferPin?: string; // PIN in chiaro solo per notifiche
    vehicleId?: string;
    carInfo?: string;
    fromUser?: string;
    [key: string]: any;
  };
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionRequired?: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export class InAppNotificationService {
  private static instance: InAppNotificationService;
  private notificationsCollection = 'in_app_notifications';

  private constructor() {}

  static getInstance(): InAppNotificationService {
    if (!InAppNotificationService.instance) {
      InAppNotificationService.instance = new InAppNotificationService();
    }
    return InAppNotificationService.instance;
  }

  // Crea notifica trasferimento per il compratore
  async createTransferRequestNotification(
    buyerEmail: string,
    sellerName: string,
    transferId: string,
    transferPin: string, // PIN in chiaro
    carInfo?: string
  ): Promise<string> {
    try {
      const notifRef = doc(collection(db, this.notificationsCollection));

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Scade dopo 30 giorni

      // Crea notifica con tipi Firestore nativi
      const notificationData = {
        userId: buyerEmail,
        type: 'transfer_request' as const,
        title: '🚗 Richiesta di Trasferimento Veicolo',
        message: `${sellerName} vuole trasferire ${carInfo || 'un veicolo'} a te. Usa il PIN ricevuto via email per accettare.`,
        data: {
          transferId,
          transferPin, // Salvato per mostrarlo nella notifica
          fromUser: sellerName,
          carInfo: carInfo || 'Veicolo'
        },
        read: false,
        priority: 'high' as const,
        actionRequired: true,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt)
      };

      await setDoc(notifRef, notificationData);

      console.log('✅ Notifica in-app creata per:', buyerEmail);
      return notifRef.id;
    } catch (error) {
      console.error('❌ Errore creazione notifica:', error);
      throw error;
    }
  }

  // Crea notifica accettazione trasferimento per il venditore
  async createTransferAcceptedNotification(
    sellerEmail: string,
    buyerEmail: string,
    carInfo?: string
  ): Promise<string> {
    try {
      const notifRef = doc(collection(db, this.notificationsCollection));

      // Crea notifica con tipi Firestore nativi
      const notificationData = {
        userId: sellerEmail,
        type: 'transfer_accepted' as const,
        title: '🎉 Trasferimento Accettato',
        message: `${buyerEmail} ha accettato il trasferimento ${carInfo ? `di ${carInfo}` : 'del veicolo'}. Il trasferimento è stato completato.`,
        data: {
          fromUser: buyerEmail,
          carInfo: carInfo || 'Veicolo'
        },
        read: false,
        priority: 'high' as const,
        createdAt: serverTimestamp()
      };

      await setDoc(notifRef, notificationData);

      console.log('✅ Notifica accettazione creata per:', sellerEmail);
      return notifRef.id;
    } catch (error) {
      console.error('❌ Errore creazione notifica accettazione:', error);
      throw error;
    }
  }

  // Ottieni tutte le notifiche di un utente
  async getUserNotifications(userEmail: string): Promise<InAppNotification[]> {
    try {
      const q = query(
        collection(db, this.notificationsCollection),
        where('userId', '==', userEmail),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);

      const notifications: InAppNotification[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate()
        } as InAppNotification);
      });

      // Filtra notifiche non scadute
      const now = new Date();
      return notifications.filter(notif =>
        !notif.expiresAt || notif.expiresAt > now
      );
    } catch (error) {
      console.error('❌ Errore recupero notifiche:', error);
      return [];
    }
  }

  // Ottieni notifiche non lette
  async getUnreadNotifications(userEmail: string): Promise<InAppNotification[]> {
    try {
      const q = query(
        collection(db, this.notificationsCollection),
        where('userId', '==', userEmail),
        where('read', '==', false),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);

      const notifications: InAppNotification[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate()
        } as InAppNotification);
      });

      // Filtra notifiche non scadute
      const now = new Date();
      return notifications.filter(notif =>
        !notif.expiresAt || notif.expiresAt > now
      );
    } catch (error) {
      console.error('❌ Errore recupero notifiche non lette:', error);
      return [];
    }
  }

  // Conta notifiche non lette
  async getUnreadCount(userEmail: string): Promise<number> {
    try {
      const unread = await this.getUnreadNotifications(userEmail);
      return unread.length;
    } catch (error) {
      console.error('❌ Errore conteggio notifiche:', error);
      return 0;
    }
  }

  // Segna notifica come letta
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notifRef = doc(db, this.notificationsCollection, notificationId);
      await updateDoc(notifRef, {
        read: true
      });
      console.log('✅ Notifica segnata come letta:', notificationId);
    } catch (error) {
      console.error('❌ Errore aggiornamento notifica:', error);
      throw error;
    }
  }

  // Segna tutte le notifiche come lette
  async markAllAsRead(userEmail: string): Promise<void> {
    try {
      const unread = await this.getUnreadNotifications(userEmail);

      const promises = unread.map(notif =>
        updateDoc(doc(db, this.notificationsCollection, notif.id), {
          read: true
        })
      );

      await Promise.all(promises);
      console.log('✅ Tutte le notifiche segnate come lette');
    } catch (error) {
      console.error('❌ Errore segnatura notifiche:', error);
      throw error;
    }
  }

  // Elimina notifica
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.notificationsCollection, notificationId));
      console.log('✅ Notifica eliminata:', notificationId);
    } catch (error) {
      console.error('❌ Errore eliminazione notifica:', error);
      throw error;
    }
  }

  // Elimina notifiche scadute
  async deleteExpiredNotifications(userEmail: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.notificationsCollection),
        where('userId', '==', userEmail)
      );

      const querySnapshot = await getDocs(q);
      const now = new Date();
      const promises: Promise<void>[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const expiresAt = data.expiresAt?.toDate();

        if (expiresAt && expiresAt < now) {
          promises.push(deleteDoc(docSnap.ref));
        }
      });

      await Promise.all(promises);
      console.log('✅ Notifiche scadute eliminate');
    } catch (error) {
      console.error('❌ Errore eliminazione notifiche scadute:', error);
    }
  }

  // Listener real-time per notifiche
  subscribeToNotifications(
    userEmail: string,
    callback: (notifications: InAppNotification[]) => void
  ): () => void {
    try {
      const q = query(
        collection(db, this.notificationsCollection),
        where('userId', '==', userEmail),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications: InAppNotification[] = [];
        const now = new Date();

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const expiresAt = data.expiresAt?.toDate();

          // Include solo notifiche non scadute
          if (!expiresAt || expiresAt > now) {
            notifications.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              expiresAt
            } as InAppNotification);
          }
        });

        callback(notifications);
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Errore listener notifiche:', error);
      return () => {};
    }
  }
}

export const inAppNotificationService = InAppNotificationService.getInstance();

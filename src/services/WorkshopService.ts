// src/services/WorkshopService.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  GeoPoint,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Workshop, TrustedWorkshop } from '../types/database.types';

export class WorkshopService {
  private static instance: WorkshopService;

  private constructor() {}

  public static getInstance(): WorkshopService {
    if (!WorkshopService.instance) {
      WorkshopService.instance = new WorkshopService();
    }
    return WorkshopService.instance;
  }

  /**
   * Crea o aggiorna un'officina
   */
  async createOrUpdateWorkshop(workshopData: Partial<Workshop>, workshopId?: string): Promise<string> {
    try {
      const id = workshopId || doc(collection(db, 'workshops')).id;
      const workshopRef = doc(db, 'workshops', id);

      const data = {
        ...workshopData,
        id,
        updatedAt: serverTimestamp(),
        ...(workshopId ? {} : { createdAt: serverTimestamp() }),
      };

      await setDoc(workshopRef, data, { merge: true });
      console.log('✅ Workshop salvata:', id);
      return id;
    } catch (error) {
      console.error('❌ Errore salvataggio workshop:', error);
      throw error;
    }
  }

  /**
   * Ottiene i dettagli di un'officina
   */
  async getWorkshop(workshopId: string): Promise<Workshop | null> {
    try {
      const workshopRef = doc(db, 'workshops', workshopId);
      const workshopSnap = await getDoc(workshopRef);

      if (!workshopSnap.exists()) {
        return null;
      }

      const data = workshopSnap.data();
      return this.convertTimestamps(data) as Workshop;
    } catch (error) {
      console.error('❌ Errore recupero workshop:', error);
      throw error;
    }
  }

  /**
   * Cerca officine per città o provincia
   */
  async searchWorkshops(searchParams: {
    city?: string;
    province?: string;
    specialization?: string;
    minRating?: number;
    maxDistance?: number;
    userLocation?: { latitude: number; longitude: number };
  }): Promise<Workshop[]> {
    try {
      let q = collection(db, 'workshops');
      let queryRef = query(q, where('isActive', '==', true));

      if (searchParams.city) {
        queryRef = query(queryRef, where('address.city', '==', searchParams.city));
      }

      if (searchParams.province) {
        queryRef = query(queryRef, where('address.province', '==', searchParams.province));
      }

      if (searchParams.minRating) {
        queryRef = query(queryRef, where('rating', '>=', searchParams.minRating));
      }

      queryRef = query(queryRef, orderBy('rating', 'desc'), limit(50));

      const snapshot = await getDocs(queryRef);
      let workshops = snapshot.docs.map(doc => this.convertTimestamps(doc.data()) as Workshop);

      // Filtra per specializzazione (array contains non supportato in modo semplice)
      if (searchParams.specialization) {
        workshops = workshops.filter(w =>
          w.specializations.some(s =>
            s.toLowerCase().includes(searchParams.specialization!.toLowerCase())
          )
        );
      }

      // Calcola distanza se location fornita
      if (searchParams.userLocation && searchParams.maxDistance) {
        workshops = workshops.filter(w => {
          if (!w.address.coordinates) return false;
          const distance = this.calculateDistance(
            searchParams.userLocation!.latitude,
            searchParams.userLocation!.longitude,
            w.address.coordinates.latitude,
            w.address.coordinates.longitude
          );
          return distance <= searchParams.maxDistance!;
        }).map(w => ({
          ...w,
          distance: this.calculateDistance(
            searchParams.userLocation!.latitude,
            searchParams.userLocation!.longitude,
            w.address.coordinates!.latitude,
            w.address.coordinates!.longitude
          ),
        })).sort((a: any, b: any) => a.distance - b.distance);
      }

      console.log(`✅ Trovate ${workshops.length} officine`);
      return workshops;
    } catch (error) {
      console.error('❌ Errore ricerca workshops:', error);
      throw error;
    }
  }

  /**
   * Ottiene le officine di fiducia dell'utente
   */
  async getTrustedWorkshops(userId: string): Promise<Workshop[]> {
    try {
      // Prima ottieni gli ID delle workshop di fiducia
      const trustedRef = collection(db, 'trusted_workshops');
      const q = query(trustedRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      const trustedWorkshopIds = snapshot.docs.map(doc => doc.data().workshopId);

      if (trustedWorkshopIds.length === 0) {
        return [];
      }

      // Poi ottieni i dettagli delle workshop
      const workshopsPromises = trustedWorkshopIds.map(id => this.getWorkshop(id));
      const workshops = await Promise.all(workshopsPromises);

      return workshops.filter(w => w !== null).map(w => ({ ...w!, isTrustedByUser: true }));
    } catch (error) {
      console.error('❌ Errore recupero workshop di fiducia:', error);
      throw error;
    }
  }

  /**
   * Aggiunge un'officina ai preferiti/di fiducia
   */
  async addToTrustedWorkshops(userId: string, workshopId: string, notes?: string): Promise<void> {
    try {
      const id = `${userId}_${workshopId}`;
      const trustedRef = doc(db, 'trusted_workshops', id);

      await setDoc(trustedRef, {
        id,
        userId,
        workshopId,
        addedAt: serverTimestamp(),
        notes: notes || '',
      });

      console.log('✅ Workshop aggiunta ai preferiti');
    } catch (error) {
      console.error('❌ Errore aggiunta workshop ai preferiti:', error);
      throw error;
    }
  }

  /**
   * Rimuove un'officina dai preferiti/di fiducia
   */
  async removeFromTrustedWorkshops(userId: string, workshopId: string): Promise<void> {
    try {
      const id = `${userId}_${workshopId}`;
      const trustedRef = doc(db, 'trusted_workshops', id);

      // In Firestore non c'è deleteDoc diretto, usiamo updateDoc per contrassegnare come eliminato
      // oppure usiamo direttamente deleteDoc se importato
      // Per ora usiamo un campo deleted
      await updateDoc(trustedRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
      });

      console.log('✅ Workshop rimossa dai preferiti');
    } catch (error) {
      console.error('❌ Errore rimozione workshop dai preferiti:', error);
      throw error;
    }
  }

  /**
   * Ottiene le workshop dell'utente meccanico
   */
  async getWorkshopsByMechanic(mechanicId: string): Promise<Workshop[]> {
    try {
      const q = query(
        collection(db, 'workshops'),
        where('ownerId', '==', mechanicId)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.convertTimestamps(doc.data()) as Workshop);
    } catch (error) {
      console.error('❌ Errore recupero workshop del meccanico:', error);
      throw error;
    }
  }

  /**
   * Aggiorna il rating di un'officina
   */
  async updateWorkshopRating(workshopId: string, newRating: number): Promise<void> {
    try {
      const workshopRef = doc(db, 'workshops', workshopId);
      const workshop = await this.getWorkshop(workshopId);

      if (!workshop) {
        throw new Error('Workshop non trovata');
      }

      const totalRating = workshop.rating * workshop.reviewCount + newRating;
      const newReviewCount = workshop.reviewCount + 1;
      const newAverageRating = totalRating / newReviewCount;

      await updateDoc(workshopRef, {
        rating: newAverageRating,
        reviewCount: newReviewCount,
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Rating workshop aggiornato');
    } catch (error) {
      console.error('❌ Errore aggiornamento rating:', error);
      throw error;
    }
  }

  /**
   * Incrementa il contatore di prenotazioni
   */
  async incrementBookingCount(workshopId: string): Promise<void> {
    try {
      const workshopRef = doc(db, 'workshops', workshopId);
      const workshop = await this.getWorkshop(workshopId);

      if (!workshop) {
        throw new Error('Workshop non trovata');
      }

      await updateDoc(workshopRef, {
        totalBookings: (workshop.totalBookings || 0) + 1,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('❌ Errore incremento contatore prenotazioni:', error);
      throw error;
    }
  }

  /**
   * Calcola la distanza tra due coordinate (formula di Haversine)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raggio della Terra in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Converte i Timestamp di Firestore in Date
   */
  private convertTimestamps(data: any): any {
    const converted = { ...data };
    Object.keys(converted).forEach(key => {
      if (converted[key] instanceof Timestamp) {
        converted[key] = converted[key].toDate();
      } else if (typeof converted[key] === 'object' && converted[key] !== null) {
        converted[key] = this.convertTimestamps(converted[key]);
      }
    });
    return converted;
  }
}

export default WorkshopService.getInstance();

// src/services/BookingService.ts
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
  serverTimestamp,
  Timestamp,
  onSnapshot,
  QuerySnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  BookingRequest,
  BookingProposal,
  BookingMessage,
  MessageAttachment,
} from '../types/database.types';
import WorkshopService from './WorkshopService';

export class BookingService {
  private static instance: BookingService;

  private constructor() {}

  public static getInstance(): BookingService {
    if (!BookingService.instance) {
      BookingService.instance = new BookingService();
    }
    return BookingService.instance;
  }

  /**
   * Crea una nuova richiesta di prenotazione
   */
  async createBookingRequest(bookingData: Partial<BookingRequest>): Promise<string> {
    try {
      const id = doc(collection(db, 'booking_requests')).id;
      const bookingRef = doc(db, 'booking_requests', id);

      const data: Partial<BookingRequest> = {
        ...bookingData,
        id,
        status: 'pending',
        proposals: [],
        messages: [],
        notifications: {
          userNotified: false,
          mechanicNotified: false,
          readyNotificationSent: false,
        },
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      await setDoc(bookingRef, data);

      // Incrementa il contatore di prenotazioni dell'officina
      if (bookingData.workshopId) {
        await WorkshopService.incrementBookingCount(bookingData.workshopId);
      }

      console.log('✅ Richiesta di prenotazione creata:', id);
      return id;
    } catch (error) {
      console.error('❌ Errore creazione richiesta prenotazione:', error);
      throw error;
    }
  }

  /**
   * Ottiene i dettagli di una prenotazione
   */
  async getBookingRequest(bookingId: string): Promise<BookingRequest | null> {
    try {
      const bookingRef = doc(db, 'booking_requests', bookingId);
      const bookingSnap = await getDoc(bookingRef);

      if (!bookingSnap.exists()) {
        return null;
      }

      const data = bookingSnap.data();
      return this.convertTimestamps(data) as BookingRequest;
    } catch (error) {
      console.error('❌ Errore recupero prenotazione:', error);
      throw error;
    }
  }

  /**
   * Ottiene tutte le prenotazioni dell'utente
   */
  async getUserBookings(userId: string, status?: string[]): Promise<BookingRequest[]> {
    try {
      let q = query(
        collection(db, 'booking_requests'),
        where('userId', '==', userId)
      );

      if (status && status.length > 0) {
        q = query(q, where('status', 'in', status));
      }

      q = query(q, orderBy('createdAt', 'desc'), limit(100));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.convertTimestamps(doc.data()) as BookingRequest);
    } catch (error) {
      console.error('❌ Errore recupero prenotazioni utente:', error);
      throw error;
    }
  }

  /**
   * Ottiene tutte le prenotazioni dell'officina/meccanico
   */
  async getWorkshopBookings(workshopId: string, status?: string[]): Promise<BookingRequest[]> {
    try {
      let q = query(
        collection(db, 'booking_requests'),
        where('workshopId', '==', workshopId)
      );

      if (status && status.length > 0) {
        q = query(q, where('status', 'in', status));
      }

      q = query(q, orderBy('createdAt', 'desc'), limit(100));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.convertTimestamps(doc.data()) as BookingRequest);
    } catch (error) {
      console.error('❌ Errore recupero prenotazioni officina:', error);
      throw error;
    }
  }

  /**
   * Aggiorna lo stato di una prenotazione
   */
  async updateBookingStatus(
    bookingId: string,
    status: BookingRequest['status'],
    additionalData?: Partial<BookingRequest>
  ): Promise<void> {
    try {
      const bookingRef = doc(db, 'booking_requests', bookingId);

      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
        ...additionalData,
      };

      if (status === 'completed') {
        updateData.completedAt = serverTimestamp();
      }

      await updateDoc(bookingRef, updateData);
      console.log('✅ Stato prenotazione aggiornato:', status);
    } catch (error) {
      console.error('❌ Errore aggiornamento stato prenotazione:', error);
      throw error;
    }
  }

  /**
   * Aggiunge una proposta di data
   */
  async addProposal(
    bookingId: string,
    proposal: Omit<BookingProposal, 'id' | 'createdAt'>
  ): Promise<void> {
    try {
      const booking = await this.getBookingRequest(bookingId);
      if (!booking) {
        throw new Error('Prenotazione non trovata');
      }

      const newProposal: BookingProposal = {
        ...proposal,
        id: doc(collection(db, '_')).id,
        createdAt: new Date(),
        status: 'pending',
      };

      const updatedProposals = [...booking.proposals, newProposal];

      await updateDoc(doc(db, 'booking_requests', bookingId), {
        proposals: updatedProposals,
        status: 'date_proposed',
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Proposta aggiunta alla prenotazione');
    } catch (error) {
      console.error('❌ Errore aggiunta proposta:', error);
      throw error;
    }
  }

  /**
   * Accetta una proposta di data
   */
  async acceptProposal(bookingId: string, proposalId: string): Promise<void> {
    try {
      const booking = await this.getBookingRequest(bookingId);
      if (!booking) {
        throw new Error('Prenotazione non trovata');
      }

      const updatedProposals = booking.proposals.map(p =>
        p.id === proposalId
          ? { ...p, status: 'accepted' as const }
          : { ...p, status: 'rejected' as const }
      );

      const acceptedProposal = booking.proposals.find(p => p.id === proposalId);

      await updateDoc(doc(db, 'booking_requests', bookingId), {
        proposals: updatedProposals,
        selectedDate: acceptedProposal?.proposedDate,
        status: 'confirmed',
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Proposta accettata');
    } catch (error) {
      console.error('❌ Errore accettazione proposta:', error);
      throw error;
    }
  }

  /**
   * Rifiuta una proposta e ne invia una nuova (controproposta)
   */
  async counterPropose(
    bookingId: string,
    rejectedProposalId: string,
    newProposal: Omit<BookingProposal, 'id' | 'createdAt' | 'status'>
  ): Promise<void> {
    try {
      const booking = await this.getBookingRequest(bookingId);
      if (!booking) {
        throw new Error('Prenotazione non trovata');
      }

      // Marca la proposta precedente come rifiutata
      const updatedProposals = booking.proposals.map(p =>
        p.id === rejectedProposalId
          ? { ...p, status: 'counter_proposed' as const }
          : p
      );

      // Aggiungi la nuova proposta
      const counterProposal: BookingProposal = {
        ...newProposal,
        id: doc(collection(db, '_')).id,
        createdAt: new Date(),
        status: 'pending',
      };

      updatedProposals.push(counterProposal);

      await updateDoc(doc(db, 'booking_requests', bookingId), {
        proposals: updatedProposals,
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Controproposta inviata');
    } catch (error) {
      console.error('❌ Errore invio controproposta:', error);
      throw error;
    }
  }

  /**
   * Aggiunge un messaggio alla conversazione
   */
  async addMessage(
    bookingId: string,
    message: Omit<BookingMessage, 'id' | 'createdAt' | 'isRead'>
  ): Promise<void> {
    try {
      const booking = await this.getBookingRequest(bookingId);
      if (!booking) {
        throw new Error('Prenotazione non trovata');
      }

      const newMessage: BookingMessage = {
        ...message,
        id: doc(collection(db, '_')).id,
        createdAt: new Date(),
        isRead: false,
      };

      const updatedMessages = [...booking.messages, newMessage];

      await updateDoc(doc(db, 'booking_requests', bookingId), {
        messages: updatedMessages,
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Messaggio aggiunto');
    } catch (error) {
      console.error('❌ Errore aggiunta messaggio:', error);
      throw error;
    }
  }

  /**
   * Marca i messaggi come letti
   */
  async markMessagesAsRead(bookingId: string, userId: string): Promise<void> {
    try {
      const booking = await this.getBookingRequest(bookingId);
      if (!booking) {
        throw new Error('Prenotazione non trovata');
      }

      const updatedMessages = booking.messages.map(msg =>
        msg.senderId !== userId ? { ...msg, isRead: true } : msg
      );

      await updateDoc(doc(db, 'booking_requests', bookingId), {
        messages: updatedMessages,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('❌ Errore marcatura messaggi come letti:', error);
      throw error;
    }
  }

  /**
   * Ascolta i cambiamenti in tempo reale di una prenotazione
   */
  onBookingChange(
    bookingId: string,
    callback: (booking: BookingRequest | null) => void
  ): () => void {
    const bookingRef = doc(db, 'booking_requests', bookingId);

    const unsubscribe = onSnapshot(
      bookingRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = this.convertTimestamps(snapshot.data());
          callback(data as BookingRequest);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('❌ Errore listener prenotazione:', error);
        callback(null);
      }
    );

    return unsubscribe;
  }

  /**
   * Ascolta le prenotazioni dell'utente in tempo reale
   */
  onUserBookingsChange(
    userId: string,
    callback: (bookings: BookingRequest[]) => void
  ): () => void {
    const q = query(
      collection(db, 'booking_requests'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const bookings = snapshot.docs.map(doc =>
          this.convertTimestamps(doc.data()) as BookingRequest
        );
        callback(bookings);
      },
      (error) => {
        console.error('❌ Errore listener prenotazioni utente:', error);
        callback([]);
      }
    );

    return unsubscribe;
  }

  /**
   * Ascolta le prenotazioni dell'officina in tempo reale
   */
  onWorkshopBookingsChange(
    workshopId: string,
    callback: (bookings: BookingRequest[]) => void
  ): () => void {
    const q = query(
      collection(db, 'booking_requests'),
      where('workshopId', '==', workshopId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const bookings = snapshot.docs.map(doc =>
          this.convertTimestamps(doc.data()) as BookingRequest
        );
        callback(bookings);
      },
      (error) => {
        console.error('❌ Errore listener prenotazioni officina:', error);
        callback([]);
      }
    );

    return unsubscribe;
  }

  /**
   * Cancella una prenotazione
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'booking_requests', bookingId), {
        status: 'cancelled',
        mechanicNotes: reason || '',
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Prenotazione cancellata');
    } catch (error) {
      console.error('❌ Errore cancellazione prenotazione:', error);
      throw error;
    }
  }

  /**
   * Conta i messaggi non letti
   */
  getUnreadMessageCount(booking: BookingRequest, userId: string): number {
    return booking.messages.filter(msg => msg.senderId !== userId && !msg.isRead).length;
  }

  /**
   * Converte i Timestamp di Firestore in Date
   */
  private convertTimestamps(data: any): any {
    if (!data) return data;

    const converted = { ...data };
    Object.keys(converted).forEach(key => {
      if (converted[key] instanceof Timestamp) {
        converted[key] = converted[key].toDate();
      } else if (Array.isArray(converted[key])) {
        converted[key] = converted[key].map((item: any) =>
          typeof item === 'object' && item !== null ? this.convertTimestamps(item) : item
        );
      } else if (typeof converted[key] === 'object' && converted[key] !== null) {
        converted[key] = this.convertTimestamps(converted[key]);
      }
    });
    return converted;
  }
}

export default BookingService.getInstance();

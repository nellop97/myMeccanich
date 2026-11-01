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
  runTransaction,
  arrayUnion,
  Transaction,
  QuerySnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { toDayString } from '../utils/calendarGrid';
import {
  BookingRequest,
  BookingProposal,
  BookingMessage,
  MessageAttachment,
} from '../types/database.types';

// Messaggio dell'errore lanciato da acceptBooking quando la richiesta non è più accettabile
export const BOOKING_NOT_PENDING = 'booking-not-pending';

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

      // Firestore rifiuta i campi undefined, come telefono o servizio non indicati
      const definedData = Object.fromEntries(
        Object.entries(bookingData).filter(([, value]) => value !== undefined)
      );

      const data: Partial<BookingRequest> = {
        ...definedData,
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

      q = query(q, limit(100));

      const snapshot = await getDocs(q);
      return this.sortByNewest(snapshot.docs.map(doc => this.convertTimestamps(doc.data()) as BookingRequest));
    } catch (error) {
      console.error('❌ Errore recupero prenotazioni utente:', error);
      throw error;
    }
  }

  /**
   * Ottiene tutte le prenotazioni dell'officina/meccanico.
   * mechanicId è il proprietario dell'officina: l'id officina può non essere il suo uid
   * e senza questo filtro le regole Firestore rifiuterebbero la query
   */
  async getWorkshopBookings(workshopId: string, mechanicId: string, status?: string[]): Promise<BookingRequest[]> {
    try {
      let q = query(
        collection(db, 'booking_requests'),
        where('workshopId', '==', workshopId),
        where('mechanicId', '==', mechanicId)
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
   * Conferma una richiesta solo se è ancora in attesa, così non si sovrascrive
   * una cancellazione del cliente. Altrimenti lancia BOOKING_NOT_PENDING
   */
  async acceptBooking(bookingId: string, selectedDate: Date): Promise<void> {
    try {
      const bookingRef = doc(db, 'booking_requests', bookingId);

      await runTransaction(db, async (transaction) => {
        const bookingSnap = await transaction.get(bookingRef);

        if (!bookingSnap.exists() || bookingSnap.data().status !== 'pending') {
          throw new Error(BOOKING_NOT_PENDING);
        }

        const booking = this.convertTimestamps(bookingSnap.data()) as BookingRequest;

        transaction.update(bookingRef, {
          status: 'confirmed',
          selectedDate,
          ...this.writeIntervention(transaction, { ...booking, id: bookingId }, selectedDate),
          updatedAt: serverTimestamp(),
        });
      });

      console.log('✅ Prenotazione accettata');
    } catch (error) {
      console.error('❌ Errore accettazione prenotazione:', error);
      throw error;
    }
  }

  /**
   * Scrive l'intervento nella transazione della conferma, così la data del calendario
   * è per costruzione quella concordata col cliente. L'auto si scrive senza leggerla:
   * le regole di workshopCars negano la lettura di un documento che non esiste ancora.
   * Restituisce i campi che collegano la prenotazione all'intervento
   */
  private writeIntervention(
    transaction: Transaction,
    booking: BookingRequest,
    date: Date,
    status: 'pending' | 'in_progress' = 'pending'
  ) {
    const plate = (booking.vehicleLicensePlate || booking.id).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const carId = `${booking.mechanicId}_${booking.userId}_${plate}`;
    const repairId = `booking_${booking.id}`;
    const now = new Date().toISOString();
    const scheduledDate = toDayString(date);
    const scheduledTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    const repair = {
      id: repairId,
      bookingId: booking.id,
      description: booking.problemDescription
        ? `${booking.serviceName}: ${booking.problemDescription}`
        : booking.serviceName,
      scheduledDate,
      scheduledTime,
      deliveryDate: scheduledDate,
      totalCost: booking.quotedPrice ?? 0,
      laborCost: 0,
      estimatedHours: booking.estimatedDuration ? booking.estimatedDuration / 60 : 0,
      status,
      parts: [],
      mechanicId: booking.mechanicId,
      createdAt: now,
      updatedAt: now,
    };

    transaction.set(
      doc(db, 'workshopCars', carId),
      {
        workshopId: booking.mechanicId,
        mechanicId: booking.mechanicId,
        make: booking.vehicleMake || '',
        model: booking.vehicleModel || '',
        year: booking.vehicleYear ? String(booking.vehicleYear) : '',
        licensePlate: booking.vehicleLicensePlate || '',
        mileage: booking.currentMileage ?? null,
        owner: booking.userName || '',
        ownerId: booking.userId,
        ownerEmail: booking.userEmail || '',
        ownerPhone: booking.userPhone ?? null,
        entryDate: date.toISOString(),
        isActive: true,
        repairs: arrayUnion(repair),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return { interventionCarId: carId, interventionRepairId: repairId };
  }

  /**
   * Aggiorna insieme lo stato della prenotazione e del suo intervento
   */
  async setWorkStatus(bookingId: string, status: 'in_progress' | 'completed' | 'cancelled'): Promise<void> {
    try {
      const bookingRef = doc(db, 'booking_requests', bookingId);

      await runTransaction(db, async (transaction) => {
        const bookingSnap = await transaction.get(bookingRef);
        if (!bookingSnap.exists()) {
          throw new Error('Prenotazione non trovata');
        }

        const booking = bookingSnap.data() as BookingRequest;
        const carRef = booking.interventionCarId ? doc(db, 'workshopCars', booking.interventionCarId) : null;
        const carSnap = carRef ? await transaction.get(carRef) : null;

        if (carRef && carSnap?.exists()) {
          const now = new Date().toISOString();
          transaction.update(carRef, {
            repairs: (carSnap.data().repairs ?? []).map((repair: any) =>
              repair.id === booking.interventionRepairId
                ? { ...repair, status, updatedAt: now }
                : repair
            ),
            updatedAt: serverTimestamp(),
          });
        }

        transaction.update(bookingRef, {
          status,
          ...(status === 'completed' ? { completedAt: serverTimestamp() } : {}),
          updatedAt: serverTimestamp(),
        });
      });

      console.log('✅ Stato lavori aggiornato:', status);
    } catch (error) {
      console.error('❌ Errore aggiornamento stato lavori:', error);
      throw error;
    }
  }

  /**
   * Crea gli interventi delle prenotazioni confermate prima che esistesse il collegamento
   * o approvate da un preventivo. Una prenotazione senza data non ha niente da mettere in agenda
   */
  async syncInterventions(mechanicId: string): Promise<void> {
    const snapshot = await getDocs(query(
      collection(db, 'booking_requests'),
      where('mechanicId', '==', mechanicId),
      where('status', 'in', ['confirmed', 'in_progress']),
      limit(100)
    ));

    for (const bookingDoc of snapshot.docs) {
      const booking = this.convertTimestamps(bookingDoc.data()) as BookingRequest;
      if (booking.interventionCarId || !booking.selectedDate) continue;

      const date = new Date(booking.selectedDate);
      const repairStatus = booking.status === 'in_progress' ? 'in_progress' : 'pending';

      await runTransaction(db, async (transaction) => {
        const current = await transaction.get(bookingDoc.ref);
        if (current.data()?.interventionCarId) return;

        transaction.update(bookingDoc.ref, {
          ...this.writeIntervention(transaction, { ...booking, id: bookingDoc.id }, date, repairStatus),
          updatedAt: serverTimestamp(),
        });
      });
    }
  }

  /**
   * Aggiunge una proposta di data
   */
  async addProposal(
    bookingId: string,
    proposal: Omit<BookingProposal, 'id' | 'createdAt' | 'status'>
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
      const bookingRef = doc(db, 'booking_requests', bookingId);

      await runTransaction(db, async (transaction) => {
        const bookingSnap = await transaction.get(bookingRef);
        if (!bookingSnap.exists()) {
          throw new Error('Prenotazione non trovata');
        }

        const booking = this.convertTimestamps(bookingSnap.data()) as BookingRequest;
        const acceptedProposal = booking.proposals.find(p => p.id === proposalId);
        if (!acceptedProposal) {
          throw new Error('Proposta non trovata');
        }

        const selectedDate = new Date(acceptedProposal.proposedDate);

        transaction.update(bookingRef, {
          proposals: booking.proposals.map(p =>
            p.id === proposalId
              ? { ...p, status: 'accepted' as const }
              : { ...p, status: 'rejected' as const }
          ),
          selectedDate,
          status: 'confirmed',
          ...this.writeIntervention(transaction, { ...booking, id: bookingId }, selectedDate),
          updatedAt: serverTimestamp(),
        });
      });

      console.log('✅ Proposta accettata');
    } catch (error) {
      console.error('❌ Errore accettazione proposta:', error);
      throw error;
    }
  }

  /**
   * Rifiuta una proposta senza indicare un'altra data: la richiesta torna all'officina
   */
  async rejectProposal(bookingId: string, proposalId: string): Promise<void> {
    try {
      const booking = await this.getBookingRequest(bookingId);
      if (!booking) {
        throw new Error('Prenotazione non trovata');
      }

      await updateDoc(doc(db, 'booking_requests', bookingId), {
        proposals: booking.proposals.map(p =>
          p.id === proposalId ? { ...p, status: 'rejected' as const } : p
        ),
        status: 'pending',
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Proposta rifiutata');
    } catch (error) {
      console.error('❌ Errore rifiuto proposta:', error);
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

      // Senza messaggi da segnare non si scrive: ogni scrittura riattiva il listener del dettaglio
      if (!booking.messages.some(msg => msg.senderId !== userId && !msg.isRead)) {
        return;
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
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const bookings = snapshot.docs.map(doc =>
          this.convertTimestamps(doc.data()) as BookingRequest
        );
        callback(this.sortByNewest(bookings));
      },
      (error) => {
        console.error('❌ Errore listener prenotazioni utente:', error);
        callback([]);
      }
    );

    return unsubscribe;
  }

  /**
   * Ascolta le prenotazioni dell'officina in tempo reale.
   * mechanicId serve alle regole Firestore (vedi getWorkshopBookings).
   * Con onError un errore non viene confuso con una lista vuota; dopo un errore
   * il listener è chiuso e va ricreato
   */
  onWorkshopBookingsChange(
    workshopId: string,
    mechanicId: string,
    callback: (bookings: BookingRequest[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const q = query(
      collection(db, 'booking_requests'),
      where('workshopId', '==', workshopId),
      where('mechanicId', '==', mechanicId),
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
        if (onError) {
          onError(error);
        } else {
          callback([]);
        }
      }
    );

    return unsubscribe;
  }

  /**
   * Conta in tempo reale le richieste che aspettano una risposta del meccanico.
   * Una data proposta conta solo se l'ultima proposta è del cliente
   */
  onMechanicPendingCountChange(
    mechanicId: string,
    callback: (count: number) => void
  ): () => void {
    const q = query(
      collection(db, 'booking_requests'),
      where('mechanicId', '==', mechanicId),
      where('status', 'in', ['pending', 'quote_requested', 'date_proposed']),
      limit(100)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const count = snapshot.docs.filter((bookingDoc) => {
          const booking = bookingDoc.data();
          if (booking.status !== 'date_proposed') return true;
          const proposals = booking.proposals ?? [];
          return proposals[proposals.length - 1]?.proposedBy === 'user';
        }).length;
        callback(count);
      },
      (error) => console.error('❌ Errore conteggio richieste officina:', error)
    );
  }

  /**
   * Cancella una prenotazione
   */
  async cancelBooking(bookingId: string): Promise<void> {
    try {
      await this.setWorkStatus(bookingId, 'cancelled');
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

  // Ordinamento sul dispositivo: così le liste del cliente non dipendono da un indice composito
  private sortByNewest(bookings: BookingRequest[]): BookingRequest[] {
    const toTime = (value: unknown) => (value instanceof Date ? value.getTime() : 0);
    return [...bookings].sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt));
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
        converted[key] = converted[key].map((item: any) => {
          if (item instanceof Timestamp) return item.toDate();
          return typeof item === 'object' && item !== null ? this.convertTimestamps(item) : item;
        });
      } else if (typeof converted[key] === 'object' && converted[key] !== null) {
        converted[key] = this.convertTimestamps(converted[key]);
      }
    });
    return converted;
  }
}

export default BookingService.getInstance();

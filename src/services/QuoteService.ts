// src/services/QuoteService.ts
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
} from 'firebase/firestore';
import { db } from './firebase';
import { Quote, QuoteService as QuoteServiceType, QuotePart, QuoteAdditionalCost } from '../types/database.types';

export class QuoteService {
  private static instance: QuoteService;

  private constructor() {}

  public static getInstance(): QuoteService {
    if (!QuoteService.instance) {
      QuoteService.instance = new QuoteService();
    }
    return QuoteService.instance;
  }

  /**
   * Crea un nuovo preventivo
   */
  async createQuote(quoteData: Partial<Quote>): Promise<string> {
    try {
      const id = doc(collection(db, 'quotes')).id;
      const quoteRef = doc(db, 'quotes', id);

      // Calcola i totali
      const laborCost = quoteData.laborCost || 0;
      const partsCost = quoteData.partsCost || 0;
      const additionalCostsTotal = (quoteData.additionalCosts || []).reduce(
        (sum, cost) => sum + cost.amount,
        0
      );
      const subtotal = laborCost + partsCost + additionalCostsTotal;
      const vatRate = quoteData.vatRate || 22; // IVA al 22% default
      const vatAmount = (subtotal * vatRate) / 100;
      const totalCost = subtotal + vatAmount;

      const data: Partial<Quote> = {
        ...quoteData,
        id,
        subtotal,
        vatRate,
        vatAmount,
        totalCost,
        status: 'draft',
        revisionNumber: quoteData.revisionNumber || 0,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      await setDoc(quoteRef, data);
      console.log('✅ Preventivo creato:', id);
      return id;
    } catch (error) {
      console.error('❌ Errore creazione preventivo:', error);
      throw error;
    }
  }

  /**
   * Ottiene un preventivo
   */
  async getQuote(quoteId: string): Promise<Quote | null> {
    try {
      const quoteRef = doc(db, 'quotes', quoteId);
      const quoteSnap = await getDoc(quoteRef);

      if (!quoteSnap.exists()) {
        return null;
      }

      const data = quoteSnap.data();
      return this.convertTimestamps(data) as Quote;
    } catch (error) {
      console.error('❌ Errore recupero preventivo:', error);
      throw error;
    }
  }

  /**
   * Ottiene i preventivi di una prenotazione
   */
  async getQuotesByBooking(bookingRequestId: string): Promise<Quote[]> {
    try {
      const q = query(
        collection(db, 'quotes'),
        where('bookingRequestId', '==', bookingRequestId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.convertTimestamps(doc.data()) as Quote);
    } catch (error) {
      console.error('❌ Errore recupero preventivi:', error);
      throw error;
    }
  }

  /**
   * Ottiene i preventivi dell'utente
   */
  async getUserQuotes(userId: string, status?: string[]): Promise<Quote[]> {
    try {
      let q = query(
        collection(db, 'quotes'),
        where('userId', '==', userId)
      );

      if (status && status.length > 0) {
        q = query(q, where('status', 'in', status));
      }

      q = query(q, orderBy('createdAt', 'desc'), limit(100));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.convertTimestamps(doc.data()) as Quote);
    } catch (error) {
      console.error('❌ Errore recupero preventivi utente:', error);
      throw error;
    }
  }

  /**
   * Ottiene i preventivi dell'officina
   */
  async getWorkshopQuotes(workshopId: string, status?: string[]): Promise<Quote[]> {
    try {
      let q = query(
        collection(db, 'quotes'),
        where('workshopId', '==', workshopId)
      );

      if (status && status.length > 0) {
        q = query(q, where('status', 'in', status));
      }

      q = query(q, orderBy('createdAt', 'desc'), limit(100));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.convertTimestamps(doc.data()) as Quote);
    } catch (error) {
      console.error('❌ Errore recupero preventivi officina:', error);
      throw error;
    }
  }

  /**
   * Invia il preventivo al cliente
   */
  async sendQuote(quoteId: string, validityDays: number = 30): Promise<void> {
    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validityDays);

      await updateDoc(doc(db, 'quotes', quoteId), {
        status: 'sent',
        validUntil,
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Preventivo inviato al cliente');
    } catch (error) {
      console.error('❌ Errore invio preventivo:', error);
      throw error;
    }
  }

  /**
   * Approva un preventivo
   */
  async approveQuote(quoteId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'quotes', quoteId), {
        status: 'approved',
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Preventivo approvato');
    } catch (error) {
      console.error('❌ Errore approvazione preventivo:', error);
      throw error;
    }
  }

  /**
   * Rifiuta un preventivo
   */
  async rejectQuote(quoteId: string, reason?: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'quotes', quoteId), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectionReason: reason || '',
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Preventivo rifiutato');
    } catch (error) {
      console.error('❌ Errore rifiuto preventivo:', error);
      throw error;
    }
  }

  /**
   * Crea una revisione del preventivo
   */
  async createRevision(originalQuoteId: string, changes: Partial<Quote>): Promise<string> {
    try {
      const originalQuote = await this.getQuote(originalQuoteId);
      if (!originalQuote) {
        throw new Error('Preventivo originale non trovato');
      }

      const newRevisionNumber = originalQuote.revisionNumber + 1;

      const newQuoteData: Partial<Quote> = {
        ...originalQuote,
        ...changes,
        id: undefined, // Verrà generato un nuovo ID
        previousQuoteId: originalQuoteId,
        revisionNumber: newRevisionNumber,
        status: 'draft',
        approvedAt: undefined,
        rejectedAt: undefined,
        rejectionReason: undefined,
      };

      const newQuoteId = await this.createQuote(newQuoteData);
      console.log('✅ Revisione preventivo creata:', newQuoteId);
      return newQuoteId;
    } catch (error) {
      console.error('❌ Errore creazione revisione:', error);
      throw error;
    }
  }

  /**
   * Aggiorna un preventivo
   */
  async updateQuote(quoteId: string, updates: Partial<Quote>): Promise<void> {
    try {
      // Ricalcola i totali se necessario
      let calculatedUpdates = { ...updates };

      if (updates.services || updates.parts || updates.additionalCosts || updates.laborCost || updates.partsCost) {
        const quote = await this.getQuote(quoteId);
        if (!quote) {
          throw new Error('Preventivo non trovato');
        }

        const laborCost = updates.laborCost !== undefined ? updates.laborCost : quote.laborCost;
        const partsCost = updates.partsCost !== undefined ? updates.partsCost : quote.partsCost;
        const additionalCosts = updates.additionalCosts !== undefined ? updates.additionalCosts : quote.additionalCosts;

        const additionalCostsTotal = additionalCosts.reduce((sum, cost) => sum + cost.amount, 0);
        const subtotal = laborCost + partsCost + additionalCostsTotal;
        const vatRate = updates.vatRate !== undefined ? updates.vatRate : quote.vatRate;
        const vatAmount = (subtotal * vatRate) / 100;
        const totalCost = subtotal + vatAmount;

        calculatedUpdates = {
          ...calculatedUpdates,
          subtotal,
          vatAmount,
          totalCost,
        };
      }

      await updateDoc(doc(db, 'quotes', quoteId), {
        ...calculatedUpdates,
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Preventivo aggiornato');
    } catch (error) {
      console.error('❌ Errore aggiornamento preventivo:', error);
      throw error;
    }
  }

  /**
   * Verifica se un preventivo è scaduto
   */
  isQuoteExpired(quote: Quote): boolean {
    if (!quote.validUntil) return false;
    return new Date() > quote.validUntil;
  }

  /**
   * Calcola il totale dei servizi
   */
  calculateServicesTotal(services: QuoteServiceType[]): number {
    return services.reduce((sum, service) => sum + service.laborCost, 0);
  }

  /**
   * Calcola il totale dei ricambi
   */
  calculatePartsTotal(parts: QuotePart[]): number {
    return parts.reduce((sum, part) => sum + part.totalPrice, 0);
  }

  /**
   * Genera il numero preventivo (es: "PREV-2024-001")
   */
  async generateQuoteNumber(workshopId: string): Promise<string> {
    try {
      const year = new Date().getFullYear();
      const q = query(
        collection(db, 'quotes'),
        where('workshopId', '==', workshopId),
        where('createdAt', '>=', new Date(year, 0, 1)),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      const lastNumber = snapshot.empty ? 0 : parseInt(snapshot.docs[0].id.split('-')[2] || '0');
      const newNumber = lastNumber + 1;

      return `PREV-${year}-${newNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('❌ Errore generazione numero preventivo:', error);
      // Fallback
      return `PREV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    }
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

export default QuoteService.getInstance();

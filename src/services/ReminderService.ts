// src/services/ReminderService.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Reminder, ReminderType } from '../types/database.types';

export class ReminderService {
  private static COLLECTION_NAME = 'reminders';

  /**
   * Ottiene tutti i promemoria dell'utente
   */
  static async getAllReminders(userId?: string): Promise<Reminder[]> {
    try {
      const uid = userId || auth.currentUser?.uid;
      if (!uid) throw new Error('Utente non autenticato');

      const remindersRef = collection(db, 'users', uid, this.COLLECTION_NAME);
      const q = query(remindersRef, orderBy('dueDate', 'asc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => this.convertFirestoreToReminder(doc.id, doc.data()));
    } catch (error) {
      console.error('Errore nel caricamento dei promemoria:', error);
      throw error;
    }
  }

  /**
   * Ottiene i promemoria attivi dell'utente
   */
  static async getActiveReminders(userId?: string): Promise<Reminder[]> {
    try {
      const uid = userId || auth.currentUser?.uid;
      if (!uid) throw new Error('Utente non autenticato');

      const remindersRef = collection(db, 'users', uid, this.COLLECTION_NAME);
      const q = query(
        remindersRef,
        where('isActive', '==', true),
        where('isCompleted', '==', false),
        orderBy('dueDate', 'asc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => this.convertFirestoreToReminder(doc.id, doc.data()));
    } catch (error) {
      console.error('Errore nel caricamento dei promemoria attivi:', error);
      throw error;
    }
  }

  /**
   * Ottiene i promemoria scaduti
   */
  static async getOverdueReminders(userId?: string): Promise<Reminder[]> {
    try {
      const uid = userId || auth.currentUser?.uid;
      if (!uid) throw new Error('Utente non autenticato');

      const now = Timestamp.now();
      const remindersRef = collection(db, 'users', uid, this.COLLECTION_NAME);
      const q = query(
        remindersRef,
        where('isActive', '==', true),
        where('isCompleted', '==', false),
        where('dueDate', '<', now),
        orderBy('dueDate', 'asc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => this.convertFirestoreToReminder(doc.id, doc.data()));
    } catch (error) {
      console.error('Errore nel caricamento dei promemoria scaduti:', error);
      throw error;
    }
  }

  /**
   * Ottiene i promemoria in scadenza (prossimi N giorni)
   */
  static async getUpcomingReminders(days: number = 30, userId?: string): Promise<Reminder[]> {
    try {
      const uid = userId || auth.currentUser?.uid;
      if (!uid) throw new Error('Utente non autenticato');

      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const remindersRef = collection(db, 'users', uid, this.COLLECTION_NAME);
      const q = query(
        remindersRef,
        where('isActive', '==', true),
        where('isCompleted', '==', false),
        where('dueDate', '>=', Timestamp.fromDate(now)),
        where('dueDate', '<=', Timestamp.fromDate(futureDate)),
        orderBy('dueDate', 'asc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => this.convertFirestoreToReminder(doc.id, doc.data()));
    } catch (error) {
      console.error('Errore nel caricamento dei promemoria in scadenza:', error);
      throw error;
    }
  }

  /**
   * Ottiene i promemoria per un veicolo specifico
   */
  static async getRemindersByVehicle(vehicleId: string, userId?: string): Promise<Reminder[]> {
    try {
      const uid = userId || auth.currentUser?.uid;
      if (!uid) throw new Error('Utente non autenticato');

      const remindersRef = collection(db, 'users', uid, this.COLLECTION_NAME);
      const q = query(
        remindersRef,
        where('vehicleId', '==', vehicleId),
        orderBy('dueDate', 'asc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => this.convertFirestoreToReminder(doc.id, doc.data()));
    } catch (error) {
      console.error('Errore nel caricamento dei promemoria del veicolo:', error);
      throw error;
    }
  }

  /**
   * Ottiene un singolo promemoria per ID
   */
  static async getReminderById(reminderId: string, userId?: string): Promise<Reminder | null> {
    try {
      const uid = userId || auth.currentUser?.uid;
      if (!uid) throw new Error('Utente non autenticato');

      const reminderRef = doc(db, 'users', uid, this.COLLECTION_NAME, reminderId);
      const reminderSnap = await getDoc(reminderRef);

      if (!reminderSnap.exists()) {
        return null;
      }

      return this.convertFirestoreToReminder(reminderSnap.id, reminderSnap.data());
    } catch (error) {
      console.error('Errore nel caricamento del promemoria:', error);
      throw error;
    }
  }

  /**
   * Crea un nuovo promemoria
   */
  static async createReminder(reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Utente non autenticato');

      const remindersRef = collection(db, 'users', uid, this.COLLECTION_NAME);

      // Calcola la prossima scadenza se ricorrente
      let nextDueDate = null;
      if (reminderData.isRecurring && reminderData.recurringInterval && reminderData.recurringUnit) {
        nextDueDate = this.calculateNextDueDate(
          reminderData.dueDate,
          reminderData.recurringInterval,
          reminderData.recurringUnit
        );
      }

      const newReminder = {
        ...reminderData,
        userId: uid,
        isCompleted: false,
        completedAt: null,
        notificationSent: false,
        lastNotified: null,
        nextDueDate: nextDueDate ? Timestamp.fromDate(nextDueDate) : null,
        dueDate: Timestamp.fromDate(reminderData.dueDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(remindersRef, newReminder);
      return docRef.id;
    } catch (error) {
      console.error('Errore nella creazione del promemoria:', error);
      throw error;
    }
  }

  /**
   * Aggiorna un promemoria esistente
   */
  static async updateReminder(
    reminderId: string,
    updates: Partial<Omit<Reminder, 'id' | 'userId' | 'createdAt'>>,
    userId?: string
  ): Promise<void> {
    try {
      const uid = userId || auth.currentUser?.uid;
      if (!uid) throw new Error('Utente non autenticato');

      const reminderRef = doc(db, 'users', uid, this.COLLECTION_NAME, reminderId);

      // Converti le date in Timestamp
      const updateData: any = { ...updates };
      if (updateData.dueDate) {
        updateData.dueDate = Timestamp.fromDate(updateData.dueDate);
      }
      if (updateData.completedAt) {
        updateData.completedAt = Timestamp.fromDate(updateData.completedAt);
      }
      if (updateData.lastNotified) {
        updateData.lastNotified = Timestamp.fromDate(updateData.lastNotified);
      }
      if (updateData.lastCompletedDate) {
        updateData.lastCompletedDate = Timestamp.fromDate(updateData.lastCompletedDate);
      }

      // Ricalcola nextDueDate se necessario
      if (updates.isRecurring && updateData.dueDate && updateData.recurringInterval && updateData.recurringUnit) {
        const nextDueDate = this.calculateNextDueDate(
          updateData.dueDate.toDate(),
          updateData.recurringInterval,
          updateData.recurringUnit
        );
        updateData.nextDueDate = Timestamp.fromDate(nextDueDate);
      }

      updateData.updatedAt = serverTimestamp();

      await updateDoc(reminderRef, updateData);
    } catch (error) {
      console.error('Errore nell\'aggiornamento del promemoria:', error);
      throw error;
    }
  }

  /**
   * Elimina un promemoria
   */
  static async deleteReminder(reminderId: string, userId?: string): Promise<void> {
    try {
      const uid = userId || auth.currentUser?.uid;
      if (!uid) throw new Error('Utente non autenticato');

      const reminderRef = doc(db, 'users', uid, this.COLLECTION_NAME, reminderId);
      await deleteDoc(reminderRef);
    } catch (error) {
      console.error('Errore nell\'eliminazione del promemoria:', error);
      throw error;
    }
  }

  /**
   * Segna un promemoria come completato
   */
  static async completeReminder(reminderId: string, userId?: string): Promise<void> {
    try {
      const uid = userId || auth.currentUser?.uid;
      if (!uid) throw new Error('Utente non autenticato');

      const reminder = await this.getReminderById(reminderId, uid);
      if (!reminder) throw new Error('Promemoria non trovato');

      const reminderRef = doc(db, 'users', uid, this.COLLECTION_NAME, reminderId);

      if (reminder.isRecurring && reminder.recurringInterval && reminder.recurringUnit) {
        // Se è ricorrente, sposta la data alla prossima occorrenza
        const nextDueDate = this.calculateNextDueDate(
          reminder.dueDate,
          reminder.recurringInterval,
          reminder.recurringUnit
        );

        await updateDoc(reminderRef, {
          lastCompletedDate: Timestamp.fromDate(new Date()),
          dueDate: Timestamp.fromDate(nextDueDate),
          notificationSent: false,
          lastNotified: null,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Se non è ricorrente, segnalo come completato
        await updateDoc(reminderRef, {
          isCompleted: true,
          completedAt: Timestamp.fromDate(new Date()),
          isActive: false,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Errore nel completamento del promemoria:', error);
      throw error;
    }
  }

  /**
   * Attiva/disattiva un promemoria
   */
  static async toggleReminderStatus(reminderId: string, userId?: string): Promise<void> {
    try {
      const uid = userId || auth.currentUser?.uid;
      if (!uid) throw new Error('Utente non autenticato');

      const reminder = await this.getReminderById(reminderId, uid);
      if (!reminder) throw new Error('Promemoria non trovato');

      const reminderRef = doc(db, 'users', uid, this.COLLECTION_NAME, reminderId);
      await updateDoc(reminderRef, {
        isActive: !reminder.isActive,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Errore nel toggle dello stato del promemoria:', error);
      throw error;
    }
  }

  /**
   * Elimina tutti i promemoria completati
   */
  static async deleteCompletedReminders(userId?: string): Promise<number> {
    try {
      const uid = userId || auth.currentUser?.uid;
      if (!uid) throw new Error('Utente non autenticato');

      const remindersRef = collection(db, 'users', uid, this.COLLECTION_NAME);
      const q = query(remindersRef, where('isCompleted', '==', true));
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      return snapshot.docs.length;
    } catch (error) {
      console.error('Errore nell\'eliminazione dei promemoria completati:', error);
      throw error;
    }
  }

  /**
   * Calcola la prossima data di scadenza per promemoria ricorrenti
   */
  private static calculateNextDueDate(
    currentDueDate: Date,
    interval: number,
    unit: 'days' | 'weeks' | 'months' | 'years'
  ): Date {
    const nextDate = new Date(currentDueDate);

    switch (unit) {
      case 'days':
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      case 'weeks':
        nextDate.setDate(nextDate.getDate() + interval * 7);
        break;
      case 'months':
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
      case 'years':
        nextDate.setFullYear(nextDate.getFullYear() + interval);
        break;
    }

    return nextDate;
  }

  /**
   * Converte i dati Firestore in oggetto Reminder
   */
  private static convertFirestoreToReminder(id: string, data: any): Reminder {
    return {
      id,
      userId: data.userId,
      vehicleId: data.vehicleId,
      title: data.title,
      description: data.description,
      type: data.type,
      dueDate: data.dueDate?.toDate() || new Date(),
      dueMileage: data.dueMileage,
      isActive: data.isActive,
      isCompleted: data.isCompleted || false,
      completedAt: data.completedAt?.toDate(),
      isRecurring: data.isRecurring || false,
      recurringInterval: data.recurringInterval,
      recurringUnit: data.recurringUnit,
      nextDueDate: data.nextDueDate?.toDate(),
      lastCompletedDate: data.lastCompletedDate?.toDate(),
      notifyDaysBefore: data.notifyDaysBefore || 7,
      lastNotified: data.lastNotified?.toDate(),
      notificationSent: data.notificationSent || false,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      relatedMaintenanceId: data.relatedMaintenanceId,
      relatedDocumentId: data.relatedDocumentId,
      cost: data.cost,
      notes: data.notes,
    };
  }

  /**
   * Genera un file .ics per esportare il promemoria al calendario
   */
  static generateICSFile(reminder: Reminder, vehicleName: string): string {
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const now = new Date();
    const dueDate = new Date(reminder.dueDate);

    // Imposta l'evento per tutto il giorno
    const startDate = new Date(dueDate);
    startDate.setHours(9, 0, 0, 0);
    const endDate = new Date(dueDate);
    endDate.setHours(10, 0, 0, 0);

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MyMeccanich//Reminder//IT',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `DTSTAMP:${formatDate(now)}`,
      `UID:reminder-${reminder.id}@mymeccanich.app`,
      `SUMMARY:${reminder.title}`,
      `DESCRIPTION:${this.escapeICSText(reminder.description || '')}\\n\\nVeicolo: ${vehicleName}${reminder.dueMileage ? `\\nChilometraggio: ${reminder.dueMileage} km` : ''}${reminder.cost ? `\\nCosto previsto: €${reminder.cost}` : ''}${reminder.notes ? `\\n\\nNote: ${this.escapeICSText(reminder.notes)}` : ''}`,
      `LOCATION:${vehicleName}`,
      'STATUS:CONFIRMED',
      'TRANSP:TRANSPARENT',
      `CATEGORIES:${this.getReminderCategoryLabel(reminder.type)}`,
    ];

    // Aggiungi allarme
    if (reminder.notifyDaysBefore > 0) {
      icsContent.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:Promemoria: ${reminder.title}`,
        `TRIGGER:-P${reminder.notifyDaysBefore}D`,
        'END:VALARM'
      );
    }

    // Aggiungi ricorrenza se necessario
    if (reminder.isRecurring && reminder.recurringInterval && reminder.recurringUnit) {
      const rrule = this.generateRRule(reminder.recurringInterval, reminder.recurringUnit);
      icsContent.push(`RRULE:${rrule}`);
    }

    icsContent.push('END:VEVENT', 'END:VCALENDAR');

    return icsContent.join('\r\n');
  }

  /**
   * Genera la regola di ricorrenza per il file .ics
   */
  private static generateRRule(interval: number, unit: 'days' | 'weeks' | 'months' | 'years'): string {
    const freqMap = {
      days: 'DAILY',
      weeks: 'WEEKLY',
      months: 'MONTHLY',
      years: 'YEARLY',
    };

    return `FREQ=${freqMap[unit]};INTERVAL=${interval}`;
  }

  /**
   * Escapa il testo per il formato .ics
   */
  private static escapeICSText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }

  /**
   * Ottiene l'etichetta della categoria per il tipo di promemoria
   */
  private static getReminderCategoryLabel(type: ReminderType): string {
    const labels: Record<ReminderType, string> = {
      maintenance: 'Manutenzione',
      insurance: 'Assicurazione',
      tax: 'Bollo',
      inspection: 'Revisione',
      tire_change: 'Cambio Gomme',
      oil_change: 'Cambio Olio',
      document: 'Documento',
      custom: 'Personalizzato',
      other: 'Altro',
    };
    return labels[type] || 'Promemoria';
  }
}

export default ReminderService;

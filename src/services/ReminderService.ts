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

      // Validazioni obbligatorie
      if (!reminderData.vehicleId || reminderData.vehicleId.trim() === '') {
        throw new Error('vehicleId è obbligatorio per creare un promemoria');
      }
      if (!reminderData.title || reminderData.title.trim() === '') {
        throw new Error('title è obbligatorio per creare un promemoria');
      }
      if (!reminderData.dueDate || !(reminderData.dueDate instanceof Date)) {
        throw new Error('dueDate deve essere una data valida');
      }

      // Calcola la prossima scadenza se ricorrente
      let nextDueDate = null;
      if (reminderData.isRecurring && reminderData.recurringInterval && reminderData.recurringUnit) {
        nextDueDate = this.calculateNextDueDate(
          reminderData.dueDate,
          reminderData.recurringInterval,
          reminderData.recurringUnit
        );
      }

      const newReminder: any = {
        userId: uid,
        vehicleId: reminderData.vehicleId.trim(),
        title: reminderData.title.trim(),
        type: reminderData.type,
        dueDate: Timestamp.fromDate(reminderData.dueDate),
        isActive: reminderData.isActive ?? true,
        isCompleted: false,
        isRecurring: reminderData.isRecurring ?? false,
        notifyDaysBefore: reminderData.notifyDaysBefore ?? 7,
        notificationSent: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Aggiungi campi opzionali solo se presenti e validi
      if (reminderData.description && reminderData.description.trim()) {
        newReminder.description = reminderData.description.trim();
      }
      if (reminderData.dueMileage && reminderData.dueMileage > 0) {
        newReminder.dueMileage = reminderData.dueMileage;
      }
      if (reminderData.cost && reminderData.cost > 0) {
        newReminder.cost = reminderData.cost;
      }
      if (reminderData.notes && reminderData.notes.trim()) {
        newReminder.notes = reminderData.notes.trim();
      }
      if (reminderData.relatedMaintenanceId && reminderData.relatedMaintenanceId.trim()) {
        newReminder.relatedMaintenanceId = reminderData.relatedMaintenanceId.trim();
      }
      if (reminderData.relatedDocumentId && reminderData.relatedDocumentId.trim()) {
        newReminder.relatedDocumentId = reminderData.relatedDocumentId.trim();
      }

      // Campi ricorrenza - aggiungi solo se effettivamente ricorrente e con valori validi
      if (reminderData.isRecurring) {
        if (reminderData.recurringInterval && reminderData.recurringInterval > 0) {
          newReminder.recurringInterval = reminderData.recurringInterval;
        }
        if (reminderData.recurringUnit) {
          newReminder.recurringUnit = reminderData.recurringUnit;
        }
        if (nextDueDate) {
          newReminder.nextDueDate = Timestamp.fromDate(nextDueDate);
        }
      }

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

      const updateData: any = {
        updatedAt: serverTimestamp(),
      };

      // Aggiungi solo i campi che sono effettivamente presenti nell'update con valori validi
      // Campi stringa: validare che non siano vuoti
      if (updates.vehicleId !== undefined && updates.vehicleId !== null) {
        if (typeof updates.vehicleId === 'string' && updates.vehicleId.trim() !== '') {
          updateData.vehicleId = updates.vehicleId.trim();
        }
      }
      if (updates.title !== undefined && updates.title !== null) {
        if (typeof updates.title === 'string' && updates.title.trim() !== '') {
          updateData.title = updates.title.trim();
        }
      }
      if (updates.description !== undefined) {
        if (updates.description === null || updates.description === '') {
          updateData.description = null; // Permetti rimozione
        } else if (typeof updates.description === 'string' && updates.description.trim() !== '') {
          updateData.description = updates.description.trim();
        }
      }
      if (updates.notes !== undefined) {
        if (updates.notes === null || updates.notes === '') {
          updateData.notes = null; // Permetti rimozione
        } else if (typeof updates.notes === 'string' && updates.notes.trim() !== '') {
          updateData.notes = updates.notes.trim();
        }
      }

      // Campi enum/tipo
      if (updates.type !== undefined && updates.type !== null) updateData.type = updates.type;
      if (updates.recurringUnit !== undefined && updates.recurringUnit !== null) updateData.recurringUnit = updates.recurringUnit;

      // Campi booleani
      if (typeof updates.isActive === 'boolean') updateData.isActive = updates.isActive;
      if (typeof updates.isCompleted === 'boolean') updateData.isCompleted = updates.isCompleted;
      if (typeof updates.isRecurring === 'boolean') updateData.isRecurring = updates.isRecurring;
      if (typeof updates.notificationSent === 'boolean') updateData.notificationSent = updates.notificationSent;

      // Campi numerici: validare che siano numeri positivi
      if (typeof updates.notifyDaysBefore === 'number' && updates.notifyDaysBefore >= 0) {
        updateData.notifyDaysBefore = updates.notifyDaysBefore;
      }
      if (typeof updates.dueMileage === 'number' && updates.dueMileage > 0) {
        updateData.dueMileage = updates.dueMileage;
      }
      if (typeof updates.cost === 'number' && updates.cost >= 0) {
        updateData.cost = updates.cost;
      }
      if (typeof updates.recurringInterval === 'number' && updates.recurringInterval > 0) {
        updateData.recurringInterval = updates.recurringInterval;
      }

      // ID relazionali
      if (updates.relatedMaintenanceId !== undefined) {
        if (updates.relatedMaintenanceId === null || updates.relatedMaintenanceId === '') {
          updateData.relatedMaintenanceId = null; // Permetti rimozione
        } else if (typeof updates.relatedMaintenanceId === 'string' && updates.relatedMaintenanceId.trim() !== '') {
          updateData.relatedMaintenanceId = updates.relatedMaintenanceId.trim();
        }
      }
      if (updates.relatedDocumentId !== undefined) {
        if (updates.relatedDocumentId === null || updates.relatedDocumentId === '') {
          updateData.relatedDocumentId = null; // Permetti rimozione
        } else if (typeof updates.relatedDocumentId === 'string' && updates.relatedDocumentId.trim() !== '') {
          updateData.relatedDocumentId = updates.relatedDocumentId.trim();
        }
      }

      // Converti le date in Timestamp se presenti e valide
      if (updates.dueDate && updates.dueDate instanceof Date && !isNaN(updates.dueDate.getTime())) {
        updateData.dueDate = Timestamp.fromDate(updates.dueDate);
      }
      if (updates.completedAt) {
        if (updates.completedAt instanceof Date && !isNaN(updates.completedAt.getTime())) {
          updateData.completedAt = Timestamp.fromDate(updates.completedAt);
        } else if (updates.completedAt === null) {
          updateData.completedAt = null; // Permetti rimozione
        }
      }
      if (updates.lastNotified) {
        if (updates.lastNotified instanceof Date && !isNaN(updates.lastNotified.getTime())) {
          updateData.lastNotified = Timestamp.fromDate(updates.lastNotified);
        } else if (updates.lastNotified === null) {
          updateData.lastNotified = null;
        }
      }
      if (updates.lastCompletedDate) {
        if (updates.lastCompletedDate instanceof Date && !isNaN(updates.lastCompletedDate.getTime())) {
          updateData.lastCompletedDate = Timestamp.fromDate(updates.lastCompletedDate);
        } else if (updates.lastCompletedDate === null) {
          updateData.lastCompletedDate = null;
        }
      }
      if (updates.nextDueDate) {
        if (updates.nextDueDate instanceof Date && !isNaN(updates.nextDueDate.getTime())) {
          updateData.nextDueDate = Timestamp.fromDate(updates.nextDueDate);
        } else if (updates.nextDueDate === null) {
          updateData.nextDueDate = null;
        }
      }

      // Ricalcola nextDueDate se necessario
      if (updates.isRecurring && updates.dueDate && updates.recurringInterval && updates.recurringUnit) {
        const nextDueDate = this.calculateNextDueDate(
          updates.dueDate,
          updates.recurringInterval,
          updates.recurringUnit
        );
        updateData.nextDueDate = Timestamp.fromDate(nextDueDate);
      }

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

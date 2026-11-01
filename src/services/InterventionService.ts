// src/services/InterventionService.ts - Chiusura di un intervento: costi, foto, storico e ritiro
import { doc, DocumentSnapshot, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import UploadService from './UploadService';
import BookingService from './BookingService';
import { applyConsumptionInTransaction, inventoryItemRef } from './InventoryService';
import { Repair, RepairPart, WorkshopCar } from '../store/workshopStore';
import { toStoredPart, withoutUndefined } from '../utils/firestoreData';
import { calculateInterventionTotals, VAT_RATE } from '../utils/interventionTotals';
import { toDayString } from '../utils/calendarGrid';
import { isStockPart } from '../utils/inventoryStock';
import { guessMaintenanceType } from '../utils/maintenanceType';

export type InterventionPhotoKind = 'work' | 'part';

export interface InterventionPhoto {
  url: string;
  kind: InterventionPhotoKind;
  name: string;
}

export interface LocalPhoto {
  uri: string;
  fileName?: string;
  kind: InterventionPhotoKind;
}

export type LocalPartPhoto = Omit<LocalPhoto, 'kind'>;

// Uri locale -> url già caricato: un nuovo tentativo di chiusura non ricarica le foto
export type UploadedPhotos = Map<string, string>;

export class InterventionAlreadyClosedError extends Error {
  constructor(cancelled = false) {
    super(
      cancelled
        ? 'Questo intervento è stato annullato: i lavori non sono stati chiusi e la giacenza non è cambiata.'
        : 'Questo intervento è già stato chiuso: la giacenza non è stata scaricata di nuovo.'
    );
    this.name = 'InterventionAlreadyClosedError';
  }
}

interface CompleteInterventionInput {
  car: WorkshopCar;
  repair: Repair;
  parts: RepairPart[];
  laborCost: number;
  notes: string;
  mileage?: number;
  photos: InterventionPhoto[];
  mechanicId: string;
  mechanicName: string;
}

// Elenco chiuso di campi: fornitore e costo d'acquisto non devono mai finire nello storico
const toHistoryPart = (part: RepairPart) =>
  withoutUndefined({
    name: part.name,
    partNumber: part.partNumber ?? '',
    brand: part.brand ?? '',
    quantity: part.quantity,
    unitPrice: part.unitPrice,
    cost: part.totalPrice,
    source: part.source,
    origin: part.origin,
    photoUrl: part.photoUrl,
    serialNumber: part.serialNumber || undefined,
  });

class InterventionService {
  async uploadPhotos(
    photos: LocalPhoto[],
    mechanicId: string,
    repairId: string,
    uploaded: UploadedPhotos = new Map()
  ): Promise<InterventionPhoto[]> {
    return Promise.all(
      photos.map(async ({ uri, fileName, kind }, index) => {
        const name = fileName || `foto-${index + 1}.jpg`;
        const url = await this.uploadOnce(
          uri,
          `vehicles/${mechanicId}/interventions/${repairId}/${kind}-${index}-${name}`,
          uploaded
        );
        return { url, kind, name };
      })
    );
  }

  // Le righe senza foto locale restano com'erano, con l'eventuale photoUrl già salvato
  async uploadPartPhotos(
    parts: RepairPart[],
    photos: Record<string, LocalPartPhoto>,
    mechanicId: string,
    repairId: string,
    uploaded: UploadedPhotos = new Map()
  ): Promise<RepairPart[]> {
    return Promise.all(
      parts.map(async (part) => {
        const photo = photos[part.id];
        if (!photo) {
          return part;
        }

        const photoUrl = await this.uploadOnce(
          photo.uri,
          `vehicles/${mechanicId}/interventions/${repairId}/part-${part.id}-${photo.fileName || 'foto.jpg'}`,
          uploaded
        );
        return { ...part, photoUrl };
      })
    );
  }

  private async uploadOnce(uri: string, path: string, uploaded: UploadedPhotos): Promise<string> {
    const existing = uploaded.get(uri);
    if (existing) {
      return existing;
    }

    const { url } = await UploadService.uploadImage(uri, { path });
    uploaded.set(uri, url);
    return url;
  }

  /**
   * Chiude i lavori in un'unica transazione: intervento, prenotazione e storico del
   * veicolo restano allineati, e i pezzi di magazzino vengono scaricati insieme a loro.
   * Lo stato diventa ready: il lavoro è finito ma l'auto aspetta il ritiro.
   *
   * Firestore vuole tutte le letture prima di tutte le scritture. Una giacenza che non
   * basta (InsufficientStockError) annulla l'intera transazione.
   */
  async completeIntervention(input: CompleteInterventionInput) {
    const { car, repair, parts, laborCost, notes, mileage, photos, mechanicId, mechanicName } = input;
    const totals = calculateInterventionTotals(parts, laborCost);
    const now = new Date();
    const carRef = doc(db, 'workshopCars', car.id);
    const bookingRef = repair.bookingId ? doc(db, 'booking_requests', repair.bookingId) : null;

    await runTransaction(db, async (transaction) => {
      const carSnap = await transaction.get(carRef);
      if (!carSnap.exists()) {
        throw new Error('Intervento non trovato');
      }

      const savedRepairs: Repair[] = carSnap.data().repairs ?? [];
      const savedRepair = savedRepairs.find((item) => item.id === repair.id);
      if (!savedRepair) {
        throw new Error('Intervento non trovato');
      }
      if (savedRepair.status === 'ready' || savedRepair.status === 'completed') {
        throw new InterventionAlreadyClosedError();
      }

      const bookingSnap = bookingRef ? await transaction.get(bookingRef) : null;
      const booking = bookingSnap?.exists() ? bookingSnap.data() : null;

      // Il cliente può annullare mentre il meccanico ha la schermata aperta
      if (savedRepair.status === 'cancelled' || booking?.status === 'cancelled') {
        throw new InterventionAlreadyClosedError(true);
      }

      const stockParts = parts.filter(isStockPart);
      const itemSnaps = new Map<string, DocumentSnapshot>();
      for (const itemId of new Set(stockParts.map((part) => part.inventoryItemId as string))) {
        itemSnaps.set(itemId, await transaction.get(inventoryItemRef(itemId)));
      }

      // Da qui in poi solo scritture
      stockParts.forEach((part) => {
        applyConsumptionInTransaction(transaction, itemSnaps.get(part.inventoryItemId as string)!, part, {
          workshopId: mechanicId,
          carId: car.id,
          repairId: repair.id,
          licensePlate: car.licensePlate ?? '',
          createdBy: mechanicId,
        });
      });

      let maintenanceRecordId: string | null = null;

      if (booking?.vehicleId) {
        maintenanceRecordId = `booking_${repair.bookingId}`;
        transaction.set(doc(db, 'maintenance_records', maintenanceRecordId), {
          vehicleId: booking.vehicleId,
          ownerId: booking.userId,
          userId: booking.userId,
          bookingId: repair.bookingId,
          date: now,
          type: guessMaintenanceType(repair.description),
          description: repair.description,
          mileage: mileage ?? booking.currentMileage ?? 0,
          cost: totals.total,
          subtotal: totals.subtotal,
          vatRate: VAT_RATE,
          vatAmount: totals.vatAmount,
          laborCost: totals.laborCost,
          partsCost: totals.partsCost,
          workshopId: mechanicId,
          workshopName: booking.workshopName ?? '',
          mechanicId,
          mechanicName,
          addedByType: 'mechanic',
          verifiedByWorkshop: true,
          parts: parts.map(toHistoryPart),
          photos,
          notes,
          warranty: false,
          documents: [],
          isVisible: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      const updatedAt = now.toISOString();
      transaction.update(carRef, {
        repairs: savedRepairs.map((item) =>
          item.id === repair.id
            ? {
                ...item,
                parts: parts.map(toStoredPart),
                laborCost: totals.laborCost,
                subtotal: totals.subtotal,
                vatAmount: totals.vatAmount,
                totalCost: totals.total,
                notes,
                photos,
                status: 'ready',
                completedAt: updatedAt,
                updatedAt,
              }
            : item
        ),
        updatedAt: serverTimestamp(),
      });

      if (bookingRef && booking) {
        transaction.update(bookingRef, {
          status: 'ready',
          actualCost: totals.total,
          ...(maintenanceRecordId ? { maintenanceRecordId } : {}),
          updatedAt: serverTimestamp(),
        });
      }
    });

    return totals;
  }

  async linkInvoice(car: WorkshopCar, repair: Repair, invoiceId: string) {
    await updateDoc(doc(db, 'workshopCars', car.id), {
      repairs: car.repairs.map((item) =>
        item.id === repair.id ? { ...item, invoiceId } : item
      ),
      updatedAt: serverTimestamp(),
    });

    if (repair.bookingId) {
      await updateDoc(doc(db, 'booking_requests', repair.bookingId), { invoiceId, updatedAt: serverTimestamp() });
    }
  }

  // Il pagamento alla consegna fa entrare la fattura nel fatturato del mese
  async markInvoicePaid(invoiceId: string) {
    await updateDoc(doc(db, 'invoices', invoiceId), {
      status: 'paid',
      paidDate: toDayString(new Date()),
      updatedAt: serverTimestamp(),
    });
  }

  async collect(bookingId: string, invoiceId: string | undefined, paid: boolean) {
    await BookingService.setWorkStatus(bookingId, 'completed');
    if (paid && invoiceId) {
      await this.markInvoicePaid(invoiceId);
    }
  }
}

export default new InterventionService();

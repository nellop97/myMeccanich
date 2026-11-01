// src/services/InterventionService.ts - Chiusura di un intervento: costi, foto, storico e ritiro
import { doc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import UploadService from './UploadService';
import BookingService from './BookingService';
import { Repair, RepairPart, WorkshopCar } from '../store/workshopStore';
import { calculateInterventionTotals, VAT_RATE } from '../utils/interventionTotals';
import { toDayString } from '../utils/calendarGrid';

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

const MAINTENANCE_TYPES = ['tagliando', 'gomme', 'freni', 'carrozzeria', 'motore', 'elettronica'];

const guessMaintenanceType = (description: string) =>
  MAINTENANCE_TYPES.find((type) => description.toLowerCase().includes(type)) ?? 'altro';

class InterventionService {
  async uploadPhotos(photos: LocalPhoto[], mechanicId: string, repairId: string): Promise<InterventionPhoto[]> {
    return Promise.all(
      photos.map(async ({ uri, fileName, kind }, index) => {
        const name = fileName || `foto-${index + 1}.jpg`;
        const result = await UploadService.uploadImage(uri, {
          path: `vehicles/${mechanicId}/interventions/${repairId}/${kind}-${index}-${name}`,
        });
        return { url: result.url, kind, name };
      })
    );
  }

  /**
   * Chiude i lavori in un'unica transazione: intervento, prenotazione e storico del
   * veicolo restano allineati. Lo stato diventa ready: il lavoro è finito ma l'auto
   * aspetta il ritiro
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

      const bookingSnap = bookingRef ? await transaction.get(bookingRef) : null;
      const booking = bookingSnap?.exists() ? bookingSnap.data() : null;
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
          parts: parts.map((part) => ({
            name: part.name,
            partNumber: part.partNumber ?? '',
            brand: part.brand ?? '',
            quantity: part.quantity,
            unitPrice: part.unitPrice,
            cost: part.totalPrice,
          })),
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
        repairs: (carSnap.data().repairs ?? []).map((item: Repair) =>
          item.id === repair.id
            ? {
                ...item,
                parts,
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

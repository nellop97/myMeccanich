// src/screens/mechanic/interventions.ts - Lettura comune degli interventi dell'officina
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import BookingService from '../../services/BookingService';
import InterventionService from '../../services/InterventionService';
import { Repair, WorkshopCar, useWorkshopStore } from '../../store/workshopStore';
import { MechanicTheme } from './mechanicTheme';

export interface Intervention {
  car: WorkshopCar;
  repair: Repair;
  status: 'pending' | 'in_progress' | 'ready' | 'completed' | 'cancelled';
}

// Alcuni interventi storici usano ancora in-progress
const normalizeStatus = (status: string): Intervention['status'] =>
  status === 'in-progress' ? 'in_progress' : (status as Intervention['status']);

export const getInterventions = (cars: WorkshopCar[]): Intervention[] =>
  cars.flatMap((car) =>
    (car.repairs ?? []).map((repair) => ({ car, repair, status: normalizeStatus(repair.status) }))
  );

export const isOpenIntervention = ({ status }: Intervention) =>
  status === 'pending' || status === 'in_progress' || status === 'ready';

export const getInterventionStatus = (status: Intervention['status'], theme: MechanicTheme) => {
  switch (status) {
    case 'in_progress':
      return { label: 'In lavorazione', color: theme.onPrimaryLight, background: theme.primaryLight };
    case 'ready':
      return { label: 'Pronta per il ritiro', color: theme.text, background: theme.successLight };
    case 'completed':
      return { label: 'Completato', color: theme.text, background: theme.successLight };
    case 'cancelled':
      return { label: 'Annullato', color: theme.text, background: theme.errorLight };
    default:
      return { label: 'Programmato', color: theme.text, background: theme.warningLight };
  }
};

export const useInterventions = (workshopId?: string) => {
  const { cars, fetchCars, updateRepair } = useWorkshopStore();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (!workshopId) {
      setLoading(false);
      return;
    }

    try {
      await BookingService.syncInterventions(workshopId);
    } catch (error) {
      // Gli interventi già presenti restano consultabili anche se questo passaggio fallisce
      console.error('Errore sincronizzazione interventi:', error);
    }

    await fetchCars(workshopId);
    setFailed(!!useWorkshopStore.getState().error);
    setLoading(false);
  }, [workshopId, fetchCars]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Se l'intervento viene da una prenotazione, anche il cliente deve vedere il cambio
  const startWork = async ({ car, repair }: Intervention) => {
    if (repair.bookingId) {
      await BookingService.setWorkStatus(repair.bookingId, 'in_progress');
      await load();
    } else {
      await updateRepair(car.id, repair.id, { status: 'in_progress' });
    }
  };

  const collect = async ({ car, repair }: Intervention, paid: boolean) => {
    if (repair.bookingId) {
      await InterventionService.collect(repair.bookingId, repair.invoiceId, paid);
      await load();
      return;
    }

    await updateRepair(car.id, repair.id, { status: 'completed' });
    if (paid && repair.invoiceId) {
      await InterventionService.markInvoicePaid(repair.invoiceId);
    }
  };

  return { interventions: getInterventions(cars), loading, failed, reload: load, startWork, collect };
};

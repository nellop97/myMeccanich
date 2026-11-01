// src/utils/firestoreData.ts - Pulizia dei dati prima della scrittura su Firestore
import type { Repair, RepairPart } from '../store/workshopStore';

// Firestore rifiuta i campi undefined, anche dentro gli array: una riga sbagliata farebbe
// fallire l'intero salvataggio
export const withoutUndefined = <T extends object>(data: T): T =>
  Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as T;

// workshopCars è leggibile dal cliente: il fornitore delle righe vecchie sparisce alla prima riscrittura
export const toStoredPart = ({ supplier: _supplier, ...part }: RepairPart): RepairPart =>
  withoutUndefined(part);

export const toStoredRepair = (repair: Repair): Repair =>
  withoutUndefined({ ...repair, parts: repair.parts?.map(toStoredPart) });

// src/types/inventory.types.ts - Modello dati del magazzino officina
import type { Timestamp } from 'firebase/firestore';

export type InventoryCategory =
  | 'fluidi'
  | 'filtri'
  | 'consumabili'
  | 'freni'
  | 'sospensioni'
  | 'elettrico'
  | 'carrozzeria'
  | 'motore'
  | 'trasmissione'
  | 'altro';

export type PartOrigin = 'original' | 'equivalent' | 'aftermarket' | 'remanufactured' | 'used';

export type PartSource = 'stock' | 'bought_for_job' | 'customer_supplied';

export type InventoryUnit = 'pz' | 'l' | 'kg';

export type InventoryMovementType = 'load' | 'consumption' | 'adjustment' | 'return';

// Il costo d'acquisto e il fornitore restano qui: workshopCars è leggibile dal cliente
export interface InventoryItem {
  id: string;
  workshopId: string;
  name: string;
  category: InventoryCategory;
  partNumber: string;
  brand: string;
  origin: PartOrigin;
  supplier: string;
  location: string;
  unit: InventoryUnit;
  quantityOnHand: number;
  minStock: number;
  purchaseCost: number;
  salePrice: number;
  serialNumber?: string;
  photoUrls: string[];
  archived: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface InventoryMovement {
  id: string;
  workshopId: string;
  itemId: string;
  itemName: string;
  type: InventoryMovementType;
  quantity: number; // Con segno: positiva se entra, negativa se esce
  unitCost?: number;
  reason?: string;
  carId?: string;
  repairId?: string;
  licensePlate?: string;
  createdAt: Timestamp;
  createdBy: string;
}

// Contratto con la Cloud Function di analisi foto: i campi non leggibili sono null
export interface PartAnalysis {
  name: string | null;
  brand: string | null;
  partNumber: string | null;
  serialNumber: string | null;
  category: InventoryCategory | null;
  origin: PartOrigin | null;
  unit: InventoryUnit | null;
  notes: string | null;
}

export const INVENTORY_CATEGORY_LABELS: Record<InventoryCategory, string> = {
  fluidi: 'Fluidi',
  filtri: 'Filtri',
  consumabili: 'Consumabili',
  freni: 'Freni',
  sospensioni: 'Sospensioni',
  elettrico: 'Elettrico',
  carrozzeria: 'Carrozzeria',
  motore: 'Motore',
  trasmissione: 'Trasmissione',
  altro: 'Altro',
};

export const PART_ORIGIN_LABELS: Record<PartOrigin, string> = {
  original: 'Originale',
  equivalent: 'Equivalente',
  aftermarket: 'Aftermarket',
  remanufactured: 'Rigenerato',
  used: 'Usato',
};

export const PART_SOURCE_LABELS: Record<PartSource, string> = {
  stock: 'Da magazzino',
  bought_for_job: 'Acquistato per il lavoro',
  customer_supplied: 'Fornito dal cliente',
};

// Senza categoria nota la foto resta obbligatoria: è il caso più prudente
export const requiresMountedPhoto = (category?: InventoryCategory | null): boolean =>
  category !== 'fluidi' && category !== 'consumabili';

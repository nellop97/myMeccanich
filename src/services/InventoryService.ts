// src/services/InventoryService.ts - Schede di magazzino e movimenti di giacenza
import {
  arrayUnion,
  collection,
  doc,
  DocumentReference,
  DocumentSnapshot,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  Transaction,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import UploadService from './UploadService';
import type { RepairPart } from '../store/workshopStore';
import type {
  InventoryItem,
  InventoryMovement,
  InventoryMovementType,
} from '../types/inventory.types';
import { withoutUndefined } from '../utils/firestoreData';
import { roundQuantity } from '../utils/inventoryStock';

const ITEMS = 'inventory_items';
const MOVEMENTS = 'inventory_movements';

const EDITABLE_FIELDS = [
  'name',
  'category',
  'partNumber',
  'brand',
  'origin',
  'supplier',
  'location',
  'unit',
  'minStock',
  'purchaseCost',
  'salePrice',
  'serialNumber',
  'photoUrls',
] as const;

export type InventoryItemDraft = Pick<InventoryItem, Exclude<(typeof EDITABLE_FIELDS)[number], 'serialNumber' | 'photoUrls'>> &
  Partial<Pick<InventoryItem, 'serialNumber' | 'photoUrls'>>;

export type InventoryItemUpdate = Partial<InventoryItemDraft>;

export interface StockChange {
  quantity: number;
  unitCost?: number;
  reason?: string;
  carId?: string;
  repairId?: string;
  licensePlate?: string;
}

export interface ConsumptionContext {
  workshopId: string;
  carId: string;
  repairId: string;
  licensePlate: string;
  createdBy: string;
}

export class InsufficientStockError extends Error {
  constructor(
    public readonly itemId: string,
    public readonly itemName: string,
    public readonly available: number
  ) {
    super(`Giacenza insufficiente per ${itemName}: disponibili ${available}`);
    this.name = 'InsufficientStockError';
  }
}

const movementTime = (movement: InventoryMovement) => movement.createdAt?.toMillis?.() ?? 0;

const assertPositive = (quantity: number) => {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('La quantità deve essere maggiore di zero');
  }
};

// Più righe dello stesso pezzo nella stessa transazione partono dallo stesso snapshot
const consumedInTransaction = new WeakMap<Transaction, Map<string, number>>();

export const inventoryItemRef = (itemId: string): DocumentReference => doc(db, ITEMS, itemId);

/**
 * Scarica un pezzo dentro una transazione già aperta, usando la sola scrittura.
 *
 * In una transazione Firestore tutte le letture precedono tutte le scritture: il
 * chiamante legge prima ogni scheda con transaction.get(inventoryItemRef(itemId)), una
 * sola volta per pezzo, e chiama questa funzione solo dopo. Vanno passati solo i pezzi
 * che soddisfano isStockPart.
 *
 * L'id del movimento è fisso e le regole vietano l'update dei movimenti: una seconda
 * chiusura dello stesso intervento fallisce invece di scaricare due volte.
 *
 * Lancia InsufficientStockError se la giacenza non basta, annullando la transazione.
 */
export const applyConsumptionInTransaction = (
  transaction: Transaction,
  itemSnap: DocumentSnapshot,
  part: RepairPart,
  context: ConsumptionContext
): void => {
  const quantity = Number(part.quantity);
  if (!(quantity > 0)) {
    return;
  }

  if (!itemSnap.exists()) {
    throw new InsufficientStockError(itemSnap.id, part.name, 0);
  }

  const item = itemSnap.data() as InventoryItem;
  const consumed = consumedInTransaction.get(transaction) ?? new Map<string, number>();
  consumedInTransaction.set(transaction, consumed);

  const available = roundQuantity(item.quantityOnHand - (consumed.get(itemSnap.id) ?? 0));
  if (quantity > available) {
    throw new InsufficientStockError(itemSnap.id, item.name, available);
  }

  consumed.set(itemSnap.id, roundQuantity((consumed.get(itemSnap.id) ?? 0) + quantity));
  transaction.update(itemSnap.ref, {
    quantityOnHand: roundQuantity(available - quantity),
    updatedAt: serverTimestamp(),
  });
  transaction.set(doc(db, MOVEMENTS, `${context.repairId}_${part.id}`), {
    workshopId: context.workshopId,
    itemId: itemSnap.id,
    itemName: item.name,
    type: 'consumption',
    quantity: -quantity,
    unitCost: item.purchaseCost ?? 0,
    carId: context.carId,
    repairId: context.repairId,
    licensePlate: context.licensePlate,
    createdAt: serverTimestamp(),
    createdBy: context.createdBy,
  });
};

export class InventoryService {
  private static instance: InventoryService;

  private constructor() {}

  public static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService();
    }
    return InventoryService.instance;
  }

  // Solo filtri di uguaglianza: l'ordinamento sul dispositivo evita indici compositi
  async getItems(workshopId: string, includeArchived = false): Promise<InventoryItem[]> {
    const snapshot = await getDocs(query(collection(db, ITEMS), where('workshopId', '==', workshopId)));

    return snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }) as InventoryItem)
      .filter((item) => includeArchived || !item.archived)
      .sort((a, b) => a.name.localeCompare(b.name, 'it'));
  }

  async getItem(itemId: string): Promise<InventoryItem | null> {
    const snapshot = await getDoc(inventoryItemRef(itemId));
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as InventoryItem) : null;
  }

  // La giacenza nasce a zero: l'eventuale carico iniziale passa da un movimento
  async createItem(
    workshopId: string,
    draft: InventoryItemDraft,
    initialQuantity = 0
  ): Promise<string> {
    const itemRef = doc(collection(db, ITEMS));
    const quantity = roundQuantity(initialQuantity);
    const batch = writeBatch(db);

    batch.set(itemRef, {
      ...withoutUndefined(draft),
      workshopId,
      quantityOnHand: quantity,
      photoUrls: draft.photoUrls ?? [],
      archived: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (quantity > 0) {
      batch.set(doc(collection(db, MOVEMENTS)), {
        workshopId,
        itemId: itemRef.id,
        itemName: draft.name,
        type: 'load',
        quantity,
        unitCost: draft.purchaseCost,
        reason: 'Carico iniziale',
        createdAt: serverTimestamp(),
        createdBy: workshopId,
      });
    }

    await batch.commit();
    return itemRef.id;
  }

  // Elenco chiuso di campi: la giacenza cambia solo attraverso i movimenti
  async updateItem(itemId: string, updates: InventoryItemUpdate): Promise<void> {
    const allowed = Object.fromEntries(EDITABLE_FIELDS.map((field) => [field, updates[field]]));
    await updateDoc(inventoryItemRef(itemId), {
      ...withoutUndefined(allowed),
      updatedAt: serverTimestamp(),
    });
  }

  // Le schede non si cancellano: i movimenti devono continuare a puntare a qualcosa
  async archiveItem(itemId: string): Promise<void> {
    await updateDoc(inventoryItemRef(itemId), { archived: true, updatedAt: serverTimestamp() });
  }

  async loadStock(itemId: string, change: StockChange, userId: string): Promise<void> {
    assertPositive(change.quantity);
    await this.changeStock(itemId, 'load', change, userId, () => change.quantity);
  }

  // Un pezzo che rientra a magazzino, per esempio smontato da un intervento
  async returnStock(itemId: string, change: StockChange, userId: string): Promise<void> {
    assertPositive(change.quantity);
    await this.changeStock(itemId, 'return', change, userId, () => change.quantity);
  }

  // change.quantity è la giacenza contata: il movimento registra la differenza
  async adjustStock(itemId: string, change: StockChange, userId: string): Promise<void> {
    if (!Number.isFinite(change.quantity) || change.quantity < 0) {
      throw new Error('La giacenza non può essere negativa');
    }
    await this.changeStock(itemId, 'adjustment', change, userId, (onHand) => change.quantity - onHand);
  }

  async getItemMovements(workshopId: string, itemId: string): Promise<InventoryMovement[]> {
    return this.getMovements(workshopId, 'itemId', itemId);
  }

  async getRepairMovements(workshopId: string, repairId: string): Promise<InventoryMovement[]> {
    return this.getMovements(workshopId, 'repairId', repairId);
  }

  async uploadItemPhoto(userId: string, itemId: string, uri: string): Promise<string> {
    const { url } = await UploadService.uploadImage(uri, {
      path: `vehicles/${userId}/inventory/${itemId}/${Date.now()}.jpg`,
    });

    await updateDoc(inventoryItemRef(itemId), { photoUrls: arrayUnion(url), updatedAt: serverTimestamp() });
    return url;
  }

  private async changeStock(
    itemId: string,
    type: InventoryMovementType,
    { quantity: _quantity, ...details }: StockChange,
    userId: string,
    getDelta: (onHand: number) => number
  ): Promise<void> {
    const itemRef = inventoryItemRef(itemId);

    await runTransaction(db, async (transaction) => {
      const itemSnap = await transaction.get(itemRef);
      if (!itemSnap.exists()) {
        throw new Error('Pezzo non trovato');
      }

      const item = itemSnap.data() as InventoryItem;
      const delta = roundQuantity(getDelta(item.quantityOnHand));
      if (delta === 0) {
        return;
      }

      transaction.update(itemRef, {
        quantityOnHand: roundQuantity(item.quantityOnHand + delta),
        updatedAt: serverTimestamp(),
      });
      transaction.set(doc(collection(db, MOVEMENTS)), {
        ...withoutUndefined(details),
        workshopId: item.workshopId,
        itemId,
        itemName: item.name,
        type,
        quantity: delta,
        createdAt: serverTimestamp(),
        createdBy: userId,
      });
    });
  }

  private async getMovements(
    workshopId: string,
    field: 'itemId' | 'repairId',
    value: string
  ): Promise<InventoryMovement[]> {
    const snapshot = await getDocs(
      query(
        collection(db, MOVEMENTS),
        where('workshopId', '==', workshopId),
        where(field, '==', value)
      )
    );

    return snapshot.docs
      .map((movement) => ({ id: movement.id, ...movement.data() }) as InventoryMovement)
      .sort((a, b) => movementTime(b) - movementTime(a));
  }
}

export default InventoryService.getInstance();

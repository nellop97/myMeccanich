// src/utils/inventoryStock.ts - Calcoli del magazzino, senza accesso a Firebase
import type { Repair, RepairPart, WorkshopCar } from '../store/workshopStore';
import type { InventoryItem, InventoryUnit } from '../types/inventory.types';
import { toDayString } from './calendarGrid';
import { guessMaintenanceType } from './maintenanceType';

export const UNKNOWN_SUPPLIER = 'Fornitore non indicato';

const FREQUENT_PART_DAYS = 90;
const FREQUENT_PART_USES = 3;
const SIMILAR_DESCRIPTION_RATIO = 0.5;

export interface InventoryItemWithStock extends InventoryItem {
  committed: number;
  available: number;
}

export interface PurchaseLineCar {
  carId: string;
  repairId: string;
  licensePlate: string;
  make: string;
  model: string;
  scheduledDate: string;
  quantity: number;
}

export interface PurchaseLine {
  key: string;
  itemId?: string; // Assente per i pezzi previsti senza scheda
  name: string;
  partNumber: string;
  brand: string;
  unit: InventoryUnit;
  needed: number;
  onHand: number;
  shortage: number;
  reorder: number;
  quantityToBuy: number;
  cars: PurchaseLineCar[];
}

export interface PurchaseGroup {
  supplier: string;
  lines: PurchaseLine[];
}

export interface SuggestedPart {
  key: string;
  inventoryItemId?: string;
  name: string;
  partNumber: string;
  brand: string;
  averageQuantity: number;
  uses: number;
  sameVehicleUses: number;
}

export interface FrequentPart {
  key: string;
  name: string;
  partNumber: string;
  brand: string;
  uses: number;
  totalQuantity: number;
}

export const roundQuantity = (value: number) => Math.round((value + Number.EPSILON) * 1000) / 1000;

const toQuantity = (value: unknown) => {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
};

const dayOffset = (today: Date, days: number) =>
  toDayString(new Date(today.getFullYear(), today.getMonth(), today.getDate() + days));

const normalize = (text?: string) => (text ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

const catalogKey = (part: Pick<RepairPart, 'name' | 'partNumber'>) =>
  normalize(part.partNumber) || normalize(part.name);

const partKey = (part: RepairPart) => part.inventoryItemId || catalogKey(part);

// Il vecchio stato in-progress è ancora presente su alcuni interventi storici
const isPlanned = ({ status }: Repair) =>
  status === 'pending' || status === 'in_progress' || (status as string) === 'in-progress';

const isClosed = ({ status }: Repair) => status === 'ready' || status === 'completed';

// Comprato per il lavoro o portato dal cliente: non tocca la giacenza
export const isStockPart = (part: RepairPart) =>
  !!part.inventoryItemId && (part.source ?? 'stock') === 'stock';

const eachPart = (
  cars: WorkshopCar[],
  accepts: (repair: Repair) => boolean,
  visit: (part: RepairPart, repair: Repair, car: WorkshopCar) => void
) => {
  cars.forEach((car) =>
    (car.repairs ?? []).filter(accepts).forEach((repair) =>
      (repair.parts ?? []).forEach((part) => visit(part, repair, car))
    )
  );
};

export const getCommittedByItem = (cars: WorkshopCar[]): Map<string, number> => {
  const committed = new Map<string, number>();

  eachPart(cars, isPlanned, (part) => {
    if (isStockPart(part)) {
      const itemId = part.inventoryItemId as string;
      committed.set(itemId, roundQuantity((committed.get(itemId) ?? 0) + toQuantity(part.quantity)));
    }
  });

  return committed;
};

export const withStockLevels = (items: InventoryItem[], cars: WorkshopCar[]): InventoryItemWithStock[] => {
  const committed = getCommittedByItem(cars);

  return items.map((item) => {
    const itemCommitted = committed.get(item.id) ?? 0;
    return {
      ...item,
      committed: itemCommitted,
      available: roundQuantity(item.quantityOnHand - itemCommitted),
    };
  });
};

const addCar = (line: PurchaseLine, part: RepairPart, repair: Repair, car: WorkshopCar) => {
  const quantity = toQuantity(part.quantity);
  line.needed = roundQuantity(line.needed + quantity);

  const existing = line.cars.find((entry) => entry.repairId === repair.id);
  if (existing) {
    existing.quantity = roundQuantity(existing.quantity + quantity);
    return;
  }

  line.cars.push({
    carId: car.id,
    repairId: repair.id,
    licensePlate: car.licensePlate,
    make: car.make,
    model: car.model,
    scheduledDate: repair.scheduledDate.slice(0, 10),
    quantity,
  });
};

const emptyLine = (key: string, fields: Partial<PurchaseLine>): PurchaseLine => ({
  key,
  name: '',
  partNumber: '',
  brand: '',
  unit: 'pz',
  needed: 0,
  onHand: 0,
  shortage: 0,
  reorder: 0,
  quantityToBuy: 0,
  cars: [],
  ...fields,
});

/**
 * Lista della spesa per i prossimi giorni, raggruppata per fornitore. Gli interventi
 * in ritardo restano nel fabbisogno: finché sono aperti il pezzo serve comunque
 */
export const buildPurchaseList = (
  items: InventoryItem[],
  cars: WorkshopCar[],
  horizonDays: number,
  today: Date
): PurchaseGroup[] => {
  const lastDay = dayOffset(today, horizonDays);
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const itemLines = new Map<string, PurchaseLine>();
  const otherLines = new Map<string, PurchaseLine>();

  const isDue = (repair: Repair) =>
    isPlanned(repair) && !!repair.scheduledDate && repair.scheduledDate.slice(0, 10) <= lastDay;

  eachPart(cars, isDue, (part, repair, car) => {
    if (!toQuantity(part.quantity) || part.source === 'customer_supplied') {
      return;
    }

    const item = isStockPart(part) ? itemsById.get(part.inventoryItemId as string) : undefined;
    if (item) {
      const line = itemLines.get(item.id) ?? emptyLine(item.id, { itemId: item.id });
      itemLines.set(item.id, line);
      addCar(line, part, repair, car);
      return;
    }

    const key = `part:${catalogKey(part)}`;
    const line =
      otherLines.get(key) ??
      emptyLine(key, { name: part.name, partNumber: part.partNumber ?? '', brand: part.brand ?? '' });
    otherLines.set(key, line);
    addCar(line, part, repair, car);
  });

  const groups = new Map<string, PurchaseGroup>();
  const addToGroup = (supplier: string, line: PurchaseLine) => {
    const label = supplier.trim() || UNKNOWN_SUPPLIER;
    const key = normalize(label);
    const group = groups.get(key) ?? { supplier: label, lines: [] };
    groups.set(key, group);
    group.lines.push(line);
  };

  items.forEach((item) => {
    const line = itemLines.get(item.id) ?? emptyLine(item.id, { itemId: item.id });
    if (item.archived && !line.needed) {
      return;
    }

    const remaining = roundQuantity(item.quantityOnHand - line.needed);
    const shortage = Math.max(0, -remaining);
    const reorder = remaining < item.minStock ? roundQuantity(item.minStock - Math.max(0, remaining)) : 0;
    const quantityToBuy = roundQuantity(shortage + reorder);

    if (quantityToBuy > 0) {
      addToGroup(item.supplier, {
        ...line,
        name: item.name,
        partNumber: item.partNumber,
        brand: item.brand,
        unit: item.unit,
        onHand: item.quantityOnHand,
        shortage,
        reorder,
        quantityToBuy,
      });
    }
  });

  // Il fornitore sta solo sulle schede: le righe degli interventi le legge anche il cliente
  otherLines.forEach((line) =>
    addToGroup(UNKNOWN_SUPPLIER, { ...line, shortage: line.needed, quantityToBuy: line.needed })
  );

  return [...groups.values()]
    .map((group) => ({
      ...group,
      lines: group.lines.sort((a, b) => a.name.localeCompare(b.name, 'it')),
    }))
    .sort((a, b) => {
      if (a.supplier === UNKNOWN_SUPPLIER) return 1;
      if (b.supplier === UNKNOWN_SUPPLIER) return -1;
      return a.supplier.localeCompare(b.supplier, 'it');
    });
};

const descriptionWords = (description: string) =>
  new Set(normalize(description).split(/[^\p{L}\p{N}]+/u).filter((word) => word.length >= 3));

// "altro" raccoglie lavori diversi tra loro: lì contano le parole della descrizione
const isSimilarWork = (description: string, other: string) => {
  const type = guessMaintenanceType(description);
  if (type !== guessMaintenanceType(other)) {
    return false;
  }
  if (type !== 'altro') {
    return true;
  }

  const words = descriptionWords(description);
  const otherWords = descriptionWords(other);
  const shared = [...words].filter((word) => otherWords.has(word)).length;
  const total = new Set([...words, ...otherWords]).size;
  return total > 0 && shared / total >= SIMILAR_DESCRIPTION_RATIO;
};

/**
 * Pezzi usati negli interventi chiusi di tipo simile. Prima quelli montati sullo stesso
 * modello, poi i più frequenti in assoluto
 */
export const suggestPartsForRepair = (
  description: string,
  make: string,
  model: string,
  cars: WorkshopCar[]
): SuggestedPart[] => {
  const suggestions = new Map<string, SuggestedPart & { totalQuantity: number }>();
  const accepts = (repair: Repair) => isClosed(repair) && isSimilarWork(description, repair.description);

  eachPart(cars, accepts, (part, _repair, car) => {
    const key = partKey(part);
    if (!key) {
      return;
    }

    const entry = suggestions.get(key) ?? {
      key,
      inventoryItemId: part.inventoryItemId,
      name: part.name,
      partNumber: part.partNumber ?? '',
      brand: part.brand ?? '',
      averageQuantity: 0,
      uses: 0,
      sameVehicleUses: 0,
      totalQuantity: 0,
    };
    suggestions.set(key, entry);

    entry.uses += 1;
    entry.totalQuantity += toQuantity(part.quantity);
    if (normalize(car.make) === normalize(make) && normalize(car.model) === normalize(model)) {
      entry.sameVehicleUses += 1;
    }
  });

  return [...suggestions.values()]
    .map(({ totalQuantity, ...entry }) => ({
      ...entry,
      averageQuantity: roundQuantity(totalQuantity / entry.uses),
    }))
    .sort((a, b) => b.sameVehicleUses - a.sameVehicleUses || b.uses - a.uses);
};

// Pezzi comprati di continuo per i lavori: conviene dar loro una scheda di magazzino
export const frequentPartsNotInStock = (
  cars: WorkshopCar[],
  items: InventoryItem[],
  today: Date = new Date()
): FrequentPart[] => {
  const firstDay = dayOffset(today, -FREQUENT_PART_DAYS);
  const lastDay = dayOffset(today, 0);
  const known = new Set(
    items.flatMap((item) => [normalize(item.partNumber), normalize(item.name)]).filter(Boolean)
  );
  const parts = new Map<string, FrequentPart>();

  const accepts = (repair: Repair) => {
    const day = (repair.completedAt || repair.scheduledDate || '').slice(0, 10);
    return isClosed(repair) && day >= firstDay && day <= lastDay;
  };

  eachPart(cars, accepts, (part) => {
    const key = catalogKey(part);
    const hasCard =
      part.inventoryItemId || known.has(normalize(part.partNumber)) || known.has(normalize(part.name));
    if (!key || hasCard || part.source === 'customer_supplied') {
      return;
    }

    const entry = parts.get(key) ?? {
      key,
      name: part.name,
      partNumber: part.partNumber ?? '',
      brand: part.brand ?? '',
      uses: 0,
      totalQuantity: 0,
    };
    parts.set(key, entry);

    entry.uses += 1;
    entry.totalQuantity = roundQuantity(entry.totalQuantity + toQuantity(part.quantity));
  });

  return [...parts.values()]
    .filter((part) => part.uses >= FREQUENT_PART_USES)
    .sort((a, b) => b.uses - a.uses);
};

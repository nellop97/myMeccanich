// src/screens/mechanic/inventoryFormat.ts - Testi e numeri delle schermate di magazzino
import type { Timestamp } from 'firebase/firestore';
import type { InventoryMovementType, InventoryUnit } from '../../types/inventory.types';

export const MOVEMENT_LABELS: Record<InventoryMovementType, string> = {
  load: 'Carico',
  consumption: 'Consumo',
  adjustment: 'Rettifica',
  return: 'Reso',
};

export const formatQuantity = (quantity: number) => String(quantity).replace('.', ',');

export const formatStock = (quantity: number, unit: InventoryUnit) => `${formatQuantity(quantity)} ${unit}`;

// Il segno meno tipografico si legge meglio accanto alle cifre
export const formatSignedStock = (quantity: number, unit: InventoryUnit) =>
  `${quantity > 0 ? '+' : '−'}${formatStock(Math.abs(quantity), unit)}`;

// La data arriva come AAAA-MM-GG: passare da Date la sposterebbe con il fuso orario
export const formatDay = (day: string) => day.split('-').reverse().join('/');

export const formatTimestamp = (timestamp?: Timestamp) =>
  timestamp?.toDate?.().toLocaleDateString('it-IT') ?? 'Data non disponibile';

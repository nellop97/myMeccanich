// src/utils/interventionTotals.ts - Importi di un intervento, in centesimi per evitare errori di arrotondamento

export const VAT_RATE = 22;

export interface PricedPart {
  name: string;
  quantity: number;
  unitPrice: number;
}

const toCents = (value: number) => Math.round(value * 100);

export const getPartTotal = ({ quantity, unitPrice }: PricedPart) =>
  Math.round(quantity * toCents(unitPrice)) / 100;

export const calculateInterventionTotals = (parts: PricedPart[], laborCost: number) => {
  const partsCents = parts.reduce((sum, part) => sum + toCents(getPartTotal(part)), 0);
  const subtotalCents = partsCents + toCents(laborCost);
  const vatCents = Math.round((subtotalCents * VAT_RATE) / 100);

  return {
    partsCost: partsCents / 100,
    laborCost: toCents(laborCost) / 100,
    subtotal: subtotalCents / 100,
    vatAmount: vatCents / 100,
    total: (subtotalCents + vatCents) / 100,
  };
};

// Accetta sia la virgola sia il punto: "12,50" e "12.50" sono lo stesso importo
export const parseAmount = (text: string) => {
  const value = Number(text.trim().replace(',', '.'));
  return text.trim() !== '' && Number.isFinite(value) && value >= 0 ? value : null;
};

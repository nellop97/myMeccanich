// src/utils/maintenanceType.ts - Tipo di lavoro dedotto dalla descrizione dell'intervento

const MAINTENANCE_TYPES = ['tagliando', 'gomme', 'freni', 'carrozzeria', 'motore', 'elettronica'];

export const guessMaintenanceType = (description: string) =>
  MAINTENANCE_TYPES.find((type) => description.toLowerCase().includes(type)) ?? 'altro';

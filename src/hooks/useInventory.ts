// src/hooks/useInventory.ts - Pezzi dell'officina con impegnato e disponibile
import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import InventoryService from '../services/InventoryService';
import { useWorkshopStore } from '../store/workshopStore';
import type { InventoryItem } from '../types/inventory.types';
import { withStockLevels } from '../utils/inventoryStock';

export const useInventory = (workshopId?: string) => {
  const cars = useWorkshopStore((state) => state.cars);
  const fetchCars = useWorkshopStore((state) => state.fetchCars);
  const [rawItems, setRawItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastRequest = useRef(0);

  const reload = useCallback(async () => {
    const request = ++lastRequest.current;
    if (!workshopId) {
      setRawItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Gli interventi servono sempre: senza, l'impegnato risulterebbe zero
      const [loaded] = await Promise.all([InventoryService.getItems(workshopId), fetchCars(workshopId)]);
      const carsError = useWorkshopStore.getState().error;
      if (request === lastRequest.current) {
        setRawItems(loaded);
        setError(carsError);
      }
    } catch (loadError: any) {
      console.error('Errore caricamento magazzino:', loadError);
      if (request === lastRequest.current) {
        setError(loadError?.message ?? 'Impossibile caricare il magazzino');
      }
    } finally {
      if (request === lastRequest.current) {
        setLoading(false);
      }
    }
  }, [workshopId, fetchCars]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const items = useMemo(() => withStockLevels(rawItems, cars), [rawItems, cars]);

  return { items, cars, loading, error, reload };
};

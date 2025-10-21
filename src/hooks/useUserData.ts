// src/hooks/useUserData.ts - Hook per gestire i dati utente da Firebase
import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  onSnapshot,
  doc,
  getDoc 
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useUser } from './useAuthSync';
import { useStore } from '../store';

// Interfacce TypeScript
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  licensePlate: string;
  vin?: string;
  currentMileage: number;
  purchaseDate?: any;
  purchasePrice?: number;
  purchaseMileage?: number;
  insuranceCompany?: string;
  insuranceExpiry?: any;
  notes?: string;
  ownerId: string;
  sharedWith?: string[];
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: string;
  description: string;
  cost: number;
  mileage?: number;
  completedDate: any;
  nextDueDate?: any;
  nextDueMileage?: number;
  status: 'completed' | 'pending' | 'overdue';
  mechanicId?: string;
  workshopId?: string;
  parts?: Array<{
    name: string;
    partNumber?: string;
    cost: number;
  }>;
  notes?: string;
  ownerId: string;
  createdAt: any;
  updatedAt: any;
}

export interface Reminder {
  id: string;
  vehicleId?: string;
  title: string;
  description: string;
  dueDate: any;
  status: 'active' | 'completed' | 'overdue';
  type: 'maintenance' | 'insurance' | 'inspection' | 'other';
  priority: 'low' | 'medium' | 'high';
  ownerId: string;
  createdAt: any;
  updatedAt: any;
}

export interface FuelRecord {
  id: string;
  vehicleId: string;
  date: any;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  mileage: number;
  fuelType: string;
  station?: string;
  notes?: string;
  ownerId: string;
  createdAt: any;
}

export interface Expense {
  id: string;
  vehicleId: string;
  category: string;
  description: string;
  amount: number;
  date: any;
  notes?: string;
  ownerId: string;
  createdAt: any;
}

// Hook principale per i dati utente
export const useUserData = () => {
  const { authUser, isAuthenticated } = useUser();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [recentMaintenance, setRecentMaintenance] = useState<MaintenanceRecord[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [recentFuelRecords, setRecentFuelRecords] = useState<FuelRecord[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recupera tutti i veicoli dell'utente
  const fetchVehicles = useCallback(async () => {
    if (!authUser?.uid) {
      console.log('🚫 [useUserData] fetchVehicles: authUser.uid mancante');
      return [];
    }

    try {
      console.log('🔍 [useUserData] fetchVehicles: Iniziando query per UID:', authUser.uid);
      
      const vehiclesQuery = query(
        collection(db, 'vehicles'),
        where('ownerId', '==', authUser.uid),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(vehiclesQuery);
      console.log('📊 [useUserData] fetchVehicles: Query completata, documenti trovati:', snapshot.size);
      
      const vehiclesData = snapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        console.log('🚗 [useUserData] fetchVehicles: Documento veicolo:', data);
        return data;
      }) as Vehicle[];
      
      setVehicles(vehiclesData);
      console.log('✅ [useUserData] fetchVehicles: State aggiornato con', vehiclesData.length, 'veicoli');
      return vehiclesData;
    } catch (error: any) {
      console.error('❌ [useUserData] fetchVehicles: Errore:', error);
      console.error('❌ [useUserData] fetchVehicles: Dettagli errore:', {
        code: error.code,
        message: error.message,
        details: error.details
      });
      return [];
    }
  }, [authUser?.uid]);

  // Recupera manutenzioni recenti
  const fetchRecentMaintenance = useCallback(async (vehicleIds: string[]) => {
    if (vehicleIds.length === 0) {
      console.log('🚫 [useUserData] fetchRecentMaintenance: Nessun veicolo fornito');
      return [];
    }

    try {
      console.log('🔍 [useUserData] fetchRecentMaintenance: Iniziando query per veicoli:', vehicleIds);
      
      // Firestore ha un limite di 10 elementi per la clausola 'in'
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < vehicleIds.length; i += batchSize) {
        const batch = vehicleIds.slice(i, i + batchSize);
        batches.push(batch);
      }

      console.log('📦 [useUserData] fetchRecentMaintenance: Diviso in', batches.length, 'batch');

      let allMaintenance: MaintenanceRecord[] = [];

      for (const batch of batches) {
        console.log('🔄 [useUserData] fetchRecentMaintenance: Processando batch:', batch);
        
        const maintenanceQuery = query(
          collection(db, 'maintenance_records'),
          where('vehicleId', 'in', batch),
          where('status', '==', 'completed'),
          orderBy('completedDate', 'desc'),
          limit(5)
        );
        
        const snapshot = await getDocs(maintenanceQuery);
        console.log('📊 [useUserData] fetchRecentMaintenance: Batch query completata, documenti:', snapshot.size);
        
        const maintenanceData = snapshot.docs.map(doc => {
          const data = { id: doc.id, ...doc.data() };
          console.log('🔧 [useUserData] fetchRecentMaintenance: Documento manutenzione:', data);
          return data;
        }) as MaintenanceRecord[];
        
        allMaintenance = [...allMaintenance, ...maintenanceData];
      }

      // Ordina per data e prendi solo i più recenti
      allMaintenance.sort((a, b) => {
        const dateA = a.completedDate?.toDate?.() || new Date(0);
        const dateB = b.completedDate?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      const recentData = allMaintenance.slice(0, 5);
      console.log('✅ [useUserData] fetchRecentMaintenance: Totale manutenzioni trovate:', allMaintenance.length, 'Prime 5:', recentData.length);
      
      setRecentMaintenance(recentData);
      return recentData;
    } catch (error: any) {
      console.error('❌ [useUserData] fetchRecentMaintenance: Errore:', error);
      console.error('❌ [useUserData] fetchRecentMaintenance: Dettagli errore:', {
        code: error.code,
        message: error.message,
        details: error.details
      });
      return [];
    }
  }, []);

  // Recupera promemoria imminenti
  const fetchUpcomingReminders = useCallback(async () => {
    if (!authUser?.uid) return [];

    try {
      const remindersQuery = query(
        collection(db, 'reminders'),
        where('ownerId', '==', authUser.uid),
        where('status', 'in', ['active', 'overdue']),
        orderBy('dueDate', 'asc'),
        limit(10)
      );
      
      const snapshot = await getDocs(remindersQuery);
      const remindersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reminder[];
      
      setUpcomingReminders(remindersData);
      return remindersData;
    } catch (error: any) {
      console.error('❌ Errore nel recupero promemoria:', error);
      return [];
    }
  }, [authUser?.uid]);

  // Recupera record carburante recenti
  const fetchRecentFuelRecords = useCallback(async (vehicleIds: string[]) => {
    if (vehicleIds.length === 0) return [];

    try {
      const batchSize = 10;
      let allFuelRecords: FuelRecord[] = [];

      for (let i = 0; i < vehicleIds.length; i += batchSize) {
        const batch = vehicleIds.slice(i, i + batchSize);
        
        const fuelQuery = query(
          collection(db, 'fuel_records'),
          where('vehicleId', 'in', batch),
          orderBy('date', 'desc'),
          limit(5)
        );
        
        const snapshot = await getDocs(fuelQuery);
        const fuelData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FuelRecord[];
        
        allFuelRecords = [...allFuelRecords, ...fuelData];
      }

      // Ordina per data
      allFuelRecords.sort((a, b) => {
        const dateA = a.date?.toDate?.() || new Date(0);
        const dateB = b.date?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      const recentData = allFuelRecords.slice(0, 5);
      setRecentFuelRecords(recentData);
      return recentData;
    } catch (error: any) {
      console.error('❌ Errore nel recupero record carburante:', error);
      return [];
    }
  }, []);

  // Recupera spese recenti
  const fetchRecentExpenses = useCallback(async (vehicleIds: string[]) => {
    if (vehicleIds.length === 0) return [];

    try {
      const batchSize = 10;
      let allExpenses: Expense[] = [];

      for (let i = 0; i < vehicleIds.length; i += batchSize) {
        const batch = vehicleIds.slice(i, i + batchSize);
        
        const expensesQuery = query(
          collection(db, 'expenses'),
          where('vehicleId', 'in', batch),
          orderBy('date', 'desc'),
          limit(5)
        );
        
        const snapshot = await getDocs(expensesQuery);
        const expensesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Expense[];
        
        allExpenses = [...allExpenses, ...expensesData];
      }

      // Ordina per data
      allExpenses.sort((a, b) => {
        const dateA = a.date?.toDate?.() || new Date(0);
        const dateB = b.date?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      const recentData = allExpenses.slice(0, 5);
      setRecentExpenses(recentData);
      return recentData;
    } catch (error: any) {
      console.error('❌ Errore nel recupero spese:', error);
      return [];
    }
  }, []);

  // Funzione principale per caricare tutti i dati
  const fetchAllUserData = useCallback(async () => {
    if (!authUser?.uid || !isAuthenticated) {
      console.log('🚫 [useUserData] fetchAllUserData: Utente non autenticato o UID mancante');
      console.log('  - authUser?.uid:', authUser?.uid);
      console.log('  - isAuthenticated:', isAuthenticated);
      setLoading(false);
      return;
    }

    try {
      console.log('🚀 [useUserData] fetchAllUserData: INIZIATO caricamento dati per UID:', authUser.uid);
      setLoading(true);
      setError(null);

      // 1. Prima carica i veicoli
      console.log('📝 [useUserData] fetchAllUserData: Passo 1 - Caricamento veicoli');
      const vehiclesData = await fetchVehicles();
      const vehicleIds = vehiclesData.map(v => v.id);
      console.log('🚗 [useUserData] fetchAllUserData: Veicoli caricati:', vehicleIds);

      // 2. Poi carica tutti gli altri dati in parallelo
      console.log('📝 [useUserData] fetchAllUserData: Passo 2 - Caricamento dati in parallelo');
      const promises = [
        fetchRecentMaintenance(vehicleIds),
        fetchUpcomingReminders(),
        fetchRecentFuelRecords(vehicleIds),
        fetchRecentExpenses(vehicleIds),
      ];

      const results = await Promise.all(promises);
      console.log('✅ [useUserData] fetchAllUserData: Dati paralleli completati:', {
        maintenance: results[0]?.length || 0,
        reminders: results[1]?.length || 0,
        fuelRecords: results[2]?.length || 0,
        expenses: results[3]?.length || 0
      });

      console.log('🎉 [useUserData] fetchAllUserData: COMPLETATO con successo!');
    } catch (error: any) {
      console.error('❌ [useUserData] fetchAllUserData: ERRORE generale:', error);
      console.error('❌ [useUserData] fetchAllUserData: Stack trace:', error.stack);
      setError(error.message || 'Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
      console.log('🏁 [useUserData] fetchAllUserData: Loading = false');
    }
  }, [
    authUser?.uid, 
    isAuthenticated, 
    fetchVehicles, 
    fetchRecentMaintenance, 
    fetchUpcomingReminders,
    fetchRecentFuelRecords,
    fetchRecentExpenses
  ]);

  // Effetto per caricare i dati quando l'utente è autenticato
  useEffect(() => {
    console.log('🔄 [useUserData] useEffect triggered:');
    console.log('  - isAuthenticated:', isAuthenticated);
    console.log('  - authUser?.uid:', authUser?.uid);
    
    if (isAuthenticated && authUser?.uid) {
      console.log('✅ [useUserData] Condizioni soddisfatte, avvio fetchAllUserData');
      fetchAllUserData();
    } else {
      console.log('🔄 [useUserData] Reset dati - utente non autenticato');
      // Reset dei dati se l'utente non è autenticato
      setVehicles([]);
      setRecentMaintenance([]);
      setUpcomingReminders([]);
      setRecentFuelRecords([]);
      setRecentExpenses([]);
      setLoading(false);
      setError(null);
    }
  }, [isAuthenticated, authUser?.uid, fetchAllUserData]);

  // Funzione di refresh
  const refreshData = useCallback(async () => {
    await fetchAllUserData();
  }, [fetchAllUserData]);

  // Funzione per ottenere un veicolo specifico
  const getVehicleById = useCallback((vehicleId: string): Vehicle | undefined => {
    return vehicles.find(v => v.id === vehicleId);
  }, [vehicles]);

  // Calcoli statistiche
  const stats = {
    vehiclesCount: vehicles.length,
    maintenanceCount: recentMaintenance.length,
    remindersCount: upcomingReminders.filter(r => r.status === 'active').length,
    overdueReminders: upcomingReminders.filter(r => r.status === 'overdue').length,
    totalMileage: vehicles.reduce((sum, v) => sum + (v.currentMileage || 0), 0),
    totalMaintenanceCost: recentMaintenance.reduce((sum, m) => sum + (m.cost || 0), 0),
    totalFuelCost: recentFuelRecords.reduce((sum, f) => sum + (f.totalCost || 0), 0),
    totalExpenses: recentExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
  };

  // Ottieni informazioni utente dallo store
  const { user: storeUser } = useStore();

  return {
    // Dati
    vehicles,
    recentMaintenance,
    upcomingReminders,
    recentFuelRecords,
    recentExpenses,

    // Stati
    loading,
    error,

    // Funzioni
    refreshData,
    fetchAllUserData,
    getVehicleById,

    // Statistiche
    stats,

    // Flags di convenienza
    hasVehicles: vehicles.length > 0,
    hasReminders: upcomingReminders.length > 0,
    hasOverdueReminders: upcomingReminders.some(r => r.status === 'overdue'),

    // Informazioni utente (per SettingsScreen)
    userName: storeUser?.name || authUser?.displayName || authUser?.email?.split('@')[0] || 'Utente',
    userEmail: storeUser?.email || authUser?.email || '',
    isMechanic: storeUser?.isMechanic || false,
    isAuthenticated: isAuthenticated && !!storeUser?.isLoggedIn,
    profileComplete: !!storeUser?.name && !!storeUser?.email,
  };
};

// Hook semplificato per ottenere solo i veicoli
export const useUserVehicles = () => {
  const { vehicles, loading, error, refreshData } = useUserData();
  
  return {
    vehicles,
    loading,
    error,
    refreshVehicles: refreshData,
    vehiclesCount: vehicles.length,
    hasVehicles: vehicles.length > 0,
  };
};

// Hook per ottenere le statistiche dell'utente
export const useUserStats = () => {
  const { stats, loading } = useUserData();

  return {
    ...stats,
    loading,
  };
};

// ====================================
// HOOKS AGGIUNTIVI PER SETTINGS
// ====================================

// Hook per gestire il tema dell'app
export const useAppTheme = () => {
  const { darkMode, preferences, setDarkMode, updatePreferences } = useStore();

  return {
    darkMode,
    preferences,
    setDarkMode,
    updatePreferences,
  };
};

// Hook per gestire le auto dell'utente
export const useUserCars = () => {
  const { vehicles, loading } = useUserData();

  return {
    cars: vehicles,
    carsCount: vehicles.length,
    loading,
  };
};

// Hook per lo stato generale dell'app
export const useAppState = () => {
  const { isLoading, error, clearError } = useStore();

  return {
    loading: isLoading,
    error,
    clearError,
  };
};
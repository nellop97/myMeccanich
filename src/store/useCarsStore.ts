// src/store/useCarsStore.ts - Store Auto con integrazione Firestore SISTEMATO
import { create } from 'zustand';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../services/firebase';

// ====================================
// INTERFACCE E TIPI
// ====================================

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  licensePlate: string;
  vin?: string;
  
  // Dati di acquisto
  purchaseDate?: string;
  purchasePrice?: number;
  purchaseMileage?: number;
  
  // Stato attuale
  currentMileage: number;
  lastUpdatedMileage?: string;
  
  // Assicurazione
  insuranceCompany?: string;
  insurancePolicy?: string;
  insuranceExpiry?: string;
  
  // Metadata
  ownerId: string;
  sharedWith?: string[];
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
  notes?: string;
  imageUrl?: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: 'routine' | 'repair' | 'inspection' | 'other';
  description: string;
  date: string;
  mileage?: number;
  cost: number;
  mechanicId?: string;
  workshopName?: string;
  parts?: string[];
  notes?: string;
  status: 'completed' | 'scheduled' | 'overdue';
  nextDueDate?: string;
  nextDueMileage?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface FuelRecord {
  id: string;
  vehicleId: string;
  date: string;
  mileage: number;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'lpg';
  isFullTank: boolean;
  stationName?: string;
  notes?: string;
  createdAt?: any;
}

export interface Expense {
  id: string;
  vehicleId: string;
  category: 'fuel' | 'maintenance' | 'insurance' | 'parking' | 'toll' | 'tax' | 'other';
  description: string;
  amount: number;
  date: string;
  mileage?: number;
  notes?: string;
  receipt?: string;
  createdAt?: any;
}

export interface VehicleStats {
  totalExpenses: number;
  maintenanceCount: number;
  avgFuelConsumption: number;
  totalFuelCost: number;
}

// ====================================
// INTERFACCIA DELLO STORE
// ====================================

interface CarsStore {
  // === STATI ===
  vehicles: Vehicle[];
  maintenanceRecords: MaintenanceRecord[];
  fuelRecords: FuelRecord[];
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  
  // Listener attivi
  unsubscribers: (() => void)[];
  
  // === METODI PER VEICOLI ===
  fetchUserVehicles: (userId: string) => Promise<void>;
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateVehicle: (vehicleId: string, updates: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (vehicleId: string) => Promise<void>;
  subscribeToVehicles: (userId: string) => void;
  
  // === METODI PER MANUTENZIONI ===
  fetchMaintenanceRecords: (vehicleId: string) => Promise<void>;
  addMaintenanceRecord: (record: Omit<MaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateMaintenanceRecord: (recordId: string, updates: Partial<MaintenanceRecord>) => Promise<void>;
  deleteMaintenanceRecord: (recordId: string) => Promise<void>;
  
  // === METODI PER CARBURANTE ===
  fetchFuelRecords: (vehicleId: string) => Promise<void>;
  addFuelRecord: (record: Omit<FuelRecord, 'id' | 'createdAt'>) => Promise<string>;
  updateFuelRecord: (recordId: string, updates: Partial<FuelRecord>) => Promise<void>;
  deleteFuelRecord: (recordId: string) => Promise<void>;
  
  // === METODI PER SPESE ===
  fetchExpenses: (vehicleId: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<string>;
  updateExpense: (expenseId: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  
  // === UTILITY ===
  // Funzioni principali per recuperare dati
  getVehicleById: (vehicleId: string) => Vehicle | undefined;
  getVehicleStats: (vehicleId: string) => VehicleStats;
  
  // Alias per compatibilità (funzioni deprecate ma mantenute per compatibilità)
  getCarById: (vehicleId: string) => Vehicle | undefined;
  getCarStats: (vehicleId: string) => VehicleStats;
  getCars: () => Vehicle[];
  
  // Funzioni specifiche per AddMaintenanceScreen
  addMaintenance: (vehicleId: string, maintenanceData: any) => Promise<string>;
  updateMileage: (vehicleId: string, newMileage: number) => Promise<void>;
  addReminder: (vehicleId: string, reminderData: any) => Promise<string>;
  
  // === CLEANUP ===
  cleanup: () => void;
  resetStore: () => void;
}

// ====================================
// CREAZIONE DELLO STORE
// ====================================

export const useCarsStore = create<CarsStore>((set, get) => ({
  // === STATO INIZIALE ===
  vehicles: [],
  maintenanceRecords: [],
  fuelRecords: [],
  expenses: [],
  isLoading: false,
  error: null,
  unsubscribers: [],
  
  // === METODI PER VEICOLI ===
  fetchUserVehicles: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const vehiclesQuery = query(
        collection(db, 'vehicles'),
        where('ownerId', '==', userId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(vehiclesQuery);
      const vehicles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vehicle[];
      
      set({ vehicles, isLoading: false });
    } catch (error: any) {
      console.error('Errore recupero veicoli:', error);
      set({ 
        error: error.message || 'Errore nel recupero dei veicoli',
        isLoading: false 
      });
    }
  },
  
  addVehicle: async (vehicle) => {
    set({ isLoading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'vehicles'), {
        ...vehicle,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      });
      
      // Aggiorna lo stato locale
      const newVehicle = {
        ...vehicle,
        id: docRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      set(state => ({
        vehicles: [newVehicle, ...state.vehicles],
        isLoading: false
      }));
      
      return docRef.id;
    } catch (error: any) {
      console.error('Errore aggiunta veicolo:', error);
      set({ 
        error: error.message || 'Errore nell\'aggiunta del veicolo',
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateVehicle: async (vehicleId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const vehicleRef = doc(db, 'vehicles', vehicleId);
      await updateDoc(vehicleRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      // Aggiorna lo stato locale
      set(state => ({
        vehicles: state.vehicles.map(v => 
          v.id === vehicleId ? { ...v, ...updates } : v
        ),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Errore aggiornamento veicolo:', error);
      set({ 
        error: error.message || 'Errore nell\'aggiornamento del veicolo',
        isLoading: false 
      });
      throw error;
    }
  },
  
  deleteVehicle: async (vehicleId) => {
    set({ isLoading: true, error: null });
    try {
      // Soft delete - marca come inattivo invece di eliminare
      const vehicleRef = doc(db, 'vehicles', vehicleId);
      await updateDoc(vehicleRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
      
      // Rimuovi dallo stato locale
      set(state => ({
        vehicles: state.vehicles.filter(v => v.id !== vehicleId),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Errore eliminazione veicolo:', error);
      set({ 
        error: error.message || 'Errore nell\'eliminazione del veicolo',
        isLoading: false 
      });
      throw error;
    }
  },
  
  subscribeToVehicles: (userId: string) => {
    // Cancella listener precedenti
    get().cleanup();
    
    const vehiclesQuery = query(
      collection(db, 'vehicles'),
      where('ownerId', '==', userId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(vehiclesQuery, 
      (snapshot) => {
        const vehicles = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Vehicle[];
        
        set({ vehicles, error: null });
      },
      (error) => {
        console.error('Errore subscription veicoli:', error);
        set({ error: error.message });
      }
    );
    
    set(state => ({
      unsubscribers: [...state.unsubscribers, unsubscribe]
    }));
  },
  
  // === METODI PER MANUTENZIONI ===
  fetchMaintenanceRecords: async (vehicleId: string) => {
    set({ isLoading: true, error: null });
    try {
      const maintenanceQuery = query(
        collection(db, 'maintenance_records'),
        where('vehicleId', '==', vehicleId),
        orderBy('date', 'desc')
      );
      
      const snapshot = await getDocs(maintenanceQuery);
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MaintenanceRecord[];
      
      set({ maintenanceRecords: records, isLoading: false });
    } catch (error: any) {
      console.error('Errore recupero manutenzioni:', error);
      set({ 
        error: error.message || 'Errore nel recupero delle manutenzioni',
        isLoading: false 
      });
    }
  },
  
  addMaintenanceRecord: async (record) => {
    set({ isLoading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'maintenance_records'), {
        ...record,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      const newRecord = {
        ...record,
        id: docRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      set(state => ({
        maintenanceRecords: [newRecord, ...state.maintenanceRecords],
        isLoading: false
      }));
      
      return docRef.id;
    } catch (error: any) {
      console.error('Errore aggiunta manutenzione:', error);
      set({ 
        error: error.message || 'Errore nell\'aggiunta della manutenzione',
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateMaintenanceRecord: async (recordId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const recordRef = doc(db, 'maintenance_records', recordId);
      await updateDoc(recordRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      set(state => ({
        maintenanceRecords: state.maintenanceRecords.map(r => 
          r.id === recordId ? { ...r, ...updates } : r
        ),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Errore aggiornamento manutenzione:', error);
      set({ 
        error: error.message || 'Errore nell\'aggiornamento della manutenzione',
        isLoading: false 
      });
      throw error;
    }
  },
  
  deleteMaintenanceRecord: async (recordId) => {
    set({ isLoading: true, error: null });
    try {
      await deleteDoc(doc(db, 'maintenance_records', recordId));
      
      set(state => ({
        maintenanceRecords: state.maintenanceRecords.filter(r => r.id !== recordId),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Errore eliminazione manutenzione:', error);
      set({ 
        error: error.message || 'Errore nell\'eliminazione della manutenzione',
        isLoading: false 
      });
      throw error;
    }
  },
  
  // === METODI PER CARBURANTE ===
  fetchFuelRecords: async (vehicleId: string) => {
    set({ isLoading: true, error: null });
    try {
      const fuelQuery = query(
        collection(db, 'fuel_records'),
        where('vehicleId', '==', vehicleId),
        orderBy('date', 'desc')
      );
      
      const snapshot = await getDocs(fuelQuery);
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FuelRecord[];
      
      set({ fuelRecords: records, isLoading: false });
    } catch (error: any) {
      console.error('Errore recupero carburante:', error);
      set({ 
        error: error.message || 'Errore nel recupero dei record carburante',
        isLoading: false 
      });
    }
  },
  
  addFuelRecord: async (record) => {
    set({ isLoading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'fuel_records'), {
        ...record,
        createdAt: serverTimestamp()
      });
      
      const newRecord = {
        ...record,
        id: docRef.id,
        createdAt: new Date().toISOString()
      };
      
      set(state => ({
        fuelRecords: [newRecord, ...state.fuelRecords],
        isLoading: false
      }));
      
      return docRef.id;
    } catch (error: any) {
      console.error('Errore aggiunta carburante:', error);
      set({ 
        error: error.message || 'Errore nell\'aggiunta del record carburante',
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateFuelRecord: async (recordId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const recordRef = doc(db, 'fuel_records', recordId);
      await updateDoc(recordRef, updates);
      
      set(state => ({
        fuelRecords: state.fuelRecords.map(r => 
          r.id === recordId ? { ...r, ...updates } : r
        ),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Errore aggiornamento carburante:', error);
      set({ 
        error: error.message || 'Errore nell\'aggiornamento del record carburante',
        isLoading: false 
      });
      throw error;
    }
  },
  
  deleteFuelRecord: async (recordId) => {
    set({ isLoading: true, error: null });
    try {
      await deleteDoc(doc(db, 'fuel_records', recordId));
      
      set(state => ({
        fuelRecords: state.fuelRecords.filter(r => r.id !== recordId),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Errore eliminazione carburante:', error);
      set({ 
        error: error.message || 'Errore nell\'eliminazione del record carburante',
        isLoading: false 
      });
      throw error;
    }
  },
  
  // === METODI PER SPESE ===
  fetchExpenses: async (vehicleId: string) => {
    set({ isLoading: true, error: null });
    try {
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('vehicleId', '==', vehicleId),
        orderBy('date', 'desc')
      );
      
      const snapshot = await getDocs(expensesQuery);
      const expenses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[];
      
      set({ expenses, isLoading: false });
    } catch (error: any) {
      console.error('Errore recupero spese:', error);
      set({ 
        error: error.message || 'Errore nel recupero delle spese',
        isLoading: false 
      });
    }
  },
  
  addExpense: async (expense) => {
    set({ isLoading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'expenses'), {
        ...expense,
        createdAt: serverTimestamp()
      });
      
      const newExpense = {
        ...expense,
        id: docRef.id,
        createdAt: new Date().toISOString()
      };
      
      set(state => ({
        expenses: [newExpense, ...state.expenses],
        isLoading: false
      }));
      
      return docRef.id;
    } catch (error: any) {
      console.error('Errore aggiunta spesa:', error);
      set({ 
        error: error.message || 'Errore nell\'aggiunta della spesa',
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateExpense: async (expenseId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const expenseRef = doc(db, 'expenses', expenseId);
      await updateDoc(expenseRef, updates);
      
      set(state => ({
        expenses: state.expenses.map(e => 
          e.id === expenseId ? { ...e, ...updates } : e
        ),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Errore aggiornamento spesa:', error);
      set({ 
        error: error.message || 'Errore nell\'aggiornamento della spesa',
        isLoading: false 
      });
      throw error;
    }
  },
  
  deleteExpense: async (expenseId) => {
    set({ isLoading: true, error: null });
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
      
      set(state => ({
        expenses: state.expenses.filter(e => e.id !== expenseId),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Errore eliminazione spesa:', error);
      set({ 
        error: error.message || 'Errore nell\'eliminazione della spesa',
        isLoading: false 
      });
      throw error;
    }
  },
  
  // === UTILITY - FUNZIONI PRINCIPALI ===
  getVehicleById: (vehicleId: string) => {
    const state = get();
    return state.vehicles.find(v => v.id === vehicleId);
  },
  
  getVehicleStats: (vehicleId: string) => {
    const state = get();
    const maintenance = state.maintenanceRecords.filter(r => r.vehicleId === vehicleId);
    const fuel = state.fuelRecords.filter(r => r.vehicleId === vehicleId);
    const expenses = state.expenses.filter(e => e.vehicleId === vehicleId);
    
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalFuelCost = fuel.reduce((sum, f) => sum + f.totalCost, 0);
    const maintenanceCount = maintenance.length;
    
    // Calcola consumo medio carburante
    let avgFuelConsumption = 0;
    if (fuel.length > 1) {
      const sortedFuel = [...fuel].sort((a, b) => a.mileage - b.mileage);
      const totalLiters = sortedFuel.reduce((sum, f) => sum + f.liters, 0);
      const totalDistance = sortedFuel[sortedFuel.length - 1].mileage - sortedFuel[0].mileage;
      if (totalDistance > 0) {
        avgFuelConsumption = (totalLiters / totalDistance) * 100; // L/100km
      }
    }
    
    return {
      totalExpenses: totalExpenses + totalFuelCost,
      maintenanceCount,
      avgFuelConsumption,
      totalFuelCost,
    };
  },

  // === FUNZIONI SPECIFICHE PER AddMaintenanceScreen ===
  
  // Aggiunge manutenzione con signature compatibile
  addMaintenance: async (vehicleId: string, maintenanceData: any) => {
    const record = {
      vehicleId,
      ...maintenanceData
    };
    return get().addMaintenanceRecord(record);
  },

  // Aggiorna solo il chilometraggio di un veicolo
  updateMileage: async (vehicleId: string, newMileage: number) => {
    return get().updateVehicle(vehicleId, {
      currentMileage: newMileage,
      lastUpdatedMileage: new Date().toISOString()
    });
  },

  // Aggiunge promemoria collegato a un veicolo
  addReminder: async (vehicleId: string, reminderData: any) => {
    set({ isLoading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'reminders'), {
        vehicleId,
        ...reminderData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log(`Promemoria aggiunto per veicolo ${vehicleId}:`, docRef.id);
      set({ isLoading: false });
      return docRef.id;
    } catch (error: any) {
      console.error('Errore aggiunta promemoria:', error);
      set({ 
        error: error.message || 'Errore nell\'aggiunta del promemoria',
        isLoading: false 
      });
      throw error;
    }
  },
  
  // === ALIAS PER COMPATIBILITÀ (DEPRECATI) ===
  getCarById: (vehicleId: string) => {
    // Alias per compatibilità - usa getVehicleById
    return get().getVehicleById(vehicleId);
  },
  
  getCarStats: (vehicleId: string) => {
    // Alias per compatibilità - usa getVehicleStats
    return get().getVehicleStats(vehicleId);
  },

  // Funzione per ottenere `cars` come alias di `vehicles` (per compatibilità AddMaintenanceScreen)
  getCars: () => {
    return get().vehicles;
  },
  
  // === CLEANUP ===
  cleanup: () => {
    const { unsubscribers } = get();
    unsubscribers.forEach(unsub => unsub());
    set({ unsubscribers: [] });
  },
  
  resetStore: () => {
    get().cleanup();
    set({
      vehicles: [],
      maintenanceRecords: [],
      fuelRecords: [],
      expenses: [],
      isLoading: false,
      error: null,
      unsubscribers: []
    });
  }
}));

// === EXPORT PER COMPATIBILITÀ ===
// Alias deprecato ma mantenuto per compatibilità
export const useUserCarsStore = useCarsStore;
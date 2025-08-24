// src/store/workshopStore.ts - Store Officina con integrazione Firestore
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
  getDoc,
  limit
} from 'firebase/firestore';
import { db } from '../services/firebase';

// ====================================
// INTERFACCE E TIPI
// ====================================

export interface Part {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
  category?: 'ricambio' | 'fluido' | 'consumabile' | 'accessorio';
  brand?: string;
  partNumber?: string;
  supplier?: string;
}

export interface Repair {
  id: string;
  description: string;
  scheduledDate: string;
  deliveryDate?: string;
  totalCost: number;
  laborCost: number;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  parts: Part[];
  notes?: string;
  mechanicId?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface WorkshopCar {
  id: string;
  make?: string;
  model: string;
  vin: string;
  licensePlate?: string;
  owner?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  ownerId?: string; // ID utente Firebase
  year?: string;
  color?: string;
  mileage?: number;
  repairs: Repair[];
  workshopId: string;
  entryDate?: string;
  exitDate?: string;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface Appointment {
  id: string;
  carId?: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  vehicleInfo: string;
  scheduledDate: string;
  scheduledTime: string;
  estimatedDuration: number; // in minuti
  serviceType: string;
  notes?: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  workshopId: string;
  mechanicId?: string;
  createdAt?: any;
  updatedAt?: any;
}

// ====================================
// INTERFACCIA DELLO STORE
// ====================================

interface WorkshopStore {
  // Stati
  cars: WorkshopCar[];
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  currentWorkshopId: string | null;
  
  // Listener attivi
  unsubscribers: (() => void)[];
  
  // === METODI PER AUTO IN OFFICINA ===
  fetchWorkshopCars: (workshopId: string) => Promise<void>;
  addWorkshopCar: (car: Omit<WorkshopCar, 'id' | 'createdAt' | 'updatedAt' | 'repairs'>) => Promise<string>;
  updateWorkshopCar: (carId: string, updates: Partial<WorkshopCar>) => Promise<void>;
  removeWorkshopCar: (carId: string) => Promise<void>;
  subscribeToWorkshopCars: (workshopId: string) => void;
  
  // === METODI PER RIPARAZIONI ===
  addRepairToCar: (carId: string, repair: Omit<Repair, 'id' | 'parts' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateRepair: (carId: string, repairId: string, updates: Partial<Repair>) => Promise<void>;
  updateRepairStatus: (carId: string, repairId: string, status: Repair['status']) => Promise<void>;
  deleteRepair: (carId: string, repairId: string) => Promise<void>;
  
  // === METODI PER PARTI ===
  addPartToRepair: (carId: string, repairId: string, part: Omit<Part, 'id'>) => Promise<string>;
  updatePartInRepair: (carId: string, repairId: string, partId: string, updates: Partial<Part>) => Promise<void>;
  removePartFromRepair: (carId: string, repairId: string, partId: string) => Promise<void>;
  
  // === METODI PER APPUNTAMENTI ===
  fetchAppointments: (workshopId: string, date?: string) => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateAppointment: (appointmentId: string, updates: Partial<Appointment>) => Promise<void>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
  subscribeToAppointments: (workshopId: string) => void;
  
  // === UTILITY ===
  getCarById: (carId: string) => WorkshopCar | undefined;
  getRepairDetails: (carId: string, repairId: string) => Repair | undefined;
  getTodayAppointments: () => Appointment[];
  getUpcomingAppointments: (days: number) => Appointment[];
  
  // === SETUP E CLEANUP ===
  setWorkshopId: (workshopId: string) => void;
  cleanup: () => void;
  resetStore: () => void;
}

// ====================================
// CREAZIONE DELLO STORE
// ====================================

export const useWorkshopStore = create<WorkshopStore>((set, get) => ({
  // === STATO INIZIALE ===
  cars: [],
  appointments: [],
  isLoading: false,
  error: null,
  currentWorkshopId: null,
  unsubscribers: [],
  
  // === METODI PER AUTO IN OFFICINA ===
  fetchWorkshopCars: async (workshopId: string) => {
    set({ isLoading: true, error: null });
    try {
      const carsQuery = query(
        collection(db, 'workshop_cars'),
        where('workshopId', '==', workshopId),
        where('isActive', '==', true),
        orderBy('entryDate', 'desc')
      );
      
      const snapshot = await getDocs(carsQuery);
      const cars: WorkshopCar[] = [];
      
      // Per ogni auto, recupera anche le riparazioni
      for (const carDoc of snapshot.docs) {
        const carData = carDoc.data();
        
        // Recupera le riparazioni per questa auto
        const repairsQuery = query(
          collection(db, 'workshop_cars', carDoc.id, 'repairs'),
          orderBy('scheduledDate', 'desc')
        );
        
        const repairsSnapshot = await getDocs(repairsQuery);
        const repairs = repairsSnapshot.docs.map(repairDoc => ({
          id: repairDoc.id,
          ...repairDoc.data()
        })) as Repair[];
        
        cars.push({
          id: carDoc.id,
          ...carData,
          repairs
        } as WorkshopCar);
      }
      
      set({ cars, isLoading: false });
    } catch (error: any) {
      console.error('Errore recupero auto officina:', error);
      set({ 
        error: error.message || 'Errore nel recupero delle auto',
        isLoading: false 
      });
    }
  },
  
  addWorkshopCar: async (car) => {
    set({ isLoading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'workshop_cars'), {
        ...car,
        repairs: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        entryDate: car.entryDate || new Date().toISOString()
      });
      
      const newCar: WorkshopCar = {
        ...car,
        id: docRef.id,
        repairs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      set(state => ({
        cars: [newCar, ...state.cars],
        isLoading: false
      }));
      
      return docRef.id;
    } catch (error: any) {
      console.error('Errore aggiunta auto:', error);
      set({ 
        error: error.message || 'Errore nell\'aggiunta dell\'auto',
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateWorkshopCar: async (carId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const carRef = doc(db, 'workshop_cars', carId);
      await updateDoc(carRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      set(state => ({
        cars: state.cars.map(car => 
          car.id === carId ? { ...car, ...updates } : car
        ),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Errore aggiornamento auto:', error);
      set({ 
        error: error.message || 'Errore nell\'aggiornamento dell\'auto',
        isLoading: false 
      });
      throw error;
    }
  },
  
  removeWorkshopCar: async (carId) => {
    set({ isLoading: true, error: null });
    try {
      const carRef = doc(db, 'workshop_cars', carId);
      await updateDoc(carRef, {
        isActive: false,
        exitDate: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });
      
      set(state => ({
        cars: state.cars.filter(car => car.id !== carId),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Errore rimozione auto:', error);
      set({ 
        error: error.message || 'Errore nella rimozione dell\'auto',
        isLoading: false 
      });
      throw error;
    }
  },
  
  subscribeToWorkshopCars: (workshopId: string) => {
    get().cleanup();
    
    const carsQuery = query(
      collection(db, 'workshop_cars'),
      where('workshopId', '==', workshopId),
      where('isActive', '==', true),
      orderBy('entryDate', 'desc')
    );
    
    const unsubscribe = onSnapshot(carsQuery, 
      async (snapshot) => {
        const cars: WorkshopCar[] = [];
        
        for (const carDoc of snapshot.docs) {
          const carData = carDoc.data();
          
          // Recupera riparazioni
          const repairsQuery = query(
            collection(db, 'workshop_cars', carDoc.id, 'repairs'),
            orderBy('scheduledDate', 'desc')
          );
          
          const repairsSnapshot = await getDocs(repairsQuery);
          const repairs = repairsSnapshot.docs.map(repairDoc => ({
            id: repairDoc.id,
            ...repairDoc.data()
          })) as Repair[];
          
          cars.push({
            id: carDoc.id,
            ...carData,
            repairs
          } as WorkshopCar);
        }
        
        set({ cars, error: null });
      },
      (error) => {
        console.error('Errore subscription auto:', error);
        set({ error: error.message });
      }
    );
    
    set(state => ({
      unsubscribers: [...state.unsubscribers, unsubscribe]
    }));
  },
  
  // === METODI PER RIPARAZIONI ===
  addRepairToCar: async (carId, repair) => {
    set({ isLoading: true, error: null });
    try {
      const repairRef = await addDoc(
        collection(db, 'workshop_cars', carId, 'repairs'),
        {
          ...repair,
          parts: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      );
      
      const newRepair: Repair = {
        ...repair,
        id: repairRef.id,
        parts: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      set(state => ({
        cars: state.cars.map(car => 
          car.id === carId 
            ? { ...car, repairs: [newRepair, ...car.repairs] }
            : car
        ),
        isLoading: false
      }));
      
      return repairRef.id;
    } catch (error: any) {
      console.error('Errore aggiunta riparazione:', error);
      set({ 
        error: error.message || 'Errore nell\'aggiunta della riparazione',
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateRepair: async (carId, repairId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const repairRef = doc(db, 'workshop_cars', carId, 'repairs', repairId);
      await updateDoc(repairRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      set(state => ({
        cars: state.cars.map(car => 
          car.id === carId 
            ? {
                ...car,
                repairs: car.repairs.map(repair =>
                  repair.id === repairId ? { ...repair, ...updates } : repair
                )
              }
            : car
        ),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Errore aggiornamento riparazione:', error);
      set({ 
        error: error.message || 'Errore nell\'aggiornamento della riparazione',
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateRepairStatus: async (carId, repairId, status) => {
    return get().updateRepair(carId, repairId, { status });
  },
  
  deleteRepair: async (carId, repairId) => {
    set({ isLoading: true, error: null });
    try {
      await deleteDoc(doc(db, 'workshop_cars', carId, 'repairs', repairId));
      
      set(state => ({
        cars: state.cars.map(car => 
          car.id === carId 
            ? {
                ...car,
                repairs: car.repairs.filter(repair => repair.id !== repairId)
              }
            : car
        ),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Errore eliminazione riparazione:', error);
      set({ 
        error: error.message || 'Errore nell\'eliminazione della riparazione',
        isLoading: false 
      });
      throw error;
    }
  },
  
  // === METODI PER PARTI ===
  addPartToRepair: async (carId, repairId, part) => {
    const car = get().getCarById(carId);
    const repair = car?.repairs.find(r => r.id === repairId);
    
    if (!repair) {
      throw new Error('Riparazione non trovata');
    }
    
    const newPart: Part = {
      ...part,
      id: `part_${Date.now()}`
    };
    
    const updatedParts = [...repair.parts, newPart];
    await get().updateRepair(carId, repairId, { parts: updatedParts });
    
    return newPart.id;
  },
  
  updatePartInRepair: async (carId, repairId, partId, updates) => {
    const car = get().getCarById(carId);
    const repair = car?.repairs.find(r => r.id === repairId);
    
    if (!repair) {
      throw new Error('Riparazione non trovata');
    }
    
    const updatedParts = repair.parts.map(part =>
      part.id === partId ? { ...part, ...updates } : part
    );
    
    await get().updateRepair(carId, repairId, { parts: updatedParts });
  },
  
  removePartFromRepair: async (carId, repairId, partId) => {
    const car = get().getCarById(carId);
    const repair = car?.repairs.find(r => r.id === repairId);
    
    if (!repair) {
      throw new Error('Riparazione non trovata');
    }
    
    const updatedParts = repair.parts.filter(part => part.id !== partId);
    await get().updateRepair(carId, repairId, { parts: updatedParts });
  },
  
  // === METODI PER APPUNTAMENTI ===
  fetchAppointments: async (workshopId, date) => {
    set({ isLoading: true, error: null });
    try {
      let appointmentsQuery;
      
      if (date) {
        // Recupera appuntamenti per una data specifica
        appointmentsQuery = query(
          collection(db, 'appointments'),
          where('workshopId', '==', workshopId),
          where('scheduledDate', '==', date),
          orderBy('scheduledTime', 'asc')
        );
      } else {
        // Recupera appuntamenti futuri
        const today = new Date().toISOString().split('T')[0];
        appointmentsQuery = query(
          collection(db, 'appointments'),
          where('workshopId', '==', workshopId),
          where('scheduledDate', '>=', today),
          orderBy('scheduledDate', 'asc'),
          orderBy('scheduledTime', 'asc'),
          limit(50)
        );
      }
      
      const snapshot = await getDocs(appointmentsQuery);
      const appointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Appointment[];
      
      set({ appointments, isLoading: false });
    } catch (error: any) {
      console.error('Errore recupero appuntamenti:', error);
      set({ 
        error: error.message || 'Errore nel recupero degli appuntamenti',
        isLoading: false 
      });
    }
  },
  
  addAppointment: async (appointment) => {
    set({ isLoading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'appointments'), {
        ...appointment,
        status: appointment.status || 'scheduled',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      const newAppointment: Appointment = {
        ...appointment,
        id: docRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      set(state => ({
        appointments: [...state.appointments, newAppointment],
        isLoading: false
      }));
      
      return docRef.id;
    } catch (error: any) {
      console.error('Errore aggiunta appuntamento:', error);
      set({ 
        error: error.message || 'Errore nell\'aggiunta dell\'appuntamento',
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateAppointment: async (appointmentId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await updateDoc(appointmentRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      set(state => ({
        appointments: state.appointments.map(apt =>
          apt.id === appointmentId ? { ...apt, ...updates } : apt
        ),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Errore aggiornamento appuntamento:', error);
      set({ 
        error: error.message || 'Errore nell\'aggiornamento dell\'appuntamento',
        isLoading: false 
      });
      throw error;
    }
  },
  
  cancelAppointment: async (appointmentId) => {
    return get().updateAppointment(appointmentId, { status: 'cancelled' });
  },
  
  subscribeToAppointments: (workshopId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('workshopId', '==', workshopId),
      where('scheduledDate', '>=', today),
      orderBy('scheduledDate', 'asc'),
      orderBy('scheduledTime', 'asc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(appointmentsQuery, 
      (snapshot) => {
        const appointments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Appointment[];
        
        set({ appointments, error: null });
      },
      (error) => {
        console.error('Errore subscription appuntamenti:', error);
        set({ error: error.message });
      }
    );
    
    set(state => ({
      unsubscribers: [...state.unsubscribers, unsubscribe]
    }));
  },
  
  // === UTILITY ===
  getCarById: (carId: string) => {
    return get().cars.find(car => car.id === carId);
  },
  
  getRepairDetails: (carId: string, repairId: string) => {
    const car = get().getCarById(carId);
    return car?.repairs.find(repair => repair.id === repairId);
  },
  
  getTodayAppointments: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().appointments.filter(apt => apt.scheduledDate === today);
  },
  
  getUpcomingAppointments: (days: number = 7) => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const todayStr = today.toISOString().split('T')[0];
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    return get().appointments.filter(apt => 
      apt.scheduledDate >= todayStr && apt.scheduledDate <= futureDateStr
    );
  },
  
  // === SETUP E CLEANUP ===
  setWorkshopId: (workshopId: string) => {
    set({ currentWorkshopId: workshopId });
  },
  
  cleanup: () => {
    const { unsubscribers } = get();
    unsubscribers.forEach(unsub => unsub());
    set({ unsubscribers: [] });
  },
  
  resetStore: () => {
    get().cleanup();
    set({
      cars: [],
      appointments: [],
      isLoading: false,
      error: null,
      currentWorkshopId: null,
      unsubscribers: []
    });
  }
}));
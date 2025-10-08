// src/store/workshopStore.ts - Store Officina compatibile con Zustand 4.x
import create from 'zustand'; // ⚠️ Import diverso in Zustand 4.x
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
// INTERFACCE E TIPI (mantieni quelle esistenti)
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
    ownerId?: string;
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
    estimatedDuration: number;
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

interface WorkshopStoreState {
    cars: WorkshopCar[];
    appointments: Appointment[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchCars: (workshopId: string) => Promise<void>;
    addCar: (workshopId: string, car: Omit<WorkshopCar, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
    updateCar: (carId: string, updates: Partial<WorkshopCar>) => Promise<void>;
    deleteCar: (carId: string) => Promise<void>;

    fetchAppointments: (workshopId: string) => Promise<void>;
    addAppointment: (workshopId: string, appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
    updateAppointment: (appointmentId: string, updates: Partial<Appointment>) => Promise<void>;
    deleteAppointment: (appointmentId: string) => Promise<void>;

    addRepair: (carId: string, repair: Omit<Repair, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateRepair: (carId: string, repairId: string, updates: Partial<Repair>) => Promise<void>;

    clearError: () => void;
    reset: () => void;
}

// ====================================
// CREAZIONE DELLO STORE (ZUSTAND 4.x)
// ====================================

export const useWorkshopStore = create<WorkshopStoreState>((set, get) => ({
    cars: [],
    appointments: [],
    isLoading: false,
    error: null,

    // Fetch Cars
    fetchCars: async (workshopId: string) => {
        set({ isLoading: true, error: null });
        try {
            const carsRef = collection(db, 'workshopCars');
            const q = query(
                carsRef,
                where('workshopId', '==', workshopId),
                where('isActive', '==', true),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(q);
            const cars = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as WorkshopCar[];

            set({ cars, isLoading: false });
        } catch (error: any) {
            console.error('Error fetching cars:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    // Add Car
    addCar: async (workshopId: string, carData: Omit<WorkshopCar, 'id' | 'createdAt' | 'updatedAt'>) => {
        set({ isLoading: true, error: null });
        try {
            const carsRef = collection(db, 'workshopCars');
            const docRef = await addDoc(carsRef, {
                ...carData,
                workshopId,
                isActive: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            await get().fetchCars(workshopId);
            set({ isLoading: false });
            return docRef.id;
        } catch (error: any) {
            console.error('Error adding car:', error);
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Update Car
    updateCar: async (carId: string, updates: Partial<WorkshopCar>) => {
        set({ isLoading: true, error: null });
        try {
            const carRef = doc(db, 'workshopCars', carId);
            await updateDoc(carRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });

            const carDoc = await getDoc(carRef);
            if (carDoc.exists()) {
                const workshopId = carDoc.data().workshopId;
                await get().fetchCars(workshopId);
            }

            set({ isLoading: false });
        } catch (error: any) {
            console.error('Error updating car:', error);
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Delete Car
    deleteCar: async (carId: string) => {
        set({ isLoading: true, error: null });
        try {
            const carRef = doc(db, 'workshopCars', carId);
            await updateDoc(carRef, {
                isActive: false,
                updatedAt: serverTimestamp()
            });

            const carDoc = await getDoc(carRef);
            if (carDoc.exists()) {
                const workshopId = carDoc.data().workshopId;
                await get().fetchCars(workshopId);
            }

            set({ isLoading: false });
        } catch (error: any) {
            console.error('Error deleting car:', error);
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Fetch Appointments
    fetchAppointments: async (workshopId: string) => {
        set({ isLoading: true, error: null });
        try {
            const appointmentsRef = collection(db, 'appointments');
            const q = query(
                appointmentsRef,
                where('workshopId', '==', workshopId),
                orderBy('scheduledDate', 'desc'),
                limit(50)
            );

            const snapshot = await getDocs(q);
            const appointments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Appointment[];

            set({ appointments, isLoading: false });
        } catch (error: any) {
            console.error('Error fetching appointments:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    // Add Appointment
    addAppointment: async (workshopId: string, appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
        set({ isLoading: true, error: null });
        try {
            const appointmentsRef = collection(db, 'appointments');
            const docRef = await addDoc(appointmentsRef, {
                ...appointmentData,
                workshopId,
                status: 'scheduled',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            await get().fetchAppointments(workshopId);
            set({ isLoading: false });
            return docRef.id;
        } catch (error: any) {
            console.error('Error adding appointment:', error);
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Update Appointment
    updateAppointment: async (appointmentId: string, updates: Partial<Appointment>) => {
        set({ isLoading: true, error: null });
        try {
            const appointmentRef = doc(db, 'appointments', appointmentId);
            await updateDoc(appointmentRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });

            const appointmentDoc = await getDoc(appointmentRef);
            if (appointmentDoc.exists()) {
                const workshopId = appointmentDoc.data().workshopId;
                await get().fetchAppointments(workshopId);
            }

            set({ isLoading: false });
        } catch (error: any) {
            console.error('Error updating appointment:', error);
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Delete Appointment
    deleteAppointment: async (appointmentId: string) => {
        set({ isLoading: true, error: null });
        try {
            const appointmentRef = doc(db, 'appointments', appointmentId);
            await deleteDoc(appointmentRef);

            const cars = get().cars;
            if (cars.length > 0) {
                const workshopId = cars[0].workshopId;
                await get().fetchAppointments(workshopId);
            }

            set({ isLoading: false });
        } catch (error: any) {
            console.error('Error deleting appointment:', error);
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Add Repair
    addRepair: async (carId: string, repairData: Omit<Repair, 'id' | 'createdAt' | 'updatedAt'>) => {
        set({ isLoading: true, error: null });
        try {
            const carRef = doc(db, 'workshopCars', carId);
            const carDoc = await getDoc(carRef);

            if (!carDoc.exists()) {
                throw new Error('Car not found');
            }

            const car = carDoc.data() as WorkshopCar;
            const newRepair = {
                ...repairData,
                id: `repair_${Date.now()}`,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            const updatedRepairs = [...(car.repairs || []), newRepair];

            await updateDoc(carRef, {
                repairs: updatedRepairs,
                updatedAt: serverTimestamp()
            });

            await get().fetchCars(car.workshopId);
            set({ isLoading: false });
        } catch (error: any) {
            console.error('Error adding repair:', error);
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Update Repair
    updateRepair: async (carId: string, repairId: string, updates: Partial<Repair>) => {
        set({ isLoading: true, error: null });
        try {
            const carRef = doc(db, 'workshopCars', carId);
            const carDoc = await getDoc(carRef);

            if (!carDoc.exists()) {
                throw new Error('Car not found');
            }

            const car = carDoc.data() as WorkshopCar;
            const updatedRepairs = car.repairs.map(repair =>
                repair.id === repairId
                    ? { ...repair, ...updates, updatedAt: serverTimestamp() }
                    : repair
            );

            await updateDoc(carRef, {
                repairs: updatedRepairs,
                updatedAt: serverTimestamp()
            });

            await get().fetchCars(car.workshopId);
            set({ isLoading: false });
        } catch (error: any) {
            console.error('Error updating repair:', error);
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Clear Error
    clearError: () => {
        set({ error: null });
    },

    // Reset
    reset: () => {
        set({
            cars: [],
            appointments: [],
            isLoading: false,
            error: null
        });
    }
}));
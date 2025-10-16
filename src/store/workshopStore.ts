// src/store/workshopStore.ts
// Store per gestione officina - FIXED serverTimestamp in arrays

import { create } from 'zustand';
import {
    collection,
    addDoc,
    updateDoc,
    getDoc,
    getDocs,
    doc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';

export interface WorkshopCar {
    id: string;
    workshopId: string;
    make: string;
    model: string;
    year: string;
    licensePlate: string;
    vin?: string;
    color?: string;
    mileage?: number;
    owner: string;
    ownerId: string;
    ownerEmail: string;
    ownerPhone?: string;
    entryDate: string;
    isActive: boolean;
    repairs: Repair[];
    createdAt: any;
    updatedAt: any;
}

export interface Repair {
    id: string;
    description: string;
    scheduledDate: string;
    deliveryDate?: string;
    totalCost: number;
    laborCost: number;
    estimatedHours: number;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    parts: RepairPart[];
    notes?: string;
    mechanicId: string;
    createdAt: string; // ⚠️ CHANGED: ISO string invece di serverTimestamp
    updatedAt: string; // ⚠️ CHANGED: ISO string invece di serverTimestamp
}

export interface RepairPart {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    supplier?: string;
    partNumber?: string;
}

export interface Appointment {
    id: string;
    workshopId: string;
    carId?: string;
    customerId: string;
    customerName: string;
    customerPhone?: string;
    customerEmail: string;
    scheduledDate: string;
    scheduledTime?: string;
    estimatedDuration?: number;
    description: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    notes?: string;
    createdAt: any;
    updatedAt: any;
}

interface WorkshopState {
    cars: WorkshopCar[];
    appointments: Appointment[];
    isLoading: boolean;
    error: string | null;

    // Cars
    fetchCars: (workshopId: string) => Promise<void>;
    addCar: (workshopId: string, carData: Omit<WorkshopCar, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
    updateCar: (carId: string, updates: Partial<WorkshopCar>) => Promise<void>;
    deleteCar: (carId: string) => Promise<void>;

    // Appointments
    fetchAppointments: (workshopId: string) => Promise<void>;
    addAppointment: (workshopId: string, appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
    updateAppointment: (appointmentId: string, updates: Partial<Appointment>) => Promise<void>;
    deleteAppointment: (appointmentId: string) => Promise<void>;

    // Repairs
    addRepair: (carId: string, repairData: Omit<Repair, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateRepair: (carId: string, repairId: string, updates: Partial<Repair>) => Promise<void>;
    deleteRepair: (carId: string, repairId: string) => Promise<void>;

    // Parts
    addPartToRepair: (carId: string, repairId: string, part: Omit<RepairPart, 'id'>) => Promise<void>;
    updateRepairPart: (carId: string, repairId: string, partId: string, updates: Partial<RepairPart>) => Promise<void>;
    deleteRepairPart: (carId: string, repairId: string, partId: string) => Promise<void>;

    // Utilities
    clearError: () => void;
    reset: () => void;
}

export const useWorkshopStore = create<WorkshopState>((set, get) => ({
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
                orderBy('entryDate', 'desc')
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

    // Delete Car (soft delete)
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
            const appointmentDoc = await getDoc(appointmentRef);

            if (appointmentDoc.exists()) {
                const workshopId = appointmentDoc.data().workshopId;

                await updateDoc(appointmentRef, {
                    status: 'cancelled',
                    updatedAt: serverTimestamp()
                });

                await get().fetchAppointments(workshopId);
            }

            set({ isLoading: false });
        } catch (error: any) {
            console.error('Error deleting appointment:', error);
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // ⚠️ FIXED: Add Repair - usa ISO string invece di serverTimestamp negli array
    addRepair: async (carId: string, repairData: Omit<Repair, 'id' | 'createdAt' | 'updatedAt'>) => {
        set({ isLoading: true, error: null });
        try {
            const carRef = doc(db, 'workshopCars', carId);
            const carDoc = await getDoc(carRef);

            if (!carDoc.exists()) {
                throw new Error('Car not found');
            }

            const car = carDoc.data() as WorkshopCar;
            const now = new Date().toISOString();

            const newRepair: Repair = {
                ...repairData,
                id: `repair_${Date.now()}`,
                createdAt: now, // ✅ ISO string invece di serverTimestamp
                updatedAt: now, // ✅ ISO string invece di serverTimestamp
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

    // ⚠️ FIXED: Update Repair - usa ISO string per updatedAt
    updateRepair: async (carId: string, repairId: string, updates: Partial<Repair>) => {
        set({ isLoading: true, error: null });
        try {
            const carRef = doc(db, 'workshopCars', carId);
            const carDoc = await getDoc(carRef);

            if (!carDoc.exists()) {
                throw new Error('Car not found');
            }

            const car = carDoc.data() as WorkshopCar;
            const now = new Date().toISOString();

            const updatedRepairs = car.repairs.map(repair =>
                repair.id === repairId
                    ? { ...repair, ...updates, updatedAt: now } // ✅ ISO string
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

    // Delete Repair
    deleteRepair: async (carId: string, repairId: string) => {
        set({ isLoading: true, error: null });
        try {
            const carRef = doc(db, 'workshopCars', carId);
            const carDoc = await getDoc(carRef);

            if (!carDoc.exists()) {
                throw new Error('Car not found');
            }

            const car = carDoc.data() as WorkshopCar;
            const updatedRepairs = car.repairs.filter(repair => repair.id !== repairId);

            await updateDoc(carRef, {
                repairs: updatedRepairs,
                updatedAt: serverTimestamp()
            });

            await get().fetchCars(car.workshopId);
            set({ isLoading: false });
        } catch (error: any) {
            console.error('Error deleting repair:', error);
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Add Part to Repair
    addPartToRepair: async (carId: string, repairId: string, part: Omit<RepairPart, 'id'>) => {
        set({ isLoading: true, error: null });
        try {
            const carRef = doc(db, 'workshopCars', carId);
            const carDoc = await getDoc(carRef);

            if (!carDoc.exists()) {
                throw new Error('Car not found');
            }

            const car = carDoc.data() as WorkshopCar;
            const now = new Date().toISOString();

            const newPart: RepairPart = {
                ...part,
                id: `part_${Date.now()}`,
            };

            const updatedRepairs = car.repairs.map(repair => {
                if (repair.id === repairId) {
                    return {
                        ...repair,
                        parts: [...(repair.parts || []), newPart],
                        updatedAt: now, // ✅ ISO string
                    };
                }
                return repair;
            });

            await updateDoc(carRef, {
                repairs: updatedRepairs,
                updatedAt: serverTimestamp()
            });

            await get().fetchCars(car.workshopId);
            set({ isLoading: false });
        } catch (error: any) {
            console.error('Error adding part:', error);
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Update Repair Part
    updateRepairPart: async (carId: string, repairId: string, partId: string, updates: Partial<RepairPart>) => {
        set({ isLoading: true, error: null });
        try {
            const carRef = doc(db, 'workshopCars', carId);
            const carDoc = await getDoc(carRef);

            if (!carDoc.exists()) {
                throw new Error('Car not found');
            }

            const car = carDoc.data() as WorkshopCar;
            const now = new Date().toISOString();

            const updatedRepairs = car.repairs.map(repair => {
                if (repair.id === repairId) {
                    return {
                        ...repair,
                        parts: repair.parts.map(part =>
                            part.id === partId ? { ...part, ...updates } : part
                        ),
                        updatedAt: now, // ✅ ISO string
                    };
                }
                return repair;
            });

            await updateDoc(carRef, {
                repairs: updatedRepairs,
                updatedAt: serverTimestamp()
            });

            await get().fetchCars(car.workshopId);
            set({ isLoading: false });
        } catch (error: any) {
            console.error('Error updating part:', error);
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Delete Repair Part
    deleteRepairPart: async (carId: string, repairId: string, partId: string) => {
        set({ isLoading: true, error: null });
        try {
            const carRef = doc(db, 'workshopCars', carId);
            const carDoc = await getDoc(carRef);

            if (!carDoc.exists()) {
                throw new Error('Car not found');
            }

            const car = carDoc.data() as WorkshopCar;
            const now = new Date().toISOString();

            const updatedRepairs = car.repairs.map(repair => {
                if (repair.id === repairId) {
                    return {
                        ...repair,
                        parts: repair.parts.filter(part => part.id !== partId),
                        updatedAt: now, // ✅ ISO string
                    };
                }
                return repair;
            });

            await updateDoc(carRef, {
                repairs: updatedRepairs,
                updatedAt: serverTimestamp()
            });

            await get().fetchCars(car.workshopId);
            set({ isLoading: false });
        } catch (error: any) {
            console.error('Error deleting part:', error);
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
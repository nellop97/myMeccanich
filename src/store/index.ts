// src/store/index.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  name: string;
  email: string;
  isLoggedIn: boolean;
  photoURL?: string;
  isMechanic?: boolean;
  phoneNumber?: string;
  emailVerified?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  // Informazioni specifiche per meccanici
  workshopName?: string;
  workshopAddress?: string;
  workshopPhone?: string;
  vatNumber?: string;
  // Informazioni specifiche per proprietari auto
  cars?: Car[];
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin?: string;
  color?: string;
  engineType?: string;
  transmission?: string;
  mileage?: number;
  lastService?: string;
  nextService?: string;
  insuranceExpiry?: string;
  inspectionExpiry?: string;
  notes?: string;
  maintenanceHistory?: MaintenanceRecord[];
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: string;
  description: string;
  cost?: number;
  mileage?: number;
  mechanicId?: string;
  mechanicName?: string;
  workshopName?: string;
  nextServiceDate?: string;
  nextServiceMileage?: number;
  parts?: Part[];
  notes?: string;
}

export interface Part {
  id: string;
  name: string;
  brand?: string;
  partNumber?: string;
  quantity: number;
  cost?: number;
}

interface StoreState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Car management (for car owners)
  addCar: (car: Car) => void;
  updateCar: (carId: string, updates: Partial<Car>) => void;
  removeCar: (carId: string) => void;
  
  // Maintenance records
  addMaintenanceRecord: (carId: string, record: MaintenanceRecord) => void;
  updateMaintenanceRecord: (carId: string, recordId: string, updates: Partial<MaintenanceRecord>) => void;
  removeMaintenanceRecord: (carId: string, recordId: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      error: null,
      
      setUser: (user) => {
        set({ 
          user: user ? {
            ...user,
            lastLoginAt: new Date().toISOString()
          } : null,
          error: null 
        });
      },
      
      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ 
            user: { ...currentUser, ...updates },
            error: null 
          });
        }
      },
      
      logout: () => {
        set({ 
          user: null, 
          error: null 
        });
      },
      
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      
      setError: (error) => {
        set({ error });
      },
      
      addCar: (car) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedCars = [...(currentUser.cars || []), car];
          set({
            user: {
              ...currentUser,
              cars: updatedCars
            }
          });
        }
      },
      
      updateCar: (carId, updates) => {
        const currentUser = get().user;
        if (currentUser && currentUser.cars) {
          const updatedCars = currentUser.cars.map(car =>
            car.id === carId ? { ...car, ...updates } : car
          );
          set({
            user: {
              ...currentUser,
              cars: updatedCars
            }
          });
        }
      },
      
      removeCar: (carId) => {
        const currentUser = get().user;
        if (currentUser && currentUser.cars) {
          const updatedCars = currentUser.cars.filter(car => car.id !== carId);
          set({
            user: {
              ...currentUser,
              cars: updatedCars
            }
          });
        }
      },
      
      addMaintenanceRecord: (carId, record) => {
        const currentUser = get().user;
        if (currentUser && currentUser.cars) {
          const updatedCars = currentUser.cars.map(car => {
            if (car.id === carId) {
              return {
                ...car,
                maintenanceHistory: [...(car.maintenanceHistory || []), record]
              };
            }
            return car;
          });
          set({
            user: {
              ...currentUser,
              cars: updatedCars
            }
          });
        }
      },
      
      updateMaintenanceRecord: (carId, recordId, updates) => {
        const currentUser = get().user;
        if (currentUser && currentUser.cars) {
          const updatedCars = currentUser.cars.map(car => {
            if (car.id === carId && car.maintenanceHistory) {
              const updatedHistory = car.maintenanceHistory.map(record =>
                record.id === recordId ? { ...record, ...updates } : record
              );
              return { ...car, maintenanceHistory: updatedHistory };
            }
            return car;
          });
          set({
            user: {
              ...currentUser,
              cars: updatedCars
            }
          });
        }
      },
      
      removeMaintenanceRecord: (carId, recordId) => {
        const currentUser = get().user;
        if (currentUser && currentUser.cars) {
          const updatedCars = currentUser.cars.map(car => {
            if (car.id === carId && car.maintenanceHistory) {
              const updatedHistory = car.maintenanceHistory.filter(record => record.id !== recordId);
              return { ...car, maintenanceHistory: updatedHistory };
            }
            return car;
          });
          set({
            user: {
              ...currentUser,
              cars: updatedCars
            }
          });
        }
      },
    }),
    {
      name: 'auto-manager-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        user: state.user 
      }),
    }
  )
);
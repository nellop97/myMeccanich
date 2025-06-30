// src/store/index.ts - VERSIONE SICURA SENZA GESTIONE AUTH
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔒 INTERFACCE SENZA DATI DI AUTENTICAZIONE
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

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'it' | 'en' | 'fr' | 'de';
  currency: 'EUR' | 'USD' | 'GBP';
  distanceUnit: 'km' | 'miles';
  fuelUnit: 'liters' | 'gallons';
  notifications: {
    maintenance: boolean;
    expenses: boolean;
    documents: boolean;
    reminders: boolean;
  };
  privacy: {
    shareData: boolean;
    analytics: boolean;
  };
}

export interface AppSettings {
  appVersion: string;
  lastUpdate?: string;
  firstLaunch?: boolean;
  onboardingCompleted?: boolean;
}

// 🏪 STORE SOLO PER DATI DELL'APP - NON AUTH
interface StoreState {
  // ✅ STATO DELL'APP (NON AUTH)
  darkMode: boolean;
  preferences: UserPreferences;
  appSettings: AppSettings;
  cars: Car[];
  isLoading: boolean;
  error: string | null;

  // ✅ ACTIONS DELL'APP (NON AUTH)
  // Gestione tema e preferenze
  setDarkMode: (darkMode: boolean) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  updateAppSettings: (settings: Partial<AppSettings>) => void;

  // Gestione auto
  addCar: (car: Car) => void;
  updateCar: (carId: string, updates: Partial<Car>) => void;
  removeCar: (carId: string) => void;
  getCar: (carId: string) => Car | undefined;

  // Gestione manutenzioni
  addMaintenanceRecord: (carId: string, record: MaintenanceRecord) => void;
  updateMaintenanceRecord: (carId: string, recordId: string, updates: Partial<MaintenanceRecord>) => void;
  removeMaintenanceRecord: (carId: string, recordId: string) => void;
  getMaintenanceHistory: (carId: string) => MaintenanceRecord[];

  // Gestione stato
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Reset e pulizia
  resetAppData: () => void;
}

// Valori di default
const defaultPreferences: UserPreferences = {
  theme: 'auto',
  language: 'it',
  currency: 'EUR',
  distanceUnit: 'km',
  fuelUnit: 'liters',
  notifications: {
    maintenance: true,
    expenses: true,
    documents: true,
    reminders: true,
  },
  privacy: {
    shareData: false,
    analytics: true,
  },
};

const defaultAppSettings: AppSettings = {
  appVersion: '1.0.0',
  firstLaunch: true,
  onboardingCompleted: false,
};

export const useStore = create<StoreState>()(
    persist(
        (set, get) => ({
          // ✅ STATO INIZIALE DELL'APP
          darkMode: false,
          preferences: defaultPreferences,
          appSettings: defaultAppSettings,
          cars: [],
          isLoading: false,
          error: null,

          // ✅ GESTIONE TEMA E PREFERENZE
          setDarkMode: (darkMode) => {
            set({ darkMode });
            // Aggiorna anche nelle preferenze
            const currentPreferences = get().preferences;
            set({
              preferences: {
                ...currentPreferences,
                theme: darkMode ? 'dark' : 'light'
              }
            });
          },

          updatePreferences: (newPreferences) => {
            const currentPreferences = get().preferences;
            const updatedPreferences = { ...currentPreferences, ...newPreferences };
            set({ preferences: updatedPreferences });

            // Aggiorna il darkMode se il tema è cambiato
            if (newPreferences.theme) {
              const systemDarkMode = false; // Qui potresti usare Appearance.getColorScheme()
              const shouldUseDarkMode = newPreferences.theme === 'dark' ||
                  (newPreferences.theme === 'auto' && systemDarkMode);
              set({ darkMode: shouldUseDarkMode });
            }
          },

          updateAppSettings: (newSettings) => {
            const currentSettings = get().appSettings;
            set({ appSettings: { ...currentSettings, ...newSettings } });
          },

          // ✅ GESTIONE AUTO
          addCar: (car) => {
            const cars = get().cars;
            set({
              cars: [...cars, car],
              error: null
            });
          },

          updateCar: (carId, updates) => {
            const cars = get().cars;
            const updatedCars = cars.map(car =>
                car.id === carId ? { ...car, ...updates } : car
            );
            set({
              cars: updatedCars,
              error: null
            });
          },

          removeCar: (carId) => {
            const cars = get().cars;
            const updatedCars = cars.filter(car => car.id !== carId);
            set({
              cars: updatedCars,
              error: null
            });
          },

          getCar: (carId) => {
            const cars = get().cars;
            return cars.find(car => car.id === carId);
          },

          // ✅ GESTIONE MANUTENZIONI
          addMaintenanceRecord: (carId, record) => {
            const cars = get().cars;
            const updatedCars = cars.map(car => {
              if (car.id === carId) {
                return {
                  ...car,
                  maintenanceHistory: [...(car.maintenanceHistory || []), record]
                };
              }
              return car;
            });
            set({
              cars: updatedCars,
              error: null
            });
          },

          updateMaintenanceRecord: (carId, recordId, updates) => {
            const cars = get().cars;
            const updatedCars = cars.map(car => {
              if (car.id === carId && car.maintenanceHistory) {
                const updatedHistory = car.maintenanceHistory.map(record =>
                    record.id === recordId ? { ...record, ...updates } : record
                );
                return { ...car, maintenanceHistory: updatedHistory };
              }
              return car;
            });
            set({
              cars: updatedCars,
              error: null
            });
          },

          removeMaintenanceRecord: (carId, recordId) => {
            const cars = get().cars;
            const updatedCars = cars.map(car => {
              if (car.id === carId && car.maintenanceHistory) {
                const updatedHistory = car.maintenanceHistory.filter(
                    record => record.id !== recordId
                );
                return { ...car, maintenanceHistory: updatedHistory };
              }
              return car;
            });
            set({
              cars: updatedCars,
              error: null
            });
          },

          getMaintenanceHistory: (carId) => {
            const car = get().getCar(carId);
            return car?.maintenanceHistory || [];
          },

          // ✅ GESTIONE STATO
          setLoading: (loading) => {
            set({ isLoading: loading });
          },

          setError: (error) => {
            set({ error });
          },

          clearError: () => {
            set({ error: null });
          },

          // ✅ RESET E PULIZIA
          resetAppData: () => {
            set({
              cars: [],
              preferences: defaultPreferences,
              appSettings: { ...defaultAppSettings, firstLaunch: false },
              isLoading: false,
              error: null,
            });
          },
        }),
        {
          name: 'auto-manager-storage',
          storage: createJSONStorage(() => AsyncStorage),
          // 🔒 PERSISTI SOLO DATI DELL'APP, NON AUTH
          partialize: (state) => ({
            darkMode: state.darkMode,
            preferences: state.preferences,
            appSettings: state.appSettings,
            cars: state.cars,
            // ❌ NON persistere isLoading, error (stati temporanei)
          }),
          // Gestione migrazione versioni
          version: 1,
          migrate: (persistedState: any, version: number) => {
            // Se il formato cambia in futuro, gestisci la migrazione qui
            if (version === 0) {
              // Migrazione dalla versione 0 alla 1
              return {
                ...persistedState,
                preferences: { ...defaultPreferences, ...persistedState.preferences },
                appSettings: { ...defaultAppSettings, ...persistedState.appSettings },
              };
            }
            return persistedState;
          },
        }
    )
);

// 🔧 HOOK UTILITY PER DATI UTENTE DA FIREBASE
import { useAuth } from '../hooks/useAuth';

export const useUserData = () => {
  const { user } = useAuth(); // Prendi solo da Firebase

  return {
    userId: user?.uid,
    userName: user?.displayName || user?.firstName || 'Utente',
    userEmail: user?.email,
    isMechanic: user?.userType === 'mechanic',
    isEmailVerified: user?.emailVerified,
    photoURL: user?.photoURL,
    phoneNumber: user?.phoneNumber,

    // Dati specifici meccanico
    workshopName: user?.workshopName,
    workshopAddress: user?.address,
    vatNumber: user?.vatNumber,

    // Stati
    isAuthenticated: !!user,
    profileComplete: user?.profileComplete || false,
  };
};

// 🎛️ HOOK UTILITY PER CONTROLLI VELOCI
export const useAppState = () => {
  const { isLoading, error, clearError } = useStore();
  const { user, loading: authLoading } = useAuth();

  return {
    isLoading: isLoading || authLoading,
    error,
    clearError,
    isAuthenticated: !!user,
  };
};

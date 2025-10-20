// src/store/index.ts - Store Principale compatibile con Zustand 4.x
import create from 'zustand'; // ⚠️ NOTA: import diverso in Zustand 4.x
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ====================================
// INTERFACCE E TIPI
// ====================================

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
    // Dati specifici per meccanici
    workshopName?: string;
    workshopAddress?: string;
    vatNumber?: string;
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

// ====================================
// INTERFACCIA DELLO STORE
// ====================================

interface StoreState {
    // === STATO UTENTE ===
    user: User | null;

    // === STATO DELL'APP ===
    darkMode: boolean;
    preferences: UserPreferences;
    appSettings: AppSettings;
    isLoading: boolean;
    error: string | null;

    // === ACTIONS PER UTENTE ===
    setUser: (user: User | null) => void;
    updateUser: (updates: Partial<User>) => void;

    // === ACTIONS PER L'APP ===
    setDarkMode: (darkMode: boolean) => void;
    updatePreferences: (preferences: Partial<UserPreferences>) => void;
    updateAppSettings: (settings: Partial<AppSettings>) => void;

    // === GESTIONE STATO ===
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;

    // === RESET E PULIZIA ===
    resetStore: () => void;
    logout: () => void;
}

// ====================================
// VALORI DI DEFAULT
// ====================================

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

// ====================================
// CREAZIONE DELLO STORE (ZUSTAND 4.x)
// ====================================

export const useStore = create<StoreState>(
    persist(
        (set, get) => ({
            // === STATO INIZIALE ===
            user: null,
            darkMode: false,
            preferences: defaultPreferences,
            appSettings: defaultAppSettings,
            isLoading: false,
            error: null,

            // === GESTIONE UTENTE ===
            setUser: (user) => {
                console.log('📱 Store: Setting user:', user?.email);
                set({
                    user,
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

            // === GESTIONE TEMA E PREFERENZE ===
            setDarkMode: (darkMode) => {
                set({ darkMode });
                // Aggiorna anche nelle preferenze
                const currentPreferences = get().preferences;
                set({
                    preferences: {
                        ...currentPreferences,
                        theme: darkMode ? 'dark' : 'light',
                    },
                });
            },

            updatePreferences: (preferences) => {
                const currentPreferences = get().preferences;
                set({
                    preferences: { ...currentPreferences, ...preferences },
                    error: null,
                });
            },

            updateAppSettings: (settings) => {
                const currentSettings = get().appSettings;
                set({
                    appSettings: { ...currentSettings, ...settings },
                    error: null,
                });
            },

            // === GESTIONE STATO ===
            setLoading: (loading) => {
                set({ isLoading: loading });
            },

            setError: (error) => {
                set({ error });
            },

            clearError: () => {
                set({ error: null });
            },

            // === RESET E PULIZIA ===
            resetStore: () => {
                set({
                    user: null,
                    darkMode: false,
                    preferences: defaultPreferences,
                    appSettings: { ...defaultAppSettings, firstLaunch: false },
                    isLoading: false,
                    error: null,
                });
            },

            logout: () => {
                console.log('🚪 Store: Logging out user');
                set({
                    user: null,
                    isLoading: false,
                    error: null,
                });
            },
        }),
        {
            name: 'auto-manager-storage',
            // ⚠️ In Zustand 4.x, getStorage è diverso
            getStorage: () => AsyncStorage,

            // Persisti solo dati essenziali
            partialize: (state) => ({
                darkMode: state.darkMode,
                preferences: state.preferences,
                appSettings: state.appSettings,
                // NON persistere user, isLoading, error (stati temporanei)
            }),

            // Gestione migrazione versioni
            version: 2,
            migrate: (persistedState: any, version: number) => {
                if (version < 2) {
                    // Migrazione dalla versione 1 alla 2
                    const { user, ...rest } = persistedState;
                    return {
                        ...rest,
                        preferences: { ...defaultPreferences, ...persistedState.preferences },
                        appSettings: { ...defaultAppSettings, ...persistedState.appSettings },
                    };
                }
                return persistedState;
            },
        }
    )
);

// ====================================
// HOOKS DI UTILITÀ
// ====================================

// Hook per accesso rapido all'utente
export const useUser = () => {
    const { user } = useStore();
    return user;
};

// Hook per accesso rapido al tema
export const useTheme = () => {
    const { darkMode } = useStore();
    return {
        darkMode,
        colors: {
            background: darkMode ? '#111827' : '#f3f4f6',
            cardBackground: darkMode ? '#1f2937' : '#ffffff',
            text: darkMode ? '#ffffff' : '#000000',
            textSecondary: darkMode ? '#9ca3af' : '#6b7280',
            border: darkMode ? '#374151' : '#e5e7eb',
            primary: '#3b82f6',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
        },
    };
};

// Hook per preferenze
export const usePreferences = () => {
    const { preferences } = useStore();
    return preferences;
};
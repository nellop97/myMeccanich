// src/hooks/useUserData.ts - HOOK UTILITY PER DATI UTENTE
import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useStore } from '../store';

// 🔧 HOOK PRINCIPALE PER DATI UTENTE
export const useUserData = () => {
    const { user } = useAuth(); // Prendi solo da Firebase

    // Memoizza i dati per evitare ricalcoli inutili
    const userData = useMemo(() => {
        if (!user) {
            return {
                userId: null,
                userName: null,
                userEmail: null,
                isMechanic: false,
                isEmailVerified: false,
                photoURL: null,
                phoneNumber: null,
                workshopName: null,
                workshopAddress: null,
                vatNumber: null,
                isAuthenticated: false,
                profileComplete: false,
            };
        }

        return {
            userId: user.uid,
            userName: user.displayName || user.firstName || 'Utente',
            userEmail: user.email,
            isMechanic: user.userType === 'mechanic',
            isEmailVerified: user.emailVerified,
            photoURL: user.photoURL,
            phoneNumber: user.phoneNumber,

            // Dati specifici meccanico
            workshopName: user.workshopName,
            workshopAddress: user.address,
            vatNumber: user.vatNumber,

            // Stati
            isAuthenticated: true,
            profileComplete: user.profileComplete || false,
        };
    }, [user]);

    return userData;
};

// 🎛️ HOOK PER STATO GLOBALE DELL'APP
export const useAppState = () => {
    const { isLoading, error, clearError } = useStore();
    const { loading: authLoading, initializing } = useAuth();

    const appState = useMemo(() => ({
        isLoading: isLoading || authLoading || initializing,
        error,
        clearError,
        isInitializing: initializing,
        isAuthLoading: authLoading,
        isAppLoading: isLoading,
    }), [isLoading, authLoading, initializing, error, clearError]);

    return appState;
};

// 🚗 HOOK PER GESTIONE AUTO
export const useUserCars = () => {
    const { cars, addCar, updateCar, removeCar, getCar } = useStore();
    const { userId } = useUserData();

    // Filtra le auto dell'utente corrente (se implementi multi-utente)
    const userCars = useMemo(() => {
        // Per ora restituisci tutte le auto, ma in futuro potresti filtrare per userId
        return cars;
    }, [cars]);

    const carOperations = useMemo(() => ({
        cars: userCars,
        addCar,
        updateCar,
        removeCar,
        getCar,
        carsCount: userCars.length,
        hasCars: userCars.length > 0,
    }), [userCars, addCar, updateCar, removeCar, getCar]);

    return carOperations;
};

// 🔧 HOOK PER MANUTENZIONI
export const useMaintenanceData = (carId?: string) => {
    const {
        addMaintenanceRecord,
        updateMaintenanceRecord,
        removeMaintenanceRecord,
        getMaintenanceHistory
    } = useStore();

    const maintenanceOperations = useMemo(() => {
        if (!carId) {
            return {
                maintenanceHistory: [],
                addMaintenance: addMaintenanceRecord,
                updateMaintenance: updateMaintenanceRecord,
                removeMaintenance: removeMaintenanceRecord,
                maintenanceCount: 0,
                hasMaintenance: false,
            };
        }

        const history = getMaintenanceHistory(carId);

        return {
            maintenanceHistory: history,
            addMaintenance: (record: any) => addMaintenanceRecord(carId, record),
            updateMaintenance: (recordId: string, updates: any) =>
                updateMaintenanceRecord(carId, recordId, updates),
            removeMaintenance: (recordId: string) =>
                removeMaintenanceRecord(carId, recordId),
            maintenanceCount: history.length,
            hasMaintenance: history.length > 0,
        };
    }, [carId, addMaintenanceRecord, updateMaintenanceRecord, removeMaintenanceRecord, getMaintenanceHistory]);

    return maintenanceOperations;
};

// 🎨 HOOK PER TEMA E PREFERENZE
export const useAppTheme = () => {
    const { darkMode, preferences, setDarkMode, updatePreferences } = useStore();

    const themeOperations = useMemo(() => ({
        darkMode,
        theme: darkMode ? 'dark' : 'light',
        preferences,
        setDarkMode,
        updatePreferences,
        toggleDarkMode: () => setDarkMode(!darkMode),
    }), [darkMode, preferences, setDarkMode, updatePreferences]);

    return themeOperations;
};

// 🛡️ HOOK PER CONTROLLI DI AUTORIZZAZIONE
export const usePermissions = () => {
    const { isMechanic, isAuthenticated } = useUserData();

    const permissions = useMemo(() => ({
        canAccessMechanicFeatures: isAuthenticated && isMechanic,
        canAccessUserFeatures: isAuthenticated && !isMechanic,
        canCreateInvoices: isAuthenticated && isMechanic,
        canManageCustomers: isAuthenticated && isMechanic,
        canViewReports: isAuthenticated && isMechanic,
        canManageCars: isAuthenticated,
        canAddMaintenance: isAuthenticated,
        isAuthenticated,
        isMechanic,
    }), [isAuthenticated, isMechanic]);

    return permissions;
};

// 📊 HOOK PER STATISTICHE UTENTE
export const useUserStats = () => {
    const { cars } = useUserCars();
    const { isAuthenticated } = useUserData();

    const stats = useMemo(() => {
        if (!isAuthenticated || !cars.length) {
            return {
                totalCars: 0,
                totalMaintenanceRecords: 0,
                averageCarAge: 0,
                oldestCar: null,
                newestCar: null,
                carsNeedingService: 0,
            };
        }

        const currentYear = new Date().getFullYear();
        const totalMaintenanceRecords = cars.reduce(
            (total, car) => total + (car.maintenanceHistory?.length || 0),
            0
        );

        const carAges = cars.map(car => currentYear - car.year);
        const averageCarAge = carAges.reduce((sum, age) => sum + age, 0) / cars.length;

        const oldestCar = cars.reduce((oldest, car) =>
            (!oldest || car.year < oldest.year) ? car : oldest
        );

        const newestCar = cars.reduce((newest, car) =>
            (!newest || car.year > newest.year) ? car : newest
        );

        // Auto che potrebbero aver bisogno di servizio (semplificato)
        const carsNeedingService = cars.filter(car => {
            const lastService = car.lastService;
            if (!lastService) return true;

            const lastServiceDate = new Date(lastService);
            const monthsAgo = (Date.now() - lastServiceDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
            return monthsAgo > 6; // Più di 6 mesi dall'ultimo servizio
        }).length;

        return {
            totalCars: cars.length,
            totalMaintenanceRecords,
            averageCarAge: Math.round(averageCarAge),
            oldestCar,
            newestCar,
            carsNeedingService,
        };
    }, [isAuthenticated, cars]);

    return stats;
};

// 🔍 HOOK PER RICERCA E FILTRI
export const useSearchAndFilter = <T>(
    items: T[],
    searchKey: keyof T,
    initialFilter?: string
) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState(initialFilter || 'all');

    const filteredItems = useMemo(() => {
        let filtered = items;

        // Applica ricerca
        if (searchQuery.trim()) {
            filtered = filtered.filter(item =>
                String(item[searchKey]).toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Qui puoi aggiungere logica di filtro specifica
        // basata su activeFilter

        return filtered;
    }, [items, searchQuery, activeFilter, searchKey]);

    return {
        searchQuery,
        setSearchQuery,
        activeFilter,
        setActiveFilter,
        filteredItems,
        hasResults: filteredItems.length > 0,
        resultsCount: filteredItems.length,
    };
};

// 🚨 HOOK PER NOTIFICHE E PROMEMORIA
export const useNotifications = () => {
    const { cars } = useUserCars();
    const { preferences } = useAppTheme();

    const notifications = useMemo(() => {
        if (!preferences.notifications.maintenance) {
            return [];
        }

        const today = new Date();
        const notificationList: Array<{
            id: string;
            type: 'maintenance' | 'insurance' | 'inspection';
            message: string;
            carId: string;
            carName: string;
            dueDate: Date;
            priority: 'high' | 'medium' | 'low';
        }> = [];

        cars.forEach(car => {
            const carName = `${car.make} ${car.model}`;

            // Controllo scadenza assicurazione
            if (car.insuranceExpiry) {
                const expiryDate = new Date(car.insuranceExpiry);
                const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
                    notificationList.push({
                        id: `insurance-${car.id}`,
                        type: 'insurance',
                        message: `L'assicurazione di ${carName} scade tra ${daysUntilExpiry} giorni`,
                        carId: car.id,
                        carName,
                        dueDate: expiryDate,
                        priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
                    });
                }
            }

            // Controllo scadenza revisione
            if (car.inspectionExpiry) {
                const expiryDate = new Date(car.inspectionExpiry);
                const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
                    notificationList.push({
                        id: `inspection-${car.id}`,
                        type: 'inspection',
                        message: `La revisione di ${carName} scade tra ${daysUntilExpiry} giorni`,
                        carId: car.id,
                        carName,
                        dueDate: expiryDate,
                        priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
                    });
                }
            }

            // Controllo prossimo servizio
            if (car.nextService) {
                const serviceDate = new Date(car.nextService);
                const daysUntilService = Math.ceil((serviceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                if (daysUntilService <= 14 && daysUntilService > 0) {
                    notificationList.push({
                        id: `maintenance-${car.id}`,
                        type: 'maintenance',
                        message: `${carName} ha il prossimo servizio tra ${daysUntilService} giorni`,
                        carId: car.id,
                        carName,
                        dueDate: serviceDate,
                        priority: daysUntilService <= 3 ? 'high' : 'low',
                    });
                }
            }
        });

        // Ordina per priorità e data
        return notificationList.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return a.dueDate.getTime() - b.dueDate.getTime();
        });
    }, [cars, preferences.notifications.maintenance]);

    return {
        notifications,
        hasNotifications: notifications.length > 0,
        highPriorityCount: notifications.filter(n => n.priority === 'high').length,
        notificationCount: notifications.length,
    };
};

// src/navigation/AppNavigator.tsx - VERSIONE CON LOADING CORRETTO
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ============================================================
// SCHERMATE DI AUTENTICAZIONE
// ============================================================
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import LoadingSplashScreen from '../screens/LoadingSplashScreen';

// ============================================================
// SCHERMATE MECCANICO
// ============================================================
import MechanicDashboard from '../screens/mechanic/MechanicDashboard';
import NewAppointmentScreen from '../screens/mechanic/NewAppointmentScreen';
import AllCarsInWorkshopScreen from '../screens/mechanic/AllCarsInWorkshopScreen';
import RepairPartsManagementScreen from '../screens/mechanic/RepairPartsManagementScreen';
import MechanicCalendarScreen from '../screens/mechanic/MechanicCalendarScreen';
import InvoicingDashboardScreen from '../screens/mechanic/InvoicingDashboardScreen';
import CreateInvoiceScreen from '../screens/mechanic/CreateInvoiceScreen';
import CustomersListScreen from '../screens/mechanic/CustomersListScreen';
import AddCustomerScreen from '../screens/mechanic/AddCustomerScreen';

// ============================================================
// SCHERMATE UTENTE PROPRIETARIO
// ============================================================
import VehicleListScreen from '../screens/user/VehicleListScreen';
import CarDetailScreen from '../screens/user/CarDetailScreen';
import AddCarScreen from '../screens/user/AddCarScreen';
import AddMaintenanceScreen from '../screens/user/AddMaintenanceScreen';
import AddExpenseScreen from '../screens/user/AddExpenseScreen';
import AddFuelScreen from '../screens/user/AddFuelScreen';
import RemindersListScreen from '../screens/user/RemindersListScreen';
import AddReminderScreen from '../screens/user/AddReminderScreen';
import DocumentsListScreen from '../screens/user/DocumentsListScreen';
import AddDocumentScreen from '../screens/user/AddDocumentScreen';

// ============================================================
// SCHERMATE COMUNI
// ============================================================
import ProfileScreen from '../screens/ProfileScreen';

// ============================================================
// HOOKS E STORE
// ============================================================
import { useAuth } from '../hooks/useAuth';
import { useStore } from '../store';

// ============================================================
// DEFINIZIONE TIPI NAVIGAZIONE
// ============================================================
export type RootStackParamList = {
    // Auth & Loading
    Loading: undefined;
    Login: undefined;
    Register: undefined;

    // User/Proprietario - Main Screens
    VehicleList: undefined;
    AddVehicle: undefined;
    CarDetail: { carId: string };

    // Manutenzioni
    AddMaintenance: { carId: string };

    // Spese
    AddExpense: { carId: string };

    // Carburante
    AddFuel: { carId: string };

    // Promemoria/Scadenze
    RemindersList: undefined;
    AddReminder: { carId: string };

    // Documenti
    DocumentsList: { carId: string };
    AddDocument: { carId: string };

    // Profilo
    Profile: undefined;

    // Meccanico
    HomeMechanic: undefined;
    NewAppointment: undefined;
    AllCarsInWorkshop: undefined;
    RepairPartsManagement: { carId: string; repairId: string };
    MechanicCalendar: undefined;
    InvoicingDashboard: undefined;
    CreateInvoice: {
        carId?: string;
        repairId?: string;
        customerId?: string;
        type?: 'customer' | 'supplier' | 'expense' | 'other'
    };
    CustomersList: undefined;
    AddCustomer: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ============================================================
// NAVIGATOR PRINCIPALE DELL'APP
// ============================================================
export default function AppNavigator() {
    // 🔐 Hook autenticazione con stato inizializzazione
    const { user: authUser, initializing } = useAuth();

    // 🗄️ Store Zustand
    const { user: storeUser } = useStore();

    // ============================================================
    // GESTIONE STATI DI AUTENTICAZIONE
    // ============================================================

    // 1️⃣ Mostra splash screen durante l'inizializzazione
    if (initializing) {
        return <LoadingSplashScreen message="Inizializzazione..." />;
    }

    // 2️⃣ Determina se l'utente è autenticato
    // Usiamo sia authUser che storeUser per massima affidabilità
    const isAuthenticated = Boolean(authUser?.uid || storeUser?.isLoggedIn);

    // 3️⃣ Determina il tipo di utente
    const isMechanic = Boolean(
        authUser?.isMechanic ||
        authUser?.userType === 'mechanic' ||
        storeUser?.isMechanic ||
        storeUser?.userType === 'mechanic'
    );

    console.log('🧭 AppNavigator State:', {
        initializing,
        isAuthenticated,
        isMechanic,
        authUserType: authUser?.userType,
        storeUserType: storeUser?.userType,
    });

    // ============================================================
    // NAVIGAZIONE CONDIZIONALE
    // ============================================================

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: true,
                headerShadowVisible: false,
                animation: 'fade', // Transizione fluida
            }}
        >
            {!isAuthenticated ? (
                // ============================================================
                // 🔓 STACK AUTENTICAZIONE (utente NON autenticato)
                // ============================================================
                <>
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{
                            title: 'Accedi',
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen
                        name="Register"
                        component={RegisterScreen}
                        options={{
                            title: 'Registrati',
                            headerBackTitle: 'Indietro',
                            animation: 'slide_from_right',
                        }}
                    />
                </>
            ) : isMechanic ? (
                // ============================================================
                // 🔧 STACK MECCANICO (utente autenticato come meccanico)
                // ============================================================
                <>
                    {/* Dashboard Meccanico */}
                    <Stack.Screen
                        name="HomeMechanic"
                        component={MechanicDashboard}
                        options={{
                            title: 'Dashboard Meccanico',
                            headerShown: false,
                        }}
                    />

                    {/* Appuntamenti */}
                    <Stack.Screen
                        name="NewAppointment"
                        component={NewAppointmentScreen}
                        options={{
                            title: 'Nuovo Appuntamento',
                            headerBackTitle: 'Indietro',
                            presentation: 'modal',
                        }}
                    />

                    {/* Auto in officina */}
                    <Stack.Screen
                        name="AllCarsInWorkshop"
                        component={AllCarsInWorkshopScreen}
                        options={{
                            title: 'Auto in Officina',
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    {/* Gestione ricambi */}
                    <Stack.Screen
                        name="RepairPartsManagement"
                        component={RepairPartsManagementScreen}
                        options={{
                            title: 'Gestione Ricambi',
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    {/* Calendario */}
                    <Stack.Screen
                        name="MechanicCalendar"
                        component={MechanicCalendarScreen}
                        options={{
                            title: 'Calendario',
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    {/* Fatturazione */}
                    <Stack.Screen
                        name="InvoicingDashboard"
                        component={InvoicingDashboardScreen}
                        options={{
                            title: 'Fatturazione',
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    <Stack.Screen
                        name="CreateInvoice"
                        component={CreateInvoiceScreen}
                        options={{
                            title: 'Nuova Fattura',
                            headerBackTitle: 'Indietro',
                            presentation: 'modal',
                        }}
                    />

                    {/* Clienti */}
                    <Stack.Screen
                        name="CustomersList"
                        component={CustomersListScreen}
                        options={{
                            title: 'Clienti',
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    <Stack.Screen
                        name="AddCustomer"
                        component={AddCustomerScreen}
                        options={{
                            title: 'Aggiungi Cliente',
                            headerBackTitle: 'Indietro',
                            presentation: 'modal',
                        }}
                    />

                    {/* Profilo */}
                    <Stack.Screen
                        name="Profile"
                        component={ProfileScreen}
                        options={{
                            title: 'Profilo',
                            headerBackTitle: 'Indietro',
                        }}
                    />
                </>
            ) : (
                // ============================================================
                // 🚗 STACK PROPRIETARIO AUTO (utente autenticato come owner)
                // ============================================================
                <>
                    {/* Lista veicoli (Home) */}
                    <Stack.Screen
                        name="VehicleList"
                        component={VehicleListScreen}
                        options={{
                            title: 'I Miei Veicoli',
                            headerShown: false,
                        }}
                    />

                    {/* Aggiungi veicolo */}
                    <Stack.Screen
                        name="AddVehicle"
                        component={AddCarScreen}
                        options={{
                            title: 'Aggiungi Veicolo',
                            headerBackTitle: 'Indietro',
                            presentation: 'modal',
                        }}
                    />

                    {/* Dettaglio auto */}
                    <Stack.Screen
                        name="CarDetail"
                        component={CarDetailScreen}
                        options={{
                            title: 'Dettaglio Auto',
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    {/* Manutenzione */}
                    <Stack.Screen
                        name="AddMaintenance"
                        component={AddMaintenanceScreen}
                        options={{
                            title: 'Aggiungi Manutenzione',
                            headerBackTitle: 'Indietro',
                            presentation: 'modal',
                        }}
                    />

                    {/* Spese */}
                    <Stack.Screen
                        name="AddExpense"
                        component={AddExpenseScreen}
                        options={{
                            title: 'Aggiungi Spesa',
                            headerBackTitle: 'Indietro',
                            presentation: 'modal',
                        }}
                    />

                    {/* Carburante */}
                    <Stack.Screen
                        name="AddFuel"
                        component={AddFuelScreen}
                        options={{
                            title: 'Aggiungi Rifornimento',
                            headerBackTitle: 'Indietro',
                            presentation: 'modal',
                        }}
                    />

                    {/* Promemoria */}
                    <Stack.Screen
                        name="RemindersList"
                        component={RemindersListScreen}
                        options={{
                            title: 'Promemoria',
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    <Stack.Screen
                        name="AddReminder"
                        component={AddReminderScreen}
                        options={{
                            title: 'Nuovo Promemoria',
                            headerBackTitle: 'Indietro',
                            presentation: 'modal',
                        }}
                    />

                    {/* Documenti */}
                    <Stack.Screen
                        name="DocumentsList"
                        component={DocumentsListScreen}
                        options={{
                            title: 'Documenti',
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    <Stack.Screen
                        name="AddDocument"
                        component={AddDocumentScreen}
                        options={{
                            title: 'Aggiungi Documento',
                            headerBackTitle: 'Indietro',
                            presentation: 'modal',
                        }}
                    />

                    {/* Profilo */}
                    <Stack.Screen
                        name="Profile"
                        component={ProfileScreen}
                        options={{
                            title: 'Profilo',
                            headerBackTitle: 'Indietro',
                        }}
                    />
                </>
            )}
        </Stack.Navigator>
    );
}
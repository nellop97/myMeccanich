// AppNavigator.tsx
// Navigator completo con tutte le schermate del progetto

import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useStore } from '../store';

// ============================================
// AUTH SCREENS
// ============================================
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

// ============================================
// USER (OWNER) SCREENS
// ============================================
import HomeScreen from '../screens/user/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CarDetailScreen from '../screens/user/CarDetailScreen';
import AddVehicleScreen from '../screens/user/AddVehicleScreen';
import VehicleListScreen from '../screens/user/VehicleListScreen';
import CarsListScreen from '../screens/user/CarsListScreen';
import MaintenanceHistoryScreen from '../screens/user/MaintenanceHistoryScreen';
import AddMaintenanceScreen from '../screens/user/AddMaintenanceScreen';
import FuelTrackingScreen from '../screens/user/FuelTrackingScreen';
import ExpenseTrackerScreen from '../screens/user/ExpenseTrackerScreen';
import CarExpensesScreen from '../screens/user/CarExpensesScreen';
import OwnershipTransferScreen from '../screens/user/OwnershipTransferScreen';

// Placeholder screens (se non esistono ancora, crea file vuoti)
// import AddFuelScreen from '../screens/user/AddFuelScreen';
// import AddExpenseScreen from '../screens/user/AddExpenseScreen';
// import AddDocumentScreen from '../screens/user/AddDocumentScreen';
// import RemindersScreen from '../screens/user/RemindersScreen';

// ============================================
// MECHANIC SCREENS
// ============================================
import MechanicDashboard from '../screens/mechanic/MechanicDashboard';
import AllCarsInWorkshopScreen from '../screens/mechanic/AllCarsInWorkshopScreen';
import RepairPartsManagementScreen from '../screens/mechanic/RepairPartsManagementScreen';
import NewAppointmentScreen from '../screens/mechanic/NewAppointmentScreen';
import MechanicCalendarScreen from '../screens/mechanic/MechanicCalendarScreen';
import InvoicingDashboardScreen from '../screens/mechanic/InvoicingDashboardScreen';
import CreateInvoiceScreen from '../screens/mechanic/CreateInvoiceScreen';
import CustomersListScreen from '../screens/mechanic/CustomersListScreen';
import AddCustomerScreen from '../screens/mechanic/AddCustomerScreen';
import CustomerDetailScreen from '../screens/mechanic/CustomerDetailScreen';

// ============================================
// TYPE DEFINITIONS
// ============================================
export type RootStackParamList = {
    // Auth
    Auth: undefined;
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;

    // User (Owner) Home
    Home: undefined;
    Settings: undefined;
    Profile: { userId?: string };

    // Vehicle Management
    AddVehicle: undefined;
    CarDetail: { carId: string };
    VehicleList: undefined;
    CarsList: undefined;
    OwnershipTransfer: { carId: string };

    // Maintenance
    MaintenanceHistory: { carId: string };
    AddMaintenance: { carId?: string };

    // Fuel
    FuelTracking: { carId: string };
    AddFuel: { carId?: string };

    // Expenses
    ExpenseTracker: undefined;
    CarExpenses: { carId: string };
    AddExpense: { carId?: string };

    // Documents
    AddDocument: { carId?: string };

    // Reminders
    Reminders: undefined;

    // Mechanic Home
    HomeMechanic: undefined;

    // Workshop
    AllCarsInWorkshop: undefined;
    RepairPartsManagement: { carId: string; repairId: string };
    NewAppointment: undefined;
    MechanicCalendar: undefined;

    // Invoicing
    InvoicingDashboard: undefined;
    CreateInvoice: {
        vehicleId?: string;
        repairId?: string;
        customerId?: string;
        type?: 'customer' | 'supplier' | 'expense' | 'other';
    };
    InvoiceDetail: { invoiceId: string };
    InvoicesList: undefined;
    InvoiceTemplates: undefined;
    InvoiceReports: undefined;

    // Customers
    CustomersList: undefined;
    AddCustomer: undefined;
    EditCustomer: { customerId: string };
    CustomerDetail: { customerId: string };
};

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

// ============================================
// AUTH NAVIGATOR
// ============================================
function AuthNavigator() {
    return (
        <AuthStack.Navigator
            screenOptions={{
                headerShown: false,
                headerShadowVisible: false,
            }}
        >
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Register" component={RegisterScreen} />
            <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </AuthStack.Navigator>
    );
}

// ============================================
// PLACEHOLDER COMPONENTS
// ============================================
// Placeholder per schermate non ancora create
const PlaceholderScreen = ({ route }: any) => {
    return (
        <div style={{ padding: 20 }}>
            <h1>Schermata in Sviluppo</h1>
            <p>
                Screen: {route.name}
                <br />
                Params: {JSON.stringify(route.params || {})}
            </p>
        </div>
    );
};

// ============================================
// MAIN APP NAVIGATOR
// ============================================
export default function AppNavigator() {
    const { user } = useStore();
    const [isInitialRender, setIsInitialRender] = useState(true);

    useEffect(() => {
        if (isInitialRender) {
            setIsInitialRender(false);
        }
    }, [isInitialRender]);

    const isAuthenticated = !isInitialRender && user?.isLoggedIn;
    const isMechanic = user?.isMechanic;

    console.log('📱 AppNavigator State:', {
        isAuthenticated,
        isMechanic,
        userType: user?.userType,
    });

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
                // ========================================
                // NOT AUTHENTICATED - Auth Screens
                // ========================================
                <Stack.Screen name="Auth" component={AuthNavigator} />
            ) : isMechanic ? (
                // ========================================
                // MECHANIC NAVIGATOR
                // ========================================
                <Stack.Group>
                    {/* Home */}
                    <Stack.Screen
                        name="HomeMechanic"
                        component={MechanicDashboard}
                        options={{ headerShown: false }}
                    />

                    {/* Workshop */}
                    <Stack.Screen
                        name="AllCarsInWorkshop"
                        component={AllCarsInWorkshopScreen}
                        options={{
                            title: 'Auto in Officina',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    <Stack.Screen
                        name="RepairPartsManagement"
                        component={RepairPartsManagementScreen}
                        options={{
                            title: 'Gestione Ricambi',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    <Stack.Screen
                        name="NewAppointment"
                        component={NewAppointmentScreen}
                        options={{
                            title: 'Nuovo Appuntamento',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    <Stack.Screen
                        name="MechanicCalendar"
                        component={MechanicCalendarScreen}
                        options={{
                            title: 'Calendario',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    {/* Invoicing */}
                    <Stack.Screen
                        name="InvoicingDashboard"
                        component={InvoicingDashboardScreen}
                        options={{
                            title: 'Fatturazione',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    <Stack.Screen
                        name="CreateInvoice"
                        component={CreateInvoiceScreen}
                        options={{
                            title: 'Nuova Fattura',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    <Stack.Screen
                        name="InvoiceDetail"
                        component={PlaceholderScreen}
                        options={{
                            title: 'Dettaglio Fattura',
                            headerShown: false,
                        }}
                    />

                    <Stack.Screen
                        name="InvoicesList"
                        component={PlaceholderScreen}
                        options={{
                            title: 'Elenco Fatture',
                            headerShown: false,
                        }}
                    />

                    <Stack.Screen
                        name="InvoiceTemplates"
                        component={PlaceholderScreen}
                        options={{
                            title: 'Modelli Fattura',
                            headerShown: false,
                        }}
                    />

                    <Stack.Screen
                        name="InvoiceReports"
                        component={PlaceholderScreen}
                        options={{
                            title: 'Report Fatturazione',
                            headerShown: false,
                        }}
                    />

                    {/* Customers */}
                    <Stack.Screen
                        name="CustomersList"
                        component={CustomersListScreen}
                        options={{
                            title: 'Clienti',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    <Stack.Screen
                        name="AddCustomer"
                        component={AddCustomerScreen}
                        options={{
                            title: 'Nuovo Cliente',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    <Stack.Screen
                        name="EditCustomer"
                        component={AddCustomerScreen}
                        options={{
                            title: 'Modifica Cliente',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    <Stack.Screen
                        name="CustomerDetail"
                        component={CustomerDetailScreen}
                        options={{
                            title: 'Dettaglio Cliente',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    {/* Car Detail (shared) */}
                    <Stack.Screen
                        name="CarDetail"
                        component={CarDetailScreen}
                        options={{
                            title: 'Dettaglio Veicolo',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    {/* Settings */}
                    <Stack.Screen
                        name="Settings"
                        component={SettingsScreen}
                        options={{
                            title: 'Impostazioni',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    <Stack.Screen
                        name="Profile"
                        component={ProfileScreen}
                        options={{
                            title: 'Profilo',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />
                </Stack.Group>
            ) : (
                // ========================================
                // OWNER/USER NAVIGATOR
                // ========================================
                <Stack.Group>
                    {/* Home */}
                    <Stack.Screen
                        name="Home"
                        component={HomeScreen}
                        options={{ headerShown: false }}
                    />

                    {/* Vehicle Management */}
                    <Stack.Screen
                        name="AddVehicle"
                        component={AddVehicleScreen}
                        options={{
                            headerShown: false,
                            presentation: 'modal',
                            animation: 'slide_from_bottom',
                        }}
                    />

                    <Stack.Screen
                        name="CarDetail"
                        component={CarDetailScreen}
                        options={{
                            title: 'Dettaglio Veicolo',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    <Stack.Screen
                        name="VehicleList"
                        component={VehicleListScreen}
                        options={{
                            title: 'I Miei Veicoli',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    <Stack.Screen
                        name="CarsList"
                        component={CarsListScreen}
                        options={{
                            title: 'Lista Veicoli',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    <Stack.Screen
                        name="OwnershipTransfer"
                        component={OwnershipTransferScreen}
                        options={{
                            title: 'Trasferimento Proprietà',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    {/* Maintenance */}
                    <Stack.Screen
                        name="MaintenanceHistory"
                        component={MaintenanceHistoryScreen}
                        options={{
                            title: 'Storico Manutenzioni',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    <Stack.Screen
                        name="AddMaintenance"
                        component={AddMaintenanceScreen}
                        options={{
                            title: 'Nuova Manutenzione',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                            presentation: 'modal',
                        }}
                    />

                    {/* Fuel */}
                    <Stack.Screen
                        name="FuelTracking"
                        component={FuelTrackingScreen}
                        options={{
                            title: 'Rifornimenti',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    <Stack.Screen
                        name="AddFuel"
                        component={PlaceholderScreen}
                        options={{
                            title: 'Nuovo Rifornimento',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                            presentation: 'modal',
                        }}
                    />

                    {/* Expenses */}
                    <Stack.Screen
                        name="ExpenseTracker"
                        component={ExpenseTrackerScreen}
                        options={{
                            title: 'Spese',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    <Stack.Screen
                        name="CarExpenses"
                        component={CarExpensesScreen}
                        options={{
                            title: 'Spese Veicolo',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    <Stack.Screen
                        name="AddExpense"
                        component={PlaceholderScreen}
                        options={{
                            title: 'Nuova Spesa',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                            presentation: 'modal',
                        }}
                    />

                    {/* Documents */}
                    <Stack.Screen
                        name="AddDocument"
                        component={PlaceholderScreen}
                        options={{
                            title: 'Aggiungi Documento',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                            presentation: 'modal',
                        }}
                    />

                    {/* Reminders */}
                    <Stack.Screen
                        name="Reminders"
                        component={PlaceholderScreen}
                        options={{
                            title: 'Promemoria',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    {/* Settings */}
                    <Stack.Screen
                        name="Settings"
                        component={SettingsScreen}
                        options={{
                            title: 'Impostazioni',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />

                    <Stack.Screen
                        name="Profile"
                        component={ProfileScreen}
                        options={{
                            title: 'Profilo',
                            headerShown: false,
                            headerBackTitle: 'Indietro',
                        }}
                    />
                </Stack.Group>
            )}
        </Stack.Navigator>
    );
}

// ============================================
// NAVIGATION HELPERS
// ============================================
export const navigationRef = React.createRef<any>();

export function navigate(name: string, params?: any) {
    navigationRef.current?.navigate(name, params);
}

export function goBack() {
    navigationRef.current?.goBack();
}

export function reset(routeName: string) {
    navigationRef.current?.reset({
        index: 0,
        routes: [{ name: routeName }],
    });
}
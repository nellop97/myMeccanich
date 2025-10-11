// src/navigation/AppNavigator.tsx - VERSIONE CORRETTA
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';

// Schermate di autenticazione
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Schermate meccanico
import MechanicDashboard from '../screens/mechanic/MechanicDashboard';
import NewAppointmentScreen from '../screens/mechanic/NewAppointmentScreen';
import AllCarsInWorkshopScreen from '../screens/mechanic/AllCarsInWorkshopScreen';
import RepairPartsManagementScreen from '../screens/mechanic/RepairPartsManagementScreen';
import MechanicCalendarScreen from '../screens/mechanic/MechanicCalendarScreen';
import InvoicingDashboardScreen from '../screens/mechanic/InvoicingDashboardScreen';
import CreateInvoiceScreen from '../screens/mechanic/CreateInvoiceScreen';
import CustomersListScreen from '../screens/mechanic/CustomersListScreen';
import AddCustomerScreen from '../screens/mechanic/AddCustomerScreen';

// Schermate utente proprietario
import HomeScreen from '../screens/user/HomeScreen';
import CarDetailScreen from '../screens/user/CarDetailScreen';
import AddCarScreen from '../screens/user/AddCarScreen';
import CarMaintenanceScreen from '../screens/user/CarMaintenanceScreen';
import AddMaintenanceScreen from '../screens/user/AddMaintenanceScreen';
import ExpenseTrackerScreen from '../screens/user/ExpenseTrackerScreen';
import AddExpenseScreen from '../screens/user/AddExpenseScreen';
import CarExpensesScreen from '../screens/user/CarExpensesScreen';
import MaintenanceListScreen from '../screens/user/MaintenanceListScreen';
import VehicleListScreen from '../screens/user/VehicleListScreen';
import FuelTrackingScreen from '../screens/user/FuelTrackingScreen';
import CarOverviewScreen from '../screens/user/CarOverviewScreen';
import AddFuelScreen from '../screens/user/AddFuelScreen';
import TransferCarScreen from '../screens/user/TransferCarScreen';
import TransferRequestsScreen from '../screens/user/TransferRequestsScreen';
import CarsListScreen from '../screens/user/CarsListScreen';
import NotificationsScreen from '../screens/user/NotificationsScreen';

// Schermate comuni
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

import { useStore } from '../store';

// ============================================================
// DEFINIZIONE TIPI NAVIGAZIONE
// ============================================================
export type RootStackParamList = {
    // Auth
    Auth: undefined;
    Login: undefined;
    Register: undefined;

    // Tab Navigator principale per utenti
    Main: undefined;

    // Schermate User/Proprietario
    Home: undefined;
    Settings: undefined;
    Profile: { userId: string };
    VehicleList: undefined;
    AddVehicle: undefined;
    CarDetail: { carId: string };
    CarOverview: { carId: string };
    CarMaintenance: { carId: string };
    CarMaintenanceScreen: { carId: string };
    AddMaintenance: { carId?: string; category?: string };
    MaintenanceList: undefined;
    ExpenseTracker: undefined;
    CarExpenses: { carId: string };
    AddExpense: { carId?: string; category?: string };
    FuelTracking: { carId?: string };
    AddFuel: { carId?: string };
    RemindersList: undefined;
    AddReminder: { carId?: string };
    DocumentsList: { carId?: string };
    TransferCar: { carId?: string };
    TransferRequests: undefined;
    CarsListScreen: undefined;
    NotificationsScreen: undefined;

    // Schermate Meccanico
    HomeMechanic: undefined;
    NewAppointment: undefined;
    AllCarsInWorkshop: undefined;
    RepairPartsManagement: { carId: string; repairId: string };
    MechanicCalendar: undefined;
    InvoicingDashboard: undefined;
    CreateInvoice: { carId?: string; repairId?: string; customerId?: string; type?: 'customer' | 'supplier' | 'expense' | 'other' };
    CustomersList: undefined;
    AddCustomer: undefined;
    EditCustomer: { customerId: string };
    CustomerDetail: { customerId: string };
    InvoiceDetail: { invoiceId: string };
    InvoicesList: undefined;
    InvoiceTemplates: undefined;
    InvoiceReports: undefined;
};

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

export type MainTabParamList = {
    Home: undefined;
    Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ============================================================
// NAVIGATOR AUTENTICAZIONE
// ============================================================
function AuthNavigator() {
    return (
        <AuthStack.Navigator
            screenOptions={{
                headerShown: true,
                headerShadowVisible: false,
            }}>
            <AuthStack.Screen
                name="Login"
                component={LoginScreen}
                options={{
                    title: 'Accedi',
                    headerBackTitle: 'Indietro',
                }}
            />
            <AuthStack.Screen
                name="Register"
                component={RegisterScreen}
                options={{
                    title: 'Registrati',
                    headerBackTitle: 'Indietro',
                    animation: 'slide_from_right',
                }}
            />
        </AuthStack.Navigator>
    );
}

// ============================================================
// NAVIGATOR TAB PRINCIPALI (per utenti normali)
// ============================================================
function MainTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = 'home';
                    } else if (route.name === 'Settings') {
                        iconName = 'settings';
                    }

                    return <Ionicons name={iconName as any} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: 'gray',
            })}>
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: 'Home' }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ title: 'Impostazioni' }}
            />
        </Tab.Navigator>
    );
}

// ============================================================
// NAVIGATOR PRINCIPALE DELL'APP
// ============================================================
export default function AppNavigator() {
    const { user } = useStore();
    const [isInitialRender, setIsInitialRender] = useState(true);

    useEffect(() => {
        if (isInitialRender) {
            setIsInitialRender(false);
        }
    }, []);

    const isAuthenticated = !isInitialRender && user?.isLoggedIn;
    const isMechanic = user?.isMechanic;

    return (
        <Stack.Navigator screenOptions={{ headerShown: true }}>
            {isAuthenticated ? (
                isMechanic ? (
                    // ========================================
                    // STACK NAVIGATOR PER MECCANICI
                    // ========================================
                    <Stack.Group>
                        <Stack.Screen
                            name="HomeMechanic"
                            component={MechanicDashboard}
                            options={{
                                headerShown: false
                            }}
                        />
                        <Stack.Screen
                            name="CarDetail"
                            component={CarDetailScreen}
                            options={{
                                title: 'Dettaglio Auto',
                                headerShown: true,
                                headerBackTitle: 'Indietro'
                            }}
                        />
                        <Stack.Screen
                            name="AllCarsInWorkshop"
                            component={AllCarsInWorkshopScreen}
                            options={{
                                title: 'Auto in Officina',
                                headerShown: false,
                            }}
                        />
                        <Stack.Screen
                            name="RepairPartsManagement"
                            component={RepairPartsManagementScreen}
                            options={{
                                headerShown: false,
                            }}
                        />
                        <Stack.Screen
                            name="NewAppointment"
                            component={NewAppointmentScreen}
                            options={{
                                title: 'Nuovo Appuntamento',
                                headerShown: false
                            }}
                        />
                        <Stack.Screen
                            name="MechanicCalendar"
                            component={MechanicCalendarScreen}
                            options={{
                                headerShown: false,
                            }}
                        />

                        {/* Schermate Fatturazione */}
                        <Stack.Screen
                            name="InvoicingDashboard"
                            component={InvoicingDashboardScreen}
                            options={{
                                headerShown: false,
                            }}
                        />
                        <Stack.Screen
                            name="CreateInvoice"
                            component={CreateInvoiceScreen}
                            options={{
                                headerShown: false,
                            }}
                        />
                        <Stack.Screen
                            name="CustomersList"
                            component={CustomersListScreen}
                            options={{
                                headerShown: false,
                            }}
                        />
                        <Stack.Screen
                            name="AddCustomer"
                            component={AddCustomerScreen}
                            options={{
                                headerShown: false,
                            }}
                        />
                        <Stack.Screen
                            name="EditCustomer"
                            component={AddCustomerScreen}
                            options={{
                                headerShown: false,
                            }}
                        />
                    </Stack.Group>
                ) : (
                    // ========================================
                    // STACK NAVIGATOR PER UTENTI NORMALI
                    // ========================================
                    <Stack.Group>
                        {/* Main Tab Navigator - QUESTA È LA ROTTA PRINCIPALE */}
                        <Stack.Screen
                            name="Main"
                            component={MainTabNavigator}
                            options={{ headerShown: false }}
                        />

                        {/* ========== GESTIONE VEICOLI ========== */}
                        <Stack.Screen
                            name="VehicleList"
                            component={VehicleListScreen}
                            options={{
                                title: 'I Miei Veicoli',
                                headerShown: true
                            }}
                        />
                        <Stack.Screen
                            name="AddVehicle"
                            component={AddCarScreen}
                            options={{
                                title: 'Aggiungi Veicolo',
                                headerShown: true
                            }}
                        />
                        <Stack.Screen
                            name="CarDetail"
                            component={CarDetailScreen}
                            options={{
                                title: 'Dettaglio Veicolo',
                                headerShown: true
                            }}
                        />
                        <Stack.Screen
                            name="CarOverview"
                            component={CarOverviewScreen}
                            options={{
                                title: 'Panoramica Veicolo',
                                headerShown: true
                            }}
                        />
                        <Stack.Screen
                            name="CarsListScreen"
                            component={CarsListScreen}
                            options={{
                                title: 'Lista Veicoli',
                                headerShown: true
                            }}
                        />

                        {/* ========== MANUTENZIONI ========== */}
                        <Stack.Screen
                            name="CarMaintenanceScreen"
                            component={CarMaintenanceScreen}
                            options={{
                                title: 'Manutenzioni',
                                headerShown: true
                            }}
                        />
                        <Stack.Screen
                            name="AddMaintenance"
                            component={AddMaintenanceScreen}
                            options={{
                                title: 'Aggiungi Manutenzione',
                                headerShown: true
                            }}
                        />
                        <Stack.Screen
                            name="MaintenanceList"
                            component={MaintenanceListScreen}
                            options={{
                                title: 'Storico Manutenzioni',
                                headerShown: true
                            }}
                        />

                        {/* ========== SPESE ========== */}
                        <Stack.Screen
                            name="ExpenseTracker"
                            component={ExpenseTrackerScreen}
                            options={{
                                title: 'Tracker Spese',
                                headerShown: true
                            }}
                        />
                        <Stack.Screen
                            name="CarExpenses"
                            component={CarExpensesScreen}
                            options={{
                                title: 'Spese Veicolo',
                                headerShown: true
                            }}
                        />
                        {/* ✅ UNICA DEFINIZIONE DI AddExpense */}
                        <Stack.Screen
                            name="AddExpense"
                            component={AddExpenseScreen}
                            options={{
                                title: 'Aggiungi Spesa',
                                headerShown: true
                            }}
                        />

                        {/* ========== CARBURANTE ========== */}
                        <Stack.Screen
                            name="FuelTracking"
                            component={FuelTrackingScreen}
                            options={{
                                title: 'Tracking Carburante',
                                headerShown: true
                            }}
                        />
                        <Stack.Screen
                            name="AddFuel"
                            component={AddFuelScreen}
                            options={{
                                title: 'Aggiungi Rifornimento',
                                headerShown: true
                            }}
                        />

                        {/* ========== TRASFERIMENTI E NOTIFICHE ========== */}
                        <Stack.Screen
                            name="TransferCar"
                            component={TransferCarScreen}
                            options={{
                                title: 'Trasferisci Veicolo',
                                headerShown: true
                            }}
                        />
                        <Stack.Screen
                            name="TransferRequests"
                            component={TransferRequestsScreen}
                            options={{
                                title: 'Richieste Trasferimento',
                                headerShown: true
                            }}
                        />
                        <Stack.Screen
                            name="NotificationsScreen"
                            component={NotificationsScreen}
                            options={{
                                title: 'Notifiche',
                                headerShown: true
                            }}
                        />
                    </Stack.Group>
                )
            ) : (
                // ========================================
                // STACK NAVIGATOR PER AUTENTICAZIONE
                // ========================================
                <Stack.Screen
                    name="Auth"
                    component={AuthNavigator}
                    options={{ headerShown: false }}
                />
            )}

            {/* ========== SCHERMATE COMUNI ========== */}
            <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    title: 'Profilo',
                    headerShown: true,
                    headerBackTitle: 'Indietro'
                }}
            />
        </Stack.Navigator>
    );
}
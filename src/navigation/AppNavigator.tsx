// src/navigation/AppNavigator.tsx - SENZA TAB NAVIGATOR
import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ============================================================
// AUTH SCREENS
// ============================================================
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

// ============================================================
// MECHANIC SCREENS
// ============================================================
import MechanicDashboard from '../screens/mechanic/MechanicDashboard';
import AllCarsInWorkshopScreen from '../screens/mechanic/AllCarsInWorkshopScreen';
import RepairPartsManagementScreen from '../screens/mechanic/RepairPartsManagementScreen';
import NewAppointmentScreen from '../screens/mechanic/NewAppointmentScreen';
import MechanicCalendarScreen from '../screens/mechanic/MechanicCalendarScreen';
import InvoicingDashboardScreen from '../screens/mechanic/InvoicingDashboardScreen';
import CreateInvoiceScreen from '../screens/mechanic/CreateInvoiceScreen';
import CustomersListScreen from '../screens/mechanic/CustomersListScreen';
import AddCustomerScreen from '../screens/mechanic/AddCustomerScreen';

// ============================================================
// USER (PROPRIETARIO) SCREENS
// ============================================================
// Schermate User
import HomeScreen from '../screens/user/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CarDetailScreen from '../screens/user/CarDetailScreen';
import AddCarScreen from '../screens/user/AddCarScreen';
import VehicleListScreen from '../screens/user/VehicleListScreen';


// ============================================================
// SHARED SCREENS
// ============================================================
import ProfileScreen from '../screens/ProfileScreen';

// Store
import { useStore } from '../store';

// ============================================================
// TYPES
// ============================================================
export type RootStackParamList = {
    // Auth
    Auth: undefined;

    // Mechanic Home
    HomeMechanic: undefined;

    // User Home (SENZA TABS)
    Home: undefined;
    Settings: undefined;
    AddCar: undefined;

    // Mechanic Screens
    CarDetail: { carId: string };
    AllCarsInWorkshop: undefined;
    RepairPartsManagement: { carId: string; repairId: string };
    NewAppointment: undefined;
    MechanicCalendar: undefined;
    InvoicingDashboard: undefined;
    CreateInvoice: {
        vehicleId?: string;
        repairId?: string;
        customerId?: string;
        type?: 'customer' | 'supplier' | 'expense' | 'other'
    };
    CustomersList: undefined;
    AddCustomer: undefined;
    EditCustomer: { customerId: string };
    CustomerDetail: { customerId: string };
    InvoiceDetail: { invoiceId: string };
    InvoicesList: undefined;
    InvoiceTemplates: undefined;
    InvoiceReports: undefined;

    // User Screens (Proprietario)
    AddMaintenance: { carId?: string };
    AddFuel: { carId?: string };
    AddExpense: { carId?: string };
    AddDocument: { carId?: string };
    Reminders: undefined;

    // Shared
    Profile: { userId?: string };
};

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

// ============================================================
// AUTH NAVIGATOR
// ============================================================
function AuthNavigator() {
    return (
        <AuthStack.Navigator
            screenOptions={{
                headerShown: false,
                headerShadowVisible: false,
            }}
        >
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
            <AuthStack.Screen
                name="ForgotPassword"
                component={ForgotPasswordScreen}
                options={{
                    title: 'Password Dimenticata',
                    headerBackTitle: 'Indietro',
                    animation: 'slide_from_right',
                }}
            />
        </AuthStack.Navigator>
    );
}

// ============================================================
// APP NAVIGATOR PRINCIPALE
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

    console.log('📱 AppNavigator State:', {
        isAuthenticated,
        isMechanic,
        userType: user?.userType,
        role: user?.role,
    });

    return (
        <Stack.Navigator screenOptions={{ headerShown: true }}>
            {isAuthenticated ? (
                isMechanic ? (
                    // ========================================
                    // STACK PER MECCANICI
                    // ========================================
                    <Stack.Group>
                        {/* Home Meccanico */}
                        <Stack.Screen
                            name="HomeMechanic"
                            component={MechanicDashboard}
                            options={{
                                headerShown: false,
                            }}
                        />

                        {/* Schermate Auto */}
                        <Stack.Screen
                            name="CarDetail"
                            component={CarDetailScreen}
                            options={{
                                title: 'Dettaglio Auto',
                                headerShown: true,
                                headerBackTitle: 'Indietro',
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

                        {/* Gestione Riparazioni */}
                        <Stack.Screen
                            name="RepairPartsManagement"
                            component={RepairPartsManagementScreen}
                            options={{
                                headerShown: false,
                            }}
                        />

                        {/* Appuntamenti */}
                        <Stack.Screen
                            name="NewAppointment"
                            component={NewAppointmentScreen}
                            options={{
                                title: 'Nuovo Appuntamento',
                                headerShown: false,
                            }}
                        />
                        <Stack.Screen
                            name="MechanicCalendar"
                            component={MechanicCalendarScreen}
                            options={{
                                headerShown: false,
                            }}
                        />

                        {/* Fatturazione */}
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

                        {/* Clienti */}
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

                        {/* Schermate placeholder future */}
                        <Stack.Screen
                            name="CustomerDetail"
                            component={CustomersListScreen}
                            options={{
                                title: 'Dettaglio Cliente',
                                headerShown: true,
                            }}
                        />
                        <Stack.Screen
                            name="InvoiceDetail"
                            component={InvoicingDashboardScreen}
                            options={{
                                title: 'Dettaglio Fattura',
                                headerShown: true,
                            }}
                        />
                        <Stack.Screen
                            name="InvoicesList"
                            component={InvoicingDashboardScreen}
                            options={{
                                title: 'Elenco Fatture',
                                headerShown: true,
                            }}
                        />
                        <Stack.Screen
                            name="InvoiceTemplates"
                            component={InvoicingDashboardScreen}
                            options={{
                                title: 'Modelli Fattura',
                                headerShown: true,
                            }}
                        />
                        <Stack.Screen
                            name="InvoiceReports"
                            component={InvoicingDashboardScreen}
                            options={{
                                title: 'Report Fatturazione',
                                headerShown: true,
                            }}
                        />
                    </Stack.Group>
                ) : (
                    // ========================================
                    // STACK PER PROPRIETARI AUTO (SENZA TABS)
                    // ========================================
                    <Stack.Group>
                        {/* Home Proprietario (SENZA TABS) */}
                        <Stack.Screen
                            name="Home"
                            component={HomeScreen}
                            options={{
                                headerShown: false,
                            }}
                        />

                        {/* Settings */}
                        <Stack.Screen
                            name="Settings"
                            component={SettingsScreen}
                            options={{
                                title: 'Impostazioni',
                                headerShown: true,
                                headerBackTitle: 'Indietro',
                            }}
                        />

                        {/* Add Car */}
                        <Stack.Screen
                            name="AddCar"
                            component={HomeScreen}
                            options={{
                                title: 'Aggiungi Auto',
                                headerShown: true,
                                headerBackTitle: 'Indietro',
                                presentation: 'modal',
                            }}
                        />

                        {/* Schermate Auto */}
                        <Stack.Screen
                            name="CarDetail"
                            component={CarDetailScreen}
                            options={{
                                title: 'Dettaglio Auto',
                                headerShown: true,
                                headerBackTitle: 'Indietro',
                            }}
                        />

                        {/* Gestione Manutenzioni/Spese */}
                        <Stack.Screen
                            name="AddMaintenance"
                            component={HomeScreen}
                            options={{
                                title: 'Aggiungi Manutenzione',
                                headerShown: true,
                                presentation: 'modal',
                            }}
                        />
                        <Stack.Screen
                            name="AddFuel"
                            component={HomeScreen}
                            options={{
                                title: 'Aggiungi Rifornimento',
                                headerShown: true,
                                presentation: 'modal',
                            }}
                        />
                        <Stack.Screen
                            name="AddExpense"
                            component={HomeScreen}
                            options={{
                                title: 'Aggiungi Spesa',
                                headerShown: true,
                                presentation: 'modal',
                            }}
                        />
                        <Stack.Screen
                            name="AddDocument"
                            component={HomeScreen}
                            options={{
                                title: 'Aggiungi Documento',
                                headerShown: true,
                                presentation: 'modal',
                            }}
                        />
                        <Stack.Screen
                            name="Reminders"
                            component={HomeScreen}
                            options={{
                                title: 'Promemoria',
                                headerShown: true,
                            }}
                        />
                    </Stack.Group>
                )
            ) : (
                // ========================================
                // STACK PER NON AUTENTICATI
                // ========================================
                <Stack.Screen
                    name="Auth"
                    component={AuthNavigator}
                    options={{ headerShown: false }}
                />
            )}

            {/* ========================================
                SCHERMATE COMUNI A TUTTI
                ======================================== */}
            <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    title: 'Profilo',
                    headerShown: true,
                    headerBackTitle: 'Indietro',
                }}
            />
        </Stack.Navigator>
    );
}
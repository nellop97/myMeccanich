// src/navigation/AppNavigator.tsx - VERSIONE REDESIGN COMPLETO
import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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

// Schermate comuni
import ProfileScreen from '../screens/ProfileScreen';

import { useStore } from '../store';

// ============================================================
// DEFINIZIONE TIPI NAVIGAZIONE
// ============================================================
export type RootStackParamList = {
    // Auth
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
    CreateInvoice: { carId?: string; repairId?: string; customerId?: string; type?: 'customer' | 'supplier' | 'expense' | 'other' };
    CustomersList: undefined;
    AddCustomer: undefined;
    EditCustomer: { customerId: string };
    CustomerDetail: { customerId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ============================================================
// NAVIGATOR PRINCIPALE DELL'APP - SOLO STACK NAVIGATION
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
        <Stack.Navigator 
            screenOptions={{ 
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            {!isAuthenticated ? (
                // ========================================
                // STACK AUTENTICAZIONE
                // ========================================
                <Stack.Group>
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen
                        name="Register"
                        component={RegisterScreen}
                        options={{
                            headerShown: false,
                        }}
                    />
                </Stack.Group>
            ) : isMechanic ? (
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
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen
                        name="AllCarsInWorkshop"
                        component={AllCarsInWorkshopScreen}
                        options={{
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
                    <Stack.Screen
                        name="Profile"
                        component={ProfileScreen}
                        options={{
                            headerShown: false,
                        }}
                    />
                </Stack.Group>
            ) : (
                // ========================================
                // STACK NAVIGATOR PER UTENTI/PROPRIETARI
                // Nessun Tab Bar - Solo Stack Navigation
                // ========================================
                <Stack.Group>
                    {/* Schermata principale: Lista Veicoli */}
                    <Stack.Screen
                        name="VehicleList"
                        component={VehicleListScreen}
                        options={{
                            headerShown: false,
                        }}
                    />
                    
                    {/* Aggiungi Veicolo */}
                    <Stack.Screen
                        name="AddVehicle"
                        component={AddCarScreen}
                        options={{
                            headerShown: false,
                        }}
                    />
                    
                    {/* Dettagli Veicolo */}
                    <Stack.Screen
                        name="CarDetail"
                        component={CarDetailScreen}
                        options={{
                            headerShown: false,
                        }}
                    />
                    
                    {/* Aggiungi Manutenzione */}
                    <Stack.Screen
                        name="AddMaintenance"
                        component={AddMaintenanceScreen}
                        options={{
                            headerShown: false,
                        }}
                    />
                    
                    {/* Aggiungi Spesa */}
                    <Stack.Screen
                        name="AddExpense"
                        component={AddExpenseScreen}
                        options={{
                            headerShown: false,
                        }}
                    />
                    
                    {/* Aggiungi Carburante */}
                    <Stack.Screen
                        name="AddFuel"
                        component={AddFuelScreen}
                        options={{
                            headerShown: false,
                        }}
                    />
                    
                    {/* Promemoria/Scadenze */}
                    <Stack.Screen
                        name="RemindersList"
                        component={RemindersListScreen}
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen
                        name="AddReminder"
                        component={AddReminderScreen}
                        options={{
                            headerShown: false,
                        }}
                    />
                    
                    {/* Documenti */}
                    <Stack.Screen
                        name="DocumentsList"
                        component={DocumentsListScreen}
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen
                        name="AddDocument"
                        component={AddDocumentScreen}
                        options={{
                            headerShown: false,
                        }}
                    />
                    
                    {/* Profilo */}
                    <Stack.Screen
                        name="Profile"
                        component={ProfileScreen}
                        options={{
                            headerShown: false,
                        }}
                    />
                </Stack.Group>
            )}
        </Stack.Navigator>
    );
}

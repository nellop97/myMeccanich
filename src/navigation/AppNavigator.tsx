// src/navigation/AppNavigator.tsx
/**
 * AppNavigator - Navigator principale dell'applicazione
 * Gestisce la navigazione per Owner, Mechanic e Auth
 * Include nuove schermate Profile, EditProfile e Privacy
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useStore } from '../store';
import { useAuthSync } from '../hooks/useAuthSync';

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

// ============================================
// MECHANIC SCREENS
// ============================================
import MechanicDashboard from '../screens/mechanic/MechanicDashboard';
import AllCarsInWorkshopScreen from '../screens/mechanic/AllCarsInWorkshopScreen';
import RepairPartsManagementScreen from '../screens/mechanic/RepairPartsManagementScreen';
import MechanicCalendarScreen from '../screens/mechanic/MechanicCalendarScreen';
import NewAppointmentScreen from '../screens/mechanic/NewAppointmentScreen';

// Fatturazione
import InvoicingDashboardScreen from '../screens/mechanic/InvoicingDashboardScreen';
import CreateInvoiceScreen from '../screens/mechanic/CreateInvoiceScreen';

// Clienti
import CustomersListScreen from '../screens/mechanic/CustomersListScreen';
import AddCustomerScreen from '../screens/mechanic/AddCustomerScreen';

// ============================================
// COMMON SCREENS (Profile & Privacy)
// ============================================
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import PrivacyScreen from '../screens/PrivacyScreen';

// ============================================
// TYPE DEFINITIONS
// ============================================
export type RootStackParamList = {
    // Auth
    Auth: undefined;
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;

    // Common
    Profile: undefined;
    EditProfile: undefined;
    Privacy: undefined;
    Settings: undefined;

    // Owner/User
    Home: undefined;
    Main: undefined;

    // Vehicle Management
    AddVehicle: undefined;
    CarDetail: { carId: string };
    VehicleList: undefined;
    CarsList: undefined;
    OwnershipTransfer: { carId: string };

    // Maintenance
    MaintenanceHistory: { carId: string };
    AddMaintenance: { carId: string };

    // Fuel & Expenses
    FuelTracking: { carId: string };
    ExpenseTracker: { carId: string };
    CarExpenses: { carId: string };
    AddFuel: { carId: string };
    AddExpense: { carId: string };

    // Documents
    AddDocument: { carId?: string };

    // Reminders
    Reminders: undefined;

    // Mechanic
    HomeMechanic: undefined;
    AllCarsInWorkshop: undefined;
    RepairPartsManagement: { carId: string; repairId: string };
    NewAppointment: undefined;
    MechanicCalendar: undefined;

    // Invoicing
    InvoicingDashboard: undefined;
    CreateInvoice: {
        carId?: string;
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
            <AuthStack.Screen
                name="Login"
                component={LoginScreen}
                options={{
                    title: 'Accedi',
                    animation: 'fade',
                }}
            />
            <AuthStack.Screen
                name="Register"
                component={RegisterScreen}
                options={{
                    title: 'Registrati',
                    animation: 'slide_from_right',
                }}
            />
            <AuthStack.Screen
                name="ForgotPassword"
                component={ForgotPasswordScreen}
                options={{
                    title: 'Recupera Password',
                    animation: 'slide_from_right',
                }}
            />
        </AuthStack.Navigator>
    );
}

// ============================================
// PLACEHOLDER COMPONENT
// ============================================
const PlaceholderScreen = ({ route }: any) => {
    return (
        <View style={styles.placeholder}>
            <Text style={styles.placeholderTitle}>🚧 In Sviluppo</Text>
            <Text style={styles.placeholderText}>
                Schermata: {route.name}
            </Text>
            {route.params && (
                <Text style={styles.placeholderParams}>
                    Parametri: {JSON.stringify(route.params, null, 2)}
                </Text>
            )}
        </View>
    );
};

// ============================================
// MAIN APP NAVIGATOR
// ============================================
export default function AppNavigator() {
    // Usa useAuthSync per sincronizzare Firebase con lo store
    const { user, isAuthenticated, loading, isInitializing } = useAuthSync();

    const isMechanic = user?.isMechanic;

    console.log('📱 AppNavigator State:', {
        isAuthenticated,
        isInitializing,
        loading,
        isMechanic,
        userEmail: user?.email,
        userId: user?.id,
    });

    // Mostra loading durante l'inizializzazione
    if (isInitializing || loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Caricamento...</Text>
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
                // ============================================
                // AUTH FLOW (Non autenticato)
                // ============================================
                <Stack.Screen
                    name="Auth"
                    component={AuthNavigator}
                    options={{
                        headerShown: false,
                        animationTypeForReplace: 'pop',
                    }}
                />
            ) : isMechanic ? (
                // ============================================
                // MECHANIC FLOW (Meccanico)
                // ============================================
                <>
                    <Stack.Group>
                        {/* Dashboard Meccanico */}
                        <Stack.Screen
                            name="HomeMechanic"
                            component={MechanicDashboard}
                            options={{
                                title: 'Dashboard',
                                headerShown: false,
                            }}
                        />

                        {/* Workshop Management */}
                        <Stack.Screen
                            name="AllCarsInWorkshop"
                            component={AllCarsInWorkshopScreen}
                            options={{
                                title: 'Auto in Officina',
                                headerShown: false,
                                animation: 'slide_from_right',
                            }}
                        />

                        <Stack.Screen
                            name="RepairPartsManagement"
                            component={RepairPartsManagementScreen}
                            options={{
                                title: 'Gestione Ricambi',
                                headerShown: false,
                                animation: 'slide_from_right',
                            }}
                        />

                        <Stack.Screen
                            name="NewAppointment"
                            component={NewAppointmentScreen}
                            options={{
                                title: 'Nuovo Appuntamento',
                                headerShown: false,
                                presentation: 'modal',
                                animation: 'slide_from_bottom',
                            }}
                        />

                        <Stack.Screen
                            name="MechanicCalendar"
                            component={MechanicCalendarScreen}
                            options={{
                                title: 'Calendario',
                                headerShown: false,
                                animation: 'slide_from_right',
                            }}
                        />

                        {/* Car Detail (shared) */}
                        <Stack.Screen
                            name="CarDetail"
                            component={CarDetailScreen}
                            options={{
                                title: 'Dettaglio Veicolo',
                                headerShown: false,
                                animation: 'slide_from_right',
                            }}
                        />

                        {/* Settings */}
                        <Stack.Screen
                            name="Settings"
                            component={SettingsScreen}
                            options={{
                                title: 'Impostazioni',
                                headerShown: false,
                                animation: 'slide_from_right',
                            }}
                        />
                    </Stack.Group>

                    {/* Invoicing - Fatturazione */}
                    <Stack.Group screenOptions={{ presentation: 'card' }}>
                        <Stack.Screen
                            name="InvoicingDashboard"
                            component={InvoicingDashboardScreen}
                            options={{
                                title: 'Fatturazione',
                                headerShown: false,
                                animation: 'slide_from_right',
                            }}
                        />

                        <Stack.Screen
                            name="CreateInvoice"
                            component={CreateInvoiceScreen}
                            options={{
                                title: 'Crea Fattura',
                                headerShown: false,
                                presentation: 'modal',
                                animation: 'slide_from_bottom',
                            }}
                        />

                        <Stack.Screen
                            name="InvoiceDetail"
                            component={PlaceholderScreen}
                            options={{
                                title: 'Dettaglio Fattura',
                                headerShown: false,
                                animation: 'slide_from_right',
                            }}
                        />

                        <Stack.Screen
                            name="InvoicesList"
                            component={PlaceholderScreen}
                            options={{
                                title: 'Tutte le Fatture',
                                headerShown: false,
                                animation: 'slide_from_right',
                            }}
                        />

                        <Stack.Screen
                            name="InvoiceTemplates"
                            component={PlaceholderScreen}
                            options={{
                                title: 'Template Fatture',
                                headerShown: false,
                                animation: 'slide_from_right',
                            }}
                        />

                        <Stack.Screen
                            name="InvoiceReports"
                            component={PlaceholderScreen}
                            options={{
                                title: 'Report Fatturazione',
                                headerShown: false,
                                animation: 'slide_from_right',
                            }}
                        />
                    </Stack.Group>

                    {/* Customers - Clienti */}
                    <Stack.Group>
                        <Stack.Screen
                            name="CustomersList"
                            component={CustomersListScreen}
                            options={{
                                title: 'Clienti',
                                headerShown: false,
                                animation: 'slide_from_right',
                            }}
                        />

                        <Stack.Screen
                            name="AddCustomer"
                            component={AddCustomerScreen}
                            options={{
                                title: 'Nuovo Cliente',
                                headerShown: false,
                                presentation: 'modal',
                                animation: 'slide_from_bottom',
                            }}
                        />

                        <Stack.Screen
                            name="EditCustomer"
                            component={AddCustomerScreen}
                            options={{
                                title: 'Modifica Cliente',
                                headerShown: false,
                                animation: 'slide_from_right',
                            }}
                        />

                        <Stack.Screen
                            name="CustomerDetail"
                            component={PlaceholderScreen}
                            options={{
                                title: 'Dettaglio Cliente',
                                headerShown: false,
                                animation: 'slide_from_right',
                            }}
                        />
                    </Stack.Group>
                </>
            ) : (
                // ============================================
                // OWNER FLOW (Proprietario Auto)
                // ============================================
                <Stack.Group>
                    {/* Home */}
                    <Stack.Screen
                        name="Home"
                        component={HomeScreen}
                        options={{
                            title: 'Home',
                            headerShown: false,
                        }}
                    />

                    {/* Vehicle Management */}
                    <Stack.Screen
                        name="AddVehicle"
                        component={AddVehicleScreen}
                        options={{
                            title: 'Aggiungi Veicolo',
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
                            animation: 'slide_from_right',
                        }}
                    />

                    <Stack.Screen
                        name="VehicleList"
                        component={VehicleListScreen}
                        options={{
                            title: 'I Miei Veicoli',
                            headerShown: false,
                            animation: 'slide_from_right',
                        }}
                    />

                    <Stack.Screen
                        name="CarsList"
                        component={CarsListScreen}
                        options={{
                            title: 'Lista Veicoli',
                            headerShown: false,
                            animation: 'slide_from_right',
                        }}
                    />

                    <Stack.Screen
                        name="OwnershipTransfer"
                        component={OwnershipTransferScreen}
                        options={{
                            title: 'Trasferimento Proprietà',
                            headerShown: false,
                            animation: 'slide_from_right',
                        }}
                    />

                    {/* Maintenance */}
                    <Stack.Screen
                        name="MaintenanceHistory"
                        component={MaintenanceHistoryScreen}
                        options={{
                            title: 'Cronologia Manutenzioni',
                            headerShown: false,
                            animation: 'slide_from_right',
                        }}
                    />

                    <Stack.Screen
                        name="AddMaintenance"
                        component={AddMaintenanceScreen}
                        options={{
                            title: 'Nuova Manutenzione',
                            headerShown: false,
                            presentation: 'modal',
                            animation: 'slide_from_bottom',
                        }}
                    />

                    {/* Fuel & Expenses */}
                    <Stack.Screen
                        name="FuelTracking"
                        component={FuelTrackingScreen}
                        options={{
                            title: 'Tracciamento Carburante',
                            headerShown: false,
                            animation: 'slide_from_right',
                        }}
                    />

                    <Stack.Screen
                        name="ExpenseTracker"
                        component={ExpenseTrackerScreen}
                        options={{
                            title: 'Gestione Spese',
                            headerShown: false,
                            animation: 'slide_from_right',
                        }}
                    />

                    <Stack.Screen
                        name="CarExpenses"
                        component={CarExpensesScreen}
                        options={{
                            title: 'Spese Veicolo',
                            headerShown: false,
                            animation: 'slide_from_right',
                        }}
                    />

                    {/* Placeholder Screens - Future Features */}
                    <Stack.Screen
                        name="AddFuel"
                        component={PlaceholderScreen}
                        options={{
                            title: 'Aggiungi Rifornimento',
                            headerShown: false,
                            presentation: 'modal',
                            animation: 'slide_from_bottom',
                        }}
                    />

                    <Stack.Screen
                        name="AddExpense"
                        component={PlaceholderScreen}
                        options={{
                            title: 'Nuova Spesa',
                            headerShown: false,
                            presentation: 'modal',
                            animation: 'slide_from_bottom',
                        }}
                    />

                    <Stack.Screen
                        name="AddDocument"
                        component={PlaceholderScreen}
                        options={{
                            title: 'Aggiungi Documento',
                            headerShown: false,
                            presentation: 'modal',
                            animation: 'slide_from_bottom',
                        }}
                    />

                    <Stack.Screen
                        name="Reminders"
                        component={PlaceholderScreen}
                        options={{
                            title: 'Promemoria',
                            headerShown: false,
                            animation: 'slide_from_right',
                        }}
                    />

                    {/* Settings */}
                    <Stack.Screen
                        name="Settings"
                        component={SettingsScreen}
                        options={{
                            title: 'Impostazioni',
                            headerShown: false,
                            animation: 'slide_from_right',
                        }}
                    />
                </Stack.Group>
            )}

            {/* ============================================ */}
            {/* COMMON SCREENS (Profile & Privacy) */}
            {/* Disponibili per Owner e Mechanic */}
            {/* ============================================ */}
            {isAuthenticated && (
                <Stack.Group>
                    {/* Profile - Profilo Utente */}
                    <Stack.Screen
                        name="Profile"
                        component={ProfileScreen}
                        options={{
                            title: 'Profilo',
                            headerShown: false,
                            animation: 'slide_from_right',
                        }}
                    />

                    {/* EditProfile - Modifica Profilo */}
                    <Stack.Screen
                        name="EditProfile"
                        component={EditProfileScreen}
                        options={{
                            title: 'Modifica Profilo',
                            headerShown: false,
                            presentation: 'modal',
                            animation: 'slide_from_bottom',
                        }}
                    />

                    {/* Privacy - Privacy Policy */}
                    <Stack.Screen
                        name="Privacy"
                        component={PrivacyScreen}
                        options={{
                            title: 'Privacy Policy',
                            headerShown: false,
                            animation: 'slide_from_right',
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

export function navigate(name: keyof RootStackParamList, params?: any) {
    navigationRef.current?.navigate(name, params);
}

export function goBack() {
    navigationRef.current?.goBack();
}

export function reset(routeName: keyof RootStackParamList) {
    navigationRef.current?.reset({
        index: 0,
        routes: [{ name: routeName }],
    });
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F8FAFC',
    },
    placeholderTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 16,
    },
    placeholderText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
    },
    placeholderParams: {
        fontSize: 14,
        color: '#94A3B8',
        fontFamily: 'monospace',
        marginTop: 16,
        padding: 12,
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        maxWidth: '90%',
    },
});
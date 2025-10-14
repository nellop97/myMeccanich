// src/navigation/AppNavigator.tsx
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';

// Schermate Auth
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Schermate User
import HomeScreen from '../screens/user/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CarDetailScreen from '../screens/user/CarDetailScreen';
import AddCarScreen from '../screens/user/AddCarScreen';
import VehicleListScreen from '../screens/user/VehicleListScreen';

// Schermate Mechanic
import MechanicDashboard from '../screens/mechanic/MechanicDashboard';
import NewAppointmentScreen from '../screens/mechanic/NewAppointmentScreen';
import AllCarsInWorkshopScreen from '../screens/mechanic/AllCarsInWorkshopScreen';
import RepairPartsManagementScreen from '../screens/mechanic/RepairPartsManagementScreen';
import MechanicCalendarScreen from '../screens/mechanic/MechanicCalendarScreen';
import InvoicingDashboardScreen from '../screens/mechanic/InvoicingDashboardScreen';
import CreateInvoiceScreen from '../screens/mechanic/CreateInvoiceScreen';
import CustomersListScreen from '../screens/mechanic/CustomersListScreen';
import AddCustomerScreen from '../screens/mechanic/AddCustomerScreen';

import { useStore } from '../store';

// Definizione dei tipi per la navigazione
export type RootStackParamList = {
    Auth: undefined;
    Main: undefined;
    Profile: { userId: string };
    CarDetail: { carId: string };
    AddCar: undefined;
    VehicleList: undefined;
    Login: undefined;
    Register: undefined;
    RepairDetails: { carId: string; repairId: string };
    HomeMechanic: undefined;
    NewAppointment: undefined;
    AllCarsInWorkshop: undefined;
    RepairPartsManagement: { carId: string; repairId: string };
    MechanicCalendar: undefined;

    // Schermate di fatturazione
    InvoicingDashboard: undefined;
    CreateInvoice: {
        carId?: string;
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

    // Schermate aggiuntive user
    AddMaintenance: { carId?: string };
    AddFuel: { carId?: string };
    AddExpense: { carId?: string };
    AddDocument: { carId?: string };
    Reminders: undefined;
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

// Navigator per l'autenticazione
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

// Navigator per i tab principali (User)
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
                tabBarActiveTintColor: '#3b82f6',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: '#e2e8f0',
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: 60,
                },
            })}>
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    title: 'Home',
                    headerShown: false,
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    title: 'Impostazioni',
                    headerShown: true,
                }}
            />
        </Tab.Navigator>
    );
}

// Navigator principale dell'app
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
                    // Navigator per meccanici
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

                        {/* Schermate fatturazione */}
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

                        {/* Schermate future - placeholder */}
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
                                title: 'Tutte le Fatture',
                                headerShown: true,
                            }}
                        />
                        <Stack.Screen
                            name="InvoiceTemplates"
                            component={InvoicingDashboardScreen}
                            options={{
                                title: 'Template Fatture',
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
                    // Navigator per utenti normali
                    <Stack.Group>
                        <Stack.Screen
                            name="Main"
                            component={MainTabNavigator}
                            options={{ headerShown: false }}
                        />

                        {/* Schermate veicoli */}
                        <Stack.Screen
                            name="AddCar"
                            component={AddCarScreen}
                            options={{
                                headerShown: false,
                                presentation: 'modal',
                            }}
                        />
                        <Stack.Screen
                            name="VehicleList"
                            component={VehicleListScreen}
                            options={{
                                title: 'I Miei Veicoli',
                                headerShown: true,
                            }}
                        />
                        <Stack.Screen
                            name="CarDetail"
                            component={CarDetailScreen}
                            options={{
                                title: 'Dettaglio Auto',
                                headerShown: true,
                            }}
                        />

                        {/* Schermate azioni rapide - TODO: creare i componenti */}
                        <Stack.Screen
                            name="AddMaintenance"
                            component={HomeScreen} // Temporaneo
                            options={{
                                title: 'Aggiungi Manutenzione',
                                headerShown: true,
                                presentation: 'modal',
                            }}
                        />
                        <Stack.Screen
                            name="AddFuel"
                            component={HomeScreen} // Temporaneo
                            options={{
                                title: 'Aggiungi Rifornimento',
                                headerShown: true,
                                presentation: 'modal',
                            }}
                        />
                        <Stack.Screen
                            name="AddExpense"
                            component={HomeScreen} // Temporaneo
                            options={{
                                title: 'Aggiungi Spesa',
                                headerShown: true,
                                presentation: 'modal',
                            }}
                        />
                        <Stack.Screen
                            name="AddDocument"
                            component={HomeScreen} // Temporaneo
                            options={{
                                title: 'Aggiungi Documento',
                                headerShown: true,
                                presentation: 'modal',
                            }}
                        />
                        <Stack.Screen
                            name="Reminders"
                            component={HomeScreen} // Temporaneo
                            options={{
                                title: 'Promemoria',
                                headerShown: true,
                            }}
                        />
                    </Stack.Group>
                )
            ) : (
                // Navigator per autenticazione
                <Stack.Screen
                    name="Auth"
                    component={AuthNavigator}
                    options={{ headerShown: false }}
                />
            )}

            {/* Schermate comuni a entrambi i ruoli */}
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
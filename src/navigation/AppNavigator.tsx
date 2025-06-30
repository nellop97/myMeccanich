// src/navigation/AppNavigator.tsx - VERSIONE SICURA
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

// Importa le schermate esistenti
import LoginScreen from '../screens/LoginScreen';
import MechanicDashboard from '../screens/mechanic/MechanicDashboard';
import NewAppointmentScreen from '../screens/mechanic/NewAppointmentScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RegisterScreen from '../screens/RegisterScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CarDetailScreen from '../screens/user/CarDetailScreen';
import AllCarsInWorkshopScreen from '../screens/mechanic/AllCarsInWorkshopScreen';
import RepairPartsManagementScreen from '../screens/mechanic/RepairPartsManagementScreen';
import MechanicCalendarScreen from '../screens/mechanic/MechanicCalendarScreen';

// Importa le schermate di fatturazione
import InvoicingDashboardScreen from '../screens/mechanic/InvoicingDashboardScreen';
import CreateInvoiceScreen from '../screens/mechanic/CreateInvoiceScreen';
import CustomersListScreen from '../screens/mechanic/CustomersListScreen';
import AddCustomerScreen from '../screens/mechanic/AddCustomerScreen';
import CustomerDetailScreen from '../screens/mechanic/CustomerDetailScreen';

// Importa le schermate utente
import HomeScreen from '../screens/user/HomeScreen';
import AddCarScreen from '../screens/user/AddCarScreen';
import CarOverviewScreen from '../screens/user/CarOverviewScreen';
import CarMaintenanceAllScreen from '../screens/user/CarMaintenanceAllScreen';
import CarExpensesScreen from '../screens/user/CarExpensesScreen';
import CarDocumentsScreen from '../screens/user/CarDocumentsScreen';
import AddMaintenanceScreen from '../screens/user/AddMaintenanceScreen';
import AddExpenseScreen from '../screens/user/AddExpenseScreen';
import AddDocumentScreen from '../screens/user/AddDocumentScreen';
import MaintenanceListScreen from '../screens/user/MaintenanceListScreen';
import AddFuelScreen from '../screens/user/AddFuelScreen';
import MaintenanceHistoryScreen from '../screens/user/MaintenanceHistoryScreen';
import ExpenseTrackerScreen from '../screens/user/ExpenseTrackerScreen';

// 🔒 USA SOLO USEAUTH - FONTE SICURA DI AUTENTICAZIONE
import { useAuth } from '../hooks/useAuth';

// Definizione dei tipi per la navigazione - COMPLETA
export type RootStackParamList = {
    // Auth
    Auth: undefined;
    Login: undefined;
    Register: undefined;

    // Main navigation
    Main: undefined;
    Profile: { userId: string };

    // Schermate Utente
    Home: undefined;
    Settings: undefined;
    MyCars: undefined;
    CarDetail: { carId: string };
    CarOverview: { carId: string };
    CarMaintenance: { carId: string };
    CarExpenses: { carId: string };
    CarDocuments: { carId: string };
    AddCar: { carId?: string; mode?: 'create' | 'edit' };
    AddMaintenance: { carId: string };
    AddExpense: { carId: string };
    AddDocument: { carId: string };
    AddFuel: { carId: string };
    MaintenanceList: { carId: string };
    MaintenanceHistory: { carId: string };
    ExpenseTracker: { carId: string };

    // Schermate Meccanico
    HomeMechanic: undefined;
    NewAppointment: undefined;
    AllCarsInWorkshop: undefined;
    RepairPartsManagement: { carId: string; repairId: string };
    MechanicCalendar: undefined;

    // Schermate di fatturazione
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

export type MechanicTabParamList = {
    Dashboard: undefined;
    Calendar: undefined;
    Invoicing: undefined;
    Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const MechanicTab = createBottomTabNavigator<MechanicTabParamList>();

// 🚀 Loading Screen per l'inizializzazione
function LoadingScreen() {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
    );
}

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

// Navigator per i tab principali (utenti normali)
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
                options={{ title: 'Le Mie Auto' }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ title: 'Impostazioni' }}
            />
        </Tab.Navigator>
    );
}

// Navigator per i tab dei meccanici
function MechanicTabNavigator() {
    return (
        <MechanicTab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    let iconName;

                    switch (route.name) {
                        case 'Dashboard':
                            iconName = 'speedometer';
                            break;
                        case 'Calendar':
                            iconName = 'calendar';
                            break;
                        case 'Invoicing':
                            iconName = 'receipt';
                            break;
                        case 'Settings':
                            iconName = 'settings';
                            break;
                        default:
                            iconName = 'home';
                    }

                    return <Ionicons name={iconName as any} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: 'gray',
            })}>
            <MechanicTab.Screen
                name="Dashboard"
                component={MechanicDashboard}
                options={{ title: 'Dashboard' }}
            />
            <MechanicTab.Screen
                name="Calendar"
                component={MechanicCalendarScreen}
                options={{ title: 'Calendario' }}
            />
            <MechanicTab.Screen
                name="Invoicing"
                component={InvoicingDashboardScreen}
                options={{ title: 'Fatturazione' }}
            />
            <MechanicTab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ title: 'Impostazioni' }}
            />
        </MechanicTab.Navigator>
    );
}

// 🔒 NAVIGATOR PRINCIPALE - VERSIONE SICURA
export default function AppNavigator() {
    // 🛡️ USA SOLO FIREBASE COME FONTE DI AUTENTICAZIONE
    const { user, initializing } = useAuth();

    console.log('🧭 Navigator State:', {
        userExists: !!user,
        userType: user?.userType,
        initializing
    });

    // 🚀 Se sta ancora inizializzando, mostra loading
    if (initializing) {
        return <LoadingScreen />;
    }

    // 🔒 LOGICA AUTH SEMPLICE E SICURA
    const isAuthenticated = user !== null;
    const isMechanic = user?.userType === 'mechanic';

    return (
        <Stack.Navigator screenOptions={{ headerShown: true }}>
            {isAuthenticated ? (
                // ✅ UTENTE AUTENTICATO
                isMechanic ? (
                    // 🔧 NAVIGATOR MECCANICO
                    <>
                        <Stack.Screen
                            name="HomeMechanic"
                            component={MechanicTabNavigator}
                            options={{ headerShown: false }}
                        />

                        {/* Schermate Meccanico */}
                        <Stack.Screen
                            name="NewAppointment"
                            component={NewAppointmentScreen}
                            options={{ title: 'Nuovo Appuntamento' }}
                        />
                        <Stack.Screen
                            name="AllCarsInWorkshop"
                            component={AllCarsInWorkshopScreen}
                            options={{ title: 'Auto in Officina' }}
                        />
                        <Stack.Screen
                            name="RepairPartsManagement"
                            component={RepairPartsManagementScreen}
                            options={{ title: 'Gestione Ricambi' }}
                        />

                        {/* Schermate Fatturazione */}
                        <Stack.Screen
                            name="CreateInvoice"
                            component={CreateInvoiceScreen}
                            options={{ title: 'Crea Fattura' }}
                        />
                        <Stack.Screen
                            name="CustomersList"
                            component={CustomersListScreen}
                            options={{ title: 'Lista Clienti' }}
                        />
                        <Stack.Screen
                            name="AddCustomer"
                            component={AddCustomerScreen}
                            options={{ title: 'Aggiungi Cliente' }}
                        />
                        <Stack.Screen
                            name="CustomerDetail"
                            component={CustomerDetailScreen}
                            options={{ title: 'Dettagli Cliente' }}
                        />

                        {/* Schermata Profilo */}
                        <Stack.Screen
                            name="Profile"
                            component={ProfileScreen}
                            options={{ title: 'Profilo' }}
                        />
                    </>
                ) : (
                    // 👤 NAVIGATOR UTENTE NORMALE
                    <>
                        <Stack.Screen
                            name="Main"
                            component={MainTabNavigator}
                            options={{ headerShown: false }}
                        />

                        {/* Schermate Auto */}
                        <Stack.Screen
                            name="CarDetail"
                            component={CarDetailScreen}
                            options={{ title: 'Dettagli Auto' }}
                        />
                        <Stack.Screen
                            name="CarOverview"
                            component={CarOverviewScreen}
                            options={{ title: 'Panoramica Auto' }}
                        />
                        <Stack.Screen
                            name="CarMaintenance"
                            component={CarMaintenanceAllScreen}
                            options={{ title: 'Manutenzioni' }}
                        />
                        <Stack.Screen
                            name="CarExpenses"
                            component={CarExpensesScreen}
                            options={{ title: 'Spese' }}
                        />
                        <Stack.Screen
                            name="CarDocuments"
                            component={CarDocumentsScreen}
                            options={{ title: 'Documenti' }}
                        />

                        {/* Schermate Aggiungi */}
                        <Stack.Screen
                            name="AddCar"
                            component={AddCarScreen}
                            options={{ title: 'Aggiungi Auto' }}
                        />
                        <Stack.Screen
                            name="AddMaintenance"
                            component={AddMaintenanceScreen}
                            options={{ title: 'Aggiungi Manutenzione' }}
                        />
                        <Stack.Screen
                            name="AddExpense"
                            component={AddExpenseScreen}
                            options={{ title: 'Aggiungi Spesa' }}
                        />
                        <Stack.Screen
                            name="AddDocument"
                            component={AddDocumentScreen}
                            options={{ title: 'Aggiungi Documento' }}
                        />
                        <Stack.Screen
                            name="AddFuel"
                            component={AddFuelScreen}
                            options={{ title: 'Aggiungi Rifornimento' }}
                        />

                        {/* Schermate Lista */}
                        <Stack.Screen
                            name="MaintenanceList"
                            component={MaintenanceListScreen}
                            options={{ title: 'Lista Manutenzioni' }}
                        />
                        <Stack.Screen
                            name="MaintenanceHistory"
                            component={MaintenanceHistoryScreen}
                            options={{ title: 'Storico Manutenzioni' }}
                        />
                        <Stack.Screen
                            name="ExpenseTracker"
                            component={ExpenseTrackerScreen}
                            options={{ title: 'Tracciamento Spese' }}
                        />

                        {/* Schermata Profilo */}
                        <Stack.Screen
                            name="Profile"
                            component={ProfileScreen}
                            options={{ title: 'Profilo' }}
                        />
                    </>
                )
            ) : (
                // 🚫 UTENTE NON AUTENTICATO
                <Stack.Screen
                    name="Auth"
                    component={AuthNavigator}
                    options={{ headerShown: false }}
                />
            )}
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
});

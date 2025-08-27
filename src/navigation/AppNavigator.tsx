// src/navigation/AppNavigator.tsx - VERSIONE COMPLETA CON TUTTE LE SCHERMATE USER
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

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
import CarMaintenanceScreen from '../screens/user/CarMaintenanceScreen'
import AddMaintenanceScreen from '../screens/user/AddMaintenanceScreen';
import ExpenseTrackerScreen from '../screens/user/ExpenseTrackerScreen';
import AddExpenseScreen from '../screens/user/AddExpenseScreen';
import CarExpensesScreen from '../screens/user/CarExpensesScreen';
import MaintenanceListScreen from '../screens/user/MaintenanceListScreen';
import VehicleListScreen from '../screens/user/VehicleListScreen';
import FuelTrackingScreen from '../screens/user/FuelTrackingScreen';
//import AddFuelRecordScreen from '../screens/user/AddFuelRecordScreen';
import RemindersListScreen from '../screens/user/RemindersListScreen';
import AddReminderScreen from '../screens/user/AddReminderScreen';
import DocumentsListScreen from '../screens/user/DocumentsListScreen';
import CarOverviewScreen from '../screens/user/CarOverviewScreen';

// Schermate comuni
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Hooks e Store
import { useAuth } from '../hooks/useAuth';

// Definizione dei tipi per la navigazione
export type RootStackParamList = {
  // Auth
  Auth: undefined;
  Login: undefined;
  Register: undefined;

  // Tab Navigator
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
  AddMaintenance: { carId?: string; category?: string };
  MaintenanceList: undefined;
  ExpenseTracker: undefined;
  CarExpenses: { carId: string };
  AddExpense: { carId?: string; category?: string };
  FuelTracking: { carId?: string };
  AddFuelRecord: { carId?: string };
  RemindersList: undefined;
  AddReminder: { carId?: string };
  DocumentsList: { carId?: string };
  AddFuel: undefined; // Nuova schermata per aggiungere rifornimento
    TransferCar: undefined; // Nuova schermata per trasferire l'auto
    TransferRequests: undefined; // Nuova schermata per le richieste di trasferimento

    // Schermate Meccanico
  HomeMechanic: undefined;
  NewAppointment: undefined;
  AllCarsInWorkshop: undefined;
  RepairPartsManagement: { carId: string; repairId: string };
  MechanicCalendar: undefined;
  InvoicingDashboard: undefined;
  CreateInvoice: { carId?: string; repairId?: string; customerId?: string; type?: string };
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

// Loading Screen
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

// Navigator per utenti normali (CON bottom tabs)
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

// Navigator principale
export default function AppNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return <LoadingScreen />;
  }

  const isAuthenticated = user !== null;
  const isMechanic = user?.userType === 'mechanic';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        isMechanic ? (
          // Stack per meccanici
          <Stack.Group>
            <Stack.Screen name="HomeMechanic" component={MechanicDashboard} />
            <Stack.Screen 
              name="CarDetail" 
              component={CarDetailScreen}
              options={{
                title: 'Dettaglio Auto',
                headerShown: true,
                headerBackTitle: 'Indietro'
              }}
            />
            <Stack.Screen name="AllCarsInWorkshop" component={AllCarsInWorkshopScreen} />
            <Stack.Screen name="RepairPartsManagement" component={RepairPartsManagementScreen} />
            <Stack.Screen name="NewAppointment" component={NewAppointmentScreen} />
            <Stack.Screen name="MechanicCalendar" component={MechanicCalendarScreen} />
            <Stack.Screen name="InvoicingDashboard" component={InvoicingDashboardScreen} />
            <Stack.Screen name="CreateInvoice" component={CreateInvoiceScreen} />
            <Stack.Screen name="CustomersList" component={CustomersListScreen} />
            <Stack.Screen name="AddCustomer" component={AddCustomerScreen} />
            <Stack.Screen name="EditCustomer" component={AddCustomerScreen} />
          </Stack.Group>
        ) : (
          // Stack per proprietari auto
          <Stack.Group>
            {/* Main Tab Navigator */}
            <Stack.Screen
              name="Main"
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />

            {/* Gestione Veicoli */}
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

            {/* Manutenzioni */}
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

            {/* Spese */}
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
            <Stack.Screen
              name="AddExpense"
              component={AddExpenseScreen}
              options={{
                title: 'Aggiungi Spesa',
                headerShown: true
              }}
            />

            {/* Carburante */}
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
                  component={require('../screens/user/AddFuelScreen').default}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="AddExpense"
                  component={require('../screens/user/AddExpenseScreen').default}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="TransferCar"
                  component={require('../screens/user/TransferCarScreen').default}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="TransferRequests"
                  component={require('../screens/user/TransferRequestsScreen').default}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="CarsListScreen"
                  component={require('../screens/user/CarsListScreen').default}
                  options={{
                      title: 'I Miei Veicoli',
                      headerShown: true
                  }}
              />
              <Stack.Screen
                  name="NotificationsScreen"
                  component={require('../screens/user/NotificationsScreen').default}
                  options={{ headerShown: false }}
              />
              <Stack.Screen
                  name="ReportsScreen"
                  component={require('../screens/user/ReportsScreen').default}
                  options={{ headerShown: false }}
              />

              {/* Promemoria */}
              <Stack.Screen
                  name="RemindersList"
                  component={RemindersListScreen}
                  options={{
                      title: 'Promemoria',
                      headerShown: true
                  }}
              />
              <Stack.Screen
                  name="AddReminder"
                  component={AddReminderScreen}
                  options={{
                      title: 'Aggiungi Promemoria',
                      headerShown: true
                  }}
              />

              {/* Documenti */}
              <Stack.Screen
                  name="DocumentsList"
                  component={DocumentsListScreen}
                  options={{
                      title: 'Documenti',
                      headerShown: true
                  }}
              />

              {/* Profilo */}
              <Stack.Screen
                  name="Profile"
                  component={ProfileScreen}
                  options={{
                      title: 'Profilo',
                      headerShown: true,
                      headerBackTitle: 'Indietro'
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
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
});
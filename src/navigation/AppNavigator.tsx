// src/navigation/AppNavigator.tsx - VERSIONE SENZA BOTTOM TABS PER MECCANICI
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

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

import { useStore } from '../store';
import { useAuth } from '../hooks/useAuth';
import HomeScreen from '../screens/user/HomeScreen';

// Definizione dei tipi per la navigazione
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Profile: { userId: string };
  CarDetail: { carId: string };
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

// 🔒 NAVIGATOR PRINCIPALE - VERSIONE SENZA BOTTOM TABS PER MECCANICI
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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        // ✅ UTENTE AUTENTICATO
        isMechanic ? (
          // 🔧 NAVIGATOR PER MECCANICI - STACK SEMPLICE SENZA BOTTOM TABS
          <Stack.Group>
            <Stack.Screen
              name="HomeMechanic"
              component={MechanicDashboard}
              options={{ 
                headerShown: false // Completamente senza header
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
            
            {/* Schermate future - placeholder per ora */}
            <Stack.Screen
              name="CustomerDetail"
              component={CustomersListScreen} // Temporaneo
              options={{
                title: 'Dettaglio Cliente',
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="InvoiceDetail"
              component={InvoicingDashboardScreen} // Temporaneo
              options={{
                title: 'Dettaglio Fattura',
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="InvoicesList"
              component={InvoicingDashboardScreen} // Temporaneo
              options={{
                title: 'Tutte le Fatture',
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="InvoiceTemplates"
              component={InvoicingDashboardScreen} // Temporaneo
              options={{
                title: 'Template Fatture',
                headerShown: true,
              }}
            />
            <Stack.Screen
              name="InvoiceReports"
              component={InvoicingDashboardScreen} // Temporaneo
              options={{
                title: 'Report Fatturazione',
                headerShown: true,
              }}
            />
          </Stack.Group>
        ) : (
          // 👤 NAVIGATOR PER UTENTI NORMALI - CON BOTTOM TABS
          <Stack.Group>
            <Stack.Screen 
              name="Main" 
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CarDetail"
              component={CarDetailScreen}
              options={{ title: 'Dettaglio Auto'}}
            />
          </Stack.Group>
        )
      ) : (
        // 🚪 NAVIGATOR PER AUTENTICAZIONE
        <Stack.Screen 
          name="Auth" 
          component={AuthNavigator}
          options={{ headerShown: false }}
        />
      )}

      {/* 🌐 SCHERMATE COMUNI A ENTRAMBI I RUOLI */}
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
});
// src/navigation/AppNavigator.tsx
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';

// Importa le schermate
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import CarsByDateScreen from '../screens/mechanic/CarsByDateScreen';
import MechanicDashboard from '../screens/mechanic/MechanicDashboard';
import NewAppointmentScreen from '../screens/mechanic/NewAppointmentScreen';
import RepairDetailsScreen from '../screens/mechanic/RepairDetailsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RegisterScreen from '../screens/RegisterScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CarDetailScreen, { RouteParams } from '../screens/user/CarDetailScreen';
import { useStore } from '../store';

// Definizione dei tipi per la navigazione
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Profile: { userId: string };
  CarDetail: RouteParams;
  Login: undefined;
  Register: undefined;
  CarsByDateScreen: { date: string };
  RepairDetails: { carId: string; repairId: string };
  HomeMechanic: undefined;
  NewAppointment: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Settings: undefined;
  // Aggiungi altri tab se necessario
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

// Navigator per i tab principali
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

          // Puoi restituire qualsiasi componente qui
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

// Navigator principale dell'app
export default function AppNavigator() {
  const { user } = useStore();
  const [isInitialRender, setIsInitialRender] = useState(true);

  useEffect(() => {
    // Dopo il montaggio iniziale, disattiva lo stato iniziale
    if (isInitialRender) {
      setIsInitialRender(false);
    }
  }, []);

  // Se è il render iniziale o l'utente non è loggato, mostra l'autenticazione
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
                headerShown: false  // Nasconde l'header perché ora è gestito internamente
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
              name="CarsByDate" 
              component={CarsByDateScreen}
              options={{ title: 'Auto in officina' }}
            />
            <Stack.Screen 
              name="RepairDetails" 
              component={RepairDetailsScreen}
              options={{ title: 'Dettaglio riparazione' }}
            />
            <Stack.Screen
              name="NewAppointment"
              component={NewAppointmentScreen}
              options={{ title: 'Nuovo Appuntamento' }}
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
            <Stack.Screen
              name="CarDetail"
              component={CarDetailScreen}
              options={{ title: 'Dettaglio Auto'}}
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
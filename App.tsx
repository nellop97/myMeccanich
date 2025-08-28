// App.tsx - VERSIONE CORRETTA
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

// Store
import { useStore } from './src/store';

// Firebase - Import diretto dal servizio configurato
import { auth } from './src/services/firebase';

// Gestione fonti e splash screen
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { ThemeProvider } from './src/contexts/ThemeContext';

// Import condizionale per onAuthStateChanged
let onAuthStateChanged: any;

if (Platform.OS === 'web') {
  // Web: usa Firebase JS SDK
  const { onAuthStateChanged: webAuthStateChanged } = require('firebase/auth');
  onAuthStateChanged = webAuthStateChanged;
} else {
  // Mobile: usa React Native Firebase (già importato tramite il servizio)
  onAuthStateChanged = (callback: any) => auth.onAuthStateChanged(callback);
}

// Prevent the splash screen from auto-hiding (solo su mobile)
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

export default function App() {
  const [isLoadingComplete, setLoadingComplete] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Store actions
  const { preferences } = useStore();

  // Gestione stato di autenticazione
  useEffect(() => {
    if (!auth) {
      console.warn('Auth non disponibile');
      setInitializing(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user: any) => {
      console.log('Auth state changed:', user?.uid ? 'User logged in' : 'User logged out');
      setUser(user);
      if (initializing) setInitializing(false);
    });

    return unsubscribe; // Cleanup subscription
  }, [initializing]);

  // Load resources
  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        if (Platform.OS !== 'web') {
          // Load fonts only on mobile
          await Font.loadAsync({
            // Aggiungi qui eventuali fonti personalizzate
            // 'custom-font': require('./assets/fonts/custom-font.ttf'),
          });
        }
      } catch (e) {
        console.warn('Error loading resources:', e);
      } finally {
        setLoadingComplete(true);
        if (Platform.OS !== 'web') {
          SplashScreen.hideAsync();
        }
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  // Mostra loading screen durante l'inizializzazione
  if (initializing || !isLoadingComplete) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: preferences.theme === 'dark' ? '#121212' : '#ffffff'
      }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{
          marginTop: 20,
          color: preferences.theme === 'dark' ? '#ffffff' : '#000000'
        }}>
          Caricamento...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationContainer>
          <StatusBar 
            barStyle={preferences.theme === 'dark' ? 'light-content' : 'dark-content'}
            backgroundColor={preferences.theme === 'dark' ? '#121212' : '#ffffff'}
          />
          <AppNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
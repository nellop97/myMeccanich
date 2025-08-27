// ===========================================
// src/App.tsx - VERSIONE AGGIORNATA
// ===========================================
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

// Store
import { useStore } from './src/store';

// Gestione fonti
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { ThemeProvider } from './src/contexts/ThemeContext';

// Firebase - Import condizionale
let auth: any;
let onAuthStateChanged: any;

if (Platform.OS === 'web') {
  // Web: usa Firebase JS SDK
  import('firebase/app').then(firebase => {
    import('firebase/auth').then(authModule => {
      const firebaseConfig = {
        // INSERISCI QUI LE TUE CONFIG FIREBASE
        apiKey: "your-api-key",
        authDomain: "your-auth-domain",
        projectId: "your-project-id",
        storageBucket: "your-storage-bucket",
        messagingSenderId: "your-sender-id",
        appId: "your-app-id"
      };

      if (!firebase.getApps().length) {
        firebase.initializeApp(firebaseConfig);
      }

      auth = authModule.getAuth();
      onAuthStateChanged = authModule.onAuthStateChanged;
    });
  });
} else {
  // Mobile: usa React Native Firebase
  const firebaseAuth = require('@react-native-firebase/auth').default;
  auth = firebaseAuth();
  onAuthStateChanged = (callback: any) => auth.onAuthStateChanged(callback);
}

// Prevent the splash screen from auto-hiding
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

export default function App() {
  const [isLoadingComplete, setLoadingComplete] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // Store actions
  const { preferences } = useStore();

  // Load resources
  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        if (Platform.OS !== 'web') {
          // Load fonts only on mobile
          await Font.loadAsync({
            // Carica eventuali font personalizzati qui
          });

          // Artificial delay for splash screen
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setLoadingComplete(true);
        if (Platform.OS !== 'web') {
          await SplashScreen.hideAsync();
        }
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    if (!auth || !onAuthStateChanged) {
      // Firebase non ancora caricato
      setTimeout(() => {
        setInitializing(false);
      }, 1000);
      return;
    }

    const unsubscribe = onAuthStateChanged((user: any) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });

    return unsubscribe;
  }, [initializing, auth, onAuthStateChanged]);

  // Loading screen
  if (!isLoadingComplete || initializing) {
    return (
      <ThemeProvider>
        <SafeAreaProvider>
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: preferences.theme === 'dark' ? '#000000' : '#FAFAFA'
          }}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={{ 
              marginTop: 16, 
              color: preferences.theme === 'dark' ? '#FFFFFF' : '#000000',
              fontSize: 16,
              fontWeight: '500'
            }}>
              {Platform.OS === 'web' ? 'Caricamento Web App...' : 'Caricamento MyMeccanich...'}
            </Text>
          </View>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          {Platform.OS !== 'web' && (
            <StatusBar 
              barStyle={preferences.theme === 'dark' ? 'light-content' : 'dark-content'}
            />
          )}
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

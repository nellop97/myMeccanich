// App.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Firebase
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/services/firebase';

// Providers e Context

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

// Store
import { useStore } from './src/store';

// Gestione fonti
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { ThemeProvider } from './src/contexts/ThemeContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isLoadingComplete, setLoadingComplete] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // Store actions
  const { preferences } = useStore();

  // Load fonts and other assets
  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await Font.loadAsync({
          // Carica eventuali font personalizzati qui
          // 'custom-font': require('./assets/fonts/CustomFont.ttf'),
        });

        // Artificial delay to show splash screen
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (e) {
        // We might want to provide this error information to an error reporting service
        console.warn(e);
      } finally {
        setLoadingComplete(true);
        await SplashScreen.hideAsync();
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });

    return unsubscribe; // unsubscribe on unmount
  }, [initializing]);

  // Loading screen durante il caricamento delle risorse
  if (!isLoadingComplete) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#000000' // Dark background per lo splash
      }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ 
          marginTop: 16, 
          color: '#FFFFFF',
          fontSize: 16,
          fontWeight: '500'
        }}>
          Caricamento MyMeccanic...
        </Text>
      </View>
    );
  }

  // Loading screen durante l'inizializzazione di Firebase
  if (initializing) {
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
              Inizializzazione...
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
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
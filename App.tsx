import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

// Store
import { useStore } from './src/store';

// Firebase
import { auth } from './src/services/firebase';

// Theme
import { ThemeProvider } from './src/contexts/ThemeContext';

// Splash Screen
import * as SplashScreen from 'expo-splash-screen';

// Prevent auto-hide (solo mobile)
if (Platform.OS !== 'web') {
    SplashScreen.preventAutoHideAsync();
}

export default function App(): React.JSX.Element {
    const [initializing, setInitializing] = useState(true);
    const [user, setUser] = useState<any>(null);

    // Gestione stato di autenticazione
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            console.log('Auth state changed:', firebaseUser?.uid ? 'User logged in' : 'User logged out');
            setUser(firebaseUser);

            if (initializing) {
                setInitializing(false);

                // Nascondi splash screen su mobile
                if (Platform.OS !== 'web') {
                    SplashScreen.hideAsync();
                }
            }
        });

        return unsubscribe;
    }, [initializing]);

    // Loading screen
    if (initializing) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <NavigationContainer>
                    <AppNavigator />
                </NavigationContainer>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
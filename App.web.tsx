// App.web.tsx - Versione Web con polyfill per import.meta
// IMPORTANTE: Importa il polyfill PRIMA di qualsiasi altra cosa
import './src/utils/firebasePolyfill';

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

// Lazy load degli screen per evitare problemi di import
const LoginScreen = React.lazy(() => import('./src/screens/LoginScreen'));
const RegisterScreen = React.lazy(() => import('./src/screens/RegisterScreen'));
const DashboardScreen = React.lazy(() => import('./src/screens/DashboardScreen'));

// Configurazione tema
const theme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: '#2196F3',
        secondary: '#FF9800',
    },
};

const Stack = createNativeStackNavigator();

// Componente di loading per Suspense
function LoadingScreen() {
    return (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
    );
}

// Auth Stack con Suspense
function AuthStack() {
    return (
        <React.Suspense fallback={<LoadingScreen />}>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                }}
            >
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
            </Stack.Navigator>
        </React.Suspense>
    );
}

// Main Stack con Suspense
function MainStack() {
    return (
        <React.Suspense fallback={<LoadingScreen />}>
            <Stack.Navigator
                screenOptions={{
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: theme.colors.primary,
                    },
                    headerTintColor: '#fff',
                }}
            >
                <Stack.Screen
                    name="Dashboard"
                    component={DashboardScreen}
                    options={{ title: 'MyMechanic' }}
                />
            </Stack.Navigator>
        </React.Suspense>
    );
}

export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [firebaseReady, setFirebaseReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let unsubscribe: any = null;

        const initializeApp = async () => {
            try {
                // Usa require invece di import dinamico per evitare problemi
                const { initializeApp: initFB, getApps } = require('firebase/app');
                const { getAuth, onAuthStateChanged: onAuthChange, browserLocalPersistence, setPersistence } = require('firebase/auth');
                const { getFirestore } = require('firebase/firestore');

                const firebaseConfig = {
                    apiKey: "AIzaSyBH6F0JOVh8X-X41h2xN7cXxNEZnmY2nMk",
                    authDomain: "mymecanich.firebaseapp.com",
                    projectId: "mymecanich",
                    storageBucket: "mymecanich.firebasestorage.app",
                    messagingSenderId: "619020396283",
                    appId: "1:619020396283:web:2f97f5f3e5e5dc5105b25e",
                    measurementId: "G-7K1E9X8RLN"
                };

                // Inizializza Firebase
                const app = !getApps().length ? initFB(firebaseConfig) : getApps()[0];
                const auth = getAuth(app);
                const db = getFirestore(app);

                // Imposta persistenza
                try {
                    await setPersistence(auth, browserLocalPersistence);
                } catch (persistErr) {
                    console.warn('Persistenza non impostata:', persistErr);
                }

                // Salva globalmente per altri componenti
                if (typeof window !== 'undefined') {
                    (window as any).firebaseApp = app;
                    (window as any).firebaseAuth = auth;
                    (window as any).firebaseDb = db;
                }

                // Ascolta i cambiamenti di autenticazione
                unsubscribe = onAuthChange(auth, (user: any) => {
                    console.log('Auth state changed:', !!user);
                    setIsAuthenticated(!!user);
                    setFirebaseReady(true);
                    setIsLoading(false);
                });

                console.log('✅ Firebase inizializzato con successo');
            } catch (err: any) {
                console.error('❌ Errore inizializzazione:', err);
                setError(err.message || 'Errore sconosciuto');
                setIsLoading(false);
            }
        };

        // Piccolo delay per assicurarsi che il DOM sia pronto
        setTimeout(initializeApp, 100);

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    // Mostra errori
    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Errore di inizializzazione</Text>
                <Text style={styles.errorDetails}>{error}</Text>
                <Text style={styles.errorHint}>Prova a ricaricare la pagina</Text>
            </View>
        );
    }

    // Mostra loading
    if (isLoading || !firebaseReady) {
        return <LoadingScreen />;
    }

    return (
        <SafeAreaProvider>
            <PaperProvider theme={theme}>
                <StatusBar style="auto" />
                <NavigationContainer>
                    {isAuthenticated ? <MainStack /> : <AuthStack />}
                </NavigationContainer>
            </PaperProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#d32f2f',
        marginBottom: 10,
    },
    errorDetails: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 10,
    },
    errorHint: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
});
// App.web.tsx - Versione specifica per Web
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

// Firebase - usa import dinamico per evitare problemi con import.meta
let auth: any = null;
let db: any = null;
let onAuthStateChanged: any = null;

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

function AuthStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'fade',
            }}
        >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    );
}

function MainStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: true,
                headerStyle: {
                    backgroundColor: theme.colors.primary,
                },
                headerTintColor: '#fff',
            }}
        >
        </Stack.Navigator>
    );
}

export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [firebaseError, setFirebaseError] = useState<string | null>(null);

    useEffect(() => {
        // Inizializza Firebase in modo asincrono per evitare problemi con import.meta
        const initFirebase = async () => {
            try {
                // Import dinamici per evitare errori di bundling
                const firebaseApp = await import('firebase/app');
                const firebaseAuth = await import('firebase/auth');
                const firebaseFirestore = await import('firebase/firestore');

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
                const app = !firebaseApp.getApps().length
                    ? firebaseApp.initializeApp(firebaseConfig)
                    : firebaseApp.getApps()[0];

                auth = firebaseAuth.getAuth(app);
                db = firebaseFirestore.getFirestore(app);
                onAuthStateChanged = firebaseAuth.onAuthStateChanged;

                // Imposta persistenza per web
                await firebaseAuth.setPersistence(auth, firebaseAuth.browserLocalPersistence);

                console.log('✅ Firebase Web inizializzato con successo');

                // Setup auth listener
                const unsubscribe = onAuthStateChanged(auth, (user: any) => {
                    setIsAuthenticated(!!user);
                    setIsLoading(false);
                });

                return () => unsubscribe();
            } catch (error: any) {
                console.error('❌ Errore inizializzazione Firebase:', error);
                setFirebaseError(error.message);
                setIsLoading(false);
            }
        };

        initFirebase();
    }, []);

    // Rendi Firebase disponibile globalmente per gli altri componenti
    useEffect(() => {
        if (auth && db) {
            // @ts-ignore
            window.firebaseAuth = auth;
            // @ts-ignore
            window.firebaseDb = db;
        }
    }, [auth, db]);

    if (firebaseError) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Errore di inizializzazione</Text>
                <Text style={styles.errorDetails}>{firebaseError}</Text>
            </View>
        );
    }

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Caricamento...</Text>
            </View>
        );
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
        paddingHorizontal: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
});
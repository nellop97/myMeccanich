// App.web.tsx - Versione Web con polyfill inline
// POLYFILL INLINE - DEVE essere prima di QUALSIASI import
(function() {
    if (typeof globalThis !== 'undefined' && !globalThis.import) {
        globalThis.import = {
            meta: {
                url: 'https://localhost:8081',
                env: { MODE: 'development', DEV: true, PROD: false, SSR: false }
            }
        };
    }
    if (typeof window !== 'undefined' && !window.import) {
        window.import = {
            meta: {
                url: window.location ? window.location.href : 'https://localhost:8081',
                env: { MODE: 'development', DEV: true, PROD: false, SSR: false }
            }
        };
    }
})();

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

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

// Componente di loading
function LoadingScreen() {
    return (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
    );
}

// Componente wrapper per lazy loading degli screen
function LazyScreen({ screenName }: { screenName: string }) {
    const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Import dinamico degli screen
        const loadScreen = async () => {
            try {
                let module;
                switch (screenName) {
                    case 'Login':
                        module = await import('./src/screens/LoginScreen');
                        break;
                    case 'Register':
                        module = await import('./src/screens/RegisterScreen');
                        break;
                    default:
                        throw new Error(`Screen ${screenName} not found`);
                }
                setComponent(() => module.default);
            } catch (err: any) {
                console.error(`Error loading ${screenName}:`, err);
                setError(err.message);
            }
        };

        loadScreen();
    }, [screenName]);

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Errore caricamento</Text>
                <Text style={styles.errorDetails}>{error}</Text>
            </View>
        );
    }

    if (!Component) {
        return <LoadingScreen />;
    }

    return <Component />;
}

// Auth Stack
function AuthStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'fade',
            }}
        >
            <Stack.Screen name="Login">
                {() => <LazyScreen screenName="Login" />}
            </Stack.Screen>
            <Stack.Screen name="Register">
                {() => <LazyScreen screenName="Register" />}
            </Stack.Screen>
        </Stack.Navigator>
    );
}

// Main Stack
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
    const [firebaseReady, setFirebaseReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let unsubscribe: any = null;

        const initializeApp = async () => {
            try {
                // Delay per assicurarsi che il polyfill sia attivo
                await new Promise(resolve => setTimeout(resolve, 100));

                // Import Firebase dopo il delay
                const { auth, db, isFirebaseReady } = await import('./src/services/firebase');

                if (!isFirebaseReady()) {
                    throw new Error('Firebase non pronto');
                }

                // Import onAuthStateChanged
                const { onAuthStateChanged } = await import('firebase/auth');

                // Setup auth listener
                unsubscribe = onAuthStateChanged(auth, (user: any) => {
                    console.log('Auth state:', !!user);
                    setIsAuthenticated(!!user);
                    setFirebaseReady(true);
                    setIsLoading(false);
                });

                console.log('✅ App inizializzata');
            } catch (err: any) {
                console.error('❌ Errore inizializzazione:', err);
                setError(err.message || 'Errore sconosciuto');
                setIsLoading(false);
            }
        };

        initializeApp();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Errore di inizializzazione</Text>
                <Text style={styles.errorDetails}>{error}</Text>
                <Text style={styles.errorHint}>Prova a ricaricare la pagina (F5)</Text>
            </View>
        );
    }

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
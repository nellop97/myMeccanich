import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseReady } from './src/services/firebase.web';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

const theme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: '#2196F3',
        secondary: '#FF9800',
    },
};

const Stack = createNativeStackNavigator();

function LoadingScreen() {
    return (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
    );
}

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
        <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Dashboard - In sviluppo</Text>
        </View>
    );
}

export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let unsubscribe: any = null;

        const initializeApp = async () => {
            try {
                if (!isFirebaseReady()) {
                    throw new Error('Firebase non inizializzato correttamente');
                }

                unsubscribe = onAuthStateChanged(auth, (user: any) => {
                    console.log('Auth state:', !!user);
                    setIsAuthenticated(!!user);
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

    if (isLoading) {
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

// App.web.tsx - Entry Point Web

// NOTA: Il polyfill import.meta è già caricato in index.web.js

// ============================================
// IMPORT
// ============================================
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

// Import Firebase (DOPO il polyfill)
import { auth, isFirebaseReady } from './src/services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Import Navigation
import AppNavigator from './src/navigation/AppNavigator';


// Loading Screen Component
function LoadingScreen() {
    return (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Caricamento...</Text>
        </View>
    );
}

// Main App Component
export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        const initializeApp = async () => {
            try {
                console.log('🚀 Inizializzazione App Web...');

                // Verifica che Firebase sia pronto
                if (!isFirebaseReady()) {
                    throw new Error('Firebase non inizializzato correttamente');
                }

                console.log('✅ Firebase pronto');

                // Listener per lo stato di autenticazione
                unsubscribe = onAuthStateChanged(auth, (user) => {
                    console.log('👤 Auth state changed:', user ? user.uid : 'No user');
                    setIsAuthenticated(!!user);
                    setIsLoading(false);
                });

                console.log('✅ App Web inizializzata');
            } catch (err: any) {
                console.error('❌ Errore inizializzazione:', err);
                setError(err.message || 'Errore sconosciuto durante l\'inizializzazione');
                setIsLoading(false);
            }
        };

        initializeApp();

        // Cleanup
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    // Errore di inizializzazione
    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>⚠️ Errore di Inizializzazione</Text>
                <Text style={styles.errorDetails}>{error}</Text>
                <Text style={styles.errorHint}>
                    Prova a ricaricare la pagina (F5) o controlla la console per più dettagli
                </Text>
            </View>
        );
    }

    // Loading state
    if (isLoading) {
        return <LoadingScreen />;
    }

    // App principale
    return (
        <SafeAreaProvider>
            <PaperProvider>
                <StatusBar style="auto" />
                <NavigationContainer>
                    <AppNavigator />
                </NavigationContainer>
            </PaperProvider>
        </SafeAreaProvider>
    );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 20,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748b',
        fontWeight: '500',
    },
    errorText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ef4444',
        marginBottom: 12,
        textAlign: 'center',
    },
    errorDetails: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 12,
        paddingHorizontal: 20,
        lineHeight: 20,
    },
    errorHint: {
        fontSize: 12,
        color: '#94a3b8',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});
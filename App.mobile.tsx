// App.tsx (parte iniziale con inizializzazione Firebase)
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { initializeFirebase } from './src/services/firebaseInit';

export default function App() {
    const [isFirebaseReady, setIsFirebaseReady] = useState(false);
    const [firebaseError, setFirebaseError] = useState<string | null>(null);

    useEffect(() => {
        // Inizializza Firebase all'avvio
        initializeFirebase()
            .then((firebase) => {
                console.log('✅ Firebase inizializzato con successo');
                setIsFirebaseReady(true);

                // Salva le istanze globalmente se necessario
                global.firebaseApp = firebase.app;
                global.firebaseAuth = firebase.auth;
                global.firebaseDb = firebase.db;
            })
            .catch((error) => {
                console.error('❌ Errore inizializzazione Firebase:', error);
                setFirebaseError(error.message);
            });
    }, []);

    if (firebaseError) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Errore Firebase: {firebaseError}</Text>
            </View>
        );
    }

    if (!isFirebaseReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
                <Text>Inizializzazione Firebase...</Text>
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
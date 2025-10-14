// src/screens/LoadingSplashScreen.tsx - Splash screen con animazione
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Car } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface LoadingSplashScreenProps {
    message?: string;
}

const LoadingSplashScreen: React.FC<LoadingSplashScreenProps> = ({
                                                                     message = 'Caricamento...'
                                                                 }) => {
    // Animazioni
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const spinValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animazione fade in e scale
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();

        // Animazione rotazione continua per l'icona
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                {/* Logo/Icona con animazione */}
                <View style={styles.logoContainer}>
                    <Animated.View
                        style={[
                            styles.iconWrapper,
                            {
                                transform: [{ rotate: spin }],
                            },
                        ]}
                    >
                        <Car size={48} color="#3b82f6" strokeWidth={2} />
                    </Animated.View>

                    {/* Cerchio decorativo esterno */}
                    <View style={styles.decorativeCircle} />
                </View>

                {/* Testo e loader */}
                <View style={styles.textContainer}>
                    <Text style={styles.appName}>MyMeccanich</Text>
                    <Text style={styles.message}>{message}</Text>
                </View>

                {/* Activity Indicator */}
                <ActivityIndicator
                    size="large"
                    color="#3b82f6"
                    style={styles.loader}
                />
            </Animated.View>

            {/* Gradient background effect (opzionale) */}
            <View style={styles.gradientOverlay} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    logoContainer: {
        position: 'relative',
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    iconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        // Ombra soft
        shadowColor: '#3b82f6',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    decorativeCircle: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: '#dbeafe',
        zIndex: 1,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    message: {
        fontSize: 16,
        color: '#64748b',
        fontWeight: '500',
    },
    loader: {
        marginTop: 16,
    },
    gradientOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '30%',
        backgroundColor: 'transparent',
        // Sfumatura leggera dall'alto
        opacity: 0.3,
    },
});

export default LoadingSplashScreen;
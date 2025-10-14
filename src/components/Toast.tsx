// src/components/Toast.tsx - TOAST ANIMATO PER ERRORI/SUCCESSO
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
    Platform,
} from 'react-native';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_WIDTH = Math.min(SCREEN_WIDTH - 48, 400);

export type ToastType = 'error' | 'success' | 'info' | 'warning';

interface ToastProps {
    visible: boolean;
    message: string;
    type?: ToastType;
    duration?: number;
    onHide: () => void;
    position?: 'top' | 'bottom';
}

export const Toast: React.FC<ToastProps> = ({
                                                visible,
                                                message,
                                                type = 'error',
                                                duration = 4000,
                                                onHide,
                                                position = 'top',
                                            }) => {
    const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Animazione di entrata
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto-hide dopo duration
            const timer = setTimeout(() => {
                hideToast();
            }, duration);

            return () => clearTimeout(timer);
        } else {
            hideToast();
        }
    }, [visible]);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: position === 'top' ? -100 : 100,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onHide();
        });
    };

    if (!visible) return null;

    const getToastConfig = () => {
        switch (type) {
            case 'error':
                return {
                    backgroundColor: '#fee2e2',
                    borderColor: '#fecaca',
                    iconColor: '#dc2626',
                    textColor: '#991b1b',
                    Icon: AlertCircle,
                };
            case 'success':
                return {
                    backgroundColor: '#d1fae5',
                    borderColor: '#a7f3d0',
                    iconColor: '#059669',
                    textColor: '#065f46',
                    Icon: CheckCircle,
                };
            case 'warning':
                return {
                    backgroundColor: '#fed7aa',
                    borderColor: '#fde68a',
                    iconColor: '#d97706',
                    textColor: '#92400e',
                    Icon: AlertCircle,
                };
            case 'info':
                return {
                    backgroundColor: '#dbeafe',
                    borderColor: '#bfdbfe',
                    iconColor: '#2563eb',
                    textColor: '#1e40af',
                    Icon: Info,
                };
            default:
                return {
                    backgroundColor: '#fee2e2',
                    borderColor: '#fecaca',
                    iconColor: '#dc2626',
                    textColor: '#991b1b',
                    Icon: AlertCircle,
                };
        }
    };

    const config = getToastConfig();
    const { Icon } = config;

    return (
        <Animated.View
            style={[
                styles.container,
                position === 'top' ? styles.containerTop : styles.containerBottom,
                {
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
        >
            <View
                style={[
                    styles.toast,
                    {
                        backgroundColor: config.backgroundColor,
                        borderColor: config.borderColor,
                    },
                ]}
            >
                <View style={styles.iconContainer}>
                    <Icon size={22} color={config.iconColor} />
                </View>
                <Text
                    style={[
                        styles.message,
                        { color: config.textColor },
                    ]}
                    numberOfLines={3}
                >
                    {message}
                </Text>
                <TouchableOpacity
                    onPress={hideToast}
                    style={styles.closeButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <X size={18} color={config.textColor} />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
        paddingHorizontal: 24,
        ...Platform.select({
            web: {
                position: 'fixed' as any,
            },
        }),
    },
    containerTop: {
        top: Platform.OS === 'ios' ? 60 : 20,
    },
    containerBottom: {
        bottom: Platform.OS === 'ios' ? 40 : 20,
    },
    toast: {
        width: TOAST_WIDTH,
        maxWidth: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        ...Platform.select({
            web: {
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            } as any,
        }),
    },
    iconContainer: {
        marginRight: 12,
    },
    message: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
    },
    closeButton: {
        marginLeft: 8,
        padding: 4,
    },
});

export default Toast;
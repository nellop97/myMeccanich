// src/components/common/CommonComponents.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    TextInputProps,
    ViewStyle,
    TextStyle,
    Animated,
    Platform,
    Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, LucideIcon } from 'lucide-react-native';
import { useAppThemeManager } from '../hooks/useTheme';

// ============================================
// THEMED INPUT COMPONENT
// ============================================
interface ThemedInputProps extends TextInputProps {
    label?: string;
    error?: string;
    icon?: LucideIcon;
    rightIcon?: LucideIcon;
    onRightIconPress?: () => void;
    containerStyle?: ViewStyle;
}

export const ThemedInput: React.FC<ThemedInputProps> = ({
                                                            label,
                                                            error,
                                                            icon: Icon,
                                                            rightIcon: RightIcon,
                                                            onRightIconPress,
                                                            containerStyle,
                                                            secureTextEntry,
                                                            ...props
                                                        }) => {
    const { colors, isDark } = useAppThemeManager();
    const [isFocused, setIsFocused] = useState(false);
    const [isSecure, setIsSecure] = useState(secureTextEntry);

    const isPasswordInput = secureTextEntry !== undefined;
    const ShowIcon = isSecure ? Eye : EyeOff;

    return (
        <View style={[styles.inputContainer, containerStyle]}>
            {label && (
                <Text style={[styles.inputLabel, { color: colors.onSurface }]}>
                    {label}
                </Text>
            )}

            <View
                style={[
                    styles.inputWrapper,
                    {
                        backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.02)',
                        borderColor: error
                            ? colors.error
                            : isFocused
                                ? colors.primary
                                : colors.outline,
                        borderWidth: isFocused ? 2 : 1,
                    },
                ]}
            >
                {Icon && (
                    <Icon
                        size={20}
                        color={isFocused ? colors.primary : colors.onSurfaceVariant}
                        style={styles.inputIcon}
                    />
                )}

                <TextInput
                    style={[
                        styles.input,
                        {
                            color: colors.onSurface,
                            flex: 1,
                        },
                    ]}
                    placeholderTextColor={colors.onSurfaceVariant}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    secureTextEntry={isSecure}
                    {...props}
                />

                {isPasswordInput && (
                    <TouchableOpacity
                        onPress={() => setIsSecure(!isSecure)}
                        style={styles.eyeIcon}
                        activeOpacity={0.7}
                    >
                        <ShowIcon
                            size={20}
                            color={colors.onSurfaceVariant}
                        />
                    </TouchableOpacity>
                )}

                {RightIcon && !isPasswordInput && (
                    <TouchableOpacity
                        onPress={onRightIconPress}
                        style={styles.eyeIcon}
                        activeOpacity={0.7}
                    >
                        <RightIcon
                            size={20}
                            color={colors.onSurfaceVariant}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {error && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                    {error}
                </Text>
            )}
        </View>
    );
};

// ============================================
// GRADIENT BUTTON COMPONENT
// ============================================
interface GradientButtonProps {
    onPress: () => void;
    title: string;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'outlined' | 'text';
    icon?: LucideIcon;
    style?: ViewStyle;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
                                                                  onPress,
                                                                  title,
                                                                  loading = false,
                                                                  disabled = false,
                                                                  variant = 'primary',
                                                                  icon: Icon,
                                                                  style,
                                                              }) => {
    const { colors, isDark } = useAppThemeManager();
    const [pressed, setPressed] = useState(false);

    const getGradientColors = () => {
        if (disabled || loading) {
            return isDark
                ? ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.1)']
                : ['rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.05)'];
        }

        switch (variant) {
            case 'secondary':
                return isDark
                    ? ['#512DA8', '#5E5CE6']
                    : ['#5856D6', '#7B1FA2'];
            case 'primary':
            default:
                return isDark
                    ? ['#1565C0', '#0A84FF']
                    : ['#007AFF', '#1976D2'];
        }
    };

    if (variant === 'outlined') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled || loading}
                activeOpacity={0.8}
                style={[
                    styles.button,
                    styles.outlinedButton,
                    {
                        borderColor: colors.primary,
                        backgroundColor: 'transparent',
                    },
                    style,
                ]}
            >
                {Icon && (
                    <Icon
                        size={20}
                        color={colors.primary}
                        style={styles.buttonIcon}
                    />
                )}
                <Text style={[styles.buttonText, { color: colors.primary }]}>
                    {loading ? 'Caricamento...' : title}
                </Text>
            </TouchableOpacity>
        );
    }

    if (variant === 'text') {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled || loading}
                activeOpacity={0.7}
                style={[styles.textButton, style]}
            >
                {Icon && (
                    <Icon
                        size={18}
                        color={colors.primary}
                        style={styles.buttonIcon}
                    />
                )}
                <Text style={[styles.textButtonText, { color: colors.primary }]}>
                    {title}
                </Text>
            </TouchableOpacity>
        );
    }

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || loading}
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            style={[styles.button, style]}
        >
            <LinearGradient
                colors={getGradientColors()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.gradientButton,
                    pressed && styles.buttonPressed,
                ]}
            >
                {Icon && (
                    <Icon
                        size={20}
                        color="#FFFFFF"
                        style={styles.buttonIcon}
                    />
                )}
                <Text style={styles.gradientButtonText}>
                    {loading ? 'Caricamento...' : title}
                </Text>
            </LinearGradient>
        </Pressable>
    );
};

// ============================================
// GLASS CARD COMPONENT
// ============================================
interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style }) => {
    const { colors, isDark } = useAppThemeManager();

    return (
        <View
            style={[
                styles.glassCard,
                {
                    backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(255, 255, 255, 0.9)',
                    borderColor: isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.05)',
                },
                style,
            ]}
        >
            {children}
        </View>
    );
};

// ============================================
// DIVIDER WITH TEXT
// ============================================
interface DividerWithTextProps {
    text: string;
}

export const DividerWithText: React.FC<DividerWithTextProps> = ({ text }) => {
    const { colors } = useAppThemeManager();

    return (
        <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.outline }]} />
            <Text style={[styles.dividerText, { color: colors.onSurfaceVariant }]}>
                {text}
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.outline }]} />
        </View>
    );
};

// ============================================
// SOCIAL BUTTON
// ============================================
interface SocialButtonProps {
    onPress: () => void;
    icon: LucideIcon;
    provider: string;
    loading?: boolean;
}

export const SocialButton: React.FC<SocialButtonProps> = ({
                                                              onPress,
                                                              icon: Icon,
                                                              provider,
                                                              loading,
                                                          }) => {
    const { colors, isDark } = useAppThemeManager();

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={loading}
            style={[
                styles.socialButton,
                {
                    backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : '#FFFFFF',
                    borderColor: colors.outline,
                },
            ]}
            activeOpacity={0.8}
        >
            <Icon size={22} color={colors.onSurface} />
            <Text style={[styles.socialButtonText, { color: colors.onSurface }]}>
                {provider}
            </Text>
        </TouchableOpacity>
    );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
    // Input Styles
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        letterSpacing: 0.15,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 16,
        minHeight: 56,
        ...Platform.select({
            web: {
                transition: 'all 0.2s ease',
            },
        }),
    },
    input: {
        fontSize: 16,
        paddingVertical: 16,
        letterSpacing: 0.15,
    },
    inputIcon: {
        marginRight: 12,
    },
    eyeIcon: {
        padding: 8,
        marginLeft: 8,
    },
    errorText: {
        fontSize: 12,
        marginTop: 6,
        marginLeft: 16,
        letterSpacing: 0.4,
    },

    // Button Styles
    button: {
        borderRadius: 16,
        overflow: 'hidden',
        marginVertical: 8,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        minHeight: 56,
    },
    buttonPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    gradientButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    buttonIcon: {
        marginRight: 8,
    },
    outlinedButton: {
        borderWidth: 2,
        paddingVertical: 16,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    textButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    textButtonText: {
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.3,
    },

    // Glass Card Styles
    glassCard: {
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
            },
        }),
    },

    // Divider Styles
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        fontSize: 13,
        fontWeight: '500',
        marginHorizontal: 16,
        letterSpacing: 0.4,
    },

    // Social Button Styles
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        minHeight: 52,
    },
    socialButtonText: {
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 12,
        letterSpacing: 0.3,
    },
});
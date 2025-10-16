// src/components/ui/FormInput.tsx
// Input component riutilizzabile e responsive

import React from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TextInputProps,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface FormInputProps extends TextInputProps {
    label?: string;
    error?: string;
    required?: boolean;
    icon?: LucideIcon;
    iconSize?: number;
    helpText?: string;
    theme?: {
        text: string;
        textSecondary: string;
        inputBackground: string;
        border: string;
        error: string;
        placeholderColor: string;
    };
    containerStyle?: ViewStyle;
    labelStyle?: TextStyle;
    inputStyle?: TextStyle;
}

export const FormInput: React.FC<FormInputProps> = ({
                                                        label,
                                                        error,
                                                        required = false,
                                                        icon: Icon,
                                                        iconSize = 20,
                                                        helpText,
                                                        theme = {
                                                            text: '#000000',
                                                            textSecondary: '#6b7280',
                                                            inputBackground: '#ffffff',
                                                            border: '#e5e7eb',
                                                            error: '#ef4444',
                                                            placeholderColor: '#9ca3af',
                                                        },
                                                        containerStyle,
                                                        labelStyle,
                                                        inputStyle,
                                                        ...textInputProps
                                                    }) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {/* Label */}
            {label && (
                <Text style={[styles.label, { color: theme.text }, labelStyle]}>
                    {label}
                    {required && <Text style={{ color: theme.error }}> *</Text>}
                </Text>
            )}

            {/* Input Container */}
            <View
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor: theme.inputBackground,
                        borderColor: error ? theme.error : theme.border,
                    },
                ]}
            >
                {/* Icon */}
                {Icon && (
                    <View style={styles.iconContainer}>
                        <Icon size={iconSize} color={theme.textSecondary} />
                    </View>
                )}

                {/* TextInput */}
                <TextInput
                    style={[
                        styles.input,
                        { color: theme.text },
                        Icon && styles.inputWithIcon,
                        inputStyle,
                    ]}
                    placeholderTextColor={theme.placeholderColor}
                    {...textInputProps}
                />
            </View>

            {/* Error Message */}
            {error && <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>}

            {/* Help Text */}
            {!error && helpText && (
                <Text style={[styles.helpText, { color: theme.textSecondary }]}>{helpText}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    iconContainer: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
    },
    inputWithIcon: {
        paddingLeft: 0,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
    },
    helpText: {
        fontSize: 12,
        marginTop: 4,
    },
});

// ============================================
// src/components/ui/Button.tsx
// Button component riutilizzabile con varianti
// ============================================

import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    View,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    iconSize?: number;
    fullWidth?: boolean;
    theme?: {
        primary: string;
        text: string;
        textSecondary: string;
        border: string;
        error: string;
    };
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
                                                  title,
                                                  onPress,
                                                  variant = 'primary',
                                                  size = 'medium',
                                                  disabled = false,
                                                  loading = false,
                                                  icon: Icon,
                                                  iconPosition = 'left',
                                                  iconSize = 20,
                                                  fullWidth = false,
                                                  theme = {
                                                      primary: '#2563eb',
                                                      text: '#000000',
                                                      textSecondary: '#6b7280',
                                                      border: '#e5e7eb',
                                                      error: '#ef4444',
                                                  },
                                                  style,
                                                  textStyle,
                                              }) => {
    const getButtonStyle = (): ViewStyle => {
        const baseStyle: ViewStyle = {
            ...styles.button,
            ...styles[`button_${size}`],
        };

        if (fullWidth) {
            baseStyle.width = '100%';
        }

        if (disabled || loading) {
            baseStyle.opacity = 0.5;
        }

        switch (variant) {
            case 'primary':
                return {
                    ...baseStyle,
                    backgroundColor: theme.primary,
                };
            case 'secondary':
                return {
                    ...baseStyle,
                    backgroundColor: theme.textSecondary,
                };
            case 'outline':
                return {
                    ...baseStyle,
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: theme.border,
                };
            case 'ghost':
                return {
                    ...baseStyle,
                    backgroundColor: 'transparent',
                };
            case 'danger':
                return {
                    ...baseStyle,
                    backgroundColor: theme.error,
                };
            default:
                return baseStyle;
        }
    };

    const getTextStyle = (): TextStyle => {
        const baseStyle: TextStyle = {
            ...styles.buttonText,
            ...styles[`buttonText_${size}`],
        };

        if (variant === 'outline' || variant === 'ghost') {
            return {
                ...baseStyle,
                color: theme.text,
            };
        }

        return {
            ...baseStyle,
            color: '#ffffff',
        };
    };

    const iconColor = variant === 'outline' || variant === 'ghost' ? theme.text : '#ffffff';

    return (
        <TouchableOpacity
            style={[getButtonStyle(), style]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={iconColor} />
            ) : (
                <View style={styles.buttonContent}>
                    {Icon && iconPosition === 'left' && (
                        <Icon size={iconSize} color={iconColor} style={styles.iconLeft} />
                    )}
                    <Text style={[getTextStyle(), textStyle]}>{title}</Text>
                    {Icon && iconPosition === 'right' && (
                        <Icon size={iconSize} color={iconColor} style={styles.iconRight} />
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
};

const buttonStyles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    button_small: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    button_medium: {
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    button_large: {
        paddingVertical: 16,
        paddingHorizontal: 32,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontWeight: '600',
    },
    buttonText_small: {
        fontSize: 14,
    },
    buttonText_medium: {
        fontSize: 16,
    },
    buttonText_large: {
        fontSize: 18,
    },
    iconLeft: {
        marginRight: 8,
    },
    iconRight: {
        marginLeft: 8,
    },
});

// Merge degli stili
const styles = { ...buttonStyles };

// ============================================
// src/components/ui/Card.tsx
// Card component riutilizzabile
// ============================================

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface CardProps {
    title?: string;
    subtitle?: string;
    icon?: LucideIcon;
    iconSize?: number;
    children: React.ReactNode;
    theme?: {
        cardBackground: string;
        border: string;
        text: string;
        textSecondary: string;
        accent: string;
    };
    style?: ViewStyle;
    headerStyle?: ViewStyle;
    titleStyle?: TextStyle;
}

export const Card: React.FC<CardProps> = ({
                                              title,
                                              subtitle,
                                              icon: Icon,
                                              iconSize = 20,
                                              children,
                                              theme = {
                                                  cardBackground: '#ffffff',
                                                  border: '#e5e7eb',
                                                  text: '#000000',
                                                  textSecondary: '#6b7280',
                                                  accent: '#2563eb',
                                              },
                                              style,
                                              headerStyle,
                                              titleStyle,
                                          }) => {
    return (
        <View
            style={[
                cardStyles.card,
                {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
                },
                style,
            ]}
        >
            {/* Header */}
            {(title || Icon) && (
                <View style={[cardStyles.header, headerStyle]}>
                    {Icon && (
                        <Icon size={iconSize} color={theme.accent} style={cardStyles.headerIcon} />
                    )}
                    <View style={cardStyles.headerText}>
                        {title && (
                            <Text style={[cardStyles.title, { color: theme.text }, titleStyle]}>
                                {title}
                            </Text>
                        )}
                        {subtitle && (
                            <Text style={[cardStyles.subtitle, { color: theme.textSecondary }]}>
                                {subtitle}
                            </Text>
                        )}
                    </View>
                </View>
            )}

            {/* Content */}
            <View style={cardStyles.content}>{children}</View>
        </View>
    );
};

const cardStyles = StyleSheet.create({
    card: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerIcon: {
        marginRight: 8,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 14,
    },
    content: {
        // Content styles here
    },
});

// ============================================
// src/components/ui/Badge.tsx
// Badge component per status e labels
// ============================================

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ViewStyle,
    TextStyle,
} from 'react-native';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';
type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
    label: string;
    variant?: BadgeVariant;
    size?: BadgeSize;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
                                                label,
                                                variant = 'default',
                                                size = 'medium',
                                                style,
                                                textStyle,
                                            }) => {
    const getVariantColors = () => {
        switch (variant) {
            case 'success':
                return { bg: '#10b98110', text: '#10b981' };
            case 'warning':
                return { bg: '#f59e0b10', text: '#f59e0b' };
            case 'error':
                return { bg: '#ef444410', text: '#ef4444' };
            case 'info':
                return { bg: '#2563eb10', text: '#2563eb' };
            default:
                return { bg: '#6b728010', text: '#6b7280' };
        }
    };

    const colors = getVariantColors();

    return (
        <View
            style={[
                badgeStyles.badge,
                badgeStyles[`badge_${size}`],
                { backgroundColor: colors.bg },
                style,
            ]}
        >
            <Text
                style={[
                    badgeStyles.badgeText,
                    badgeStyles[`badgeText_${size}`],
                    { color: colors.text },
                    textStyle,
                ]}
            >
                {label}
            </Text>
        </View>
    );
};

const badgeStyles = StyleSheet.create({
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    badge_small: {
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    badge_medium: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    badge_large: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    badgeText: {
        fontWeight: '600',
    },
    badgeText_small: {
        fontSize: 11,
    },
    badgeText_medium: {
        fontSize: 12,
    },
    badgeText_large: {
        fontSize: 14,
    },
});

// ============================================
// src/components/ui/Divider.tsx
// Divider component
// ============================================

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface DividerProps {
    color?: string;
    thickness?: number;
    style?: ViewStyle;
    vertical?: boolean;
}

export const Divider: React.FC<DividerProps> = ({
                                                    color = '#e5e7eb',
                                                    thickness = 1,
                                                    style,
                                                    vertical = false,
                                                }) => {
    return (
        <View
            style={[
                vertical ? dividerStyles.vertical : dividerStyles.horizontal,
                {
                    backgroundColor: color,
                    [vertical ? 'width' : 'height']: thickness,
                },
                style,
            ]}
        />
    );
};

const dividerStyles = StyleSheet.create({
    horizontal: {
        width: '100%',
        marginVertical: 16,
    },
    vertical: {
        height: '100%',
        marginHorizontal: 16,
    },
});

// ============================================
// Export all components
// ============================================

export default {
    FormInput,
    Button,
    Card,
    Badge,
    Divider,
};
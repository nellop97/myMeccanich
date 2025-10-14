// src/components/form/FormComponents.tsx
import React from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    TextInputProps,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';

// ============================================
// FORM INPUT CON ICONA
// ============================================
interface FormInputProps extends TextInputProps {
    label?: string;
    icon?: LucideIcon;
    iconColor?: string;
    error?: string;
    required?: boolean;
    rightElement?: React.ReactNode;
    containerStyle?: any;
}

export const FormInput: React.FC<FormInputProps> = ({
                                                        label,
                                                        icon: Icon,
                                                        iconColor = '#94a3b8',
                                                        error,
                                                        required = false,
                                                        rightElement,
                                                        containerStyle,
                                                        ...textInputProps
                                                    }) => {
    return (
        <View style={[styles.inputContainer, containerStyle]}>
            {label && (
                <Text style={styles.label}>
                    {label} {required && <Text style={styles.required}>*</Text>}
                </Text>
            )}
            <View style={[styles.input, error && styles.inputError]}>
                {Icon && <Icon size={20} color={iconColor} />}
                <TextInput
                    style={styles.textInput}
                    placeholderTextColor="#94a3b8"
                    {...textInputProps}
                />
                {rightElement}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

// ============================================
// FORM SELECT / DROPDOWN BUTTON
// ============================================
interface FormSelectProps {
    label?: string;
    icon?: LucideIcon;
    iconColor?: string;
    value: string;
    placeholder: string;
    onPress: () => void;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    rightIcon?: LucideIcon;
}

export const FormSelect: React.FC<FormSelectProps> = ({
                                                          label,
                                                          icon: Icon,
                                                          iconColor = '#94a3b8',
                                                          value,
                                                          placeholder,
                                                          onPress,
                                                          error,
                                                          required = false,
                                                          disabled = false,
                                                          rightIcon: RightIcon,
                                                      }) => {
    return (
        <View style={styles.inputContainer}>
            {label && (
                <Text style={styles.label}>
                    {label} {required && <Text style={styles.required}>*</Text>}
                </Text>
            )}
            <TouchableOpacity
                style={[
                    styles.input,
                    error && styles.inputError,
                    disabled && styles.inputDisabled,
                ]}
                onPress={onPress}
                disabled={disabled}
            >
                {Icon && <Icon size={20} color={iconColor} />}
                <Text
                    style={[
                        styles.textInput,
                        !value && styles.placeholderText,
                    ]}
                >
                    {value || placeholder}
                </Text>
                {RightIcon && <RightIcon size={20} color={iconColor} />}
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

// ============================================
// FORM CHIP SELECTOR (es. tipo carburante)
// ============================================
interface ChipOption {
    id: string;
    label: string;
    icon?: string;
}

interface FormChipSelectorProps {
    label?: string;
    options: ChipOption[];
    selectedId: string;
    onSelect: (id: string) => void;
    multiSelect?: boolean;
}

export const FormChipSelector: React.FC<FormChipSelectorProps> = ({
                                                                      label,
                                                                      options,
                                                                      selectedId,
                                                                      onSelect,
                                                                      multiSelect = false,
                                                                  }) => {
    return (
        <View style={styles.inputContainer}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={styles.chipGrid}>
                {options.map((option) => {
                    const isSelected = selectedId === option.id;
                    return (
                        <TouchableOpacity
                            key={option.id}
                            style={[styles.chip, isSelected && styles.chipSelected]}
                            onPress={() => onSelect(option.id)}
                        >
                            {option.icon && (
                                <Text style={styles.chipIcon}>{option.icon}</Text>
                            )}
                            <Text
                                style={[
                                    styles.chipText,
                                    isSelected && styles.chipTextSelected,
                                ]}
                            >
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

// ============================================
// FORM COLOR PICKER
// ============================================
interface ColorOption {
    id: string;
    name: string;
    hex: string;
    textColor?: string;
    border?: string;
}

interface FormColorPickerProps {
    label?: string;
    colors: ColorOption[];
    selectedColor: string;
    onSelectColor: (hex: string) => void;
}

export const FormColorPicker: React.FC<FormColorPickerProps> = ({
                                                                    label,
                                                                    colors,
                                                                    selectedColor,
                                                                    onSelectColor,
                                                                }) => {
    return (
        <View style={styles.inputContainer}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={styles.colorGrid}>
                {colors.map((color) => {
                    const isSelected = selectedColor === color.hex;
                    return (
                        <TouchableOpacity
                            key={color.id}
                            style={[
                                styles.colorChip,
                                { backgroundColor: color.hex },
                                color.border && {
                                    borderColor: color.border,
                                    borderWidth: 1,
                                },
                                isSelected && styles.colorChipSelected,
                            ]}
                            onPress={() => onSelectColor(color.hex)}
                        >
                            {isSelected && (
                                <View style={styles.colorCheckmark}>
                                    <Text style={{ color: color.textColor || '#fff' }}>✓</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

// ============================================
// FORM SECTION HEADER
// ============================================
interface FormSectionProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    containerStyle?: any;
}

export const FormSection: React.FC<FormSectionProps> = ({
                                                            title,
                                                            subtitle,
                                                            children,
                                                            containerStyle,
                                                        }) => {
    return (
        <View style={[styles.section, containerStyle]}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
            </View>
            {children}
        </View>
    );
};

// ============================================
// FORM TEXTAREA
// ============================================
interface FormTextAreaProps extends TextInputProps {
    label?: string;
    error?: string;
    required?: boolean;
}

export const FormTextArea: React.FC<FormTextAreaProps> = ({
                                                              label,
                                                              error,
                                                              required = false,
                                                              ...textInputProps
                                                          }) => {
    return (
        <View style={styles.inputContainer}>
            {label && (
                <Text style={styles.label}>
                    {label} {required && <Text style={styles.required}>*</Text>}
                </Text>
            )}
            <View style={[styles.input, styles.textAreaInput, error && styles.inputError]}>
                <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    {...textInputProps}
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
    // Input Container
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
    },
    required: {
        color: '#ef4444',
    },
    input: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    inputError: {
        borderColor: '#ef4444',
    },
    inputDisabled: {
        opacity: 0.5,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#0f172a',
        padding: 0,
    },
    placeholderText: {
        color: '#94a3b8',
    },
    textAreaInput: {
        paddingVertical: 12,
        alignItems: 'flex-start',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
    },

    // Chips
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 6,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    chipSelected: {
        backgroundColor: '#dbeafe',
        borderColor: '#3b82f6',
    },
    chipIcon: {
        fontSize: 16,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748b',
    },
    chipTextSelected: {
        color: '#1e40af',
        fontWeight: '600',
    },

    // Colors
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    colorChip: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    colorChipSelected: {
        borderWidth: 3,
        borderColor: '#3b82f6',
    },
    colorCheckmark: {
        fontSize: 16,
        fontWeight: 'bold',
    },

    // Section
    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#64748b',
    },
});
// src/components/shared/FormComponents.tsx
// Componenti form riutilizzabili multipiattaforma

import React from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Platform,
    TextInputProps,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';

// ============================================
// DATE INPUT MULTIPIATTAFORMA
// ============================================
interface DateInputProps {
    label: string;
    value?: Date;
    onChange: (date?: Date) => void;
    placeholder?: string;
    icon?: LucideIcon;
    error?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
                                                        label,
                                                        value,
                                                        onChange,
                                                        placeholder = 'GG/MM/AAAA',
                                                        icon: Icon,
                                                        error,
                                                    }) => {
    if (Platform.OS === 'web') {
        return (
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>{label}</Text>
                <View style={[styles.inputWrapper, error && styles.inputError]}>
                    {Icon && <Icon size={20} color="#64748b" />}
                    <input
                        type="date"
                        value={value ? value.toISOString().split('T')[0] : ''}
                        onChange={(e) =>
                            onChange(e.target.value ? new Date(e.target.value) : undefined)
                        }
                        placeholder={placeholder}
                        style={{
                            flex: 1,
                            fontSize: 16,
                            color: '#1e293b',
                            border: 'none',
                            outline: 'none',
                            backgroundColor: 'transparent',
                        }}
                    />
                </View>
                {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
        );
    }

    // Mobile: usa TextInput con DateTimePicker nativo
    return (
        <View style={styles.fieldContainer}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity
                style={[styles.inputWrapper, error && styles.inputError]}
                onPress={() => {
                    // TODO: Aprire DateTimePicker mobile
                    console.log('Open date picker');
                }}
            >
                {Icon && <Icon size={20} color="#64748b" />}
                <Text style={styles.inputText}>
                    {value ? value.toLocaleDateString('it-IT') : placeholder}
                </Text>
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

// ============================================
// NUMBER INPUT CON UNITÀ
// ============================================
interface NumberInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
    label: string;
    value?: number;
    onChange: (value?: number) => void;
    unit?: string;
    icon?: LucideIcon;
    error?: string;
    min?: number;
    max?: number;
}

export const NumberInput: React.FC<NumberInputProps> = ({
                                                            label,
                                                            value,
                                                            onChange,
                                                            unit,
                                                            icon: Icon,
                                                            error,
                                                            placeholder,
                                                            min,
                                                            max,
                                                            ...textInputProps
                                                        }) => {
    const handleChange = (text: string) => {
        if (text === '') {
            onChange(undefined);
            return;
        }

        const num = parseFloat(text);
        if (!isNaN(num)) {
            if (min !== undefined && num < min) return;
            if (max !== undefined && num > max) return;
            onChange(num);
        }
    };

    if (Platform.OS === 'web') {
        return (
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>{label}</Text>
                <View style={[styles.inputWrapper, error && styles.inputError]}>
                    {Icon && <Icon size={20} color="#64748b" />}
                    <input
                        type="number"
                        value={value?.toString() || ''}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder={placeholder}
                        min={min}
                        max={max}
                        style={{
                            flex: 1,
                            fontSize: 16,
                            color: '#1e293b',
                            border: 'none',
                            outline: 'none',
                            backgroundColor: 'transparent',
                        }}
                        {...textInputProps}
                    />
                    {unit && <Text style={styles.unitText}>{unit}</Text>}
                </View>
                {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
        );
    }

    return (
        <View style={styles.fieldContainer}>
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.inputWrapper, error && styles.inputError]}>
                {Icon && <Icon size={20} color="#64748b" />}
                <TextInput
                    style={styles.textInputNative}
                    value={value?.toString() || ''}
                    onChangeText={handleChange}
                    placeholder={placeholder}
                    keyboardType="numeric"
                    placeholderTextColor="#94a3b8"
                    {...textInputProps}
                />
                {unit && <Text style={styles.unitText}>{unit}</Text>}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

// ============================================
// TEXT INPUT STANDARD
// ============================================
interface StandardInputProps extends TextInputProps {
    label: string;
    icon?: LucideIcon;
    error?: string;
    helperText?: string;
    required?: boolean;
    rightElement?: React.ReactNode;
}

export const StandardInput: React.FC<StandardInputProps> = ({
                                                                label,
                                                                icon: Icon,
                                                                error,
                                                                helperText,
                                                                required,
                                                                rightElement,
                                                                ...textInputProps
                                                            }) => {
    if (Platform.OS === 'web') {
        return (
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                    {label} {required && <Text style={styles.required}>*</Text>}
                </Text>
                <View style={[styles.inputWrapper, error && styles.inputError]}>
                    {Icon && <Icon size={20} color="#64748b" />}
                    <input
                        type="text"
                        style={{
                            flex: 1,
                            fontSize: 16,
                            color: '#1e293b',
                            border: 'none',
                            outline: 'none',
                            backgroundColor: 'transparent',
                        }}
                        {...textInputProps}
                    />
                    {rightElement}
                </View>
                {error && <Text style={styles.errorText}>{error}</Text>}
                {helperText && !error && (
                    <Text style={styles.helperText}>{helperText}</Text>
                )}
            </View>
        );
    }

    return (
        <View style={styles.fieldContainer}>
            <Text style={styles.label}>
                {label} {required && <Text style={styles.required}>*</Text>}
            </Text>
            <View style={[styles.inputWrapper, error && styles.inputError]}>
                {Icon && <Icon size={20} color="#64748b" />}
                <TextInput
                    style={styles.textInputNative}
                    placeholderTextColor="#94a3b8"
                    {...textInputProps}
                />
                {rightElement}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            {helperText && !error && (
                <Text style={styles.helperText}>{helperText}</Text>
            )}
        </View>
    );
};

// ============================================
// CHIP SELECTOR
// ============================================
interface ChipOption {
    id: string;
    label: string;
    icon?: string;
}

interface ChipSelectorProps {
    label: string;
    options: ChipOption[];
    selectedId: string;
    onSelect: (id: string) => void;
    required?: boolean;
    error?: string;
}

export const ChipSelector: React.FC<ChipSelectorProps> = ({
                                                              label,
                                                              options,
                                                              selectedId,
                                                              onSelect,
                                                              required,
                                                              error,
                                                          }) => {
    return (
        <View style={styles.fieldContainer}>
            <Text style={styles.label}>
                {label} {required && <Text style={styles.required}>*</Text>}
            </Text>
            <View style={styles.chipGrid}>
                {options.map((option) => {
                    const isSelected = selectedId === option.id;
                    return (
                        <TouchableOpacity
                            key={option.id}
                            style={[styles.chip, isSelected && styles.chipSelected]}
                            onPress={() => onSelect(option.id)}
                        >
                            {option.icon && <Text style={styles.chipIcon}>{option.icon}</Text>}
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
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

// ============================================
// MODAL PICKER (per liste lunghe)
// ============================================
interface ModalPickerProps {
    label: string;
    value: string;
    placeholder: string;
    options: string[];
    onSelect: (value: string) => void;
    icon?: LucideIcon;
    error?: string;
    required?: boolean;
}

export const ModalPicker: React.FC<ModalPickerProps> = ({
                                                            label,
                                                            value,
                                                            placeholder,
                                                            options,
                                                            onSelect,
                                                            icon: Icon,
                                                            error,
                                                            required,
                                                        }) => {
    const [showModal, setShowModal] = React.useState(false);

    return (
        <View style={styles.fieldContainer}>
            <Text style={styles.label}>
                {label} {required && <Text style={styles.required}>*</Text>}
            </Text>
            <TouchableOpacity
                style={[
                    styles.pickerButton,
                    error && styles.inputError,
                    !value && styles.pickerButtonEmpty,
                ]}
                onPress={() => setShowModal(true)}
            >
                {Icon && <Icon size={20} color="#64748b" />}
                <Text
                    style={[
                        styles.pickerButtonText,
                        !value && styles.pickerButtonTextEmpty,
                    ]}
                >
                    {value || placeholder}
                </Text>
                <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* TODO: Implementare modale per selezione */}
        </View>
    );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
    fieldContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 12,
        letterSpacing: -0.2,
    },
    required: {
        color: '#ef4444',
    },

    // Input Wrapper
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        gap: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 1,
            },
            web: {
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            },
        }),
    },
    inputError: {
        borderColor: '#ef4444',
    },

    textInputNative: {
        flex: 1,
        fontSize: 16,
        color: '#1e293b',
        padding: 0,
    },
    inputText: {
        flex: 1,
        fontSize: 16,
        color: '#1e293b',
    },
    unitText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
    },

    errorText: {
        fontSize: 13,
        color: '#ef4444',
        marginTop: 6,
        marginLeft: 4,
    },
    helperText: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 6,
        marginLeft: 4,
    },

    // Chip Selector
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 1,
            },
            web: {
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            },
        }),
    },
    chipSelected: {
        backgroundColor: '#eff6ff',
        borderColor: '#3b82f6',
    },
    chipIcon: {
        fontSize: 18,
    },
    chipText: {
        fontSize: 15,
        color: '#64748b',
        fontWeight: '500',
    },
    chipTextSelected: {
        color: '#3b82f6',
        fontWeight: '600',
    },

    // Modal Picker
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        gap: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 1,
            },
            web: {
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            },
        }),
    },
    pickerButtonEmpty: {
        borderColor: '#cbd5e1',
    },
    pickerButtonText: {
        flex: 1,
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '500',
    },
    pickerButtonTextEmpty: {
        color: '#94a3b8',
        fontWeight: '400',
    },
    pickerArrow: {
        fontSize: 12,
        color: '#64748b',
    },
});
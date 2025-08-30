// src/components/pickers/UniversalDatePicker.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Modal,
    Animated,
    Pressable,
} from 'react-native';
import { Calendar, Clock, ChevronDown, X } from 'lucide-react-native';
import { useAppThemeManager } from '../../hooks/useTheme';

// Import condizionale per DateTimePicker nativo
let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
    try {
        DateTimePicker = require('@react-native-community/datetimepicker').default;
    } catch (error) {
        console.warn('DateTimePicker non disponibile');
    }
}

// Import condizionale per react-native-calendars (opzionale)
let RNCalendar: any = null;
if (Platform.OS !== 'web') {
    try {
        const CalendarModule = require('react-native-calendars');
        RNCalendar = CalendarModule.Calendar;
    } catch (error) {
        console.warn('react-native-calendars non disponibile, usando picker nativo');
    }
}

interface UniversalDatePickerProps {
    value: Date;
    onChange: (date: Date) => void;
    label?: string;
    placeholder?: string;
    mode?: 'date' | 'time' | 'datetime';
    minimumDate?: Date;
    maximumDate?: Date;
    disabled?: boolean;
    error?: string;
    helperText?: string;
    showCalendar?: boolean; // Mostra calendario completo su mobile
    locale?: string;
    format?: 'short' | 'medium' | 'long' | 'full';
}

export const UniversalDatePicker: React.FC<UniversalDatePickerProps> = ({
                                                                            value,
                                                                            onChange,
                                                                            label,
                                                                            placeholder,
                                                                            mode = 'date',
                                                                            minimumDate,
                                                                            maximumDate,
                                                                            disabled = false,
                                                                            error,
                                                                            helperText,
                                                                            showCalendar = false,
                                                                            locale = 'it-IT',
                                                                            format = 'long',
                                                                        }) => {
    const { colors, isDark } = useAppThemeManager();
    const [showPicker, setShowPicker] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [tempDate, setTempDate] = useState(value);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        if (showModal) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [showModal]);

    const formatDate = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = {};

        if (mode === 'time') {
            options.hour = '2-digit';
            options.minute = '2-digit';
            if (format === 'long' || format === 'full') {
                options.second = '2-digit';
            }
            return date.toLocaleTimeString(locale, options);
        }

        if (mode === 'datetime') {
            switch (format) {
                case 'short':
                    options.dateStyle = 'short';
                    options.timeStyle = 'short';
                    break;
                case 'medium':
                    options.dateStyle = 'medium';
                    options.timeStyle = 'short';
                    break;
                case 'long':
                    options.dateStyle = 'long';
                    options.timeStyle = 'short';
                    break;
                case 'full':
                    options.dateStyle = 'full';
                    options.timeStyle = 'medium';
                    break;
            }
            return date.toLocaleString(locale, options);
        }

        // mode === 'date'
        switch (format) {
            case 'short':
                options.dateStyle = 'short';
                break;
            case 'medium':
                options.dateStyle = 'medium';
                break;
            case 'long':
                options.dateStyle = 'long';
                break;
            case 'full':
                options.dateStyle = 'full';
                break;
        }
        return date.toLocaleDateString(locale, options);
    };

    const handleDateChange = (date: Date) => {
        if (minimumDate && date < minimumDate) {
            date = minimumDate;
        }
        if (maximumDate && date > maximumDate) {
            date = maximumDate;
        }

        onChange(date);
        setTempDate(date);
        setShowPicker(false);
        setShowModal(false);
    };

    const closeModal = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 50,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setShowModal(false);
        });
    };

    // ==================== WEB IMPLEMENTATION ====================
    if (Platform.OS === 'web') {
        const getInputType = () => {
            switch (mode) {
                case 'time': return 'time';
                case 'datetime': return 'datetime-local';
                default: return 'date';
            }
        };

        const getWebValue = () => {
            try {
                if (mode === 'time') {
                    return value.toTimeString().slice(0, 5);
                }
                if (mode === 'datetime') {
                    // Format: YYYY-MM-DDTHH:mm
                    const year = value.getFullYear();
                    const month = String(value.getMonth() + 1).padStart(2, '0');
                    const day = String(value.getDate()).padStart(2, '0');
                    const hours = String(value.getHours()).padStart(2, '0');
                    const minutes = String(value.getMinutes()).padStart(2, '0');
                    return `${year}-${month}-${day}T${hours}:${minutes}`;
                }
                // mode === 'date'
                return value.toISOString().split('T')[0];
            } catch (error) {
                return '';
            }
        };

        const getWebMin = () => {
            if (!minimumDate) return undefined;
            if (mode === 'datetime') {
                return minimumDate.toISOString().slice(0, 16);
            }
            return minimumDate.toISOString().split('T')[0];
        };

        const getWebMax = () => {
            if (!maximumDate) return undefined;
            if (mode === 'datetime') {
                return maximumDate.toISOString().slice(0, 16);
            }
            return maximumDate.toISOString().split('T')[0];
        };

        return (
            <View style={[styles.container, disabled && styles.disabled]}>
                {label && (
                    <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                        {label}
                    </Text>
                )}

                <View
                    style={[
                        styles.webInputContainer,
                        {
                            backgroundColor: colors.surfaceVariant,
                            borderColor: error ? colors.error : colors.outline,
                        },
                        disabled && styles.disabledInput,
                    ]}
                >
                    <View style={styles.iconContainer}>
                        {mode !== 'time' ?
                            <Calendar size={20} color={disabled ? colors.onSurfaceDisabled : colors.primary} /> :
                            <Clock size={20} color={disabled ? colors.onSurfaceDisabled : colors.primary} />
                        }
                    </View>

                    <input
                        type={getInputType()}
                        value={getWebValue()}
                        onChange={(e) => {
                            const newDate = new Date(e.target.value);
                            if (!isNaN(newDate.getTime())) {
                                handleDateChange(newDate);
                            }
                        }}
                        min={getWebMin()}
                        max={getWebMax()}
                        disabled={disabled}
                        placeholder={placeholder}
                        style={{
                            flex: 1,
                            padding: '12px',
                            fontSize: '16px',
                            border: 'none',
                            background: 'transparent',
                            color: disabled ? colors.onSurfaceDisabled : colors.onSurface,
                            outline: 'none',
                            fontFamily: 'inherit',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                        }}
                    />
                </View>

                {error && (
                    <Text style={[styles.errorText, { color: colors.error }]}>
                        {error}
                    </Text>
                )}
                {helperText && !error && (
                    <Text style={[styles.helperText, { color: colors.onSurfaceVariant }]}>
                        {helperText}
                    </Text>
                )}
            </View>
        );
    }

    // ==================== MOBILE IMPLEMENTATION ====================

    // Render del calendario customizzato se disponibile e richiesto
    const renderCalendarModal = () => {
        if (!showCalendar || !RNCalendar || mode !== 'date') {
            return null;
        }

        return (
            <Modal
                visible={showModal}
                transparent
                animationType="none"
                onRequestClose={closeModal}
            >
                <Pressable style={styles.modalOverlay} onPress={closeModal}>
                    <Animated.View
                        style={[
                            styles.modalContent,
                            {
                                backgroundColor: colors.surface,
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            }
                        ]}
                        onStartShouldSetResponder={() => true}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                                {label || 'Seleziona Data'}
                            </Text>
                            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                                <X size={24} color={colors.onSurfaceVariant} />
                            </TouchableOpacity>
                        </View>

                        <RNCalendar
                            current={value.toISOString().split('T')[0]}
                            minDate={minimumDate?.toISOString().split('T')[0]}
                            maxDate={maximumDate?.toISOString().split('T')[0]}
                            onDayPress={(day: any) => {
                                handleDateChange(new Date(day.dateString));
                            }}
                            theme={{
                                backgroundColor: colors.surface,
                                calendarBackground: colors.surface,
                                textSectionTitleColor: colors.onSurfaceVariant,
                                selectedDayBackgroundColor: colors.primary,
                                selectedDayTextColor: colors.onPrimary,
                                todayTextColor: colors.primary,
                                dayTextColor: colors.onSurface,
                                textDisabledColor: colors.onSurfaceDisabled,
                                monthTextColor: colors.onSurface,
                                arrowColor: colors.primary,
                                dotColor: colors.primary,
                                selectedDotColor: colors.onPrimary,
                                textDayFontFamily: 'System',
                                textMonthFontFamily: 'System',
                                textDayHeaderFontFamily: 'System',
                                textDayFontWeight: '400',
                                textMonthFontWeight: '600',
                                textDayHeaderFontWeight: '600',
                                textDayFontSize: 16,
                                textMonthFontSize: 18,
                                textDayHeaderFontSize: 14,
                            }}
                            style={styles.calendar}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.surfaceVariant }]}
                                onPress={closeModal}
                            >
                                <Text style={[styles.modalButtonText, { color: colors.onSurfaceVariant }]}>
                                    Annulla
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                                onPress={() => handleDateChange(tempDate)}
                            >
                                <Text style={[styles.modalButtonText, { color: colors.onPrimary }]}>
                                    Conferma
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </Pressable>
            </Modal>
        );
    };

    return (
        <View style={[styles.container, disabled && styles.disabled]}>
            {label && (
                <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                    {label}
                </Text>
            )}

            <TouchableOpacity
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor: colors.surfaceVariant,
                        borderColor: error ? colors.error : colors.outline,
                    },
                    disabled && styles.disabledInput,
                ]}
                onPress={() => {
                    if (disabled) return;
                    if (showCalendar && RNCalendar && mode === 'date') {
                        setShowModal(true);
                    } else {
                        setShowPicker(true);
                    }
                }}
                disabled={disabled}
            >
                <View style={styles.iconContainer}>
                    {mode !== 'time' ?
                        <Calendar size={20} color={disabled ? colors.onSurfaceDisabled : colors.primary} /> :
                        <Clock size={20} color={disabled ? colors.onSurfaceDisabled : colors.primary} />
                    }
                </View>

                <Text
                    style={[
                        styles.value,
                        { color: disabled ? colors.onSurfaceDisabled : colors.onSurface }
                    ]}
                    numberOfLines={1}
                >
                    {value ? formatDate(value) : (placeholder || 'Seleziona...')}
                </Text>

                <ChevronDown
                    size={20}
                    color={disabled ? colors.onSurfaceDisabled : colors.onSurfaceVariant}
                />
            </TouchableOpacity>

            {error && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                    {error}
                </Text>
            )}
            {helperText && !error && (
                <Text style={[styles.helperText, { color: colors.onSurfaceVariant }]}>
                    {helperText}
                </Text>
            )}

            {/* Native Date/Time Picker per Mobile */}
            {showPicker && DateTimePicker && (
                <DateTimePicker
                    value={value}
                    mode={mode === 'datetime' ? 'date' : mode}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                    onChange={(event: any, selectedDate?: Date) => {
                        setShowPicker(false);
                        if (selectedDate) {
                            if (mode === 'datetime' && Platform.OS === 'android') {
                                // Per Android datetime, mostra prima date poi time
                                setTempDate(selectedDate);
                                setTimeout(() => {
                                    setShowPicker(true);
                                    // Qui dovrebbe mostrare il time picker
                                }, 100);
                            } else {
                                handleDateChange(selectedDate);
                            }
                        }
                    }}
                />
            )}

            {/* Calendar Modal per Mobile (opzionale) */}
            {renderCalendarModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
    },
    disabled: {
        opacity: 0.6,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        minHeight: 48,
    },
    webInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    disabledInput: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    iconContainer: {
        marginRight: 12,
    },
    value: {
        flex: 1,
        fontSize: 16,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    helperText: {
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    closeButton: {
        padding: 4,
    },
    calendar: {
        marginHorizontal: 20,
        marginVertical: 10,
    },
    modalActions: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
});

export default UniversalDatePicker;
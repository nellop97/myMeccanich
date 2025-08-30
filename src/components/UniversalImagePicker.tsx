// src/components/pickers/UniversalDatePicker.tsx
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Modal,
    Animated,
} from 'react-native';
import { Calendar, Clock, ChevronDown } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { useAppThemeManager } from '../hooks/useTheme';

interface UniversalDatePickerProps {
    value: Date;
    onChange: (date: Date) => void;
    label?: string;
    mode?: 'date' | 'time' | 'datetime';
    minimumDate?: Date;
    maximumDate?: Date;
    disabled?: boolean;
    error?: string;
    showCalendar?: boolean; // Mostra calendario completo su mobile
}

export const UniversalDatePicker: React.FC<UniversalDatePickerProps> = ({
                                                                            value,
                                                                            onChange,
                                                                            label,
                                                                            mode = 'date',
                                                                            minimumDate,
                                                                            maximumDate,
                                                                            disabled = false,
                                                                            error,
                                                                            showCalendar = false,
                                                                        }) => {
    const { colors, isDark } = useAppThemeManager();
    const [showPicker, setShowPicker] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const formatDate = (date: Date) => {
        if (mode === 'time') {
            return date.toLocaleTimeString('it-IT', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        if (mode === 'datetime') {
            return date.toLocaleString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        }
        return date.toLocaleDateString('it-IT', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const handleDateChange = (date: Date) => {
        onChange(date);
        setShowPicker(false);
        setShowModal(false);
    };

    // WEB Implementation
    if (Platform.OS === 'web') {
        const getInputType = () => {
            switch (mode) {
                case 'time': return 'time';
                case 'datetime': return 'datetime-local';
                default: return 'date';
            }
        };

        const getWebValue = () => {
            if (mode === 'time') {
                return value.toTimeString().slice(0, 5);
            }
            if (mode === 'datetime') {
                return value.toISOString().slice(0, 16);
            }
            return value.toISOString().split('T')[0];
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
                        styles.inputContainer,
                        {
                            backgroundColor: colors.surfaceVariant,
                            borderColor: error ? colors.error : colors.outline,
                        }
                    ]}
                >
                    {mode !== 'time' ? <Calendar size={20} color={colors.primary} /> : <Clock size={20} color={colors.primary} />}
                    <input
                        type={getInputType()}
                        value={getWebValue()}
                        onChange={(e) => {
                            const newDate = new Date(e.target.value);
                            if (!isNaN(newDate.getTime())) {
                                handleDateChange(newDate);
                            }
                        }}
                        min={minimumDate?.toISOString().slice(0, mode === 'datetime' ? 16 : 10)}
                        max={maximumDate?.toISOString().slice(0, mode === 'datetime' ? 16 : 10)}
                        disabled={disabled}
                        style={{
                            flex: 1,
                            padding: '12px',
                            fontSize: '16px',
                            border: 'none',
                            background: 'transparent',
                            color: colors.onSurface,
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
            </View>
        );
    }

    // MOBILE Implementation with Calendar Option
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
                    }
                ]}
                onPress={() => showCalendar ? setShowModal(true) : setShowPicker(true)}
                disabled={disabled}
            >
                {mode !== 'time' ? <Calendar size={20} color={colors.primary} /> : <Clock size={20} color={colors.primary} />}
                <Text style={[styles.value, { color: colors.onSurface }]}>
                    {formatDate(value)}
                </Text>
                <ChevronDown size={20} color={colors.onSurfaceVariant} />
            </TouchableOpacity>

            {error && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                    {error}
                </Text>
            )}

            {/* Native Date/Time Picker */}
            {showPicker && (
                <DateTimePicker
                    value={value}
                    mode={mode === 'datetime' ? 'date' : mode}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                    onChange={(event, selectedDate) => {
                        setShowPicker(false);
                        if (selectedDate) {
                            if (mode === 'datetime' && Platform.OS === 'android') {
                                // Per Android, mostra prima date poi time
                                setShowPicker(true);
                                setTimeout(() => {
                                    setShowPicker(false);
                                    // Qui mostrerebbe il time picker
                                }, 100);
                            }
                            handleDateChange(selectedDate);
                        }
                    }}
                />
            )}

            {/* Calendar Modal for better UX */}
            <Modal
                visible={showModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View
                        style={[
                            styles.modalContent,
                            {
                                backgroundColor: colors.surface,
                                opacity: fadeAnim,
                            }
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                                {label || 'Seleziona Data'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Text style={[styles.modalClose, { color: colors.primary }]}>
                                    Chiudi
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <RNCalendar
                            current={value.toISOString().split('T')[0]}
                            minDate={minimumDate?.toISOString().split('T')[0]}
                            maxDate={maximumDate?.toISOString().split('T')[0]}
                            onDayPress={(day) => {
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
                            }}
                        />
                    </Animated.View>
                </View>
            </Modal>
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
        gap: 12,
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
        padding: 20,
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
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    modalClose: {
        fontSize: 16,
        fontWeight: '500',
    },
});

export default UniversalDatePicker;
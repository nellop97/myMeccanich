// src/screens/mechanic/CalendarAppointmentPicker.tsx
// FIX: Aggiunto fallback per theme e validazione props

import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    Car,
    CheckCircle,
    AlertCircle
} from 'lucide-react-native';
import { useWorkshopStore } from '../../store/workshopStore';

// Configurazione italiana per il calendario
LocaleConfig.locales['it'] = {
    monthNames: [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ],
    monthNamesShort: [
        'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
        'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
    ],
    dayNames: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'],
    dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
    today: 'Oggi'
};
LocaleConfig.defaultLocale = 'it';

interface CalendarAppointmentPickerProps {
    startDate: string | null;
    endDate: string | null;
    onPeriodChange: (startDate: string | null, endDate: string | null) => void;
    theme?: any; // ⚠️ Ora è opzionale con fallback
}

// 🔧 DEFAULT THEME - Fallback se non passato
const DEFAULT_THEME = {
    text: '#000000',
    textSecondary: '#6b7280',
    accent: '#2563eb',
    cardBackground: '#ffffff',
    border: '#e5e7eb',
    error: '#ef4444',
    warning: '#f59e0b',
    primary: '#2563eb',
};

const CalendarAppointmentPicker: React.FC<CalendarAppointmentPickerProps> = ({
                                                                                 startDate,
                                                                                 endDate,
                                                                                 onPeriodChange,
                                                                                 theme: propTheme // Rinominiamo per evitare conflitti
                                                                             }) => {
    const { cars } = useWorkshopStore();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // 🔧 FIX: Usa il theme passato o il fallback
    const theme = propTheme || DEFAULT_THEME;

    // Calcola tutti gli appuntamenti esistenti
    const existingAppointments = useMemo(() => {
        const appointments: { [key: string]: any[] } = {};

        cars.forEach(car => {
            car.repairs.forEach(repair => {
                if (repair.status !== 'completed') {
                    const dateKey = repair.scheduledDate;

                    if (!appointments[dateKey]) {
                        appointments[dateKey] = [];
                    }

                    appointments[dateKey].push({
                        carId: car.id,
                        repairId: repair.id,
                        car: car,
                        repair: repair,
                        plate: car.licensePlate || 'N/A'
                    });
                }
            });
        });

        return appointments;
    }, [cars]);

    // Prepara i marcatori per il calendario
    const markedDates = useMemo(() => {
        const marks: any = {};

        // Marca i giorni con appuntamenti esistenti
        Object.keys(existingAppointments).forEach(date => {
            const appointmentCount = existingAppointments[date].length;
            marks[date] = {
                marked: true,
                dotColor: appointmentCount > 2 ? '#ef4444' : appointmentCount > 1 ? '#f59e0b' : '#10b981',
                customStyles: {
                    container: {
                        backgroundColor: 'transparent',
                    },
                    text: {
                        color: theme.text, // ✅ Ora theme è garantito
                    },
                }
            };
        });

        // Gestione periodo selezionato
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const current = new Date(start);

            while (current <= end) {
                const dateString = current.toISOString().split('T')[0];
                const isStart = dateString === startDate;
                const isEnd = dateString === endDate;

                if (marks[dateString]) {
                    marks[dateString] = {
                        ...marks[dateString],
                        customStyles: {
                            container: {
                                backgroundColor: isStart || isEnd ? theme.accent : theme.accent + '40',
                                borderRadius: isStart && isEnd ? 8 : isStart ? '8px 0 0 8px' : isEnd ? '0 8px 8px 0' : 0,
                            },
                            text: {
                                color: '#ffffff',
                                fontWeight: isStart || isEnd ? 'bold' : 'normal',
                            },
                            dot: {
                                backgroundColor: '#ffffff',
                            }
                        }
                    };
                } else {
                    marks[dateString] = {
                        customStyles: {
                            container: {
                                backgroundColor: isStart || isEnd ? theme.accent : theme.accent + '40',
                                borderRadius: isStart && isEnd ? 8 : isStart ? '8px 0 0 8px' : isEnd ? '0 8px 8px 0' : 0,
                            },
                            text: {
                                color: '#ffffff',
                                fontWeight: isStart || isEnd ? 'bold' : 'normal',
                            },
                        }
                    };
                }

                current.setDate(current.getDate() + 1);
            }
        } else if (startDate) {
            // Solo data di inizio selezionata
            if (marks[startDate]) {
                marks[startDate] = {
                    ...marks[startDate],
                    customStyles: {
                        container: {
                            backgroundColor: theme.accent,
                            borderRadius: 8,
                        },
                        text: {
                            color: '#ffffff',
                            fontWeight: 'bold',
                        },
                        dot: {
                            backgroundColor: '#ffffff',
                        }
                    }
                };
            } else {
                marks[startDate] = {
                    selected: true,
                    selectedColor: theme.accent,
                    customStyles: {
                        container: {
                            backgroundColor: theme.accent,
                            borderRadius: 8,
                        },
                        text: {
                            color: '#ffffff',
                            fontWeight: 'bold',
                        },
                    }
                };
            }
        }

        return marks;
    }, [existingAppointments, startDate, endDate, theme]);

    const handleDayPress = (day: any) => {
        const dateString = day.dateString;

        if (!startDate) {
            // Nessuna data selezionata - seleziona come inizio
            onPeriodChange(dateString, null);
        } else if (!endDate) {
            // Solo data di inizio selezionata - seleziona come fine
            const start = new Date(startDate);
            const selected = new Date(dateString);

            if (selected < start) {
                // Se la data selezionata è prima dell'inizio, diventa il nuovo inizio
                onPeriodChange(dateString, null);
            } else if (selected.getTime() === start.getTime()) {
                // Se è lo stesso giorno, mantieni solo l'inizio
                onPeriodChange(dateString, null);
            } else {
                // Data di fine valida
                onPeriodChange(startDate, dateString);
            }
        } else {
            // Entrambe le date sono selezionate - inizia una nuova selezione
            onPeriodChange(dateString, null);
        }
    };

    const getWorkloadStatus = (date: string) => {
        const appointmentCount = existingAppointments[date]?.length || 0;
        if (appointmentCount === 0) return 'libero';
        if (appointmentCount <= 2) return 'normale';
        return 'pieno';
    };

    const getWorkloadColor = (status: string) => {
        switch (status) {
            case 'libero': return '#10b981';
            case 'normale': return '#f59e0b';
            case 'pieno': return '#ef4444';
            default: return theme.textSecondary;
        }
    };

    const getWorkloadText = (status: string) => {
        switch (status) {
            case 'libero': return 'Disponibile';
            case 'normale': return 'Carico normale';
            case 'pieno': return 'Pieno';
            default: return '';
        }
    };

    const renderQuickSelection = () => (
        <View style={styles.quickSelectionContainer}>
            <Text style={[styles.quickSelectionTitle, { color: theme.text }]}>
                Selezione Rapida
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                    style={[styles.quickSelectionButton, { borderColor: theme.border }]}
                    onPress={() => {
                        const today = new Date();
                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        onPeriodChange(tomorrow.toISOString().split('T')[0], tomorrow.toISOString().split('T')[0]);
                    }}
                >
                    <Text style={[styles.quickSelectionText, { color: theme.text }]}>Domani (1 giorno)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.quickSelectionButton, { borderColor: theme.border }]}
                    onPress={() => {
                        const today = new Date();
                        const start = new Date(today);
                        start.setDate(start.getDate() + 1);
                        const end = new Date(start);
                        end.setDate(end.getDate() + 2);
                        onPeriodChange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
                    }}
                >
                    <Text style={[styles.quickSelectionText, { color: theme.text }]}>3 giorni</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.quickSelectionButton, { borderColor: theme.border }]}
                    onPress={() => {
                        const today = new Date();
                        const start = new Date(today);
                        start.setDate(start.getDate() + 7);
                        const end = new Date(start);
                        end.setDate(end.getDate() + 4);
                        onPeriodChange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
                    }}
                >
                    <Text style={[styles.quickSelectionText, { color: theme.text }]}>Prossima settimana (5 giorni)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.quickSelectionButton, { borderColor: theme.border }]}
                    onPress={() => {
                        // Auto-suggerisci prossimo periodo disponibile
                        const today = new Date();
                        let bestStart = null;
                        let consecutiveFree = 0;

                        for (let i = 1; i <= 21; i++) {
                            const date = new Date(today);
                            date.setDate(date.getDate() + i);
                            const dateString = date.toISOString().split('T')[0];

                            // Salta i weekend
                            if (date.getDay() === 0 || date.getDay() === 6) {
                                consecutiveFree = 0;
                                continue;
                            }

                            const workloadStatus = getWorkloadStatus(dateString);
                            if (workloadStatus !== 'pieno') {
                                if (consecutiveFree === 0) {
                                    bestStart = dateString;
                                }
                                consecutiveFree++;

                                if (consecutiveFree >= 3) {
                                    onPeriodChange(bestStart!, dateString);
                                    break;
                                }
                            } else {
                                consecutiveFree = 0;
                                bestStart = null;
                            }
                        }
                    }}
                >
                    <Text style={[styles.quickSelectionText, { color: theme.text }]}>Auto-suggerisci</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.quickSelectionButton, { borderColor: theme.border }]}
                    onPress={() => {
                        onPeriodChange(null, null);
                    }}
                >
                    <Text style={[styles.quickSelectionText, { color: theme.error }]}>Cancella</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );

    const renderSelectedPeriodInfo = () => {
        if (!startDate) return null;

        const days = endDate ?
            Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1;

        return (
            <View style={[styles.selectedDatesContainer, { backgroundColor: theme.accent + '20', borderColor: theme.accent }]}>
                <View style={styles.selectedDatesHeader}>
                    <CheckCircle size={20} color={theme.accent} />
                    <Text style={[styles.selectedDatesTitle, { color: theme.accent }]}>
                        Periodo Selezionato ({days} {days === 1 ? 'giorno' : 'giorni'})
                    </Text>
                </View>

                <View style={styles.periodInfo}>
                    <View style={styles.periodItem}>
                        <Text style={[styles.periodLabel, { color: theme.textSecondary }]}>Inizio:</Text>
                        <Text style={[styles.periodValue, { color: theme.text }]}>
                            {new Date(startDate).toLocaleDateString('it-IT', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long'
                            })}
                        </Text>
                    </View>

                    {endDate && (
                        <View style={styles.periodItem}>
                            <Text style={[styles.periodLabel, { color: theme.textSecondary }]}>Fine:</Text>
                            <Text style={[styles.periodValue, { color: theme.text }]}>
                                {new Date(endDate).toLocaleDateString('it-IT', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long'
                                })}
                            </Text>
                        </View>
                    )}
                </View>

                <Text style={[styles.selectionHint, { color: theme.textSecondary }]}>
                    {!endDate ?
                        'Tocca un altro giorno per selezionare la data di fine (opzionale)' :
                        'Tocca un giorno per iniziare una nuova selezione'
                    }
                </Text>
            </View>
        );
    };

    const renderDayAppointments = () => {
        if (!startDate) return null;

        // Calcola tutti i giorni del periodo selezionato
        const periodDates = [];
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : start;
        const current = new Date(start);

        while (current <= end) {
            periodDates.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
        }

        // Filtra solo i giorni che hanno appuntamenti esistenti
        const relevantDates = periodDates.filter(date => existingAppointments[date]);

        if (relevantDates.length === 0) return null;

        return (
            <View style={[styles.appointmentsContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <View style={styles.appointmentsHeader}>
                    <AlertCircle size={20} color={theme.warning} />
                    <Text style={[styles.appointmentsTitle, { color: theme.text }]}>
                        Appuntamenti Esistenti nel Periodo
                    </Text>
                </View>

                {relevantDates.map(date => (
                    <View key={date} style={[styles.dayAppointments, { borderColor: theme.border }]}>
                        <Text style={[styles.dayAppointmentsDate, { color: theme.text }]}>
                            {new Date(date).toLocaleDateString('it-IT', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long'
                            })}
                        </Text>

                        {existingAppointments[date].map((appointment, index) => (
                            <View key={index} style={styles.appointmentItem}>
                                <Car size={16} color={theme.textSecondary} />
                                <Text style={[styles.appointmentText, { color: theme.textSecondary }]}>
                                    {appointment.plate} - {appointment.repair.description}
                                </Text>
                            </View>
                        ))}
                    </View>
                ))}
            </View>
        );
    };

    const renderLegend = () => (
        <View style={[styles.legend, { borderColor: theme.border }]}>
            <Text style={[styles.legendTitle, { color: theme.text }]}>Legenda:</Text>
            <View style={styles.legendItems}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                    <Text style={[styles.legendText, { color: theme.textSecondary }]}>Disponibile</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                    <Text style={[styles.legendText, { color: theme.textSecondary }]}>2-3 appuntamenti</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                    <Text style={[styles.legendText, { color: theme.textSecondary }]}>Giorno pieno (4+)</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.accent }]} />
                    <Text style={[styles.legendText, { color: theme.textSecondary }]}>Selezionato</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {renderQuickSelection()}

            <View style={[styles.calendarContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <View style={styles.calendarHeader}>
                    <CalendarIcon size={20} color={theme.accent} />
                    <Text style={[styles.calendarTitle, { color: theme.text }]}>
                        Seleziona il periodo di lavorazione
                    </Text>
                </View>

                <Calendar
                    current={currentMonth.toISOString().split('T')[0]}
                    markedDates={markedDates}
                    onDayPress={handleDayPress}
                    onMonthChange={(month) => setCurrentMonth(new Date(month.timestamp))}
                    minDate={new Date().toISOString().split('T')[0]}
                    theme={{
                        backgroundColor: theme.cardBackground,
                        calendarBackground: theme.cardBackground,
                        textSectionTitleColor: theme.text,
                        selectedDayBackgroundColor: theme.accent,
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: theme.accent,
                        dayTextColor: theme.text,
                        textDisabledColor: theme.textSecondary,
                        dotColor: theme.accent,
                        selectedDotColor: '#ffffff',
                        arrowColor: theme.accent,
                        monthTextColor: theme.text,
                        indicatorColor: theme.accent,
                        textDayFontSize: 16,
                        textMonthFontSize: 18,
                        textDayHeaderFontSize: 14,
                    }}
                    markingType={'custom'}
                    renderArrow={(direction) => (
                        direction === 'left' ?
                            <ChevronLeft size={20} color={theme.accent} /> :
                            <ChevronRight size={20} color={theme.accent} />
                    )}
                    hideExtraDays={true}
                    firstDay={1} // Lunedì come primo giorno
                />

                {renderLegend()}
            </View>

            {renderSelectedPeriodInfo()}
            {renderDayAppointments()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    quickSelectionContainer: {
        marginBottom: 16,
    },
    quickSelectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    quickSelectionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    quickSelectionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    calendarContainer: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 16,
    },
    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    calendarTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    legend: {
        padding: 16,
        borderTopWidth: 1,
    },
    legendTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    legendItems: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
    },
    selectedDatesContainer: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        marginBottom: 16,
    },
    selectedDatesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    selectedDatesTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    periodInfo: {
        marginTop: 8,
    },
    periodItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    periodLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    periodValue: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    selectionHint: {
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 8,
        textAlign: 'center',
    },
    appointmentsContainer: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 16,
    },
    appointmentsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    appointmentsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    dayAppointments: {
        padding: 16,
        borderBottomWidth: 1,
    },
    dayAppointmentsDate: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'capitalize',
    },
    appointmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    appointmentText: {
        fontSize: 14,
        marginLeft: 8,
    },
});

export default CalendarAppointmentPicker;
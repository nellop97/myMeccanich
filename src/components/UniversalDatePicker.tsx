// src/components/UniversalDatePicker.tsx
// Unico selettore di date dell'app: stesso calendario su iOS, Android e web
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react-native';
import {
    MECHANIC_MIN_TOUCH,
    mechanicRadius,
    mechanicStaticColors,
    useMechanicBreakpoints,
    useMechanicTheme,
} from '../screens/mechanic/mechanicTheme';
import {
    MONTH_NAMES,
    WEEKDAY_NAMES,
    buildMonthGrid,
    buildYearRange,
    isDayAllowed,
    isMonthAllowed,
    isSameDay,
    withDay,
} from '../utils/calendarGrid';

interface UniversalDatePickerProps {
    value?: Date | null;
    onChange: (date: Date) => void;
    onClear?: () => void;
    label?: string;
    placeholder?: string;
    mode?: 'date' | 'time' | 'datetime';
    minimumDate?: Date;
    maximumDate?: Date;
    disabled?: boolean;
    error?: string;
    helperText?: string;
    showCalendar?: boolean;
    locale?: string;
    format?: 'short' | 'medium' | 'long' | 'full';
}

type PanelView = 'days' | 'months' | 'years';

const TIME_ROW_HEIGHT = 44;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = Array.from({ length: 12 }, (_, step) => step * 5);

const pad = (value: number) => String(value).padStart(2, '0');

const formatValue = (date: Date, mode: string, format: string, locale: string) => {
    if (mode === 'time') {
        return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    }
    const dateOptions: Intl.DateTimeFormatOptions =
        format === 'short'
            ? { day: '2-digit', month: '2-digit', year: 'numeric' }
            : format === 'medium'
                ? { day: 'numeric', month: 'short', year: 'numeric' }
                : format === 'full'
                    ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
                    : { day: 'numeric', month: 'long', year: 'numeric' };

    return mode === 'datetime'
        ? date.toLocaleDateString(locale, { ...dateOptions, hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString(locale, dateOptions);
};

export const UniversalDatePicker: React.FC<UniversalDatePickerProps> = ({
    value,
    onChange,
    onClear,
    label,
    placeholder,
    mode = 'date',
    minimumDate,
    maximumDate,
    disabled = false,
    error,
    helperText,
    locale = 'it-IT',
    format = 'long',
}) => {
    const theme = useMechanicTheme();
    const { isMobile } = useMechanicBreakpoints();

    const [open, setOpen] = useState(false);
    const [view, setView] = useState<PanelView>('days');
    const [draft, setDraft] = useState<Date>(new Date());
    const [visibleYear, setVisibleYear] = useState(draft.getFullYear());
    const [visibleMonth, setVisibleMonth] = useState(draft.getMonth());
    const hoursRef = useRef<ScrollView>(null);
    const minutesRef = useRef<ScrollView>(null);

    const showsDays = mode !== 'time';
    const showsTime = mode !== 'date';
    const today = useMemo(() => new Date(), [open]);

    const openPanel = () => {
        if (disabled) return;

        const start = value ?? (minimumDate && minimumDate > today ? minimumDate : today);
        const rounded = new Date(start);
        rounded.setMinutes(Math.min(Math.round(rounded.getMinutes() / 5) * 5, 55), 0, 0);

        setDraft(rounded);
        setVisibleYear(rounded.getFullYear());
        setVisibleMonth(rounded.getMonth());
        setView('days');
        setOpen(true);
    };

    // L'orario selezionato deve essere visibile appena si apre il pannello
    useEffect(() => {
        if (!open || !showsTime) return;

        const timer = setTimeout(() => {
            hoursRef.current?.scrollTo({ y: draft.getHours() * TIME_ROW_HEIGHT, animated: false });
            minutesRef.current?.scrollTo({ y: (draft.getMinutes() / 5) * TIME_ROW_HEIGHT, animated: false });
        }, 0);

        return () => clearTimeout(timer);
    }, [open]);

    const close = () => setOpen(false);

    const days = useMemo(() => buildMonthGrid(visibleYear, visibleMonth), [visibleYear, visibleMonth]);
    const years = useMemo(() => buildYearRange(minimumDate, maximumDate), [minimumDate, maximumDate]);

    const changeMonth = (offset: number) => {
        const next = new Date(visibleYear, visibleMonth + offset, 1);
        setVisibleYear(next.getFullYear());
        setVisibleMonth(next.getMonth());
    };

    const canGoBack = isMonthAllowed(
        new Date(visibleYear, visibleMonth - 1, 1).getFullYear(),
        new Date(visibleYear, visibleMonth - 1, 1).getMonth(),
        minimumDate,
        maximumDate
    );
    const canGoForward = isMonthAllowed(
        new Date(visibleYear, visibleMonth + 1, 1).getFullYear(),
        new Date(visibleYear, visibleMonth + 1, 1).getMonth(),
        minimumDate,
        maximumDate
    );

    const handleDayPress = (day: Date) => {
        if (mode === 'date') {
            onChange(withDay(day, value));
            close();
            return;
        }
        setDraft(withDay(day, draft));
        setVisibleYear(day.getFullYear());
        setVisibleMonth(day.getMonth());
    };

    const setDraftTime = (hours: number, minutes: number) => {
        const next = new Date(draft);
        next.setHours(hours, minutes, 0, 0);
        setDraft(next);
    };

    const isBeforeMinimum = showsDays && !!minimumDate && draft.getTime() < minimumDate.getTime();
    const isAfterMaximum = showsDays && !!maximumDate && draft.getTime() > maximumDate.getTime();
    // Il minimo conta sull'orario solo con data e ora: col solo giorno basta la griglia
    const timeInvalid = mode === 'datetime' && (isBeforeMinimum || isAfterMaximum);

    const confirm = () => {
        if (timeInvalid) return;
        onChange(draft);
        close();
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.arrow}
                onPress={() => changeMonth(-1)}
                disabled={!canGoBack}
                accessibilityRole="button"
                accessibilityLabel="Mese precedente"
                accessibilityState={{ disabled: !canGoBack }}
            >
                <ChevronLeft size={22} color={canGoBack ? theme.text : theme.disabled} strokeWidth={2} />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.headerTitle}
                onPress={() => setView('years')}
                accessibilityRole="button"
                accessibilityLabel={`${MONTH_NAMES[visibleMonth]} ${visibleYear}, scegli anno e mese`}
            >
                <Text style={[styles.headerText, { color: theme.text }]}>
                    {MONTH_NAMES[visibleMonth]} {visibleYear}
                </Text>
                <ChevronDown size={16} color={theme.textSecondary} strokeWidth={2} />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.arrow}
                onPress={() => changeMonth(1)}
                disabled={!canGoForward}
                accessibilityRole="button"
                accessibilityLabel="Mese successivo"
                accessibilityState={{ disabled: !canGoForward }}
            >
                <ChevronRight size={22} color={canGoForward ? theme.text : theme.disabled} strokeWidth={2} />
            </TouchableOpacity>
        </View>
    );

    const renderDays = () => (
        <>
            {renderHeader()}
            <View style={styles.week}>
                {WEEKDAY_NAMES.map((weekday) => (
                    <Text key={weekday} style={[styles.weekday, { color: theme.textSecondary }]}>
                        {weekday}
                    </Text>
                ))}
            </View>
            <View style={styles.grid}>
                {days.map(({ date, isCurrentMonth }) => {
                    const allowed = isDayAllowed(date, minimumDate, maximumDate);
                    const selected = isSameDay(date, mode === 'date' ? value : draft);
                    const isToday = isSameDay(date, today);
                    const textColor = selected
                        ? theme.onPrimary
                        : !allowed
                            ? theme.disabled
                            : isCurrentMonth
                                ? theme.text
                                : theme.textSecondary;

                    return (
                        <TouchableOpacity
                            key={date.toISOString()}
                            style={styles.dayCell}
                            onPress={() => handleDayPress(date)}
                            disabled={!allowed}
                            accessibilityRole="button"
                            accessibilityLabel={date.toLocaleDateString(locale, {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                            accessibilityState={{ selected, disabled: !allowed }}
                        >
                            <View
                                style={[
                                    styles.day,
                                    selected && { backgroundColor: theme.primary },
                                    !selected && isToday && { borderWidth: 1, borderColor: theme.primary },
                                ]}
                            >
                                <Text style={[styles.dayText, { color: textColor }]}>{date.getDate()}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </>
    );

    const renderMonths = () => (
        <>
            <TouchableOpacity
                style={styles.headerTitle}
                onPress={() => setView('years')}
                accessibilityRole="button"
                accessibilityLabel={`Anno ${visibleYear}, cambia anno`}
            >
                <Text style={[styles.headerText, { color: theme.text }]}>{visibleYear}</Text>
                <ChevronDown size={16} color={theme.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
            <View style={styles.choiceGrid}>
                {MONTH_NAMES.map((name, month) => {
                    const allowed = isMonthAllowed(visibleYear, month, minimumDate, maximumDate);
                    const selected = month === visibleMonth;
                    return (
                        <TouchableOpacity
                            key={name}
                            style={[styles.choice, selected && { backgroundColor: theme.primary }]}
                            disabled={!allowed}
                            onPress={() => {
                                setVisibleMonth(month);
                                setView('days');
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={`${name} ${visibleYear}`}
                            accessibilityState={{ selected, disabled: !allowed }}
                        >
                            <Text
                                style={[
                                    styles.choiceText,
                                    { color: selected ? theme.onPrimary : allowed ? theme.text : theme.disabled },
                                ]}
                            >
                                {name.slice(0, 3)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </>
    );

    const renderYears = () => (
        <ScrollView
            style={styles.yearsList}
            contentOffset={{
                x: 0,
                y: Math.max(0, Math.floor(years.indexOf(visibleYear) / 4) * TIME_ROW_HEIGHT - TIME_ROW_HEIGHT * 2),
            }}
        >
            <View style={styles.choiceGrid}>
                {years.map((year) => {
                    const selected = year === visibleYear;
                    return (
                        <TouchableOpacity
                            key={year}
                            style={[styles.yearChoice, selected && { backgroundColor: theme.primary }]}
                            onPress={() => {
                                setVisibleYear(year);
                                setView('months');
                            }}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                        >
                            <Text style={[styles.choiceText, { color: selected ? theme.onPrimary : theme.text }]}>
                                {year}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </ScrollView>
    );

    const renderTimeColumn = (
        title: string,
        values: number[],
        selectedValue: number,
        onSelect: (value: number) => void,
        ref: React.RefObject<ScrollView | null>
    ) => (
        <View style={styles.timeColumn}>
            <Text style={[styles.timeTitle, { color: theme.textSecondary }]}>{title}</Text>
            <ScrollView ref={ref} style={[styles.timeList, { borderColor: theme.border }]} showsVerticalScrollIndicator={false}>
                {values.map((item) => {
                    const selected = item === selectedValue;
                    return (
                        <TouchableOpacity
                            key={item}
                            style={[styles.timeRow, selected && { backgroundColor: theme.primary }]}
                            onPress={() => onSelect(item)}
                            accessibilityRole="button"
                            accessibilityLabel={`${title} ${pad(item)}`}
                            accessibilityState={{ selected }}
                        >
                            <Text style={[styles.timeText, { color: selected ? theme.onPrimary : theme.text }]}>
                                {pad(item)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );

    const renderTime = () => (
        <View style={styles.timeRowGroup}>
            {renderTimeColumn('Ora', HOURS, draft.getHours(), (hour) => setDraftTime(hour, draft.getMinutes()), hoursRef)}
            {renderTimeColumn('Minuti', MINUTES, draft.getMinutes(), (minute) => setDraftTime(draft.getHours(), minute), minutesRef)}
        </View>
    );

    const Icon = mode === 'time' ? Clock : Calendar;
    const title = label || (mode === 'time' ? 'Scegli un orario' : mode === 'datetime' ? 'Scegli data e ora' : 'Scegli una data');

    return (
        <View style={styles.container}>
            {label ? <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text> : null}

            <TouchableOpacity
                style={[
                    styles.field,
                    { backgroundColor: theme.inputBackground, borderColor: error ? theme.error : theme.border },
                    disabled && styles.fieldDisabled,
                ]}
                onPress={openPanel}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={`${title}: ${value ? formatValue(value, mode, format, locale) : 'non impostata'}`}
            >
                <Icon size={20} color={theme.primary} strokeWidth={2} />
                <Text
                    style={[styles.fieldText, { color: value ? theme.text : theme.placeholder }]}
                    numberOfLines={1}
                >
                    {value ? formatValue(value, mode, format, locale) : placeholder || 'Seleziona...'}
                </Text>
                <ChevronDown size={20} color={theme.textSecondary} strokeWidth={2} />
            </TouchableOpacity>

            {error ? <Text style={[styles.message, { color: theme.error }]}>{error}</Text> : null}
            {helperText && !error ? <Text style={[styles.message, { color: theme.textSecondary }]}>{helperText}</Text> : null}

            <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
                <View style={[styles.overlay, isMobile && styles.overlayMobile]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Chiudi il calendario" />

                    <View
                        style={[styles.panel, isMobile && styles.panelMobile, { backgroundColor: theme.surface }]}
                        accessibilityViewIsModal
                    >
                        <View style={styles.panelHeader}>
                            <Text style={[styles.panelTitle, { color: theme.text }]} numberOfLines={1} accessibilityRole="header">
                                {title}
                            </Text>
                            <TouchableOpacity
                                style={styles.arrow}
                                onPress={close}
                                accessibilityRole="button"
                                accessibilityLabel="Chiudi"
                            >
                                <X size={22} color={theme.textSecondary} strokeWidth={2} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                            {showsDays && view === 'days' && renderDays()}
                            {showsDays && view === 'months' && renderMonths()}
                            {showsDays && view === 'years' && renderYears()}
                            {showsTime && view === 'days' && renderTime()}

                            {timeInvalid && (
                                <Text style={[styles.message, { color: theme.error }]}>
                                    {isBeforeMinimum ? 'Scegli un orario futuro' : "L'orario supera il limite consentito"}
                                </Text>
                            )}
                        </ScrollView>

                        {(showsTime || onClear) && view === 'days' && (
                            <View style={styles.footer}>
                                {onClear && value ? (
                                    <TouchableOpacity
                                        style={[styles.footerButton, { borderColor: theme.border, borderWidth: 1 }]}
                                        onPress={() => {
                                            onClear();
                                            close();
                                        }}
                                        accessibilityRole="button"
                                    >
                                        <Text style={[styles.footerText, { color: theme.text }]}>Rimuovi</Text>
                                    </TouchableOpacity>
                                ) : null}
                                {showsTime && (
                                    <TouchableOpacity
                                        style={[
                                            styles.footerButton,
                                            styles.footerPrimary,
                                            { backgroundColor: timeInvalid ? theme.disabled : theme.primary },
                                        ]}
                                        onPress={confirm}
                                        disabled={timeInvalid}
                                        accessibilityRole="button"
                                        accessibilityState={{ disabled: timeInvalid }}
                                    >
                                        <Text style={[styles.footerText, { color: theme.onPrimary }]}>Conferma</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    field: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 48,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderRadius: mechanicRadius.md,
    },
    fieldDisabled: {
        opacity: 0.6,
    },
    fieldText: {
        flex: 1,
        fontSize: 16,
    },
    message: {
        fontSize: 14,
        marginTop: 6,
    },
    overlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: mechanicStaticColors.overlay,
    },
    overlayMobile: {
        justifyContent: 'flex-end',
        padding: 0,
    },
    panel: {
        width: '100%',
        maxWidth: 380,
        maxHeight: '90%',
        padding: 16,
        borderRadius: mechanicRadius.xl,
    },
    panelMobile: {
        maxWidth: '100%',
        paddingBottom: 32,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    panelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    panelTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        minHeight: MECHANIC_MIN_TOUCH,
        paddingHorizontal: 8,
    },
    headerText: {
        fontSize: 16,
        fontWeight: '600',
    },
    arrow: {
        width: MECHANIC_MIN_TOUCH,
        height: MECHANIC_MIN_TOUCH,
        alignItems: 'center',
        justifyContent: 'center',
    },
    week: {
        flexDirection: 'row',
        marginTop: 4,
    },
    weekday: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: `${100 / 7}%`,
        height: MECHANIC_MIN_TOUCH,
        alignItems: 'center',
        justifyContent: 'center',
    },
    day: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayText: {
        fontSize: 16,
    },
    choiceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    choice: {
        width: '33.33%',
        minHeight: 56,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: mechanicRadius.md,
    },
    yearChoice: {
        width: '25%',
        minHeight: TIME_ROW_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: mechanicRadius.md,
    },
    choiceText: {
        fontSize: 16,
        fontWeight: '600',
    },
    yearsList: {
        maxHeight: 308,
    },
    timeRowGroup: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    timeColumn: {
        flex: 1,
    },
    timeTitle: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 4,
    },
    timeList: {
        height: TIME_ROW_HEIGHT * 3,
        borderWidth: 1,
        borderRadius: mechanicRadius.md,
    },
    timeRow: {
        height: TIME_ROW_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeText: {
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    footerButton: {
        flex: 1,
        minHeight: MECHANIC_MIN_TOUCH,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: mechanicRadius.md,
    },
    footerPrimary: {
        flex: 2,
    },
    footerText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default UniversalDatePicker;

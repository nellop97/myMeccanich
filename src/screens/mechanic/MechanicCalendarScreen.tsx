// src/screens/mechanic/MechanicCalendarScreen.tsx
// Agenda dell'officina: il mese a colpo d'occhio e gli interventi del giorno
import { useNavigation } from '@react-navigation/native';
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight, Clock, Phone, Plus, User } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store';
import {
  MONTH_NAMES,
  WEEKDAY_NAMES,
  buildMonthGrid,
  parseDayString,
  toDayString,
} from '../../utils/calendarGrid';
import MechanicHeader from './MechanicHeader';
import { MechanicEmptyState } from './MechanicStates';
import { Intervention, getInterventionStatus, isOpenIntervention, useInterventions } from './interventions';
import { MECHANIC_MIN_TOUCH, mechanicCard, mechanicRadius, useMechanicBreakpoints, useMechanicTheme } from './mechanicTheme';

const formatDayTitle = (dayKey: string) =>
  (parseDayString(dayKey) ?? new Date()).toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

const byTime = (a: Intervention, b: Intervention) =>
  (a.repair.scheduledTime || '').localeCompare(b.repair.scheduledTime || '');

const MechanicCalendarScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useStore();
  const theme = useMechanicTheme();
  const { isDesktop, isMobile } = useMechanicBreakpoints();
  const { interventions, loading, failed, reload } = useInterventions(user?.id);

  const todayKey = toDayString(new Date());
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Un'auto pronta non occupa più l'agenda: aspetta solo il ritiro
  const scheduled = useMemo(
    () => interventions.filter((item) => isOpenIntervention(item) && item.status !== 'ready'),
    [interventions]
  );

  const byDay = useMemo(() => {
    const groups: Record<string, Intervention[]> = {};
    scheduled.forEach((item) => {
      const key = item.repair.scheduledDate;
      if (key) {
        (groups[key] ??= []).push(item);
      }
    });
    return groups;
  }, [scheduled]);

  const days = useMemo(
    () => buildMonthGrid(visibleMonth.getFullYear(), visibleMonth.getMonth()),
    [visibleMonth]
  );

  const dayItems = useMemo(() => [...(byDay[selectedDay] ?? [])].sort(byTime), [byDay, selectedDay]);
  const nextDay = useMemo(
    () => Object.keys(byDay).sort().find((key) => key > selectedDay),
    [byDay, selectedDay]
  );

  const weekCount = useMemo(() => {
    const limit = new Date();
    limit.setDate(limit.getDate() + 7);
    const limitKey = toDayString(limit);
    return scheduled.filter(({ repair }) => repair.scheduledDate >= todayKey && repair.scheduledDate < limitKey).length;
  }, [scheduled, todayKey]);

  const goToDay = (dayKey: string) => {
    const date = parseDayString(dayKey);
    setSelectedDay(dayKey);
    if (date) {
      setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  const summary = [
    { label: 'Oggi', value: byDay[todayKey]?.length ?? 0 },
    { label: 'Prossimi 7 giorni', value: weekCount },
    { label: 'In lavorazione', value: scheduled.filter(({ status }) => status === 'in_progress').length },
  ];

  const renderMonth = () => (
    <View style={[styles.card, styles.monthCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.monthHeader}>
        <Text style={[styles.monthTitle, { color: theme.text }]} accessibilityRole="header">
          {MONTH_NAMES[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
        </Text>
        <TouchableOpacity
          style={[styles.todayButton, { borderColor: theme.border }]}
          onPress={() => goToDay(todayKey)}
          accessibilityRole="button"
          accessibilityLabel="Vai a oggi"
        >
          <Text style={[styles.todayText, { color: theme.text }]}>Oggi</Text>
        </TouchableOpacity>
        {[{ offset: -1, Icon: ChevronLeft, label: 'Mese precedente' }, { offset: 1, Icon: ChevronRight, label: 'Mese successivo' }].map(({ offset, Icon, label }) => (
          <TouchableOpacity
            key={label}
            style={styles.arrow}
            onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1))}
            accessibilityRole="button"
            accessibilityLabel={label}
          >
            <Icon size={22} color={theme.text} strokeWidth={2} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.week}>
        {WEEKDAY_NAMES.map((weekday) => (
          <Text key={weekday} style={[styles.weekday, { color: theme.textSecondary }]}>{weekday}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map(({ date, isCurrentMonth }) => {
          const key = toDayString(date);
          const count = byDay[key]?.length ?? 0;
          const selected = key === selectedDay;
          const isToday = key === todayKey;

          return (
            <TouchableOpacity
              key={key}
              style={[styles.cell, isDesktop && styles.cellDesktop]}
              onPress={() => goToDay(key)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${formatDayTitle(key)}, ${count === 1 ? '1 intervento' : `${count} interventi`}`}
            >
              <View
                style={[
                  styles.cellInner,
                  selected && { backgroundColor: theme.primary },
                  !selected && isToday && { borderWidth: 1, borderColor: theme.primary },
                ]}
              >
                <Text
                  style={[
                    styles.cellText,
                    { color: selected ? theme.onPrimary : isCurrentMonth ? theme.text : theme.textMuted },
                  ]}
                >
                  {date.getDate()}
                </Text>
                {count > 0 && (
                  <View style={[styles.count, { backgroundColor: selected ? theme.onPrimary : theme.primaryLight }]}>
                    <Text style={[styles.countText, { color: selected ? theme.primaryDark : theme.onPrimaryLight }]}>{count}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderIntervention = (item: Intervention) => {
    const { car, repair, status } = item;
    const statusStyle = getInterventionStatus(status, theme);

    return (
      <TouchableOpacity
        key={`${car.id}-${repair.id}`}
        style={[styles.item, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => navigation.navigate('RepairPartsManagement', { carId: car.id, repairId: repair.id })}
        accessibilityRole="button"
        accessibilityLabel={`${car.make} ${car.model}, targa ${car.licensePlate}, ${statusStyle.label}`}
      >
        <View style={styles.time}>
          <Clock size={16} color={theme.textSecondary} strokeWidth={2} />
          <Text style={[styles.timeText, { color: theme.text }]}>{repair.scheduledTime || '--:--'}</Text>
        </View>

        <View style={styles.itemBody}>
          <View style={styles.itemTop}>
            <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
              {car.make} {car.model}
            </Text>
            <View style={[styles.badge, { backgroundColor: statusStyle.background }]}>
              <Text style={[styles.badgeText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
            </View>
          </View>
          <Text style={[styles.plate, { color: theme.textSecondary }]}>{car.licensePlate}</Text>
          <Text style={[styles.description, { color: theme.text }]} numberOfLines={2}>{repair.description}</Text>
          {car.owner ? (
            <View style={styles.meta}>
              <User size={14} color={theme.textSecondary} strokeWidth={2} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]} numberOfLines={1}>{car.owner}</Text>
            </View>
          ) : null}
          {car.ownerPhone ? (
            <View style={styles.meta}>
              <Phone size={14} color={theme.textSecondary} strokeWidth={2} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>{car.ownerPhone}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderAgenda = () => (
    <View style={[styles.agenda, isDesktop && styles.agendaDesktop]}>
      <View>
        <Text style={[styles.agendaTitle, { color: theme.text }]} accessibilityRole="header">
          {selectedDay === todayKey ? 'Oggi' : formatDayTitle(selectedDay)}
        </Text>
        <Text style={[styles.agendaCount, { color: theme.textSecondary }]}>
          {dayItems.length === 1 ? '1 intervento' : `${dayItems.length} interventi`}
        </Text>
      </View>

      {dayItems.length > 0 ? (
        dayItems.map(renderIntervention)
      ) : (
        <View style={[styles.card, styles.emptyDay, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.agendaCount, { color: theme.textSecondary }]}>Nessun intervento in questo giorno.</Text>
          {nextDay ? (
            <TouchableOpacity style={styles.nextLink} onPress={() => goToDay(nextDay)} accessibilityRole="button">
              <Text style={[styles.nextText, { color: theme.primary }]}>Vai al prossimo: {formatDayTitle(nextDay)}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }

    if (failed) {
      return (
        <MechanicEmptyState
          icon={AlertCircle}
          title="Impossibile caricare il calendario"
          subtitle="Riprova tra poco"
          actionLabel="Riprova"
          onAction={reload}
        />
      );
    }

    return (
      <ScrollView contentContainerStyle={[styles.content, !isMobile && styles.contentWide]}>
        <View style={styles.summary}>
          {summary.map(({ label, value }) => (
            <View key={label} style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.text }]}>{value}</Text>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.columns, isDesktop && styles.columnsDesktop]}>
          {renderMonth()}
          {renderAgenda()}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <MechanicHeader
        title="Calendario Interventi"
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('NewAppointment')}
            accessibilityRole="button"
            accessibilityLabel="Nuovo intervento"
          >
            <Plus size={20} color={theme.onPrimary} strokeWidth={2} />
            {!isMobile && <Text style={[styles.addText, { color: theme.onPrimary }]}>Nuovo intervento</Text>}
          </TouchableOpacity>
        }
      />
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  contentWide: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    padding: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: MECHANIC_MIN_TOUCH,
    minHeight: MECHANIC_MIN_TOUCH,
    paddingHorizontal: 12,
    borderRadius: mechanicRadius.md,
  },
  addText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summary: {
    flexDirection: 'row',
    gap: 24,
  },
  summaryItem: {
    flexShrink: 1,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 14,
  },
  columns: {
    gap: 16,
  },
  columnsDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },
  card: {
    ...mechanicCard,
  },
  monthCard: {
    flex: 1,
    minWidth: 0,
    padding: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  monthTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
  },
  todayButton: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: mechanicRadius.sm,
  },
  todayText: {
    fontSize: 14,
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
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    height: 56,
    padding: 2,
  },
  cellDesktop: {
    height: 72,
  },
  cellInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: mechanicRadius.md,
  },
  cellText: {
    fontSize: 16,
    fontWeight: '600',
  },
  count: {
    minWidth: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  agenda: {
    gap: 12,
  },
  agendaDesktop: {
    width: 400,
  },
  agendaTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  agendaCount: {
    fontSize: 14,
  },
  emptyDay: {
    gap: 4,
  },
  nextLink: {
    minHeight: MECHANIC_MIN_TOUCH,
    justifyContent: 'center',
  },
  nextText: {
    fontSize: 14,
    fontWeight: '600',
  },
  item: {
    ...mechanicCard,
    flexDirection: 'row',
    gap: 12,
  },
  time: {
    width: 56,
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: mechanicRadius.full,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  plate: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  description: {
    fontSize: 14,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    flex: 1,
    fontSize: 14,
  },
});

export default MechanicCalendarScreen;

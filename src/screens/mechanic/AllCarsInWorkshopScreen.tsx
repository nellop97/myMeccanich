// src/screens/mechanic/AllCarsInWorkshopScreen.tsx
// Interventi aperti dell'officina, con le azioni per farli avanzare
import { useNavigation } from '@react-navigation/native';
import { AlertCircle, Calendar, Car, Phone, Plus, Search, User, Wrench } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store';
import { parseDayString } from '../../utils/calendarGrid';
import { showAlert } from '../../utils/platformHelpers';
import MechanicHeader from './MechanicHeader';
import { MechanicEmptyState } from './MechanicStates';
import { Intervention, getInterventionStatus, isOpenIntervention, useInterventions } from './interventions';
import {
  MECHANIC_MIN_TOUCH,
  mechanicCard,
  mechanicRadius,
  useMechanicBreakpoints,
  useMechanicTheme,
} from './mechanicTheme';

type Filter = 'all' | 'pending' | 'in_progress' | 'ready';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tutti' },
  { key: 'in_progress', label: 'In lavorazione' },
  { key: 'pending', label: 'Programmati' },
  { key: 'ready', label: 'Da ritirare' },
];

const formatSchedule = ({ repair }: Intervention) => {
  const date = parseDayString(repair.scheduledDate);
  if (!date) return 'Data da definire';
  const day = date.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
  return repair.scheduledTime ? `${day}, ${repair.scheduledTime}` : day;
};

const AllCarsInWorkshopScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useStore();
  const theme = useMechanicTheme();
  const { isDesktop } = useMechanicBreakpoints();
  const { interventions, loading, failed, reload, startWork, collect } = useInterventions(user?.id);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const openItems = useMemo(() => interventions.filter(isOpenIntervention), [interventions]);

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    return openItems
      .filter(({ status }) => filter === 'all' || status === filter)
      .filter(({ car }) =>
        !term ||
        [car.make, car.model, car.licensePlate, car.owner, car.vin]
          .some((value) => value?.toLowerCase().includes(term))
      )
      .sort((a, b) =>
        `${a.repair.scheduledDate}${a.repair.scheduledTime ?? ''}`
          .localeCompare(`${b.repair.scheduledDate}${b.repair.scheduledTime ?? ''}`)
      );
  }, [openItems, filter, search]);

  const run = async (item: Intervention, action: () => Promise<void>) => {
    try {
      setUpdatingId(item.repair.id);
      await action();
    } catch (error) {
      console.error('Errore aggiornamento intervento:', error);
      showAlert('Errore', "Impossibile aggiornare l'intervento. Riprova.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAdvance = (item: Intervention) => {
    const { car, repair, status } = item;

    if (status === 'pending') {
      run(item, () => startWork(item));
    } else if (status === 'in_progress') {
      navigation.navigate('CompleteIntervention', { carId: car.id, repairId: repair.id });
    } else {
      showAlert('Ritiro auto', `${car.make} ${car.model} è stata ritirata. Il cliente ha pagato?`, [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Da pagare', onPress: () => run(item, () => collect(item, false)) },
        { text: 'Pagato', onPress: () => run(item, () => collect(item, true)) },
      ]);
    }
  };

  const renderItem = ({ item }: { item: Intervention }) => {
    const { car, repair, status } = item;
    const statusStyle = getInterventionStatus(status, theme);
    const isUpdating = updatingId === repair.id;

    return (
      <View style={[styles.card, isDesktop && styles.cardDesktop, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.cardTop}>
          <View style={styles.cardTitle}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{car.make} {car.model}</Text>
            <Text style={[styles.plate, { color: theme.textSecondary }]}>
              {car.licensePlate}{car.year ? ` · ${car.year}` : ''}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusStyle.background }]}>
            <Text style={[styles.badgeText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
          </View>
        </View>

        <Text style={[styles.description, { color: theme.text }]} numberOfLines={3}>{repair.description}</Text>

        <View style={styles.details}>
          <View style={styles.detail}>
            <Calendar size={16} color={theme.textSecondary} strokeWidth={2} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>{formatSchedule(item)}</Text>
          </View>
          {car.owner ? (
            <View style={styles.detail}>
              <User size={16} color={theme.textSecondary} strokeWidth={2} />
              <Text style={[styles.detailText, { color: theme.textSecondary }]} numberOfLines={1}>{car.owner}</Text>
            </View>
          ) : null}
          {car.ownerPhone ? (
            <View style={styles.detail}>
              <Phone size={16} color={theme.textSecondary} strokeWidth={2} />
              <Text style={[styles.detailText, { color: theme.textSecondary }]}>{car.ownerPhone}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.action, { backgroundColor: theme.primary }]}
            onPress={() => handleAdvance(item)}
            disabled={isUpdating}
            accessibilityRole="button"
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color={theme.onPrimary} />
            ) : (
              <Text style={[styles.actionText, { color: theme.onPrimary }]}>
                {status === 'pending' ? 'Inizia lavori' : status === 'in_progress' ? 'Completa' : 'Segna ritirata'}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.action, styles.secondary, { borderColor: theme.border }]}
            onPress={() => navigation.navigate('RepairPartsManagement', { carId: car.id, repairId: repair.id })}
            accessibilityRole="button"
          >
            <Wrench size={16} color={theme.text} strokeWidth={2} />
            <Text style={[styles.actionText, { color: theme.text }]}>Gestisci</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
          title="Impossibile caricare gli interventi"
          subtitle="Riprova tra poco"
          actionLabel="Riprova"
          onAction={reload}
        />
      );
    }

    return (
      <FlatList
        data={visibleItems}
        key={isDesktop ? 'columns' : 'list'}
        numColumns={isDesktop ? 2 : 1}
        keyExtractor={({ car, repair }) => `${car.id}-${repair.id}`}
        renderItem={renderItem}
        columnWrapperStyle={isDesktop ? styles.row : undefined}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <MechanicEmptyState
            icon={Car}
            title={openItems.length === 0 ? 'Nessun intervento aperto' : 'Nessun risultato'}
            subtitle={
              openItems.length === 0
                ? 'Gli interventi compaiono qui quando confermi una prenotazione'
                : 'Prova a cambiare ricerca o filtro'
            }
          />
        }
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <MechanicHeader
        title="Interventi"
        subtitle={`${openItems.length} ${openItems.length === 1 ? 'aperto' : 'aperti'}`}
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('NewAppointment')}
            accessibilityRole="button"
            accessibilityLabel="Nuovo intervento"
          >
            <Plus size={20} color={theme.onPrimary} strokeWidth={2} />
          </TouchableOpacity>
        }
      />

      <View style={styles.tools}>
        <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Search size={20} color={theme.textSecondary} strokeWidth={2} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Cerca per targa, auto o cliente"
            placeholderTextColor={theme.placeholder}
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="Cerca interventi"
          />
        </View>
        <View style={styles.filters}>
          {FILTERS.map(({ key, label }) => {
            const selected = filter === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filter,
                  { backgroundColor: selected ? theme.primary : theme.surface, borderColor: selected ? theme.primary : theme.border },
                ]}
                onPress={() => setFilter(key)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.filterText, { color: selected ? theme.onPrimary : theme.text }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

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
  addButton: {
    width: MECHANIC_MIN_TOUCH,
    height: MECHANIC_MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mechanicRadius.md,
  },
  tools: {
    padding: 16,
    gap: 12,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: MECHANIC_MIN_TOUCH,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: mechanicRadius.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    minHeight: MECHANIC_MIN_TOUCH,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filter: {
    minHeight: MECHANIC_MIN_TOUCH,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: mechanicRadius.full,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
    flexGrow: 1,
  },
  row: {
    gap: 12,
  },
  card: {
    ...mechanicCard,
    gap: 10,
  },
  cardDesktop: {
    flex: 1,
    maxWidth: '50%',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
  plate: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
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
  description: {
    fontSize: 14,
  },
  details: {
    gap: 6,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: MECHANIC_MIN_TOUCH,
    borderRadius: mechanicRadius.md,
  },
  secondary: {
    borderWidth: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AllCarsInWorkshopScreen;

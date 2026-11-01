// src/screens/mechanic/PurchaseListScreen.tsx - Cosa comprare nei prossimi giorni, per fornitore
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AlertCircle, CheckCircle, Plus, RefreshCw } from 'lucide-react-native';
import { useInventory } from '../../hooks/useInventory';
import { useStore } from '../../store';
import {
  buildPurchaseList,
  frequentPartsNotInStock,
  PurchaseGroup,
  PurchaseLine,
} from '../../utils/inventoryStock';
import InventoryChip from './InventoryChip';
import { formatDay, formatQuantity, formatStock } from './inventoryFormat';
import MechanicHeader from './MechanicHeader';
import { MechanicEmptyState, MechanicLoadingState } from './MechanicStates';
import {
  MECHANIC_BREAKPOINTS,
  mechanicButton,
  mechanicButtonText,
  mechanicCard,
  mechanicSpacing,
  useMechanicBreakpoints,
  useMechanicTheme,
} from './mechanicTheme';

const HORIZONS = [3, 7, 14];
const DEFAULT_HORIZON = 7;
const SUMMARY_WIDTH = 300;

interface PurchaseLineCardProps {
  line: PurchaseLine;
  twoColumns: boolean;
  onPurchased: (line: PurchaseLine) => void;
  onCreate: (line: PurchaseLine) => void;
}

const PurchaseLineCard: React.FC<PurchaseLineCardProps> = ({ line, twoColumns, onPurchased, onCreate }) => {
  const theme = useMechanicTheme();
  const reasons = [
    line.shortage > 0 ? `Mancano ${formatStock(line.shortage, line.unit)} per le auto` : '',
    line.reorder > 0 ? `Riordino scorta: ${formatStock(line.reorder, line.unit)}` : '',
  ].filter(Boolean);

  return (
    <View style={[styles.lineCell, twoColumns && styles.lineCellHalf]}>
      <View style={[mechanicCard, styles.line, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.lineHeading}>
          <View style={styles.lineTitle}>
            <Text style={[styles.lineName, { color: theme.text }]}>{line.name}</Text>
            {line.partNumber ? (
              <Text style={[styles.lineMeta, { color: theme.textSecondary }]}>{line.partNumber}</Text>
            ) : null}
          </View>
          <Text style={[styles.lineQuantity, { color: theme.primary }]}>
            {formatStock(line.quantityToBuy, line.unit)}
          </Text>
        </View>

        {reasons.map((reason) => (
          <Text key={reason} style={[styles.lineReason, { color: theme.text }]}>
            {reason}
          </Text>
        ))}

        {line.cars.map((car) => (
          <Text key={car.repairId} style={[styles.lineMeta, { color: theme.textSecondary }]}>
            {car.licensePlate} · {car.make} {car.model} · {formatDay(car.scheduledDate)} ·{' '}
            {formatQuantity(car.quantity)} {line.unit}
          </Text>
        ))}

        {line.itemId ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Acquistato: ${line.name}`}
            onPress={() => onPurchased(line)}
            style={[mechanicButton.compact, styles.lineAction, { backgroundColor: theme.primary }]}
          >
            <Text style={[mechanicButtonText.compact, { color: theme.onPrimary }]}>Acquistato</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Crea scheda: ${line.name}`}
            onPress={() => onCreate(line)}
            style={[mechanicButton.compact, styles.lineAction, styles.outlined, { borderColor: theme.primary }]}
          >
            <Plus size={18} color={theme.primary} />
            <Text style={[mechanicButtonText.compact, { color: theme.primary }]}>Crea scheda</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const PurchaseListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = useMechanicTheme();
  const { width } = useMechanicBreakpoints();
  const { user } = useStore();
  const { items, cars, loading, error, reload } = useInventory(user?.id);
  const [horizon, setHorizon] = useState(DEFAULT_HORIZON);

  const groups = useMemo(
    () => buildPurchaseList(items, cars, horizon, new Date()),
    [items, cars, horizon]
  );
  const frequentParts = useMemo(() => frequentPartsNotInStock(cars, items), [cars, items]);

  const twoColumns = width >= MECHANIC_BREAKPOINTS.tablet;
  const hasSummary = width >= MECHANIC_BREAKPOINTS.desktop;

  const summary = useMemo(() => {
    const lines = groups.flatMap((group) => group.lines);
    const carIds = new Set(lines.flatMap((line) => line.cars.map((car) => car.carId)));
    return { lines: lines.length, suppliers: groups.length, cars: carIds.size };
  }, [groups]);

  const openPurchased = (line: PurchaseLine) =>
    navigation.navigate('InventoryItemDetail', {
      itemId: line.itemId,
      action: 'load',
      presetQuantity: line.quantityToBuy,
    });

  const openCreate = (line: PurchaseLine) =>
    navigation.navigate('InventoryItemForm', {
      name: line.name,
      partNumber: line.partNumber,
      brand: line.brand,
    });

  const header = (
    <MechanicHeader title="Da comprare" subtitle="Per fornitore" onBack={() => navigation.goBack()} />
  );

  const isFirstLoad = loading && items.length === 0 && cars.length === 0;

  // Con un errore la lista può essere incompleta: mai mostrare "Hai tutto il necessario"
  if (isFirstLoad || error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {header}
        {isFirstLoad ? (
          <MechanicLoadingState text="Calcolo la lista..." />
        ) : (
          <MechanicEmptyState
            icon={AlertCircle}
            title="Impossibile calcolare la lista"
            subtitle={error ?? undefined}
            actionLabel="Riprova"
            actionIcon={RefreshCw}
            onAction={reload}
          />
        )}
      </SafeAreaView>
    );
  }

  const renderGroup = ({ item: group }: { item: PurchaseGroup }) => (
    <View style={styles.group}>
      <Text style={[styles.sectionTitle, { color: theme.text }]} accessibilityRole="header">
        {group.supplier}
      </Text>
      <View style={styles.lines}>
        {group.lines.map((line) => (
          <PurchaseLineCard
            key={line.key}
            line={line}
            twoColumns={twoColumns}
            onPurchased={openPurchased}
            onCreate={openCreate}
          />
        ))}
      </View>
    </View>
  );

  const summaryCard = (
    <View
      style={[
        mechanicCard,
        styles.summary,
        hasSummary && styles.summarySide,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
      accessible
      accessibilityLabel={`Riepilogo a ${horizon} giorni: ${summary.lines} pezzi, ${summary.suppliers} fornitori, ${summary.cars} auto`}
    >
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Riepilogo a {horizon} giorni</Text>
      {[
        ['Pezzi da comprare', summary.lines],
        ['Fornitori', summary.suppliers],
        ['Auto coinvolte', summary.cars],
      ].map(([label, value]) => (
        <View key={label} style={styles.summaryRow}>
          <Text style={[styles.lineMeta, { color: theme.textSecondary }]}>{label}</Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>{value}</Text>
        </View>
      ))}
    </View>
  );

  const frequentSection =
    frequentParts.length > 0 ? (
      <View style={styles.group}>
        <Text style={[styles.sectionTitle, { color: theme.text }]} accessibilityRole="header">
          Usati spesso, non a magazzino
        </Text>
        <View style={styles.lines}>
          {frequentParts.map((part) => (
            <View key={part.key} style={[styles.lineCell, twoColumns && styles.lineCellHalf]}>
              <View style={[mechanicCard, styles.line, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.lineName, { color: theme.text }]}>{part.name}</Text>
                <Text style={[styles.lineMeta, { color: theme.textSecondary }]}>
                  {[part.partNumber, part.brand, `Usato ${part.uses} volte in 90 giorni`]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Crea scheda: ${part.name}`}
                  onPress={() =>
                    navigation.navigate('InventoryItemForm', {
                      name: part.name,
                      partNumber: part.partNumber,
                      brand: part.brand,
                    })
                  }
                  style={[mechanicButton.compact, styles.lineAction, styles.outlined, { borderColor: theme.primary }]}
                >
                  <Plus size={18} color={theme.primary} />
                  <Text style={[mechanicButtonText.compact, { color: theme.primary }]}>Crea scheda</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </View>
    ) : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {header}

      <View style={styles.horizons} accessibilityRole="radiogroup" accessibilityLabel="Orizzonte in giorni">
        {HORIZONS.map((days) => (
          <InventoryChip
            key={days}
            label={`${days} giorni`}
            selected={horizon === days}
            onPress={() => setHorizon(days)}
          />
        ))}
      </View>

      <View style={styles.body}>
        <FlatList
          style={styles.list}
          data={groups}
          keyExtractor={(group) => group.supplier}
          renderItem={renderGroup}
          ListHeaderComponent={!hasSummary && groups.length > 0 ? summaryCard : null}
          ListEmptyComponent={
            <MechanicEmptyState
              icon={CheckCircle}
              title="Hai tutto il necessario"
              subtitle={`Nessun pezzo da comprare per i prossimi ${horizon} giorni.`}
            />
          }
          ListFooterComponent={frequentSection}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={reload}
        />
        {hasSummary ? summaryCard : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  horizons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mechanicSpacing.sm,
    paddingHorizontal: mechanicSpacing.md,
    paddingTop: mechanicSpacing.md,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: mechanicSpacing.md,
    gap: mechanicSpacing.lg,
  },
  group: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  lines: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -mechanicSpacing.sm,
  },
  lineCell: {
    width: '100%',
    padding: mechanicSpacing.sm,
  },
  lineCellHalf: {
    width: '50%',
  },
  line: {
    flexGrow: 1,
    gap: mechanicSpacing.sm,
  },
  lineHeading: {
    flexDirection: 'row',
    gap: 12,
  },
  lineTitle: {
    flex: 1,
    minWidth: 0,
  },
  lineName: {
    fontSize: 16,
    fontWeight: '600',
  },
  lineMeta: {
    fontSize: 13,
  },
  lineQuantity: {
    fontSize: 16,
    fontWeight: '700',
  },
  lineReason: {
    fontSize: 14,
  },
  lineAction: {
    marginTop: 'auto',
  },
  outlined: {
    borderWidth: 1,
  },
  summary: {
    gap: mechanicSpacing.sm,
  },
  summarySide: {
    width: SUMMARY_WIDTH,
    alignSelf: 'flex-start',
    margin: mechanicSpacing.md,
    marginLeft: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default PurchaseListScreen;

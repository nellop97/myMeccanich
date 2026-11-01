// src/screens/mechanic/InventoryItemDetailScreen.tsx - Scheda di un pezzo, azioni di giacenza e movimenti
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import {
  AlertCircle,
  Archive,
  ChevronRight,
  ClipboardCheck,
  LucideIcon,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Undo2,
} from 'lucide-react-native';
import { useInventory } from '../../hooks/useInventory';
import InventoryService from '../../services/InventoryService';
import { useStore } from '../../store';
import {
  INVENTORY_CATEGORY_LABELS,
  InventoryMovement,
  InventoryUnit,
  PART_ORIGIN_LABELS,
} from '../../types/inventory.types';
import { formatCurrency } from '../../utils/formValidation';
import { confirmAction, showAlert } from '../../utils/platformHelpers';
import { formatSignedStock, formatStock, formatTimestamp, MOVEMENT_LABELS } from './inventoryFormat';
import { StockNumbers } from './InventoryItemCard';
import MechanicHeader from './MechanicHeader';
import { MechanicEmptyState, MechanicLoadingState } from './MechanicStates';
import {
  MECHANIC_BREAKPOINTS,
  MECHANIC_MIN_TOUCH,
  mechanicButton,
  mechanicButtonText,
  mechanicCard,
  mechanicRadius,
  mechanicSpacing,
  useMechanicBreakpoints,
  useMechanicTheme,
} from './mechanicTheme';
import StockActionDialog, { StockAction } from './StockActionDialog';

const MOVEMENTS_PAGE = 30;
const PHOTO_HEIGHT = 220;
const PHOTO_THUMBNAIL = 64;
const SIDE_COLUMN_WIDTH = 380;

interface ActionButtonProps {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ label, icon: Icon, onPress, color, disabled = false }) => {
  const theme = useMechanicTheme();
  const tint = disabled ? theme.textSecondary : color ?? theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        mechanicButton.compact,
        styles.actionButton,
        {
          borderColor: theme.border,
          backgroundColor: disabled ? theme.disabled : pressed ? theme.hover : theme.surface,
        },
      ]}
    >
      <Icon size={18} color={tint} />
      <Text style={[mechanicButtonText.compact, { color: tint }]}>{label}</Text>
    </Pressable>
  );
};

interface MovementRowProps {
  movement: InventoryMovement;
  unit: InventoryUnit;
  onOpenRepair: (carId: string, repairId: string) => void;
}

const MovementRow: React.FC<MovementRowProps> = ({ movement, unit, onOpenRepair }) => {
  const theme = useMechanicTheme();
  const { carId, repairId, licensePlate } = movement;
  const label = MOVEMENT_LABELS[movement.type];
  const quantity = formatSignedStock(movement.quantity, unit);
  const date = formatTimestamp(movement.createdAt);
  const canOpen = movement.type === 'consumption' && !!carId && !!repairId;

  const content = (
    <>
      <View style={styles.movementText}>
        <Text style={[styles.movementType, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.movementMeta, { color: theme.textSecondary }]}>
          {[date, licensePlate, movement.reason].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Text
        style={[styles.movementQuantity, { color: movement.quantity > 0 ? theme.success : theme.text }]}
      >
        {quantity}
      </Text>
      {canOpen ? <ChevronRight size={18} color={theme.textSecondary} /> : null}
    </>
  );

  if (canOpen) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} ${quantity}, ${licensePlate ?? 'auto'}, ${date}. Apri l'intervento`}
        onPress={() => onOpenRepair(carId as string, repairId as string)}
        style={({ pressed }) => [
          styles.movement,
          { borderTopColor: theme.border, backgroundColor: pressed ? theme.hover : 'transparent' },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View accessible style={[styles.movement, { borderTopColor: theme.border }]}>
      {content}
    </View>
  );
};

const InventoryItemDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const theme = useMechanicTheme();
  const { width } = useMechanicBreakpoints();
  const { user } = useStore();
  const { itemId, action: requestedAction, presetQuantity: requestedQuantity } = route.params;
  const { items, loading, error, reload } = useInventory(user?.id);

  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(true);
  const [movementsError, setMovementsError] = useState<string | null>(null);
  const [visibleMovements, setVisibleMovements] = useState(MOVEMENTS_PAGE);
  const [activeAction, setActiveAction] = useState<StockAction | null>(null);
  const [presetQuantity, setPresetQuantity] = useState<number | undefined>();
  const [notice, setNotice] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  const item = useMemo(() => items.find((entry) => entry.id === itemId), [items, itemId]);
  const isWide = width >= MECHANIC_BREAKPOINTS.desktop;
  // Un pezzo con matricola non può superare la giacenza di 1
  const canAddStock = !!item && (!item.serialNumber || item.quantityOnHand < 1);

  const loadMovements = useCallback(async () => {
    if (!user?.id) return;
    setMovementsLoading(true);
    setMovementsError(null);
    try {
      setMovements(await InventoryService.getItemMovements(user.id, itemId));
    } catch (loadError: any) {
      console.error('Errore caricamento movimenti:', loadError);
      setMovementsError(loadError?.message ?? 'Impossibile caricare i movimenti');
    } finally {
      setMovementsLoading(false);
    }
  }, [user?.id, itemId]);

  useFocusEffect(
    useCallback(() => {
      loadMovements();
    }, [loadMovements])
  );

  // Il carico richiesto da fuori si apre una volta sola, quando la scheda è disponibile
  useEffect(() => {
    if (requestedAction !== 'load' || !item) return;

    if (canAddStock) {
      setPresetQuantity(requestedQuantity);
      setActiveAction('load');
    } else {
      setNotice('Questo pezzo ha una matricola ed è già in magazzino: non si può caricare di nuovo.');
    }
    navigation.setParams({ action: undefined, presetQuantity: undefined });
  }, [requestedAction, requestedQuantity, item, canAddStock, navigation]);

  const openAction = (action: StockAction) => {
    setNotice(null);
    setPresetQuantity(undefined);
    setActiveAction(action);
  };

  const finishAction = (message: string) => {
    setActiveAction(null);
    setNotice(message);
    reload();
    loadMovements();
  };

  const archive = () => {
    if (!item) return;
    const committedNote =
      item.committed > 0
        ? ` ${formatStock(item.committed, item.unit)} risultano impegnati su interventi aperti.`
        : '';

    confirmAction(
      'Archivia pezzo',
      `${item.name} non comparirà più in magazzino. I movimenti restano registrati.${committedNote}`,
      'Archivia',
      async () => {
        setArchiving(true);
        try {
          await InventoryService.archiveItem(item.id);
          navigation.goBack();
        } catch (archiveError: any) {
          console.error('Errore archiviazione pezzo:', archiveError);
          setArchiving(false);
          showAlert('Archiviazione non riuscita', archiveError?.message ?? 'Riprova tra poco.');
        }
      }
    );
  };

  const header = (
    <MechanicHeader title={item?.name ?? 'Pezzo'} subtitle={item?.partNumber} onBack={() => navigation.goBack()} />
  );

  if (!item) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {header}
        {loading ? (
          <MechanicLoadingState text="Caricamento scheda..." />
        ) : (
          <MechanicEmptyState
            icon={error ? AlertCircle : Package}
            title={error ? 'Impossibile caricare la scheda' : 'Pezzo non trovato'}
            subtitle={error ?? 'La scheda potrebbe essere stata archiviata.'}
            actionLabel={error ? 'Riprova' : undefined}
            actionIcon={RefreshCw}
            onAction={error ? reload : undefined}
          />
        )}
      </SafeAreaView>
    );
  }

  const dataRows: [string, string][] = (
    [
      ['Categoria', INVENTORY_CATEGORY_LABELS[item.category]],
      ['Codice', item.partNumber],
      ['Marca', item.brand],
      ['Provenienza', PART_ORIGIN_LABELS[item.origin]],
      ['Matricola', item.serialNumber ?? ''],
      ['Fornitore', item.supplier],
      ['Posizione', item.location],
      ['Scorta minima', formatStock(item.minStock, item.unit)],
      ['Costo d\'acquisto', formatCurrency(item.purchaseCost)],
      ['Prezzo di vendita', formatCurrency(item.salePrice)],
    ] as [string, string][]
  ).filter(([, value]) => !!value);

  const cardStyle = [mechanicCard, styles.card, { backgroundColor: theme.surface, borderColor: theme.border }];
  const photos = item.photoUrls ?? [];

  const dataColumn = (
    <View style={[styles.column, isWide && styles.sideColumn]}>
      {photos.length > 0 ? (
        <View style={cardStyle}>
          <Image
            source={{ uri: photos[0] }}
            style={styles.photo}
            resizeMode="contain"
            accessibilityLabel={`Foto di ${item.name}`}
          />
          {photos.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnails}>
              {photos.slice(1).map((uri, index) => (
                <Image
                  key={uri}
                  source={{ uri }}
                  style={styles.thumbnail}
                  accessibilityLabel={`Foto ${index + 2} di ${item.name}`}
                />
              ))}
            </ScrollView>
          ) : null}
        </View>
      ) : null}

      <View style={cardStyle}>
        <Text style={[styles.sectionTitle, { color: theme.text }]} accessibilityRole="header">
          Dati
        </Text>
        {dataRows.map(([label, value]) => (
          <View key={label} style={styles.dataRow} accessible accessibilityLabel={`${label}: ${value}`}>
            <Text style={[styles.dataLabel, { color: theme.textSecondary }]}>{label}</Text>
            <Text style={[styles.dataValue, { color: theme.text }]}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const stockColumn = (
    <View style={[styles.column, isWide && styles.mainColumn]}>
      <View style={cardStyle}>
        <StockNumbers
          onHand={item.quantityOnHand}
          committed={item.committed}
          available={item.available}
          unit={item.unit}
        />
        {error ? (
          <Text style={[styles.warningText, { color: theme.error }]}>
            Impegnati e liberi potrebbero non essere aggiornati.
          </Text>
        ) : null}
        {notice ? (
          <Text
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[styles.notice, { color: theme.success }]}
          >
            {notice}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <ActionButton
            label="Carico"
            icon={Plus}
            color={theme.primary}
            disabled={!canAddStock}
            onPress={() => openAction('load')}
          />
          <ActionButton label="Rettifica" icon={ClipboardCheck} onPress={() => openAction('adjust')} />
          <ActionButton label="Reso" icon={Undo2} disabled={!canAddStock} onPress={() => openAction('return')} />
          <ActionButton
            label="Modifica"
            icon={Pencil}
            onPress={() => navigation.navigate('InventoryItemForm', { itemId: item.id })}
          />
          <ActionButton
            label="Archivia"
            icon={Archive}
            color={theme.error}
            disabled={archiving}
            onPress={archive}
          />
        </View>
      </View>

      <View style={cardStyle}>
        <Text style={[styles.sectionTitle, { color: theme.text }]} accessibilityRole="header">
          Movimenti
        </Text>
        {movementsLoading && movements.length === 0 ? (
          <MechanicLoadingState text="Caricamento movimenti..." />
        ) : movementsError ? (
          <MechanicEmptyState
            icon={AlertCircle}
            title="Impossibile caricare i movimenti"
            subtitle={movementsError}
            actionLabel="Riprova"
            actionIcon={RefreshCw}
            onAction={loadMovements}
          />
        ) : movements.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Nessun movimento registrato.</Text>
        ) : (
          movements.slice(0, visibleMovements).map((movement) => (
            <MovementRow
              key={movement.id}
              movement={movement}
              unit={item.unit}
              onOpenRepair={(carId, repairId) =>
                navigation.navigate('RepairPartsManagement', { carId, repairId })
              }
            />
          ))
        )}
        {!movementsError && movements.length > visibleMovements ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mostra altri movimenti"
            onPress={() => setVisibleMovements((count) => count + MOVEMENTS_PAGE)}
            style={mechanicButton.compact}
          >
            <Text style={[mechanicButtonText.compact, { color: theme.primary }]}>Mostra altri</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {header}
      <ScrollView contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]}>
        {isWide ? (
          <>
            {dataColumn}
            {stockColumn}
          </>
        ) : (
          <>
            {stockColumn}
            {dataColumn}
          </>
        )}
      </ScrollView>

      {user?.id ? (
        <StockActionDialog
          action={activeAction}
          item={item}
          userId={user.id}
          presetQuantity={presetQuantity}
          onClose={() => setActiveAction(null)}
          onDone={finishAction}
        />
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: mechanicSpacing.md,
    gap: mechanicSpacing.md,
  },
  scrollWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    gap: mechanicSpacing.md,
  },
  sideColumn: {
    width: SIDE_COLUMN_WIDTH,
  },
  mainColumn: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    gap: 12,
  },
  photo: {
    width: '100%',
    height: PHOTO_HEIGHT,
    borderRadius: mechanicRadius.md,
  },
  thumbnails: {
    gap: mechanicSpacing.sm,
  },
  thumbnail: {
    width: PHOTO_THUMBNAIL,
    height: PHOTO_THUMBNAIL,
    borderRadius: mechanicRadius.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: mechanicSpacing.md,
  },
  dataLabel: {
    fontSize: 14,
  },
  dataValue: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  warningText: {
    fontSize: 13,
  },
  notice: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mechanicSpacing.sm,
  },
  actionButton: {
    flexGrow: 1,
    borderWidth: 1,
  },
  movement: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MECHANIC_MIN_TOUCH,
    gap: mechanicSpacing.sm,
    paddingVertical: mechanicSpacing.sm,
    borderTopWidth: 1,
  },
  movementText: {
    flex: 1,
    minWidth: 0,
  },
  movementType: {
    fontSize: 14,
    fontWeight: '600',
  },
  movementMeta: {
    fontSize: 13,
  },
  movementQuantity: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
  },
});

export default InventoryItemDetailScreen;

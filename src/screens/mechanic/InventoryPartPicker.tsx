// src/screens/mechanic/InventoryPartPicker.tsx - Scelta di un pezzo di magazzino per un intervento
import { AlertCircle, AlertTriangle, ArrowLeft, Package, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { RepairPart, WorkshopCar } from '../../store/workshopStore';
import { InventoryCategory, PART_ORIGIN_LABELS, PartOrigin } from '../../types/inventory.types';
import { getPartTotal, parseAmount } from '../../utils/interventionTotals';
import { InventoryItemWithStock, isStockPart, roundQuantity, suggestPartsForRepair } from '../../utils/inventoryStock';
import { showAlert } from '../../utils/platformHelpers';
import { MechanicEmptyState, MechanicLoadingState } from './MechanicStates';
import MechanicTextInput from './MechanicTextInput';
import {
  MECHANIC_MIN_TOUCH,
  mechanicButton,
  mechanicButtonText,
  mechanicRadius,
  mechanicSpacing,
  useMechanicBreakpoints,
  useMechanicTheme,
} from './mechanicTheme';

const MAX_SUGGESTIONS = 5;

export const ORIGIN_OPTIONS = (Object.keys(PART_ORIGIN_LABELS) as PartOrigin[]).map((value) => ({
  value,
  label: PART_ORIGIN_LABELS[value],
}));

export const newPartId = () => `part_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const formatQuantity = (quantity: number) => quantity.toLocaleString('it-IT');

export const toPartCategory = (category?: InventoryCategory | null): RepairPart['category'] => {
  if (category === 'fluidi') return 'fluido';
  if (category === 'consumabili') return 'consumabile';
  return 'ricambio';
};

interface ChoiceChipsProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value?: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

export const ChoiceChips = <T extends string>({ label, options, value, onChange, disabled = false }: ChoiceChipsProps<T>) => {
  const theme = useMechanicTheme();

  return (
    <View style={styles.chipGroup} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text style={[styles.chipLabel, { color: theme.textSecondary }]}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.chip,
                { borderColor: selected ? theme.primary : theme.border },
                selected && { backgroundColor: theme.primary },
              ]}
              onPress={() => onChange(option.value)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
              accessibilityLabel={option.label}
            >
              <Text style={[styles.chipText, { color: selected ? theme.onPrimary : theme.text }]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// La riga finisce su workshopCars, leggibile dal cliente: niente costo d'acquisto né fornitore
const toRepairPart = (item: InventoryItemWithStock, quantity: number): RepairPart => {
  const unitPrice = item.salePrice ?? 0;

  return {
    id: newPartId(),
    inventoryItemId: item.id,
    source: 'stock',
    name: item.name,
    brand: item.brand ?? '',
    partNumber: item.partNumber ?? '',
    category: toPartCategory(item.category),
    quantity,
    unitPrice,
    unitCost: unitPrice,
    totalPrice: getPartTotal({ name: item.name, quantity, unitPrice }),
    ...(item.origin ? { origin: item.origin } : {}),
    ...(item.serialNumber ? { serialNumber: item.serialNumber } : {}),
  };
};

const normalize = (text?: string) => (text ?? '').trim().toLowerCase();

interface PickerRow {
  item: InventoryItemWithStock;
  quantity: number;
}

interface InventoryPartPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (part: RepairPart) => void | Promise<void>;
  items: InventoryItemWithStock[];
  cars: WorkshopCar[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  description: string;
  make: string;
  model: string;
  /** Righe aggiunte ma non ancora salvate: l'impegnato di useInventory non le conosce */
  pendingParts?: RepairPart[];
}

const InventoryPartPicker: React.FC<InventoryPartPickerProps> = ({
  visible,
  onClose,
  onSelect,
  items,
  cars,
  loading,
  error,
  onRetry,
  description,
  make,
  model,
  pendingParts,
}) => {
  const theme = useMechanicTheme();
  const { isDesktop } = useMechanicBreakpoints();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<InventoryItemWithStock | null>(null);
  const [quantityText, setQuantityText] = useState('1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setSearch('');
      setSelected(null);
    }
  }, [visible]);

  const freeOf = useMemo(() => {
    const pending = new Map<string, number>();
    (pendingParts ?? []).filter(isStockPart).forEach((part) => {
      const itemId = part.inventoryItemId as string;
      pending.set(itemId, (pending.get(itemId) ?? 0) + part.quantity);
    });
    return (item: InventoryItemWithStock) => roundQuantity(item.available - (pending.get(item.id) ?? 0));
  }, [pendingParts]);

  const sections = useMemo(() => {
    const term = normalize(search);
    if (term) {
      const matches = items.filter((item) =>
        [item.name, item.partNumber, item.brand].some((field) => normalize(field).includes(term))
      );
      return [{ key: 'found', title: 'Magazzino', data: matches.map((item) => ({ item, quantity: 1 })) }];
    }

    // Un suggerimento senza scheda non ha giacenza né prezzo: resta all'inserimento manuale
    const suggested: PickerRow[] = suggestPartsForRepair(description, make, model, cars)
      .flatMap((suggestion) => {
        const item = items.find(
          ({ id, partNumber, name }) =>
            id === suggestion.inventoryItemId ||
            (!!suggestion.partNumber && normalize(partNumber) === normalize(suggestion.partNumber)) ||
            (!suggestion.partNumber && normalize(name) === normalize(suggestion.name))
        );
        return item ? [{ item, quantity: suggestion.averageQuantity || 1 }] : [];
      })
      .slice(0, MAX_SUGGESTIONS);

    return [
      ...(suggested.length ? [{ key: 'suggested', title: 'Suggeriti per questo lavoro', data: suggested }] : []),
      { key: 'all', title: 'Magazzino', data: items.map((item) => ({ item, quantity: 1 })) },
    ];
  }, [search, items, cars, description, make, model]);

  const choose = ({ item, quantity }: PickerRow) => {
    setSelected(item);
    setQuantityText(String(quantity).replace('.', ','));
  };

  const quantity = parseAmount(quantityText);
  const free = selected ? freeOf(selected) : 0;
  const exceedsFree = !!quantity && quantity > free;

  const confirm = async () => {
    if (!selected || saving) return;
    if (!quantity) {
      showAlert('Quantità mancante', 'Inserisci una quantità maggiore di zero.');
      return;
    }

    setSaving(true);
    try {
      await onSelect(toRepairPart(selected, quantity));
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item: row }: { item: PickerRow }) => {
    const { item } = row;
    const details = [item.brand, item.partNumber].filter(Boolean).join(' · ');
    const itemFree = freeOf(item);

    return (
      <Pressable
        onPress={() => choose(row)}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, liberi ${formatQuantity(itemFree)} ${item.unit}`}
        style={({ pressed, hovered }: any) => [
          styles.row,
          { borderColor: theme.border },
          (pressed || hovered) && { backgroundColor: theme.hover },
        ]}
      >
        <View style={styles.rowBody}>
          <Text style={[styles.rowName, { color: theme.text }]} numberOfLines={2}>{item.name}</Text>
          {!!details && <Text style={[styles.small, { color: theme.textSecondary }]} numberOfLines={1}>{details}</Text>}
        </View>
        <View style={styles.rowStock}>
          <Text style={[styles.rowName, { color: itemFree > 0 ? theme.success : theme.error }]}>
            {formatQuantity(itemFree)} {item.unit}
          </Text>
          <Text style={[styles.small, { color: theme.textSecondary }]}>Liberi</Text>
        </View>
      </Pressable>
    );
  };

  const renderList = () => {
    if (!items.length && loading) {
      return <MechanicLoadingState text="Caricamento magazzino..." />;
    }
    if (!items.length && error) {
      return (
        <MechanicEmptyState
          icon={AlertCircle}
          title="Impossibile caricare il magazzino"
          subtitle="Controlla la connessione e riprova."
          actionLabel="Riprova"
          onAction={onRetry}
        />
      );
    }

    return (
      <SectionList
        sections={sections}
        keyExtractor={(row, index) => `${row.item.id}_${index}`}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text
            style={[styles.sectionTitle, { color: theme.textSecondary, backgroundColor: theme.surface }]}
            accessibilityRole="header"
          >
            {section.title}
          </Text>
        )}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={15}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 ? (
            <Text style={[styles.empty, { color: theme.textSecondary }]}>
              {search.trim() ? 'Nessun pezzo trovato.' : 'Il magazzino è vuoto.'}
            </Text>
          ) : null
        }
      />
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }, isDesktop && styles.overlayDesktop]}>
        <View style={[styles.panel, { backgroundColor: theme.surface }, isDesktop && styles.panelDesktop]}>
          <View style={styles.header}>
            {selected && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setSelected(null)}
                accessibilityRole="button"
                accessibilityLabel="Torna all'elenco"
              >
                <ArrowLeft size={22} color={theme.text} />
              </TouchableOpacity>
            )}
            <Text style={[styles.title, { color: theme.text }]} accessibilityRole="header">
              Dal magazzino
            </Text>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Chiudi"
            >
              <X size={22} color={theme.text} />
            </TouchableOpacity>
          </View>

          {selected ? (
            <View style={styles.detail}>
              <View style={styles.detailTitle}>
                <Package size={20} color={theme.primary} />
                <Text style={[styles.rowName, styles.flex, { color: theme.text }]}>{selected.name}</Text>
              </View>
              <Text style={[styles.small, { color: theme.textSecondary }]}>
                {[selected.brand, selected.partNumber, PART_ORIGIN_LABELS[selected.origin]].filter(Boolean).join(' · ')}
              </Text>
              <Text style={[styles.small, { color: theme.textSecondary }]}>
                Liberi: {formatQuantity(free)} {selected.unit} · Prezzo di vendita: €{(selected.salePrice ?? 0).toFixed(2)}
              </Text>

              <Text style={[styles.chipLabel, { color: theme.textSecondary }]}>Quantità ({selected.unit})</Text>
              <MechanicTextInput
                value={quantityText}
                onChangeText={setQuantityText}
                keyboardType="decimal-pad"
                accessibilityLabel="Quantità"
                autoFocus
              />

              {exceedsFree && (
                <View
                  style={[styles.warning, { backgroundColor: theme.warningLight }]}
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                >
                  <AlertTriangle size={18} color={theme.warning} />
                  <Text style={[styles.small, styles.flex, { color: theme.text }]}>
                    Superi i Liberi ({formatQuantity(free)} {selected.unit}). Puoi aggiungerlo comunque: la parte mancante finisce in Da comprare.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[mechanicButton.primary, { backgroundColor: theme.primary }, saving && styles.disabled]}
                onPress={confirm}
                disabled={saving}
                accessibilityRole="button"
                accessibilityState={{ disabled: saving, busy: saving }}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={theme.onPrimary} />
                ) : (
                  <Text style={[mechanicButtonText.primary, { color: theme.onPrimary }]}>{"Aggiungi all'intervento"}</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.searchBox}>
                <MechanicTextInput
                  variant="search"
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Cerca per nome, codice o marca"
                  accessibilityLabel="Cerca nel magazzino"
                  autoCorrect={false}
                />
                {!!error && items.length > 0 && (
                  <Text style={[styles.small, { color: theme.warning }]} accessibilityRole="alert">
                    I Liberi potrebbero non essere aggiornati.
                  </Text>
                )}
              </View>
              <View style={styles.flex}>{renderList()}</View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingTop: 48,
  },
  overlayDesktop: {
    paddingTop: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panel: {
    flex: 1,
    borderTopLeftRadius: mechanicRadius.xl,
    borderTopRightRadius: mechanicRadius.xl,
    paddingBottom: mechanicSpacing.lg,
  },
  panelDesktop: {
    flex: 0,
    width: '100%',
    maxWidth: 560,
    height: '85%',
    borderRadius: mechanicRadius.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mechanicSpacing.sm,
    paddingHorizontal: mechanicSpacing.md,
    paddingVertical: mechanicSpacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  iconButton: {
    width: MECHANIC_MIN_TOUCH,
    height: MECHANIC_MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    paddingHorizontal: mechanicSpacing.md,
    paddingBottom: mechanicSpacing.sm,
    gap: mechanicSpacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: mechanicSpacing.md,
    paddingVertical: mechanicSpacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: MECHANIC_MIN_TOUCH + 12,
    paddingHorizontal: mechanicSpacing.md,
    paddingVertical: mechanicSpacing.sm,
    borderBottomWidth: 1,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowStock: {
    alignItems: 'flex-end',
  },
  rowName: {
    fontSize: 16,
    fontWeight: '600',
  },
  small: {
    fontSize: 14,
  },
  empty: {
    fontSize: 14,
    paddingHorizontal: mechanicSpacing.md,
    paddingVertical: 12,
  },
  detail: {
    gap: 12,
    paddingHorizontal: mechanicSpacing.md,
  },
  detailTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mechanicSpacing.sm,
  },
  warning: {
    flexDirection: 'row',
    gap: mechanicSpacing.sm,
    padding: 12,
    borderRadius: mechanicRadius.md,
  },
  disabled: {
    opacity: 0.6,
  },
  flex: {
    flex: 1,
  },
  chipGroup: {
    gap: 6,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mechanicSpacing.sm,
  },
  chip: {
    minHeight: MECHANIC_MIN_TOUCH,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: mechanicRadius.md,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default InventoryPartPicker;

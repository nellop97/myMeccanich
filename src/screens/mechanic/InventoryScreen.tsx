// src/screens/mechanic/InventoryScreen.tsx - Elenco dei pezzi di magazzino dell'officina
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AlertCircle, Package, Plus, RefreshCw, SearchX, ShoppingCart } from 'lucide-react-native';
import { useInventory } from '../../hooks/useInventory';
import { useStore } from '../../store';
import { INVENTORY_CATEGORY_LABELS, InventoryCategory } from '../../types/inventory.types';
import type { InventoryItemWithStock } from '../../utils/inventoryStock';
import InventoryChip from './InventoryChip';
import InventoryItemCard from './InventoryItemCard';
import MechanicHeader from './MechanicHeader';
import { AiComingSoonButton } from '../../components/AiComingSoonButton';
import { MechanicEmptyState, MechanicLoadingState } from './MechanicStates';
import MechanicTextInput from './MechanicTextInput';
import {
  MECHANIC_BREAKPOINTS,
  mechanicButton,
  mechanicButtonText,
  mechanicSpacing,
  useMechanicBreakpoints,
  useMechanicTheme,
} from './mechanicTheme';

type InventoryFilter = 'all' | 'low' | InventoryCategory;

const FILTERS: { id: InventoryFilter; label: string }[] = [
  { id: 'all', label: 'Tutti' },
  { id: 'low', label: 'Sotto scorta' },
  ...(Object.entries(INVENTORY_CATEGORY_LABELS) as [InventoryCategory, string][]).map(([id, label]) => ({
    id,
    label,
  })),
];

const matchesFilter = (item: InventoryItemWithStock, filter: InventoryFilter) => {
  if (filter === 'all') return true;
  if (filter === 'low') return item.available < item.minStock;
  return item.category === filter;
};

const matchesSearch = (item: InventoryItemWithStock, text: string) =>
  [item.name, item.partNumber, item.brand, item.serialNumber].some((field) =>
    field?.toLowerCase().includes(text)
  );

const InventoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = useMechanicTheme();
  const { width } = useMechanicBreakpoints();
  const { user } = useStore();
  const { items, loading, error, reload } = useInventory(user?.id);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<InventoryFilter>('all');

  // Larghezza diretta: su tablet nativo isDesktop è falso anche oltre i 1024
  const numColumns =
    width >= MECHANIC_BREAKPOINTS.desktop ? 3 : width >= MECHANIC_BREAKPOINTS.tablet ? 2 : 1;

  const visibleItems = useMemo(() => {
    const text = search.trim().toLowerCase();
    return items.filter((item) => matchesFilter(item, filter) && (!text || matchesSearch(item, text)));
  }, [items, filter, search]);

  const openItem = useCallback(
    (itemId: string) => navigation.navigate('InventoryItemDetail', { itemId }),
    [navigation]
  );
  const loadItem = useCallback(
    (itemId: string) => navigation.navigate('InventoryItemDetail', { itemId, action: 'load' }),
    [navigation]
  );
  const createItem = () => navigation.navigate('InventoryItemForm');

  const renderItem = useCallback(
    ({ item }: { item: InventoryItemWithStock }) => (
      <View style={[styles.cell, { width: `${100 / numColumns}%` }]}>
        <InventoryItemCard item={item} onOpen={openItem} onLoad={loadItem} />
      </View>
    ),
    [numColumns, openItem, loadItem]
  );

  const header = (
    <MechanicHeader
      title="Magazzino"
      subtitle={`${items.length} ${items.length === 1 ? 'pezzo' : 'pezzi'}`}
      onBack={() => navigation.goBack()}
      right={
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Da comprare"
            onPress={() => navigation.navigate('PurchaseList')}
            style={[mechanicButton.compact, styles.headerButton, { borderColor: theme.border }]}
          >
            <ShoppingCart size={18} color={theme.text} />
            {width >= MECHANIC_BREAKPOINTS.tablet ? (
              <Text style={[mechanicButtonText.compact, { color: theme.text }]}>Da comprare</Text>
            ) : null}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nuovo pezzo"
            onPress={createItem}
            style={[mechanicButton.compact, { backgroundColor: theme.primary }]}
          >
            <Plus size={18} color={theme.onPrimary} />
            {width >= MECHANIC_BREAKPOINTS.tablet ? (
              <Text style={[mechanicButtonText.compact, { color: theme.onPrimary }]}>Nuovo pezzo</Text>
            ) : null}
          </Pressable>
        </View>
      }
    />
  );

  const isFirstLoad = loading && items.length === 0;

  if (isFirstLoad || (error && items.length === 0)) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {header}
        {isFirstLoad ? (
          <MechanicLoadingState text="Caricamento magazzino..." />
        ) : (
          <MechanicEmptyState
            icon={AlertCircle}
            title="Impossibile caricare il magazzino"
            subtitle={error ?? undefined}
            actionLabel="Riprova"
            actionIcon={RefreshCw}
            onAction={reload}
          />
        )}
      </SafeAreaView>
    );
  }

  const listEmpty =
    items.length === 0 ? (
      <MechanicEmptyState
        icon={Package}
        title="Il magazzino è vuoto"
        subtitle="Aggiungi il primo pezzo per tenere sotto controllo le giacenze."
        actionLabel="Nuovo pezzo"
        actionIcon={Plus}
        onAction={createItem}
      />
    ) : (
      <MechanicEmptyState
        icon={SearchX}
        title="Nessun pezzo trovato"
        subtitle="Prova a cambiare la ricerca o il filtro."
        actionLabel="Azzera filtri"
        onAction={() => {
          setSearch('');
          setFilter('all');
        }}
      />
    );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {header}

      {error ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dati non aggiornati, tocca per riprovare"
          onPress={reload}
          style={[styles.banner, { backgroundColor: theme.errorLight }]}
        >
          <AlertCircle size={18} color={theme.isDark ? theme.text : theme.error} />
          <Text style={[styles.bannerText, { color: theme.text }]}>
            Impegnati e liberi potrebbero non essere aggiornati. Tocca per riprovare.
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.filters}>
        <AiComingSoonButton feature="supplierDocument" />
        <MechanicTextInput
          variant="search"
          value={search}
          onChangeText={setSearch}
          placeholder="Cerca per nome, codice, marca o matricola"
          accessibilityLabel="Cerca nel magazzino"
          autoCorrect={false}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          accessibilityRole="radiogroup"
          accessibilityLabel="Filtra i pezzi"
          contentContainerStyle={styles.chips}
        >
          {FILTERS.map(({ id, label }) => (
            <InventoryChip key={id} label={label} selected={filter === id} onPress={() => setFilter(id)} />
          ))}
        </ScrollView>
      </View>

      <FlatList
        key={`inventory-${numColumns}`}
        data={visibleItems}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={reload}
        initialNumToRender={12}
        windowSize={7}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: mechanicSpacing.sm,
  },
  headerButton: {
    borderWidth: 1,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    gap: mechanicSpacing.sm,
    paddingHorizontal: mechanicSpacing.md,
    paddingVertical: mechanicSpacing.sm,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
  },
  filters: {
    paddingHorizontal: mechanicSpacing.md,
    paddingTop: mechanicSpacing.md,
    gap: 12,
  },
  chips: {
    gap: mechanicSpacing.sm,
    paddingBottom: mechanicSpacing.xs,
  },
  list: {
    flexGrow: 1,
    padding: mechanicSpacing.sm,
  },
  // Niente flex: 1, in una lista ad altezza automatica la card collasserebbe
  cell: {
    padding: mechanicSpacing.sm,
  },
});

export default InventoryScreen;

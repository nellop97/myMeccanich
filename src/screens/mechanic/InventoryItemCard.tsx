// src/screens/mechanic/InventoryItemCard.tsx - Card di un pezzo e i suoi tre numeri di giacenza
import React, { memo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Package, Plus } from 'lucide-react-native';
import { INVENTORY_CATEGORY_LABELS, InventoryUnit } from '../../types/inventory.types';
import type { InventoryItemWithStock } from '../../utils/inventoryStock';
import { formatQuantity, formatStock } from './inventoryFormat';
import {
  mechanicButton,
  mechanicButtonText,
  mechanicCard,
  mechanicRadius,
  mechanicSpacing,
  useMechanicTheme,
} from './mechanicTheme';

const THUMBNAIL_SIZE = 56;

interface StockNumbersProps {
  onHand: number;
  committed: number;
  available: number;
  unit: InventoryUnit;
}

export const StockNumbers: React.FC<StockNumbersProps> = ({ onHand, committed, available, unit }) => {
  const theme = useMechanicTheme();
  const numbers = [
    { label: 'Giacenza', value: onHand, color: theme.text },
    { label: 'Impegnati', value: committed, color: theme.text },
    { label: 'Liberi', value: available, color: available < 0 ? theme.error : theme.success },
  ];

  return (
    <View
      style={styles.numbers}
      accessible
      accessibilityLabel={numbers.map(({ label, value }) => `${label} ${formatStock(value, unit)}`).join(', ')}
    >
      {numbers.map(({ label, value, color }) => (
        <View key={label} style={[styles.number, { backgroundColor: theme.surfaceVariant }]}>
          <Text style={[styles.numberValue, { color }]} numberOfLines={1}>
            {formatQuantity(value)}
            <Text style={[styles.numberUnit, { color: theme.textSecondary }]}> {unit}</Text>
          </Text>
          <Text style={[styles.numberLabel, { color: theme.textSecondary }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
};

interface InventoryItemCardProps {
  item: InventoryItemWithStock;
  onOpen: (itemId: string) => void;
  onLoad: (itemId: string) => void;
}

const InventoryItemCard: React.FC<InventoryItemCardProps> = ({ item, onOpen, onLoad }) => {
  const theme = useMechanicTheme();
  const [hovered, setHovered] = useState(false);
  const photo = item.photoUrls?.[0];
  const isLow = item.available < item.minStock;
  // Un pezzo con matricola è unico: finché è in magazzino non se ne carica un altro
  const canLoad = !item.serialNumber || item.quantityOnHand < 1;
  const details = [item.partNumber, item.brand].filter(Boolean).join(' · ');

  return (
    <View
      style={[
        mechanicCard,
        styles.card,
        { backgroundColor: theme.surface, borderColor: hovered ? theme.primary : theme.border },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Apri ${item.name}`}
        onPress={() => onOpen(item.id)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={styles.main}
      >
        <View style={styles.heading}>
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={styles.thumbnail}
              accessibilityLabel={`Foto di ${item.name}`}
            />
          ) : (
            <View style={[styles.thumbnail, styles.placeholder, { backgroundColor: theme.surfaceVariant }]}>
              <Package size={24} color={theme.textSecondary} />
            </View>
          )}
          <View style={styles.title}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={[styles.details, { color: theme.textSecondary }]} numberOfLines={1}>
              {details || INVENTORY_CATEGORY_LABELS[item.category]}
            </Text>
            {isLow ? (
              <View style={[styles.badge, { backgroundColor: theme.warningLight }]}>
                <Text style={[styles.badgeText, { color: theme.isDark ? theme.text : theme.warning }]}>
                  Sotto scorta
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <StockNumbers
          onHand={item.quantityOnHand}
          committed={item.committed}
          available={item.available}
          unit={item.unit}
        />
      </Pressable>

      {canLoad ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Carico di ${item.name}`}
          onPress={() => onLoad(item.id)}
          style={({ pressed }) => [
            mechanicButton.compact,
            styles.load,
            { borderColor: theme.primary, backgroundColor: pressed ? theme.primaryLight : 'transparent' },
          ]}
        >
          <Plus size={18} color={theme.primary} />
          <Text style={[mechanicButtonText.compact, { color: theme.primary }]}>Carico</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    gap: mechanicSpacing.sm,
  },
  main: {
    flexGrow: 1,
    gap: 12,
  },
  heading: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: mechanicRadius.md,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  details: {
    fontSize: 13,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: mechanicSpacing.xs,
    paddingHorizontal: mechanicSpacing.sm,
    paddingVertical: 2,
    borderRadius: mechanicRadius.sm,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  numbers: {
    flexDirection: 'row',
    gap: mechanicSpacing.sm,
  },
  number: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingVertical: mechanicSpacing.sm,
    paddingHorizontal: mechanicSpacing.xs,
    borderRadius: mechanicRadius.md,
  },
  numberValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  numberUnit: {
    fontSize: 12,
    fontWeight: '400',
  },
  numberLabel: {
    fontSize: 12,
  },
  load: {
    borderWidth: 1,
  },
});

export default memo(InventoryItemCard);

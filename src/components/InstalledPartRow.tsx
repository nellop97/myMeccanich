// src/components/InstalledPartRow.tsx
// Pezzi montati su un intervento, come li vedono il proprietario e chi consulta lo storico
import React, { memo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ImageOff, ShieldCheck, X } from 'lucide-react-native';
import { useColors } from '../hooks/useTheme';
import { MaintenancePart } from '../types/database.types';
import { PART_ORIGIN_LABELS, PART_SOURCE_LABELS, PartSource } from '../types/inventory.types';

const THUMBNAIL_SIZE = 64;

// I record vecchi possono avere campi vuoti, spazi o numeri al posto del testo
const cleanText = (value: unknown): string => {
  if (typeof value === 'number') return String(value);
  return typeof value === 'string' ? value.trim() : '';
};

const hasContent = (part: MaintenancePart | null | undefined): part is MaintenancePart =>
  !!part &&
  [part.name, part.brand, part.partNumber, part.serialNumber, part.photoUrl].some(
    (value) => cleanText(value) !== ''
  );

export const getDisplayableParts = (parts: unknown): MaintenancePart[] =>
  Array.isArray(parts) ? parts.filter(hasContent) : [];

// "Da magazzino" è un dato interno dell'officina e non si mostra al cliente
const getSourceLabel = (source?: PartSource): string =>
  source === 'customer_supplied' || source === 'bought_for_job' ? PART_SOURCE_LABELS[source] : '';

const formatCost = (amount: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);

interface PhotoViewerProps {
  uri: string;
  label: string;
  onClose: () => void;
}

const PhotoViewer = ({ uri, label, onClose }: PhotoViewerProps) => {
  const colors = useColors();
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={[styles.viewer, { backgroundColor: colors.background }]}>
        <View style={styles.viewerHeader}>
          <Text numberOfLines={2} style={[styles.viewerTitle, { color: colors.onSurface }]}>
            {label}
          </Text>
          <Pressable
            onPress={onClose}
            style={[styles.viewerClose, { backgroundColor: colors.surfaceVariant }]}
            accessibilityRole="button"
            accessibilityLabel="Chiudi foto"
          >
            <X size={22} color={colors.onSurface} />
          </Pressable>
        </View>
        <View style={styles.viewerBody}>
          {status === 'error' ? (
            <Text style={{ color: colors.onSurfaceVariant }}>Impossibile caricare la foto</Text>
          ) : (
            <Image
              source={{ uri }}
              style={styles.viewerImage}
              resizeMode="contain"
              accessibilityLabel={label}
              onLoad={() => setStatus('loaded')}
              onError={() => setStatus('error')}
            />
          )}
          {status === 'loading' && (
            <ActivityIndicator style={styles.viewerSpinner} size="large" color={colors.primary} />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

interface InstalledPartRowProps {
  part: MaintenancePart;
  showCost: boolean;
}

export const InstalledPartRow = memo(({ part, showCost }: InstalledPartRowProps) => {
  const colors = useColors();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [highlighted, setHighlighted] = useState(false);

  const name = cleanText(part.name) || 'Ricambio';
  const quantity = cleanText(part.quantity);
  const brand = cleanText(part.brand);
  const partNumber = cleanText(part.partNumber);
  const serialNumber = cleanText(part.serialNumber);
  const photoUrl = cleanText(part.photoUrl);
  const originLabel = part.origin ? PART_ORIGIN_LABELS[part.origin] : undefined;
  const sourceLabel = getSourceLabel(part.source);
  const cost = showCost && typeof part.cost === 'number' && part.cost > 0 ? part.cost : null;
  const photoLabel = `Foto del ricambio ${name}`;

  const details = [
    quantity && `Quantità: ${quantity}`,
    brand && `Marca: ${brand}`,
    partNumber && `Codice: ${partNumber}`,
  ].filter(Boolean);
  const provenance = [originLabel && `Provenienza: ${originLabel}`, sourceLabel].filter(Boolean);

  return (
    <View style={styles.row}>
      {!!photoUrl && (
        <Pressable
          onPress={() => setViewerOpen(true)}
          onHoverIn={() => setHighlighted(true)}
          onHoverOut={() => setHighlighted(false)}
          onFocus={() => setHighlighted(true)}
          onBlur={() => setHighlighted(false)}
          style={[
            styles.thumbnail,
            {
              backgroundColor: colors.surfaceVariant,
              borderColor: highlighted ? colors.primary : colors.outline,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${photoLabel}, apri a tutto schermo`}
        >
          {thumbnailFailed ? (
            <ImageOff size={22} color={colors.onSurfaceVariant} />
          ) : (
            <Image
              source={{ uri: photoUrl }}
              style={styles.thumbnailImage}
              resizeMode="cover"
              resizeMethod="resize"
              accessibilityLabel={photoLabel}
              onError={() => setThumbnailFailed(true)}
            />
          )}
        </Pressable>
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: colors.onSurface }]}>{name}</Text>
          {cost !== null && (
            <Text style={[styles.cost, { color: colors.onSurface }]}>{formatCost(cost)}</Text>
          )}
        </View>
        {details.length > 0 && (
          <Text selectable style={[styles.detail, { color: colors.onSurfaceVariant }]}>
            {details.join(' · ')}
          </Text>
        )}
        {!!serialNumber && (
          <Text selectable style={[styles.detail, { color: colors.onSurfaceVariant }]}>
            Matricola: {serialNumber}
          </Text>
        )}
        {provenance.length > 0 && (
          <Text style={[styles.detail, { color: colors.onSurfaceVariant }]}>
            {provenance.join(' · ')}
          </Text>
        )}
      </View>

      {viewerOpen && (
        <PhotoViewer uri={photoUrl} label={photoLabel} onClose={() => setViewerOpen(false)} />
      )}
    </View>
  );
});

InstalledPartRow.displayName = 'InstalledPartRow';

interface InstalledPartsListProps {
  parts: unknown;
  showCosts: boolean;
  verifiedByWorkshop?: boolean;
}

export const InstalledPartsList = ({
  parts,
  showCosts,
  verifiedByWorkshop,
}: InstalledPartsListProps) => {
  const colors = useColors();
  const displayableParts = getDisplayableParts(parts);

  if (displayableParts.length === 0) return null;

  return (
    <View style={styles.list}>
      {verifiedByWorkshop && (
        <View style={[styles.declaration, { backgroundColor: colors.surfaceVariant }]}>
          <ShieldCheck size={18} color={colors.onSurface} />
          <View style={styles.body}>
            <Text style={[styles.declarationTitle, { color: colors.onSurface }]}>
              Dichiarato dall&apos;officina
            </Text>
            <Text style={[styles.detail, { color: colors.onSurfaceVariant }]}>
              Dati inseriti dall&apos;officina e non modificabili dal proprietario. Non sono una
              verifica indipendente dell&apos;originalità dei pezzi.
            </Text>
          </View>
        </View>
      )}
      {displayableParts.map((part, index) => (
        <View key={index}>
          {index > 0 && <View style={[styles.divider, { backgroundColor: colors.outline }]} />}
          <InstalledPartRow part={part} showCost={showCosts} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  declaration: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 12,
  },
  declarationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    flexShrink: 0,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  // minWidth 0: senza, codici lunghi allargano la riga oltre lo schermo su web
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '600',
  },
  cost: {
    flexShrink: 0,
    fontSize: 15,
    fontWeight: '700',
  },
  detail: {
    fontSize: 13,
    lineHeight: 18,
  },
  viewer: {
    flex: 1,
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  viewerTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '600',
  },
  viewerClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
  viewerSpinner: {
    position: 'absolute',
  },
});

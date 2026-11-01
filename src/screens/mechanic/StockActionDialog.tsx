// src/screens/mechanic/StockActionDialog.tsx - Carico, rettifica e reso di un pezzo
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import InventoryService from '../../services/InventoryService';
import type { InventoryItem } from '../../types/inventory.types';
import { parseAmount } from '../../utils/interventionTotals';
import { formatQuantity, formatStock } from './inventoryFormat';
import MechanicTextInput from './MechanicTextInput';
import {
  mechanicButton,
  mechanicButtonText,
  mechanicRadius,
  mechanicSpacing,
  useMechanicTheme,
} from './mechanicTheme';

export type StockAction = 'load' | 'adjust' | 'return';

const DIALOG_MAX_WIDTH = 440;

const ACTION_TEXTS: Record<StockAction, { title: string; quantity: string; success: string }> = {
  load: { title: 'Carico', quantity: 'Quantità caricata', success: 'Carico registrato' },
  adjust: { title: 'Rettifica', quantity: 'Giacenza contata', success: 'Giacenza rettificata' },
  return: { title: 'Reso', quantity: 'Quantità che rientra', success: 'Reso registrato' },
};

interface StockActionDialogProps {
  action: StockAction | null;
  item: InventoryItem;
  userId: string;
  presetQuantity?: number;
  onClose: () => void;
  onDone: (message: string) => void;
}

const initialQuantity = (action: StockAction, item: InventoryItem, preset?: number) => {
  if (action === 'adjust') {
    return formatQuantity(item.quantityOnHand);
  }
  if (item.serialNumber) {
    return '1';
  }
  return preset ? formatQuantity(preset) : '';
};

const StockActionDialog: React.FC<StockActionDialogProps> = ({
  action,
  item,
  userId,
  presetQuantity,
  onClose,
  onDone,
}) => {
  const theme = useMechanicTheme();
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (action) {
      setQuantity(initialQuantity(action, item, presetQuantity));
      setUnitCost('');
      setReason('');
      setError(null);
    }
    // I campi si inizializzano all'apertura: un ricaricamento della scheda non deve azzerarli
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, presetQuantity]);

  if (!action) {
    return null;
  }

  const texts = ACTION_TEXTS[action];
  const isSerial = !!item.serialNumber;

  const getValidationError = (parsedQuantity: number | null, parsedCost: number | null) => {
    if (parsedQuantity === null) {
      return 'Inserisci una quantità valida.';
    }
    if (action === 'adjust') {
      if (isSerial && parsedQuantity > 1) {
        return 'Un pezzo con matricola può avere giacenza 0 o 1.';
      }
      if (parsedQuantity === item.quantityOnHand) {
        return 'La giacenza contata è uguale a quella attuale.';
      }
      if (!reason.trim()) {
        return 'Indica il motivo della rettifica.';
      }
    } else if (parsedQuantity <= 0) {
      return 'La quantità deve essere maggiore di zero.';
    }
    if (action === 'load' && unitCost.trim() && parsedCost === null) {
      return 'Inserisci un costo valido.';
    }
    return null;
  };

  const submit = async () => {
    const parsedQuantity = parseAmount(quantity);
    const parsedCost = parseAmount(unitCost);
    const validationError = getValidationError(parsedQuantity, parsedCost);
    if (validationError || parsedQuantity === null) {
      setError(validationError);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const details = { quantity: parsedQuantity, reason: reason.trim() || undefined };
      if (action === 'load') {
        await InventoryService.loadStock(item.id, { ...details, unitCost: parsedCost ?? undefined }, userId);
      } else if (action === 'adjust') {
        await InventoryService.adjustStock(item.id, details, userId);
      } else {
        await InventoryService.returnStock(item.id, details, userId);
      }
      onDone(texts.success);
    } catch (saveError: any) {
      console.error('Errore movimento di magazzino:', saveError);
      setError(saveError?.message || 'Operazione non riuscita. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  const labelStyle = [styles.label, { color: theme.text }];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.overlay, { backgroundColor: theme.overlay }]}
      >
        <View
          accessibilityViewIsModal
          style={[styles.dialog, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <Text style={[styles.title, { color: theme.text }]} accessibilityRole="header">
              {texts.title}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {item.name} · giacenza {formatStock(item.quantityOnHand, item.unit)}
            </Text>

            <Text style={labelStyle}>
              {texts.quantity} ({item.unit})
            </Text>
            <MechanicTextInput
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              accessibilityLabel={texts.quantity}
              editable={!(isSerial && action !== 'adjust')}
              autoFocus={!isSerial}
            />

            {action === 'load' ? (
              <>
                <Text style={labelStyle}>Costo unitario (facoltativo)</Text>
                <MechanicTextInput
                  value={unitCost}
                  onChangeText={setUnitCost}
                  keyboardType="decimal-pad"
                  accessibilityLabel="Costo unitario, facoltativo"
                  placeholder="0,00"
                />
              </>
            ) : null}

            <Text style={labelStyle}>{action === 'adjust' ? 'Motivo' : 'Motivo (facoltativo)'}</Text>
            <MechanicTextInput
              value={reason}
              onChangeText={setReason}
              accessibilityLabel={action === 'adjust' ? 'Motivo della rettifica' : 'Motivo, facoltativo'}
              placeholder={action === 'adjust' ? 'Es. inventario di fine mese' : undefined}
            />

            {error ? (
              <Text
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                style={[styles.error, { color: theme.error }]}
              >
                {error}
              </Text>
            ) : null}

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Annulla"
                onPress={onClose}
                disabled={saving}
                style={[mechanicButton.secondary, styles.action, { borderColor: theme.border }]}
              >
                <Text style={[mechanicButtonText.primary, { color: theme.text }]}>Annulla</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Conferma ${texts.title.toLowerCase()}`}
                accessibilityState={{ disabled: saving, busy: saving }}
                onPress={submit}
                disabled={saving}
                style={[mechanicButton.primary, styles.action, { backgroundColor: theme.primary }]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={theme.onPrimary} />
                ) : (
                  <Text style={[mechanicButtonText.primary, { color: theme.onPrimary }]}>Conferma</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: mechanicSpacing.md,
  },
  dialog: {
    width: '100%',
    maxWidth: DIALOG_MAX_WIDTH,
    maxHeight: '100%',
    borderWidth: 1,
    borderRadius: mechanicRadius.xl,
  },
  content: {
    padding: mechanicSpacing.lg,
    gap: mechanicSpacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: mechanicSpacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: mechanicSpacing.sm,
  },
  error: {
    fontSize: 14,
    marginTop: mechanicSpacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: mechanicSpacing.sm,
    marginTop: mechanicSpacing.md,
  },
  action: {
    flex: 1,
    paddingHorizontal: mechanicSpacing.sm,
  },
});

export default StockActionDialog;

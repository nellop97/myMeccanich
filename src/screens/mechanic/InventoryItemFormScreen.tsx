// src/screens/mechanic/InventoryItemFormScreen.tsx - Creazione e modifica di una scheda di magazzino
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AlertCircle, RefreshCw, Sparkles, X } from 'lucide-react-native';
import PartPhotoScanButton from '../../components/PartPhotoScanButton';
import UniversalImagePicker from '../../components/UniversalImagePicker';
import InventoryService, { InventoryItemDraft } from '../../services/InventoryService';
import { useStore } from '../../store';
import {
  INVENTORY_CATEGORY_LABELS,
  InventoryCategory,
  InventoryItem,
  InventoryUnit,
  PART_ORIGIN_LABELS,
  PartAnalysis,
  PartOrigin,
} from '../../types/inventory.types';
import { parseAmount } from '../../utils/interventionTotals';
import { showAlert } from '../../utils/platformHelpers';
import InventoryChip from './InventoryChip';
import { formatQuantity, formatStock } from './inventoryFormat';
import MechanicHeader from './MechanicHeader';
import { MechanicEmptyState, MechanicLoadingState } from './MechanicStates';
import MechanicTextInput from './MechanicTextInput';
import {
  MECHANIC_BREAKPOINTS,
  mechanicButton,
  mechanicButtonText,
  mechanicCard,
  mechanicRadius,
  mechanicSpacing,
  useMechanicBreakpoints,
  useMechanicTheme,
} from './mechanicTheme';

const FORM_MAX_WIDTH = 860;
const PHOTO_SIZE = 88;
const UNITS: InventoryUnit[] = ['pz', 'l', 'kg'];

interface FormValues {
  name: string;
  category: InventoryCategory;
  partNumber: string;
  brand: string;
  origin: PartOrigin | null; // Nessun valore iniziale: la provenienza arriva al cliente, va scelta
  supplier: string;
  location: string;
  unit: InventoryUnit;
  initialQuantity: string;
  minStock: string;
  purchaseCost: string;
  salePrice: string;
  serialNumber: string;
}

type FieldName = keyof FormValues;

const EMPTY_FORM: FormValues = {
  name: '',
  category: 'altro',
  partNumber: '',
  brand: '',
  origin: null,
  supplier: '',
  location: '',
  unit: 'pz',
  initialQuantity: '',
  minStock: '',
  purchaseCost: '',
  salePrice: '',
  serialNumber: '',
};

const AI_FIELDS = ['name', 'brand', 'partNumber', 'serialNumber', 'category', 'origin', 'unit'] as const;

const fromItem = (item: InventoryItem): FormValues => ({
  name: item.name,
  category: item.category,
  partNumber: item.partNumber,
  brand: item.brand,
  origin: item.origin,
  supplier: item.supplier,
  location: item.location,
  unit: item.unit,
  initialQuantity: '',
  minStock: formatQuantity(item.minStock),
  purchaseCost: formatQuantity(item.purchaseCost),
  salePrice: formatQuantity(item.salePrice),
  serialNumber: item.serialNumber ?? '',
});

const InventoryItemFormScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const theme = useMechanicTheme();
  const { width } = useMechanicBreakpoints();
  const { user } = useStore();

  const { itemId, name, partNumber, brand } = route.params ?? {};
  const isEdit = !!itemId;
  const isWide = width >= MECHANIC_BREAKPOINTS.tablet;

  const [values, setValues] = useState<FormValues>({
    ...EMPTY_FORM,
    name: name ?? '',
    partNumber: partNumber ?? '',
    brand: brand ?? '',
  });
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [aiFields, setAiFields] = useState<FieldName[]>([]);
  const [aiNotes, setAiNotes] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const loaded = await InventoryService.getItem(itemId);
      if (!loaded) {
        setLoadError('Questa scheda non esiste più.');
        return;
      }
      setItem(loaded);
      setValues(fromItem(loaded));
    } catch (error: any) {
      console.error('Errore caricamento scheda:', error);
      setLoadError(error?.message ?? 'Impossibile caricare la scheda');
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    load();
  }, [load]);

  const setField = <K extends FieldName>(field: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setAiFields((current) => current.filter((entry) => entry !== field));
  };

  const addPhoto = ({ uri }: { uri: string }) => {
    setPhotos((current) => (current.includes(uri) ? current : [...current, uri]));
  };

  const applyAnalysis = (analysis: PartAnalysis, photo: { uri: string }) => {
    const filled = AI_FIELDS.filter((field) => analysis[field] !== null && analysis[field] !== undefined);
    setValues((current) => ({
      ...current,
      ...Object.fromEntries(filled.map((field) => [field, analysis[field]])),
    }));
    setAiFields(filled);
    setAiNotes(analysis.notes);
    addPhoto(photo);
    setFormError(null);
  };

  const isSerial = !!values.serialNumber.trim();

  const buildDraft = (): { draft?: InventoryItemDraft; quantity?: number; error?: string } => {
    const minStock = values.minStock.trim() ? parseAmount(values.minStock) : 0;
    const purchaseCost = values.purchaseCost.trim() ? parseAmount(values.purchaseCost) : 0;
    const salePrice = values.salePrice.trim() ? parseAmount(values.salePrice) : 0;
    const quantityText = isSerial ? '1' : values.initialQuantity;
    const quantity = quantityText.trim() ? parseAmount(quantityText) : 0;

    if (!values.name.trim()) return { error: 'Inserisci il nome del pezzo.' };
    if (!values.origin) return { error: 'Scegli la provenienza del pezzo.' };
    if (quantity === null) return { error: 'La quantità iniziale non è valida.' };
    if (minStock === null) return { error: 'La scorta minima non è valida.' };
    if (purchaseCost === null) return { error: 'Il costo d\'acquisto non è valido.' };
    if (salePrice === null) return { error: 'Il prezzo di vendita non è valido.' };
    if (isSerial && item && item.quantityOnHand > 1) {
      return {
        error: `Un pezzo con matricola è unico, ma la giacenza è ${formatStock(item.quantityOnHand, item.unit)}. Rettificala prima di indicare la matricola.`,
      };
    }

    return {
      quantity,
      draft: {
        name: values.name.trim(),
        category: values.category,
        partNumber: values.partNumber.trim(),
        brand: values.brand.trim(),
        origin: values.origin,
        supplier: values.supplier.trim(),
        location: values.location.trim(),
        unit: values.unit,
        minStock,
        purchaseCost,
        salePrice,
        serialNumber: values.serialNumber.trim(),
      },
    };
  };

  const uploadPhotos = async (savedItemId: string, userId: string) => {
    const results = await Promise.allSettled(
      photos.map((uri) => InventoryService.uploadItemPhoto(userId, savedItemId, uri))
    );
    return results.filter((result) => result.status === 'rejected').length;
  };

  const save = async () => {
    const { draft, quantity, error } = buildDraft();
    if (!draft || !user?.id) {
      setFormError(error ?? 'Sessione non valida. Accedi di nuovo.');
      return;
    }

    setFormError(null);
    setSaving(true);
    try {
      const savedItemId = itemId ?? (await InventoryService.createItem(user.id, draft, quantity));
      if (isEdit) {
        await InventoryService.updateItem(itemId, draft);
      }

      const failedPhotos = await uploadPhotos(savedItemId, user.id);
      if (failedPhotos > 0) {
        showAlert('Scheda salvata', 'Una o più foto non sono state caricate. La scheda è comunque salva.');
      }

      if (isEdit) {
        navigation.goBack();
      } else {
        navigation.replace('InventoryItemDetail', { itemId: savedItemId });
      }
    } catch (saveError: any) {
      console.error('Errore salvataggio scheda:', saveError);
      setFormError(saveError?.message || 'Salvataggio non riuscito. Riprova.');
      setSaving(false);
    }
  };

  const header = (
    <MechanicHeader title={isEdit ? 'Modifica pezzo' : 'Nuovo pezzo'} onBack={() => navigation.goBack()} />
  );

  if (loading || loadError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {header}
        {loading ? (
          <MechanicLoadingState text="Caricamento scheda..." />
        ) : (
          <MechanicEmptyState
            icon={AlertCircle}
            title="Impossibile aprire la scheda"
            subtitle={loadError ?? undefined}
            actionLabel="Riprova"
            actionIcon={RefreshCw}
            onAction={load}
          />
        )}
      </SafeAreaView>
    );
  }

  const fieldLabel = (label: string, field: FieldName) => (
    <View style={styles.labelRow}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      {aiFields.includes(field) ? (
        <View style={[styles.verify, { backgroundColor: theme.warningLight }]}>
          <Sparkles size={12} color={theme.isDark ? theme.text : theme.warning} />
          <Text style={[styles.verifyText, { color: theme.isDark ? theme.text : theme.warning }]}>
            Da verificare
          </Text>
        </View>
      ) : null}
    </View>
  );

  const textField = (
    label: string,
    field: Exclude<FieldName, 'category' | 'origin' | 'unit'>,
    options: { numeric?: boolean; half?: boolean; placeholder?: string } = {}
  ) => (
    <View style={[styles.field, options.half && isWide && styles.fieldHalf]}>
      {fieldLabel(label, field)}
      <MechanicTextInput
        value={values[field]}
        onChangeText={(text) => setField(field, text)}
        accessibilityLabel={aiFields.includes(field) ? `${label}, da verificare` : label}
        keyboardType={options.numeric ? 'decimal-pad' : 'default'}
        placeholder={options.placeholder}
        containerStyle={aiFields.includes(field) ? { borderColor: theme.warning } : undefined}
      />
    </View>
  );

  const quantityLocked = isSerial;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {header}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <View style={styles.form}>
            <View style={[mechanicCard, styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <PartPhotoScanButton onResult={applyAnalysis} onPhotoOnly={addPhoto} disabled={saving} />
              <UniversalImagePicker
                label="Oppure allega una foto"
                disabled={saving}
                showPreview={false}
                onImagesSelected={(images) => images.forEach(addPhoto)}
              />
              {aiNotes ? (
                <Text style={[styles.notes, { color: theme.textSecondary }]}>Nota dalla foto: {aiNotes}</Text>
              ) : null}
              {photos.length > 0 ? (
                <View style={styles.photos}>
                  {photos.map((uri, index) => (
                    <View key={uri}>
                      <Image
                        source={{ uri }}
                        style={styles.photo}
                        accessibilityLabel={`Foto ${index + 1} da aggiungere alla scheda`}
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Togli la foto ${index + 1}`}
                        onPress={() => setPhotos((current) => current.filter((entry) => entry !== uri))}
                        style={[styles.removePhoto, { backgroundColor: theme.overlay }]}
                      >
                        <X size={18} color={theme.onPrimary} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={[mechanicCard, styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.fields}>
                {textField('Nome', 'name', { placeholder: 'Es. Filtro olio' })}

                <View style={styles.field}>
                  {fieldLabel('Categoria', 'category')}
                  <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Categoria">
                    {(Object.entries(INVENTORY_CATEGORY_LABELS) as [InventoryCategory, string][]).map(
                      ([category, label]) => (
                        <InventoryChip
                          key={category}
                          label={label}
                          selected={values.category === category}
                          onPress={() => setField('category', category)}
                        />
                      )
                    )}
                  </View>
                </View>

                {textField('Codice', 'partNumber', { half: true })}
                {textField('Marca', 'brand', { half: true })}

                <View style={styles.field}>
                  {fieldLabel('Provenienza', 'origin')}
                  <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Provenienza">
                    {(Object.entries(PART_ORIGIN_LABELS) as [PartOrigin, string][]).map(([origin, label]) => (
                      <InventoryChip
                        key={origin}
                        label={label}
                        selected={values.origin === origin}
                        onPress={() => setField('origin', origin)}
                      />
                    ))}
                  </View>
                </View>

                {textField('Fornitore', 'supplier', { half: true })}
                {textField('Posizione', 'location', { half: true, placeholder: 'Es. Scaffale B3' })}

                <View style={styles.field}>
                  {fieldLabel('Unità', 'unit')}
                  <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Unità">
                    {UNITS.map((unit) => (
                      <InventoryChip
                        key={unit}
                        label={unit}
                        selected={values.unit === unit}
                        onPress={() => setField('unit', unit)}
                      />
                    ))}
                  </View>
                </View>

                {textField('Matricola', 'serialNumber', { half: true })}

                {!isEdit ? (
                  <View style={[styles.field, isWide && styles.fieldHalf]}>
                    {fieldLabel('Quantità iniziale', 'initialQuantity')}
                    <MechanicTextInput
                      value={quantityLocked ? '1' : values.initialQuantity}
                      onChangeText={(text) => setField('initialQuantity', text)}
                      accessibilityLabel="Quantità iniziale"
                      keyboardType="decimal-pad"
                      editable={!quantityLocked}
                      placeholder="0"
                    />
                    {quantityLocked ? (
                      <Text style={[styles.hint, { color: theme.textSecondary }]}>
                        Con la matricola il pezzo è unico: la quantità è 1.
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {textField('Scorta minima', 'minStock', { numeric: true, half: true, placeholder: '0' })}
                {textField('Costo d\'acquisto (€)', 'purchaseCost', { numeric: true, half: true, placeholder: '0,00' })}
                {textField('Prezzo di vendita (€)', 'salePrice', { numeric: true, half: true, placeholder: '0,00' })}
              </View>
            </View>

            {formError ? (
              <Text
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                style={[styles.error, { color: theme.error }]}
              >
                {formError}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isEdit ? 'Salva modifiche' : 'Crea scheda'}
              accessibilityState={{ disabled: saving, busy: saving }}
              disabled={saving}
              onPress={save}
              style={[mechanicButton.primary, { backgroundColor: theme.primary }]}
            >
              {saving ? (
                <ActivityIndicator size="small" color={theme.onPrimary} />
              ) : (
                <Text style={[mechanicButtonText.primary, { color: theme.onPrimary }]}>
                  {isEdit ? 'Salva modifiche' : 'Crea scheda'}
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: mechanicSpacing.md,
    alignItems: 'center',
  },
  form: {
    width: '100%',
    maxWidth: FORM_MAX_WIDTH,
    gap: mechanicSpacing.md,
  },
  card: {
    gap: 12,
  },
  notes: {
    fontSize: 14,
  },
  photos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mechanicSpacing.sm,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: mechanicRadius.md,
  },
  removePhoto: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mechanicRadius.md,
  },
  fields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mechanicSpacing.md,
  },
  field: {
    width: '100%',
    gap: 6,
  },
  // Due per riga: la metà meno metà dello spazio tra i campi non è esprimibile in percentuale
  fieldHalf: {
    width: '48%',
    flexGrow: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: mechanicSpacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  verify: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mechanicSpacing.xs,
    paddingHorizontal: mechanicSpacing.sm,
    paddingVertical: 2,
    borderRadius: mechanicRadius.sm,
  },
  verifyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mechanicSpacing.sm,
  },
  hint: {
    fontSize: 13,
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default InventoryItemFormScreen;

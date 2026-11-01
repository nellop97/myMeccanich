// src/screens/mechanic/CompleteInterventionScreen.tsx
// Chiusura dei lavori: pezzi usati, costi e foto che finiscono nello storico del veicolo
import { useNavigation, useRoute } from '@react-navigation/native';
import { AlertCircle, AlertTriangle, Box, Check, Plus, Trash2, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PartPhotoScanButton } from '../../components/PartPhotoScanButton';
import { AiComingSoonButton } from '../../components/AiComingSoonButton';
import UniversalImagePicker from '../../components/UniversalImagePicker';
import { useInventory } from '../../hooks/useInventory';
import InterventionService, {
  InterventionAlreadyClosedError,
  InterventionPhotoKind,
  LocalPartPhoto,
  LocalPhoto,
  UploadedPhotos,
} from '../../services/InterventionService';
import inventoryService, { InsufficientStockError } from '../../services/InventoryService';
import { useStore } from '../../store';
import { useInvoicingStore } from '../../store/invoicingStore';
import { RepairPart, useWorkshopStore } from '../../store/workshopStore';
import {
  InventoryCategory,
  PART_SOURCE_LABELS,
  PartAnalysis,
  PartOrigin,
  PartSource,
  requiresMountedPhoto,
} from '../../types/inventory.types';
import { toDayString } from '../../utils/calendarGrid';
import { isStockPart } from '../../utils/inventoryStock';
import { VAT_RATE, calculateInterventionTotals, getPartTotal, parseAmount } from '../../utils/interventionTotals';
import { showAlert } from '../../utils/platformHelpers';
import InventoryPartPicker, { ChoiceChips, formatQuantity, newPartId, ORIGIN_OPTIONS, toPartCategory } from './InventoryPartPicker';
import MechanicHeader from './MechanicHeader';
import { MechanicEmptyState } from './MechanicStates';
import MechanicTextInput from './MechanicTextInput';
import {
  MECHANIC_MIN_TOUCH,
  MechanicTheme,
  mechanicButton,
  mechanicButtonText,
  mechanicCard,
  mechanicRadius,
  useMechanicBreakpoints,
  useMechanicTheme,
} from './mechanicTheme';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);

const MISSING_CODE = 'Manca il codice';
const MISSING_ORIGIN = 'Manca la provenienza';
const MISSING_PHOTO = 'Manca la foto';
const NO_ISSUES: string[] = [];

type ManualPartSource = Exclude<PartSource, 'stock'>;
type ManualPartKind = 'ricambio' | 'fluido' | 'consumabile';

interface DraftPart {
  name: string;
  brand: string;
  partNumber: string;
  serialNumber: string;
  quantity: string;
  unitPrice: string;
  source: ManualPartSource;
  kind: ManualPartKind;
  origin?: PartOrigin;
}

const emptyPart: DraftPart = {
  name: '',
  brand: '',
  partNumber: '',
  serialNumber: '',
  quantity: '1',
  unitPrice: '',
  source: 'bought_for_job',
  kind: 'ricambio',
};

const SOURCE_OPTIONS: { value: ManualPartSource; label: string }[] = [
  { value: 'bought_for_job', label: PART_SOURCE_LABELS.bought_for_job },
  { value: 'customer_supplied', label: PART_SOURCE_LABELS.customer_supplied },
];

const KIND_OPTIONS: { value: ManualPartKind; label: string }[] = [
  { value: 'ricambio', label: 'Ricambio' },
  { value: 'fluido', label: 'Fluido' },
  { value: 'consumabile', label: 'Consumabile' },
];

// Senza scheda vale la scelta sulla riga: se manca, requiresMountedPhoto chiede la foto
const partPhotoCategory = (
  part: RepairPart,
  itemCategories: Map<string, InventoryCategory>
): InventoryCategory | undefined => {
  const itemCategory = part.inventoryItemId ? itemCategories.get(part.inventoryItemId) : undefined;
  if (itemCategory) return itemCategory;
  if (part.category === 'fluido') return 'fluidi';
  if (part.category === 'consumabile') return 'consumabili';
  return undefined;
};

interface PartEditorProps {
  part: RepairPart;
  photo?: LocalPartPhoto;
  photoRequired: boolean;
  issues: string[];
  disabled: boolean;
  theme: MechanicTheme;
  onChange: (partId: string, changes: Partial<RepairPart>) => void;
  onPhoto: (partId: string, photo: LocalPartPhoto | null) => void;
  onRemove: (partId: string) => void;
}

const PartEditor = React.memo(({
  part,
  photo,
  photoRequired,
  issues,
  disabled,
  theme,
  onChange,
  onPhoto,
  onRemove,
}: PartEditorProps) => {
  const stock = isStockPart(part);
  const photoUri = photo?.uri ?? part.photoUrl;
  const details = [
    `${formatQuantity(part.quantity)} × ${formatCurrency(part.unitPrice)}`,
    stock ? PART_SOURCE_LABELS.stock : '',
    part.serialNumber ? `Matricola ${part.serialNumber}` : '',
  ].filter(Boolean).join(' · ');

  return (
    <View style={[styles.partRow, { borderColor: theme.border }]}>
      <View style={styles.partHeader}>
        <View style={styles.partBody}>
          <Text style={[styles.partName, { color: theme.text }]}>{part.name}</Text>
          <Text style={[styles.small, { color: theme.textSecondary }]}>{details}</Text>
        </View>
        <Text style={[styles.partName, { color: theme.text }]}>{formatCurrency(part.totalPrice)}</Text>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => onRemove(part.id)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`Rimuovi ${part.name}`}
        >
          <Trash2 size={18} color={theme.error} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <View style={styles.flex}>
          <MechanicTextInput
            value={part.partNumber ?? ''}
            onChangeText={(partNumber) => onChange(part.id, { partNumber })}
            placeholder="Codice"
            accessibilityLabel={`Codice di ${part.name}`}
            error={issues.includes(MISSING_CODE)}
          />
        </View>
        <View style={styles.flex}>
          <MechanicTextInput
            value={part.brand ?? ''}
            onChangeText={(brand) => onChange(part.id, { brand })}
            placeholder="Marca"
            accessibilityLabel={`Marca di ${part.name}`}
          />
        </View>
      </View>

      <ChoiceChips
        label="Provenienza"
        options={ORIGIN_OPTIONS}
        value={part.origin}
        onChange={(origin) => onChange(part.id, { origin })}
      />

      {!stock && (
        <ChoiceChips
          label="Sorgente"
          options={SOURCE_OPTIONS}
          value={part.source === 'stock' ? undefined : part.source}
          onChange={(source) => onChange(part.id, { source })}
        />
      )}

      {!part.inventoryItemId && (
        <ChoiceChips
          label="Tipo di pezzo"
          options={KIND_OPTIONS}
          value={part.category === 'accessorio' ? undefined : part.category}
          onChange={(category) => onChange(part.id, { category })}
        />
      )}

      {photoUri ? (
        <View style={styles.partPhotoRow}>
          <Image source={{ uri: photoUri }} style={styles.photo} accessibilityLabel={`Foto di ${part.name}`} />
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onPhoto(part.id, null)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`Rimuovi la foto di ${part.name}`}
          >
            <X size={18} color={theme.error} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      ) : (
        <UniversalImagePicker
          label={photoRequired ? 'Foto del pezzo montato (obbligatoria)' : 'Foto del pezzo montato (facoltativa)'}
          disabled={disabled}
          onImagesSelected={(images) => {
            if (images[0]) {
              onPhoto(part.id, { uri: images[0].uri, fileName: images[0].fileName });
            }
          }}
        />
      )}

      {issues.length > 0 && (
        <Text style={[styles.small, { color: theme.error }]} accessibilityRole="alert">
          {issues.join(' · ')}
        </Text>
      )}
    </View>
  );
});

PartEditor.displayName = 'PartEditor';

const CompleteInterventionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { carId, repairId } = route.params;
  const { user } = useStore();
  const theme = useMechanicTheme();
  const { isMobile } = useMechanicBreakpoints();
  const { cars, fetchCars } = useWorkshopStore();
  const { addInvoice } = useInvoicingStore();
  const inventory = useInventory(user?.id);

  const car = cars.find((item) => item.id === carId);
  const repair = car?.repairs.find((item) => item.id === repairId);

  const [parts, setParts] = useState<RepairPart[]>([]);
  const [draftPart, setDraftPart] = useState<DraftPart>(emptyPart);
  const [draftPhoto, setDraftPhoto] = useState<LocalPartPhoto | null>(null);
  const [partPhotos, setPartPhotos] = useState<Record<string, LocalPartPhoto>>({});
  const [showPartIssues, setShowPartIssues] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [stockIssue, setStockIssue] = useState<InsufficientStockError | null>(null);
  const [correctingStock, setCorrectingStock] = useState(false);
  const [countedStock, setCountedStock] = useState('');
  const [stockError, setStockError] = useState<string | null>(null);
  const [stockNotice, setStockNotice] = useState<string | null>(null);
  const [savingStock, setSavingStock] = useState(false);
  const [noParts, setNoParts] = useState(false);
  const [laborCost, setLaborCost] = useState('');
  const [mileage, setMileage] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [createInvoice, setCreateInvoice] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);
  // Sopravvive ai tentativi falliti: le foto già caricate non ripartono
  const uploadedPhotos = useRef<UploadedPhotos>(new Map());

  useEffect(() => {
    if (!car && user?.id) {
      fetchCars(user.id);
    }
  }, [car, user?.id, fetchCars]);

  useEffect(() => {
    if (repair && !initialized) {
      setParts(repair.parts ?? []);
      setLaborCost(repair.laborCost ? String(repair.laborCost) : '');
      setNotes(repair.notes ?? '');
      setInitialized(true);
    }
  }, [repair, initialized]);

  const labor = parseAmount(laborCost);
  const totals = useMemo(() => calculateInterventionTotals(parts, labor ?? 0), [parts, labor]);

  const itemCategories = useMemo(
    () => new Map(inventory.items.map((item) => [item.id, item.category])),
    [inventory.items]
  );

  const unsavedParts = useMemo(() => {
    const saved = new Set((repair?.parts ?? []).map((part) => part.id));
    return parts.filter((part) => !saved.has(part.id));
  }, [parts, repair?.parts]);

  const partIssues = useMemo(() => {
    const issues = new Map<string, string[]>();
    parts.forEach((part) => {
      const missing = [
        !part.partNumber?.trim() && MISSING_CODE,
        !part.origin && MISSING_ORIGIN,
        requiresMountedPhoto(partPhotoCategory(part, itemCategories)) &&
          !partPhotos[part.id] &&
          !part.photoUrl &&
          MISSING_PHOTO,
      ].filter((issue): issue is string => !!issue);
      if (missing.length) {
        issues.set(part.id, missing);
      }
    });
    return issues;
  }, [parts, partPhotos, itemCategories]);

  const changePart = useCallback((partId: string, changes: Partial<RepairPart>) => {
    setParts((current) => current.map((part) => (part.id === partId ? { ...part, ...changes } : part)));
  }, []);

  const removePart = useCallback((partId: string) => {
    setParts((current) => current.filter((part) => part.id !== partId));
    setPartPhotos(({ [partId]: _removed, ...others }) => others);
  }, []);

  const setPartPhoto = useCallback((partId: string, photo: LocalPartPhoto | null) => {
    setPartPhotos(({ [partId]: _previous, ...others }) => (photo ? { ...others, [partId]: photo } : others));
    if (!photo) {
      setParts((current) =>
        current.map((part) => {
          if (part.id !== partId) return part;
          const { photoUrl: _photoUrl, ...rest } = part;
          return rest;
        })
      );
    }
  }, []);

  const applyScan = (analysis: PartAnalysis, photo: LocalPartPhoto) => {
    setDraftPart((current) => ({
      ...current,
      name: analysis.name ?? current.name,
      brand: analysis.brand ?? current.brand,
      partNumber: analysis.partNumber ?? current.partNumber,
      serialNumber: analysis.serialNumber ?? current.serialNumber,
      origin: analysis.origin ?? current.origin,
      kind: analysis.category ? (toPartCategory(analysis.category) as ManualPartKind) : current.kind,
    }));
    setDraftPhoto(photo);
  };

  const addStockPart = (part: RepairPart) => {
    setParts((current) => [...current, part]);
    setNoParts(false);
    setShowPicker(false);
  };

  const addPart = () => {
    const quantity = parseAmount(draftPart.quantity);
    const unitPrice = parseAmount(draftPart.unitPrice);

    if (!draftPart.name.trim()) {
      showAlert('Pezzo incompleto', 'Scrivi il nome del pezzo.');
      return;
    }
    if (!quantity || unitPrice === null) {
      showAlert('Pezzo incompleto', 'Inserisci quantità e prezzo unitario.');
      return;
    }

    const id = newPartId();
    const part = { name: draftPart.name.trim(), quantity, unitPrice };
    const serialNumber = draftPart.serialNumber.trim();
    setParts((current) => [
      ...current,
      {
        ...part,
        id,
        unitCost: unitPrice,
        totalPrice: getPartTotal(part),
        brand: draftPart.brand.trim(),
        partNumber: draftPart.partNumber.trim(),
        category: draftPart.kind,
        source: draftPart.source,
        ...(draftPart.origin ? { origin: draftPart.origin } : {}),
        ...(serialNumber ? { serialNumber } : {}),
      },
    ]);
    if (draftPhoto) {
      setPartPhoto(id, draftPhoto);
    }
    setDraftPart(emptyPart);
    setDraftPhoto(null);
    setNoParts(false);
  };

  const addPhotos = (images: { uri: string; fileName?: string }[], kind: InterventionPhotoKind) => {
    setPhotos((current) => [
      ...current.filter((photo) => photo.kind !== kind),
      ...images.map(({ uri, fileName }) => ({ uri, fileName, kind })),
    ]);
  };

  const submit = async () => {
    if (!car || !repair || !user?.id) return;

    if (labor === null) {
      showAlert('Costo mancante', 'Inserisci la manodopera. Scrivi 0 se non è prevista.');
      return;
    }
    if (parts.length === 0 && !noParts) {
      showAlert('Pezzi mancanti', 'Aggiungi i pezzi usati oppure indica che non ne hai sostituiti.');
      return;
    }
    if (totals.total <= 0) {
      showAlert('Costo mancante', "L'intervento deve avere un costo.");
      return;
    }

    setShowPartIssues(true);
    if (partIssues.size > 0) {
      showAlert(
        'Dati dei pezzi mancanti',
        `Completa ${partIssues.size === 1 ? 'la riga segnata' : `le ${partIssues.size} righe segnate`} in rosso nell'elenco dei pezzi.`
      );
      return;
    }

    try {
      setSubmitting(true);
      setStockIssue(null);
      setStockNotice(null);
      const partsWithPhotos = await InterventionService.uploadPartPhotos(
        parts,
        partPhotos,
        user.id,
        repair.id,
        uploadedPhotos.current
      );
      const uploaded = await InterventionService.uploadPhotos(photos, user.id, repair.id, uploadedPhotos.current);

      await InterventionService.completeIntervention({
        car,
        repair,
        parts: partsWithPhotos,
        laborCost: labor,
        notes: notes.trim(),
        mileage: parseAmount(mileage) ?? undefined,
        photos: uploaded,
        mechanicId: user.id,
        mechanicName: user.name || '',
      });

      let invoiceFailed = false;
      if (createInvoice) {
        try {
          const today = new Date();
          const due = new Date(today);
          due.setDate(due.getDate() + 30);

          const invoiceId = await addInvoice({
            type: 'customer',
            status: 'sent',
            issueDate: toDayString(today),
            dueDate: toDayString(due),
            customerId: car.ownerId,
            customerName: car.owner,
            customerEmail: car.ownerEmail,
            items: [
              ...parts.map((part) => ({
                id: part.id,
                description: part.name,
                quantity: part.quantity,
                unitPrice: part.unitPrice,
                vatRate: VAT_RATE,
                total: part.totalPrice,
                vatAmount: Math.round(part.totalPrice * VAT_RATE) / 100,
              })),
              ...(labor > 0
                ? [{
                    id: 'labor',
                    description: 'Manodopera',
                    quantity: 1,
                    unitPrice: labor,
                    vatRate: VAT_RATE,
                    total: labor,
                    vatAmount: Math.round(labor * VAT_RATE) / 100,
                  }]
                : []),
            ],
            subtotal: totals.subtotal,
            totalVat: totals.vatAmount,
            totalAmount: totals.total,
            totalDiscount: 0,
            notes: `${car.make} ${car.model} ${car.licensePlate}`,
            carId: car.id,
            repairId: repair.id,
          });

          // Va collegata all'intervento appena aggiornato, non a quello aperto in schermata
          await fetchCars(user.id);
          await InterventionService.linkInvoice(
            useWorkshopStore.getState().cars.find((item) => item.id === car.id) ?? car,
            repair,
            invoiceId
          );
        } catch (error) {
          console.error('Errore creazione fattura:', error);
          invoiceFailed = true;
        }
      }

      await fetchCars(user.id);
      showAlert(
        'Lavori completati',
        invoiceFailed
          ? "L'auto è pronta per il ritiro, ma la fattura non è stata creata: creala da Fatturazione."
          : "L'auto è pronta per il ritiro e il cliente può vedere costi, pezzi e foto.",
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Errore completamento intervento:', error);
      if (error instanceof InsufficientStockError) {
        setStockIssue(error);
        setCorrectingStock(false);
        setCountedStock('');
        setStockError(null);
        return;
      }
      if (error instanceof InterventionAlreadyClosedError) {
        fetchCars(user.id);
        showAlert('Intervento non più aperto', error.message, [{ text: 'OK', onPress: () => navigation.goBack() }]);
        return;
      }
      showAlert('Errore', 'Impossibile completare i lavori. Nessun dato è stato perso: riprova.');
    } finally {
      setSubmitting(false);
    }
  };

  const correctStock = async () => {
    if (!stockIssue || !car || !repair || !user?.id || savingStock) return;

    const counted = parseAmount(countedStock);
    if (counted === null) {
      setStockError('Inserisci la quantità contata. Scrivi 0 se non ce n\'è.');
      return;
    }

    try {
      setSavingStock(true);
      setStockError(null);
      await inventoryService.adjustStock(
        stockIssue.itemId,
        {
          quantity: counted,
          reason: 'Rettifica alla chiusura lavori',
          carId: car.id,
          repairId: repair.id,
          licensePlate: car.licensePlate,
        },
        user.id
      );
      setStockNotice(`Giacenza di ${stockIssue.itemName} aggiornata a ${formatQuantity(counted)}. Puoi riprovare.`);
      setStockIssue(null);
      inventory.reload();
    } catch (error) {
      console.error('Errore rettifica giacenza:', error);
      setStockError('Impossibile aggiornare la giacenza. Riprova.');
    } finally {
      setSavingStock(false);
    }
  };

  if (!car || !repair) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <MechanicHeader title="Completa lavori" onBack={() => navigation.goBack()} />
        <MechanicEmptyState icon={AlertCircle} title="Caricamento intervento..." />
      </SafeAreaView>
    );
  }

  const cardStyle = [styles.card, { backgroundColor: theme.surface, borderColor: theme.border }];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <MechanicHeader
        title="Completa lavori"
        subtitle={`${car.make} ${car.model} · ${car.licensePlate}`}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, !isMobile && styles.contentWide]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={cardStyle}>
            <Text style={[styles.title, { color: theme.text }]} accessibilityRole="header">Pezzi usati</Text>

            {parts.map((part) => (
              <PartEditor
                key={part.id}
                part={part}
                photo={partPhotos[part.id]}
                photoRequired={requiresMountedPhoto(partPhotoCategory(part, itemCategories))}
                issues={showPartIssues ? partIssues.get(part.id) ?? NO_ISSUES : NO_ISSUES}
                disabled={submitting}
                theme={theme}
                onChange={changePart}
                onPhoto={setPartPhoto}
                onRemove={removePart}
              />
            ))}

            <TouchableOpacity
              style={[styles.outlineButton, { borderColor: theme.primary }]}
              onPress={() => setShowPicker(true)}
              accessibilityRole="button"
            >
              <Box size={18} color={theme.primary} strokeWidth={2} />
              <Text style={[styles.buttonText, { color: theme.primary }]}>Dal magazzino</Text>
            </TouchableOpacity>

            <Text style={[styles.small, { color: theme.textSecondary }]}>Oppure aggiungi un pezzo fuori scheda</Text>

            <PartPhotoScanButton onResult={applyScan} onPhotoOnly={setDraftPhoto} disabled={submitting} />
            {draftPhoto ? (
              <View style={styles.partPhotoRow}>
                <Image source={{ uri: draftPhoto.uri }} style={styles.photo} accessibilityLabel="Foto del nuovo pezzo" />
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setDraftPhoto(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Rimuovi la foto del nuovo pezzo"
                >
                  <X size={18} color={theme.error} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ) : (
              <UniversalImagePicker
                label="Oppure allega una foto"
                disabled={submitting}
                onImagesSelected={(images) => {
                  if (images[0]) {
                    setDraftPhoto({ uri: images[0].uri, fileName: images[0].fileName });
                  }
                }}
              />
            )}

            <MechanicTextInput
              value={draftPart.name}
              onChangeText={(name) => setDraftPart((current) => ({ ...current, name }))}
              placeholder="Nome del pezzo"
              accessibilityLabel="Nome del pezzo"
            />
            <View style={styles.row}>
              <View style={styles.flex}>
                <MechanicTextInput
                  value={draftPart.brand}
                  onChangeText={(brand) => setDraftPart((current) => ({ ...current, brand }))}
                  placeholder="Marca"
                  accessibilityLabel="Marca"
                />
              </View>
              <View style={styles.flex}>
                <MechanicTextInput
                  value={draftPart.partNumber}
                  onChangeText={(partNumber) => setDraftPart((current) => ({ ...current, partNumber }))}
                  placeholder="Codice"
                  accessibilityLabel="Codice ricambio"
                />
              </View>
            </View>
            <MechanicTextInput
              value={draftPart.serialNumber}
              onChangeText={(serialNumber) => setDraftPart((current) => ({ ...current, serialNumber }))}
              placeholder="Matricola (solo pezzi unici)"
              accessibilityLabel="Matricola"
            />
            <View style={styles.row}>
              <View style={styles.flex}>
                <MechanicTextInput
                  value={draftPart.quantity}
                  onChangeText={(quantity) => setDraftPart((current) => ({ ...current, quantity }))}
                  placeholder="Quantità"
                  keyboardType="decimal-pad"
                  accessibilityLabel="Quantità"
                />
              </View>
              <View style={styles.flex}>
                <MechanicTextInput
                  value={draftPart.unitPrice}
                  onChangeText={(unitPrice) => setDraftPart((current) => ({ ...current, unitPrice }))}
                  placeholder="Prezzo unitario €"
                  keyboardType="decimal-pad"
                  accessibilityLabel="Prezzo unitario"
                />
              </View>
            </View>
            <ChoiceChips
              label="Provenienza"
              options={ORIGIN_OPTIONS}
              value={draftPart.origin}
              onChange={(origin) => setDraftPart((current) => ({ ...current, origin }))}
            />
            <ChoiceChips
              label="Sorgente"
              options={SOURCE_OPTIONS}
              value={draftPart.source}
              onChange={(source) => setDraftPart((current) => ({ ...current, source }))}
            />
            <ChoiceChips
              label="Tipo di pezzo"
              options={KIND_OPTIONS}
              value={draftPart.kind}
              onChange={(kind) => setDraftPart((current) => ({ ...current, kind }))}
            />
            <TouchableOpacity
              style={[styles.outlineButton, { borderColor: theme.primary }]}
              onPress={addPart}
              accessibilityRole="button"
            >
              <Plus size={18} color={theme.primary} strokeWidth={2} />
              <Text style={[styles.buttonText, { color: theme.primary }]}>Aggiungi pezzo</Text>
            </TouchableOpacity>

            {parts.length === 0 && (
              <View style={styles.switchRow}>
                <Text style={[styles.body, styles.flex, { color: theme.text }]}>Nessun pezzo sostituito</Text>
                <Switch value={noParts} onValueChange={setNoParts} accessibilityLabel="Nessun pezzo sostituito" />
              </View>
            )}
          </View>

          <View style={cardStyle}>
            <Text style={[styles.title, { color: theme.text }]} accessibilityRole="header">Costi e dettagli</Text>
            <Text style={[styles.small, { color: theme.textSecondary }]}>Importi IVA esclusa</Text>
            <MechanicTextInput
              value={laborCost}
              onChangeText={setLaborCost}
              placeholder="Manodopera € (obbligatoria)"
              keyboardType="decimal-pad"
              accessibilityLabel="Manodopera"
            />
            <MechanicTextInput
              value={mileage}
              onChangeText={setMileage}
              placeholder="Chilometri alla consegna"
              keyboardType="number-pad"
              accessibilityLabel="Chilometri alla consegna"
            />
            <MechanicTextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Cosa è stato fatto"
              multiline
              accessibilityLabel="Note sul lavoro"
            />
            <AiComingSoonButton feature="workSummary" />
          </View>

          <View style={cardStyle}>
            <Text style={[styles.title, { color: theme.text }]} accessibilityRole="header">Foto</Text>
            <Text style={[styles.small, { color: theme.textSecondary }]}>
              {"Restano nello storico dell'auto e documentano il lavoro in caso di vendita."}
            </Text>
            <UniversalImagePicker
              label="Foto della manutenzione"
              multiple
              maxImages={6}
              onImagesSelected={(images) => addPhotos(images, 'work')}
            />
            {photos.length > 0 && (
              <View style={styles.photoGrid}>
                {photos.map((photo) => (
                  <Image
                    key={photo.uri}
                    source={{ uri: photo.uri }}
                    style={styles.photo}
                    accessibilityLabel="Foto manutenzione"
                  />
                ))}
              </View>
            )}
          </View>

          <View style={cardStyle}>
            {[
              { label: 'Ricambi', value: totals.partsCost },
              { label: 'Manodopera', value: totals.laborCost },
              { label: `IVA ${VAT_RATE}%`, value: totals.vatAmount },
            ].map(({ label, value }) => (
              <View key={label} style={styles.totalRow}>
                <Text style={[styles.body, { color: theme.textSecondary }]}>{label}</Text>
                <Text style={[styles.body, { color: theme.text }]}>{formatCurrency(value)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={[styles.title, { color: theme.text }]}>Totale</Text>
              <Text style={[styles.title, { color: theme.text }]}>{formatCurrency(totals.total)}</Text>
            </View>
            <View style={styles.switchRow}>
              <Text style={[styles.body, styles.flex, { color: theme.text }]}>Crea la fattura</Text>
              <Switch value={createInvoice} onValueChange={setCreateInvoice} accessibilityLabel="Crea la fattura" />
            </View>
          </View>

          {stockIssue && (
            <View
              style={[styles.stockPanel, { backgroundColor: theme.warningLight }]}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              <View style={styles.row}>
                <AlertTriangle size={20} color={theme.warning} strokeWidth={2} />
                <Text style={[styles.body, styles.flex, { color: theme.text }]}>
                  {`Giacenza insufficiente per ${stockIssue.itemName}: disponibili ${formatQuantity(stockIssue.available)}. I lavori non sono stati chiusi e il magazzino non è cambiato.`}
                </Text>
              </View>

              {correctingStock ? (
                <>
                  <MechanicTextInput
                    value={countedStock}
                    onChangeText={setCountedStock}
                    placeholder="Quantità reale contata"
                    keyboardType="decimal-pad"
                    accessibilityLabel="Quantità reale contata"
                    error={!!stockError}
                  />
                  {stockError && (
                    <Text style={[styles.small, { color: theme.error }]} accessibilityRole="alert">{stockError}</Text>
                  )}
                  <TouchableOpacity
                    style={[mechanicButton.primary, { backgroundColor: theme.primary }]}
                    onPress={correctStock}
                    disabled={savingStock}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: savingStock, busy: savingStock }}
                  >
                    {savingStock ? (
                      <ActivityIndicator size="small" color={theme.onPrimary} />
                    ) : (
                      <Text style={[mechanicButtonText.primary, { color: theme.onPrimary }]}>Salva giacenza</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.outlineButton, { borderColor: theme.primary }]}
                  onPress={() => setCorrectingStock(true)}
                  accessibilityRole="button"
                >
                  <Text style={[styles.buttonText, { color: theme.primary }]}>Correggi giacenza</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {stockNotice && (
            <Text style={[styles.body, { color: theme.success }]} accessibilityRole="alert">{stockNotice}</Text>
          )}

          <TouchableOpacity
            style={[styles.submit, { backgroundColor: theme.primary }, savingStock && styles.disabled]}
            onPress={submit}
            disabled={submitting || savingStock}
            accessibilityRole="button"
            accessibilityState={{ disabled: submitting || savingStock, busy: submitting }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={theme.onPrimary} />
            ) : (
              <>
                <Check size={20} color={theme.onPrimary} strokeWidth={2} />
                <Text style={[styles.submitText, { color: theme.onPrimary }]}>Pronta per il ritiro</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <InventoryPartPicker
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={addStockPart}
        items={inventory.items}
        cars={inventory.cars}
        loading={inventory.loading}
        error={inventory.error}
        onRetry={inventory.reload}
        description={repair.description}
        make={car.make}
        model={car.model}
        pendingParts={unsavedParts}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  contentWide: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  card: {
    ...mechanicCard,
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    fontSize: 16,
  },
  small: {
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  flex: {
    flex: 1,
  },
  partRow: {
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  partHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockPanel: {
    gap: 12,
    padding: 16,
    borderRadius: mechanicRadius.lg,
  },
  disabled: {
    opacity: 0.6,
  },
  partBody: {
    flex: 1,
    minWidth: 0,
  },
  partName: {
    fontSize: 16,
    fontWeight: '600',
  },
  iconButton: {
    width: MECHANIC_MIN_TOUCH,
    height: MECHANIC_MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: MECHANIC_MIN_TOUCH,
    borderWidth: 1,
    borderRadius: mechanicRadius.md,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: MECHANIC_MIN_TOUCH,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photo: {
    width: 84,
    height: 84,
    borderRadius: mechanicRadius.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  submit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: mechanicRadius.md,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CompleteInterventionScreen;

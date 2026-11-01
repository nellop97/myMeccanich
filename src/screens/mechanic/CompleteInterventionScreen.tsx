// src/screens/mechanic/CompleteInterventionScreen.tsx
// Chiusura dei lavori: pezzi usati, costi e foto che finiscono nello storico del veicolo
import { useNavigation, useRoute } from '@react-navigation/native';
import { AlertCircle, Check, Plus, Trash2 } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
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
import UniversalImagePicker from '../../components/UniversalImagePicker';
import InterventionService, { InterventionPhotoKind, LocalPhoto } from '../../services/InterventionService';
import { useStore } from '../../store';
import { useInvoicingStore } from '../../store/invoicingStore';
import { RepairPart, useWorkshopStore } from '../../store/workshopStore';
import { toDayString } from '../../utils/calendarGrid';
import { VAT_RATE, calculateInterventionTotals, getPartTotal, parseAmount } from '../../utils/interventionTotals';
import { showAlert } from '../../utils/platformHelpers';
import MechanicHeader from './MechanicHeader';
import { MechanicEmptyState } from './MechanicStates';
import MechanicTextInput from './MechanicTextInput';
import { MECHANIC_MIN_TOUCH, mechanicCard, mechanicRadius, useMechanicBreakpoints, useMechanicTheme } from './mechanicTheme';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);

const emptyPart = { name: '', brand: '', partNumber: '', quantity: '1', unitPrice: '' };

const CompleteInterventionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { carId, repairId } = route.params;
  const { user } = useStore();
  const theme = useMechanicTheme();
  const { isMobile } = useMechanicBreakpoints();
  const { cars, fetchCars } = useWorkshopStore();
  const { addInvoice } = useInvoicingStore();

  const car = cars.find((item) => item.id === carId);
  const repair = car?.repairs.find((item) => item.id === repairId);

  const [parts, setParts] = useState<RepairPart[]>([]);
  const [draftPart, setDraftPart] = useState(emptyPart);
  const [noParts, setNoParts] = useState(false);
  const [laborCost, setLaborCost] = useState('');
  const [mileage, setMileage] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [createInvoice, setCreateInvoice] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

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

    const part = { name: draftPart.name.trim(), quantity, unitPrice };
    setParts((current) => [
      ...current,
      {
        ...part,
        id: `part_${Date.now()}`,
        unitCost: unitPrice,
        totalPrice: getPartTotal(part),
        brand: draftPart.brand.trim(),
        partNumber: draftPart.partNumber.trim(),
      },
    ]);
    setDraftPart(emptyPart);
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

    try {
      setSubmitting(true);
      const uploaded = await InterventionService.uploadPhotos(photos, user.id, repair.id);

      await InterventionService.completeIntervention({
        car,
        repair,
        parts,
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
      showAlert('Errore', 'Impossibile completare i lavori. Nessun dato è stato perso: riprova.');
    } finally {
      setSubmitting(false);
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
              <View key={part.id} style={[styles.partRow, { borderColor: theme.border }]}>
                <View style={styles.partBody}>
                  <Text style={[styles.partName, { color: theme.text }]}>{part.name}</Text>
                  <Text style={[styles.small, { color: theme.textSecondary }]}>
                    {part.quantity} × {formatCurrency(part.unitPrice)}
                    {part.brand ? ` · ${part.brand}` : ''}
                    {part.partNumber ? ` · ${part.partNumber}` : ''}
                  </Text>
                </View>
                <Text style={[styles.partName, { color: theme.text }]}>{formatCurrency(part.totalPrice)}</Text>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setParts((current) => current.filter((item) => item.id !== part.id))}
                  accessibilityRole="button"
                  accessibilityLabel={`Rimuovi ${part.name}`}
                >
                  <Trash2 size={18} color={theme.error} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}

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
            <UniversalImagePicker
              label="Foto dei ricambi usati"
              multiple
              maxImages={6}
              onImagesSelected={(images) => addPhotos(images, 'part')}
            />
            {photos.length > 0 && (
              <View style={styles.photoGrid}>
                {photos.map((photo) => (
                  <Image
                    key={photo.uri}
                    source={{ uri: photo.uri }}
                    style={styles.photo}
                    accessibilityLabel={photo.kind === 'part' ? 'Foto ricambio' : 'Foto manutenzione'}
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

          <TouchableOpacity
            style={[styles.submit, { backgroundColor: theme.primary }]}
            onPress={submit}
            disabled={submitting}
            accessibilityRole="button"
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
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

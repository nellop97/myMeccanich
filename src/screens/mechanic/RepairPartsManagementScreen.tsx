// src/screens/mechanic/RepairPartsManagementScreen.tsx
// REFACTORED: Modern UI with responsive design for web and mobile

import { useNavigation, useRoute } from '@react-navigation/native';
import {
  AlertCircle,
  Box,
  Calendar,
  DollarSign,
  Edit3,
  Package,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Trash2,
  User,
  Wrench,
} from 'lucide-react-native';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useStore } from '../../store';
import { Part, useWorkshopStore } from '../../store/workshopStore';
import { confirmAction, showAlert } from '../../utils/platformHelpers';

import { mechanicButton, mechanicCard, mechanicStaticColors, useMechanicTheme, useMechanicBreakpoints } from './mechanicTheme';
import MechanicTextInput from './MechanicTextInput';
import { MechanicEmptyState, MechanicLoadingState } from './MechanicStates';

import MechanicHeader from './MechanicHeader';
interface RouteParams {
  carId?: string;
  repairId?: string;
}

interface PartFormData {
  name: string;
  quantity: string;
  unitCost: string;
  category: 'ricambio' | 'fluido' | 'consumabile' | 'accessorio';
  brand: string;
  partNumber: string;
  supplier: string;
}

// Componente separato per il form di aggiunta/modifica parti
const PartFormSheet = ({
  visible,
  onClose,
  onSave,
  editingPart,
  theme
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: PartFormData) => Promise<void>;
  editingPart: Part | null;
  theme: any;
}) => {
  const [formData, setFormData] = useState<PartFormData>({
    name: '',
    quantity: '1',
    unitCost: '0.00',
    category: 'ricambio',
    brand: '',
    partNumber: '',
    supplier: '',
  });
  const [saving, setSaving] = useState(false);

  const { isDesktop, height: windowHeight } = useMechanicBreakpoints();
  const slideAnimation = React.useRef(new Animated.Value(windowHeight)).current;

  React.useEffect(() => {
    if (editingPart) {
      setFormData({
        name: editingPart.name,
        quantity: editingPart.quantity.toString(),
        unitCost: editingPart.unitCost.toString(),
        category: editingPart.category || 'ricambio',
        brand: editingPart.brand || '',
        partNumber: editingPart.partNumber || '',
        supplier: editingPart.supplier || '',
      });
    } else {
      setFormData({
        name: '',
        quantity: '1',
        unitCost: '0.00',
        category: 'ricambio',
        brand: '',
        partNumber: '',
        supplier: '',
      });
    }
  }, [editingPart]);

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnimation, {
        toValue: windowHeight,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // La chiusura spetta a onSave: il form resta aperto se la scrittura fallisce
  const handleSave = async () => {
    if (saving) return;
    if (!formData.name.trim()) {
      showAlert('Errore', 'Il nome del pezzo è obbligatorio');
      return;
    }
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  const handleClose = () => {
    if (!saving) onClose();
  };

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.sheetOverlay} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sheetContainer,
          isDesktop && styles.sheetContainerDesktop,
          {
            maxHeight: windowHeight * (isDesktop ? 0.85 : 0.9),
            minHeight: windowHeight * 0.7,
            backgroundColor: theme.surface,
            transform: [{ translateY: slideAnimation }]
          }
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetContent}
        >
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              {editingPart ? 'Modifica Pezzo' : 'Aggiungi Pezzo'}
            </Text>
          </View>

          <ScrollView style={styles.sheetForm} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Nome Pezzo *</Text>
              <MechanicTextInput
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Es. Olio motore 5W-30"
              />
            </View>

            <View style={isDesktop ? styles.formRowDesktop : styles.formRow}>
              <View style={[styles.formGroup, isDesktop && { flex: 1, marginRight: 12 }]}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Quantità *</Text>
                <MechanicTextInput
                  value={formData.quantity}
                  onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                  keyboardType="numeric"
                  placeholder="1"
                />
              </View>
              <View style={[styles.formGroup, isDesktop && { flex: 1, marginLeft: 12 }]}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Prezzo Unitario (€) *</Text>
                <MechanicTextInput
                  value={formData.unitCost}
                  onChangeText={(text) => setFormData({ ...formData, unitCost: text })}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Categoria</Text>
              <View style={styles.categoryGrid}>
                {[
                  { key: 'ricambio', label: 'Ricambio', icon: <Settings size={14} color={theme.primary} /> },
                  { key: 'fluido', label: 'Fluido', icon: <Box size={14} color={theme.warning} /> },
                  { key: 'consumabile', label: 'Consumabile', icon: <Package size={14} color={theme.success} /> },
                  { key: 'accessorio', label: 'Accessorio', icon: <Plus size={14} color={theme.textSecondary} /> },
                ].map((category) => (
                  <TouchableOpacity
                    key={category.key}
                    style={[
                      styles.categoryChip,
                      { borderColor: theme.border },
                      formData.category === category.key && {
                        backgroundColor: theme.primary,
                        borderColor: theme.primary
                      }
                    ]}
                    onPress={() => setFormData({ ...formData, category: category.key as any })}
                  >
                    {formData.category === category.key && category.icon}
                    <Text style={[
                      styles.categoryChipText,
                      {
                        color: formData.category === category.key ? theme.onPrimary : theme.text,
                        marginLeft: formData.category === category.key ? 4 : 0
                      }
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Marca</Text>
              <MechanicTextInput
                value={formData.brand}
                onChangeText={(text) => setFormData({ ...formData, brand: text })}
                placeholder="Es. Castrol, Bosch, Brembo"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Codice Pezzo</Text>
              <MechanicTextInput
                value={formData.partNumber}
                onChangeText={(text) => setFormData({ ...formData, partNumber: text })}
                placeholder="Es. CTR-5W30-1L"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Fornitore</Text>
              <MechanicTextInput
                value={formData.supplier}
                onChangeText={(text) => setFormData({ ...formData, supplier: text })}
                placeholder="Es. Ricambi Auto SpA"
              />
            </View>

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.border }]}
                onPress={handleClose}
                disabled={saving}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Annulla</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primary }, saving && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Save size={20} color={theme.onPrimary} />
                <Text style={styles.saveButtonText}>
                  {saving ? 'Salvataggio...' : editingPart ? 'Aggiorna' : 'Aggiungi'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
};

const RepairPartsManagementScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { carId = '', repairId = '' } = (route.params ?? {}) as RouteParams;

  const { user } = useStore();
  const { isDesktop, isMobile } = useMechanicBreakpoints();

  const theme = useMechanicTheme();
  const {
    getCarById,
    getRepairDetails,
    addPartToRepair,
    updateRepairPart,
    deleteRepairPart,
    updateRepair,
    fetchCars,
  } = useWorkshopStore();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [laborCost, setLaborCost] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [notes, setNotes] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const car = getCarById(carId);
  const repair = getRepairDetails(carId, repairId);


  // Carica i dati al mount e quando cambia carId/repairId
  const loadRepairData = useCallback(async () => {
    if (!user?.id || !carId || !repairId) {
      setInitialLoading(false);
      return;
    }
    console.log('🔧 Caricamento dati riparazione...');
    setInitialLoading(true);
    await fetchCars(user.id);
    setLoadFailed(!!useWorkshopStore.getState().error);
    setInitialLoading(false);
  }, [user?.id, carId, repairId, fetchCars]);

  useEffect(() => {
    loadRepairData();
  }, [loadRepairData]);

  // Inizializza form quando repair è caricato
  useEffect(() => {
    if (repair && laborCost === '' && estimatedHours === '' && notes === '') {
      setLaborCost(repair.laborCost?.toString() || '0');
      setEstimatedHours(repair.estimatedHours?.toString() || '0');
      setNotes(repair.notes || '');
    }
  }, [repair?.id]);

  const handleRefresh = useCallback(async () => {
    if (user?.id) {
      setRefreshing(true);
      await fetchCars(user.id);
      setRefreshing(false);
    }
  }, [user?.id, fetchCars]);

  const handleSavePart = useCallback(async (formData: PartFormData) => {
    const partData = {
      name: formData.name,
      quantity: parseInt(formData.quantity) || 1,
      unitCost: parseFloat(formData.unitCost) || 0,
      unitPrice: parseFloat(formData.unitCost) || 0,
      totalPrice: (parseInt(formData.quantity) || 1) * (parseFloat(formData.unitCost) || 0),
      category: formData.category,
      brand: formData.brand,
      partNumber: formData.partNumber,
      supplier: formData.supplier,
    };

    try {
      if (editingPart) {
        await updateRepairPart(carId, repairId, editingPart.id, partData);
      } else {
        await addPartToRepair(carId, repairId, partData);
      }

      setEditingPart(null);
      setShowAddSheet(false);
    } catch (error) {
      console.error('Errore salvataggio pezzo:', error);
      showAlert('Errore', 'Impossibile salvare il pezzo. Riprova.');
    }
  }, [editingPart, carId, repairId, updateRepairPart, addPartToRepair]);

  const handleEditPart = useCallback((part: Part) => {
    setEditingPart(part);
    setShowAddSheet(true);
  }, []);

  const handleDeletePart = useCallback((partId: string) => {
    confirmAction(
      'Conferma eliminazione',
      'Sei sicuro di voler eliminare questo pezzo?',
      'Elimina',
      async () => {
        try {
          await deleteRepairPart(carId, repairId, partId);
        } catch (error) {
          console.error('Errore eliminazione pezzo:', error);
          showAlert('Errore', 'Impossibile eliminare il pezzo. Riprova.');
        }
      }
    );
  }, [carId, repairId, deleteRepairPart]);

  const handleSaveRepairDetails = useCallback(async () => {
    setSavingDetails(true);
    try {
      await updateRepair(carId, repairId, {
        laborCost: parseFloat(laborCost) || 0,
        estimatedHours: parseFloat(estimatedHours) || 0,
        notes: notes,
      });
      showAlert('Successo', 'Dettagli riparazione salvati');
    } catch (error) {
      console.error('Errore salvataggio dettagli riparazione:', error);
      showAlert('Errore', 'Impossibile salvare i dettagli della riparazione. Riprova.');
    } finally {
      setSavingDetails(false);
    }
  }, [carId, repairId, laborCost, estimatedHours, notes, updateRepair]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ricambio': return <Settings size={16} color={theme.primary} />;
      case 'fluido': return <Box size={16} color={theme.warning} />;
      case 'consumabile': return <Package size={16} color={theme.success} />;
      case 'accessorio': return <Plus size={16} color={theme.textSecondary} />;
      default: return <Package size={16} color={theme.textSecondary} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ricambio': return theme.primary;
      case 'fluido': return theme.warning;
      case 'consumabile': return theme.success;
      case 'accessorio': return theme.textSecondary;
      default: return theme.textSecondary;
    }
  };

  const partsCost = useMemo(() =>
    repair?.parts.reduce((sum, part) => sum + (part.quantity * part.unitCost), 0) || 0,
    [repair?.parts]
  );

  const totalCost = useMemo(() =>
    (repair?.laborCost || 0) + partsCost,
    [repair?.laborCost, partsCost]
  );

  // Il return anticipato deve restare dopo tutti gli hook
  if (!car || !repair) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

        <MechanicHeader title="Gestione Intervento" onBack={() => navigation.goBack()} />

        {initialLoading ? (
          <MechanicLoadingState text="Caricamento dati riparazione..." />
        ) : loadFailed ? (
          <MechanicEmptyState
            icon={AlertCircle}
            title="Impossibile caricare l'intervento"
            subtitle="Controlla la connessione e riprova."
            actionLabel="Riprova"
            onAction={loadRepairData}
            style={styles.stateContainer}
          />
        ) : (
          <MechanicEmptyState
            icon={Wrench}
            title="Intervento non trovato"
            subtitle="L'intervento non è stato selezionato oppure non è più disponibile."
            style={styles.stateContainer}
          />
        )}
      </SafeAreaView>
    );
  }

  const renderPartItem = ({ item: part }: { item: Part }) => (
    <View style={[
      styles.partCard,
      { backgroundColor: theme.surface, borderColor: theme.border },
    ]}>
      <View style={styles.partHeader}>
        <View style={styles.partMainInfo}>
          <View style={styles.partTitleRow}>
            {getCategoryIcon(part.category)}
            <Text style={[styles.partName, { color: theme.text }]}>{part.name}</Text>
          </View>
          {part.brand && (
            <Text style={[styles.partBrand, { color: theme.textSecondary }]}>
              {part.brand} {part.partNumber && `• ${part.partNumber}`}
            </Text>
          )}
        </View>

        <View style={styles.partActions}>
          <TouchableOpacity
            style={[styles.actionIconButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => handleEditPart(part)}
          >
            <Edit3 size={16} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionIconButton, { backgroundColor: theme.error + '20' }]}
            onPress={() => handleDeletePart(part.id)}
          >
            <Trash2 size={16} color={theme.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.partDetails}>
        <View style={styles.partDetailRow}>
          <Text style={[styles.partDetailLabel, { color: theme.textSecondary }]}>Quantità:</Text>
          <Text style={[styles.partDetailValue, { color: theme.text }]}>{part.quantity}</Text>
        </View>
        <View style={styles.partDetailRow}>
          <Text style={[styles.partDetailLabel, { color: theme.textSecondary }]}>Prezzo unitario:</Text>
          <Text style={[styles.partDetailValue, { color: theme.text }]}>€{part.unitCost.toFixed(2)}</Text>
        </View>
        <View style={styles.partDetailRow}>
          <Text style={[styles.partDetailLabel, { color: theme.textSecondary }]}>Totale:</Text>
          <Text style={[styles.partTotalPrice, { color: theme.primary }]}>
            €{(part.quantity * part.unitCost).toFixed(2)}
          </Text>
        </View>
        {part.supplier && (
          <View style={styles.partDetailRow}>
            <Text style={[styles.partDetailLabel, { color: theme.textSecondary }]}>Fornitore:</Text>
            <Text style={[styles.partDetailValue, { color: theme.textSecondary }]}>{part.supplier}</Text>
          </View>
        )}
      </View>

      <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(part.category) + '20' }]}>
        <Text style={[styles.categoryText, { color: getCategoryColor(part.category) }]}>
          {part.category?.toUpperCase()}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      <MechanicHeader
        title="Gestione Intervento"
        subtitle={`${car.licensePlate} • ${car.make} ${car.model}`}
        onBack={() => navigation.goBack()}
        right={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.refreshButton, { backgroundColor: theme.primary + '15' }]}
              onPress={handleRefresh}
              accessibilityRole="button"
              accessibilityLabel="Aggiorna"
            >
              <RefreshCw size={18} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }, isDesktop && styles.addButtonDesktop]}
              onPress={() => {
                setEditingPart(null);
                setShowAddSheet(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Aggiungi pezzo"
            >
              <Plus size={20} color={theme.onPrimary} />
              {isDesktop && <Text style={styles.addButtonText}>Aggiungi Pezzo</Text>}
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, isDesktop && styles.contentContainerDesktop]}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        {/* Layout responsive: 2 colonne su desktop, 1 su mobile */}
        <View style={isMobile ? styles.singleColumnLayout : styles.twoColumnLayout}>
          {/* Colonna sinistra su desktop - Dettagli e Costi */}
          <View style={isMobile ? null : styles.leftColumn}>
            {/* Informazioni Riparazione */}
            <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.sectionHeader}>
                <Wrench size={20} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Dettagli Intervento</Text>
              </View>

              <View style={styles.sectionContent}>
                <Text style={[styles.repairDescription, { color: theme.text }]}>{repair.description}</Text>

                <View style={styles.repairInfo}>
                  <View style={styles.infoRow}>
                    <Calendar size={16} color={theme.textSecondary} />
                    <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                      Data: {new Date(repair.scheduledDate).toLocaleDateString('it-IT')}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <User size={16} color={theme.textSecondary} />
                    <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                      Cliente: {car.owner}
                    </Text>
                  </View>
                  {car.ownerPhone && (
                    <View style={styles.infoRow}>
                      <User size={16} color={theme.textSecondary} />
                      <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                        Telefono: {car.ownerPhone}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Form per dettagli riparazione */}
                <View style={styles.repairDetailsForm}>
                  <View style={isDesktop ? styles.formRowDesktop : styles.formRow}>
                    <View style={[styles.formGroup, isDesktop && { flex: 1, marginRight: 12 }]}>
                      <Text style={[styles.formLabel, { color: theme.text }]}>Costo Manodopera (€)</Text>
                      <MechanicTextInput
                        value={laborCost}
                        onChangeText={setLaborCost}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                      />
                    </View>
                    <View style={[styles.formGroup, isDesktop && { flex: 1, marginLeft: 12 }]}>
                      <Text style={[styles.formLabel, { color: theme.text }]}>Ore Stimate</Text>
                      <MechanicTextInput
                        value={estimatedHours}
                        onChangeText={setEstimatedHours}
                        keyboardType="decimal-pad"
                        placeholder="0.0"
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>Note</Text>
                    <MechanicTextInput
                      style={styles.formTextArea}
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      numberOfLines={3}
                      placeholder="Aggiungi note sull'intervento..."
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.saveDetailsButton, { backgroundColor: theme.success }, savingDetails && styles.buttonDisabled]}
                    onPress={handleSaveRepairDetails}
                    disabled={savingDetails}
                  >
                    <Save size={16} color={theme.onPrimary} />
                    <Text style={styles.saveDetailsButtonText}>
                      {savingDetails ? 'Salvataggio...' : 'Salva Dettagli'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Riepilogo Costi */}
            <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.sectionHeader}>
                <DollarSign size={20} color={theme.success} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Riepilogo Costi</Text>
              </View>

              <View style={styles.sectionContent}>
                <View style={styles.costBreakdown}>
                  <View style={styles.costRow}>
                    <Text style={[styles.costLabel, { color: theme.textSecondary }]}>Manodopera:</Text>
                    <Text style={[styles.costValue, { color: theme.text }]}>€{(repair.laborCost || 0).toFixed(2)}</Text>
                  </View>
                  <View style={styles.costRow}>
                    <Text style={[styles.costLabel, { color: theme.textSecondary }]}>Ricambi ({repair.parts.length}):</Text>
                    <Text style={[styles.costValue, { color: theme.text }]}>€{partsCost.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.costRow, styles.totalCostRow, { borderColor: theme.border }]}>
                    <Text style={[styles.totalCostLabel, { color: theme.text }]}>Totale:</Text>
                    <Text style={[styles.totalCostValue, { color: theme.primary }]}>€{totalCost.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Colonna destra su desktop - Lista Pezzi */}
          <View style={isMobile ? null : styles.rightColumn}>
            {/* Lista Pezzi */}
            <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.sectionHeader}>
                <Package size={20} color={theme.warning} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Pezzi e Materiali ({repair.parts.length})
                </Text>
              </View>

              <View style={styles.sectionContent}>
                {repair.parts.length === 0 ? (
                  <MechanicEmptyState
                    icon={Package}
                    title="Nessun pezzo aggiunto"
                    subtitle="Tocca il pulsante + per aggiungere pezzi e materiali"
                  />
                ) : (
                  <FlatList
                    data={repair.parts}
                    renderItem={renderPartItem}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    contentContainerStyle={{ paddingBottom: 12 }}
                  />
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sheet per aggiunta/modifica parti */}
      <PartFormSheet
        visible={showAddSheet}
        onClose={() => {
          setShowAddSheet(false);
          setEditingPart(null);
        }}
        onSave={handleSavePart}
        editingPart={editingPart}
        theme={theme}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  refreshButton: mechanicButton.icon,
  addButton: mechanicButton.icon,
  addButtonDesktop: {
    paddingHorizontal: 16,
    gap: 6,
  },
  addButtonText: {
    color: mechanicStaticColors.onPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  contentContainerDesktop: {
    padding: 24,
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
  },
  singleColumnLayout: {
    width: '100%',
  },
  twoColumnLayout: {
    flexDirection: 'row',
    gap: 24,
    width: '100%',
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },
  section: {
    ...mechanicCard,
    padding: 0,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: mechanicStaticColors.divider,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sectionContent: {
    padding: 16,
  },
  repairDescription: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  repairInfo: {
    gap: 8,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: mechanicStaticColors.divider,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  repairDetailsForm: {
    gap: 12,
  },
  formRow: {
    gap: 12,
  },
  formRowDesktop: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroup: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  formTextArea: {
    minHeight: 80,
  },
  saveDetailsButton: mechanicButton.primary,
  saveDetailsButtonText: {
    color: mechanicStaticColors.onPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  costBreakdown: {
    gap: 8,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  costLabel: {
    fontSize: 14,
  },
  costValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalCostRow: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 16,
  },
  totalCostLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalCostValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  partCard: {
    ...mechanicCard,
    position: 'relative',
  },
  partHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  partMainInfo: {
    flex: 1,
  },
  partTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  partName: {
    fontSize: 16,
    fontWeight: '500',
  },
  partBrand: {
    fontSize: 12,
    marginLeft: 24,
  },
  partActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconButton: {
    padding: 8,
    borderRadius: 8,
  },
  partDetails: {
    gap: 6,
  },
  partDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partDetailLabel: {
    fontSize: 12,
  },
  partDetailValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  partTotalPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  // Stili per il Bottom Sheet
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: mechanicStaticColors.overlay,
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetContainerDesktop: {
    left: '20%',
    right: '20%',
  },
  sheetContent: {
    flex: 1,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: mechanicStaticColors.divider,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: mechanicStaticColors.divider,
    borderRadius: 2,
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sheetForm: {
    padding: 20,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  cancelButton: {
    ...mechanicButton.secondary,
    flex: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    ...mechanicButton.primary,
    flex: 2,
  },
  saveButtonText: {
    color: mechanicStaticColors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RepairPartsManagementScreen;

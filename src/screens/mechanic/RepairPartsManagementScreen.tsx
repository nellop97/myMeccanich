// src/screens/mechanic/RepairPartsManagementScreen.tsx
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Box,
  Calendar,
  ChevronLeft,
  DollarSign,
  Edit3,
  Package,
  Plus,
  Save,
  Settings,
  Trash2,
  User,
  Wrench,
} from 'lucide-react-native';
import React, { useState, useCallback, useMemo } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useStore } from '../../store';
import { Part, useWorkshopStore } from '../../store/workshopStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface RouteParams {
  carId: string;
  repairId: string;
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
  onSave: (data: PartFormData) => void;
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

  const slideAnimation = React.useRef(new Animated.Value(screenHeight)).current;

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
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      Alert.alert('Errore', 'Il nome del pezzo è obbligatorio');
      return;
    }
    onSave(formData);
    onClose();
  };

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.sheetOverlay} />
      </TouchableWithoutFeedback>
      
      <Animated.View 
        style={[
          styles.sheetContainer,
          { 
            backgroundColor: theme.cardBackground,
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
              <TextInput
                style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Es. Olio motore 5W-30"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Quantità *</Text>
                <TextInput
                  style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                  value={formData.quantity}
                  onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Prezzo Unitario *</Text>
                <TextInput
                  style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                  value={formData.unitCost}
                  onChangeText={(text) => setFormData({ ...formData, unitCost: text })}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Categoria</Text>
              <View style={styles.categoryGrid}>
                {[
                  { key: 'ricambio', label: 'Ricambio' },
                  { key: 'fluido', label: 'Fluido' },
                  { key: 'consumabile', label: 'Consumabile' },
                  { key: 'accessorio', label: 'Accessorio' },
                ].map((category) => (
                  <TouchableOpacity
                    key={category.key}
                    style={[
                      styles.categoryChip,
                      { borderColor: theme.border },
                      formData.category === category.key && { backgroundColor: theme.accent }
                    ]}
                    onPress={() => setFormData({ ...formData, category: category.key as any })}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      { color: formData.category === category.key ? '#ffffff' : theme.text }
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Marca</Text>
              <TextInput
                style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                value={formData.brand}
                onChangeText={(text) => setFormData({ ...formData, brand: text })}
                placeholder="Es. Castrol, Bosch, Brembo"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Codice Pezzo</Text>
              <TextInput
                style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                value={formData.partNumber}
                onChangeText={(text) => setFormData({ ...formData, partNumber: text })}
                placeholder="Es. CTR-5W30-1L"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Fornitore</Text>
              <TextInput
                style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                value={formData.supplier}
                onChangeText={(text) => setFormData({ ...formData, supplier: text })}
                placeholder="Es. Ricambi Auto SpA"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.border }]}
                onPress={onClose}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Annulla</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.accent }]}
                onPress={handleSave}
              >
                <Save size={20} color="#ffffff" />
                <Text style={styles.saveButtonText}>
                  {editingPart ? 'Aggiorna' : 'Aggiungi'}
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
  const { carId, repairId } = route.params as RouteParams;
  
  const { darkMode } = useStore();
  const { 
    getCarById, 
    getRepairDetails, 
    addPartToRepair, 
    updatePartInRepair, 
    removePartFromRepair,
    updateRepair 
  } = useWorkshopStore();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [laborCost, setLaborCost] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [notes, setNotes] = useState('');

  const car = getCarById(carId);
  const repair = getRepairDetails(carId, repairId);

  React.useEffect(() => {
    if (repair && laborCost === '' && estimatedHours === '' && notes === '') {
      setLaborCost(repair.laborCost?.toString() || '0');
      setEstimatedHours(repair.estimatedHours?.toString() || '0');
      setNotes(repair.notes || '');
    }
  }, [repair?.id]);

  const theme = {
    background: darkMode ? '#111827' : '#f3f4f6',
    cardBackground: darkMode ? '#1f2937' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#9ca3af' : '#6b7280',
    border: darkMode ? '#374151' : '#e5e7eb',
    accent: '#2563eb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  };

  if (!car || !repair) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.error }]}>
          Riparazione non trovata
        </Text>
      </SafeAreaView>
    );
  }

  const handleSavePart = useCallback((formData: PartFormData) => {
    const partData = {
      name: formData.name,
      quantity: parseInt(formData.quantity) || 1,
      unitCost: parseFloat(formData.unitCost) || 0,
      category: formData.category,
      brand: formData.brand,
      partNumber: formData.partNumber,
      supplier: formData.supplier,
    };

    if (editingPart) {
      updatePartInRepair(carId, repairId, editingPart.id, partData);
    } else {
      addPartToRepair(carId, repairId, partData);
    }
    
    setEditingPart(null);
    setShowAddSheet(false);
  }, [editingPart, carId, repairId, updatePartInRepair, addPartToRepair]);

  const handleEditPart = useCallback((part: Part) => {
    setEditingPart(part);
    setShowAddSheet(true);
  }, []);

  const handleDeletePart = useCallback((partId: string) => {
    Alert.alert(
      'Conferma eliminazione',
      'Sei sicuro di voler eliminare questo pezzo?',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Elimina', 
          style: 'destructive',
          onPress: () => removePartFromRepair(carId, repairId, partId)
        }
      ]
    );
  }, [carId, repairId, removePartFromRepair]);

  const handleSaveRepairDetails = useCallback(() => {
    updateRepair(carId, repairId, {
      laborCost: parseFloat(laborCost) || 0,
      estimatedHours: parseFloat(estimatedHours) || 0,
      notes: notes,
    });
    Alert.alert('Successo', 'Dettagli riparazione salvati');
  }, [carId, repairId, laborCost, estimatedHours, notes, updateRepair]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ricambio': return <Settings size={16} color={theme.accent} />;
      case 'fluido': return <Box size={16} color={theme.warning} />;
      case 'consumabile': return <Package size={16} color={theme.success} />;
      case 'accessorio': return <Plus size={16} color={theme.textSecondary} />;
      default: return <Package size={16} color={theme.textSecondary} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ricambio': return theme.accent;
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

  const renderPartItem = ({ item: part }: { item: Part }) => (
    <View style={[styles.partCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
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
            style={[styles.actionIconButton, { backgroundColor: theme.accent + '20' }]}
            onPress={() => handleEditPart(part)}
          >
            <Edit3 size={16} color={theme.accent} />
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
          <Text style={[styles.partTotalPrice, { color: theme.accent }]}>
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
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Gestione Intervento</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {car.licensePlate} • {car.model}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.accent }]}
          onPress={() => {
            setEditingPart(null);
            setShowAddSheet(true);
          }}
        >
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informazioni Riparazione */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Wrench size={20} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Dettagli Intervento</Text>
          </View>
          
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
          </View>

          {/* Form per dettagli riparazione */}
          <View style={styles.repairDetailsForm}>
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Costo Manodopera (€)</Text>
                <TextInput
                  style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                  value={laborCost}
                  onChangeText={setLaborCost}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Ore Stimate</Text>
                <TextInput
                  style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                  value={estimatedHours}
                  onChangeText={setEstimatedHours}
                  keyboardType="decimal-pad"
                  placeholder="0.0"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Note</Text>
              <TextInput
                style={[styles.formTextArea, { color: theme.text, borderColor: theme.border }]}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholder="Aggiungi note sull'intervento..."
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveDetailsButton, { backgroundColor: theme.success }]}
              onPress={handleSaveRepairDetails}
            >
              <Save size={16} color="#ffffff" />
              <Text style={styles.saveDetailsButtonText}>Salva Dettagli</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Riepilogo Costi */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <DollarSign size={20} color={theme.success} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Riepilogo Costi</Text>
          </View>
          
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
              <Text style={[styles.totalCostValue, { color: theme.accent }]}>€{totalCost.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Lista Pezzi */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Package size={20} color={theme.warning} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Pezzi e Materiali ({repair.parts.length})
            </Text>
          </View>

          {repair.parts.length === 0 ? (
            <View style={styles.emptyState}>
              <Package size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
                Nessun pezzo aggiunto
              </Text>
              <Text style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}>
                Tocca il pulsante + per aggiungere pezzi e materiali
              </Text>
            </View>
          ) : (
            <FlatList
              data={repair.parts}
              renderItem={renderPartItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
    padding: 10,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  repairDescription: {
    fontSize: 16,
    fontWeight: '500',
    padding: 16,
    paddingBottom: 8,
  },
  repairInfo: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
  },
  repairDetailsForm: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  formTextArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  saveDetailsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  costBreakdown: {
    padding: 16,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  partCard: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  partHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
  },
  partMainInfo: {
    flex: 1,
  },
  partTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  partName: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
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
    padding: 6,
    borderRadius: 6,
  },
  partDetails: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 4,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  // Stili per il Bottom Sheet
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.9,
    minHeight: screenHeight * 0.7,
  },
  sheetContent: {
    flex: 1,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
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
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default RepairPartsManagementScreen;
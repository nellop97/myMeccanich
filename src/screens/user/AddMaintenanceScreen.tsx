// src/screens/user/AddMaintenanceScreen.tsx - VERSIONE COMPLETA
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  ChevronDown,
  Euro,
  FileText,
  Save,
  MapPin,
  User,
  Phone,
  Package,
  Plus,
  X,
  Shield,
  Clock,
  Calendar as CalendarIcon,
  Wrench,
} from 'lucide-react-native';
import { UniversalDatePicker, WorkshopSearchInput } from '../../components';
import { useAppThemeManager } from '../../hooks/useTheme';
import { MaintenanceService } from '../../services/MaintenanceService';
import { VehicleService } from '../../services/VehicleService';
import { useAuth } from '../../hooks/useAuth';
import { Timestamp } from 'firebase/firestore';
import { Switch, Chip } from 'react-native-paper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isTablet = SCREEN_WIDTH >= 768;

interface RouteParams {
  vehicleId?: string;
  carId?: string;
}

interface Part {
  name: string;
  quantity: string; // Text field for flexibility (e.g., "2", "4 pezzi", "set completo")
  cost?: number;
}

const MAINTENANCE_TYPES = [
  { value: 'tagliando', label: 'Tagliando' },
  { value: 'gomme', label: 'Pneumatici' },
  { value: 'freni', label: 'Freni' },
  { value: 'carrozzeria', label: 'Carrozzeria' },
  { value: 'motore', label: 'Motore' },
  { value: 'elettronica', label: 'Elettronica' },
  { value: 'altro', label: 'Altro' },
];

const AddMaintenanceScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params as RouteParams) || {};
  const vehicleId = params.vehicleId || params.carId;
  const { colors, isDark } = useAppThemeManager();
  const { user } = useAuth();
  const maintenanceService = MaintenanceService.getInstance();
  const vehicleService = VehicleService.getInstance();

  // Form state
  const [date, setDate] = useState(new Date());
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [mileage, setMileage] = useState('');

  // Cost fields
  const [cost, setCost] = useState('');
  const [laborCost, setLaborCost] = useState('');
  const [partsCost, setPartsCost] = useState('');

  // Workshop fields
  const [workshopName, setWorkshopName] = useState('');
  const [workshopId, setWorkshopId] = useState<string | null>(null);
  const [mechanicName, setMechanicName] = useState('');
  const [mechanicPhone, setMechanicPhone] = useState('');

  // Parts
  const [parts, setParts] = useState<Part[]>([]);
  const [currentPart, setCurrentPart] = useState<Part>({ name: '', quantity: '1', cost: 0 });

  // Warranty
  const [warranty, setWarranty] = useState(false);
  const [warrantyExpiry, setWarrantyExpiry] = useState<Date | null>(null);

  // Next service
  const [nextServiceDate, setNextServiceDate] = useState<Date | null>(null);
  const [nextServiceMileage, setNextServiceMileage] = useState('');

  // Notes
  const [notes, setNotes] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // UI state
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vehicle, setVehicle] = useState<any>(null);

  useEffect(() => {
    loadVehicle();
  }, [vehicleId]);

  const loadVehicle = async () => {
    if (!vehicleId) return;

    try {
      const vehicleData = await vehicleService.getVehicle(vehicleId);
      setVehicle(vehicleData);

      // Pre-fill current mileage
      if (vehicleData?.mileage) {
        setMileage(vehicleData.mileage.toString());
      }
    } catch (error) {
      console.error('Error loading vehicle:', error);
    }
  };

  const validateForm = () => {
    if (!vehicleId) {
      Alert.alert('Errore', 'Veicolo non specificato');
      return false;
    }
    if (!type) {
      Alert.alert('Errore', 'Seleziona il tipo di intervento');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Errore', 'Inserisci una descrizione');
      return false;
    }
    if (!mileage || parseInt(mileage) <= 0) {
      Alert.alert('Errore', 'Inserisci un chilometraggio valido');
      return false;
    }
    return true;
  };

  const addPart = () => {
    if (!currentPart.name.trim()) {
      Alert.alert('Errore', 'Inserisci il nome del ricambio');
      return;
    }

    setParts([...parts, currentPart]);
    setCurrentPart({ name: '', quantity: '1', cost: 0 });
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    console.log('🚀 ========== SUBMIT MAINTENANCE STARTED ==========');
    console.log('👤 Current user:', user);
    console.log('👤 User UID:', user?.uid);
    console.log('🚗 Route params:', params);
    console.log('🚗 Vehicle ID (vehicleId):', vehicleId);

    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    setIsLoading(true);

    try {
      if (!user?.uid) {
        console.error('❌ CRITICAL: User not authenticated! user:', user);
        throw new Error('Utente non autenticato');
      }

      console.log('✅ User authenticated, UID:', user.uid);

      // Helper function to safely parse numbers
      const safeParseFloat = (value: string): number => {
        const parsed = parseFloat(value.replace(',', '.'));
        return isNaN(parsed) ? 0 : parsed;
      };

      const safeParseInt = (value: string): number => {
        const parsed = parseInt(value);
        return isNaN(parsed) ? 0 : parsed;
      };

      // Calculate total cost safely
      const laborCostNum = laborCost ? safeParseFloat(laborCost) : 0;
      const partsCostNum = partsCost ? safeParseFloat(partsCost) : 0;
      const totalCost = cost ? safeParseFloat(cost) : (laborCostNum + partsCostNum);

      // Build maintenance data object, excluding undefined/invalid fields
      const maintenanceData: any = {
        vehicleId: vehicleId!,
        ownerId: user.uid,
        type: type as any,
        description: description.trim(),
        date: Timestamp.fromDate(date),
        mileage: safeParseInt(mileage),
        cost: totalCost,
        warranty,
        isVisible: true,
        parts: [], // Required field - initialize as empty array
        documents: [], // Required field - initialize as empty array
      };

      // Add parts only if there are any
      if (parts.length > 0) {
        maintenanceData.parts = parts.map(p => {
          const part: any = {
            name: p.name,
            quantity: p.quantity,
          };
          if (p.cost && p.cost > 0) part.cost = p.cost;
          return part;
        });
      }

      // Add optional fields only if they have valid values
      if (laborCost && laborCostNum > 0) maintenanceData.laborCost = laborCostNum;
      if (partsCost && partsCostNum > 0) maintenanceData.partsCost = partsCostNum;
      if (workshopName?.trim()) maintenanceData.workshopName = workshopName.trim();
      if (workshopId) maintenanceData.workshopId = workshopId;
      if (mechanicName?.trim()) maintenanceData.mechanicName = mechanicName.trim();
      if (mechanicPhone?.trim()) maintenanceData.mechanicPhone = mechanicPhone.trim();
      if (warranty && warrantyExpiry) maintenanceData.warrantyExpiry = Timestamp.fromDate(warrantyExpiry);
      if (nextServiceDate) maintenanceData.nextServiceDate = Timestamp.fromDate(nextServiceDate);
      if (nextServiceMileage) {
        const nextMileageNum = safeParseInt(nextServiceMileage);
        if (nextMileageNum > 0) maintenanceData.nextServiceMileage = nextMileageNum;
      }
      if (notes.trim()) maintenanceData.notes = notes.trim();
      if (invoiceNumber.trim()) maintenanceData.invoiceNumber = invoiceNumber.trim();

      console.log('=== ADDMAINTENANCE DEBUG ===');
      console.log('📝 vehicleId parameter:', vehicleId);
      console.log('📝 Form values:', {
        type,
        description: description.trim(),
        mileage,
        cost,
        laborCost,
        partsCost,
        workshopName,
        mechanicName,
        warranty,
        partsCount: parts.length,
      });
      console.log('📝 Maintenance data to send:', maintenanceData);
      console.log('📝 Critical fields:');
      console.log('   - vehicleId:', maintenanceData.vehicleId);
      console.log('   - ownerId:', maintenanceData.ownerId);
      console.log('   - isVisible:', maintenanceData.isVisible);
      console.log('   - parts:', maintenanceData.parts);
      console.log('   - documents:', maintenanceData.documents);
      console.log('📝 Data types:');
      Object.entries(maintenanceData).forEach(([key, value]) => {
        console.log(`  ${key}:`, typeof value, Array.isArray(value) ? `Array(${value.length})` : '');
      });
      console.log('=== END ADDMAINTENANCE DEBUG ===');

      console.log('📤 Sending to Firestore...');
      const savedRecordId = await maintenanceService.addMaintenanceRecord(maintenanceData);
      console.log('✅✅✅ MAINTENANCE SAVED SUCCESSFULLY! ✅✅✅');
      console.log('📋 Record ID:', savedRecordId);
      console.log('🚗 vehicleId in saved record:', maintenanceData.vehicleId);
      console.log('👤 ownerId in saved record:', maintenanceData.ownerId);
      console.log('👁️ isVisible:', maintenanceData.isVisible);
      console.log('📅 date:', maintenanceData.date);

      // Update vehicle mileage if changed
      if (vehicle && parseInt(mileage) > (vehicle.mileage || 0)) {
        await vehicleService.updateVehicle(vehicleId!, {
          mileage: parseInt(mileage),
        });
        console.log('✅ Vehicle mileage updated to:', parseInt(mileage));
      }

      // Cross-platform success handling
      if (Platform.OS === 'web') {
        // Web: Show alert and navigate back immediately
        Alert.alert('Successo', 'Manutenzione registrata con successo!');
        // Small delay to let user see the alert, then navigate
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        // Mobile: Native alert with callback
        Alert.alert('Successo', 'Manutenzione registrata con successo!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      console.error('Error saving maintenance:', error);
      Alert.alert('Errore', 'Impossibile salvare la manutenzione. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyle = isWeb && isTablet ? styles.webContainer : styles.container;

  return (
    <SafeAreaView
      style={[
        containerStyle,
        { backgroundColor: isDark ? colors.background : '#F8F9FA' },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
        ]}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={colors.onSurface} strokeWidth={2} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
          Nuova Manutenzione
        </Text>

        <View style={styles.headerButton} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Info Card */}
          <View
            style={[
              styles.formCard,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
              Informazioni Generali
            </Text>

            {/* Date */}
            <View style={styles.formGroup}>
              <UniversalDatePicker
                value={date}
                onChange={setDate}
                label="Data Intervento"
                mode="date"
                maximumDate={new Date()}
                showCalendar={true}
              />
            </View>

            {/* Type */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Tipo Intervento *
              </Text>
              <TouchableOpacity
                style={[
                  styles.inputContainer,
                  { borderColor: isDark ? '#374151' : '#E5E7EB' },
                ]}
                onPress={() => setShowTypePicker(!showTypePicker)}
              >
                <Wrench
                  size={20}
                  color={colors.onSurfaceVariant}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.inputText,
                    {
                      color: type ? colors.onSurface : colors.onSurfaceVariant,
                      flex: 1,
                    },
                  ]}
                >
                  {type ? MAINTENANCE_TYPES.find(t => t.value === type)?.label : 'Seleziona tipo'}
                </Text>
                <ChevronDown
                  size={20}
                  color={colors.onSurfaceVariant}
                  strokeWidth={2}
                />
              </TouchableOpacity>

              {showTypePicker && (
                <View
                  style={[
                    styles.picker,
                    {
                      backgroundColor: isDark ? colors.surface : '#FFFFFF',
                      borderColor: isDark ? '#374151' : '#E5E7EB',
                    },
                  ]}
                >
                  {MAINTENANCE_TYPES.map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.pickerItem,
                        {
                          backgroundColor:
                            type === item.value
                              ? `${colors.primary}15`
                              : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        setType(item.value);
                        setShowTypePicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          {
                            color:
                              type === item.value ? colors.primary : colors.onSurface,
                            fontWeight: type === item.value ? '600' : '400',
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Descrizione *
              </Text>
              <View
                style={[
                  styles.textAreaContainer,
                  { borderColor: isDark ? '#374151' : '#E5E7EB' },
                ]}
              >
                <TextInput
                  style={[
                    styles.textArea,
                    { color: colors.onSurface },
                  ]}
                  placeholder="Descrivi l'intervento effettuato..."
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Mileage */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Chilometraggio *
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { borderColor: isDark ? '#374151' : '#E5E7EB' },
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.onSurface, flex: 1 },
                  ]}
                  placeholder="Es. 50000"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={mileage}
                  onChangeText={setMileage}
                  keyboardType="numeric"
                />
                <Text style={[styles.unit, { color: colors.onSurfaceVariant }]}>
                  km
                </Text>
              </View>
            </View>
          </View>

          {/* Costs Card */}
          <View
            style={[
              styles.formCard,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
              Costi
            </Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Costo Totale
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { borderColor: isDark ? '#374151' : '#E5E7EB' },
                ]}
              >
                <Euro
                  size={20}
                  color={colors.onSurfaceVariant}
                  strokeWidth={2}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.onSurface, flex: 1 },
                  ]}
                  placeholder="0,00"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={cost}
                  onChangeText={setCost}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Costo Manodopera
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { borderColor: isDark ? '#374151' : '#E5E7EB' },
                ]}
              >
                <Euro
                  size={20}
                  color={colors.onSurfaceVariant}
                  strokeWidth={2}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.onSurface, flex: 1 },
                  ]}
                  placeholder="0,00"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={laborCost}
                  onChangeText={setLaborCost}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Costo Ricambi
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { borderColor: isDark ? '#374151' : '#E5E7EB' },
                ]}
              >
                <Euro
                  size={20}
                  color={colors.onSurfaceVariant}
                  strokeWidth={2}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.onSurface, flex: 1 },
                  ]}
                  placeholder="0,00"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={partsCost}
                  onChangeText={setPartsCost}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Numero Fattura
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { borderColor: isDark ? '#374151' : '#E5E7EB' },
                ]}
              >
                <FileText
                  size={20}
                  color={colors.onSurfaceVariant}
                  strokeWidth={2}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.onSurface, flex: 1 },
                  ]}
                  placeholder="Es. FAT-2024-001"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={invoiceNumber}
                  onChangeText={setInvoiceNumber}
                />
              </View>
            </View>
          </View>

          {/* Workshop Card */}
          <View
            style={[
              styles.formCard,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
              Officina e Meccanico
            </Text>

            <WorkshopSearchInput
              value={workshopName}
              onChangeText={setWorkshopName}
              onSelectWorkshop={(workshop) => {
                setWorkshopName(workshop.name);
                setWorkshopId(workshop.id);
                if (workshop.phone) {
                  setMechanicPhone(workshop.phone);
                }
              }}
              label="Nome Officina"
              placeholder="Cerca officina o inserisci manualmente"
            />

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Nome Meccanico
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { borderColor: isDark ? '#374151' : '#E5E7EB' },
                ]}
              >
                <User
                  size={20}
                  color={colors.onSurfaceVariant}
                  strokeWidth={2}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.onSurface, flex: 1 },
                  ]}
                  placeholder="Es. Mario Rossi"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={mechanicName}
                  onChangeText={setMechanicName}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Telefono Meccanico
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { borderColor: isDark ? '#374151' : '#E5E7EB' },
                ]}
              >
                <Phone
                  size={20}
                  color={colors.onSurfaceVariant}
                  strokeWidth={2}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.onSurface, flex: 1 },
                  ]}
                  placeholder="Es. +39 123 456 7890"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={mechanicPhone}
                  onChangeText={setMechanicPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Parts Card */}
          <View
            style={[
              styles.formCard,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
              Ricambi Utilizzati
            </Text>

            {/* Parts List */}
            {parts.length > 0 && (
              <View style={styles.partsList}>
                {parts.map((part, index) => (
                  <View key={index} style={[styles.partChip, { backgroundColor: `${colors.primary}15` }]}>
                    <Package size={16} color={colors.primary} />
                    <View style={styles.partChipText}>
                      <Text style={[styles.partName, { color: colors.onSurface }]}>
                        {part.name}
                      </Text>
                      <Text style={[styles.partDetail, { color: colors.onSurfaceVariant }]}>
                        Qty: {part.quantity} {part.cost ? `• €${part.cost}` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removePart(index)}>
                      <X size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Add Part Form */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Nome Ricambio
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { borderColor: isDark ? '#374151' : '#E5E7EB' },
                ]}
              >
                <Package
                  size={20}
                  color={colors.onSurfaceVariant}
                  strokeWidth={2}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.onSurface, flex: 1 },
                  ]}
                  placeholder="Es. Filtro olio"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={currentPart.name}
                  onChangeText={(text) => setCurrentPart({ ...currentPart, name: text })}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: colors.onSurface }]}>
                  Quantità
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { borderColor: isDark ? '#374151' : '#E5E7EB' },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.input,
                      { color: colors.onSurface, flex: 1 },
                    ]}
                    placeholder="Es. 1, 4 pezzi, set"
                    placeholderTextColor={colors.onSurfaceVariant}
                    value={currentPart.quantity}
                    onChangeText={(text) => setCurrentPart({ ...currentPart, quantity: text })}
                  />
                </View>
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: colors.onSurface }]}>
                  Costo
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { borderColor: isDark ? '#374151' : '#E5E7EB' },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.input,
                      { color: colors.onSurface, flex: 1 },
                    ]}
                    placeholder="0"
                    placeholderTextColor={colors.onSurfaceVariant}
                    value={currentPart.cost?.toString()}
                    onChangeText={(text) => setCurrentPart({ ...currentPart, cost: parseFloat(text) || 0 })}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.addPartButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={addPart}
            >
              <Plus size={20} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.addPartButtonText}>Aggiungi Ricambio</Text>
            </TouchableOpacity>
          </View>

          {/* Warranty Card */}
          <View
            style={[
              styles.formCard,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
              Garanzia
            </Text>

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Shield size={20} color={colors.primary} />
                <Text style={[styles.switchText, { color: colors.onSurface }]}>
                  Intervento in garanzia
                </Text>
              </View>
              <Switch
                value={warranty}
                onValueChange={setWarranty}
                color={colors.primary}
              />
            </View>

            {warranty && (
              <View style={styles.formGroup}>
                <UniversalDatePicker
                  value={warrantyExpiry || new Date()}
                  onChange={setWarrantyExpiry}
                  label="Scadenza Garanzia"
                  mode="date"
                  minimumDate={new Date()}
                  showCalendar={true}
                />
              </View>
            )}
          </View>

          {/* Next Service Card */}
          <View
            style={[
              styles.formCard,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
              Prossimo Intervento
            </Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Data Prossimo Intervento
              </Text>
              <UniversalDatePicker
                value={nextServiceDate || new Date()}
                onChange={setNextServiceDate}
                label="Seleziona data"
                mode="date"
                minimumDate={new Date()}
                showCalendar={true}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Chilometraggio Prossimo Intervento
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { borderColor: isDark ? '#374151' : '#E5E7EB' },
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.onSurface, flex: 1 },
                  ]}
                  placeholder="Es. 60000"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={nextServiceMileage}
                  onChangeText={setNextServiceMileage}
                  keyboardType="numeric"
                />
                <Text style={[styles.unit, { color: colors.onSurfaceVariant }]}>
                  km
                </Text>
              </View>
            </View>
          </View>

          {/* Notes Card */}
          <View
            style={[
              styles.formCard,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
              Note Aggiuntive
            </Text>

            <View
              style={[
                styles.textAreaContainer,
                { borderColor: isDark ? '#374151' : '#E5E7EB' },
              ]}
            >
              <TextInput
                style={[
                  styles.textArea,
                  { color: colors.onSurface },
                ]}
                placeholder="Aggiungi eventuali note o osservazioni..."
                placeholderTextColor={colors.onSurfaceVariant}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: colors.primary },
              isLoading && styles.saveButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Save size={20} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.saveButtonText}>Salva Manutenzione</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webContainer: {
    flex: 1,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  scrollContent: {
    padding: 16,
  },
  formCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  input: {
    fontSize: 15,
    padding: 0,
  },
  inputText: {
    fontSize: 15,
  },
  unit: {
    fontSize: 14,
    fontWeight: '500',
  },
  textAreaContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  textArea: {
    fontSize: 15,
    minHeight: 80,
    padding: 0,
  },
  picker: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerItemText: {
    fontSize: 15,
  },
  partsList: {
    marginBottom: 16,
    gap: 8,
  },
  partChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  partChipText: {
    flex: 1,
  },
  partName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  partDetail: {
    fontSize: 12,
  },
  addPartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  addPartButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchText: {
    fontSize: 15,
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      },
    }),
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default AddMaintenanceScreen;

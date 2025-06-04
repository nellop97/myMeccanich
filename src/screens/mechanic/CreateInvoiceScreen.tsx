// src/screens/mechanic/CreateInvoiceScreen.tsx
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  FileText,
  Minus,
  Plus,
  Save,
  Trash2,
  User,
  X,
} from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import {
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useStore } from '../../store';
import { useWorkshopStore } from '../../store/workshopStore';
import {
  useInvoicingStore,
  InvoiceItem,
  Customer,
  InvoiceType,
  PaymentMethod,
} from '../../store/invoicingStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface RouteParams {
  carId?: string;
  repairId?: string;
  customerId?: string;
  type?: InvoiceType;
}

interface InvoiceFormData {
  type: InvoiceType;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  customerVatNumber: string;
  customerFiscalCode: string;
  issueDate: string;
  dueDate: string;
  paymentMethod: PaymentMethod;
  paymentTerms: string;
  notes: string;
  items: InvoiceItem[];
}

const CreateInvoiceScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams | undefined;

  const { darkMode } = useStore();
  const { cars, getCarById, getRepairDetails } = useWorkshopStore();
  const {
    addInvoice,
    customers,
    addCustomer,
    templates,
    calculateInvoiceTotals
  } = useInvoicingStore();

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { control, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<InvoiceFormData>({
    defaultValues: {
      type: params?.type || 'customer',
      customerId: params?.customerId || '',
      customerName: '',
      customerEmail: '',
      customerAddress: '',
      customerVatNumber: '',
      customerFiscalCode: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentMethod: 'bank_transfer',
      paymentTerms: '30 giorni',
      notes: '',
      items: [],
    }
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const totals = calculateInvoiceTotals(watchedItems || []);

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

  // Carica i dati se viene da una riparazione
  useEffect(() => {
    if (params?.carId && params?.repairId) {
      const car = getCarById(params.carId);
      const repair = getRepairDetails(params.carId, params.repairId);

      if (car && repair) {
        // Trova o crea cliente basato sui dati dell'auto
        let customer = customers.find(c => c.name === car.owner);
        if (!customer && car.owner) {
          const newCustomerId = addCustomer({
            name: car.owner,
            email: car.ownerEmail,
            phone: car.ownerPhone,
            isCompany: false,
          });
          customer = {
            id: newCustomerId,
            name: car.owner,
            email: car.ownerEmail,
            phone: car.ownerPhone,
            isCompany: false
          };
        }

        if (customer) {
          setSelectedCustomer(customer);
          setValue('customerId', customer.id);
          setValue('customerName', customer.name);
          setValue('customerEmail', customer.email || '');
          setValue('customerAddress', customer.address || '');
          setValue('customerVatNumber', customer.vatNumber || '');
          setValue('customerFiscalCode', customer.fiscalCode || '');
        }

        // Aggiungi elementi dalla riparazione
        const repairItems: InvoiceItem[] = [];

        // Manodopera
        if (repair.laborCost && repair.laborCost > 0) {
          repairItems.push({
            id: Date.now().toString(),
            description: `Manodopera: ${repair.description}`,
            quantity: repair.actualHours || repair.estimatedHours || 1,
            unitPrice: repair.laborCost / (repair.actualHours || repair.estimatedHours || 1),
            vatRate: 22,
            total: repair.laborCost,
            vatAmount: repair.laborCost * 0.22,
          });
        }

        // Parti
        repair.parts.forEach(part => {
          repairItems.push({
            id: (Date.now() + Math.random()).toString(),
            description: part.name + (part.brand ? ` - ${part.brand}` : ''),
            quantity: part.quantity,
            unitPrice: part.unitCost,
            vatRate: 22,
            total: part.quantity * part.unitCost,
            vatAmount: part.quantity * part.unitCost * 0.22,
          });
        });

        setValue('items', repairItems);
        setValue('notes', `Intervento su ${car.model} - Targa: ${car.licensePlate || 'N/A'}`);
      }
    }
  }, [params]);

  const onSubmit = (data: InvoiceFormData) => {
    try {
      if (!selectedCustomer) {
        Alert.alert('Errore', 'Seleziona un cliente');
        return;
      }

      if (data.items.length === 0) {
        Alert.alert('Errore', 'Aggiungi almeno un elemento alla fattura');
        return;
      }

      const invoiceId = addInvoice({
        type: data.type,
        status: 'draft',
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerEmail: selectedCustomer.email,
        customerAddress: selectedCustomer.address,
        customerVatNumber: selectedCustomer.vatNumber,
        customerFiscalCode: selectedCustomer.fiscalCode,
        items: data.items,
        paymentMethod: data.paymentMethod,
        paymentTerms: data.paymentTerms,
        notes: data.notes,
        carId: params?.carId,
        repairId: params?.repairId,
        subtotal: 0, // Calcolato automaticamente
        totalVat: 0, // Calcolato automaticamente
        totalAmount: 0, // Calcolato automaticamente
        totalDiscount: 0, // Calcolato automaticamente
      });

      Alert.alert('Successo', 'Fattura creata con successo', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        }
      ]);
    } catch (error) {
      Alert.alert('Errore', 'Errore durante la creazione della fattura');
    }
  };

  const addNewItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      vatRate: 22,
      total: 0,
      vatAmount: 0,
    };
    append(newItem);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const currentItem = watchedItems[index];
    if (!currentItem) return;

    const updatedItem = { ...currentItem, [field]: value };

    // Ricalcola totali
    if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
      const quantity = field === 'quantity' ? parseFloat(value) || 0 : updatedItem.quantity;
      const unitPrice = field === 'unitPrice' ? parseFloat(value) || 0 : updatedItem.unitPrice;
      const discount = field === 'discount' ? parseFloat(value) || 0 : (updatedItem.discount || 0);

      const subtotal = quantity * unitPrice;
      const discountAmount = subtotal * discount / 100;
      const total = subtotal - discountAmount;
      const vatAmount = total * updatedItem.vatRate / 100;

      updatedItem.total = total;
      updatedItem.vatAmount = vatAmount;
    }

    update(index, updatedItem);
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setValue('customerId', customer.id);
    setValue('customerName', customer.name);
    setValue('customerEmail', customer.email || '');
    setValue('customerAddress', customer.address || '');
    setValue('customerVatNumber', customer.vatNumber || '');
    setValue('customerFiscalCode', customer.fiscalCode || '');
    setShowCustomerModal(false);
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const templateItems: InvoiceItem[] = template.items.map(item => ({
      id: Date.now().toString() + Math.random().toString(),
      ...item,
      total: item.quantity * item.unitPrice,
      vatAmount: item.quantity * item.unitPrice * item.vatRate / 100,
    }));

    setValue('items', templateItems);
    setValue('paymentTerms', template.defaultPaymentTerms || '30 giorni');
    setValue('notes', template.defaultNotes || '');
    setShowTemplateModal(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const renderItemCard = (item: InvoiceItem, index: number) => (
    <View key={item.id} style={[styles.itemCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <View style={styles.itemHeader}>
        <Text style={[styles.itemNumber, { color: theme.text }]}>Elemento {index + 1}</Text>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.error + '20' }]}
          onPress={() => remove(index)}
        >
          <Trash2 size={16} color={theme.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.itemForm}>
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: theme.text }]}>Descrizione *</Text>
          <TextInput
            style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
            value={item.description}
            onChangeText={(value) => updateItem(index, 'description', value)}
            placeholder="Descrizione del servizio o prodotto"
            placeholderTextColor={theme.textSecondary}
            multiline
          />
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.formLabel, { color: theme.text }]}>Quantità</Text>
            <TextInput
              style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
              value={item.quantity.toString()}
              onChangeText={(value) => updateItem(index, 'quantity', value)}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={[styles.formGroup, { flex: 1, marginHorizontal: 4 }]}>
            <Text style={[styles.formLabel, { color: theme.text }]}>Prezzo Unit.</Text>
            <TextInput
              style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
              value={item.unitPrice.toString()}
              onChangeText={(value) => updateItem(index, 'unitPrice', value)}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.formLabel, { color: theme.text }]}>IVA %</Text>
            <TextInput
              style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
              value={item.vatRate.toString()}
              onChangeText={(value) => updateItem(index, 'vatRate', value)}
              keyboardType="numeric"
              placeholder="22"
              placeholderTextColor={theme.textSecondary}
            />
          </View>
        </View>

        <View style={styles.itemTotals}>
          <Text style={[styles.itemTotal, { color: theme.text }]}>
            Totale: {formatCurrency(item.total)}
          </Text>
          <Text style={[styles.itemVat, { color: theme.textSecondary }]}>
            IVA: {formatCurrency(item.vatAmount)}
          </Text>
        </View>
      </View>
    </View>
  );

  const CustomerModal = () => (
    <Modal
      visible={showCustomerModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCustomerModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Seleziona Cliente</Text>
            <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
              <X size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={customers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.customerItem, { borderColor: theme.border }]}
                onPress={() => selectCustomer(item)}
              >
                <View>
                  <Text style={[styles.customerName, { color: theme.text }]}>{item.name}</Text>
                  {item.email && (
                    <Text style={[styles.customerEmail, { color: theme.textSecondary }]}>{item.email}</Text>
                  )}
                  {item.isCompany && item.vatNumber && (
                    <Text style={[styles.customerVat, { color: theme.textSecondary }]}>P.IVA: {item.vatNumber}</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <User size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyStateText, { color: theme.text }]}>Nessun cliente trovato</Text>
                <TouchableOpacity
                  style={[styles.addCustomerButton, { backgroundColor: theme.accent }]}
                  onPress={() => {
                    setShowCustomerModal(false);
                    navigation.navigate('AddCustomer');
                  }}
                >
                  <Plus size={20} color="#ffffff" />
                  <Text style={styles.addCustomerButtonText}>Aggiungi Cliente</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );

  const TemplateModal = () => (
    <Modal
      visible={showTemplateModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowTemplateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Seleziona Template</Text>
            <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
              <X size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={templates}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.templateItem, { borderColor: theme.border }]}
                onPress={() => applyTemplate(item.id)}
              >
                <View>
                  <Text style={[styles.templateName, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.templateItems, { color: theme.textSecondary }]}>
                    {item.items.length} elementi
                  </Text>
                </View>
                <ChevronDown size={20} color={theme.textSecondary} style={{ transform: [{ rotate: '-90deg' }] }} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <FileText size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyStateText, { color: theme.text }]}>Nessun template trovato</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
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
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Nuova Fattura</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Crea una nuova fattura
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.templateButton, { backgroundColor: theme.warning + '20', borderColor: theme.warning }]}
          onPress={() => setShowTemplateModal(true)}
        >
          <FileText size={20} color={theme.warning} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Informazioni Cliente */}
          <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={styles.sectionHeader}>
              <User size={20} color={theme.accent} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Cliente</Text>
            </View>

            <TouchableOpacity
              style={[styles.customerSelector, { borderColor: theme.border }]}
              onPress={() => setShowCustomerModal(true)}
            >
              {selectedCustomer ? (
                <View>
                  <Text style={[styles.selectedCustomerName, { color: theme.text }]}>
                    {selectedCustomer.name}
                  </Text>
                  {selectedCustomer.email && (
                    <Text style={[styles.selectedCustomerEmail, { color: theme.textSecondary }]}>
                      {selectedCustomer.email}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={[styles.customerPlaceholder, { color: theme.textSecondary }]}>
                  Seleziona un cliente
                </Text>
              )}
              <ChevronDown size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Date e Termini */}
          <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={styles.sectionHeader}>
              <Calendar size={20} color={theme.success} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Date e Termini</Text>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Data Emissione</Text>
                <Controller
                  control={control}
                  name="issueDate"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                      value={value}
                      onChangeText={onChange}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={theme.textSecondary}
                    />
                  )}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Data Scadenza</Text>
                <Controller
                  control={control}
                  name="dueDate"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                      value={value}
                      onChangeText={onChange}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={theme.textSecondary}
                    />
                  )}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme.text }]}>Termini di Pagamento</Text>
              <Controller
                control={control}
                name="paymentTerms"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.formInput, { color: theme.text, borderColor: theme.border }]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="es. 30 giorni"
                    placeholderTextColor={theme.textSecondary}
                  />
                )}
              />
            </View>
          </View>

          {/* Elementi Fattura */}
          <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color={theme.warning} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Elementi ({fields.length})
              </Text>
              <TouchableOpacity
                style={[styles.addItemButton, { backgroundColor: theme.accent }]}
                onPress={addNewItem}
              >
                <Plus size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {fields.length === 0 ? (
              <View style={styles.emptyItems}>
                <FileText size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyItemsText, { color: theme.text }]}>
                  Nessun elemento aggiunto
                </Text>
                <Text style={[styles.emptyItemsSubtext, { color: theme.textSecondary }]}>
                  Tocca il pulsante + per aggiungere elementi
                </Text>
              </View>
            ) : (
              <View style={styles.itemsList}>
                {fields.map((field, index) => renderItemCard(watchedItems[index], index))}
              </View>
            )}
          </View>

          {/* Riepilogo Totali */}
          {fields.length > 0 && (
            <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <View style={styles.sectionHeader}>
                <FileText size={20} color={theme.success} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Riepilogo</Text>
              </View>

              <View style={styles.totalsContainer}>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Subtotale:</Text>
                  <Text style={[styles.totalValue, { color: theme.text }]}>
                    {formatCurrency(totals.subtotal)}
                  </Text>
                </View>

                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>IVA:</Text>
                  <Text style={[styles.totalValue, { color: theme.text }]}>
                    {formatCurrency(totals.totalVat)}
                  </Text>
                </View>

                <View style={[styles.totalRow, styles.grandTotalRow, { borderColor: theme.border }]}>
                  <Text style={[styles.grandTotalLabel, { color: theme.text }]}>Totale:</Text>
                  <Text style={[styles.grandTotalValue, { color: theme.accent }]}>
                    {formatCurrency(totals.totalAmount)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Note */}
          <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color={theme.textSecondary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Note</Text>
            </View>

            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.notesInput, { color: theme.text, borderColor: theme.border }]}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Note aggiuntive per la fattura..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              )}
            />
          </View>

          {/* Pulsanti di Azione */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.border }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>Annulla</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: selectedCustomer && fields.length > 0 ? theme.accent : theme.textSecondary }
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={!selectedCustomer || fields.length === 0}
            >
              <Save size={20} color="#ffffff" />
              <Text style={styles.saveButtonText}>Crea Fattura</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomerModal />
      <TemplateModal />
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  templateButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    margin: 16,
    marginBottom: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  customerSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    margin: 16,
  },
  selectedCustomerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedCustomerEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  customerPlaceholder: {
    fontSize: 16,
  },
  formRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  formGroup: {
    marginBottom: 16,
    paddingHorizontal: 16,
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
  addItemButton: {
    padding: 8,
    borderRadius: 6,
  },
  emptyItems: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyItemsText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptyItemsSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  itemsList: {
    padding: 16,
  },
  itemCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 6,
    borderRadius: 6,
  },
  itemForm: {
    gap: 12,
  },
  itemTotals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemVat: {
    fontSize: 14,
  },
  totalsContainer: {
    padding: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 16,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 32,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.8,
    minHeight: screenHeight * 0.5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  customerItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  customerVat: {
    fontSize: 12,
  },
  templateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  templateItems: {
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  addCustomerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  addCustomerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default CreateInvoiceScreen;

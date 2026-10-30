// src/screens/mechanic/CreateInvoiceScreen.tsx
import { useNavigation, useRoute } from '@react-navigation/native';
import {
    Calendar,
    ChevronDown,
    FileText,
    Minus,
    Plus,
    Save,
    Trash2,
    User,
    X,
    Users,
    DollarSign,
    Check,
} from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';
import { useWorkshopStore } from '../../store/workshopStore';
import {
    useInvoicingStore,
    InvoiceItem,
    Customer,
    InvoiceType,
    PaymentMethod,
} from '../../store/invoicingStore';

import { mechanicButton, mechanicCard, mechanicStaticColors, useMechanicTheme } from './mechanicTheme';
import MechanicTextInput from './MechanicTextInput';
import { MechanicEmptyState } from './MechanicStates';

import MechanicHeader from './MechanicHeader';
interface RouteParams {
    carId?: string;
    repairId?: string;
    customerId?: string;
    type?: InvoiceType;
}

const INVOICE_TYPES: { id: InvoiceType; label: string }[] = [
    { id: 'customer', label: 'Fattura Cliente' },
    { id: 'proforma', label: 'Fattura Pro-forma' },
    { id: 'receipt', label: 'Ricevuta' },
];

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
    { id: 'bank_transfer', label: 'Bonifico Bancario' },
    { id: 'cash', label: 'Contanti' },
    { id: 'card', label: 'Carta di Credito' },
    { id: 'check', label: 'Assegno' },
];

const CreateInvoiceScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const params = route.params as RouteParams | undefined;

    const theme = useMechanicTheme();
    const { cars, getCarById, getRepairDetails } = useWorkshopStore();
    const {
        addInvoice,
        customers,
        addCustomer,
        calculateInvoiceTotals
    } = useInvoicingStore();

    // Form State
    const [formData, setFormData] = useState({
        type: (params?.type || 'customer') as InvoiceType,
        customerId: params?.customerId || '',
        customerName: '',
        customerEmail: '',
        customerAddress: '',
        customerVatNumber: '',
        customerFiscalCode: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentMethod: 'bank_transfer' as PaymentMethod,
        paymentTerms: '30 giorni',
        notes: '',
    });

    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Calculate totals whenever items change
    const totals = calculateInvoiceTotals(items);

    // Load data from repair if coming from repair screen
    useEffect(() => {
        if (params?.carId && params?.repairId) {
            loadRepairData();
        } else if (params?.customerId) {
            loadCustomerData();
        }
    }, [params]);

    const loadRepairData = () => {
        if (!params?.carId || !params?.repairId) return;

        const car = getCarById(params.carId);
        const repair = getRepairDetails(params.carId, params.repairId);

        if (car && repair) {
            // Find or create customer
            let customer = customers.find(c => c.name === car.owner);

            if (customer) {
                setSelectedCustomer(customer);
                setFormData(prev => ({
                    ...prev,
                    customerId: customer!.id,
                    customerName: customer!.name,
                    customerEmail: customer!.email || '',
                    customerAddress: customer!.address || '',
                    customerVatNumber: customer!.vatNumber || '',
                    customerFiscalCode: customer!.fiscalCode || '',
                }));
            }

            // Add repair items
            const repairItems: InvoiceItem[] = [];

            // Labor
            if (repair.laborCost && repair.laborCost > 0) {
                const hours = repair.actualHours || repair.estimatedHours || 1;
                repairItems.push({
                    id: Date.now().toString(),
                    description: `Manodopera: ${repair.description}`,
                    quantity: hours,
                    unitPrice: repair.laborCost / hours,
                    vatRate: 22,
                    discount: 0,
                    total: repair.laborCost,
                    vatAmount: repair.laborCost * 0.22,
                });
            }

            // Parts
            repair.parts?.forEach((part: any) => {
                repairItems.push({
                    id: (Date.now() + Math.random()).toString(),
                    description: `${part.name}${part.brand ? ` - ${part.brand}` : ''}`,
                    quantity: part.quantity,
                    unitPrice: part.unitCost,
                    vatRate: 22,
                    discount: 0,
                    total: part.quantity * part.unitCost,
                    vatAmount: part.quantity * part.unitCost * 0.22,
                });
            });

            setItems(repairItems);
            setFormData(prev => ({
                ...prev,
                notes: `Intervento su ${car.model} - Targa: ${car.licensePlate || 'N/A'}`,
            }));
        }
    };

    const loadCustomerData = () => {
        if (!params?.customerId) return;

        const customer = customers.find(c => c.id === params.customerId);
        if (customer) {
            setSelectedCustomer(customer);
            setFormData(prev => ({
                ...prev,
                customerId: customer.id,
                customerName: customer.name,
                customerEmail: customer.email || '',
                customerAddress: customer.address || '',
                customerVatNumber: customer.vatNumber || '',
                customerFiscalCode: customer.fiscalCode || '',
            }));
        }
    };

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const addNewItem = () => {
        const newItem: InvoiceItem = {
            id: Date.now().toString(),
            description: '',
            quantity: 1,
            unitPrice: 0,
            vatRate: 22,
            discount: 0,
            total: 0,
            vatAmount: 0,
        };
        setItems(prev => [...prev, newItem]);
    };

    const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        setItems(prev => {
            const newItems = [...prev];
            const item = { ...newItems[index] };

            // Update field
            item[field] = value;

            // Recalculate totals
            const quantity = parseFloat(item.quantity as any) || 0;
            const unitPrice = parseFloat(item.unitPrice as any) || 0;
            const discount = parseFloat(item.discount as any) || 0;
            const vatRate = parseFloat(item.vatRate as any) || 0;

            const subtotal = quantity * unitPrice;
            const discountAmount = (subtotal * discount) / 100;
            const totalAfterDiscount = subtotal - discountAmount;
            const vatAmount = (totalAfterDiscount * vatRate) / 100;

            item.total = totalAfterDiscount;
            item.vatAmount = vatAmount;

            newItems[index] = item;
            return newItems;
        });
    };

    const removeItem = (index: number) => {
        Alert.alert(
            'Rimuovi Elemento',
            'Sei sicuro di voler rimuovere questo elemento?',
            [
                { text: 'Annulla', style: 'cancel' },
                {
                    text: 'Rimuovi',
                    style: 'destructive',
                    onPress: () => {
                        setItems(prev => prev.filter((_, i) => i !== index));
                    },
                },
            ]
        );
    };

    const selectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setFormData(prev => ({
            ...prev,
            customerId: customer.id,
            customerName: customer.name,
            customerEmail: customer.email || '',
            customerAddress: customer.address || '',
            customerVatNumber: customer.vatNumber || '',
            customerFiscalCode: customer.fiscalCode || '',
        }));
        setShowCustomerModal(false);
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!selectedCustomer) {
            newErrors.customer = 'Seleziona un cliente';
        }

        if (items.length === 0) {
            newErrors.items = 'Aggiungi almeno un elemento alla fattura';
        }

        // Validate items
        items.forEach((item, index) => {
            if (!item.description.trim()) {
                newErrors[`item_${index}_description`] = 'Descrizione obbligatoria';
            }
            if (item.quantity <= 0) {
                newErrors[`item_${index}_quantity`] = 'Quantità non valida';
            }
            if (item.unitPrice <= 0) {
                newErrors[`item_${index}_unitPrice`] = 'Prezzo non valido';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            Alert.alert('Errore', 'Controlla i campi obbligatori');
            return;
        }

        setIsLoading(true);

        try {
            const invoiceId = addInvoice({
                type: formData.type,
                status: 'draft',
                issueDate: formData.issueDate,
                dueDate: formData.dueDate,
                customerId: selectedCustomer!.id,
                customerName: selectedCustomer!.name,
                customerEmail: selectedCustomer!.email,
                customerAddress: selectedCustomer!.address,
                customerVatNumber: selectedCustomer!.vatNumber,
                customerFiscalCode: selectedCustomer!.fiscalCode,
                items: items,
                paymentMethod: formData.paymentMethod,
                paymentTerms: formData.paymentTerms,
                notes: formData.notes,
                carId: params?.carId,
                repairId: params?.repairId,
                subtotal: totals.subtotal,
                totalVat: totals.totalVat,
                totalAmount: totals.totalAmount,
                totalDiscount: totals.totalDiscount,
            });

            Alert.alert('Successo', 'Fattura creata con successo', [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                }
            ]);
        } catch (error) {
            console.error('Error creating invoice:', error);
            Alert.alert('Errore', 'Errore durante la creazione della fattura');
        } finally {
            setIsLoading(false);
        }
    };

    const renderCustomerModal = () => (
        <Modal
            visible={showCustomerModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowCustomerModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            Seleziona Cliente
                        </Text>
                        <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                            <X size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView>
                        {customers.map((customer) => (
                            <TouchableOpacity
                                key={customer.id}
                                style={[
                                    styles.customerOption,
                                    {
                                        backgroundColor: selectedCustomer?.id === customer.id
                                            ? theme.primaryLight
                                            : theme.surfaceVariant,
                                        borderColor: selectedCustomer?.id === customer.id
                                            ? theme.primary
                                            : theme.border,
                                    },
                                ]}
                                onPress={() => selectCustomer(customer)}
                            >
                                <View style={[styles.customerAvatar, { backgroundColor: theme.primary }]}>
                                    <User size={24} color={theme.onPrimary} />
                                </View>
                                <View style={styles.customerInfo}>
                                    <Text style={[styles.customerName, { color: theme.text }]}>
                                        {customer.name}
                                    </Text>
                                    {customer.email && (
                                        <Text style={[styles.customerEmail, { color: theme.textSecondary }]}>
                                            {customer.email}
                                        </Text>
                                    )}
                                </View>
                                {selectedCustomer?.id === customer.id && (
                                    <Check size={20} color={theme.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <TouchableOpacity
                        style={[styles.addCustomerButton, { backgroundColor: theme.primary }]}
                        onPress={() => {
                            setShowCustomerModal(false);
                            navigation.navigate('AddCustomer');
                        }}
                    >
                        <Plus size={20} color={theme.onPrimary} />
                        <Text style={styles.addCustomerButtonText}>Nuovo Cliente</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderTypeModal = () => (
        <Modal
            visible={showTypeModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowTypeModal(false)}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowTypeModal(false)}
            >
                <View style={[styles.pickerModal, { backgroundColor: theme.surface }]}>
                    {INVOICE_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type.id}
                            style={[
                                styles.pickerOption,
                                {
                                    backgroundColor: formData.type === type.id
                                        ? theme.primaryLight
                                        : 'transparent',
                                },
                            ]}
                            onPress={() => {
                                updateFormData('type', type.id);
                                setShowTypeModal(false);
                            }}
                        >
                            <Text style={[styles.pickerOptionText, { color: theme.text }]}>
                                {type.label}
                            </Text>
                            {formData.type === type.id && (
                                <Check size={20} color={theme.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );

    const renderPaymentModal = () => (
        <Modal
            visible={showPaymentModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowPaymentModal(false)}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowPaymentModal(false)}
            >
                <View style={[styles.pickerModal, { backgroundColor: theme.surface }]}>
                    {PAYMENT_METHODS.map((method) => (
                        <TouchableOpacity
                            key={method.id}
                            style={[
                                styles.pickerOption,
                                {
                                    backgroundColor: formData.paymentMethod === method.id
                                        ? theme.primaryLight
                                        : 'transparent',
                                },
                            ]}
                            onPress={() => {
                                updateFormData('paymentMethod', method.id);
                                setShowPaymentModal(false);
                            }}
                        >
                            <Text style={[styles.pickerOptionText, { color: theme.text }]}>
                                {method.label}
                            </Text>
                            {formData.paymentMethod === method.id && (
                                <Check size={20} color={theme.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );

    const renderItem = (item: InvoiceItem, index: number) => (
        <View style={[styles.itemCard, {
            backgroundColor: theme.surfaceVariant,
            borderColor: theme.border,
        }]}>
            <View style={styles.itemHeader}>
                <Text style={[styles.itemNumber, { color: theme.textSecondary }]}>
                    #{index + 1}
                </Text>
                <TouchableOpacity
                    onPress={() => removeItem(index)}
                    style={styles.removeItemButton}
                >
                    <Trash2 size={18} color={theme.error} />
                </TouchableOpacity>
            </View>

            {/* Description */}
            <MechanicTextInput
                error={!!errors[`item_${index}_description`]}
                containerStyle={styles.itemInput}
                placeholder="Descrizione *"
                value={item.description}
                onChangeText={(text) => updateItem(index, 'description', text)}
                multiline
            />

            <View style={styles.itemRow}>
                {/* Quantity */}
                <View style={styles.itemInputGroup}>
                    <Text style={[styles.itemLabel, { color: theme.textSecondary }]}>
                        Quantità
                    </Text>
                    <MechanicTextInput
                        error={!!errors[`item_${index}_quantity`]}
                        placeholder="1"
                        value={item.quantity.toString()}
                        onChangeText={(text) => updateItem(index, 'quantity', text)}
                        keyboardType="numeric"
                    />
                </View>

                {/* Unit Price */}
                <View style={styles.itemInputGroup}>
                    <Text style={[styles.itemLabel, { color: theme.textSecondary }]}>
                        Prezzo Unit.
                    </Text>
                    <MechanicTextInput
                        error={!!errors[`item_${index}_unitPrice`]}
                        placeholder="0.00"
                        value={item.unitPrice.toString()}
                        onChangeText={(text) => updateItem(index, 'unitPrice', text)}
                        keyboardType="decimal-pad"
                    />
                </View>

                {/* VAT Rate */}
                <View style={styles.itemInputGroup}>
                    <Text style={[styles.itemLabel, { color: theme.textSecondary }]}>
                        IVA %
                    </Text>
                    <MechanicTextInput
                        placeholder="22"
                        value={item.vatRate.toString()}
                        onChangeText={(text) => updateItem(index, 'vatRate', text)}
                        keyboardType="numeric"
                    />
                </View>
            </View>

            {/* Total */}
            <View style={styles.itemTotal}>
                <Text style={[styles.itemTotalLabel, { color: theme.textSecondary }]}>
                    Totale:
                </Text>
                <Text style={[styles.itemTotalValue, { color: theme.primary }]}>
                    €{(item.total + item.vatAmount).toFixed(2)}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar
                barStyle={theme.isDark ? 'light-content' : 'dark-content'}
                backgroundColor={theme.surface}
            />

            <MechanicHeader
                title="Crea Fattura"
                onBack={() => navigation.goBack()}
                right={
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSubmit}
                        disabled={isLoading}
                        accessibilityRole="button"
                        accessibilityLabel="Salva fattura"
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color={theme.primary} />
                        ) : (
                            <Save size={24} color={theme.primary} />
                        )}
                    </TouchableOpacity>
                }
            />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Invoice Type */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Tipo Documento
                        </Text>
                        <TouchableOpacity
                            style={[styles.selectButton, {
                                backgroundColor: theme.surfaceVariant,
                                borderColor: theme.border,
                            }]}
                            onPress={() => setShowTypeModal(true)}
                        >
                            <FileText size={20} color={theme.primary} />
                            <Text style={[styles.selectButtonText, { color: theme.text }]}>
                                {INVOICE_TYPES.find(t => t.id === formData.type)?.label}
                            </Text>
                            <ChevronDown size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Customer */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Cliente *
                        </Text>
                        <TouchableOpacity
                            style={[styles.selectButton, {
                                backgroundColor: theme.surfaceVariant,
                                borderColor: errors.customer ? theme.error : theme.border,
                            }]}
                            onPress={() => setShowCustomerModal(true)}
                        >
                            <User size={20} color={theme.primary} />
                            <Text style={[
                                styles.selectButtonText,
                                { color: selectedCustomer ? theme.text : theme.textSecondary }
                            ]}>
                                {selectedCustomer ? selectedCustomer.name : 'Seleziona cliente'}
                            </Text>
                            <ChevronDown size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                        {errors.customer && (
                            <Text style={[styles.errorText, { color: theme.error }]}>
                                {errors.customer}
                            </Text>
                        )}
                    </View>

                    {/* Dates */}
                    <View style={styles.dateRow}>
                        <View style={[styles.dateField, { flex: 1 }]}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                Data Emissione
                            </Text>
                            <MechanicTextInput
                                left={<Calendar size={20} color={theme.primary} />}
                                value={formData.issueDate}
                                onChangeText={(text) => updateFormData('issueDate', text)}
                                placeholder="YYYY-MM-DD"
                            />
                        </View>

                        <View style={[styles.dateField, { flex: 1 }]}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                Scadenza
                            </Text>
                            <MechanicTextInput
                                left={<Calendar size={20} color={theme.primary} />}
                                value={formData.dueDate}
                                onChangeText={(text) => updateFormData('dueDate', text)}
                                placeholder="YYYY-MM-DD"
                            />
                        </View>
                    </View>

                    {/* Items */}
                    <View style={styles.section}>
                        <View style={styles.itemsHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                Elementi Fattura
                            </Text>
                            <TouchableOpacity
                                style={[styles.addItemButton, { backgroundColor: theme.primary }]}
                                onPress={addNewItem}
                            >
                                <Plus size={18} color={theme.onPrimary} />
                                <Text style={styles.addItemButtonText}>Aggiungi</Text>
                            </TouchableOpacity>
                        </View>

                        {items.length === 0 ? (
                            <MechanicEmptyState
                                icon={FileText}
                                title="Nessun elemento aggiunto"
                                subtitle={'Tocca "Aggiungi" per inserire prodotti o servizi'}
                                style={[styles.emptyItems, { backgroundColor: theme.surfaceVariant }]}
                            />
                        ) : (
                            items.map((item, index) => (
                                <View key={item.id}>
                                    {renderItem(item, index)}
                                </View>
                            ))
                        )}
                        {errors.items && (
                            <Text style={[styles.errorText, { color: theme.error }]}>
                                {errors.items}
                            </Text>
                        )}
                    </View>

                    {/* Totals */}
                    {items.length > 0 && (
                        <View style={[styles.totalsCard, {
                            backgroundColor: theme.surfaceVariant,
                            borderColor: theme.border,
                        }]}>
                            <View style={styles.totalRow}>
                                <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>
                                    Subtotale:
                                </Text>
                                <Text style={[styles.totalValue, { color: theme.text }]}>
                                    €{totals.subtotal.toFixed(2)}
                                </Text>
                            </View>
                            {totals.totalDiscount > 0 && (
                                <View style={styles.totalRow}>
                                    <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>
                                        Sconto:
                                    </Text>
                                    <Text style={[styles.totalValue, { color: theme.error }]}>
                                        -€{totals.totalDiscount.toFixed(2)}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.totalRow}>
                                <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>
                                    IVA:
                                </Text>
                                <Text style={[styles.totalValue, { color: theme.text }]}>
                                    €{totals.totalVat.toFixed(2)}
                                </Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: theme.border }]} />
                            <View style={styles.totalRow}>
                                <Text style={[styles.grandTotalLabel, { color: theme.text }]}>
                                    TOTALE:
                                </Text>
                                <Text style={[styles.grandTotalValue, { color: theme.primary }]}>
                                    €{totals.totalAmount.toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Payment Method */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Metodo di Pagamento
                        </Text>
                        <TouchableOpacity
                            style={[styles.selectButton, {
                                backgroundColor: theme.surfaceVariant,
                                borderColor: theme.border,
                            }]}
                            onPress={() => setShowPaymentModal(true)}
                        >
                            <DollarSign size={20} color={theme.primary} />
                            <Text style={[styles.selectButtonText, { color: theme.text }]}>
                                {PAYMENT_METHODS.find(m => m.id === formData.paymentMethod)?.label}
                            </Text>
                            <ChevronDown size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Payment Terms */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Termini di Pagamento
                        </Text>
                        <MechanicTextInput
                            left={<FileText size={20} color={theme.primary} />}
                            placeholder="es. 30 giorni"
                            value={formData.paymentTerms}
                            onChangeText={(text) => updateFormData('paymentTerms', text)}
                        />
                    </View>

                    {/* Notes */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Note
                        </Text>
                        <MechanicTextInput
                            style={styles.textArea}
                            placeholder="Note aggiuntive per la fattura..."
                            value={formData.notes}
                            onChangeText={(text) => updateFormData('notes', text)}
                            multiline
                            numberOfLines={4}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {renderCustomerModal()}
            {renderTypeModal()}
            {renderPaymentModal()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    saveButton: mechanicButton.icon,
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    selectButtonText: {
        flex: 1,
        fontSize: 16,
    },
    dateRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    dateField: {
        flex: 1,
    },
    itemsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    addItemButton: mechanicButton.compact,
    addItemButtonText: {
        color: mechanicStaticColors.onPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    emptyItems: {
        borderRadius: 12,
    },
    itemCard: {
        ...mechanicCard,
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
        fontWeight: '600',
    },
    removeItemButton: {
        padding: 4,
    },
    itemInput: {
        marginBottom: 12,
        minHeight: 60,
    },
    itemRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    itemInputGroup: {
        flex: 1,
    },
    itemLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    itemTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: mechanicStaticColors.divider,
    },
    itemTotalLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    itemTotalValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    totalsCard: {
        ...mechanicCard,
        marginBottom: 24,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    totalLabel: {
        fontSize: 14,
    },
    totalValue: {
        fontSize: 16,
        fontWeight: '500',
    },
    grandTotalLabel: {
        fontSize: 16,
        fontWeight: '700',
    },
    grandTotalValue: {
        fontSize: 24,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    textArea: {
        minHeight: 100,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: mechanicStaticColors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxWidth: 480,
        maxHeight: '80%',
        borderRadius: 20,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: mechanicStaticColors.divider,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    customerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 20,
        marginVertical: 6,
        borderRadius: 12,
        borderWidth: 2,
    },
    customerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    customerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    customerName: {
        fontSize: 16,
        fontWeight: '600',
    },
    customerEmail: {
        fontSize: 12,
        marginTop: 2,
    },
    addCustomerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        margin: 20,
        borderRadius: 12,
        gap: 8,
    },
    addCustomerButtonText: {
        color: mechanicStaticColors.onPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    pickerModal: {
        width: '80%',
        maxWidth: 400,
        borderRadius: 20,
        padding: 8,
    },
    pickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
    },
    pickerOptionText: {
        fontSize: 16,
    },
});

export default CreateInvoiceScreen;
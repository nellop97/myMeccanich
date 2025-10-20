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
    Users,
    DollarSign,
    Check,
} from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
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
    ActivityIndicator,
} from 'react-native';
import { useAppThemeManager } from '../../hooks/useTheme';
import { useWorkshopStore } from '../../store/workshopStore';
import {
    useInvoicingStore,
    InvoiceItem,
    Customer,
    InvoiceType,
    PaymentMethod,
} from '../../store/invoicingStore';

const { width: screenWidth } = Dimensions.get('window');

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

    const { colors, isDark } = useAppThemeManager();
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
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                            Seleziona Cliente
                        </Text>
                        <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                            <X size={24} color={colors.onSurface} />
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
                                            ? colors.primaryContainer
                                            : colors.surfaceVariant,
                                        borderColor: selectedCustomer?.id === customer.id
                                            ? colors.primary
                                            : colors.outline,
                                    },
                                ]}
                                onPress={() => selectCustomer(customer)}
                            >
                                <View style={[styles.customerAvatar, { backgroundColor: colors.primary }]}>
                                    <User size={24} color="#FFF" />
                                </View>
                                <View style={styles.customerInfo}>
                                    <Text style={[styles.customerName, { color: colors.onSurface }]}>
                                        {customer.name}
                                    </Text>
                                    {customer.email && (
                                        <Text style={[styles.customerEmail, { color: colors.onSurfaceVariant }]}>
                                            {customer.email}
                                        </Text>
                                    )}
                                </View>
                                {selectedCustomer?.id === customer.id && (
                                    <Check size={20} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <TouchableOpacity
                        style={[styles.addCustomerButton, { backgroundColor: colors.primary }]}
                        onPress={() => {
                            setShowCustomerModal(false);
                            navigation.navigate('AddCustomer');
                        }}
                    >
                        <Plus size={20} color="#FFF" />
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
                <View style={[styles.pickerModal, { backgroundColor: colors.surface }]}>
                    {INVOICE_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type.id}
                            style={[
                                styles.pickerOption,
                                {
                                    backgroundColor: formData.type === type.id
                                        ? colors.primaryContainer
                                        : 'transparent',
                                },
                            ]}
                            onPress={() => {
                                updateFormData('type', type.id);
                                setShowTypeModal(false);
                            }}
                        >
                            <Text style={[styles.pickerOptionText, { color: colors.onSurface }]}>
                                {type.label}
                            </Text>
                            {formData.type === type.id && (
                                <Check size={20} color={colors.primary} />
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
                <View style={[styles.pickerModal, { backgroundColor: colors.surface }]}>
                    {PAYMENT_METHODS.map((method) => (
                        <TouchableOpacity
                            key={method.id}
                            style={[
                                styles.pickerOption,
                                {
                                    backgroundColor: formData.paymentMethod === method.id
                                        ? colors.primaryContainer
                                        : 'transparent',
                                },
                            ]}
                            onPress={() => {
                                updateFormData('paymentMethod', method.id);
                                setShowPaymentModal(false);
                            }}
                        >
                            <Text style={[styles.pickerOptionText, { color: colors.onSurface }]}>
                                {method.label}
                            </Text>
                            {formData.paymentMethod === method.id && (
                                <Check size={20} color={colors.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );

    const renderItem = (item: InvoiceItem, index: number) => (
        <View style={[styles.itemCard, {
            backgroundColor: colors.surfaceVariant,
            borderColor: colors.outline,
        }]}>
            <View style={styles.itemHeader}>
                <Text style={[styles.itemNumber, { color: colors.onSurfaceVariant }]}>
                    #{index + 1}
                </Text>
                <TouchableOpacity
                    onPress={() => removeItem(index)}
                    style={styles.removeItemButton}
                >
                    <Trash2 size={18} color={colors.error} />
                </TouchableOpacity>
            </View>

            {/* Description */}
            <TextInput
                style={[styles.itemInput, {
                    color: colors.onSurface,
                    backgroundColor: colors.surface,
                    borderColor: errors[`item_${index}_description`] ? colors.error : colors.outline,
                }]}
                placeholder="Descrizione *"
                placeholderTextColor={colors.onSurfaceVariant}
                value={item.description}
                onChangeText={(text) => updateItem(index, 'description', text)}
                multiline
            />

            <View style={styles.itemRow}>
                {/* Quantity */}
                <View style={styles.itemInputGroup}>
                    <Text style={[styles.itemLabel, { color: colors.onSurfaceVariant }]}>
                        Quantità
                    </Text>
                    <TextInput
                        style={[styles.itemInputSmall, {
                            color: colors.onSurface,
                            backgroundColor: colors.surface,
                            borderColor: errors[`item_${index}_quantity`] ? colors.error : colors.outline,
                        }]}
                        placeholder="1"
                        placeholderTextColor={colors.onSurfaceVariant}
                        value={item.quantity.toString()}
                        onChangeText={(text) => updateItem(index, 'quantity', text)}
                        keyboardType="numeric"
                    />
                </View>

                {/* Unit Price */}
                <View style={styles.itemInputGroup}>
                    <Text style={[styles.itemLabel, { color: colors.onSurfaceVariant }]}>
                        Prezzo Unit.
                    </Text>
                    <TextInput
                        style={[styles.itemInputSmall, {
                            color: colors.onSurface,
                            backgroundColor: colors.surface,
                            borderColor: errors[`item_${index}_unitPrice`] ? colors.error : colors.outline,
                        }]}
                        placeholder="0.00"
                        placeholderTextColor={colors.onSurfaceVariant}
                        value={item.unitPrice.toString()}
                        onChangeText={(text) => updateItem(index, 'unitPrice', text)}
                        keyboardType="decimal-pad"
                    />
                </View>

                {/* VAT Rate */}
                <View style={styles.itemInputGroup}>
                    <Text style={[styles.itemLabel, { color: colors.onSurfaceVariant }]}>
                        IVA %
                    </Text>
                    <TextInput
                        style={[styles.itemInputSmall, {
                            color: colors.onSurface,
                            backgroundColor: colors.surface,
                            borderColor: colors.outline,
                        }]}
                        placeholder="22"
                        placeholderTextColor={colors.onSurfaceVariant}
                        value={item.vatRate.toString()}
                        onChangeText={(text) => updateItem(index, 'vatRate', text)}
                        keyboardType="numeric"
                    />
                </View>
            </View>

            {/* Total */}
            <View style={styles.itemTotal}>
                <Text style={[styles.itemTotalLabel, { color: colors.onSurfaceVariant }]}>
                    Totale:
                </Text>
                <Text style={[styles.itemTotalValue, { color: colors.primary }]}>
                    €{(item.total + item.vatAmount).toFixed(2)}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.surface}
            />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft size={24} color={colors.onSurface} />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
                    Crea Fattura
                </Text>

                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <Save size={24} color={colors.primary} />
                    )}
                </TouchableOpacity>
            </View>

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
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Tipo Documento
                        </Text>
                        <TouchableOpacity
                            style={[styles.selectButton, {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: colors.outline,
                            }]}
                            onPress={() => setShowTypeModal(true)}
                        >
                            <FileText size={20} color={colors.primary} />
                            <Text style={[styles.selectButtonText, { color: colors.onSurface }]}>
                                {INVOICE_TYPES.find(t => t.id === formData.type)?.label}
                            </Text>
                            <ChevronDown size={20} color={colors.onSurfaceVariant} />
                        </TouchableOpacity>
                    </View>

                    {/* Customer */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Cliente *
                        </Text>
                        <TouchableOpacity
                            style={[styles.selectButton, {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: errors.customer ? colors.error : colors.outline,
                            }]}
                            onPress={() => setShowCustomerModal(true)}
                        >
                            <User size={20} color={colors.primary} />
                            <Text style={[
                                styles.selectButtonText,
                                { color: selectedCustomer ? colors.onSurface : colors.onSurfaceVariant }
                            ]}>
                                {selectedCustomer ? selectedCustomer.name : 'Seleziona cliente'}
                            </Text>
                            <ChevronDown size={20} color={colors.onSurfaceVariant} />
                        </TouchableOpacity>
                        {errors.customer && (
                            <Text style={[styles.errorText, { color: colors.error }]}>
                                {errors.customer}
                            </Text>
                        )}
                    </View>

                    {/* Dates */}
                    <View style={styles.dateRow}>
                        <View style={[styles.dateField, { flex: 1 }]}>
                            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                                Data Emissione
                            </Text>
                            <View style={[styles.inputContainer, {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: colors.outline,
                            }]}>
                                <Calendar size={20} color={colors.primary} />
                                <TextInput
                                    style={[styles.input, { color: colors.onSurface }]}
                                    value={formData.issueDate}
                                    onChangeText={(text) => updateFormData('issueDate', text)}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={colors.onSurfaceVariant}
                                />
                            </View>
                        </View>

                        <View style={[styles.dateField, { flex: 1 }]}>
                            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                                Scadenza
                            </Text>
                            <View style={[styles.inputContainer, {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: colors.outline,
                            }]}>
                                <Calendar size={20} color={colors.primary} />
                                <TextInput
                                    style={[styles.input, { color: colors.onSurface }]}
                                    value={formData.dueDate}
                                    onChangeText={(text) => updateFormData('dueDate', text)}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={colors.onSurfaceVariant}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Items */}
                    <View style={styles.section}>
                        <View style={styles.itemsHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                                Elementi Fattura
                            </Text>
                            <TouchableOpacity
                                style={[styles.addItemButton, { backgroundColor: colors.primary }]}
                                onPress={addNewItem}
                            >
                                <Plus size={18} color="#FFF" />
                                <Text style={styles.addItemButtonText}>Aggiungi</Text>
                            </TouchableOpacity>
                        </View>

                        {items.length === 0 ? (
                            <View style={[styles.emptyItems, { backgroundColor: colors.surfaceVariant }]}>
                                <FileText size={48} color={colors.onSurfaceVariant} />
                                <Text style={[styles.emptyItemsText, { color: colors.onSurfaceVariant }]}>
                                    Nessun elemento aggiunto
                                </Text>
                                <Text style={[styles.emptyItemsSubtext, { color: colors.onSurfaceVariant }]}>
                                    Tocca "Aggiungi" per inserire prodotti o servizi
                                </Text>
                            </View>
                        ) : (
                            items.map((item, index) => (
                                <View key={item.id}>
                                    {renderItem(item, index)}
                                </View>
                            ))
                        )}
                        {errors.items && (
                            <Text style={[styles.errorText, { color: colors.error }]}>
                                {errors.items}
                            </Text>
                        )}
                    </View>

                    {/* Totals */}
                    {items.length > 0 && (
                        <View style={[styles.totalsCard, {
                            backgroundColor: colors.surfaceVariant,
                            borderColor: colors.outline,
                        }]}>
                            <View style={styles.totalRow}>
                                <Text style={[styles.totalLabel, { color: colors.onSurfaceVariant }]}>
                                    Subtotale:
                                </Text>
                                <Text style={[styles.totalValue, { color: colors.onSurface }]}>
                                    €{totals.subtotal.toFixed(2)}
                                </Text>
                            </View>
                            {totals.totalDiscount > 0 && (
                                <View style={styles.totalRow}>
                                    <Text style={[styles.totalLabel, { color: colors.onSurfaceVariant }]}>
                                        Sconto:
                                    </Text>
                                    <Text style={[styles.totalValue, { color: colors.error }]}>
                                        -€{totals.totalDiscount.toFixed(2)}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.totalRow}>
                                <Text style={[styles.totalLabel, { color: colors.onSurfaceVariant }]}>
                                    IVA:
                                </Text>
                                <Text style={[styles.totalValue, { color: colors.onSurface }]}>
                                    €{totals.totalVat.toFixed(2)}
                                </Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: colors.outline }]} />
                            <View style={styles.totalRow}>
                                <Text style={[styles.grandTotalLabel, { color: colors.onSurface }]}>
                                    TOTALE:
                                </Text>
                                <Text style={[styles.grandTotalValue, { color: colors.primary }]}>
                                    €{totals.totalAmount.toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Payment Method */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Metodo di Pagamento
                        </Text>
                        <TouchableOpacity
                            style={[styles.selectButton, {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: colors.outline,
                            }]}
                            onPress={() => setShowPaymentModal(true)}
                        >
                            <DollarSign size={20} color={colors.primary} />
                            <Text style={[styles.selectButtonText, { color: colors.onSurface }]}>
                                {PAYMENT_METHODS.find(m => m.id === formData.paymentMethod)?.label}
                            </Text>
                            <ChevronDown size={20} color={colors.onSurfaceVariant} />
                        </TouchableOpacity>
                    </View>

                    {/* Payment Terms */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Termini di Pagamento
                        </Text>
                        <View style={[styles.inputContainer, {
                            backgroundColor: colors.surfaceVariant,
                            borderColor: colors.outline,
                        }]}>
                            <FileText size={20} color={colors.primary} />
                            <TextInput
                                style={[styles.input, { color: colors.onSurface }]}
                                placeholder="es. 30 giorni"
                                placeholderTextColor={colors.onSurfaceVariant}
                                value={formData.paymentTerms}
                                onChangeText={(text) => updateFormData('paymentTerms', text)}
                            />
                        </View>
                    </View>

                    {/* Notes */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Note
                        </Text>
                        <View style={[styles.textAreaContainer, {
                            backgroundColor: colors.surfaceVariant,
                            borderColor: colors.outline,
                        }]}>
                            <TextInput
                                style={[styles.textArea, { color: colors.onSurface }]}
                                placeholder="Note aggiuntive per la fattura..."
                                placeholderTextColor={colors.onSurfaceVariant}
                                value={formData.notes}
                                onChangeText={(text) => updateFormData('notes', text)}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 12,
    },
    saveButton: {
        padding: 8,
    },
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    input: {
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
    addItemButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 6,
    },
    addItemButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyItems: {
        padding: 40,
        borderRadius: 12,
        alignItems: 'center',
    },
    emptyItemsText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
    },
    emptyItemsSubtext: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    itemCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
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
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        fontSize: 16,
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
    itemInputSmall: {
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        fontSize: 14,
    },
    itemTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
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
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
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
    textAreaContainer: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    textArea: {
        fontSize: 16,
        minHeight: 100,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: screenWidth - 40,
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
        borderBottomColor: 'rgba(0,0,0,0.1)',
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
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    pickerModal: {
        width: screenWidth - 80,
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
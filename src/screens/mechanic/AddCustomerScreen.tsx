// src/screens/mechanic/AddCustomerScreen.tsx
import { useNavigation, useRoute } from '@react-navigation/native';
import {
    ArrowLeft,
    Building,
    Mail,
    MapPin,
    Phone,
    Save,
    User,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useStore } from '../../store';
import { useInvoicingStore } from '../../store/invoicingStore';

const { width: screenWidth } = Dimensions.get('window');

interface RouteParams {
    customerId?: string;
}

const AddCustomerScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const params = route.params as RouteParams | undefined;

    const { darkMode } = useStore();
    const { addCustomer, updateCustomer, getCustomerById } = useInvoicingStore();

    const isEditing = !!params?.customerId;
    const customer = isEditing ? getCustomerById(params!.customerId) : null;

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        vatNumber: '',
        fiscalCode: '',
        isCompany: false,
    });

    const [errors, setErrors] = useState<{[key: string]: string}>({});

    const theme = {
        background: darkMode ? '#111827' : '#f3f4f6',
        cardBackground: darkMode ? '#1f2937' : '#ffffff',
        text: darkMode ? '#ffffff' : '#000000',
        textSecondary: darkMode ? '#9ca3af' : '#6b7280',
        border: darkMode ? '#374151' : '#e5e7eb',
        inputBackground: darkMode ? '#374151' : '#ffffff',
        placeholderColor: darkMode ? '#9ca3af' : '#6b7280',
        accent: '#2563eb',
        primary: darkMode ? '#60a5fa' : '#2563eb',
    };

    // Load customer data if editing
    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name || '',
                email: customer.email || '',
                phone: customer.phone || '',
                address: customer.address || '',
                city: customer.city || '',
                postalCode: customer.postalCode || '',
                vatNumber: customer.vatNumber || '',
                fiscalCode: customer.fiscalCode || '',
                isCompany: customer.isCompany || false,
            });
        }
    }, [customer]);

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const newErrors: {[key: string]: string} = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Nome richiesto';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email non valida';
        }

        if (formData.isCompany && !formData.vatNumber.trim()) {
            newErrors.vatNumber = 'P.IVA richiesta per aziende';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateForm()) {
            Alert.alert('Errore', 'Compila correttamente tutti i campi obbligatori');
            return;
        }

        try {
            if (isEditing && params?.customerId) {
                updateCustomer(params.customerId, formData);
                Alert.alert('Successo', 'Cliente aggiornato con successo');
            } else {
                addCustomer(formData);
                Alert.alert('Successo', 'Cliente aggiunto con successo');
            }
            navigation.goBack();
        } catch (error) {
            console.error('Errore durante il salvataggio:', error);
            Alert.alert('Errore', 'Impossibile salvare il cliente');
        }
    };

    const FormCard = ({ title, icon: Icon, children }: any) => (
        <View style={[styles.formCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={styles.formCardHeader}>
                <View style={styles.formCardTitleContainer}>
                    <View style={[styles.formCardIcon, { backgroundColor: darkMode ? '#1e3a8a' : '#dbeafe' }]}>
                        <Icon size={20} color={darkMode ? '#60a5fa' : '#2563eb'} />
                    </View>
                    <Text style={[styles.formCardTitle, { color: theme.text }]}>{title}</Text>
                </View>
            </View>
            <View style={styles.formCardContent}>{children}</View>
        </View>
    );

    const FormInput = ({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize, error, required }: any) => (
        <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>
                {label} {required && <Text style={{ color: '#ef4444' }}>*</Text>}
            </Text>
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: theme.inputBackground,
                        color: theme.text,
                        borderColor: error ? '#ef4444' : theme.border
                    }
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={theme.placeholderColor}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        {isEditing ? 'Modifica Cliente' : 'Nuovo Cliente'}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                        {isEditing ? 'Aggiorna le informazioni del cliente' : 'Aggiungi un nuovo cliente'}
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Tipo Cliente */}
                    <View style={[styles.switchCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                        <View style={styles.switchContainer}>
                            <View style={styles.switchLabelContainer}>
                                <Building size={20} color={theme.primary} />
                                <Text style={[styles.switchLabel, { color: theme.text }]}>Cliente Aziendale</Text>
                            </View>
                            <Switch
                                value={formData.isCompany}
                                onValueChange={(value) => updateField('isCompany', value)}
                                trackColor={{ false: theme.border, true: theme.primary }}
                                thumbColor={formData.isCompany ? '#ffffff' : '#ffffff'}
                            />
                        </View>
                        <Text style={[styles.switchDescription, { color: theme.textSecondary }]}>
                            {formData.isCompany
                                ? 'Selezionato per aziende, professionisti e attività commerciali'
                                : 'Selezionato per clienti privati e persone fisiche'
                            }
                        </Text>
                    </View>

                    {/* Informazioni Generali */}
                    <FormCard title="Informazioni Generali" icon={User}>
                        <FormInput
                            label={formData.isCompany ? "Ragione Sociale" : "Nome e Cognome"}
                            placeholder={formData.isCompany ? "es. AutoService SpA" : "es. Mario Rossi"}
                            value={formData.name}
                            onChangeText={(text: string) => updateField('name', text)}
                            error={errors.name}
                            required={true}
                        />

                        <FormInput
                            label="Email"
                            placeholder="es. cliente@email.com"
                            value={formData.email}
                            onChangeText={(text: string) => updateField('email', text)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            error={errors.email}
                        />

                        <FormInput
                            label="Telefono"
                            placeholder="es. +39 123 456 7890"
                            value={formData.phone}
                            onChangeText={(text: string) => updateField('phone', text)}
                            keyboardType="phone-pad"
                        />
                    </FormCard>

                    {/* Indirizzo */}
                    <FormCard title="Indirizzo" icon={MapPin}>
                        <FormInput
                            label="Indirizzo"
                            placeholder="es. Via Roma 123"
                            value={formData.address}
                            onChangeText={(text: string) => updateField('address', text)}
                        />

                        <View style={styles.addressRow}>
                            <View style={styles.cityContainer}>
                                <FormInput
                                    label="Città"
                                    placeholder="es. Milano"
                                    value={formData.city}
                                    onChangeText={(text: string) => updateField('city', text)}
                                />
                            </View>

                            <View style={styles.postalCodeContainer}>
                                <FormInput
                                    label="CAP"
                                    placeholder="20100"
                                    value={formData.postalCode}
                                    onChangeText={(text: string) => updateField('postalCode', text)}
                                    keyboardType="number-pad"
                                />
                            </View>
                        </View>
                    </FormCard>

                    {/* Dati Fiscali */}
                    <FormCard title="Dati Fiscali" icon={Building}>
                        {formData.isCompany ? (
                            <FormInput
                                label="Partita IVA"
                                placeholder="es. IT12345678901"
                                value={formData.vatNumber}
                                onChangeText={(text: string) => updateField('vatNumber', text.toUpperCase())}
                                error={errors.vatNumber}
                                required={true}
                            />
                        ) : (
                            <FormInput
                                label="Codice Fiscale"
                                placeholder="es. RSSMRA80A01H501U"
                                value={formData.fiscalCode}
                                onChangeText={(text: string) => updateField('fiscalCode', text.toUpperCase())}
                                autoCapitalize="characters"
                            />
                        )}
                    </FormCard>

                    {/* Pulsanti Azione */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.cancelButton, { borderColor: theme.border }]}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Annulla</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: theme.accent }]}
                            onPress={handleSave}
                        >
                            <Save size={18} color="#ffffff" />
                            <Text style={styles.saveButtonText}>
                                {isEditing ? 'Aggiorna' : 'Salva'}
                            </Text>
                        </TouchableOpacity>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    headerTitleContainer: {
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
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    switchCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        marginBottom: 16,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    switchLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    switchDescription: {
        fontSize: 13,
        lineHeight: 18,
    },
    formCard: {
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    formCardHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    formCardTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    formCardIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    formCardTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    formCardContent: {
        padding: 16,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: 4,
    },
    addressRow: {
        flexDirection: 'row',
        gap: 12,
    },
    cityContainer: {
        flex: 2,
    },
    postalCodeContainer: {
        flex: 1,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AddCustomerScreen;
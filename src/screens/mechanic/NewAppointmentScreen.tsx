// src/screens/mechanic/NewAppointmentScreen.tsx
import { useNavigation } from '@react-navigation/native';
import {
    ArrowLeft,
    Calendar,
    Car,
    FileText,
    Plus,
    Save,
    User,
    Wrench,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
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
import CalendarAppointmentPicker from './CalendarAppointmentPicker';
import UserSearchModal from '../../components/UserSearchModal';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

const NewAppointmentScreen = () => {
    const navigation = useNavigation();
    const { darkMode } = useStore();
    const { addAppointment } = useWorkshopStore();

    // Stati per il form
    const [formData, setFormData] = useState({
        model: '',
        vin: '',
        licensePlate: '',
        owner: '',
        repairDescription: '',
        estimatedCost: '0'
    });

    const [errors, setErrors] = useState<{[key: string]: string}>({});

    // Stati per il calendario integrato
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);

    const isDesktop = Platform.OS === 'web' && screenWidth > 768;

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

    const [carData, setCarData] = useState({
        model: '',
        vin: '',
        licensePlate: '',
        owner: '',
        color: '',
        year: '',
        mileage: '',
        ownerId: '',
        ownerPhone: '',
        ownerEmail: '',
    });

    // Stati per la ricerca utenti
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const handleSelectUser = (user: any) => {
        setSelectedUser(user);
        setFormData(prev => ({
            ...prev,
            owner: user.name || user.email
        }));
        setCarData(prev => ({
            ...prev,
            owner: user.name || user.email,
            ownerId: user.id,
            ownerPhone: user.phone || '',
            ownerEmail: user.email || ''
        }));
        setShowUserSearch(false);
    };

    const updateFormData = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Rimuovi l'errore quando l'utente inizia a digitare
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

        if (!formData.model.trim()) {
            newErrors.model = 'Modello richiesto';
        }
        if (!formData.licensePlate.trim()) {
            newErrors.licensePlate = 'Targa richiesta';
        }
        if (!formData.owner.trim()) {
            newErrors.owner = 'Proprietario richiesto';
        }
        if (!formData.repairDescription.trim()) {
            newErrors.repairDescription = 'Descrizione richiesta';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const onSubmit = () => {
        if (!validateForm()) {
            Alert.alert('Errore', 'Compila tutti i campi obbligatori');
            return;
        }

        if (!startDate) {
            Alert.alert('Errore', 'Seleziona almeno la data di inizio dei lavori');
            return;
        }

        try {
            const finalEndDate = endDate || startDate;

            const newAppointmentId = addAppointment({
                model: formData.model,
                vin: formData.vin,
                licensePlate: formData.licensePlate,
                owner: formData.owner,
                repairs: [{
                    description: formData.repairDescription,
                    scheduledDate: startDate,
                    deliveryDate: finalEndDate,
                    totalCost: parseFloat(formData.estimatedCost) || 0,
                }]
            });

            console.log('Nuovo appuntamento creato con ID:', newAppointmentId);
            console.log('Periodo di lavorazione:', { startDate, endDate: finalEndDate });
            navigation.goBack();
        } catch (error) {
            console.error('Errore durante la creazione dell\'appuntamento:', error);
            Alert.alert('Errore', 'Impossibile creare l\'appuntamento');
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

    const FormInput = ({
                           label,
                           value,
                           onChangeText,
                           placeholder,
                           multiline,
                           keyboardType,
                           error,
                           rightElement
                       }: any) => (
        <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={[
                        styles.input,
                        {
                            backgroundColor: theme.inputBackground,
                            color: theme.text,
                            borderColor: error ? '#ef4444' : theme.border
                        },
                        multiline && styles.inputMultiline
                    ]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={theme.placeholderColor}
                    multiline={multiline}
                    numberOfLines={multiline ? 3 : 1}
                    keyboardType={keyboardType}
                />
                {rightElement}
            </View>
            {error && (
                <Text style={styles.errorText}>{error}</Text>
            )}
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
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Nuovo Appuntamento</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                        Registra un nuovo veicolo e crea un appuntamento
                    </Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Calendario Integrato */}
                <View style={[styles.calendarCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    <View style={styles.calendarHeader}>
                        <Calendar size={20} color={theme.primary} />
                        <Text style={[styles.calendarTitle, { color: theme.text }]}>Periodo di Lavorazione</Text>
                    </View>
                    <CalendarAppointmentPicker
                        startDate={startDate}
                        endDate={endDate}
                        onStartDateChange={setStartDate}
                        onEndDateChange={setEndDate}
                    />
                </View>

                {/* Dati Veicolo */}
                <FormCard title="Dati Veicolo" icon={Car}>
                    <FormInput
                        label="Modello *"
                        value={formData.model}
                        onChangeText={(text: string) => updateFormData('model', text)}
                        placeholder="es. Fiat Panda"
                        error={errors.model}
                    />

                    <FormInput
                        label="VIN (Numero Telaio)"
                        value={formData.vin}
                        onChangeText={(text: string) => updateFormData('vin', text)}
                        placeholder="es. 1HGBH41JXMN109186"
                    />

                    <FormInput
                        label="Targa *"
                        value={formData.licensePlate}
                        onChangeText={(text: string) => updateFormData('licensePlate', text.toUpperCase())}
                        placeholder="es. AB123CD"
                        error={errors.licensePlate}
                    />
                </FormCard>

                {/* Dati Proprietario */}
                <FormCard title="Dati Proprietario" icon={User}>
                    <FormInput
                        label="Proprietario *"
                        value={formData.owner}
                        onChangeText={(text: string) => updateFormData('owner', text)}
                        placeholder="Nome e cognome"
                        error={errors.owner}
                        rightElement={
                            <TouchableOpacity
                                style={styles.searchButton}
                                onPress={() => setShowUserSearch(true)}
                            >
                                <MaterialCommunityIcons name="account-search" size={24} color={theme.primary} />
                            </TouchableOpacity>
                        }
                    />
                </FormCard>

                {/* Dettagli Riparazione */}
                <FormCard title="Dettagli Riparazione" icon={Wrench}>
                    <FormInput
                        label="Descrizione Lavori *"
                        value={formData.repairDescription}
                        onChangeText={(text: string) => updateFormData('repairDescription', text)}
                        placeholder="Descrivi i lavori da effettuare"
                        multiline={true}
                        error={errors.repairDescription}
                    />

                    <FormInput
                        label="Costo Stimato (€)"
                        value={formData.estimatedCost}
                        onChangeText={(text: string) => updateFormData('estimatedCost', text)}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                    />
                </FormCard>

                {/* Note Informative */}
                <View style={[styles.infoCard, { backgroundColor: darkMode ? '#1e3a5f' : '#eff6ff', borderColor: darkMode ? '#2563eb' : '#bfdbfe' }]}>
                    <FileText size={18} color={darkMode ? '#60a5fa' : '#2563eb'} />
                    <Text style={[styles.infoText, { color: darkMode ? '#dbeafe' : '#1e40af' }]}>
                        Verifica tutti i dati inseriti prima di salvare l'appuntamento.
                    </Text>
                </View>

                {/* Pulsanti Azione */}
                <View style={[styles.actionButtons, isDesktop && styles.actionButtonsDesktop]}>
                    <TouchableOpacity
                        style={[styles.cancelButton, { borderColor: theme.border }]}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Annulla</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            { backgroundColor: startDate ? theme.accent : theme.textSecondary }
                        ]}
                        onPress={onSubmit}
                        disabled={!startDate}
                    >
                        <Save size={18} color="#ffffff" />
                        <Text style={styles.saveButtonText}>Salva Appuntamento</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* User Search Modal */}
            <UserSearchModal
                visible={showUserSearch}
                onClose={() => setShowUserSearch(false)}
                onSelectUser={handleSelectUser}
                darkMode={darkMode}
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
        paddingVertical: 16,
        borderBottomWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
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
    calendarCard: {
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
        overflow: 'hidden',
    },
    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 8,
    },
    calendarTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    formCard: {
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
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
    inputWrapper: {
        position: 'relative',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
    },
    inputMultiline: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    searchButton: {
        position: 'absolute',
        right: 8,
        top: 8,
        padding: 4,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: 4,
    },
    infoCard: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 16,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    actionButtonsDesktop: {
        maxWidth: 600,
        alignSelf: 'center',
        width: '100%',
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

export default NewAppointmentScreen;
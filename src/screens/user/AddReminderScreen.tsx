// src/screens/user/AddReminderScreen.tsx - VERSIONE AGGIORNATA CON UNIVERSAL PICKERS
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Card, Button, Chip, Surface, Avatar, List } from 'react-native-paper';
import {
    ArrowLeft,
    Bell,
    Calendar,
    Car,
    Save,
    Wrench,
    Shield,
    FileText,
    CheckCircle,
    RefreshCw,
    Settings,
    AlertTriangle,
    Info,
    Clock,
    Gauge,
} from 'lucide-react-native';

import { UniversalDatePicker } from '../../components/UniversalDatePicker';

import { useAppThemeManager } from '../../hooks/useTheme';
import { useUserData } from '../../hooks/useUserData';
import { db, auth } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ReminderFormData {
    vehicleId: string;
    title: string;
    description: string;
    type: string;
    dueDate: Date;
    dueMileage: string;
    isRecurring: boolean;
    recurringInterval: number;
    notifyDaysBefore: number;
    isActive: boolean;
}

const AddReminderScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { colors, isDark } = useAppThemeManager();
    const { vehicles, refreshData } = useUserData();

    const preselectedCarId = route.params?.carId;

    const [formData, setFormData] = useState<ReminderFormData>({
        vehicleId: preselectedCarId || vehicles?.[0]?.id || '',
        title: '',
        description: '',
        type: 'maintenance',
        dueDate: new Date(),
        dueMileage: '',
        isRecurring: false,
        recurringInterval: 365,
        notifyDaysBefore: 7,
        isActive: true,
    });

    const [isLoading, setIsLoading] = useState(false);
    const [showRecurringOptions, setShowRecurringOptions] = useState(false);

    const reminderTypes = [
        {
            id: 'maintenance',
            label: 'Manutenzione',
            icon: Wrench,
            color: '#FF9500',
            description: 'Tagliandi, cambio olio, filtri',
            suggestions: ['Tagliando completo', 'Cambio olio motore', 'Cambio filtri', 'Controllo freni']
        },
        {
            id: 'insurance',
            label: 'Assicurazione',
            icon: Shield,
            color: '#34C759',
            description: 'Rinnovo polizza assicurativa',
            suggestions: ['Rinnovo RCA', 'Rinnovo Kasko', 'Scadenza polizza']
        },
        {
            id: 'tax',
            label: 'Bollo',
            icon: FileText,
            color: '#007AFF',
            description: 'Pagamento tassa automobilistica',
            suggestions: ['Pagamento bollo auto', 'Tassa di circolazione']
        },
        {
            id: 'inspection',
            label: 'Revisione',
            icon: CheckCircle,
            color: '#5856D6',
            description: 'Revisione periodica obbligatoria',
            suggestions: ['Revisione ministeriale', 'Controllo tecnico']
        },
        {
            id: 'other',
            label: 'Altro',
            icon: Settings,
            color: '#FF3B30',
            description: 'Altri promemoria personalizzati',
            suggestions: []
        },
    ];

    const recurringOptions = [
        { value: 30, label: 'Ogni mese' },
        { value: 90, label: 'Ogni 3 mesi' },
        { value: 180, label: 'Ogni 6 mesi' },
        { value: 365, label: 'Ogni anno' },
        { value: 730, label: 'Ogni 2 anni' },
    ];

    const notificationOptions = [
        { value: 0, label: 'Giorno stesso' },
        { value: 1, label: '1 giorno prima' },
        { value: 3, label: '3 giorni prima' },
        { value: 7, label: '1 settimana prima' },
        { value: 14, label: '2 settimane prima' },
        { value: 30, label: '1 mese prima' },
    ];

    const handleSubmit = async () => {
        // Validazione
        if (!formData.vehicleId) {
            Alert.alert('Errore', 'Seleziona un veicolo');
            return;
        }
        if (!formData.title.trim()) {
            Alert.alert('Errore', 'Inserisci un titolo per il promemoria');
            return;
        }
        if (!formData.type) {
            Alert.alert('Errore', 'Seleziona un tipo di promemoria');
            return;
        }

        setIsLoading(true);

        try {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error('Utente non autenticato');

            // Prepara i dati per Firestore
            const reminderData = {
                ...formData,
                userId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                nextDueDate: formData.isRecurring
                    ? new Date(formData.dueDate.getTime() + formData.recurringInterval * 24 * 60 * 60 * 1000)
                    : null,
            };

            // Salva in Firestore
            await addDoc(collection(db, 'users', userId, 'reminders'), reminderData);

            // Aggiorna i dati
            await refreshData();

            Alert.alert(
                'Successo',
                'Promemoria creato con successo',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } catch (error) {
            console.error('Errore creazione promemoria:', error);
            Alert.alert('Errore', 'Si è verificato un errore durante la creazione del promemoria');
        } finally {
            setIsLoading(false);
        }
    };

    const selectedType = reminderTypes.find(t => t.id === formData.type);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <Surface style={[styles.header, { backgroundColor: colors.surface }]} elevation={2}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <ArrowLeft size={24} color={colors.onSurface} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
                    Nuovo Promemoria
                </Text>
                <View style={{ width: 40 }} />
            </Surface>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <ScrollView showsVerticalScrollIndicator={false}>

                    {/* Selezione Veicolo */}
                    <Card style={styles.card}>
                        <Card.Title
                            title="Veicolo"
                            left={(props) => <Car {...props} />}
                        />
                        <Card.Content>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.vehicleList}>
                                    {vehicles?.map(vehicle => (
                                        <Chip
                                            key={vehicle.id}
                                            selected={formData.vehicleId === vehicle.id}
                                            onPress={() => setFormData({...formData, vehicleId: vehicle.id})}
                                            style={styles.vehicleChip}
                                        >
                                            {vehicle.brand} {vehicle.model}
                                        </Chip>
                                    ))}
                                </View>
                            </ScrollView>
                        </Card.Content>
                    </Card>

                    {/* Tipo Promemoria */}
                    <Card style={styles.card}>
                        <Card.Title
                            title="Tipo Promemoria"
                            left={(props) => <Bell {...props} />}
                        />
                        <Card.Content>
                            <View style={styles.typeGrid}>
                                {reminderTypes.map(type => {
                                    const Icon = type.icon;
                                    const isSelected = formData.type === type.id;
                                    return (
                                        <TouchableOpacity
                                            key={type.id}
                                            style={[
                                                styles.typeCard,
                                                {
                                                    backgroundColor: isSelected ? type.color : colors.surfaceVariant,
                                                    borderColor: isSelected ? type.color : colors.outline,
                                                }
                                            ]}
                                            onPress={() => setFormData({...formData, type: type.id})}
                                        >
                                            <Icon
                                                size={28}
                                                color={isSelected ? 'white' : colors.onSurfaceVariant}
                                            />
                                            <Text style={[
                                                styles.typeLabel,
                                                { color: isSelected ? 'white' : colors.onSurfaceVariant }
                                            ]}>
                                                {type.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {selectedType && selectedType.suggestions.length > 0 && (
                                <View style={styles.suggestionsContainer}>
                                    <Text style={[styles.suggestionsTitle, { color: colors.onSurfaceVariant }]}>
                                        Suggerimenti:
                                    </Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View style={styles.suggestionsList}>
                                            {selectedType.suggestions.map((suggestion, index) => (
                                                <Chip
                                                    key={index}
                                                    onPress={() => setFormData({...formData, title: suggestion})}
                                                    style={styles.suggestionChip}
                                                >
                                                    {suggestion}
                                                </Chip>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>
                            )}
                        </Card.Content>
                    </Card>

                    {/* Dettagli Promemoria */}
                    <Card style={styles.card}>
                        <Card.Title
                            title="Dettagli"
                            left={(props) => <Info {...props} />}
                        />
                        <Card.Content>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: colors.surfaceVariant,
                                        color: colors.onSurface,
                                        borderColor: colors.outline,
                                    }
                                ]}
                                placeholder="Titolo promemoria"
                                placeholderTextColor={colors.onSurfaceVariant}
                                value={formData.title}
                                onChangeText={(text) => setFormData({...formData, title: text})}
                            />

                            <TextInput
                                style={[
                                    styles.input,
                                    styles.textArea,
                                    {
                                        backgroundColor: colors.surfaceVariant,
                                        color: colors.onSurface,
                                        borderColor: colors.outline,
                                    }
                                ]}
                                placeholder="Descrizione (opzionale)"
                                placeholderTextColor={colors.onSurfaceVariant}
                                value={formData.description}
                                onChangeText={(text) => setFormData({...formData, description: text})}
                                multiline
                                numberOfLines={3}
                            />
                        </Card.Content>
                    </Card>

                    {/* Scadenza */}
                    <Card style={styles.card}>
                        <Card.Title
                            title="Scadenza"
                            left={(props) => <Calendar {...props} />}
                        />
                        <Card.Content>
                            {/* Data Scadenza con Universal Date Picker */}
                            <UniversalDatePicker
                                value={formData.dueDate}
                                onChange={(date) => setFormData({...formData, dueDate: date})}
                                label="Data di scadenza"
                                mode="date"
                                minimumDate={new Date()}
                                showCalendar={true}
                                format="long"
                            />

                            {/* Chilometraggio */}
                            <View style={styles.mileageContainer}>
                                <Gauge size={20} color={colors.primary} />
                                <TextInput
                                    style={[
                                        styles.mileageInput,
                                        {
                                            backgroundColor: colors.surfaceVariant,
                                            color: colors.onSurface,
                                            borderColor: colors.outline,
                                        }
                                    ]}
                                    placeholder="Chilometraggio scadenza (opzionale)"
                                    placeholderTextColor={colors.onSurfaceVariant}
                                    value={formData.dueMileage}
                                    onChangeText={(text) => setFormData({...formData, dueMileage: text})}
                                    keyboardType="numeric"
                                />
                            </View>
                        </Card.Content>
                    </Card>

                    {/* Opzioni Ricorrenza */}
                    <Card style={styles.card}>
                        <Card.Title
                            title="Ricorrenza"
                            left={(props) => <RefreshCw {...props} />}
                        />
                        <Card.Content>
                            <View style={styles.switchContainer}>
                                <Text style={[styles.switchLabel, { color: colors.onSurface }]}>
                                    Promemoria ricorrente
                                </Text>
                                <Switch
                                    value={formData.isRecurring}
                                    onValueChange={(value) => {
                                        setFormData({...formData, isRecurring: value});
                                        setShowRecurringOptions(value);
                                    }}
                                    trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                                    thumbColor={formData.isRecurring ? colors.onPrimary : colors.onSurfaceVariant}
                                />
                            </View>

                            {showRecurringOptions && (
                                <View style={styles.recurringOptions}>
                                    <Text style={[styles.optionLabel, { color: colors.onSurfaceVariant }]}>
                                        Ripeti ogni:
                                    </Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View style={styles.optionsList}>
                                            {recurringOptions.map(option => (
                                                <Chip
                                                    key={option.value}
                                                    selected={formData.recurringInterval === option.value}
                                                    onPress={() => setFormData({...formData, recurringInterval: option.value})}
                                                    style={styles.optionChip}
                                                >
                                                    {option.label}
                                                </Chip>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>
                            )}
                        </Card.Content>
                    </Card>

                    {/* Notifiche */}
                    <Card style={styles.card}>
                        <Card.Title
                            title="Notifiche"
                            left={(props) => <Bell {...props} />}
                        />
                        <Card.Content>
                            <View style={styles.switchContainer}>
                                <Text style={[styles.switchLabel, { color: colors.onSurface }]}>
                                    Attiva notifiche
                                </Text>
                                <Switch
                                    value={formData.isActive}
                                    onValueChange={(value) => setFormData({...formData, isActive: value})}
                                    trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                                    thumbColor={formData.isActive ? colors.onPrimary : colors.onSurfaceVariant}
                                />
                            </View>

                            {formData.isActive && (
                                <View style={styles.notificationOptions}>
                                    <Text style={[styles.optionLabel, { color: colors.onSurfaceVariant }]}>
                                        Notifica:
                                    </Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View style={styles.optionsList}>
                                            {notificationOptions.map(option => (
                                                <Chip
                                                    key={option.value}
                                                    selected={formData.notifyDaysBefore === option.value}
                                                    onPress={() => setFormData({...formData, notifyDaysBefore: option.value})}
                                                    style={styles.optionChip}
                                                >
                                                    {option.label}
                                                </Chip>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>
                            )}
                        </Card.Content>
                    </Card>

                    {/* Submit Button */}
                    <Button
                        mode="contained"
                        onPress={handleSubmit}
                        loading={isLoading}
                        disabled={isLoading}
                        style={styles.submitButton}
                        icon="bell-plus"
                    >
                        Crea Promemoria
                    </Button>

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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    card: {
        margin: 16,
        marginBottom: 8,
    },
    vehicleList: {
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 8,
    },
    vehicleChip: {
        marginRight: 8,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    typeCard: {
        width: '30%',
        aspectRatio: 1.2,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    typeLabel: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
    suggestionsContainer: {
        marginTop: 8,
    },
    suggestionsTitle: {
        fontSize: 12,
        marginBottom: 8,
    },
    suggestionsList: {
        flexDirection: 'row',
        gap: 8,
    },
    suggestionChip: {
        marginRight: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 12,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    mileageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 12,
    },
    mileageInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    recurringOptions: {
        marginTop: 16,
    },
    notificationOptions: {
        marginTop: 16,
    },
    optionLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    optionsList: {
        flexDirection: 'row',
        gap: 8,
    },
    optionChip: {
        marginRight: 8,
    },
    submitButton: {
        margin: 16,
        marginBottom: 32,
        paddingVertical: 8,
    },
});

export default AddReminderScreen;
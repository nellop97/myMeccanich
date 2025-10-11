// src/screens/user/AddMaintenanceScreen.tsx
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Alert,
    Switch,
    TextInput,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { UniversalDatePicker } from '../../components';
import {
    ArrowLeft,
    Calendar,
    DollarSign,
    FileText,
    MapPin,
    Save,
    Clock,
    AlertTriangle,
    Car,
    Wrench,
    Settings,
    Zap,
    Shield,
    Filter,
    Battery,
    Thermometer,
    Gauge,
    X,
    Check,
} from 'lucide-react-native';

import { useAppThemeManager } from '../../hooks/useTheme';
import { db, auth } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface RouteParams {
    carId?: string;
    category?: string;
}

const MAINTENANCE_CATEGORIES = [
    {
        id: 'oil_change',
        title: 'Cambio Olio',
        icon: Wrench,
        color: '#FF9500',
        description: 'Cambio olio motore e filtro',
    },
    {
        id: 'tires',
        title: 'Pneumatici',
        icon: Car,
        color: '#5AC8FA',
        description: 'Sostituzione o rotazione gomme',
    },
    {
        id: 'brakes',
        title: 'Freni',
        icon: Shield,
        color: '#FF3B30',
        description: 'Pastiglie, dischi, liquido freni',
    },
    {
        id: 'battery',
        title: 'Batteria',
        icon: Battery,
        color: '#34C759',
        description: 'Sostituzione o controllo batteria',
    },
    {
        id: 'filters',
        title: 'Filtri',
        icon: Filter,
        color: '#5856D6',
        description: 'Filtro aria, abitacolo, carburante',
    },
    {
        id: 'cooling',
        title: 'Raffreddamento',
        icon: Thermometer,
        color: '#007AFF',
        description: 'Liquido refrigerante, termostato',
    },
    {
        id: 'electrical',
        title: 'Impianto Elettrico',
        icon: Zap,
        color: '#FFD60A',
        description: 'Luci, cablaggio, fusibili',
    },
    {
        id: 'suspension',
        title: 'Sospensioni',
        icon: Settings,
        color: '#8E8E93',
        description: 'Ammortizzatori, molle, barra stabilizzatrice',
    },
    {
        id: 'general',
        title: 'Manutenzione Generale',
        icon: Wrench,
        color: '#32ADE6',
        description: 'Tagliando o revisione completa',
    },
    {
        id: 'other',
        title: 'Altro',
        icon: FileText,
        color: '#AF52DE',
        description: 'Altri interventi',
    },
];

const AddMaintenanceScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { carId, category } = (route.params as RouteParams) || {};
    const { colors, isDark } = useAppThemeManager();

    // Form state
    const [formData, setFormData] = useState({
        carId: carId || '',
        category: category || '',
        description: '',
        date: new Date(),
        cost: '',
        mileage: '',
        workshop: '',
        notes: '',
        nextDueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // +6 months
        nextDueMileage: '',
        reminder: true,
        reminderDays: '30',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.carId) newErrors.carId = 'Veicolo non specificato';
        if (!formData.category) newErrors.category = 'Seleziona una categoria';
        if (!formData.description.trim()) newErrors.description = 'Inserisci una descrizione';

        if (formData.cost && isNaN(parseFloat(formData.cost))) {
            newErrors.cost = 'Costo non valido';
        }

        if (formData.mileage && isNaN(parseInt(formData.mileage))) {
            newErrors.mileage = 'Chilometraggio non valido';
        }

        if (formData.nextDueMileage && isNaN(parseInt(formData.nextDueMileage))) {
            newErrors.nextDueMileage = 'Chilometraggio non valido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Utente non autenticato');

            const maintenanceData = {
                userId: user.uid,
                carId: formData.carId,
                category: formData.category,
                description: formData.description.trim(),
                date: formData.date.toISOString(),
                cost: formData.cost ? parseFloat(formData.cost) : null,
                mileage: formData.mileage ? parseInt(formData.mileage) : null,
                workshop: formData.workshop.trim() || null,
                notes: formData.notes.trim() || null,
                nextDueDate: formData.nextDueDate ? formData.nextDueDate.toISOString() : null,
                nextDueMileage: formData.nextDueMileage ? parseInt(formData.nextDueMileage) : null,
                reminder: formData.reminder,
                reminderDays: parseInt(formData.reminderDays) || 30,
                status: 'completed',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'maintenance'), maintenanceData);

            Alert.alert(
                'Successo',
                'Manutenzione registrata con successo!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error) {
            console.error('Error adding maintenance:', error);
            Alert.alert('Errore', 'Impossibile registrare la manutenzione. Riprova.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderCategoryPicker = () => {
        const selectedCategory = MAINTENANCE_CATEGORIES.find(c => c.id === formData.category);

        return (
            <Modal
                visible={showCategoryPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCategoryPicker(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowCategoryPicker(false)}
                >
                    <View style={[styles.categoryPickerModal, { backgroundColor: colors.surface }]}>
                        <View style={styles.categoryPickerHeader}>
                            <Text style={[styles.categoryPickerTitle, { color: colors.onSurface }]}>
                                Tipo di Manutenzione
                            </Text>
                            <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                                <X size={24} color={colors.onSurface} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            {MAINTENANCE_CATEGORIES.map((cat) => {
                                const Icon = cat.icon;
                                const isSelected = formData.category === cat.id;

                                return (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.categoryOption,
                                            {
                                                backgroundColor: isSelected ? colors.primaryContainer : colors.surfaceVariant,
                                                borderColor: isSelected ? colors.primary : colors.outline,
                                            },
                                        ]}
                                        onPress={() => {
                                            updateFormData('category', cat.id);
                                            setShowCategoryPicker(false);
                                        }}
                                    >
                                        <View style={[styles.categoryIconContainer, { backgroundColor: cat.color }]}>
                                            <Icon size={24} color="#FFF" />
                                        </View>
                                        <View style={styles.categoryInfo}>
                                            <Text style={[styles.categoryTitle, { color: colors.onSurface }]}>
                                                {cat.title}
                                            </Text>
                                            <Text style={[styles.categoryDescription, { color: colors.onSurfaceVariant }]}>
                                                {cat.description}
                                            </Text>
                                        </View>
                                        {isSelected && <Check size={20} color={colors.primary} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        );
    };

    const selectedCategory = MAINTENANCE_CATEGORIES.find(c => c.id === formData.category);
    const SelectedIcon = selectedCategory?.icon || Wrench;

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
                    Aggiungi Manutenzione
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
                    {/* Category */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Tipo di Manutenzione *
                        </Text>
                        <TouchableOpacity
                            style={[
                                styles.categorySelectorButton,
                                {
                                    backgroundColor: colors.surfaceVariant,
                                    borderColor: errors.category ? colors.error : colors.outline,
                                },
                            ]}
                            onPress={() => setShowCategoryPicker(true)}
                        >
                            {selectedCategory ? (
                                <>
                                    <View style={[styles.selectedCategoryIcon, { backgroundColor: selectedCategory.color }]}>
                                        <SelectedIcon size={20} color="#FFF" />
                                    </View>
                                    <View style={styles.selectedCategoryInfo}>
                                        <Text style={[styles.selectedCategoryTitle, { color: colors.onSurface }]}>
                                            {selectedCategory.title}
                                        </Text>
                                        <Text style={[styles.selectedCategoryDesc, { color: colors.onSurfaceVariant }]}>
                                            {selectedCategory.description}
                                        </Text>
                                    </View>
                                </>
                            ) : (
                                <Text style={[styles.placeholderText, { color: colors.onSurfaceVariant }]}>
                                    Seleziona il tipo di manutenzione
                                </Text>
                            )}
                            <Wrench size={20} color={colors.onSurfaceVariant} />
                        </TouchableOpacity>
                        {errors.category && (
                            <Text style={[styles.errorText, { color: colors.error }]}>
                                {errors.category}
                            </Text>
                        )}
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Descrizione *
                        </Text>
                        <View style={[
                            styles.inputContainer,
                            {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: errors.description ? colors.error : colors.outline,
                            },
                        ]}>
                            <FileText size={20} color={colors.primary} />
                            <TextInput
                                style={[styles.input, { color: colors.onSurface }]}
                                placeholder="es. Cambio olio motore e filtro"
                                placeholderTextColor={colors.onSurfaceVariant}
                                value={formData.description}
                                onChangeText={(text) => updateFormData('description', text)}
                            />
                        </View>
                        {errors.description && (
                            <Text style={[styles.errorText, { color: colors.error }]}>
                                {errors.description}
                            </Text>
                        )}
                    </View>

                    {/* Date */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Data Intervento
                        </Text>
                        <UniversalDatePicker
                            value={formData.date}
                            onChange={(date) => updateFormData('date', date)}
                            maximumDate={new Date()}
                        />
                    </View>

                    {/* Cost */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Costo
                        </Text>
                        <View style={[
                            styles.inputContainer,
                            {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: errors.cost ? colors.error : colors.outline,
                            },
                        ]}>
                            <DollarSign size={20} color={colors.primary} />
                            <TextInput
                                style={[styles.input, { color: colors.onSurface }]}
                                placeholder="0.00"
                                placeholderTextColor={colors.onSurfaceVariant}
                                value={formData.cost}
                                onChangeText={(text) => updateFormData('cost', text)}
                                keyboardType="decimal-pad"
                            />
                            <Text style={[styles.currency, { color: colors.onSurfaceVariant }]}>
                                €
                            </Text>
                        </View>
                        {errors.cost && (
                            <Text style={[styles.errorText, { color: colors.error }]}>
                                {errors.cost}
                            </Text>
                        )}
                    </View>

                    {/* Mileage */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Chilometraggio
                        </Text>
                        <View style={[
                            styles.inputContainer,
                            {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: errors.mileage ? colors.error : colors.outline,
                            },
                        ]}>
                            <Gauge size={20} color={colors.primary} />
                            <TextInput
                                style={[styles.input, { color: colors.onSurface }]}
                                placeholder="es. 50000"
                                placeholderTextColor={colors.onSurfaceVariant}
                                value={formData.mileage}
                                onChangeText={(text) => updateFormData('mileage', text)}
                                keyboardType="numeric"
                            />
                            <Text style={[styles.currency, { color: colors.onSurfaceVariant }]}>
                                km
                            </Text>
                        </View>
                        {errors.mileage && (
                            <Text style={[styles.errorText, { color: colors.error }]}>
                                {errors.mileage}
                            </Text>
                        )}
                    </View>

                    {/* Workshop */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Officina
                        </Text>
                        <View style={[
                            styles.inputContainer,
                            {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: colors.outline,
                            },
                        ]}>
                            <MapPin size={20} color={colors.primary} />
                            <TextInput
                                style={[styles.input, { color: colors.onSurface }]}
                                placeholder="es. Officina Rossi"
                                placeholderTextColor={colors.onSurfaceVariant}
                                value={formData.workshop}
                                onChangeText={(text) => updateFormData('workshop', text)}
                            />
                        </View>
                    </View>

                    {/* Notes */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Note
                        </Text>
                        <View style={[
                            styles.textAreaContainer,
                            {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: colors.outline,
                            },
                        ]}>
                            <TextInput
                                style={[styles.textArea, { color: colors.onSurface }]}
                                placeholder="Aggiungi note aggiuntive (opzionale)"
                                placeholderTextColor={colors.onSurfaceVariant}
                                value={formData.notes}
                                onChangeText={(text) => updateFormData('notes', text)}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    {/* Divider */}
                    <View style={[styles.divider, { backgroundColor: colors.outline }]} />

                    {/* Next Service Section */}
                    <Text style={[styles.sectionHeader, { color: colors.onSurface }]}>
                        Prossimo Intervento
                    </Text>

                    {/* Next Due Date */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Prossima Scadenza
                        </Text>
                        <UniversalDatePicker
                            value={formData.nextDueDate}
                            onChange={(date) => updateFormData('nextDueDate', date)}
                            minimumDate={formData.date}
                        />
                    </View>

                    {/* Next Due Mileage */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Prossimo Chilometraggio
                        </Text>
                        <View style={[
                            styles.inputContainer,
                            {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: errors.nextDueMileage ? colors.error : colors.outline,
                            },
                        ]}>
                            <Gauge size={20} color={colors.primary} />
                            <TextInput
                                style={[styles.input, { color: colors.onSurface }]}
                                placeholder="es. 60000"
                                placeholderTextColor={colors.onSurfaceVariant}
                                value={formData.nextDueMileage}
                                onChangeText={(text) => updateFormData('nextDueMileage', text)}
                                keyboardType="numeric"
                            />
                            <Text style={[styles.currency, { color: colors.onSurfaceVariant }]}>
                                km
                            </Text>
                        </View>
                        {errors.nextDueMileage && (
                            <Text style={[styles.errorText, { color: colors.error }]}>
                                {errors.nextDueMileage}
                            </Text>
                        )}
                    </View>

                    {/* Reminder */}
                    <View style={styles.section}>
                        <View style={styles.reminderHeader}>
                            <View style={styles.reminderTitleContainer}>
                                <Clock size={20} color={colors.primary} />
                                <Text style={[styles.reminderTitle, { color: colors.onSurface }]}>
                                    Attiva Promemoria
                                </Text>
                            </View>
                            <Switch
                                value={formData.reminder}
                                onValueChange={(value) => updateFormData('reminder', value)}
                                trackColor={{ false: colors.outline, true: colors.primaryContainer }}
                                thumbColor={formData.reminder ? colors.primary : colors.onSurfaceVariant}
                            />
                        </View>

                        {formData.reminder && (
                            <View style={[
                                styles.reminderDaysContainer,
                                {
                                    backgroundColor: colors.surfaceVariant,
                                    borderColor: colors.outline,
                                },
                            ]}>
                                <AlertTriangle size={16} color={colors.primary} />
                                <Text style={[styles.reminderDaysLabel, { color: colors.onSurfaceVariant }]}>
                                    Avvisami
                                </Text>
                                <TextInput
                                    style={[styles.reminderDaysInput, { color: colors.onSurface }]}
                                    value={formData.reminderDays}
                                    onChangeText={(text) => updateFormData('reminderDays', text)}
                                    keyboardType="numeric"
                                />
                                <Text style={[styles.reminderDaysLabel, { color: colors.onSurfaceVariant }]}>
                                    giorni prima
                                </Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {renderCategoryPicker()}
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
        marginBottom: 20,
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    categorySelectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    selectedCategoryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedCategoryInfo: {
        flex: 1,
        marginLeft: 12,
    },
    selectedCategoryTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    selectedCategoryDesc: {
        fontSize: 12,
        marginTop: 2,
    },
    placeholderText: {
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
    },
    input: {
        flex: 1,
        fontSize: 16,
        marginLeft: 12,
    },
    currency: {
        fontSize: 16,
        fontWeight: '500',
    },
    textAreaContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    textArea: {
        fontSize: 16,
        minHeight: 80,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    divider: {
        height: 1,
        marginVertical: 24,
    },
    reminderHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    reminderTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    reminderTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    reminderDaysContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 12,
        gap: 8,
    },
    reminderDaysLabel: {
        fontSize: 14,
    },
    reminderDaysInput: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        minWidth: 40,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    categoryPickerModal: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
    },
    categoryPickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    categoryPickerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    categoryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 20,
        marginVertical: 6,
        borderRadius: 12,
        borderWidth: 2,
    },
    categoryIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryInfo: {
        flex: 1,
        marginLeft: 12,
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    categoryDescription: {
        fontSize: 12,
        marginTop: 2,
    },
});

export default AddMaintenanceScreen;
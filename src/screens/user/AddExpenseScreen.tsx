// src/screens/user/AddExpenseScreen.tsx
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    StyleSheet,
    Platform,
    KeyboardAvoidingView,
    StatusBar,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { UniversalDatePicker } from '../../components';
import {
    ArrowLeft,
    Calendar,
    DollarSign,
    Camera,
    FileText,
    Save,
    Tag,
    MapPin,
    Receipt,
    X,
    Check,
} from 'lucide-react-native';
import { db, auth } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAppThemeManager } from '../../hooks/useTheme';

interface RouteParams {
    carId: string;
}

const EXPENSE_CATEGORIES = [
    { id: 'parking', label: 'Parcheggio', icon: '🅿️', color: '#007AFF' },
    { id: 'tolls', label: 'Pedaggi', icon: '🛣️', color: '#FF9500' },
    { id: 'washing', label: 'Lavaggio', icon: '🧽', color: '#5AC8FA' },
    { id: 'fines', label: 'Multe', icon: '🚫', color: '#FF3B30' },
    { id: 'accessories', label: 'Accessori', icon: '🔧', color: '#34C759' },
    { id: 'registration', label: 'Bollo/Tasse', icon: '📄', color: '#8E8E93' },
    { id: 'other', label: 'Altro', icon: '📦', color: '#5856D6' }
];

const AddExpenseScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { carId } = route.params as RouteParams;
    const { colors, isDark } = useAppThemeManager();

    // Form state
    const [formData, setFormData] = useState({
        date: new Date(),
        amount: '',
        category: '',
        description: '',
        location: '',
        notes: '',
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

        if (!formData.amount.trim()) {
            newErrors.amount = 'Inserisci un importo';
        } else if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Importo non valido';
        }

        if (!formData.category) {
            newErrors.category = 'Seleziona una categoria';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Inserisci una descrizione';
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

            const expenseData = {
                userId: user.uid,
                carId: carId,
                date: formData.date.toISOString(),
                amount: parseFloat(formData.amount),
                category: formData.category,
                description: formData.description.trim(),
                location: formData.location.trim() || null,
                notes: formData.notes.trim() || null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'expenses'), expenseData);

            Alert.alert(
                'Successo',
                'Spesa registrata con successo!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error) {
            console.error('Error adding expense:', error);
            Alert.alert('Errore', 'Impossibile registrare la spesa. Riprova.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderCategoryPicker = () => {
        const selectedCategory = EXPENSE_CATEGORIES.find(c => c.id === formData.category);

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
                                Seleziona Categoria
                            </Text>
                            <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                                <X size={24} color={colors.onSurface} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            {EXPENSE_CATEGORIES.map((category) => {
                                const isSelected = formData.category === category.id;

                                return (
                                    <TouchableOpacity
                                        key={category.id}
                                        style={[
                                            styles.categoryOption,
                                            {
                                                backgroundColor: isSelected ? colors.primaryContainer : colors.surfaceVariant,
                                                borderColor: isSelected ? colors.primary : colors.outline,
                                            },
                                        ]}
                                        onPress={() => {
                                            updateFormData('category', category.id);
                                            setShowCategoryPicker(false);
                                        }}
                                    >
                                        <View style={[styles.categoryIconContainer, { backgroundColor: category.color }]}>
                                            <Text style={styles.categoryEmoji}>{category.icon}</Text>
                                        </View>
                                        <Text style={[styles.categoryLabel, { color: colors.onSurface }]}>
                                            {category.label}
                                        </Text>
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

    const selectedCategory = EXPENSE_CATEGORIES.find(c => c.id === formData.category);

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
                    Aggiungi Spesa
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
                    {/* Date */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Data
                        </Text>
                        <UniversalDatePicker
                            value={formData.date}
                            onChange={(date) => updateFormData('date', date)}
                            maximumDate={new Date()}
                        />
                    </View>

                    {/* Amount */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Importo *
                        </Text>
                        <View style={[
                            styles.inputContainer,
                            {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: errors.amount ? colors.error : colors.outline,
                            },
                        ]}>
                            <DollarSign size={20} color={colors.primary} />
                            <TextInput
                                style={[styles.input, { color: colors.onSurface }]}
                                placeholder="0.00"
                                placeholderTextColor={colors.onSurfaceVariant}
                                value={formData.amount}
                                onChangeText={(text) => updateFormData('amount', text)}
                                keyboardType="decimal-pad"
                            />
                            <Text style={[styles.currency, { color: colors.onSurfaceVariant }]}>
                                €
                            </Text>
                        </View>
                        {errors.amount && (
                            <Text style={[styles.errorText, { color: colors.error }]}>
                                {errors.amount}
                            </Text>
                        )}
                    </View>

                    {/* Category */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Categoria *
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
                                        <Text style={styles.selectedCategoryEmoji}>{selectedCategory.icon}</Text>
                                    </View>
                                    <Text style={[styles.selectedCategoryLabel, { color: colors.onSurface }]}>
                                        {selectedCategory.label}
                                    </Text>
                                </>
                            ) : (
                                <Text style={[styles.placeholderText, { color: colors.onSurfaceVariant }]}>
                                    Seleziona una categoria
                                </Text>
                            )}
                            <Tag size={20} color={colors.onSurfaceVariant} />
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
                                placeholder="es. Parcheggio centro città"
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

                    {/* Location */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Luogo
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
                                placeholder="es. Milano, Via Roma 123"
                                placeholderTextColor={colors.onSurfaceVariant}
                                value={formData.location}
                                onChangeText={(text) => updateFormData('location', text)}
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

                    {/* Info Box */}
                    <View style={[styles.infoBox, {
                        backgroundColor: colors.primaryContainer,
                        borderColor: colors.primary,
                    }]}>
                        <Receipt size={20} color={colors.primary} />
                        <Text style={[styles.infoText, { color: colors.onPrimaryContainer }]}>
                            Registra tutte le spese accessorie del tuo veicolo per avere una panoramica completa dei costi
                        </Text>
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
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
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
    selectedCategoryEmoji: {
        fontSize: 20,
    },
    selectedCategoryLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 12,
    },
    placeholderText: {
        flex: 1,
        fontSize: 16,
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
    infoBox: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 8,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    categoryPickerModal: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '60%',
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
    categoryEmoji: {
        fontSize: 24,
    },
    categoryLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
});

export default AddExpenseScreen;
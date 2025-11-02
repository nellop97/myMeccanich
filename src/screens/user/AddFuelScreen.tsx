// src/screens/user/AddFuelScreen.tsx
import React, { useState, useCallback } from 'react';
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
    KeyboardAvoidingView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { UniversalDatePicker } from '../../components';
import {
    ArrowLeft,
    Calendar,
    Fuel,
    DollarSign,
    MapPin,
    Save,
    Calculator
} from 'lucide-react-native';
import { db, auth } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useStore } from '../../store';
import { useAppThemeManager } from '../../hooks/useTheme';

interface RouteParams {
    carId: string;
}

const fuelTypes = [
    { id: 'gasoline', label: 'Benzina', icon: '⛽' },
    { id: 'diesel', label: 'Diesel', icon: '🚛' },
    { id: 'lpg', label: 'GPL', icon: '🔥' },
    { id: 'electric', label: 'Elettrico', icon: '⚡' }
];

const AddFuelScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { carId } = route.params as RouteParams;
    const { colors, isDark } = useAppThemeManager();

    const [formData, setFormData] = useState({
        date: new Date(),
        liters: '',
        totalCost: '',
        pricePerLiter: '',
        fuelType: 'gasoline' as 'gasoline' | 'diesel' | 'lpg' | 'electric',
        currentMileage: '',
        gasStation: '',
        location: '',
        notes: ''
    });

    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [consumption, setConsumption] = useState<{kmPerLiter?: number, costPer100km?: number}>({});

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear error
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }

        // Auto-calculate price per liter or total cost
        if (field === 'liters' || field === 'totalCost') {
            const liters = field === 'liters' ? parseFloat(value) : parseFloat(formData.liters);
            const total = field === 'totalCost' ? parseFloat(value) : parseFloat(formData.totalCost);

            if (liters && total) {
                if (field === 'liters') {
                    const pricePerLiter = (total / liters).toFixed(3);
                    setFormData(prev => ({ ...prev, pricePerLiter }));
                } else if (field === 'totalCost') {
                    const pricePerLiter = (total / liters).toFixed(3);
                    setFormData(prev => ({ ...prev, pricePerLiter }));
                }
            }
        }

        if (field === 'pricePerLiter' && formData.liters) {
            const total = (parseFloat(value) * parseFloat(formData.liters)).toFixed(2);
            setFormData(prev => ({ ...prev, totalCost: total }));
        }
    };

    const validateForm = () => {
        const newErrors: {[key: string]: string} = {};

        if (!formData.liters || parseFloat(formData.liters) <= 0) {
            newErrors.liters = 'Inserisci i litri riforniti';
        }
        if (!formData.totalCost || parseFloat(formData.totalCost) <= 0) {
            newErrors.totalCost = 'Inserisci il costo totale';
        }
        if (!formData.currentMileage || parseFloat(formData.currentMileage) <= 0) {
            newErrors.currentMileage = 'Inserisci il chilometraggio';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            Alert.alert('Errore', 'Compila tutti i campi obbligatori');
            return;
        }

        setIsLoading(true);

        try {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error('Utente non autenticato');

            await addDoc(collection(db, 'users', userId, 'cars', carId, 'fuel'), {
                date: formData.date,
                liters: parseFloat(formData.liters),
                totalCost: parseFloat(formData.totalCost),
                pricePerLiter: parseFloat(formData.pricePerLiter),
                fuelType: formData.fuelType,
                currentMileage: parseFloat(formData.currentMileage),
                gasStation: formData.gasStation,
                location: formData.location,
                notes: formData.notes,
                createdAt: serverTimestamp()
            });

            Alert.alert('Successo', 'Rifornimento registrato!');
            navigation.goBack();
        } catch (error) {
            console.error('Errore salvataggio:', error);
            Alert.alert('Errore', 'Impossibile salvare il rifornimento');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color={colors.onSurface} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Nuovo Rifornimento</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Data */}
                    <TouchableOpacity
                        style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.outline }]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Calendar size={20} color={colors.primary} />
                        <Text style={[styles.dateText, { color: colors.onSurface }]}>
                            {formData.date.toLocaleDateString('it-IT')}
                        </Text>
                    </TouchableOpacity>

                    {/* Tipo Carburante */}
                    <View style={styles.fuelTypeContainer}>
                        {fuelTypes.map((type) => (
                            <TouchableOpacity
                                key={type.id}
                                style={[
                                    styles.fuelTypeButton,
                                    {
                                        backgroundColor: formData.fuelType === type.id ? colors.primary : colors.surface,
                                        borderColor: colors.outline
                                    }
                                ]}
                                onPress={() => updateField('fuelType', type.id)}
                            >
                                <Text style={styles.fuelTypeIcon}>{type.icon}</Text>
                                <Text style={[
                                    styles.fuelTypeLabel,
                                    { color: formData.fuelType === type.id ? '#fff' : colors.onSurface }
                                ]}>
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Litri */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.onSurface }]}>Litri Riforniti *</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.onSurface, borderColor: errors.liters ? '#ef4444' : colors.outline }]}
                            value={formData.liters}
                            onChangeText={(text) => updateField('liters', text)}
                            placeholder="es. 45.50"
                            placeholderTextColor={colors.onSurfaceVariant}
                            keyboardType="decimal-pad"
                        />
                        {errors.liters && <Text style={styles.errorText}>{errors.liters}</Text>}
                    </View>

                    {/* Costo Totale */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.onSurface }]}>Costo Totale (€) *</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.onSurface, borderColor: errors.totalCost ? '#ef4444' : colors.outline }]}
                            value={formData.totalCost}
                            onChangeText={(text) => updateField('totalCost', text)}
                            placeholder="es. 75.00"
                            placeholderTextColor={colors.onSurfaceVariant}
                            keyboardType="decimal-pad"
                        />
                        {errors.totalCost && <Text style={styles.errorText}>{errors.totalCost}</Text>}
                    </View>

                    {/* Prezzo al Litro (auto-calcolato) */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.onSurface }]}>Prezzo al Litro (€)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.onSurface, borderColor: colors.outline }]}
                            value={formData.pricePerLiter}
                            onChangeText={(text) => updateField('pricePerLiter', text)}
                            placeholder="Calcolato automaticamente"
                            placeholderTextColor={colors.onSurfaceVariant}
                            keyboardType="decimal-pad"
                            editable={false}
                        />
                    </View>

                    {/* Chilometraggio */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.onSurface }]}>Chilometraggio Attuale *</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.onSurface, borderColor: errors.currentMileage ? '#ef4444' : colors.outline }]}
                            value={formData.currentMileage}
                            onChangeText={(text) => updateField('currentMileage', text)}
                            placeholder="es. 45000"
                            placeholderTextColor={colors.onSurfaceVariant}
                            keyboardType="number-pad"
                        />
                        {errors.currentMileage && <Text style={styles.errorText}>{errors.currentMileage}</Text>}
                    </View>

                    {/* Stazione di Servizio */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.onSurface }]}>Stazione di Servizio</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.onSurface, borderColor: colors.outline }]}
                            value={formData.gasStation}
                            onChangeText={(text) => updateField('gasStation', text)}
                            placeholder="es. Eni"
                            placeholderTextColor={colors.onSurfaceVariant}
                        />
                    </View>

                    {/* Località */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.onSurface }]}>Località</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.onSurface, borderColor: colors.outline }]}
                            value={formData.location}
                            onChangeText={(text) => updateField('location', text)}
                            placeholder="es. Milano"
                            placeholderTextColor={colors.onSurfaceVariant}
                        />
                    </View>

                    {/* Note */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.onSurface }]}>Note</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.onSurface, borderColor: colors.outline }]}
                            value={formData.notes}
                            onChangeText={(text) => updateField('notes', text)}
                            placeholder="Note aggiuntive..."
                            placeholderTextColor={colors.onSurfaceVariant}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    {/* Pulsante Salva */}
                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: colors.primary }]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        <Save size={20} color="#fff" />
                        <Text style={styles.saveButtonText}>
                            {isLoading ? 'Salvataggio...' : 'Salva Rifornimento'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {showDatePicker && (
                <UniversalDatePicker
                    value={formData.date}
                    onChange={(date) => {
                        updateField('date', date);
                        setShowDatePicker(false);
                    }}
                    onClose={() => setShowDatePicker(false)}
                />
            )}
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
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        padding: 16,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 16,
        gap: 12,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '500',
    },
    fuelTypeContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    fuelTypeButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        gap: 4,
    },
    fuelTypeIcon: {
        fontSize: 24,
    },
    fuelTypeLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
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
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: 4,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 8,
        marginTop: 16,
        gap: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AddFuelScreen;
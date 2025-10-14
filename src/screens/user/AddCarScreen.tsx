// src/screens/user/AddCarScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    FlatList,
    Modal,
    Animated,
    Keyboard,
    Dimensions,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
    Car,
    X,
    Check,
    ChevronDown,
    Calendar,
    DollarSign,
    Gauge,
    FileText,
    Search,
} from 'lucide-react-native';

// Firebase
import { auth, db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Database auto
import {
    searchMakes,
    searchModelsByMake,
    getAllMakesSorted,
    CarMake,
    CarModel,
} from '../../data/carDatabase';

// Store
import { useStore } from '../../store';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isDesktop = width >= 1024;

// Tipi di carburante
const FUEL_TYPES = [
    { id: 'benzina', name: 'Benzina', icon: '⛽' },
    { id: 'diesel', name: 'Diesel', icon: '🚗' },
    { id: 'gpl', name: 'GPL', icon: '🔵' },
    { id: 'metano', name: 'Metano', icon: '🔴' },
    { id: 'elettrica', name: 'Elettrica', icon: '⚡' },
    { id: 'ibrida', name: 'Ibrida', icon: '🔋' },
    { id: 'ibrida_plugin', name: 'Ibrida Plug-in', icon: '🔌' },
];

// Colori disponibili
const CAR_COLORS = [
    { id: 'black', name: 'Nero', hex: '#1a1a1a', textColor: '#fff' },
    { id: 'white', name: 'Bianco', hex: '#ffffff', textColor: '#000', border: '#e5e7eb' },
    { id: 'gray', name: 'Grigio', hex: '#6b7280', textColor: '#fff' },
    { id: 'silver', name: 'Argento', hex: '#9ca3af', textColor: '#000' },
    { id: 'red', name: 'Rosso', hex: '#ef4444', textColor: '#fff' },
    { id: 'blue', name: 'Blu', hex: '#3b82f6', textColor: '#fff' },
    { id: 'green', name: 'Verde', hex: '#10b981', textColor: '#fff' },
    { id: 'yellow', name: 'Giallo', hex: '#fbbf24', textColor: '#000' },
    { id: 'orange', name: 'Arancione', hex: '#f97316', textColor: '#fff' },
    { id: 'brown', name: 'Marrone', hex: '#92400e', textColor: '#fff' },
];

interface FormData {
    make: string;
    makeId: string;
    model: string;
    year: string;
    licensePlate: string;
    vin: string;
    fuelType: string;
    color: string;
    currentMileage: string;
    purchaseDate: string;
    purchasePrice: string;
    notes: string;
}

const AddCarScreen = () => {
    const navigation = useNavigation();
    const { user, addCarToStore } = useStore();

    // Stati form
    const [formData, setFormData] = useState<FormData>({
        make: '',
        makeId: '',
        model: '',
        year: new Date().getFullYear().toString(),
        licensePlate: '',
        vin: '',
        fuelType: 'benzina',
        color: '#1a1a1a',
        currentMileage: '0',
        purchaseDate: '',
        purchasePrice: '',
        notes: '',
    });

    const [errors, setErrors] = useState<Partial<FormData>>({});
    const [isLoading, setIsLoading] = useState(false);

    // Stati per autocomplete
    const [showMakeDropdown, setShowMakeDropdown] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);
    const [showFuelTypeDropdown, setShowFuelTypeDropdown] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);

    const [makesSuggestions, setMakesSuggestions] = useState<CarMake[]>([]);
    const [modelsSuggestions, setModelsSuggestions] = useState<CarModel[]>([]);
    const [yearsSuggestions, setYearsSuggestions] = useState<number[]>([]);

    // Riferimenti
    const makeInputRef = useRef<TextInput>(null);
    const modelInputRef = useRef<TextInput>(null);

    // Inizializza suggerimenti marche
    useEffect(() => {
        setMakesSuggestions(getAllMakesSorted());
    }, []);

    // Aggiorna suggerimenti quando cambia la marca
    useEffect(() => {
        if (formData.makeId) {
            const models = searchModelsByMake(formData.makeId);
            setModelsSuggestions(models);
        }
    }, [formData.makeId]);

    // Aggiorna anni disponibili quando cambia il modello
    useEffect(() => {
        if (formData.makeId && formData.model) {
            const models = searchModelsByMake(formData.makeId);
            const selectedModel = models.find(m => m.name === formData.model);
            if (selectedModel) {
                setYearsSuggestions(selectedModel.years.sort((a, b) => b - a));
            }
        }
    }, [formData.makeId, formData.model]);

    // Handlers
    const handleMakeSearch = (text: string) => {
        setFormData(prev => ({ ...prev, make: text, makeId: '', model: '', year: '' }));
        if (text.length > 0) {
            const results = searchMakes(text);
            setMakesSuggestions(results);
            setShowMakeDropdown(true);
        } else {
            setMakesSuggestions(getAllMakesSorted());
            setShowMakeDropdown(true);
        }
    };

    const handleSelectMake = (make: CarMake) => {
        setFormData(prev => ({
            ...prev,
            make: make.name,
            makeId: make.id,
            model: '',
            year: '',
        }));
        setShowMakeDropdown(false);
        setModelsSuggestions(make.models);
        Keyboard.dismiss();
        // Focus sul campo modello dopo 100ms
        setTimeout(() => modelInputRef.current?.focus(), 100);
    };

    const handleModelSearch = (text: string) => {
        setFormData(prev => ({ ...prev, model: text }));
        if (formData.makeId && text.length > 0) {
            const results = searchModelsByMake(formData.makeId, text);
            setModelsSuggestions(results);
            setShowModelDropdown(true);
        } else if (formData.makeId) {
            const results = searchModelsByMake(formData.makeId);
            setModelsSuggestions(results);
            setShowModelDropdown(true);
        }
    };

    const handleSelectModel = (model: CarModel) => {
        setFormData(prev => ({ ...prev, model: model.name }));
        setShowModelDropdown(false);
        setYearsSuggestions(model.years.sort((a, b) => b - a));
        Keyboard.dismiss();
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<FormData> = {};

        if (!formData.make.trim()) newErrors.make = 'Marca obbligatoria';
        if (!formData.model.trim()) newErrors.model = 'Modello obbligatorio';
        if (!formData.year) newErrors.year = 'Anno obbligatorio';
        if (!formData.licensePlate.trim()) newErrors.licensePlate = 'Targa obbligatoria';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            Alert.alert('Errore', 'Compila tutti i campi obbligatori');
            return;
        }

        if (!user?.uid) {
            Alert.alert('Errore', 'Utente non autenticato');
            return;
        }

        setIsLoading(true);

        try {
            const now = new Date().toISOString();

            const firestoreData = {
                userId: user.uid,
                ownerId: user.uid,
                make: formData.make.trim(),
                model: formData.model.trim(),
                year: parseInt(formData.year),
                color: formData.color,
                licensePlate: formData.licensePlate.trim().toUpperCase(),
                vin: formData.vin.trim().toUpperCase() || null,
                fuelType: formData.fuelType,
                currentMileage: formData.currentMileage ? parseInt(formData.currentMileage) : 0,
                purchaseDate: formData.purchaseDate || null,
                purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
                notes: formData.notes.trim() || null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                status: 'active',
                isActive: true,
            };

            const docRef = await addDoc(collection(db, 'vehicles'), firestoreData);

            const localStoreData = {
                id: docRef.id,
                userId: user.uid,
                ownerId: user.uid,
                make: formData.make.trim(),
                model: formData.model.trim(),
                year: parseInt(formData.year),
                color: formData.color,
                licensePlate: formData.licensePlate.trim().toUpperCase(),
                vin: formData.vin.trim().toUpperCase() || null,
                fuelType: formData.fuelType,
                currentMileage: formData.currentMileage ? parseInt(formData.currentMileage) : 0,
                purchaseDate: formData.purchaseDate || null,
                purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
                notes: formData.notes.trim() || null,
                createdAt: now,
                updatedAt: now,
                status: 'active',
                isActive: true,
            };

            addCarToStore(localStoreData as any);

            Alert.alert('Successo', 'Veicolo aggiunto con successo!', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            console.error('Error adding car:', error);
            Alert.alert('Errore', 'Impossibile aggiungere il veicolo. Riprova.');
        } finally {
            setIsLoading(false);
        }
    };

    // Render Components
    const renderDropdown = (
        visible: boolean,
        data: any[],
        onSelect: (item: any) => void,
        keyExtractor: (item: any) => string,
        renderItem: (item: any) => React.ReactNode
    ) => {
        if (!visible || data.length === 0) return null;

        return (
            <View style={styles.dropdown}>
                <FlatList
                    data={data}
                    keyExtractor={keyExtractor}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => onSelect(item)}
                        >
                            {renderItem(item)}
                        </TouchableOpacity>
                    )}
                    style={styles.dropdownList}
                    keyboardShouldPersistTaps="handled"
                />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <X size={24} color="#0f172a" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Car size={24} color="#3b82f6" />
                    <Text style={styles.headerTitle}>Aggiungi Veicolo</Text>
                </View>
                <View style={styles.headerButton} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    isDesktop && styles.scrollContentDesktop,
                ]}
                keyboardShouldPersistTaps="handled"
            >
                {/* Sezione: Informazioni Base */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informazioni Base *</Text>

                    {/* Marca */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Marca *</Text>
                        <View style={[styles.input, errors.make && styles.inputError]}>
                            <Search size={20} color="#94a3b8" />
                            <TextInput
                                ref={makeInputRef}
                                style={styles.textInput}
                                placeholder="Cerca marca (es. Fiat, BMW...)"
                                placeholderTextColor="#94a3b8"
                                value={formData.make}
                                onChangeText={handleMakeSearch}
                                onFocus={() => setShowMakeDropdown(true)}
                            />
                        </View>
                        {errors.make && <Text style={styles.errorText}>{errors.make}</Text>}

                        {renderDropdown(
                            showMakeDropdown,
                            makesSuggestions,
                            handleSelectMake,
                            (item) => item.id,
                            (item) => (
                                <View style={styles.suggestionItem}>
                                    <Text style={styles.suggestionText}>{item.name}</Text>
                                    <Text style={styles.suggestionCount}>
                                        {item.models.length} modelli
                                    </Text>
                                </View>
                            )
                        )}
                    </View>

                    {/* Modello */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Modello *</Text>
                        <View
                            style={[
                                styles.input,
                                errors.model && styles.inputError,
                                !formData.makeId && styles.inputDisabled,
                            ]}
                        >
                            <Car size={20} color="#94a3b8" />
                            <TextInput
                                ref={modelInputRef}
                                style={styles.textInput}
                                placeholder={
                                    formData.makeId
                                        ? 'Cerca modello...'
                                        : 'Seleziona prima una marca'
                                }
                                placeholderTextColor="#94a3b8"
                                value={formData.model}
                                onChangeText={handleModelSearch}
                                onFocus={() => formData.makeId && setShowModelDropdown(true)}
                                editable={!!formData.makeId}
                            />
                        </View>
                        {errors.model && <Text style={styles.errorText}>{errors.model}</Text>}

                        {renderDropdown(
                            showModelDropdown,
                            modelsSuggestions,
                            handleSelectModel,
                            (item) => item.name,
                            (item) => (
                                <View style={styles.suggestionItem}>
                                    <Text style={styles.suggestionText}>{item.name}</Text>
                                    <Text style={styles.suggestionCount}>
                                        {item.years[0]} - {item.years[item.years.length - 1]}
                                    </Text>
                                </View>
                            )
                        )}
                    </View>

                    {/* Anno */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Anno *</Text>
                        <TouchableOpacity
                            style={[
                                styles.input,
                                errors.year && styles.inputError,
                                !formData.model && styles.inputDisabled,
                            ]}
                            onPress={() => formData.model && setShowYearDropdown(!showYearDropdown)}
                            disabled={!formData.model}
                        >
                            <Calendar size={20} color="#94a3b8" />
                            <Text
                                style={[
                                    styles.textInput,
                                    !formData.year && styles.placeholderText,
                                ]}
                            >
                                {formData.year || 'Seleziona anno'}
                            </Text>
                            <ChevronDown size={20} color="#94a3b8" />
                        </TouchableOpacity>
                        {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}

                        {renderDropdown(
                            showYearDropdown,
                            yearsSuggestions,
                            (year) => {
                                setFormData(prev => ({ ...prev, year: year.toString() }));
                                setShowYearDropdown(false);
                            },
                            (item) => item.toString(),
                            (item) => <Text style={styles.suggestionText}>{item}</Text>
                        )}
                    </View>
                </View>

                {/* Sezione: Dettagli Veicolo */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dettagli Veicolo</Text>

                    {/* Targa */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Targa *</Text>
                        <View style={[styles.input, errors.licensePlate && styles.inputError]}>
                            <FileText size={20} color="#94a3b8" />
                            <TextInput
                                style={styles.textInput}
                                placeholder="XX123YY"
                                placeholderTextColor="#94a3b8"
                                value={formData.licensePlate}
                                onChangeText={(text) =>
                                    setFormData(prev => ({
                                        ...prev,
                                        licensePlate: text.toUpperCase(),
                                    }))
                                }
                                autoCapitalize="characters"
                                maxLength={10}
                            />
                        </View>
                        {errors.licensePlate && (
                            <Text style={styles.errorText}>{errors.licensePlate}</Text>
                        )}
                    </View>

                    {/* VIN (opzionale) */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>VIN (Codice telaio)</Text>
                        <View style={styles.input}>
                            <FileText size={20} color="#94a3b8" />
                            <TextInput
                                style={styles.textInput}
                                placeholder="Opzionale"
                                placeholderTextColor="#94a3b8"
                                value={formData.vin}
                                onChangeText={(text) =>
                                    setFormData(prev => ({ ...prev, vin: text.toUpperCase() }))
                                }
                                autoCapitalize="characters"
                                maxLength={17}
                            />
                        </View>
                    </View>

                    {/* Tipo Carburante */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Tipo Carburante</Text>
                        <View style={styles.chipGrid}>
                            {FUEL_TYPES.map((fuel) => (
                                <TouchableOpacity
                                    key={fuel.id}
                                    style={[
                                        styles.chip,
                                        formData.fuelType === fuel.id && styles.chipSelected,
                                    ]}
                                    onPress={() =>
                                        setFormData(prev => ({ ...prev, fuelType: fuel.id }))
                                    }
                                >
                                    <Text style={styles.chipIcon}>{fuel.icon}</Text>
                                    <Text
                                        style={[
                                            styles.chipText,
                                            formData.fuelType === fuel.id && styles.chipTextSelected,
                                        ]}
                                    >
                                        {fuel.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Colore */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Colore</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.colorGrid}>
                                {CAR_COLORS.map((color) => (
                                    <TouchableOpacity
                                        key={color.id}
                                        style={[
                                            styles.colorChip,
                                            { backgroundColor: color.hex },
                                            color.border && { borderColor: color.border, borderWidth: 1 },
                                            formData.color === color.hex && styles.colorChipSelected,
                                        ]}
                                        onPress={() =>
                                            setFormData(prev => ({ ...prev, color: color.hex }))
                                        }
                                    >
                                        {formData.color === color.hex && (
                                            <Check size={16} color={color.textColor} strokeWidth={3} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Chilometraggio */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Chilometraggio Attuale</Text>
                        <View style={styles.input}>
                            <Gauge size={20} color="#94a3b8" />
                            <TextInput
                                style={styles.textInput}
                                placeholder="0"
                                placeholderTextColor="#94a3b8"
                                value={formData.currentMileage}
                                onChangeText={(text) =>
                                    setFormData(prev => ({
                                        ...prev,
                                        currentMileage: text.replace(/[^0-9]/g, ''),
                                    }))
                                }
                                keyboardType="numeric"
                            />
                            <Text style={styles.unit}>km</Text>
                        </View>
                    </View>
                </View>

                {/* Sezione: Informazioni Acquisto (Opzionali) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informazioni Acquisto (Opzionali)</Text>

                    {/* Prezzo Acquisto */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Prezzo di Acquisto</Text>
                        <View style={styles.input}>
                            <DollarSign size={20} color="#94a3b8" />
                            <TextInput
                                style={styles.textInput}
                                placeholder="0.00"
                                placeholderTextColor="#94a3b8"
                                value={formData.purchasePrice}
                                onChangeText={(text) =>
                                    setFormData(prev => ({
                                        ...prev,
                                        purchasePrice: text.replace(/[^0-9.]/g, ''),
                                    }))
                                }
                                keyboardType="decimal-pad"
                            />
                            <Text style={styles.unit}>€</Text>
                        </View>
                    </View>

                    {/* Note */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Note</Text>
                        <View style={[styles.input, styles.textAreaInput]}>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                placeholder="Aggiungi note aggiuntive..."
                                placeholderTextColor="#94a3b8"
                                value={formData.notes}
                                onChangeText={(text) =>
                                    setFormData(prev => ({ ...prev, notes: text }))
                                }
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Footer con pulsanti */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                    disabled={isLoading}
                >
                    <Text style={styles.cancelButtonText}>Annulla</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    <Check size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>
                        {isLoading ? 'Salvataggio...' : 'Salva Veicolo'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
    },

    // ScrollView
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    scrollContentDesktop: {
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
    },

    // Sections
    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 16,
    },

    // Input Container
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
    },
    input: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    inputError: {
        borderColor: '#ef4444',
    },
    inputDisabled: {
        opacity: 0.5,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#0f172a',
        padding: 0,
    },
    placeholderText: {
        color: '#94a3b8',
    },
    textAreaInput: {
        paddingVertical: 12,
        alignItems: 'flex-start',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    unit: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
    },

    // Dropdown
    dropdown: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginTop: 8,
        maxHeight: 250,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    dropdownList: {
        borderRadius: 12,
    },
    dropdownItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    suggestionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    suggestionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#0f172a',
    },
    suggestionCount: {
        fontSize: 12,
        color: '#94a3b8',
    },

    // Chips
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 6,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    chipSelected: {
        backgroundColor: '#dbeafe',
        borderColor: '#3b82f6',
    },
    chipIcon: {
        fontSize: 16,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748b',
    },
    chipTextSelected: {
        color: '#1e40af',
        fontWeight: '600',
    },

    // Colors
    colorGrid: {
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 4,
    },
    colorChip: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    colorChipSelected: {
        borderWidth: 3,
        borderColor: '#3b82f6',
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 5,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
    },
    submitButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#3b82f6',
        gap: 8,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});

export default AddCarScreen;
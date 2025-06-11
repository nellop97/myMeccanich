// src/screens/user/AddFuelScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Switch,
    StyleSheet,
    Alert,
    Platform,
    StatusBar
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowLeft, Calendar, Save, Droplets, Euro, Gauge } from 'lucide-react-native';

import { useUserCarsStore } from '../../store/useCarsStore';
import { useStore } from '../../store';

// Theme object for consistent styling
const theme = {
  background: '#f3f4f6',
  cardBackground: '#ffffff',
  text: '#000000',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  primary: '#2563eb',
  error: '#ef4444',
};

const FormInput = ({ label, icon: Icon, error, required, keyboardType = 'default', ...props }) => (
    <View style={styles.inputContainer}>
        {label && (
            <Text style={styles.inputLabel}>
                {label} {required && <Text style={{ color: theme.error }}>*</Text>}
            </Text>
        )}
        <View style={[styles.inputWrapper, error && { borderColor: theme.error }]}>
            {Icon && <Icon size={20} color={theme.textSecondary} style={styles.inputIcon} />}
            <TextInput
                style={styles.input}
                placeholderTextColor={theme.textSecondary}
                keyboardType={keyboardType}
                {...props}
            />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
);

const AddFuelScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { darkMode } = useStore();
    const { cars, addFuelRecord, getCarById } = useUserCarsStore();

    const preselectedCarId = route.params?.carId;
    const selectedCar = preselectedCarId ? getCarById(preselectedCarId) : null;

    const [showDatePicker, setShowDatePicker] = useState(false);
    
    const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm({
        defaultValues: {
            carId: preselectedCarId || (cars.length === 1 ? cars[0].id : ''),
            date: new Date().toISOString().split('T')[0],
            mileage: selectedCar?.currentMileage.toString() || '',
            liters: '',
            costPerLiter: '',
            totalCost: '',
            isFullTank: true,
            stationName: '',
            notes: '',
        }
    });
    
    const liters = watch('liters');
    const costPerLiter = watch('costPerLiter');

    useEffect(() => {
        const lit = parseFloat(liters);
        const cpl = parseFloat(costPerLiter);
        if (!isNaN(lit) && !isNaN(cpl) && lit > 0 && cpl > 0) {
            const total = (lit * cpl).toFixed(2);
            setValue('totalCost', total);
        }
    }, [liters, costPerLiter, setValue]);

    const onSubmit = (data) => {
        if (!data.carId) {
            Alert.alert('Errore', 'Seleziona un veicolo');
            return;
        }

        try {
            const fuelData = {
                date: data.date,
                mileage: parseInt(data.mileage, 10),
                liters: parseFloat(data.liters),
                costPerLiter: parseFloat(data.costPerLiter),
                totalCost: parseFloat(data.totalCost),
                isFullTank: data.isFullTank,
                stationName: data.stationName || undefined,
                notes: data.notes || undefined,
                // Assuming default fuel type for simplicity, can be expanded
                fuelType: 'gasoline' as const,
            };

            addFuelRecord(data.carId, fuelData);

            Alert.alert('Successo', 'Rifornimento aggiunto con successo!', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            Alert.alert('Errore', 'Si è verificato un errore durante il salvataggio.');
        }
    };
    
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nuovo Rifornimento</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Dati Principali</Text>
                    <Controller
                        control={control}
                        name="date"
                        render={({ field: { value } }) => (
                            <>
                                <Text style={styles.inputLabel}>Data *</Text>
                                <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                                    <Calendar size={20} color={theme.primary} />
                                    <Text style={styles.dateButtonText}>{new Date(value).toLocaleDateString('it-IT')}</Text>
                                </TouchableOpacity>
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={new Date(value)}
                                        mode="date"
                                        display="default"
                                        onChange={(event, date) => {
                                            setShowDatePicker(false);
                                            if (date) {
                                                setValue('date', date.toISOString().split('T')[0]);
                                            }
                                        }}
                                    />
                                )}
                            </>
                        )}
                    />
                    <Controller
                        control={control}
                        name="mileage"
                        rules={{ required: 'Chilometraggio obbligatorio' }}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <FormInput
                                label="Chilometraggio"
                                icon={Gauge}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                keyboardType="numeric"
                                placeholder="Es: 45000"
                                error={errors.mileage?.message}
                                required
                            />
                        )}
                    />
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Costi e Quantità</Text>
                    <View style={styles.row}>
                        <Controller
                            control={control}
                            name="liters"
                            rules={{ required: 'Litri obbligatori' }}
                            render={({ field: { onChange, onBlur, value } }) => (
                                <FormInput
                                    label="Litri"
                                    icon={Droplets}
                                    containerStyle={styles.halfWidth}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    keyboardType="decimal-pad"
                                    placeholder="Es: 40.5"
                                    error={errors.liters?.message}
                                    required
                                />
                            )}
                        />
                         <Controller
                            control={control}
                            name="costPerLiter"
                            rules={{ required: 'Costo/litro obbligatorio' }}
                            render={({ field: { onChange, onBlur, value } }) => (
                                <FormInput
                                    label="Costo / Litro"
                                    containerStyle={styles.halfWidth}
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    keyboardType="decimal-pad"
                                    placeholder="Es: 1.85"
                                    error={errors.costPerLiter?.message}
                                    required
                                />
                            )}
                        />
                    </View>
                    <Controller
                        control={control}
                        name="totalCost"
                        rules={{ required: 'Costo totale obbligatorio' }}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <FormInput
                                label="Costo Totale"
                                icon={Euro}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                keyboardType="decimal-pad"
                                placeholder="Calcolato o manuale"
                                error={errors.totalCost?.message}
                                required
                            />
                        )}
                    />
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Dettagli Aggiuntivi</Text>
                    <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>Pieno effettuato?</Text>
                         <Controller
                            control={control}
                            name="isFullTank"
                            render={({ field: { onChange, value } }) => (
                                <Switch
                                    value={value}
                                    onValueChange={onChange}
                                    trackColor={{ false: theme.border, true: theme.primary + '40' }}
                                    thumbColor={value ? theme.primary : '#f4f3f4'}
                                />
                            )}
                        />
                    </View>
                    <Controller
                        control={control}
                        name="stationName"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <FormInput
                                label="Stazione di servizio"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                placeholder="Nome distributore (opzionale)"
                            />
                        )}
                    />
                    <Controller
                        control={control}
                        name="notes"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <FormInput
                                label="Note"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                multiline
                                placeholder="Note aggiuntive (opzionale)"
                            />
                        )}
                    />
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSubmit(onSubmit)}>
                    <Save size={18} color="#ffffff" />
                    <Text style={styles.saveButtonText}>Salva Rifornimento</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.cardBackground },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text },
    content: { flex: 1, padding: 16 },
    card: { backgroundColor: theme.cardBackground, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16 },
    inputContainer: { width: '100%', marginBottom: 16 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 12 },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, height: 50, color: theme.text, fontSize: 16 },
    errorText: { color: theme.error, marginTop: 4, fontSize: 12 },
    dateButton: { flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: 16, borderWidth: 1, borderColor: theme.border, borderRadius: 12, backgroundColor: theme.background, marginBottom: 16 },
    dateButtonText: { fontSize: 16, color: theme.text, marginLeft: 8 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    halfWidth: { width: '48%' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingVertical: 8 },
    switchLabel: { fontSize: 16, fontWeight: '500', color: theme.text },
    saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 12, marginTop: 16, marginBottom: 32 },
    saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});

export default AddFuelScreen;
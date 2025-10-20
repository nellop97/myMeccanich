// src/screens/EditProfileScreen.tsx
/**
 * EditProfileScreen - Schermata modifica profilo
 * Form responsive con validazione e salvataggio su Firebase
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Platform,
    useWindowDimensions,
    KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    FileText,
    Save,
    X,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { useProfile } from '../hooks/useProfile';
import profileService from '../services/ProfileService';

const EditProfileScreen = () => {
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const { profile, updateProfile, updating } = useProfile();

    // Breakpoints
    const isDesktop = width >= 1024;
    const isTablet = width >= 768 && width < 1024;
    const isMobile = width < 768;

    const isMechanic = profile?.userType === 'mechanic';

    // Form state
    const [formData, setFormData] = useState({
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
        phone: profile?.phone || '',
        workshopName: profile?.workshopName || '',
        address: profile?.address || '',
        vatNumber: profile?.vatNumber || '',
        mechanicLicense: profile?.mechanicLicense || '',
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

    // Update form quando profile cambia
    useEffect(() => {
        if (profile) {
            setFormData({
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                phone: profile.phone || '',
                workshopName: profile.workshopName || '',
                address: profile.address || '',
                vatNumber: profile.vatNumber || '',
                mechanicLicense: profile.mechanicLicense || '',
            });
        }
    }, [profile]);

    // Validazione
    const validateField = (name: string, value: string) => {
        let error = '';

        switch (name) {
            case 'firstName':
            case 'lastName':
                if (!value.trim()) {
                    error = 'Campo obbligatorio';
                } else if (value.trim().length < 2) {
                    error = 'Minimo 2 caratteri';
                }
                break;

            case 'phone':
                if (value && !/^[\d\s\+\-\(\)]+$/.test(value)) {
                    error = 'Numero non valido';
                }
                break;

            case 'workshopName':
                if (isMechanic && !value.trim()) {
                    error = 'Campo obbligatorio per meccanici';
                } else if (value && value.trim().length < 3) {
                    error = 'Minimo 3 caratteri';
                }
                break;

            case 'address':
                if (isMechanic && !value.trim()) {
                    error = 'Campo obbligatorio per meccanici';
                } else if (value && value.trim().length < 5) {
                    error = 'Minimo 5 caratteri';
                }
                break;

            case 'vatNumber':
                if (isMechanic && !value.trim()) {
                    error = 'Campo obbligatorio per meccanici';
                } else if (value && !/^[A-Z0-9]{11,16}$/.test(value.replace(/\s/g, ''))) {
                    error = 'P.IVA non valida (11-16 caratteri alfanumerici)';
                }
                break;
        }

        return error;
    };

    // Handler: Change input
    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));

        // Valida se già toccato
        if (touched[name]) {
            const error = validateField(name, value);
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    };

    // Handler: Blur input
    const handleBlur = (name: string) => {
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, formData[name]);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    // Handler: Salva
    const handleSave = async () => {
        // Valida tutti i campi
        const newErrors: { [key: string]: string } = {};
        Object.keys(formData).forEach(key => {
            const error = validateField(key, formData[key]);
            if (error) newErrors[key] = error;
        });

        setErrors(newErrors);
        setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

        if (Object.keys(newErrors).length > 0) {
            Alert.alert('Errore', 'Correggi gli errori nel form');
            return;
        }

        try {
            await updateProfile(formData);
            Alert.alert('Successo', 'Profilo aggiornato!', [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                },
            ]);
        } catch (error) {
            Alert.alert('Errore', 'Impossibile salvare le modifiche');
        }
    };

    // Handler: Annulla
    const handleCancel = () => {
        navigation.goBack();
    };

    // Render Header
    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
                <X size={24} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Modifica Profilo</Text>
            <TouchableOpacity
                onPress={handleSave}
                disabled={updating}
                style={styles.headerButton}
            >
                {updating ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                    <Save size={24} color="#007AFF" />
                )}
            </TouchableOpacity>
        </View>
    );

    // Render Form
    const renderForm = () => (
        <View style={[styles.form, isDesktop && styles.formDesktop]}>
            {/* Sezione Info Personali */}
            <Text style={styles.sectionTitle}>Informazioni Personali</Text>

            <FormField
                icon={User}
                label="Nome"
                placeholder="Il tuo nome"
                value={formData.firstName}
                onChangeText={(text) => handleChange('firstName', text)}
                onBlur={() => handleBlur('firstName')}
                error={touched.firstName ? errors.firstName : undefined}
                required
            />

            <FormField
                icon={User}
                label="Cognome"
                placeholder="Il tuo cognome"
                value={formData.lastName}
                onChangeText={(text) => handleChange('lastName', text)}
                onBlur={() => handleBlur('lastName')}
                error={touched.lastName ? errors.lastName : undefined}
                required
            />

            <FormField
                icon={Phone}
                label="Telefono"
                placeholder="+39 123 456 7890"
                value={formData.phone}
                onChangeText={(text) => handleChange('phone', text)}
                onBlur={() => handleBlur('phone')}
                error={touched.phone ? errors.phone : undefined}
                keyboardType="phone-pad"
            />

            {/* Sezione Meccanico */}
            {isMechanic && (
                <>
                    <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
                        Informazioni Officina
                    </Text>

                    <FormField
                        icon={Briefcase}
                        label="Nome Officina"
                        placeholder="Nome della tua officina"
                        value={formData.workshopName}
                        onChangeText={(text) => handleChange('workshopName', text)}
                        onBlur={() => handleBlur('workshopName')}
                        error={touched.workshopName ? errors.workshopName : undefined}
                        required
                    />

                    <FormField
                        icon={MapPin}
                        label="Indirizzo"
                        placeholder="Via, Città, CAP"
                        value={formData.address}
                        onChangeText={(text) => handleChange('address', text)}
                        onBlur={() => handleBlur('address')}
                        error={touched.address ? errors.address : undefined}
                        required
                        multiline
                    />

                    <FormField
                        icon={FileText}
                        label="Partita IVA"
                        placeholder="IT12345678901"
                        value={formData.vatNumber}
                        onChangeText={(text) => handleChange('vatNumber', text.toUpperCase())}
                        onBlur={() => handleBlur('vatNumber')}
                        error={touched.vatNumber ? errors.vatNumber : undefined}
                        required
                        autoCapitalize="characters"
                    />

                    <FormField
                        icon={FileText}
                        label="Numero Licenza"
                        placeholder="Numero licenza meccanico (opzionale)"
                        value={formData.mechanicLicense}
                        onChangeText={(text) => handleChange('mechanicLicense', text)}
                        onBlur={() => handleBlur('mechanicLicense')}
                        error={touched.mechanicLicense ? errors.mechanicLicense : undefined}
                    />
                </>
            )}

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.buttonCancel]}
                    onPress={handleCancel}
                >
                    <Text style={styles.buttonTextCancel}>Annulla</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.buttonSave, updating && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={updating}
                >
                    {updating ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Text style={styles.buttonTextSave}>Salva Modifiche</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {renderHeader()}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[
                        styles.scrollContent,
                        isDesktop && styles.scrollContentDesktop,
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {renderForm()}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// Componente FormField
interface FormFieldProps {
    icon: any;
    label: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    onBlur: () => void;
    error?: string;
    required?: boolean;
    keyboardType?: any;
    multiline?: boolean;
    autoCapitalize?: any;
}

const FormField: React.FC<FormFieldProps> = ({
                                                 icon: Icon,
                                                 label,
                                                 placeholder,
                                                 value,
                                                 onChangeText,
                                                 onBlur,
                                                 error,
                                                 required,
                                                 keyboardType = 'default',
                                                 multiline = false,
                                                 autoCapitalize = 'sentences',
                                             }) => (
    <View style={styles.fieldContainer}>
        <View style={styles.labelContainer}>
            <Icon size={16} color="#64748B" />
            <Text style={styles.label}>
                {label}
                {required && <Text style={styles.required}> *</Text>}
            </Text>
        </View>

        <TextInput
            style={[
                styles.input,
                multiline && styles.inputMultiline,
                error && styles.inputError,
            ]}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            value={value}
            onChangeText={onChangeText}
            onBlur={onBlur}
            keyboardType={keyboardType}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            autoCapitalize={autoCapitalize}
        />

        {error && (
            <Text style={styles.errorText}>{error}</Text>
        )}
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    keyboardView: {
        flex: 1,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerButton: {
        padding: 8,
        width: 40,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },

    // ScrollView
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    scrollContentDesktop: {
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
    },

    // Form
    form: {
        padding: 16,
    },
    formDesktop: {
        padding: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 16,
    },
    sectionTitleSpaced: {
        marginTop: 32,
    },

    // Field
    fieldContainer: {
        marginBottom: 20,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
    },
    required: {
        color: '#EF4444',
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#0F172A',
        minHeight: 48,
        ...Platform.select({
            web: {
                outlineStyle: 'none',
            },
        }),
    },
    inputMultiline: {
        minHeight: 80,
        paddingTop: 12,
        textAlignVertical: 'top',
    },
    inputError: {
        borderColor: '#EF4444',
    },
    errorText: {
        fontSize: 12,
        color: '#EF4444',
        marginTop: 4,
        marginLeft: 4,
    },

    // Buttons
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 32,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    buttonCancel: {
        backgroundColor: '#F1F5F9',
    },
    buttonSave: {
        backgroundColor: '#007AFF',
        ...Platform.select({
            ios: {
                shadowColor: '#007AFF',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: '0 4px 8px rgba(0, 122, 255, 0.3)',
            },
        }),
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonTextCancel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
    buttonTextSave: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});

export default EditProfileScreen;
// src/screens/user/AddDocumentScreen.tsx
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Alert,
    Platform,
    StatusBar,
    KeyboardAvoidingView,
    ActivityIndicator,
    Image,
    Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
    ArrowLeft,
    Calendar,
    Camera,
    Upload,
    File,
    Image as ImageIcon,
    Trash2,
    Save,
    Shield,
    FileText,
    CreditCard,
    CheckCircle,
    Info,
    X,
    ChevronRight,
} from 'lucide-react-native';

// Components
import { UniversalDatePicker } from '../../components/UniversalDatePicker';
import UniversalImagePicker from '../../components/UniversalImagePicker';
import { UniversalDocumentPicker } from '../../components/UniversalDocumentPicker';

// Services
import { useAppThemeManager } from '../../hooks/useTheme';
import { db, auth } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import UploadService from '../../services/UploadService';

interface RouteParams {
    carId?: string;
}

const DOCUMENT_TYPES = [
    {
        id: 'insurance',
        title: 'Assicurazione',
        icon: Shield,
        color: '#007AFF',
        description: 'Polizza assicurativa',
    },
    {
        id: 'registration',
        title: 'Libretto di Circolazione',
        icon: FileText,
        color: '#34C759',
        description: 'Documento di circolazione',
    },
    {
        id: 'ownership',
        title: 'Certificato di Proprietà',
        icon: CreditCard,
        color: '#FF9500',
        description: 'CDP - Certificato Digitale',
    },
    {
        id: 'inspection',
        title: 'Revisione',
        icon: CheckCircle,
        color: '#5AC8FA',
        description: 'Certificato revisione',
    },
    {
        id: 'warranty',
        title: 'Garanzia',
        icon: Shield,
        color: '#5856D6',
        description: 'Certificato di garanzia',
    },
    {
        id: 'other',
        title: 'Altro Documento',
        icon: File,
        color: '#8E8E93',
        description: 'Documento generico',
    },
];

const AddDocumentScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { carId } = (route.params as RouteParams) || {};
    const { colors, isDark } = useAppThemeManager();

    // Form state
    const [formData, setFormData] = useState({
        type: '',
        title: '',
        description: '',
        issueDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 year
        reminderDays: '30',
    });

    const [attachments, setAttachments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showTypePicker, setShowTypePicker] = useState(false);
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

        if (!formData.type) newErrors.type = 'Seleziona un tipo di documento';
        if (!formData.title.trim()) newErrors.title = 'Inserisci un titolo';
        if (formData.expiryDate < formData.issueDate) {
            newErrors.expiryDate = 'La data di scadenza deve essere successiva alla data di emissione';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddImage = async () => {
        // This would be handled by UniversalImagePicker component callback
    };

    const handleAddFile = async () => {
        // This would be handled by UniversalDocumentPicker component callback
    };

    const handleRemoveAttachment = (index: number) => {
        Alert.alert(
            'Rimuovi Allegato',
            'Sei sicuro di voler rimuovere questo allegato?',
            [
                { text: 'Annulla', style: 'cancel' },
                {
                    text: 'Rimuovi',
                    style: 'destructive',
                    onPress: () => {
                        setAttachments(prev => prev.filter((_, i) => i !== index));
                    },
                },
            ]
        );
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        if (!carId) {
            Alert.alert('Errore', 'Veicolo non specificato');
            return;
        }

        setIsLoading(true);

        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Utente non autenticato');

            // Upload attachments if any
            let uploadedAttachments: any[] = [];
            if (attachments.length > 0) {
                for (let i = 0; i < attachments.length; i++) {
                    const attachment = attachments[i];
                    const progress = ((i + 1) / attachments.length) * 100;
                    setUploadProgress(progress);

                    const uploadedUrl = await UploadService.uploadFile(
                        attachment.uri,
                        `documents/${carId}`,
                        attachment.type
                    );

                    uploadedAttachments.push({
                        url: uploadedUrl,
                        type: attachment.type,
                        name: attachment.name,
                        size: attachment.size,
                    });
                }
            }

            const documentData = {
                userId: user.uid,
                vehicleId: carId,
                type: formData.type,
                title: formData.title.trim(),
                description: formData.description.trim() || null,
                issueDate: formData.issueDate.toISOString(),
                expiryDate: formData.expiryDate.toISOString(),
                reminderDays: parseInt(formData.reminderDays) || 30,
                attachments: uploadedAttachments,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'documents'), documentData);

            Alert.alert(
                'Successo',
                'Documento aggiunto con successo!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error) {
            console.error('Error adding document:', error);
            Alert.alert('Errore', 'Impossibile aggiungere il documento. Riprova.');
        } finally {
            setIsLoading(false);
            setUploadProgress(0);
        }
    };

    const renderTypePicker = () => (
        <Modal
            visible={showTypePicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowTypePicker(false)}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowTypePicker(false)}
            >
                <View style={[styles.typePickerModal, { backgroundColor: colors.surface }]}>
                    <View style={styles.typePickerHeader}>
                        <Text style={[styles.typePickerTitle, { color: colors.onSurface }]}>
                            Tipo di Documento
                        </Text>
                        <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                            <X size={24} color={colors.onSurface} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView>
                        {DOCUMENT_TYPES.map((type) => {
                            const Icon = type.icon;
                            const isSelected = formData.type === type.id;

                            return (
                                <TouchableOpacity
                                    key={type.id}
                                    style={[
                                        styles.typeOption,
                                        {
                                            backgroundColor: isSelected ? colors.primaryContainer : colors.surfaceVariant,
                                            borderColor: isSelected ? colors.primary : colors.outline,
                                        },
                                    ]}
                                    onPress={() => {
                                        updateFormData('type', type.id);
                                        if (!formData.title) {
                                            updateFormData('title', type.title);
                                        }
                                        setShowTypePicker(false);
                                    }}
                                >
                                    <View style={[styles.typeIconContainer, { backgroundColor: type.color }]}>
                                        <Icon size={24} color="#FFF" />
                                    </View>
                                    <View style={styles.typeInfo}>
                                        <Text style={[styles.typeTitle, { color: colors.onSurface }]}>
                                            {type.title}
                                        </Text>
                                        <Text style={[styles.typeDescription, { color: colors.onSurfaceVariant }]}>
                                            {type.description}
                                        </Text>
                                    </View>
                                    {isSelected && <CheckCircle size={20} color={colors.primary} />}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    const selectedType = DOCUMENT_TYPES.find(t => t.id === formData.type);
    const SelectedIcon = selectedType?.icon || File;

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
                    Aggiungi Documento
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
                    {/* Document Type */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Tipo di Documento *
                        </Text>

                        <TouchableOpacity
                            style={[
                                styles.typeSelectorButton,
                                {
                                    backgroundColor: colors.surfaceVariant,
                                    borderColor: errors.type ? colors.error : colors.outline,
                                },
                            ]}
                            onPress={() => setShowTypePicker(true)}
                        >
                            {selectedType ? (
                                <>
                                    <View style={[styles.selectedTypeIcon, { backgroundColor: selectedType.color }]}>
                                        <SelectedIcon size={20} color="#FFF" />
                                    </View>
                                    <View style={styles.selectedTypeInfo}>
                                        <Text style={[styles.selectedTypeTitle, { color: colors.onSurface }]}>
                                            {selectedType.title}
                                        </Text>
                                        <Text style={[styles.selectedTypeDesc, { color: colors.onSurfaceVariant }]}>
                                            {selectedType.description}
                                        </Text>
                                    </View>
                                </>
                            ) : (
                                <Text style={[styles.placeholderText, { color: colors.onSurfaceVariant }]}>
                                    Seleziona il tipo di documento
                                </Text>
                            )}
                            <ChevronRight size={20} color={colors.onSurfaceVariant} />
                        </TouchableOpacity>
                        {errors.type && (
                            <Text style={[styles.errorText, { color: colors.error }]}>
                                {errors.type}
                            </Text>
                        )}
                    </View>

                    {/* Title */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Titolo *
                        </Text>
                        <View style={[
                            styles.inputContainer,
                            {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: errors.title ? colors.error : colors.outline,
                            },
                        ]}>
                            <FileText size={20} color={colors.primary} />
                            <TextInput
                                style={[styles.input, { color: colors.onSurface }]}
                                placeholder="es. Assicurazione RCA 2024"
                                placeholderTextColor={colors.onSurfaceVariant}
                                value={formData.title}
                                onChangeText={(text) => updateFormData('title', text)}
                            />
                        </View>
                        {errors.title && (
                            <Text style={[styles.errorText, { color: colors.error }]}>
                                {errors.title}
                            </Text>
                        )}
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Descrizione
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
                                placeholder="Aggiungi una descrizione (opzionale)"
                                placeholderTextColor={colors.onSurfaceVariant}
                                value={formData.description}
                                onChangeText={(text) => updateFormData('description', text)}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    {/* Issue Date */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Data di Emissione
                        </Text>
                        <UniversalDatePicker
                            value={formData.issueDate}
                            onChange={(date) => updateFormData('issueDate', date)}
                            maximumDate={new Date()}
                        />
                    </View>

                    {/* Expiry Date */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Data di Scadenza
                        </Text>
                        <UniversalDatePicker
                            value={formData.expiryDate}
                            onChange={(date) => updateFormData('expiryDate', date)}
                            minimumDate={formData.issueDate}
                        />
                        {errors.expiryDate && (
                            <Text style={[styles.errorText, { color: colors.error }]}>
                                {errors.expiryDate}
                            </Text>
                        )}
                    </View>

                    {/* Reminder Days */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Promemoria
                        </Text>
                        <View style={[
                            styles.inputContainer,
                            {
                                backgroundColor: colors.surfaceVariant,
                                borderColor: colors.outline,
                            },
                        ]}>
                            <Info size={20} color={colors.primary} />
                            <TextInput
                                style={[styles.input, { color: colors.onSurface }]}
                                placeholder="30"
                                placeholderTextColor={colors.onSurfaceVariant}
                                value={formData.reminderDays}
                                onChangeText={(text) => updateFormData('reminderDays', text)}
                                keyboardType="numeric"
                            />
                            <Text style={[styles.unitText, { color: colors.onSurfaceVariant }]}>
                                giorni prima
                            </Text>
                        </View>
                    </View>

                    {/* Attachments */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                            Allegati
                        </Text>

                        <View style={styles.attachmentButtons}>
                            <UniversalImagePicker
                                onImageSelected={(image) => {
                                    setAttachments(prev => [...prev, {
                                        uri: image.uri,
                                        type: 'image',
                                        name: image.fileName || 'image.jpg',
                                        size: image.fileSize,
                                    }]);
                                }}
                            >
                                <TouchableOpacity
                                    style={[styles.attachmentButton, {
                                        backgroundColor: colors.primaryContainer,
                                        borderColor: colors.primary,
                                    }]}
                                >
                                    <Camera size={20} color={colors.primary} />
                                    <Text style={[styles.attachmentButtonText, { color: colors.primary }]}>
                                        Foto
                                    </Text>
                                </TouchableOpacity>
                            </UniversalImagePicker>

                            <UniversalDocumentPicker
                                onDocumentSelected={(doc) => {
                                    setAttachments(prev => [...prev, {
                                        uri: doc.uri,
                                        type: 'document',
                                        name: doc.name,
                                        size: doc.size,
                                    }]);
                                }}
                            >
                                <TouchableOpacity
                                    style={[styles.attachmentButton, {
                                        backgroundColor: colors.secondaryContainer,
                                        borderColor: colors.secondary,
                                    }]}
                                >
                                    <Upload size={20} color={colors.secondary} />
                                    <Text style={[styles.attachmentButtonText, { color: colors.secondary }]}>
                                        File
                                    </Text>
                                </TouchableOpacity>
                            </UniversalDocumentPicker>
                        </View>

                        {/* Attachment List */}
                        {attachments.length > 0 && (
                            <View style={styles.attachmentList}>
                                {attachments.map((attachment, index) => (
                                    <View
                                        key={index}
                                        style={[styles.attachmentItem, {
                                            backgroundColor: colors.surfaceVariant,
                                            borderColor: colors.outline,
                                        }]}
                                    >
                                        <View style={styles.attachmentInfo}>
                                            {attachment.type === 'image' ? (
                                                <ImageIcon size={20} color={colors.primary} />
                                            ) : (
                                                <File size={20} color={colors.secondary} />
                                            )}
                                            <Text
                                                style={[styles.attachmentName, { color: colors.onSurface }]}
                                                numberOfLines={1}
                                            >
                                                {attachment.name}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => handleRemoveAttachment(index)}
                                            style={styles.removeButton}
                                        >
                                            <Trash2 size={18} color={colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Upload Progress */}
                    {isLoading && uploadProgress > 0 && (
                        <View style={[styles.progressContainer, { backgroundColor: colors.surfaceVariant }]}>
                            <Text style={[styles.progressText, { color: colors.onSurface }]}>
                                Caricamento: {Math.round(uploadProgress)}%
                            </Text>
                            <View style={[styles.progressBar, { backgroundColor: colors.outline }]}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        {
                                            backgroundColor: colors.primary,
                                            width: `${uploadProgress}%`,
                                        },
                                    ]}
                                />
                            </View>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {renderTypePicker()}
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
    typeSelectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    selectedTypeIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedTypeInfo: {
        flex: 1,
        marginLeft: 12,
    },
    selectedTypeTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    selectedTypeDesc: {
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
    unitText: {
        fontSize: 14,
        marginLeft: 8,
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
    attachmentButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    attachmentButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    attachmentButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    attachmentList: {
        marginTop: 12,
        gap: 8,
    },
    attachmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    attachmentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    attachmentName: {
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
    removeButton: {
        padding: 4,
    },
    progressContainer: {
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    typePickerModal: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
    },
    typePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    typePickerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    typeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 20,
        marginVertical: 6,
        borderRadius: 12,
        borderWidth: 2,
    },
    typeIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    typeInfo: {
        flex: 1,
        marginLeft: 12,
    },
    typeTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    typeDescription: {
        fontSize: 12,
        marginTop: 2,
    },
});

export default AddDocumentScreen;
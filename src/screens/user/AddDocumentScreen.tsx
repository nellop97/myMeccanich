// src/screens/user/AddDocumentScreen.tsx - VERSIONE AGGIORNATA CON UNIVERSAL PICKERS
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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Controller, useForm } from 'react-hook-form';
import { Card, Button, Chip, Surface, ProgressBar } from 'react-native-paper';
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
} from 'lucide-react-native';

// NUOVI IMPORT UNIVERSAL PICKERS
import UniversalImagePicker from '../../components/UniversalImagePicker';
import { UniversalDatePicker } from '../../components/UniversalDatePicker';
import { UniversalDocumentPicker } from '../../components/UniversalDocumentPicker';

// Servizi
import { useAppThemeManager } from '../../hooks/useTheme';
import { useUserData } from '../../hooks/useUserData';
import { db, auth, storage } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import UploadService from '../../services/UploadService';

interface FormData {
    vehicleId: string;
    type: string;
    title: string;
    description: string;
    issueDate: Date;
    expiryDate: Date;
    reminderDays: string;
}

const AddDocumentScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { colors, isDark } = useAppThemeManager();
    const { vehicles, refreshData } = useUserData();

    const preselectedCarId = route.params?.carId;

    const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            vehicleId: preselectedCarId || vehicles?.[0]?.id || '',
            type: '',
            title: '',
            description: '',
            issueDate: new Date(),
            expiryDate: new Date(),
            reminderDays: '30',
        }
    });

    const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadMethod, setUploadMethod] = useState<'camera' | 'document'>('document');

    const documentTypes = [
        { id: 'insurance', label: 'Assicurazione', icon: Shield, color: '#4CAF50' },
        { id: 'registration', label: 'Libretto', icon: FileText, color: '#2196F3' },
        { id: 'license', label: 'Patente', icon: CreditCard, color: '#FF9800' },
        { id: 'tax', label: 'Bollo', icon: FileText, color: '#9C27B0' },
        { id: 'inspection', label: 'Revisione', icon: CheckCircle, color: '#F44336' },
        { id: 'other', label: 'Altro', icon: File, color: '#607D8B' },
    ];

    // Gestione file selezionati (immagini o documenti)
    const handleFilesSelected = (files: any[]) => {
        console.log('File selezionati:', files);
        setSelectedFiles(files);
    };

    // Submit del form
    const onSubmit = async (data: FormData) => {
        if (selectedFiles.length === 0) {
            Alert.alert('Errore', 'Seleziona almeno un file da caricare');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error('Utente non autenticato');

            // Upload dei file
            const uploadedFiles = [];
            const totalFiles = selectedFiles.length;

            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const fileName = file.fileName || file.name || `document_${Date.now()}.jpg`;

                const result = await UploadService.uploadImage(file.uri, {
                    path: `documents/${userId}/${Date.now()}_${fileName}`,
                    onProgress: (progress) => {
                        const totalProgress = ((i + progress / 100) / totalFiles) * 100;
                        setUploadProgress(totalProgress);
                    },
                    compress: file.type?.startsWith('image/'),
                });

                uploadedFiles.push({
                    url: result.url,
                    path: result.path,
                    name: fileName,
                    type: file.type || file.mimeType,
                    size: file.size || file.fileSize,
                });
            }

            // Salva in Firestore
            const documentData = {
                ...data,
                files: uploadedFiles,
                userId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'users', userId, 'documents'), documentData);

            await refreshData();

            Alert.alert(
                'Successo',
                'Documento salvato con successo',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error('Errore salvataggio:', error);
            Alert.alert('Errore', 'Si è verificato un errore durante il salvataggio');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <Surface style={[styles.header, { backgroundColor: colors.surface }]} elevation={2}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <ArrowLeft size={24} color={colors.onSurface} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
                    Aggiungi Documento
                </Text>
                <View style={{ width: 40 }} />
            </Surface>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Card style={styles.card}>
                        <Card.Content>

                            {/* Selezione Veicolo */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                                    Veicolo
                                </Text>
                                <Controller
                                    control={control}
                                    name="vehicleId"
                                    rules={{ required: 'Seleziona un veicolo' }}
                                    render={({ field: { onChange, value } }) => (
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            <View style={styles.vehicleList}>
                                                {vehicles?.map(vehicle => (
                                                    <Chip
                                                        key={vehicle.id}
                                                        selected={value === vehicle.id}
                                                        onPress={() => onChange(vehicle.id)}
                                                        style={styles.vehicleChip}
                                                    >
                                                        {vehicle.brand} {vehicle.model}
                                                    </Chip>
                                                ))}
                                            </View>
                                        </ScrollView>
                                    )}
                                />
                                {errors.vehicleId && (
                                    <Text style={[styles.errorText, { color: colors.error }]}>
                                        {errors.vehicleId.message}
                                    </Text>
                                )}
                            </View>

                            {/* Tipo Documento */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                                    Tipo Documento
                                </Text>
                                <Controller
                                    control={control}
                                    name="type"
                                    rules={{ required: 'Seleziona un tipo di documento' }}
                                    render={({ field: { onChange, value } }) => (
                                        <View style={styles.typeGrid}>
                                            {documentTypes.map(type => (
                                                <TouchableOpacity
                                                    key={type.id}
                                                    style={[
                                                        styles.typeCard,
                                                        {
                                                            backgroundColor: value === type.id ? type.color : colors.surfaceVariant,
                                                            borderColor: value === type.id ? type.color : colors.outline,
                                                        }
                                                    ]}
                                                    onPress={() => onChange(type.id)}
                                                >
                                                    <type.icon
                                                        size={24}
                                                        color={value === type.id ? 'white' : colors.onSurfaceVariant}
                                                    />
                                                    <Text style={[
                                                        styles.typeLabel,
                                                        { color: value === type.id ? 'white' : colors.onSurfaceVariant }
                                                    ]}>
                                                        {type.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                />
                                {errors.type && (
                                    <Text style={[styles.errorText, { color: colors.error }]}>
                                        {errors.type.message}
                                    </Text>
                                )}
                            </View>

                            {/* Titolo */}
                            <View style={styles.section}>
                                <Controller
                                    control={control}
                                    name="title"
                                    rules={{ required: 'Inserisci un titolo' }}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            style={[
                                                styles.input,
                                                {
                                                    backgroundColor: colors.surfaceVariant,
                                                    color: colors.onSurface,
                                                    borderColor: errors.title ? colors.error : colors.outline,
                                                }
                                            ]}
                                            placeholder="Titolo documento"
                                            placeholderTextColor={colors.onSurfaceVariant}
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                        />
                                    )}
                                />
                                {errors.title && (
                                    <Text style={[styles.errorText, { color: colors.error }]}>
                                        {errors.title.message}
                                    </Text>
                                )}
                            </View>

                            {/* Date */}
                            <View style={styles.dateContainer}>
                                <View style={styles.dateField}>
                                    <Controller
                                        control={control}
                                        name="issueDate"
                                        render={({ field: { onChange, value } }) => (
                                            <UniversalDatePicker
                                                value={value}
                                                onChange={onChange}
                                                label="Data Emissione"
                                                mode="date"
                                                maximumDate={new Date()}
                                            />
                                        )}
                                    />
                                </View>

                                <View style={styles.dateField}>
                                    <Controller
                                        control={control}
                                        name="expiryDate"
                                        render={({ field: { onChange, value } }) => (
                                            <UniversalDatePicker
                                                value={value}
                                                onChange={onChange}
                                                label="Data Scadenza"
                                                mode="date"
                                                minimumDate={new Date()}
                                            />
                                        )}
                                    />
                                </View>
                            </View>

                            {/* Upload Files */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                                    Carica Documenti
                                </Text>

                                {/* Scelta metodo upload */}
                                <View style={styles.uploadMethodContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.uploadMethodButton,
                                            {
                                                backgroundColor: uploadMethod === 'camera' ? colors.primary : colors.surfaceVariant,
                                            }
                                        ]}
                                        onPress={() => setUploadMethod('camera')}
                                    >
                                        <Camera
                                            size={20}
                                            color={uploadMethod === 'camera' ? colors.onPrimary : colors.onSurfaceVariant}
                                        />
                                        <Text style={[
                                            styles.uploadMethodText,
                                            { color: uploadMethod === 'camera' ? colors.onPrimary : colors.onSurfaceVariant }
                                        ]}>
                                            Foto
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.uploadMethodButton,
                                            {
                                                backgroundColor: uploadMethod === 'document' ? colors.primary : colors.surfaceVariant,
                                            }
                                        ]}
                                        onPress={() => setUploadMethod('document')}
                                    >
                                        <FileText
                                            size={20}
                                            color={uploadMethod === 'document' ? colors.onPrimary : colors.onSurfaceVariant}
                                        />
                                        <Text style={[
                                            styles.uploadMethodText,
                                            { color: uploadMethod === 'document' ? colors.onPrimary : colors.onSurfaceVariant }
                                        ]}>
                                            Documento
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Componente Upload basato sulla scelta */}
                                {uploadMethod === 'camera' ? (
                                    <UniversalImagePicker
                                        onImagesSelected={handleFilesSelected}
                                        multiple={true}
                                        maxImages={5}
                                        label="Scatta o Seleziona Foto"
                                        mode="both"
                                        showPreview={true}
                                    />
                                ) : (
                                    <UniversalDocumentPicker
                                        onDocumentsSelected={handleFilesSelected}
                                        accept={['pdf', 'doc', 'image']}
                                        multiple={true}
                                        maxFiles={5}
                                        maxSize={10}
                                        label="Carica Documenti"
                                        showPreview={true}
                                    />
                                )}
                            </View>

                            {/* Progress Upload */}
                            {isUploading && (
                                <View style={styles.uploadProgressContainer}>
                                    <Text style={[styles.uploadProgressText, { color: colors.onSurface }]}>
                                        Caricamento in corso...
                                    </Text>
                                    <ProgressBar
                                        progress={uploadProgress / 100}
                                        color={colors.primary}
                                        style={styles.progressBar}
                                    />
                                    <Text style={[styles.uploadProgressPercent, { color: colors.onSurfaceVariant }]}>
                                        {Math.round(uploadProgress)}%
                                    </Text>
                                </View>
                            )}

                            {/* Submit Button */}
                            <Button
                                mode="contained"
                                onPress={handleSubmit(onSubmit)}
                                loading={isUploading}
                                disabled={isUploading || selectedFiles.length === 0}
                                style={styles.submitButton}
                                icon="content-save"
                            >
                                Salva Documento
                            </Button>

                        </Card.Content>
                    </Card>
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
        marginBottom: 32,
    },
    section: {
        marginVertical: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    vehicleList: {
        flexDirection: 'row',
        gap: 8,
    },
    vehicleChip: {
        marginRight: 8,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    typeCard: {
        width: '30%',
        aspectRatio: 1,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    typeLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
    },
    dateContainer: {
        flexDirection: 'row',
        gap: 12,
        marginVertical: 12,
    },
    dateField: {
        flex: 1,
    },
    uploadMethodContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    uploadMethodButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
    },
    uploadMethodText: {
        fontSize: 14,
        fontWeight: '500',
    },
    uploadProgressContainer: {
        marginVertical: 16,
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    uploadProgressText: {
        fontSize: 14,
        marginBottom: 8,
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
    },
    uploadProgressPercent: {
        fontSize: 12,
        marginTop: 4,
        textAlign: 'right',
    },
    submitButton: {
        marginTop: 24,
        paddingVertical: 8,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
    },
});

export default AddDocumentScreen;
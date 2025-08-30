// src/screens/user/AddDocumentScreen.tsx - VERSIONE AGGIORNATA
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Controller, useForm } from 'react-hook-form';
import {
    UniversalDatePicker,
    UniversalDocumentPicker,
    UniversalImagePicker,
} from '../../components/pickers';
import { Card, Button, TextInput, Chip } from 'react-native-paper';
import { useAppThemeManager } from '../../hooks/useTheme';
import { db, storage, auth } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import UploadService from '../../services/UploadService';

export default function AddDocumentScreen() {
    const navigation = useNavigation();
    const { colors } = useAppThemeManager();
    const { control, handleSubmit, formState: { errors } } = useForm();

    const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [issueDate, setIssueDate] = useState(new Date());
    const [expiryDate, setExpiryDate] = useState(new Date());

    const documentTypes = [
        { id: 'insurance', label: 'Assicurazione', color: '#4CAF50' },
        { id: 'registration', label: 'Libretto', color: '#2196F3' },
        { id: 'license', label: 'Patente', color: '#FF9800' },
        { id: 'tax', label: 'Bollo', color: '#9C27B0' },
        { id: 'inspection', label: 'Revisione', color: '#F44336' },
    ];

    const handleFilesSelected = (files: any[]) => {
        setSelectedFiles(files);
    };

    const onSubmit = async (data: any) => {
        if (selectedFiles.length === 0) {
            Alert.alert('Errore', 'Seleziona almeno un file');
            return;
        }

        setIsUploading(true);
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error('Utente non autenticato');

            // Upload files
            const uploadPromises = selectedFiles.map(file =>
                UploadService.uploadImage(file.uri, {
                    path: `documents/${userId}/${Date.now()}_${file.name || file.fileName}`,
                    compress: file.type?.startsWith('image/'),
                })
            );

            const uploadResults = await Promise.all(uploadPromises);

            // Salva in Firestore
            const documentData = {
                ...data,
                issueDate: issueDate.toISOString(),
                expiryDate: expiryDate.toISOString(),
                files: uploadResults.map((result, index) => ({
                    url: result.url,
                    path: result.path,
                    name: selectedFiles[index].name || selectedFiles[index].fileName,
                    type: selectedFiles[index].type,
                    size: selectedFiles[index].size,
                })),
                userId,
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'documents'), documentData);

            Alert.alert('Successo', 'Documento salvato con successo', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Errore', 'Errore durante il salvataggio');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Card style={styles.card}>
                        <Card.Title title="Nuovo Documento" />
                        <Card.Content>

                            {/* Tipo Documento */}
                            <View style={styles.section}>
                                <Text style={[styles.label, { color: colors.onSurface }]}>
                                    Tipo Documento
                                </Text>
                                <Controller
                                    control={control}
                                    name="type"
                                    rules={{ required: 'Seleziona un tipo' }}
                                    render={({ field: { onChange, value } }) => (
                                        <View style={styles.chipContainer}>
                                            {documentTypes.map(type => (
                                                <Chip
                                                    key={type.id}
                                                    selected={value === type.id}
                                                    onPress={() => onChange(type.id)}
                                                    style={styles.chip}
                                                >
                                                    {type.label}
                                                </Chip>
                                            ))}
                                        </View>
                                    )}
                                />
                            </View>

                            {/* Titolo */}
                            <Controller
                                control={control}
                                name="title"
                                rules={{ required: 'Inserisci un titolo' }}
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        label="Titolo Documento"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        error={!!errors.title}
                                        style={styles.input}
                                    />
                                )}
                            />

                            {/* Date */}
                            <View style={styles.dateContainer}>
                                <View style={styles.dateField}>
                                    <UniversalDatePicker
                                        value={issueDate}
                                        onChange={setIssueDate}
                                        label="Data Emissione"
                                        mode="date"
                                        maximumDate={new Date()}
                                    />
                                </View>
                                <View style={styles.dateField}>
                                    <UniversalDatePicker
                                        value={expiryDate}
                                        onChange={setExpiryDate}
                                        label="Data Scadenza"
                                        mode="date"
                                        minimumDate={new Date()}
                                    />
                                </View>
                            </View>

                            {/* Upload Files - SCELTA TRA FOTO E DOCUMENTI */}
                            <View style={styles.uploadSection}>
                                <Text style={[styles.label, { color: colors.onSurface }]}>
                                    Carica File
                                </Text>

                                {/* Per Foto/Immagini */}
                                <UniversalImagePicker
                                    onImagesSelected={handleFilesSelected}
                                    multiple={true}
                                    maxImages={5}
                                    label="Scatta o Seleziona Foto"
                                    mode="both"
                                    showPreview={true}
                                />

                                <Text style={[styles.orText, { color: colors.onSurfaceVariant }]}>
                                    oppure
                                </Text>

                                {/* Per Documenti PDF/DOC */}
                                <UniversalDocumentPicker
                                    onDocumentsSelected={handleFilesSelected}
                                    accept={['pdf', 'doc', 'image']}
                                    multiple={true}
                                    maxFiles={5}
                                    maxSize={10}
                                    label="Carica Documenti"
                                    showPreview={true}
                                />
                            </View>

                            {/* Submit Button */}
                            <Button
                                mode="contained"
                                onPress={handleSubmit(onSubmit)}
                                loading={isUploading}
                                disabled={isUploading}
                                style={styles.submitButton}
                            >
                                Salva Documento
                            </Button>

                        </Card.Content>
                    </Card>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    card: {
        margin: 16,
    },
    section: {
        marginVertical: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        marginBottom: 4,
    },
    input: {
        marginVertical: 8,
    },
    dateContainer: {
        flexDirection: 'row',
        gap: 12,
        marginVertical: 12,
    },
    dateField: {
        flex: 1,
    },
    uploadSection: {
        marginVertical: 16,
    },
    orText: {
        textAlign: 'center',
        marginVertical: 12,
        fontSize: 14,
    },
    submitButton: {
        marginTop: 24,
        marginBottom: 16,
    },
});
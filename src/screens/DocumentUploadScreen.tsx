// src/screens/DocumentUploadScreen.tsx - ESEMPIO AGGIORNATO
import React, { useState } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    Alert,
} from 'react-native';
import {
    Text,
    Card,
    Button,
    Surface,
} from 'react-native-paper';
import {
    UniversalImagePicker,
    UniversalDatePicker,
    UniversalDocumentPicker,
} from '../components/pickers';
import UploadService from '../services/UploadService';
import FileService from '../services/FileService';
import { useAppThemeManager } from '../hooks/useTheme';

export default function DocumentUploadScreen() {
    const { colors } = useAppThemeManager();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isUploading, setIsUploading] = useState(false);

    // Gestione Immagini
    const handleImagesSelected = async (images: any[]) => {
        console.log('Immagini selezionate:', images);

        for (const image of images) {
            const result = await UploadService.uploadImage(image.uri, {
                path: `documents/images/${FileService.generateUniqueFileName(image.fileName)}`,
                compress: true,
            });
            console.log('Upload completato:', result.url);
        }
    };

    // Gestione Documenti
    const handleDocumentsSelected = async (documents: any[]) => {
        console.log('Documenti selezionati:', documents);

        for (const doc of documents) {
            // Valida dimensione
            if (!FileService.validateFileSize(doc.size || 0, 10)) {
                Alert.alert('Errore', 'File troppo grande (max 10MB)');
                continue;
            }

            // Upload documento
            const result = await UploadService.uploadImage(doc.uri, {
                path: `documents/files/${FileService.generateUniqueFileName(doc.name)}`,
                compress: false, // Non comprimere documenti
            });
            console.log('Documento caricato:', result.url);
        }
    };

    // Gestione Data
    const handleDateChange = (date: Date) => {
        setSelectedDate(date);
        console.log('Data selezionata:', date);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <Card style={styles.card}>
                <Card.Title title="Upload Documenti" />
                <Card.Content>

                    {/* Date Picker */}
                    <Surface style={styles.section} elevation={0}>
                        <Text style={styles.sectionTitle}>Data Documento</Text>
                        <UniversalDatePicker
                            value={selectedDate}
                            onChange={handleDateChange}
                            label="Data di emissione"
                            mode="date"
                            minimumDate={new Date(2020, 0, 1)}
                            maximumDate={new Date()}
                        />
                    </Surface>

                    {/* Image Picker con Camera e Drag&Drop */}
                    <Surface style={styles.section} elevation={0}>
                        <Text style={styles.sectionTitle}>Foto Documento</Text>
                        <UniversalImagePicker
                            onImagesSelected={handleImagesSelected}
                            multiple={true}
                            maxImages={5}
                            label="Aggiungi Foto"
                            mode="both"
                            showPreview={true}
                        />
                    </Surface>

                    {/* Document Picker con Drag&Drop */}
                    <Surface style={styles.section} elevation={0}>
                        <Text style={styles.sectionTitle}>File PDF/DOC</Text>
                        <UniversalDocumentPicker
                            onDocumentsSelected={handleDocumentsSelected}
                            accept={['pdf', 'doc', 'excel']}
                            multiple={true}
                            maxFiles={3}
                            maxSize={10}
                            label="Carica Documenti"
                            showPreview={true}
                        />
                    </Surface>

                    <Button
                        mode="contained"
                        onPress={() => console.log('Salva tutto')}
                        loading={isUploading}
                        style={styles.saveButton}
                    >
                        Salva Documenti
                    </Button>

                </Card.Content>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    card: {
        margin: 16,
    },
    section: {
        padding: 16,
        marginVertical: 8,
        borderRadius: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    saveButton: {
        marginTop: 24,
    },
});
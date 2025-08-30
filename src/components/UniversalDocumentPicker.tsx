// src/components/pickers/UniversalDocumentPicker.tsx
import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    Alert,
    Platform,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Image,
} from 'react-native';
import {
    FileText,
    Upload,
    X,
    File,
    Image as ImageIcon,
    FileCheck,
    AlertCircle
} from 'lucide-react-native';
import * as ExpoDocumentPicker from 'expo-document-picker';
import { useAppThemeManager } from '../hooks/useTheme';

interface DocumentAsset {
    uri: string;
    name: string;
    size?: number;
    type?: string;
}

interface UniversalDocumentPickerProps {
    onDocumentsSelected: (documents: DocumentAsset[]) => void;
    accept?: string[]; // ['pdf', 'doc', 'image', etc.]
    multiple?: boolean;
    maxFiles?: number;
    maxSize?: number; // in MB
    label?: string;
    showPreview?: boolean;
}

export const UniversalDocumentPicker: React.FC<UniversalDocumentPickerProps> = ({
                                                                                    onDocumentsSelected,
                                                                                    accept = ['pdf', 'image'],
                                                                                    multiple = false,
                                                                                    maxFiles = 5,
                                                                                    maxSize = 10, // 10MB default
                                                                                    label = 'Seleziona Documenti',
                                                                                    showPreview = true,
                                                                                }) => {
    const { colors, isDark } = useAppThemeManager();
    const [selectedDocs, setSelectedDocs] = useState<DocumentAsset[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});

    // Mappa dei tipi di file accettati
    const getAcceptedTypes = () => {
        const typeMap: {[key: string]: string} = {
            'pdf': 'application/pdf',
            'doc': 'application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'excel': 'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image': 'image/*',
            'text': 'text/*',
            'video': 'video/*',
            'audio': 'audio/*',
        };

        return accept.map(type => typeMap[type] || type).join(',');
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'N/A';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    const validateFile = (file: DocumentAsset): string | null => {
        if (file.size && file.size > maxSize * 1024 * 1024) {
            return `File troppo grande (max ${maxSize}MB)`;
        }
        // Qui puoi aggiungere altre validazioni
        return null;
    };

    const getFileIcon = (type?: string) => {
        if (!type) return <File size={20} color={colors.onSurfaceVariant} />;
        if (type.startsWith('image/')) return <ImageIcon size={20} color={colors.primary} />;
        if (type.includes('pdf')) return <FileText size={20} color="#E53935" />;
        return <File size={20} color={colors.onSurfaceVariant} />;
    };

    // === MOBILE Document Picker ===
    const handleMobilePick = async () => {
        setIsLoading(true);
        try {
            const result = await ExpoDocumentPicker.getDocumentAsync({
                type: getAcceptedTypes(),
                multiple: multiple,
                copyToCacheDirectory: true,
            });

            if (result.type === 'success') {
                const docs = result.uri ? [{
                    uri: result.uri,
                    name: result.name,
                    size: result.size,
                    type: result.mimeType,
                }] : [];

                // Valida i file
                const validDocs: DocumentAsset[] = [];
                for (const doc of docs) {
                    const error = validateFile(doc);
                    if (error) {
                        Alert.alert('Errore', error);
                    } else {
                        validDocs.push(doc);
                    }
                }

                handleDocumentsAdded(validDocs);
            }
        } catch (error) {
            Alert.alert('Errore', 'Errore nella selezione del documento');
        } finally {
            setIsLoading(false);
        }
    };

    // === WEB Drag & Drop ===
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);

        if (!multiple && files.length > 1) {
            Alert.alert('Errore', 'Puoi selezionare solo un file alla volta');
            return;
        }

        if (files.length > maxFiles) {
            Alert.alert('Errore', `Puoi selezionare massimo ${maxFiles} file`);
            return;
        }

        processWebFiles(files);
    }, [multiple, maxFiles]);

    // === WEB File Input ===
    const handleWebFileSelect = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = getAcceptedTypes();
        input.multiple = multiple;

        input.onchange = (e: any) => {
            const files = Array.from(e.target.files);
            processWebFiles(files);
        };

        input.click();
    };

    // === Process Web Files ===
    const processWebFiles = async (files: File[]) => {
        setIsLoading(true);
        const newDocs: DocumentAsset[] = [];

        for (const file of files) {
            const reader = new FileReader();

            await new Promise<void>((resolve) => {
                reader.onload = (e) => {
                    const doc: DocumentAsset = {
                        uri: e.target?.result as string,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                    };

                    const error = validateFile(doc);
                    if (error) {
                        Alert.alert('Errore', `${file.name}: ${error}`);
                    } else {
                        newDocs.push(doc);
                    }
                    resolve();
                };
                reader.readAsDataURL(file);
            });
        }

        handleDocumentsAdded(newDocs);
        setIsLoading(false);
    };

    // === Handle Documents Added ===
    const handleDocumentsAdded = (newDocs: DocumentAsset[]) => {
        if (multiple) {
            const updatedDocs = [...selectedDocs, ...newDocs].slice(0, maxFiles);
            setSelectedDocs(updatedDocs);
            onDocumentsSelected(updatedDocs);
        } else {
            setSelectedDocs(newDocs);
            onDocumentsSelected(newDocs);
        }
    };

    const removeDocument = (index: number) => {
        const updatedDocs = selectedDocs.filter((_, i) => i !== index);
        setSelectedDocs(updatedDocs);
        onDocumentsSelected(updatedDocs);
    };

    // === RENDER ===
    return (
        <View style={styles.container}>
            {Platform.OS === 'web' ? (
                // WEB: Drag & Drop Zone
                <View
                    style={[
                        styles.dropZone,
                        {
                            backgroundColor: isDragging ? colors.primaryContainer : colors.surfaceVariant,
                            borderColor: isDragging ? colors.primary : colors.outline,
                        }
                    ]}
                    onDragOver={handleDragOver as any}
                    onDragLeave={handleDragLeave as any}
                    onDrop={handleDrop as any}
                    onClick={handleWebFileSelect}
                >
                    {isLoading ? (
                        <ActivityIndicator size="large" color={colors.primary} />
                    ) : (
                        <>
                            <Upload size={48} color={colors.primary} />
                            <Text style={[styles.dropText, { color: colors.onSurface }]}>
                                {isDragging ? 'Rilascia qui i documenti' : 'Trascina qui i documenti o clicca per selezionare'}
                            </Text>
                            <Text style={[styles.dropSubtext, { color: colors.onSurfaceVariant }]}>
                                Formati accettati: {accept.join(', ').toUpperCase()}
                            </Text>
                            <Text style={[styles.dropSubtext, { color: colors.onSurfaceVariant }]}>
                                Max {formatFileSize(maxSize * 1024 * 1024)} per file
                            </Text>
                        </>
                    )}
                </View>
            ) : (
                // MOBILE: Button
                <TouchableOpacity
                    style={[
                        styles.button,
                        { backgroundColor: colors.primaryContainer }
                    ]}
                    onPress={handleMobilePick}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color={colors.onPrimaryContainer} />
                    ) : (
                        <>
                            <Upload size={20} color={colors.onPrimaryContainer} />
                            <Text style={[styles.buttonText, { color: colors.onPrimaryContainer }]}>
                                {label}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            )}

            {/* Preview dei documenti selezionati */}
            {showPreview && selectedDocs.length > 0 && (
                <ScrollView style={styles.previewContainer} showsHorizontalScrollIndicator={false}>
                    {selectedDocs.map((doc, index) => (
                        <View
                            key={index}
                            style={[
                                styles.previewItem,
                                { backgroundColor: colors.surface, borderColor: colors.outline }
                            ]}
                        >
                            <View style={styles.previewInfo}>
                                {getFileIcon(doc.type)}
                                <View style={styles.previewTextContainer}>
                                    <Text
                                        style={[styles.previewName, { color: colors.onSurface }]}
                                        numberOfLines={1}
                                        ellipsizeMode="middle"
                                    >
                                        {doc.name}
                                    </Text>
                                    <Text style={[styles.previewSize, { color: colors.onSurfaceVariant }]}>
                                        {formatFileSize(doc.size)}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => removeDocument(index)}
                                style={styles.removeButton}
                            >
                                <X size={20} color={colors.error} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    dropZone: {
        minHeight: 180,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    dropText: {
        fontSize: 16,
        fontWeight: '500',
        marginTop: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    dropSubtext: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 14,
        borderRadius: 12,
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '500',
    },
    previewContainer: {
        marginTop: 16,
        maxHeight: 200,
    },
    previewItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 8,
    },
    previewInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    previewTextContainer: {
        flex: 1,
    },
    previewName: {
        fontSize: 14,
        fontWeight: '500',
    },
    previewSize: {
        fontSize: 12,
        marginTop: 2,
    },
    removeButton: {
        padding: 4,
    },
});

export default UniversalDocumentPicker;
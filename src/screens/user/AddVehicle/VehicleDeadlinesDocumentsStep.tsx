// src/screens/user/AddVehicle/VehicleDeadlinesDocumentsStep.tsx
// Step 3 - Scadenze e Documenti: Assicurazione, Revisione, Bollo, Altri Documenti

import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Platform,
    useWindowDimensions,
    Alert,
} from 'react-native';
import { FileText, Upload, X } from 'lucide-react-native';
import { VehicleFormData } from '../../../types/addVehicle.types';

interface Props {
    formData: VehicleFormData;
    updateFormData: (data: Partial<VehicleFormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

const VehicleDeadlinesDocumentsStep: React.FC<Props> = ({
                                                            formData,
                                                            updateFormData,
                                                            onNext,
                                                            onBack,
                                                        }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    // Gestione upload file (placeholder per ora)
    const handleFileUpload = (type: 'insurance' | 'revision' | 'roadTax' | 'additional') => {
        if (Platform.OS === 'web') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,application/pdf';

            input.onchange = (e: any) => {
                const file = e.target.files?.[0];
                if (file) {
                    console.log('File selezionato:', file.name);
                    Alert.alert('Successo', `Documento "${file.name}" caricato`);
                    // TODO: Upload a Firebase Storage
                }
            };

            input.click();
        } else {
            Alert.alert('Info', 'Funzione di upload in sviluppo');
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    isDesktop && styles.scrollContentDesktop,
                ]}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.subtitle}>
                    Inserisci le date di scadenza e carica i documenti relativi al tuo
                    veicolo.
                </Text>

                {/* Assicurazione */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.cardIcon}>🛡️</Text>
                        </View>
                        <Text style={styles.cardTitle}>Assicurazione</Text>
                    </View>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Scadenza Assicurazione</Text>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputIcon}>📅</Text>
                            <input
                                type="date"
                                value={
                                    formData.insurance?.expiryDate
                                        ? formData.insurance.expiryDate.toISOString().split('T')[0]
                                        : ''
                                }
                                onChange={(e) =>
                                    updateFormData({
                                        insurance: {
                                            ...formData.insurance,
                                            expiryDate: e.target.value ? new Date(e.target.value) : undefined,
                                        },
                                    })
                                }
                                style={{
                                    flex: 1,
                                    fontSize: 15,
                                    color: '#1e293b',
                                    border: 'none',
                                    outline: 'none',
                                    backgroundColor: 'transparent',
                                }}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={() => handleFileUpload('insurance')}
                    >
                        <Upload size={18} color="#3b82f6" strokeWidth={2} />
                        <Text style={styles.uploadButtonText}>Carica Assicurazione</Text>
                    </TouchableOpacity>
                </View>

                {/* Revisione */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.cardIcon}>🔧</Text>
                        </View>
                        <Text style={styles.cardTitle}>Revisione</Text>
                    </View>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Scadenza Revisione</Text>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputIcon}>📅</Text>
                            <input
                                type="date"
                                value={
                                    formData.revision?.expiryDate
                                        ? formData.revision.expiryDate.toISOString().split('T')[0]
                                        : ''
                                }
                                onChange={(e) =>
                                    updateFormData({
                                        revision: {
                                            ...formData.revision,
                                            expiryDate: e.target.value ? new Date(e.target.value) : undefined,
                                        },
                                    })
                                }
                                style={{
                                    flex: 1,
                                    fontSize: 15,
                                    color: '#1e293b',
                                    border: 'none',
                                    outline: 'none',
                                    backgroundColor: 'transparent',
                                }}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={() => handleFileUpload('revision')}
                    >
                        <Upload size={18} color="#3b82f6" strokeWidth={2} />
                        <Text style={styles.uploadButtonText}>Carica Revisione</Text>
                    </TouchableOpacity>
                </View>

                {/* Bollo */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.cardIcon}>💰</Text>
                        </View>
                        <Text style={styles.cardTitle}>Bollo</Text>
                    </View>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Scadenza Bollo</Text>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputIcon}>📅</Text>
                            <input
                                type="date"
                                value={
                                    formData.roadTax?.expiryDate
                                        ? formData.roadTax.expiryDate.toISOString().split('T')[0]
                                        : ''
                                }
                                onChange={(e) =>
                                    updateFormData({
                                        roadTax: {
                                            ...formData.roadTax,
                                            expiryDate: e.target.value ? new Date(e.target.value) : undefined,
                                        },
                                    })
                                }
                                style={{
                                    flex: 1,
                                    fontSize: 15,
                                    color: '#1e293b',
                                    border: 'none',
                                    outline: 'none',
                                    backgroundColor: 'transparent',
                                }}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={() => handleFileUpload('roadTax')}
                    >
                        <Upload size={18} color="#3b82f6" strokeWidth={2} />
                        <Text style={styles.uploadButtonText}>Carica Bollo</Text>
                    </TouchableOpacity>
                </View>

                {/* Altri Documenti */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.cardIcon}>📄</Text>
                        </View>
                        <Text style={styles.cardTitle}>Altri Documenti</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.addDocumentButton}
                        onPress={() => handleFileUpload('additional')}
                    >
                        <View style={styles.addDocumentIconContainer}>
                            <Upload size={28} color="#3b82f6" strokeWidth={2} />
                        </View>
                        <Text style={styles.addDocumentText}>Aggiungi Nuovo Documento</Text>
                        <Text style={styles.addDocumentSubtext}>
                            Carica immagini o PDF
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Pulsanti Navigazione */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.backButton} onPress={onBack}>
                        <Text style={styles.backButtonText}>Indietro</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.nextButton} onPress={onNext}>
                        <Text style={styles.nextButtonText}>Continua</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    scrollContentDesktop: {
        paddingHorizontal: 40,
    },

    subtitle: {
        fontSize: 15,
        color: '#64748b',
        lineHeight: 22,
        marginBottom: 24,
    },

    // Card
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            },
        }),
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardIcon: {
        fontSize: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        letterSpacing: -0.3,
    },

    // Field Container
    fieldContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 10,
    },

    // Input Wrapper
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 10,
    },
    inputIcon: {
        fontSize: 18,
    },

    // Upload Button
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        paddingVertical: 14,
        borderWidth: 2,
        borderColor: '#dbeafe',
        borderStyle: 'dashed',
    },
    uploadButtonText: {
        fontSize: 15,
        color: '#3b82f6',
        fontWeight: '600',
    },

    // Add Document Button
    addDocumentButton: {
        alignItems: 'center',
        paddingVertical: 32,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        borderStyle: 'dashed',
    },
    addDocumentIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    addDocumentText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3b82f6',
        marginBottom: 4,
    },
    addDocumentSubtext: {
        fontSize: 13,
        color: '#64748b',
    },

    // Button Row
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    backButton: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e2e8f0',
    },
    backButtonText: {
        color: '#64748b',
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    nextButton: {
        flex: 1,
        backgroundColor: '#3b82f6',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: '0 4px 8px rgba(59,130,246,0.3)',
            },
        }),
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
});

export default VehicleDeadlinesDocumentsStep;
// src/screens/user/AddVehicle/VehicleSummaryStep.tsx
// Step 4 - Riepilogo: Mostra tutti i dati inseriti prima del salvataggio

import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Platform,
    useWindowDimensions,
    ActivityIndicator,
} from 'react-native';
import { CheckCircle, Edit } from 'lucide-react-native';
import { VehicleFormData } from '../../../types/addVehicle.types';

interface Props {
    formData: VehicleFormData;
    updateFormData: (data: Partial<VehicleFormData>) => void;
    onNext: () => void;
    onBack: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
}

const VehicleSummaryStep: React.FC<Props> = ({
                                                 formData,
                                                 onBack,
                                                 onSubmit,
                                                 isSubmitting,
                                             }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    const formatDate = (date?: Date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('it-IT');
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
                <Text style={styles.title}>Riepilogo Veicolo</Text>
                <Text style={styles.subtitle}>
                    Controlla i dati inseriti prima di confermare l'aggiunta del veicolo.
                </Text>

                {/* Dati di Base */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.sectionIcon}>🚗</Text>
                        </View>
                        <Text style={styles.sectionTitle}>Dati di Base</Text>
                    </View>

                    <View style={styles.dataGrid}>
                        <DataRow label="Marca" value={formData.make} />
                        <DataRow label="Modello" value={formData.model} />
                        <DataRow label="Anno" value={formData.year?.toString()} />
                        <DataRow label="Targa" value={formData.licensePlate} />
                    </View>
                </View>

                {/* Dettagli Tecnici */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.sectionIcon}>⚙️</Text>
                        </View>
                        <Text style={styles.sectionTitle}>Dettagli Tecnici</Text>
                    </View>

                    <View style={styles.dataGrid}>
                        <DataRow
                            label="Carburante"
                            value={formData.fuelType || '-'}
                        />
                        <DataRow
                            label="Cambio"
                            value={formData.transmission || '-'}
                        />
                        <DataRow
                            label="Cilindrata"
                            value={formData.engineSize ? `${formData.engineSize} cc` : '-'}
                        />
                        <DataRow
                            label="Potenza"
                            value={formData.power ? `${formData.power} CV` : '-'}
                        />
                        <DataRow
                            label="VIN"
                            value={formData.vin || '-'}
                            fullWidth
                        />
                        <DataRow
                            label="Data Immatricolazione"
                            value={formatDate(formData.registrationDate)}
                        />
                    </View>
                </View>

                {/* Scadenze */}
                {(formData.insurance?.expiryDate ||
                    formData.revision?.expiryDate ||
                    formData.roadTax?.expiryDate) && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.iconContainer}>
                                <Text style={styles.sectionIcon}>📅</Text>
                            </View>
                            <Text style={styles.sectionTitle}>Scadenze</Text>
                        </View>

                        <View style={styles.dataGrid}>
                            {formData.insurance?.expiryDate && (
                                <DataRow
                                    label="Assicurazione"
                                    value={formatDate(formData.insurance.expiryDate)}
                                />
                            )}
                            {formData.revision?.expiryDate && (
                                <DataRow
                                    label="Revisione"
                                    value={formatDate(formData.revision.expiryDate)}
                                />
                            )}
                            {formData.roadTax?.expiryDate && (
                                <DataRow
                                    label="Bollo"
                                    value={formatDate(formData.roadTax.expiryDate)}
                                />
                            )}
                        </View>
                    </View>
                )}

                {/* Documenti */}
                {formData.additionalDocuments && formData.additionalDocuments.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.iconContainer}>
                                <Text style={styles.sectionIcon}>📄</Text>
                            </View>
                            <Text style={styles.sectionTitle}>Documenti Caricati</Text>
                        </View>

                        <View style={styles.documentsList}>
                            {formData.additionalDocuments.map((doc) => (
                                <View key={doc.id} style={styles.documentItem}>
                                    <Text style={styles.documentName}>{doc.name}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Pulsanti Navigazione */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={onBack}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.backButtonText}>Indietro</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            isSubmitting && styles.submitButtonDisabled,
                        ]}
                        onPress={onSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <CheckCircle size={20} color="#fff" strokeWidth={2.5} />
                                <Text style={styles.submitButtonText}>
                                    Conferma e Aggiungi Veicolo
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

// Data Row Component
const DataRow: React.FC<{
    label: string;
    value: string;
    fullWidth?: boolean;
}> = ({ label, value, fullWidth }) => (
    <View style={[styles.dataRow, fullWidth && styles.dataRowFull]}>
        <Text style={styles.dataLabel}>{label}</Text>
        <Text style={styles.dataValue}>{value}</Text>
    </View>
);

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

    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748b',
        lineHeight: 22,
        marginBottom: 32,
    },

    // Section
    section: {
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
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionIcon: {
        fontSize: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        letterSpacing: -0.3,
    },

    // Data Grid
    dataGrid: {
        gap: 12,
    },
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    dataRowFull: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 6,
    },
    dataLabel: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    dataValue: {
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '600',
    },

    // Documents List
    documentsList: {
        gap: 10,
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    documentName: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '500',
    },

    // Button Row
    buttonRow: {
        gap: 12,
        marginTop: 16,
    },
    backButton: {
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
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#10b981',
        borderRadius: 16,
        paddingVertical: 18,
        ...Platform.select({
            ios: {
                shadowColor: '#10b981',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: '0 4px 8px rgba(16,185,129,0.3)',
            },
        }),
    },
    submitButtonDisabled: {
        backgroundColor: '#cbd5e1',
        ...Platform.select({
            ios: {
                shadowOpacity: 0,
            },
            android: {
                elevation: 0,
            },
            web: {
                boxShadow: 'none',
            },
        }),
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
});

export default VehicleSummaryStep;
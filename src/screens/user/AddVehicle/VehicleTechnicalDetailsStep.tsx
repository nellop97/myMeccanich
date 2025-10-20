// src/screens/user/AddVehicle/VehicleTechnicalDetailsStep.tsx
// Step 2 - Dettagli Tecnici: Carburante, Cilindrata, Potenza, VIN, Data Immatricolazione

import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { Info } from 'lucide-react-native';
import { VehicleFormData, FUEL_TYPES, TRANSMISSION_TYPES } from '../../../types/addVehicle.types';

interface Props {
    formData: VehicleFormData;
    updateFormData: (data: Partial<VehicleFormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

const VehicleTechnicalDetailsStep: React.FC<Props> = ({
                                                          formData,
                                                          updateFormData,
                                                          onNext,
                                                          onBack,
                                                      }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;
    const isMobile = width < 768;

    const [showVinInfo, setShowVinInfo] = useState(false);

    const isValid = !!formData.fuelType;

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
                    Inserisci le specifiche del tuo veicolo. Questi dati ci aiuteranno a
                    fornirti un servizio migliore.
                </Text>

                {/* Tipo Carburante */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>
                        Tipo Carburante <Text style={styles.required}>*</Text>
                    </Text>
                    <View
                        style={[
                            styles.chipGrid,
                            isMobile && styles.chipGridMobile,
                        ]}
                    >
                        {FUEL_TYPES.map((fuel) => (
                            <TouchableOpacity
                                key={fuel.id}
                                style={[
                                    styles.chip,
                                    formData.fuelType === fuel.id && styles.chipSelected,
                                ]}
                                onPress={() => updateFormData({ fuelType: fuel.id as any })}
                            >
                                <Text style={styles.chipIcon}>{fuel.icon}</Text>
                                <Text
                                    style={[
                                        styles.chipText,
                                        formData.fuelType === fuel.id && styles.chipTextSelected,
                                    ]}
                                >
                                    {fuel.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Cilindrata e Potenza - Side by side su desktop */}
                <View
                    style={[
                        styles.row,
                        isDesktop && styles.rowDesktop,
                    ]}
                >
                    {/* Cilindrata */}
                    <View style={[styles.fieldContainer, styles.flexField]}>
                        <Text style={styles.label}>
                            Cilindrata <Text style={styles.optionalLabel}>(Opzionale)</Text>
                        </Text>
                        <View style={styles.inputWrapper}>
                            <input
                                type="number"
                                placeholder="" // ✅ RIMOSSO placeholder
                                value={formData.engineSize?.toString() || ''}
                                onChange={(e) =>
                                    updateFormData({
                                        engineSize: e.target.value ? parseInt(e.target.value) : undefined,
                                    })
                                }
                                style={{
                                    flex: 1,
                                    fontSize: 16,
                                    color: '#1e293b',
                                    border: 'none',
                                    outline: 'none',
                                    backgroundColor: 'transparent',
                                }}
                            />
                            <Text style={styles.inputUnit}>cc</Text>
                        </View>
                    </View>

                    {/* Potenza */}
                    <View style={[styles.fieldContainer, styles.flexField]}>
                        <Text style={styles.label}>
                            Potenza <Text style={styles.optionalLabel}>(Opzionale)</Text>
                        </Text>
                        <View style={styles.inputWrapper}>
                            <input
                                type="number"
                                placeholder="" // ✅ RIMOSSO placeholder
                                value={formData.power?.toString() || ''}
                                onChange={(e) =>
                                    updateFormData({
                                        power: e.target.value ? parseInt(e.target.value) : undefined,
                                    })
                                }
                                style={{
                                    flex: 1,
                                    fontSize: 16,
                                    color: '#1e293b',
                                    border: 'none',
                                    outline: 'none',
                                    backgroundColor: 'transparent',
                                }}
                            />
                            <Text style={styles.inputUnit}>CV</Text>
                        </View>
                    </View>
                </View>

                {/* Numero di Telaio (VIN) */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>
                        VIN / Telaio <Text style={styles.optionalLabel}>(Opzionale)</Text>
                    </Text>

                    {Platform.OS === 'web' && (
                        <View style={styles.helperTextContainer}>
                            <Text style={styles.helperText}>
                                Il numero di telaio identificativo del veicolo.
                                Lo trovi sul libretto di circolazione.
                            </Text>
                        </View>
                    )}

                    <View style={styles.inputWrapper}>
                        <input
                            type="text"
                            placeholder="" // ✅ RIMOSSO placeholder
                            value={formData.vin || ''}
                            onChange={(e) =>
                                updateFormData({ vin: e.target.value.toUpperCase() })
                            }
                            maxLength={17}
                            style={{
                                flex: 1,
                                fontSize: 16,
                                color: '#1e293b',
                                border: 'none',
                                outline: 'none',
                                backgroundColor: 'transparent',
                                textTransform: 'uppercase',
                                letterSpacing: 1,
                            }}
                        />
                    </View>
                </View>

                {/* Data di Immatricolazione */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Data di Immatricolazione</Text>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>📅</Text>
                        <input
                            type="date"
                            value={
                                formData.registrationDate
                                    ? formData.registrationDate.toISOString().split('T')[0]
                                    : ''
                            }
                            onChange={(e) =>
                                updateFormData({
                                    registrationDate: e.target.value
                                        ? new Date(e.target.value)
                                        : undefined,
                                })
                            }
                            style={{
                                flex: 1,
                                fontSize: 16,
                                color: '#1e293b',
                                border: 'none',
                                outline: 'none',
                                backgroundColor: 'transparent',
                            }}
                        />
                    </View>
                    <Text style={styles.helperText}>GG/MM/AAAA</Text>
                </View>

                {/* Pulsanti Navigazione */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.backButton} onPress={onBack}>
                        <Text style={styles.backButtonText}>Indietro</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.nextButton, !isValid && styles.nextButtonDisabled]}
                        onPress={onNext}
                        disabled={!isValid}
                    >
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

    // Field Container
    fieldContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 12,
        letterSpacing: -0.2,
    },
    required: {
        color: '#ef4444',
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },

    // Info Box
    infoBox: {
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#3b82f6',
    },
    infoText: {
        fontSize: 14,
        color: '#1e40af',
        lineHeight: 20,
    },

    // Chip Selector
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    chipGridMobile: {
        gap: 10,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 1,
            },
            web: {
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            },
        }),
    },
    chipSelected: {
        backgroundColor: '#eff6ff',
        borderColor: '#3b82f6',
    },
    chipIcon: {
        fontSize: 18,
    },
    chipText: {
        fontSize: 15,
        color: '#64748b',
        fontWeight: '500',
    },
    chipTextSelected: {
        color: '#3b82f6',
        fontWeight: '600',
    },

    // Row Layout
    row: {
        flexDirection: 'column',
        gap: 24,
        marginBottom: 0,
    },
    rowDesktop: {
        flexDirection: 'row',
    },
    flexField: {
        flex: 1,
    },

    // Input Wrapper
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        gap: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 1,
            },
            web: {
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            },
        }),
    },
    inputIcon: {
        fontSize: 20,
    },
    inputUnit: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
    },
    helperText: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 8,
        marginLeft: 4,
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
    nextButtonDisabled: {
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
    nextButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
});

export default VehicleTechnicalDetailsStep;
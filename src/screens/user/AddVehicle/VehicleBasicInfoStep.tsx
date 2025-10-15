// src/screens/user/AddVehicle/VehicleBasicInfoStep.tsx
// Step 1 - Dati Base: Marca, Modello, Anno, Targa

import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Platform,
    useWindowDimensions,
    Modal,
    FlatList,
} from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { VehicleFormData, POPULAR_MAKES, getValidYears } from '../../../types/addVehicle.types';

interface Props {
    formData: VehicleFormData;
    updateFormData: (data: Partial<VehicleFormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

const VehicleBasicInfoStep: React.FC<Props> = ({
                                                   formData,
                                                   updateFormData,
                                                   onNext,
                                                   onBack,
                                               }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    // Stati per modali
    const [showMakeModal, setShowMakeModal] = useState(false);
    const [showYearModal, setShowYearModal] = useState(false);

    const years = getValidYears();

    // Valida targa italiana
    const validateLicensePlate = (plate: string): boolean => {
        const newFormat = /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/;
        const oldFormat = /^[A-Z]{2}[0-9]{5}$/;
        return newFormat.test(plate.toUpperCase()) || oldFormat.test(plate.toUpperCase());
    };

    const isValid = !!(
        formData.make &&
        formData.model &&
        formData.year &&
        formData.licensePlate &&
        validateLicensePlate(formData.licensePlate)
    );

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
                {/* Marca */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Marca</Text>
                    <TouchableOpacity
                        style={[
                            styles.selectButton,
                            !formData.make && styles.selectButtonEmpty,
                        ]}
                        onPress={() => setShowMakeModal(true)}
                    >
                        <Text
                            style={[
                                styles.selectButtonText,
                                !formData.make && styles.selectButtonTextEmpty,
                            ]}
                        >
                            {formData.make || 'Seleziona marca'}
                        </Text>
                        <ChevronDown size={20} color="#64748b" />
                    </TouchableOpacity>
                    {formData.make && (
                        <Text style={styles.helperText}>Es. {formData.make}</Text>
                    )}
                </View>

                {/* Modello */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Modello</Text>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>🚗</Text>
                        <input
                            type="text"
                            placeholder="Seleziona modello"
                            value={formData.model}
                            onChange={(e) => updateFormData({ model: e.target.value })}
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
                    {formData.model && (
                        <Text style={styles.helperText}>Es. {formData.model}</Text>
                    )}
                </View>

                {/* Anno di produzione */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Anno di produzione</Text>
                    <TouchableOpacity
                        style={[
                            styles.selectButton,
                            !formData.year && styles.selectButtonEmpty,
                        ]}
                        onPress={() => setShowYearModal(true)}
                    >
                        <Text
                            style={[
                                styles.selectButtonText,
                                !formData.year && styles.selectButtonTextEmpty,
                            ]}
                        >
                            {formData.year || 'Seleziona anno'}
                        </Text>
                        <ChevronDown size={20} color="#64748b" />
                    </TouchableOpacity>
                    {formData.year && (
                        <Text style={styles.helperText}>Es. {formData.year}</Text>
                    )}
                </View>

                {/* Targa */}
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Targa</Text>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputIcon}>🔢</Text>
                        <input
                            type="text"
                            placeholder="AB123CD"
                            value={formData.licensePlate}
                            onChange={(e) =>
                                updateFormData({
                                    licensePlate: e.target.value.toUpperCase(),
                                })
                            }
                            maxLength={7}
                            style={{
                                flex: 1,
                                fontSize: 16,
                                color: '#1e293b',
                                border: 'none',
                                outline: 'none',
                                backgroundColor: 'transparent',
                                textTransform: 'uppercase',
                            }}
                        />
                    </View>
                    <Text style={styles.helperText}>
                        Inserisci la targa del veicolo
                    </Text>
                </View>

                {/* Bottone Avanti */}
                <TouchableOpacity
                    style={[styles.nextButton, !isValid && styles.nextButtonDisabled]}
                    onPress={onNext}
                    disabled={!isValid}
                >
                    <Text style={styles.nextButtonText}>Avanti</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Modal Marca */}
            {showMakeModal && (
                <Modal
                    visible={showMakeModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowMakeModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Seleziona Marca</Text>
                                <TouchableOpacity onPress={() => setShowMakeModal(false)}>
                                    <Text style={styles.modalClose}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={POPULAR_MAKES}
                                keyExtractor={(item) => item}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.modalItem}
                                        onPress={() => {
                                            updateFormData({ make: item });
                                            setShowMakeModal(false);
                                        }}
                                    >
                                        <Text style={styles.modalItemText}>{item}</Text>
                                        {formData.make === item && (
                                            <Text style={styles.modalItemCheck}>✓</Text>
                                        )}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </Modal>
            )}

            {/* Modal Anno */}
            {showYearModal && (
                <Modal
                    visible={showYearModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowYearModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Seleziona Anno</Text>
                                <TouchableOpacity onPress={() => setShowYearModal(false)}>
                                    <Text style={styles.modalClose}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={years}
                                keyExtractor={(item) => item.toString()}
                                initialScrollIndex={0}
                                getItemLayout={(data, index) => ({
                                    length: 56,
                                    offset: 56 * index,
                                    index,
                                })}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.modalItem}
                                        onPress={() => {
                                            updateFormData({ year: item });
                                            setShowYearModal(false);
                                        }}
                                    >
                                        <Text style={styles.modalItemText}>{item}</Text>
                                        {formData.year === item && (
                                            <Text style={styles.modalItemCheck}>✓</Text>
                                        )}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </Modal>
            )}
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

    // Select Button
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 18,
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
    selectButtonEmpty: {
        borderColor: '#cbd5e1',
    },
    selectButtonText: {
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '500',
    },
    selectButtonTextEmpty: {
        color: '#94a3b8',
        fontWeight: '400',
    },

    // Input Wrapper (for native inputs)
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

    helperText: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 8,
        marginLeft: 4,
    },

    // Next Button
    nextButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        marginTop: 16,
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

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
            web: {
                boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
            },
        }),
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
    },
    modalClose: {
        fontSize: 24,
        color: '#64748b',
        fontWeight: '300',
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalItemText: {
        fontSize: 16,
        color: '#1e293b',
    },
    modalItemCheck: {
        fontSize: 20,
        color: '#3b82f6',
        fontWeight: '700',
    },
});

export default VehicleBasicInfoStep;
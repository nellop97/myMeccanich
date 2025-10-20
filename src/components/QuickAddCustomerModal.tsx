// src/components/QuickAddCustomerModal.tsx
// Modal per aggiungere rapidamente un nuovo cliente
// Responsive per Web e Mobile

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { X, User, Mail, Phone, Save } from 'lucide-react-native';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

interface QuickAddCustomerModalProps {
    visible: boolean;
    onClose: () => void;
    onCustomerAdded: (customer: any) => void;
    darkMode?: boolean;
}

const QuickAddCustomerModal: React.FC<QuickAddCustomerModalProps> = ({
                                                                         visible,
                                                                         onClose,
                                                                         onCustomerAdded,
                                                                         darkMode = false,
                                                                     }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const theme = {
        background: darkMode ? '#121212' : '#ffffff',
        cardBackground: darkMode ? '#1e1e1e' : '#f8fafc',
        text: darkMode ? '#ffffff' : '#0f172a',
        textSecondary: darkMode ? '#a0a0a0' : '#64748b',
        border: darkMode ? '#2d2d2d' : '#e2e8f0',
        inputBackground: darkMode ? '#2d2d2d' : '#ffffff',
        placeholderColor: darkMode ? '#6b7280' : '#94a3b8',
        primary: '#2563eb',
        error: '#ef4444',
    };

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'Nome richiesto';
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Cognome richiesto';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email richiesta';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email non valida';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const checkDuplicate = async (): Promise<boolean> => {
        try {
            // Controlla se esiste già un utente con la stessa email
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', formData.email.toLowerCase().trim()));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                Alert.alert(
                    'Cliente Esistente',
                    `Esiste già un cliente con l'email ${formData.email}. Vuoi cercarlo invece?`,
                    [
                        { text: 'Annulla', style: 'cancel' },
                        {
                            text: 'Cerca',
                            onPress: () => {
                                onClose();
                                // Qui potresti emettere un evento per aprire la ricerca
                            },
                        },
                    ]
                );
                return true;
            }

            return false;
        } catch (error) {
            console.error('Errore controllo duplicati:', error);
            return false;
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Controlla duplicati
            const isDuplicate = await checkDuplicate();
            if (isDuplicate) {
                setIsSubmitting(false);
                return;
            }

            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('Utente non autenticato');
            }

            // Crea il nuovo cliente
            const customerData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.toLowerCase().trim(),
                phone: formData.phone.trim() || null,
                userType: 'user', // Cliente standard
                registrationDate: serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: currentUser.uid, // ID del meccanico che ha creato il cliente
                isActive: true,
            };

            const docRef = await addDoc(collection(db, 'users'), customerData);

            console.log('✅ Cliente aggiunto con ID:', docRef.id);

            // Prepara oggetto cliente per il callback
            const newCustomer = {
                id: docRef.id,
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.toLowerCase().trim(),
                phone: formData.phone.trim() || undefined,
                userType: 'user',
            };

            // Resetta il form
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
            });
            setErrors({});

            // Chiama il callback con il nuovo cliente
            onCustomerAdded(newCustomer);

            Alert.alert('Successo', 'Cliente aggiunto con successo!');
        } catch (error: any) {
            console.error('❌ Errore salvataggio cliente:', error);
            Alert.alert('Errore', error.message || 'Impossibile salvare il cliente');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
        });
        setErrors({});
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={[styles.container, { backgroundColor: theme.background }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <View style={styles.headerLeft}>
                            <User size={24} color={theme.primary} />
                            <Text style={[styles.headerTitle, { color: theme.text }]}>
                                Aggiungi Nuovo Cliente
                            </Text>
                        </View>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <X size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollViewContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Dati Anagrafici</Text>

                            {/* Nome */}
                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: theme.text }]}>
                                    Nome <Text style={{ color: theme.error }}>*</Text>
                                </Text>
                                <View style={[styles.inputContainer, { borderColor: errors.firstName ? theme.error : theme.border }]}>
                                    <User size={20} color={theme.textSecondary} />
                                    <TextInput
                                        style={[styles.input, { color: theme.text }]}
                                        placeholder="es. Mario"
                                        placeholderTextColor={theme.placeholderColor}
                                        value={formData.firstName}
                                        onChangeText={(text) => {
                                            setFormData({ ...formData, firstName: text });
                                            setErrors({ ...errors, firstName: '' });
                                        }}
                                        autoCapitalize="words"
                                    />
                                </View>
                                {errors.firstName && (
                                    <Text style={[styles.errorText, { color: theme.error }]}>{errors.firstName}</Text>
                                )}
                            </View>

                            {/* Cognome */}
                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: theme.text }]}>
                                    Cognome <Text style={{ color: theme.error }}>*</Text>
                                </Text>
                                <View style={[styles.inputContainer, { borderColor: errors.lastName ? theme.error : theme.border }]}>
                                    <User size={20} color={theme.textSecondary} />
                                    <TextInput
                                        style={[styles.input, { color: theme.text }]}
                                        placeholder="es. Rossi"
                                        placeholderTextColor={theme.placeholderColor}
                                        value={formData.lastName}
                                        onChangeText={(text) => {
                                            setFormData({ ...formData, lastName: text });
                                            setErrors({ ...errors, lastName: '' });
                                        }}
                                        autoCapitalize="words"
                                    />
                                </View>
                                {errors.lastName && (
                                    <Text style={[styles.errorText, { color: theme.error }]}>{errors.lastName}</Text>
                                )}
                            </View>

                            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Contatti</Text>

                            {/* Email */}
                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: theme.text }]}>
                                    Email <Text style={{ color: theme.error }}>*</Text>
                                </Text>
                                <View style={[styles.inputContainer, { borderColor: errors.email ? theme.error : theme.border }]}>
                                    <Mail size={20} color={theme.textSecondary} />
                                    <TextInput
                                        style={[styles.input, { color: theme.text }]}
                                        placeholder="es. mario.rossi@email.it"
                                        placeholderTextColor={theme.placeholderColor}
                                        value={formData.email}
                                        onChangeText={(text) => {
                                            setFormData({ ...formData, email: text });
                                            setErrors({ ...errors, email: '' });
                                        }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                                {errors.email && <Text style={[styles.errorText, { color: theme.error }]}>{errors.email}</Text>}
                            </View>

                            {/* Telefono */}
                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: theme.text }]}>Telefono (opzionale)</Text>
                                <View style={[styles.inputContainer, { borderColor: theme.border }]}>
                                    <Phone size={20} color={theme.textSecondary} />
                                    <TextInput
                                        style={[styles.input, { color: theme.text }]}
                                        placeholder="es. +39 333 1234567"
                                        placeholderTextColor={theme.placeholderColor}
                                        value={formData.phone}
                                        onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>

                            <View style={[styles.infoBox, { backgroundColor: theme.primary + '10', borderColor: theme.primary }]}>
                                <Text style={[styles.infoText, { color: theme.primary }]}>
                                    💡 Il cliente riceverà un'email per completare la registrazione e potrà accedere all'app per visualizzare
                                    lo stato dei suoi veicoli.
                                </Text>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer Buttons */}
                    <View style={[styles.footer, { backgroundColor: theme.cardBackground, borderTopColor: theme.border }]}>
                        <TouchableOpacity
                            style={[styles.cancelButton, { borderColor: theme.border }]}
                            onPress={handleClose}
                            disabled={isSubmitting}
                        >
                            <Text style={[styles.cancelButtonText, { color: theme.text }]}>Annulla</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: theme.primary }]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <>
                                    <Save size={20} color="#ffffff" />
                                    <Text style={styles.saveButtonText}>Salva Cliente</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
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
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    closeButton: {
        padding: 8,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        padding: 16,
    },
    card: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        gap: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
    },
    errorText: {
        fontSize: 12,
        marginTop: 4,
    },
    infoBox: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginTop: 16,
    },
    infoText: {
        fontSize: 13,
        lineHeight: 18,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
    },
    cancelButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default QuickAddCustomerModal;
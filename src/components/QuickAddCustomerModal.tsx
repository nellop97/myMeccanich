
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

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
  darkMode = false
}) => {
  const [customerData, setCustomerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  const theme = {
    background: darkMode ? '#121212' : '#ffffff',
    cardBackground: darkMode ? '#1e1e1e' : '#f8fafc',
    text: darkMode ? '#ffffff' : '#0f172a',
    textSecondary: darkMode ? '#a0a0a0' : '#64748b',
    border: darkMode ? '#333333' : '#e2e8f0',
    primary: '#3b82f6',
    success: '#10b981',
  };

  const handleSave = async () => {
    if (!customerData.firstName.trim() || !customerData.lastName.trim() || !customerData.email.trim()) {
      Alert.alert('Errore', 'Compila almeno nome, cognome e email');
      return;
    }

    // Validazione email semplice
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerData.email)) {
      Alert.alert('Errore', 'Inserisci un indirizzo email valido');
      return;
    }

    setLoading(true);

    try {
      const newCustomer = {
        ...customerData,
        email: customerData.email.toLowerCase(),
        userType: 'user',
        profileComplete: true,
        verified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'users'), newCustomer);

      const savedCustomer = {
        id: docRef.id,
        ...newCustomer,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      onCustomerAdded(savedCustomer);
      setCustomerData({ firstName: '', lastName: '', email: '', phone: '' });
      onClose();

      Alert.alert('Successo', 'Cliente aggiunto con successo!');
    } catch (error) {
      console.error('Errore nell\'aggiunta del cliente:', error);
      Alert.alert('Errore', 'Errore nell\'aggiunta del cliente. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Aggiungi Cliente
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>
              Nome *
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <MaterialCommunityIcons name="account" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Nome"
                placeholderTextColor={theme.textSecondary}
                value={customerData.firstName}
                onChangeText={(text) => setCustomerData({ ...customerData, firstName: text })}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>
              Cognome *
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <MaterialCommunityIcons name="account" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Cognome"
                placeholderTextColor={theme.textSecondary}
                value={customerData.lastName}
                onChangeText={(text) => setCustomerData({ ...customerData, lastName: text })}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>
              Email *
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <MaterialCommunityIcons name="email" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="email@esempio.com"
                placeholderTextColor={theme.textSecondary}
                value={customerData.email}
                onChangeText={(text) => setCustomerData({ ...customerData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>
              Telefono
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <MaterialCommunityIcons name="phone" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="3xx xxx xxxx"
                placeholderTextColor={theme.textSecondary}
                value={customerData.phone}
                onChangeText={(text) => setCustomerData({ ...customerData, phone: text })}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={20} color="#ffffff" />
                <Text style={styles.saveButtonText}>Salva Cliente</Text>
              </>
            )}
          </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default QuickAddCustomerModal;

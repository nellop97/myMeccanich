// src/components/VehicleTransferModal.tsx
// Modale per passaggio di proprietà veicolo con Liquid Glass Design

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  Switch,
  KeyboardAvoidingView,
} from 'react-native';
import {
  X,
  UserPlus,
  Mail,
  Phone,
  Key,
  Shield,
  CheckCircle,
  Info,
  ArrowRight,
  Search,
  User,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAppThemeManager } from '../hooks/useTheme';
import { TransferService } from '../services/TransferService';
import { VehicleTransfer } from '../types/database.types';
import UserSearchModal from './UserSearchModal';

interface VehicleTransferModalProps {
  visible: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleName: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
}

// Glass Card Component
const GlassCard = ({ children, style }: any) => {
  const { isDark } = useAppThemeManager();

  return Platform.OS === 'web' || Platform.OS === 'ios' ? (
    <BlurView
      intensity={Platform.OS === 'web' ? 40 : isDark ? 30 : 60}
      tint={isDark ? 'dark' : 'light'}
      style={[
        {
          backgroundColor: isDark
            ? 'rgba(30, 30, 30, 0.7)'
            : 'rgba(255, 255, 255, 0.7)',
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.05)',
          borderWidth: 1,
          borderRadius: 16,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </BlurView>
  ) : (
    <View
      style={[
        {
          backgroundColor: isDark
            ? 'rgba(30, 30, 30, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.05)',
          borderWidth: 1,
          borderRadius: 16,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const VehicleTransferModal: React.FC<VehicleTransferModalProps> = ({
  visible,
  onClose,
  vehicleId,
  vehicleName,
  sellerId,
  sellerName,
  sellerEmail,
}) => {
  const { colors, isDark } = useAppThemeManager();
  const transferService = TransferService.getInstance();

  const [step, setStep] = useState<'buyer' | 'options' | 'confirm'>('buyer');
  const [loading, setLoading] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Dati compratore
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');

  // PIN di sicurezza
  const [transferPin, setTransferPin] = useState('');

  // Opzioni trasferimento
  const [transferOptions, setTransferOptions] = useState<
    VehicleTransfer['transferData']
  >({
    maintenanceHistory: true,
    maintenanceDetails: false,
    documents: false,
    photos: true,
    reminders: false,
  });

  const handleSelectUser = (user: any) => {
    // Salva l'utente selezionato e popola i dati del compratore
    const fullName = `${user.firstName} ${user.lastName}`;
    setSelectedUser(user);
    setBuyerName(fullName);
    setBuyerEmail(user.email);
    setBuyerPhone(user.phone || '');
    setShowSearchModal(false);
  };

  const handleTransfer = async () => {
    // Validazione
    if (!selectedUser || !buyerName.trim()) {
      Alert.alert('Errore', 'Devi selezionare un proprietario dal database');
      return;
    }

    if (!buyerEmail.trim() || !buyerEmail.includes('@')) {
      Alert.alert('Errore', 'Inserisci un\'email valida');
      return;
    }

    if (!transferPin || transferPin.length < 4) {
      Alert.alert(
        'Errore',
        'Inserisci un PIN di sicurezza di almeno 4 cifre'
      );
      return;
    }

    try {
      setLoading(true);

      await transferService.createTransfer(
        vehicleId,
        sellerId,
        sellerName,
        sellerEmail,
        {
          name: buyerName.trim(),
          email: buyerEmail.trim().toLowerCase(),
          phone: buyerPhone.trim() || undefined,
        },
        transferOptions,
        transferPin
      );

      Alert.alert(
        'Trasferimento Avviato',
        `È stata inviata una email a ${buyerEmail} con le istruzioni per completare il trasferimento. Il trasferimento è valido per 30 giorni.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
              resetForm();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Errore trasferimento:', error);
      Alert.alert(
        'Errore',
        'Impossibile avviare il trasferimento. Riprova più tardi.'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('buyer');
    setSelectedUser(null);
    setBuyerName('');
    setBuyerEmail('');
    setBuyerPhone('');
    setTransferPin('');
    setTransferOptions({
      maintenanceHistory: true,
      maintenanceDetails: false,
      documents: false,
      photos: true,
      reminders: false,
    });
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      resetForm();
    }
  };

  const renderBuyerStep = () => (
    <View>
      <View style={styles.stepHeader}>
        <View style={[styles.stepIcon, { backgroundColor: `${colors.primary}20` }]}>
          <UserPlus size={24} color={colors.primary} />
        </View>
        <Text style={[styles.stepTitle, { color: colors.onSurface }]}>
          Dati Nuovo Proprietario
        </Text>
      </View>

      {!selectedUser ? (
        // Mostra pulsante di ricerca se nessun utente è selezionato
        <View>
          <TouchableOpacity
            style={[styles.searchButton]}
            onPress={() => setShowSearchModal(true)}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.searchButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Search size={20} color="white" />
              <Text style={styles.searchButtonText}>Cerca Proprietario</Text>
            </LinearGradient>
          </TouchableOpacity>

          <GlassCard style={styles.emptyStateCard}>
            <User size={40} color={colors.onSurfaceVariant} />
            <Text style={[styles.emptyStateText, { color: colors.onSurfaceVariant }]}>
              Cerca e seleziona il nuovo proprietario dal database
            </Text>
          </GlassCard>
        </View>
      ) : (
        // Mostra card con dati utente selezionato
        <View>
          <GlassCard style={styles.selectedUserCard}>
            <View style={styles.selectedUserContent}>
              <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.userAvatarText}>
                  {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                </Text>
              </View>
              <View style={styles.userInfoContainer}>
                <Text style={[styles.userName, { color: colors.onSurface }]}>
                  {selectedUser.firstName} {selectedUser.lastName}
                </Text>
                <View style={styles.userDetailRow}>
                  <Mail size={14} color={colors.onSurfaceVariant} />
                  <Text style={[styles.userDetail, { color: colors.onSurfaceVariant }]}>
                    {selectedUser.email}
                  </Text>
                </View>
                {selectedUser.phone && (
                  <View style={styles.userDetailRow}>
                    <Phone size={14} color={colors.onSurfaceVariant} />
                    <Text style={[styles.userDetail, { color: colors.onSurfaceVariant }]}>
                      {selectedUser.phone}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </GlassCard>

          <TouchableOpacity
            style={[styles.changeUserButton, { borderColor: colors.outline }]}
            onPress={() => {
              setSelectedUser(null);
              setShowSearchModal(true);
            }}
          >
            <Search size={16} color={colors.onSurface} />
            <Text style={[styles.changeUserButtonText, { color: colors.onSurface }]}>
              Cambia Proprietario
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.nextButton, { opacity: !selectedUser ? 0.5 : 1, marginTop: 16 }]}
        onPress={() => {
          if (!selectedUser) {
            Alert.alert('Attenzione', 'Devi selezionare un proprietario prima di continuare');
            return;
          }
          setStep('options');
        }}
        disabled={!selectedUser}
      >
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.nextButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.nextButtonText}>Avanti</Text>
          <ArrowRight size={20} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderOptionsStep = () => (
    <View>
      <View style={styles.stepHeader}>
        <View style={[styles.stepIcon, { backgroundColor: `${colors.primary}20` }]}>
          <Shield size={24} color={colors.primary} />
        </View>
        <Text style={[styles.stepTitle, { color: colors.onSurface }]}>
          Dati da Trasferire
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        <View style={styles.infoBox}>
          <Info size={18} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
            Seleziona quali dati trasferire al nuovo proprietario
          </Text>
        </View>

        <View style={styles.optionItem}>
          <View style={styles.optionLabel}>
            <CheckCircle
              size={20}
              color={transferOptions.maintenanceHistory ? colors.primary : colors.onSurfaceVariant}
            />
            <Text style={[styles.optionText, { color: colors.onSurface }]}>
              Storico Manutenzioni
            </Text>
          </View>
          <Switch
            value={transferOptions.maintenanceHistory}
            onValueChange={(val) =>
              setTransferOptions({ ...transferOptions, maintenanceHistory: val })
            }
            trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
            thumbColor="white"
          />
        </View>

        {transferOptions.maintenanceHistory && (
          <View style={[styles.optionItem, styles.subOption]}>
            <View style={styles.optionLabel}>
              <Text style={[styles.optionText, styles.subOptionText, { color: colors.onSurfaceVariant }]}>
                Includi costi e dettagli
              </Text>
            </View>
            <Switch
              value={transferOptions.maintenanceDetails}
              onValueChange={(val) =>
                setTransferOptions({ ...transferOptions, maintenanceDetails: val })
              }
              trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
              thumbColor="white"
            />
          </View>
        )}

        <View style={styles.optionItem}>
          <View style={styles.optionLabel}>
            <CheckCircle
              size={20}
              color={transferOptions.photos ? colors.primary : colors.onSurfaceVariant}
            />
            <Text style={[styles.optionText, { color: colors.onSurface }]}>
              Foto del Veicolo
            </Text>
          </View>
          <Switch
            value={transferOptions.photos}
            onValueChange={(val) =>
              setTransferOptions({ ...transferOptions, photos: val })
            }
            trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
            thumbColor="white"
          />
        </View>

        <View style={styles.optionItem}>
          <View style={styles.optionLabel}>
            <CheckCircle
              size={20}
              color={transferOptions.documents ? colors.primary : colors.onSurfaceVariant}
            />
            <Text style={[styles.optionText, { color: colors.onSurface }]}>
              Documenti
            </Text>
          </View>
          <Switch
            value={transferOptions.documents}
            onValueChange={(val) =>
              setTransferOptions({ ...transferOptions, documents: val })
            }
            trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
            thumbColor="white"
          />
        </View>

        <View style={styles.optionItem}>
          <View style={styles.optionLabel}>
            <CheckCircle
              size={20}
              color={transferOptions.reminders ? colors.primary : colors.onSurfaceVariant}
            />
            <Text style={[styles.optionText, { color: colors.onSurface }]}>
              Promemoria e Scadenze
            </Text>
          </View>
          <Switch
            value={transferOptions.reminders}
            onValueChange={(val) =>
              setTransferOptions({ ...transferOptions, reminders: val })
            }
            trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
            thumbColor="white"
          />
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.outline }]}
          onPress={() => setStep('buyer')}
        >
          <Text style={[styles.backButtonText, { color: colors.onSurface }]}>
            Indietro
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, { flex: 1 }]}
          onPress={() => setStep('confirm')}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.nextButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.nextButtonText}>Avanti</Text>
            <ArrowRight size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConfirmStep = () => (
    <View>
      <View style={styles.stepHeader}>
        <View style={[styles.stepIcon, { backgroundColor: `${colors.primary}20` }]}>
          <Key size={24} color={colors.primary} />
        </View>
        <Text style={[styles.stepTitle, { color: colors.onSurface }]}>
          Conferma Trasferimento
        </Text>
      </View>

      <View style={styles.summaryContainer}>
        <GlassCard style={styles.summaryCard}>
          <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
            Veicolo
          </Text>
          <Text style={[styles.summaryValue, { color: colors.onSurface }]}>
            {vehicleName}
          </Text>
        </GlassCard>

        <GlassCard style={styles.summaryCard}>
          <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
            Nuovo Proprietario
          </Text>
          <Text style={[styles.summaryValue, { color: colors.onSurface }]}>
            {buyerName}
          </Text>
          <Text style={[styles.summaryEmail, { color: colors.onSurfaceVariant }]}>
            {buyerEmail}
          </Text>
        </GlassCard>

        <View style={styles.pinContainer}>
          <View style={styles.inputRow}>
            <Key size={20} color={colors.primary} />
            <TextInput
              style={[styles.input, { color: colors.onSurface }]}
              placeholder="PIN di sicurezza (min. 4 cifre)"
              placeholderTextColor={colors.onSurfaceVariant}
              value={transferPin}
              onChangeText={setTransferPin}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
              autoComplete="off"
              textContentType="none"
            />
          </View>
          <Text style={[styles.pinHint, { color: colors.onSurfaceVariant }]}>
            Il nuovo proprietario dovrà inserire questo PIN per confermare il trasferimento
          </Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.outline }]}
          onPress={() => setStep('options')}
          disabled={loading}
        >
          <Text style={[styles.backButtonText, { color: colors.onSurface }]}>
            Indietro
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            { flex: 1, opacity: !transferPin || loading ? 0.5 : 1 },
          ]}
          onPress={handleTransfer}
          disabled={!transferPin || loading}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.confirmButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <CheckCircle size={20} color="white" />
                <Text style={styles.confirmButtonText}>Conferma Trasferimento</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlayTouchable}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContainer}>
                <LinearGradient
                  colors={isDark ? ['#1a1a1a', '#0a0a0a'] : ['#f8f9fa', '#e9ecef']}
                  style={styles.modalContent}
                >
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={[styles.title, { color: colors.onSurface }]}>
                    Trasferisci Proprietà
                  </Text>
                  <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
                    {vehicleName}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleClose} disabled={loading}>
                  <X size={24} color={colors.onSurface} />
                </TouchableOpacity>
              </View>

              {/* Progress Indicator */}
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor:
                        step === 'buyer' ? colors.primary : colors.surfaceVariant,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.progressLine,
                    {
                      backgroundColor:
                        step === 'options' || step === 'confirm'
                          ? colors.primary
                          : colors.surfaceVariant,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor:
                        step === 'options' || step === 'confirm'
                          ? colors.primary
                          : colors.surfaceVariant,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.progressLine,
                    {
                      backgroundColor:
                        step === 'confirm' ? colors.primary : colors.surfaceVariant,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor:
                        step === 'confirm' ? colors.primary : colors.surfaceVariant,
                    },
                  ]}
                />
              </View>

              {/* Content */}
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {step === 'buyer' && renderBuyerStep()}
                {step === 'options' && renderOptionsStep()}
                {step === 'confirm' && renderConfirmStep()}
              </ScrollView>
            </LinearGradient>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* User Search Modal */}
      <UserSearchModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectUser={handleSelectUser}
        darkMode={isDark}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 600,
    maxHeight: '80%',
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
        elevation: 20,
      },
    }),
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  inputContainer: {
    gap: 16,
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    marginBottom: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  subOption: {
    paddingLeft: 36,
    paddingVertical: 8,
  },
  optionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  subOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryContainer: {
    gap: 16,
    marginBottom: 24,
  },
  summaryCard: {
    padding: 16,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryEmail: {
    fontSize: 14,
  },
  pinContainer: {
    gap: 8,
  },
  pinHint: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  confirmButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  searchButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 16,
  },
  searchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyStateCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    minHeight: 180,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 250,
  },
  selectedUserCard: {
    padding: 20,
    marginBottom: 16,
  },
  selectedUserContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  userInfoContainer: {
    flex: 1,
    gap: 6,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  userDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userDetail: {
    fontSize: 14,
    fontWeight: '500',
  },
  changeUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
  },
  changeUserButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default VehicleTransferModal;

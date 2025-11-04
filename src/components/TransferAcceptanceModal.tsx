// src/components/TransferAcceptanceModal.tsx
// Modale per accettare/rifiutare trasferimenti veicolo con PIN

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
} from 'react-native';
import {
  X,
  Key,
  CheckCircle,
  XCircle,
  Car,
  User,
  Calendar,
  Shield,
  AlertCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppThemeManager } from '../hooks/useTheme';
import { TransferService } from '../services/TransferService';
import { VehicleTransfer } from '../types/database.types';

interface TransferAcceptanceModalProps {
  visible: boolean;
  onClose: () => void;
  transfer: VehicleTransfer | null;
  onTransferProcessed?: () => void;
}

const TransferAcceptanceModal: React.FC<TransferAcceptanceModalProps> = ({
  visible,
  onClose,
  transfer,
  onTransferProcessed,
}) => {
  const { colors, isDark } = useAppThemeManager();
  const transferService = TransferService.getInstance();

  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAccept = async () => {
    if (!transfer) return;

    if (!pin || pin.length < 4) {
      setError('Inserisci un PIN di almeno 4 cifre');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const result = await transferService.verifyTransferPin(transfer.id, pin);

      if (result.success) {
        Alert.alert(
          'Trasferimento Completato',
          'Il veicolo è ora di tua proprietà! Troverai tutte le informazioni nella tua lista veicoli.',
          [
            {
              text: 'OK',
              onPress: () => {
                handleClose();
                onTransferProcessed?.();
              },
            },
          ]
        );
      } else {
        if (result.attemptsRemaining !== undefined) {
          setError(
            `PIN errato. Tentativi rimanenti: ${result.attemptsRemaining}`
          );
        } else {
          setError(
            'PIN errato o trasferimento non valido. Contatta il proprietario per verificare.'
          );
        }
      }
    } catch (error) {
      console.error('Error accepting transfer:', error);
      Alert.alert(
        'Errore',
        'Impossibile completare il trasferimento. Riprova più tardi.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!transfer) return;

    Alert.alert(
      'Rifiuta Trasferimento',
      'Sei sicuro di voler rifiutare questo trasferimento? Questa azione è irreversibile.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Rifiuta',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await transferService.cancelTransfer(transfer.id, 'cancelled');

              Alert.alert('Trasferimento Rifiutato', 'Il trasferimento è stato annullato.', [
                {
                  text: 'OK',
                  onPress: () => {
                    handleClose();
                    onTransferProcessed?.();
                  },
                },
              ]);
            } catch (error) {
              console.error('Error rejecting transfer:', error);
              Alert.alert('Errore', 'Impossibile rifiutare il trasferimento.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleClose = () => {
    if (!loading) {
      setPin('');
      setError('');
      onClose();
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (!transfer) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
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
                      Richiesta Trasferimento
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
                      Verifica i dettagli e inserisci il PIN
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleClose} disabled={loading}>
                    <X size={24} color={colors.onSurface} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Transfer Info */}
                  <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                      <Car size={20} color={colors.primary} />
                      <View style={styles.infoTextContainer}>
                        <Text style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>
                          Veicolo
                        </Text>
                        <Text style={[styles.infoValue, { color: colors.onSurface }]}>
                          ID: {transfer.vehicleId}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <User size={20} color={colors.primary} />
                      <View style={styles.infoTextContainer}>
                        <Text style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>
                          Da
                        </Text>
                        <Text style={[styles.infoValue, { color: colors.onSurface }]}>
                          {transfer.sellerName}
                        </Text>
                        <Text style={[styles.infoEmail, { color: colors.onSurfaceVariant }]}>
                          {transfer.sellerEmail}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <Calendar size={20} color={colors.primary} />
                      <View style={styles.infoTextContainer}>
                        <Text style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>
                          Scadenza
                        </Text>
                        <Text style={[styles.infoValue, { color: colors.onSurface }]}>
                          {formatDate(transfer.expiresAt)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <Shield size={20} color={colors.primary} />
                      <View style={styles.infoTextContainer}>
                        <Text style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>
                          Dati inclusi
                        </Text>
                        <View style={styles.transferDataContainer}>
                          {transfer.transferData.maintenanceHistory && (
                            <Text style={[styles.transferDataItem, { color: colors.onSurface }]}>
                              • Manutenzioni
                              {transfer.transferData.maintenanceDetails && ' (con dettagli)'}
                            </Text>
                          )}
                          {transfer.transferData.documents && (
                            <Text style={[styles.transferDataItem, { color: colors.onSurface }]}>
                              • Documenti
                            </Text>
                          )}
                          {transfer.transferData.photos && (
                            <Text style={[styles.transferDataItem, { color: colors.onSurface }]}>
                              • Foto
                            </Text>
                          )}
                          {transfer.transferData.reminders && (
                            <Text style={[styles.transferDataItem, { color: colors.onSurface }]}>
                              • Promemoria
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* PIN Input */}
                  <View style={styles.pinSection}>
                    <View style={styles.pinHeader}>
                      <Key size={20} color={colors.primary} />
                      <Text style={[styles.pinTitle, { color: colors.onSurface }]}>
                        PIN di Sicurezza
                      </Text>
                    </View>
                    <TextInput
                      style={[
                        styles.pinInput,
                        {
                          color: colors.onSurface,
                          backgroundColor: isDark
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(0,0,0,0.05)',
                          borderColor: error ? colors.error : colors.outline,
                        },
                      ]}
                      placeholder="Inserisci il PIN fornito dal proprietario"
                      placeholderTextColor={colors.onSurfaceVariant}
                      value={pin}
                      onChangeText={(text) => {
                        setPin(text);
                        setError('');
                      }}
                      keyboardType="numeric"
                      secureTextEntry
                      maxLength={6}
                      editable={!loading}
                      autoComplete="off"
                      textContentType="none"
                    />
                    {error && (
                      <View style={styles.errorContainer}>
                        <AlertCircle size={16} color={colors.error} />
                        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                      </View>
                    )}
                  </View>

                  {/* Attempts Info */}
                  <View
                    style={[
                      styles.attemptsInfo,
                      { backgroundColor: isDark ? 'rgba(255,152,0,0.1)' : 'rgba(255,152,0,0.1)' },
                    ]}
                  >
                    <AlertCircle size={18} color="#FF9800" />
                    <Text style={[styles.attemptsText, { color: colors.onSurface }]}>
                      Hai {transfer.maxPinAttempts - transfer.pinAttempts} tentativi rimanenti per
                      inserire il PIN corretto
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      style={[styles.rejectButton, { borderColor: colors.error }]}
                      onPress={handleReject}
                      disabled={loading}
                    >
                      <XCircle size={20} color={colors.error} />
                      <Text style={[styles.rejectButtonText, { color: colors.error }]}>
                        Rifiuta
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.acceptButton,
                        { opacity: !pin || loading ? 0.5 : 1 },
                      ]}
                      onPress={handleAccept}
                      disabled={!pin || loading}
                    >
                      <LinearGradient
                        colors={['#10b981', '#059669']}
                        style={styles.acceptButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        {loading ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <>
                            <CheckCircle size={20} color="white" />
                            <Text style={styles.acceptButtonText}>Accetta e Conferma</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </LinearGradient>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  infoSection: {
    gap: 20,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoEmail: {
    fontSize: 14,
  },
  transferDataContainer: {
    gap: 4,
    marginTop: 4,
  },
  transferDataItem: {
    fontSize: 14,
    lineHeight: 20,
  },
  pinSection: {
    marginBottom: 20,
  },
  pinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  pinTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  pinInput: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    textAlign: 'center',
    letterSpacing: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  attemptsInfo: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  attemptsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  acceptButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default TransferAcceptanceModal;

// =====================================================
// 5. PASSAGGIO PROPRIETÀ - OwnershipTransferScreen.tsx
// =====================================================
// src/screens/user/OwnershipTransferScreen.tsx

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Stepper,
  Checkbox,
  Surface,
  IconButton,
  Divider,
  ProgressBar
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  UserPlus,
  Shield,
  FileText,
  CheckCircle,
  AlertCircle,
  Lock,
  ArrowRight,
  Mail,
  Phone,
  User,
  Car,
  Eye,
  EyeOff
} from 'lucide-react-native';
import { SecurityService } from '../../services/SecurityService';
import { useAppThemeManager } from '../../hooks/useTheme';

interface TransferData {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  transferPin: string;
  selectedData: {
    basicInfo: boolean;
    maintenanceHistory: boolean;
    documents: boolean;
    photos: boolean;
  };
  agreedTerms: boolean;
}

export default function OwnershipTransferScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useAppThemeManager();
  const security = SecurityService.getInstance();
  
  const { carId } = route.params as { carId: string };
  
  const [currentStep, setCurrentStep] = useState(0);
  const [showPin, setShowPin] = useState(false);
  const [transferData, setTransferData] = useState<TransferData>({
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
    transferPin: '',
    selectedData: {
      basicInfo: true,
      maintenanceHistory: false,
      documents: false,
      photos: true
    },
    agreedTerms: false
  });

  const steps = [
    { title: 'Dati Acquirente', icon: <UserPlus size={20} /> },
    { title: 'Selezione Informazioni', icon: <FileText size={20} /> },
    { title: 'Sicurezza', icon: <Shield size={20} /> },
    { title: 'Conferma', icon: <CheckCircle size={20} /> }
  ];

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        if (!transferData.buyerName || !transferData.buyerEmail) {
          Alert.alert('Errore', 'Inserisci nome ed email dell\'acquirente');
          return false;
        }
        return true;
      
      case 1:
        const hasSelectedData = Object.values(transferData.selectedData).some(v => v);
        if (!hasSelectedData) {
          Alert.alert('Errore', 'Seleziona almeno un\'informazione da trasferire');
          return false;
        }
        return true;
      
      case 2:
        if (!transferData.transferPin || transferData.transferPin.length < 6) {
          Alert.alert('Errore', 'Il PIN deve contenere almeno 6 caratteri');
          return false;
        }
        return true;
      
      case 3:
        if (!transferData.agreedTerms) {
          Alert.alert('Errore', 'Devi accettare i termini e condizioni');
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        completeTransfer();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTransfer = async () => {
    try {
      // Log trasferimento
      await security.logDataAccess(
        'currentUserId',
        carId,
        `transfer_to_${transferData.buyerEmail}`
      );
      
      // Simula trasferimento
      Alert.alert(
        '✅ Trasferimento Completato',
        `Lo storico del veicolo è stato trasferito a ${transferData.buyerName}. L'acquirente riceverà una notifica con il PIN per accedere ai dati.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Errore', 'Impossibile completare il trasferimento');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card style={styles.stepCard}>
            <Card.Title title="Inserisci i dati dell'acquirente" />
            <Card.Content>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <User size={20} color={colors.primary} />
                </View>
                <TextInput
                  style={[styles.input, { color: colors.onSurface }]}
                  placeholder="Nome e Cognome"
                  value={transferData.buyerName}
                  onChangeText={(text) => 
                    setTransferData({...transferData, buyerName: text})
                  }
                  placeholderTextColor={colors.onSurfaceVariant}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Mail size={20} color={colors.primary} />
                </View>
                <TextInput
                  style={[styles.input, { color: colors.onSurface }]}
                  placeholder="Email"
                  value={transferData.buyerEmail}
                  onChangeText={(text) => 
                    setTransferData({...transferData, buyerEmail: text})
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={colors.onSurfaceVariant}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Phone size={20} color={colors.primary} />
                </View>
                <TextInput
                  style={[styles.input, { color: colors.onSurface }]}
                  placeholder="Telefono (opzionale)"
                  value={transferData.buyerPhone}
                  onChangeText={(text) => 
                    setTransferData({...transferData, buyerPhone: text})
                  }
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.onSurfaceVariant}
                />
              </View>

              <Surface style={styles.infoBox} elevation={1}>
                <AlertCircle size={16} color="#2196F3" />
                <Text style={styles.infoText}>
                  L'acquirente riceverà una notifica via email con le 
                  istruzioni per accedere ai dati del veicolo.
                </Text>
              </Surface>
            </Card.Content>
          </Card>
        );

      case 1:
        return (
          <Card style={styles.stepCard}>
            <Card.Title title="Seleziona le informazioni da trasferire" />
            <Card.Content>
              <Text style={styles.sectionDescription}>
                Scegli quali informazioni vuoi condividere con l'acquirente. 
                Le informazioni non selezionate rimarranno private.
              </Text>

              <DataOption
                title="Informazioni Base"
                description="Marca, modello, anno, chilometraggio"
                value={transferData.selectedData.basicInfo}
                onToggle={() => setTransferData({
                  ...transferData,
                  selectedData: {
                    ...transferData.selectedData,
                    basicInfo: !transferData.selectedData.basicInfo
                  }
                })}
                required
              />

              <DataOption
                title="Storico Manutenzione"
                description="Tutti gli interventi effettuati (senza costi)"
                value={transferData.selectedData.maintenanceHistory}
                onToggle={() => setTransferData({
                  ...transferData,
                  selectedData: {
                    ...transferData.selectedData,
                    maintenanceHistory: !transferData.selectedData.maintenanceHistory
                  }
                })}
              />

              <DataOption
                title="Documenti"
                description="Libretto, tagliandi, fatture"
                value={transferData.selectedData.documents}
                onToggle={() => setTransferData({
                  ...transferData,
                  selectedData: {
                    ...transferData.selectedData,
                    documents: !transferData.selectedData.documents
                  }
                })}
              />

              <DataOption
                title="Galleria Foto"
                description="Immagini del veicolo"
                value={transferData.selectedData.photos}
                onToggle={() => setTransferData({
                  ...transferData,
                  selectedData: {
                    ...transferData.selectedData,
                    photos: !transferData.selectedData.photos
                  }
                })}
              />

              <Surface style={styles.warningBox} elevation={1}>
                <Lock size={16} color="#FF6B35" />
                <Text style={styles.warningText}>
                  I dati trasferiti rimarranno comunque protetti e non 
                  potranno essere esportati dall'app.
                </Text>
              </Surface>
            </Card.Content>
          </Card>
        );

      case 2:
        return (
          <Card style={styles.stepCard}>
            <Card.Title title="Imposta PIN di sicurezza" />
            <Card.Content>
              <Text style={styles.sectionDescription}>
                Crea un PIN che l'acquirente dovrà inserire per accedere 
                ai dati del veicolo. Comunicaglielo in modo sicuro.
              </Text>

              <View style={styles.pinInputContainer}>
                <TextInput
                  style={[styles.pinInput, { color: colors.onSurface }]}
                  placeholder="Inserisci PIN (min. 6 caratteri)"
                  value={transferData.transferPin}
                  onChangeText={(text) => 
                    setTransferData({...transferData, transferPin: text})
                  }
                  secureTextEntry={!showPin}
                  maxLength={10}
                  placeholderTextColor={colors.onSurfaceVariant}
                />
                <IconButton
                  icon={() => showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                  onPress={() => setShowPin(!showPin)}
                />
              </View>

              <View style={styles.pinStrength}>
                <Text style={styles.pinStrengthLabel}>Sicurezza PIN:</Text>
                <ProgressBar
                  progress={Math.min(transferData.transferPin.length / 10, 1)}
                  color={
                    transferData.transferPin.length < 6 ? '#FF3B30' :
                    transferData.transferPin.length < 8 ? '#FF9500' : '#34C759'
                  }
                  style={styles.pinStrengthBar}
                />
              </View>

              <Surface style={styles.securityTips} elevation={1}>
                <Text style={styles.securityTipsTitle}>
                  Suggerimenti di sicurezza:
                </Text>
                <Text style={styles.securityTip}>
                  • Usa almeno 6 caratteri alfanumerici
                </Text>
                <Text style={styles.securityTip}>
                  • Non condividere il PIN pubblicamente
                </Text>
                <Text style={styles.securityTip}>
                  • Comunica il PIN solo all'acquirente verificato
                </Text>
              </Surface>
            </Card.Content>
          </Card>
        );

      case 3:
        return (
          <Card style={styles.stepCard}>
            <Card.Title title="Riepilogo e Conferma" />
            <Card.Content>
              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>Acquirente:</Text>
                <Text style={styles.summaryValue}>{transferData.buyerName}</Text>
                <Text style={styles.summarySubvalue}>{transferData.buyerEmail}</Text>
              </View>

              <Divider style={styles.summaryDivider} />

              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>Dati da trasferire:</Text>
                {Object.entries(transferData.selectedData).map(([key, value]) => {
                  if (value) {
                    const labels = {
                      basicInfo: 'Informazioni base',
                      maintenanceHistory: 'Storico manutenzione',
                      documents: 'Documenti',
                      photos: 'Foto'
                    };
                    return (
                      <View key={key} style={styles.summaryItem}>
                        <CheckCircle size={16} color="#34C759" />
                        <Text style={styles.summaryItemText}>
                          {labels[key as keyof typeof labels]}
                        </Text>
                      </View>
                    );
                  }
                })}
              </View>

              <Divider style={styles.summaryDivider} />

              <TouchableOpacity
                style={styles.termsContainer}
                onPress={() => 
                  setTransferData({
                    ...transferData, 
                    agreedTerms: !transferData.agreedTerms
                  })
                }
              >
                <Checkbox
                  status={transferData.agreedTerms ? 'checked' : 'unchecked'}
                  color={colors.primary}
                />
                <Text style={styles.termsText}>
                  Confermo di voler trasferire i dati selezionati all'acquirente. 
                  Questa azione è irreversibile.
                </Text>
              </TouchableOpacity>

              <Surface style={styles.finalWarning} elevation={2}>
                <AlertCircle size={20} color="#FF6B35" />
                <Text style={styles.finalWarningText}>
                  Una volta completato il trasferimento, perderai l'accesso 
                  a questi dati. Assicurati di aver salvato tutto ciò che 
                  ti serve.
                </Text>
              </Surface>
            </Card.Content>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {/* Progress Stepper */}
        <View style={styles.stepperContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <TouchableOpacity
                style={[
                  styles.stepCircle,
                  index === currentStep && styles.stepCircleActive,
                  index < currentStep && styles.stepCircleCompleted
                ]}
                onPress={() => index < currentStep && setCurrentStep(index)}
                disabled={index >= currentStep}
              >
                {index < currentStep ? (
                  <CheckCircle size={20} color="#fff" />
                ) : (
                  step.icon
                )}
              </TouchableOpacity>
              <Text style={[
                styles.stepLabel,
                index === currentStep && styles.stepLabelActive
              ]}>
                {step.title}
              </Text>
              {index < steps.length - 1 && (
                <View style={[
                  styles.stepLine,
                  index < currentStep && styles.stepLineCompleted
                ]} />
              )}
            </View>
          ))}
        </View>

        {/* Step Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigation}>
          <Button
            mode="outlined"
            onPress={prevStep}
            disabled={currentStep === 0}
            style={styles.navButton}
          >
            Indietro
          </Button>
          
          <Button
            mode="contained"
            onPress={nextStep}
            style={[styles.navButton, { backgroundColor: colors.primary }]}
            icon={() => currentStep === steps.length - 1 ? 
              <CheckCircle size={20} color="#fff" /> : 
              <ArrowRight size={20} color="#fff" />
            }
          >
            {currentStep === steps.length - 1 ? 'Completa' : 'Avanti'}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Componente DataOption
const DataOption = ({ title, description, value, onToggle, required }: any) => (
  <TouchableOpacity
    style={styles.dataOption}
    onPress={onToggle}
    disabled={required}
  >
    <View style={styles.dataOptionInfo}>
      <Text style={styles.dataOptionTitle}>{title}</Text>
      <Text style={styles.dataOptionDescription}>{description}</Text>
      {required && (
        <Text style={styles.dataOptionRequired}>Obbligatorio</Text>
      )}
    </View>
    <Checkbox
      status={value ? 'checked' : 'unchecked'}
      disabled={required}
    />
  </TouchableOpacity>
);


// =====================================================
// STYLES - Stili per tutte le schermate
// =====================================================

const styles = StyleSheet.create({
  // Stili comuni
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  
  // CarProfileScreen styles
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  privacyBadgeText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '600',
  },
  
  section: {
    margin: 16,
    borderRadius: 12,
  },
  imageGallery: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  imageContainer: {
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  carImage: {
    width: 120,
    height: 90,
    backgroundColor: '#f0f0f0',
  },
  addImageButton: {
    width: 120,
    height: 90,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  
  // Info Grid
  infoGrid: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  secureText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  
  divider: {
    marginVertical: 16,
  },
  
  specs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  specLabel: {
    fontSize: 12,
    color: '#666',
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  
  optionalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionalChip: {
    backgroundColor: '#e3f2fd',
  },
  optionalChipText: {
    fontSize: 12,
  },
  
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'column',
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
  },
  
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '600',
  },
  
  quickActions: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
  },
  
  // Modal styles
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  privacyOptions: {
    gap: 16,
  },
  privacyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  privacyOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privacyOptionLabel: {
    marginLeft: 12,
    fontSize: 16,
  },
  privacyToggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    padding: 2,
  },
  privacyToggleActive: {
    backgroundColor: '#4CAF50',
  },
  privacyToggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
  },
  privacyToggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  
  // MaintenanceHistoryScreen styles
  securityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  
  searchBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginRight: 8,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  
  timeline: {
    paddingHorizontal: 16,
  },
  timelineLine: {
    position: 'absolute',
    left: 35,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#e0e0e0',
  },
  
  recordCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  recordHeader: {
    flexDirection: 'row',
    padding: 16,
  },
  typeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  recordMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  recordActions: {
    alignItems: 'center',
  },
  warrantyBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 10,
  },
  
  recordDetails: {
    padding: 16,
    paddingTop: 0,
  },
  detailsDivider: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  secureValue: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  
  partsSection: {
    marginTop: 12,
  },
  partsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  partItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  partBullet: {
    marginRight: 8,
    color: '#666',
  },
  partText: {
    fontSize: 14,
    flex: 1,
  },
  
  notesSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  notesSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  
  nextServiceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
  },
  nextServiceText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF6B35',
  },
  
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  
  // PrivacySettingsScreen styles
  infoHeader: {
    alignItems: 'center',
    padding: 20,
    margin: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  sectionDivider: {
    marginVertical: 16,
  },
  
  privacyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  privacyItemDisabled: {
    opacity: 0.5,
  },
  privacyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privacyItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  privacyItemIconWarning: {
    backgroundColor: '#fff3e0',
  },
  privacyItemText: {
    flex: 1,
  },
  privacyItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  privacyItemTitleDisabled: {
    color: '#999',
  },
  privacyItemDescription: {
    fontSize: 13,
    color: '#666',
  },
  privacyItemDescriptionDisabled: {
    color: '#ccc',
  },
  
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    backgroundColor: '#fff3e0',
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#FF6B35',
    lineHeight: 18,
  },
  
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  
  // OwnershipTransferScreen styles
  keyboardAvoid: {
    flex: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    borderColor: '#2196F3',
    backgroundColor: '#2196F3',
  },
  stepCircleCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  stepLabel: {
    fontSize: 10,
    marginTop: 4,
    color: '#666',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  stepLine: {
    position: 'absolute',
    top: 20,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#e0e0e0',
    zIndex: -1,
  },
  stepLineCompleted: {
    backgroundColor: '#4CAF50',
  },
  
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stepCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#e3f2fd',
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
  },
  
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  
  dataOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dataOptionInfo: {
    flex: 1,
  },
  dataOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dataOptionDescription: {
    fontSize: 13,
    color: '#666',
  },
  dataOptionRequired: {
    fontSize: 11,
    color: '#2196F3',
    marginTop: 2,
  },
  
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff3e0',
    marginTop: 16,
  },
  
  pinInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  pinInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 18,
    letterSpacing: 2,
  },
  
  pinStrength: {
    marginTop: 16,
  },
  pinStrengthLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  pinStrengthBar: {
    height: 4,
    borderRadius: 2,
  },
  
  securityTips: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginTop: 20,
  },
  securityTipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  securityTip: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  
  summarySection: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  summarySubvalue: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  summaryDivider: {
    marginVertical: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryItemText: {
    marginLeft: 8,
    fontSize: 14,
  },
  
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  termsText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  
  finalWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#ffebee',
  },
  finalWarningText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#c62828',
    lineHeight: 18,
  },
  
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    flex: 0.48,
  },
});
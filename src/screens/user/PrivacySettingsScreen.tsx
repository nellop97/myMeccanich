// =====================================================
// 4. GESTIONE PRIVACY - PrivacySettingsScreen.tsx
// =====================================================
// src/screens/user/PrivacySettingsScreen.tsx

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import {
  Text,
  Card,
  Switch,
  List,
  Divider,
  Button,
  Surface,
  IconButton
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Info,
  DollarSign,
  FileText,
  Wrench,
  Car,
  Users,
  AlertTriangle
} from 'lucide-react-native';
import { useAppThemeManager } from '../../hooks/useTheme';

interface PrivacySettings {
  showPersonalInfo: boolean;
  showMileage: boolean;
  showMaintenanceHistory: boolean;
  showMaintenanceDetails: boolean;
  showCosts: boolean;
  showMechanics: boolean;
  showDocuments: boolean;
  showPhotos: boolean;
  allowDataTransfer: boolean;
  requirePinForTransfer: boolean;
}

export default function PrivacySettingsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useAppThemeManager();
  
  const { carId } = route.params as { carId: string };
  
  const [settings, setSettings] = useState<PrivacySettings>({
    showPersonalInfo: true,
    showMileage: true,
    showMaintenanceHistory: true,
    showMaintenanceDetails: false,
    showCosts: false,
    showMechanics: false,
    showDocuments: false,
    showPhotos: true,
    allowDataTransfer: false,
    requirePinForTransfer: true,
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const toggleSetting = (key: keyof PrivacySettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setHasUnsavedChanges(true);
  };

  const saveSettings = () => {
    // Salva impostazioni nel database
    Alert.alert(
      'Impostazioni Salvate',
      'Le tue preferenze di privacy sono state aggiornate.',
      [{ text: 'OK', onPress: () => setHasUnsavedChanges(false) }]
    );
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Ripristina Impostazioni',
      'Vuoi ripristinare le impostazioni di privacy predefinite?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Ripristina',
          style: 'destructive',
          onPress: () => {
            setSettings({
              showPersonalInfo: true,
              showMileage: true,
              showMaintenanceHistory: true,
              showMaintenanceDetails: false,
              showCosts: false,
              showMechanics: false,
              showDocuments: false,
              showPhotos: true,
              allowDataTransfer: false,
              requirePinForTransfer: true,
            });
            setHasUnsavedChanges(true);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header informativo */}
        <Surface style={styles.infoHeader} elevation={1}>
          <Shield size={32} color={colors.primary} />
          <Text style={styles.infoTitle}>
            Controllo Privacy e Visibilità
          </Text>
          <Text style={styles.infoDescription}>
            Gestisci quali informazioni del tuo veicolo sono visibili durante 
            la vendita o il trasferimento. Le informazioni nascoste rimarranno 
            private e non saranno mai esportabili.
          </Text>
        </Surface>

        {/* Informazioni Base */}
        <Card style={[styles.section, { backgroundColor: colors.surface }]}>
          <Card.Title
            title="Informazioni Base"
            left={() => <Car size={24} color={colors.primary} />}
          />
          <Card.Content>
            <PrivacyItem
              title="Dati personali proprietario"
              description="Nome, contatti e indirizzo"
              value={settings.showPersonalInfo}
              onToggle={() => toggleSetting('showPersonalInfo')}
              icon={<Users size={20} />}
            />
            
            <PrivacyItem
              title="Chilometraggio"
              description="Km attuali del veicolo"
              value={settings.showMileage}
              onToggle={() => toggleSetting('showMileage')}
              icon={<Gauge size={20} />}
            />
            
            <PrivacyItem
              title="Foto del veicolo"
              description="Galleria immagini"
              value={settings.showPhotos}
              onToggle={() => toggleSetting('showPhotos')}
              icon={<Camera size={20} />}
            />
          </Card.Content>
        </Card>

        {/* Storico Manutenzione */}
        <Card style={[styles.section, { backgroundColor: colors.surface }]}>
          <Card.Title
            title="Storico Manutenzione"
            left={() => <Wrench size={24} color={colors.primary} />}
          />
          <Card.Content>
            <PrivacyItem
              title="Visualizza storico"
              description="Mostra che le manutenzioni sono state fatte"
              value={settings.showMaintenanceHistory}
              onToggle={() => toggleSetting('showMaintenanceHistory')}
              icon={<Clock size={20} />}
            />
            
            <PrivacyItem
              title="Dettagli interventi"
              description="Descrizione completa degli interventi"
              value={settings.showMaintenanceDetails}
              onToggle={() => toggleSetting('showMaintenanceDetails')}
              icon={<FileText size={20} />}
              disabled={!settings.showMaintenanceHistory}
            />
            
            <PrivacyItem
              title="Costi manutenzione"
              description="Importi spesi per ogni intervento"
              value={settings.showCosts}
              onToggle={() => toggleSetting('showCosts')}
              icon={<DollarSign size={20} />}
              disabled={!settings.showMaintenanceHistory}
            />
            
            <PrivacyItem
              title="Informazioni meccanico"
              description="Nome officina e tecnico"
              value={settings.showMechanics}
              onToggle={() => toggleSetting('showMechanics')}
              icon={<Users size={20} />}
              disabled={!settings.showMaintenanceHistory}
            />
          </Card.Content>
        </Card>

        {/* Documenti e Trasferimento */}
        <Card style={[styles.section, { backgroundColor: colors.surface }]}>
          <Card.Title
            title="Documenti e Trasferimento"
            left={() => <FileText size={24} color={colors.primary} />}
          />
          <Card.Content>
            <PrivacyItem
              title="Documenti veicolo"
              description="Libretto, assicurazione, bollo"
              value={settings.showDocuments}
              onToggle={() => toggleSetting('showDocuments')}
              icon={<FileText size={20} />}
            />
            
            <Divider style={styles.sectionDivider} />
            
            <PrivacyItem
              title="Consenti trasferimento dati"
              description="Permetti il passaggio dello storico al nuovo proprietario"
              value={settings.allowDataTransfer}
              onToggle={() => toggleSetting('allowDataTransfer')}
              icon={<Unlock size={20} />}
              warning
            />
            
            <PrivacyItem
              title="Richiedi PIN per trasferimento"
              description="Protezione aggiuntiva per il passaggio di proprietà"
              value={settings.requirePinForTransfer}
              onToggle={() => toggleSetting('requirePinForTransfer')}
              icon={<Lock size={20} />}
              disabled={!settings.allowDataTransfer}
            />
          </Card.Content>
        </Card>

        {/* Avviso sicurezza */}
        <Surface style={styles.warningBanner} elevation={1}>
          <AlertTriangle size={20} color="#FF6B35" />
          <Text style={styles.warningText}>
            Le informazioni nascoste non potranno mai essere esportate o 
            condivise esternamente all'app, garantendo la massima privacy.
          </Text>
        </Surface>

        {/* Azioni */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={resetToDefaults}
            style={styles.actionButton}
          >
            Ripristina Default
          </Button>
          
          <Button
            mode="contained"
            onPress={saveSettings}
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            disabled={!hasUnsavedChanges}
          >
            Salva Impostazioni
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Componente PrivacyItem
const PrivacyItem = ({ 
  title, 
  description, 
  value, 
  onToggle, 
  icon,
  disabled = false,
  warning = false 
}: any) => {
  const { colors } = useAppThemeManager();
  
  return (
    <TouchableOpacity
      style={[
        styles.privacyItem,
        disabled && styles.privacyItemDisabled
      ]}
      onPress={() => !disabled && onToggle()}
      activeOpacity={disabled ? 1 : 0.7}
    >
      <View style={styles.privacyItemLeft}>
        <View style={[
          styles.privacyItemIcon,
          warning && styles.privacyItemIconWarning
        ]}>
          {icon}
        </View>
        <View style={styles.privacyItemText}>
          <Text style={[
            styles.privacyItemTitle,
            disabled && styles.privacyItemTitleDisabled
          ]}>
            {title}
          </Text>
          <Text style={[
            styles.privacyItemDescription,
            disabled && styles.privacyItemDescriptionDisabled
          ]}>
            {description}
          </Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        color={warning ? '#FF6B35' : colors.primary}
      />
    </TouchableOpacity>
  );
};


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
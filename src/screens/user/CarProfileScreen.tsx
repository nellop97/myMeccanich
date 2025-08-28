import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  StatusBar,
  Dimensions,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  IconButton,
  FAB,
  Divider,
  Surface,
  Button,
  Avatar,
  Badge,
  ProgressBar,
  Portal,
  Modal
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Car,
  Calendar,
  MapPin,
  Gauge,
  Settings,
  Shield,
  Eye,
  EyeOff,
  Camera,
  Edit,
  Share,
  Lock,
  Info,
  ChevronRight,
  CheckCircle
} from 'lucide-react-native';
import { ImagePicker } from '../../components/ImagePicker';
import { SecurityService } from '../../security/SecurityService';
import { VehicleService } from '../../services/VehicleService';
import { MaintenanceService } from '../../services/MaintenanceService';
import { useAppThemeManager } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { Vehicle, PrivacySettings } from '../../types/database.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CarProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useAppThemeManager();
  const { user } = useAuth();
  const security = SecurityService.getInstance();
  const vehicleService = VehicleService.getInstance();
  const maintenanceService = MaintenanceService.getInstance();
  
  const { carId } = route.params as { carId: string };
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [maintenanceStats, setMaintenanceStats] = useState<any>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Attiva protezione screenshot
    security.preventScreenCapture(true);
    
    // Carica dati veicolo
    loadVehicleData();

    // Subscribe to real-time updates
    const unsubscribe = vehicleService.subscribeToVehicle(carId, (updatedVehicle) => {
      if (updatedVehicle) {
        setVehicle(updatedVehicle);
      }
    });

    return () => {
      // Cleanup
      security.preventScreenCapture(false);
      unsubscribe();
    };
  }, [carId]);

  const loadVehicleData = async () => {
    try {
      setLoading(true);

      // Carica veicolo
      const vehicleData = await vehicleService.getVehicle(carId);
      if (!vehicleData) {
        Alert.alert('Errore', 'Veicolo non trovato');
        navigation.goBack();
        return;
      }

      setVehicle(vehicleData);

      // Log accesso
      if (user?.uid) {
        await security.logDataAccess(user.uid, carId, 'view_profile');
      }

      // Carica statistiche manutenzione
      const stats = await maintenanceService.getMaintenanceStats(carId);
      setMaintenanceStats(stats);

    } catch (error) {
      console.error('Error loading vehicle:', error);
      Alert.alert('Errore', 'Impossibile caricare i dati del veicolo');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultiple: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        const isMain = vehicle?.images.length === 0;
        const uploadedImage = await vehicleService.uploadVehicleImage(
          carId,
          result.assets[0].uri,
          isMain
        );
        
        Alert.alert('Successo', 'Immagine caricata con successo');
        await loadVehicleData(); // Ricarica dati
      } catch (error) {
        console.error('Error uploading image:', error);
        Alert.alert('Errore', 'Impossibile caricare l\'immagine');
      } finally {
        setUploading(false);
      }
    }
  };

  const togglePrivacySetting = async (key: keyof PrivacySettings) => {
    if (vehicle) {
      const newSettings = {
        ...vehicle.privacySettings,
        [key]: !vehicle.privacySettings[key]
      };

      try {
        await vehicleService.updatePrivacySettings(carId, newSettings);
        setVehicle({
          ...vehicle,
          privacySettings: newSettings
        });
      } catch (error) {
        console.error('Error updating privacy:', error);
        Alert.alert('Errore', 'Impossibile aggiornare le impostazioni');
      }
    }
  };

  const handleEditVehicle = () => {
    navigation.navigate('EditVehicle', { vehicleId: carId });
  };

  if (loading || !vehicle) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.onBackground }}>
          Caricamento veicolo...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.dark ? 'light-content' : 'dark-content'} />
      
      {/* Header con immagine hero */}
      <LinearGradient
        colors={['#1e3c72', '#2a5298']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {vehicle.make} {vehicle.model}
            </Text>
            <Text style={styles.headerSubtitle}>
              {vehicle.year} • {vehicle.licensePlate}
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <IconButton
              icon={() => <Shield size={24} color="#fff" />}
              onPress={() => setShowPrivacyModal(true)}
            />
            <IconButton
              icon={() => <Edit size={24} color="#fff" />}
              onPress={handleEditVehicle}
            />
          </View>
        </View>

        {/* Badge Privacy */}
        <View style={styles.privacyBadge}>
          <Lock size={16} color="#fff" />
          <Text style={styles.privacyBadgeText}>
            Dati protetti - Non esportabili
          </Text>
        </View>

        {/* Badge Trasferimento Pendente */}
        {vehicle.transferPending && (
          <View style={[styles.privacyBadge, { backgroundColor: '#FF6B35' }]}>
            <Info size={16} color="#fff" />
            <Text style={styles.privacyBadgeText}>
              Trasferimento in corso a {vehicle.transferToEmail}
            </Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Galleria Immagini */}
        <Card style={[styles.section, { backgroundColor: colors.surface }]}>
          <Card.Title title="Foto del veicolo" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.imageGallery}>
              {vehicle.images.map((img, index) => (
                <TouchableOpacity key={img.id} style={styles.imageContainer}>
                  <Image source={{ uri: img.url }} style={styles.carImage} />
                  {img.isMain && (
                    <Badge style={styles.mainImageBadge}>Principale</Badge>
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                onPress={pickImage} 
                style={styles.addImageButton}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <Camera size={32} color={colors.onSurfaceVariant} />
                    <Text style={{ color: colors.onSurfaceVariant }}>Aggiungi</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Card>

        {/* Informazioni Generali */}
        <Card style={[styles.section, { backgroundColor: colors.surface }]}>
          <Card.Title 
            title="Informazioni Generali"
            right={() => (
              <View style={styles.verifiedBadge}>
                <CheckCircle size={16} color="#4CAF50" />
                <Text style={styles.verifiedText}>Verificato</Text>
              </View>
            )}
          />
          <Card.Content>
            <View style={styles.infoGrid}>
              <InfoItem
                icon={<Car size={20} />}
                label="Telaio (VIN)"
                value={vehicle.privacySettings.showDocuments ? vehicle.vin : '••••••••••'}
                secure={!vehicle.privacySettings.showDocuments}
              />
              <InfoItem
                icon={<Gauge size={20} />}
                label="Chilometraggio"
                value={vehicle.privacySettings.showMileage ? 
                  `${vehicle.mileage.toLocaleString()} km` : '••••••'}
                secure={!vehicle.privacySettings.showMileage}
              />
              <InfoItem
                icon={<Calendar size={20} />}
                label="Ultima manutenzione"
                value={vehicle.privacySettings.showMaintenance && vehicle.lastMaintenanceDate ?
                  new Date(vehicle.lastMaintenanceDate).toLocaleDateString() : '••••••'}
                secure={!vehicle.privacySettings.showMaintenance}
              />
            </View>

            <Divider style={styles.divider} />

            {/* Specifiche */}
            <View style={styles.specs}>
              <SpecChip label="Carburante" value={vehicle.fuel} />
              <SpecChip label="Cambio" value={vehicle.transmission} />
              <SpecChip label="Colore" value={vehicle.color} />
              {vehicle.engineSize && (
                <SpecChip label="Cilindrata" value={`${vehicle.engineSize}cc`} />
              )}
              {vehicle.power && (
                <SpecChip label="Potenza" value={`${vehicle.power} CV`} />
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Optional */}
        {vehicle.optionals.length > 0 && (
          <Card style={[styles.section, { backgroundColor: colors.surface }]}>
            <Card.Title title="Dotazioni e Optional" />
            <Card.Content>
              <View style={styles.optionalGrid}>
                {vehicle.optionals.map((optional, index) => (
                  <Chip
                    key={index}
                    style={styles.optionalChip}
                    textStyle={styles.optionalChipText}
                  >
                    {optional}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Statistiche */}
        <Card style={[styles.section, { backgroundColor: colors.surface }]}>
          <Card.Title title="Riepilogo Attività" />
          <Card.Content>
            <View style={styles.statsGrid}>
              <StatCard
                title="Manutenzioni"
                value={vehicle.maintenanceCount.toString()}
                icon={<Settings size={24} />}
                color="#2196F3"
                onPress={() => navigation.navigate('MaintenanceHistory', { carId })}
              />
              <StatCard
                title="Documenti"
                value={vehicle.documentsCount.toString()}
                icon={<Info size={24} />}
                color="#4CAF50"
                locked={!vehicle.privacySettings.showDocuments}
              />
            </View>
            
            {maintenanceStats && (
              <View style={styles.maintenancePreview}>
                <Divider style={{ marginVertical: 12 }} />
                <Text style={styles.statsTitle}>Prossima Manutenzione</Text>
                {maintenanceStats.nextMaintenance ? (
                  <View style={styles.nextMaintenanceBanner}>
                    <Calendar size={20} color="#FF6B35" />
                    <Text style={styles.nextMaintenanceText}>
                      {new Date(maintenanceStats.nextMaintenance).toLocaleDateString()}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.noMaintenanceText}>
                    Nessuna manutenzione programmata
                  </Text>
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Azioni Rapide */}
        <View style={styles.quickActions}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('PrivacySettings', { carId })}
            icon="shield"
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
          >
            Gestisci Privacy
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('OwnershipTransfer', { carId })}
            icon="account-switch"
            style={styles.actionButton}
            disabled={vehicle.transferPending}
          >
            {vehicle.transferPending ? 'Trasferimento in corso' : 'Vendi Auto'}
          </Button>
        </View>
      </ScrollView>

      {/* Modal Privacy */}
      <Portal>
        <Modal
          visible={showPrivacyModal}
          onDismiss={() => setShowPrivacyModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
        >
          <Text style={styles.modalTitle}>Impostazioni Privacy Rapide</Text>
          <Text style={styles.modalSubtitle}>
            Scegli quali informazioni rendere visibili
          </Text>
          
          <View style={styles.privacyOptions}>
            <PrivacyOption
              label="Chilometraggio"
              value={vehicle.privacySettings.showMileage}
              onToggle={() => togglePrivacySetting('showMileage')}
            />
            <PrivacyOption
              label="Storico Manutenzioni"
              value={vehicle.privacySettings.showMaintenanceHistory}
              onToggle={() => togglePrivacySetting('showMaintenanceHistory')}
            />
            <PrivacyOption
              label="Documenti"
              value={vehicle.privacySettings.showDocuments}
              onToggle={() => togglePrivacySetting('showDocuments')}
            />
            <PrivacyOption
              label="Costi"
              value={vehicle.privacySettings.showCosts}
              onToggle={() => togglePrivacySetting('showCosts')}
            />
          </View>
          
          <Button
            mode="contained"
            onPress={() => setShowPrivacyModal(false)}
            style={{ marginTop: 20 }}
          >
            Conferma
          </Button>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

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
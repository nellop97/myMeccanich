// src/screens/user/MaintenanceDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  IconButton,
  Divider,
  FAB,
  Portal,
  Modal,
  TextInput,
  Button,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  Calendar,
  Wrench,
  Euro,
  MapPin,
  User,
  Package,
  FileText,
  Shield,
  Clock,
  Edit,
  Trash2,
  Image as ImageIcon,
  Download,
} from 'lucide-react-native';
import { MaintenanceService } from '../../services/MaintenanceService';
import { VehicleService } from '../../services/VehicleService';
import { useAppThemeManager } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { MaintenanceRecord, Vehicle } from '../../types/database.types';
import { UniversalDatePicker } from '../../components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isTablet = SCREEN_WIDTH >= 768;

export default function MaintenanceDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useAppThemeManager();
  const { user } = useAuth();
  const maintenanceService = MaintenanceService.getInstance();
  const vehicleService = VehicleService.getInstance();

  const { maintenanceId, carId } = route.params as { maintenanceId: string; carId: string };

  const [maintenance, setMaintenance] = useState<MaintenanceRecord | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Edit form state
  const [editData, setEditData] = useState<Partial<MaintenanceRecord>>({});

  useEffect(() => {
    loadData();
  }, [maintenanceId]);

  const loadData = async () => {
    try {
      setLoading(true);

      console.log('🔍 Loading maintenance detail:', {
        maintenanceId,
        carId,
        userId: user?.uid
      });

      // Load vehicle
      const vehicleData = await vehicleService.getVehicle(carId);
      setVehicle(vehicleData);

      // Load maintenance records to find the specific one
      if (user?.uid) {
        const records = await maintenanceService.getVehicleMaintenanceHistory(carId, user.uid);
        console.log('📊 Total records loaded:', records.length);
        console.log('🔎 Looking for maintenance ID:', maintenanceId);

        // Debug: Log all record IDs
        if (records.length > 0) {
          console.log('📋 Available record IDs:', records.map(r => r.id));
        }

        const record = records.find(r => r.id === maintenanceId);

        if (record) {
          console.log('✅ Maintenance found:', {
            id: record.id,
            description: record.description,
            date: record.date
          });
          setMaintenance(record);
          setEditData(record);
        } else {
          console.error('❌ Maintenance not found in records');
          console.error('Available IDs:', records.map(r => r.id));
          console.error('Searched ID:', maintenanceId);
          Alert.alert('Errore', 'Manutenzione non trovata');
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error('❌ Error loading maintenance:', error);
      Alert.alert('Errore', 'Impossibile caricare i dettagli della manutenzione');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!maintenance) return;

    try {
      setLoading(true);
      await maintenanceService.updateMaintenanceRecord(maintenanceId, editData);

      Alert.alert('Successo', 'Manutenzione aggiornata con successo');
      setEditMode(false);
      loadData();
    } catch (error) {
      console.error('Error updating maintenance:', error);
      Alert.alert('Errore', 'Impossibile aggiornare la manutenzione');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await maintenanceService.updateMaintenanceRecord(maintenanceId, { isVisible: false });

      Alert.alert('Successo', 'Manutenzione eliminata con successo', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      Alert.alert('Errore', 'Impossibile eliminare la manutenzione');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tagliando': return '#4CAF50';
      case 'gomme': return '#2196F3';
      case 'freni': return '#FF9800';
      case 'carrozzeria': return '#9C27B0';
      case 'motore': return '#F44336';
      case 'elettronica': return '#00BCD4';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.onBackground }}>
          Caricamento...
        </Text>
      </View>
    );
  }

  if (!maintenance || !vehicle) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.onBackground }]}>
          Manutenzione non trovata
        </Text>
      </View>
    );
  }

  const containerStyle = isWeb && isTablet ? styles.webContainer : styles.container;

  return (
    <SafeAreaView style={[containerStyle, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <ArrowLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
            Dettaglio Manutenzione
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
            {vehicle.make} {vehicle.model}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {!editMode ? (
            <>
              <IconButton
                icon={() => <Edit size={20} color={colors.primary} />}
                onPress={() => setEditMode(true)}
              />
              <IconButton
                icon={() => <Trash2 size={20} color={colors.error} />}
                onPress={() => setShowDeleteModal(true)}
              />
            </>
          ) : (
            <IconButton
              icon="close"
              onPress={() => {
                setEditMode(false);
                setEditData(maintenance);
              }}
            />
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Type Badge */}
          <View style={styles.typeBadgeContainer}>
            <Chip
              mode="flat"
              style={[styles.typeBadge, { backgroundColor: getTypeColor(maintenance.type) + '20' }]}
              textStyle={{ color: getTypeColor(maintenance.type), fontWeight: '600' }}
            >
              {maintenance.type.toUpperCase()}
            </Chip>
            {maintenance.warranty && (
              <Chip
                mode="flat"
                icon={() => <Shield size={16} color="#4CAF50" />}
                style={[styles.warrantyBadge, { backgroundColor: '#4CAF5020' }]}
                textStyle={{ color: '#4CAF50', fontWeight: '600' }}
              >
                In Garanzia
              </Chip>
            )}
          </View>

          {/* Main Info Card */}
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Informazioni Generali
              </Text>

              {editMode ? (
                <>
                  <TextInput
                    label="Descrizione"
                    value={editData.description}
                    onChangeText={(text) => setEditData({ ...editData, description: text })}
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                    style={styles.input}
                  />

                  <UniversalDatePicker
                    value={editData.date || maintenance.date}
                    onChange={(date) => setEditData({ ...editData, date })}
                    label="Data"
                    mode="date"
                  />

                  <TextInput
                    label="Chilometraggio"
                    value={editData.mileage?.toString()}
                    onChangeText={(text) => setEditData({ ...editData, mileage: parseInt(text) || 0 })}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </>
              ) : (
                <>
                  <DetailRow
                    icon={<FileText size={20} color={colors.primary} />}
                    label="Descrizione"
                    value={maintenance.description}
                    colors={colors}
                  />

                  <DetailRow
                    icon={<Calendar size={20} color={colors.primary} />}
                    label="Data"
                    value={new Date(maintenance.date).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                    colors={colors}
                  />

                  {maintenance.mileage && (
                    <DetailRow
                      icon={<Wrench size={20} color={colors.primary} />}
                      label="Chilometraggio"
                      value={`${maintenance.mileage.toLocaleString()} km`}
                      colors={colors}
                    />
                  )}
                </>
              )}
            </Card.Content>
          </Card>

          {/* Cost Card */}
          {(maintenance.cost || editMode) && vehicle.privacySettings.showCosts && (
            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  Costi
                </Text>

                {editMode ? (
                  <>
                    <TextInput
                      label="Costo Totale"
                      value={editData.cost?.toString()}
                      onChangeText={(text) => setEditData({ ...editData, cost: parseFloat(text) || 0 })}
                      mode="outlined"
                      keyboardType="decimal-pad"
                      left={<TextInput.Icon icon={() => <Euro size={20} />} />}
                      style={styles.input}
                    />

                    <TextInput
                      label="Costo Manodopera"
                      value={editData.laborCost?.toString()}
                      onChangeText={(text) => setEditData({ ...editData, laborCost: parseFloat(text) || 0 })}
                      mode="outlined"
                      keyboardType="decimal-pad"
                      left={<TextInput.Icon icon={() => <Euro size={20} />} />}
                      style={styles.input}
                    />

                    <TextInput
                      label="Costo Ricambi"
                      value={editData.partsCost?.toString()}
                      onChangeText={(text) => setEditData({ ...editData, partsCost: parseFloat(text) || 0 })}
                      mode="outlined"
                      keyboardType="decimal-pad"
                      left={<TextInput.Icon icon={() => <Euro size={20} />} />}
                      style={styles.input}
                    />
                  </>
                ) : (
                  <>
                    <View style={styles.costRow}>
                      <Text style={[styles.costLabel, { color: colors.onSurfaceVariant }]}>
                        Totale
                      </Text>
                      <Text style={[styles.costValue, { color: colors.primary }]}>
                        € {maintenance.cost?.toFixed(2)}
                      </Text>
                    </View>

                    {maintenance.laborCost && (
                      <View style={styles.costRow}>
                        <Text style={[styles.costLabel, { color: colors.onSurfaceVariant }]}>
                          Manodopera
                        </Text>
                        <Text style={[styles.costText, { color: colors.onSurface }]}>
                          € {maintenance.laborCost.toFixed(2)}
                        </Text>
                      </View>
                    )}

                    {maintenance.partsCost && (
                      <View style={styles.costRow}>
                        <Text style={[styles.costLabel, { color: colors.onSurfaceVariant }]}>
                          Ricambi
                        </Text>
                        <Text style={[styles.costText, { color: colors.onSurface }]}>
                          € {maintenance.partsCost.toFixed(2)}
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </Card.Content>
            </Card>
          )}

          {/* Workshop Card */}
          {((maintenance.workshopName || maintenance.mechanicName) || editMode) && vehicle.privacySettings.showMechanics && (
            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  Officina e Meccanico
                </Text>

                {editMode ? (
                  <>
                    <TextInput
                      label="Nome Officina"
                      value={editData.workshopName}
                      onChangeText={(text) => setEditData({ ...editData, workshopName: text })}
                      mode="outlined"
                      left={<TextInput.Icon icon={() => <MapPin size={20} />} />}
                      style={styles.input}
                    />

                    <TextInput
                      label="Nome Meccanico"
                      value={editData.mechanicName}
                      onChangeText={(text) => setEditData({ ...editData, mechanicName: text })}
                      mode="outlined"
                      left={<TextInput.Icon icon={() => <User size={20} />} />}
                      style={styles.input}
                    />

                    <TextInput
                      label="Telefono Meccanico"
                      value={editData.mechanicPhone}
                      onChangeText={(text) => setEditData({ ...editData, mechanicPhone: text })}
                      mode="outlined"
                      keyboardType="phone-pad"
                      style={styles.input}
                    />
                  </>
                ) : (
                  <>
                    {maintenance.workshopName && (
                      <DetailRow
                        icon={<MapPin size={20} color={colors.primary} />}
                        label="Officina"
                        value={maintenance.workshopName}
                        colors={colors}
                      />
                    )}

                    {maintenance.mechanicName && (
                      <DetailRow
                        icon={<User size={20} color={colors.primary} />}
                        label="Meccanico"
                        value={maintenance.mechanicName}
                        colors={colors}
                      />
                    )}

                    {maintenance.mechanicPhone && (
                      <DetailRow
                        icon={<User size={20} color={colors.primary} />}
                        label="Telefono"
                        value={maintenance.mechanicPhone}
                        colors={colors}
                      />
                    )}
                  </>
                )}
              </Card.Content>
            </Card>
          )}

          {/* Parts Card */}
          {maintenance.parts && maintenance.parts.length > 0 && (
            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  Ricambi Utilizzati
                </Text>

                {maintenance.parts.map((part, index) => (
                  <View key={index} style={styles.partItem}>
                    <Package size={16} color={colors.primary} />
                    <View style={styles.partInfo}>
                      <Text style={[styles.partName, { color: colors.onSurface }]}>
                        {part.name}
                      </Text>
                      {part.quantity > 1 && (
                        <Text style={[styles.partQuantity, { color: colors.onSurfaceVariant }]}>
                          Quantità: {part.quantity}
                        </Text>
                      )}
                      {part.cost && (
                        <Text style={[styles.partCost, { color: colors.onSurfaceVariant }]}>
                          € {part.cost.toFixed(2)}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}

          {/* Warranty Card */}
          {maintenance.warranty && (
            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  Garanzia
                </Text>

                <View style={[styles.warrantyInfo, { backgroundColor: '#4CAF5010' }]}>
                  <Shield size={24} color="#4CAF50" />
                  <View style={styles.warrantyText}>
                    <Text style={[styles.warrantyTitle, { color: colors.onSurface }]}>
                      Intervento in garanzia
                    </Text>
                    {maintenance.warrantyExpiry && (
                      <Text style={[styles.warrantyExpiry, { color: colors.onSurfaceVariant }]}>
                        Scadenza: {new Date(maintenance.warrantyExpiry).toLocaleDateString('it-IT')}
                      </Text>
                    )}
                  </View>
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Next Service Card */}
          {(maintenance.nextServiceDate || maintenance.nextServiceMileage) && (
            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  Prossimo Intervento
                </Text>

                {maintenance.nextServiceDate && (
                  <DetailRow
                    icon={<Clock size={20} color={colors.warning} />}
                    label="Data"
                    value={new Date(maintenance.nextServiceDate).toLocaleDateString('it-IT')}
                    colors={colors}
                  />
                )}

                {maintenance.nextServiceMileage && (
                  <DetailRow
                    icon={<Wrench size={20} color={colors.warning} />}
                    label="Chilometraggio"
                    value={`${maintenance.nextServiceMileage.toLocaleString()} km`}
                    colors={colors}
                  />
                )}
              </Card.Content>
            </Card>
          )}

          {/* Notes Card */}
          {(maintenance.notes || editMode) && (
            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  Note
                </Text>

                {editMode ? (
                  <TextInput
                    label="Note"
                    value={editData.notes}
                    onChangeText={(text) => setEditData({ ...editData, notes: text })}
                    mode="outlined"
                    multiline
                    numberOfLines={4}
                    style={styles.input}
                  />
                ) : (
                  <Text style={[styles.notesText, { color: colors.onSurfaceVariant }]}>
                    {maintenance.notes}
                  </Text>
                )}
              </Card.Content>
            </Card>
          )}

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      {/* Save FAB when in edit mode */}
      {editMode && (
        <FAB
          icon="check"
          label="Salva"
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={handleSaveEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Portal>
        <Modal
          visible={showDeleteModal}
          onDismiss={() => setShowDeleteModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
            Elimina Manutenzione
          </Text>
          <Text style={[styles.modalText, { color: colors.onSurfaceVariant }]}>
            Sei sicuro di voler eliminare questa manutenzione? Questa azione non può essere annullata.
          </Text>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowDeleteModal(false)}
              style={styles.modalButton}
            >
              Annulla
            </Button>
            <Button
              mode="contained"
              onPress={handleDelete}
              buttonColor={colors.error}
              style={styles.modalButton}
            >
              Elimina
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

// Helper component
const DetailRow = ({ icon, label, value, colors }: any) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIcon}>{icon}</View>
    <View style={styles.detailContent}>
      <Text style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>
        {label}
      </Text>
      <Text style={[styles.detailValue, { color: colors.onSurface }]}>
        {value}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webContainer: {
    flex: 1,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  typeBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeBadge: {
    borderRadius: 8,
  },
  warrantyBadge: {
    borderRadius: 8,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  input: {
    marginBottom: 12,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  costLabel: {
    fontSize: 14,
  },
  costValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  costText: {
    fontSize: 16,
    fontWeight: '500',
  },
  partItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  partInfo: {
    flex: 1,
    marginLeft: 12,
  },
  partName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  partQuantity: {
    fontSize: 13,
    marginBottom: 2,
  },
  partCost: {
    fontSize: 13,
  },
  warrantyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  warrantyText: {
    flex: 1,
    marginLeft: 12,
  },
  warrantyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  warrantyExpiry: {
    fontSize: 13,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    minWidth: 100,
  },
});

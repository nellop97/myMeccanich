// =====================================================
// VEHICLE DATA VIEW SCREEN
// Schermata per visualizzare dati veicolo approvati
// =====================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform
} from 'react-native';
import {
  Text,
  Card,
  Divider,
  ActivityIndicator,
  Badge,
  Chip
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  Car,
  Calendar,
  Gauge,
  Fuel,
  Settings,
  Palette,
  Eye,
  Clock,
  Wrench,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  User,
  UserCheck
} from 'lucide-react-native';
import { useAppThemeManager } from '../../hooks/useTheme';
import { VehicleViewRequestService } from '../../services/VehicleViewRequestService';
import { auth } from '../../services/firebase';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isLargeScreen = width >= 768;

export default function VehicleDataViewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, isDark } = useAppThemeManager();
  const viewRequestService = VehicleViewRequestService.getInstance();

  const { requestId } = route.params as { requestId: string };

  const [isLoading, setIsLoading] = useState(true);
  const [requestData, setRequestData] = useState<any>(null);
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVehicleData();
  }, [requestId]);

  const loadVehicleData = async () => {
    if (!auth.currentUser?.email) {
      setError('Devi essere autenticato per visualizzare questi dati');
      setIsLoading(false);
      return;
    }

    try {
      const data = await viewRequestService.getVehicleDataForRequest(
        requestId,
        auth.currentUser.email
      );

      setRequestData(data.request);
      setVehicleData(data.vehicleData);
    } catch (error: any) {
      console.error('Error loading vehicle data:', error);
      setError(error.message || 'Impossibile caricare i dati del veicolo');
      Alert.alert('Errore', error.message || 'Impossibile caricare i dati');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderBasicInfo = () => {
    if (!vehicleData?.basicInfo) return null;

    const info = vehicleData.basicInfo;

    return (
      <Card style={[styles.card, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Car size={24} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
              Informazioni Veicolo
            </Text>
          </View>

          <View style={styles.infoGrid}>
            <InfoItem
              icon={<Car size={18} color={colors.onSurfaceVariant} />}
              label="Marca e Modello"
              value={`${info.make} ${info.model}`}
              colors={colors}
            />
            <InfoItem
              icon={<Calendar size={18} color={colors.onSurfaceVariant} />}
              label="Anno"
              value={info.year.toString()}
              colors={colors}
            />
            <InfoItem
              icon={<FileText size={18} color={colors.onSurfaceVariant} />}
              label="Targa"
              value={info.licensePlate}
              colors={colors}
            />
            <InfoItem
              icon={<FileText size={18} color={colors.onSurfaceVariant} />}
              label="VIN"
              value={info.vin}
              colors={colors}
            />
            <InfoItem
              icon={<Gauge size={18} color={colors.onSurfaceVariant} />}
              label="Chilometraggio"
              value={`${info.mileage.toLocaleString()} km`}
              colors={colors}
            />
            <InfoItem
              icon={<Palette size={18} color={colors.onSurfaceVariant} />}
              label="Colore"
              value={info.color}
              colors={colors}
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.specsGrid}>
            <SpecChip
              label="Alimentazione"
              value={info.fuel}
              colors={colors}
            />
            <SpecChip
              label="Cambio"
              value={info.transmission}
              colors={colors}
            />
            {info.engineSize && (
              <SpecChip
                label="Cilindrata"
                value={`${info.engineSize} cc`}
                colors={colors}
              />
            )}
            {info.power && (
              <SpecChip
                label="Potenza"
                value={`${info.power} CV`}
                colors={colors}
              />
            )}
            {info.bodyType && (
              <SpecChip
                label="Carrozzeria"
                value={info.bodyType}
                colors={colors}
              />
            )}
            {info.doors && (
              <SpecChip
                label="Porte"
                value={info.doors.toString()}
                colors={colors}
              />
            )}
            {info.seats && (
              <SpecChip
                label="Posti"
                value={info.seats.toString()}
                colors={colors}
              />
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderMaintenanceHistory = () => {
    if (!vehicleData?.maintenanceHistory || vehicleData.maintenanceHistory.length === 0) {
      return null;
    }

    return (
      <Card style={[styles.card, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Wrench size={24} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
              Storico Manutenzione
            </Text>
            <Badge style={{ backgroundColor: colors.primary }}>
              {vehicleData.maintenanceHistory.length}
            </Badge>
          </View>

          <Text style={[styles.cardDescription, { color: colors.onSurfaceVariant }]}>
            Registro completo degli interventi di manutenzione
          </Text>

          {vehicleData.maintenanceHistory.map((record: any, index: number) => (
            <View key={record.id || index}>
              {index > 0 && <Divider style={styles.maintenanceDivider} />}
              <View style={styles.maintenanceRecord}>
                <View style={styles.maintenanceHeader}>
                  <View style={[styles.maintenanceTypeIndicator, { backgroundColor: getMaintenanceColor(record.type) + '20' }]}>
                    <Wrench size={16} color={getMaintenanceColor(record.type)} />
                  </View>
                  <View style={styles.maintenanceInfo}>
                    <Text style={[styles.maintenanceType, { color: colors.onSurface }]}>
                      {getMaintenanceTypeLabel(record.type)}
                    </Text>
                    <Text style={[styles.maintenanceDate, { color: colors.onSurfaceVariant }]}>
                      {formatDate(record.date)} • {record.mileage.toLocaleString()} km
                    </Text>
                  </View>
                </View>

                <Text style={[styles.maintenanceDescription, { color: colors.onSurface }]}>
                  {record.description}
                </Text>

                {/* Added by Info */}
                {(record.addedByType || record.mechanicName) && (
                  <View style={styles.maintenanceMetaInfo}>
                    {record.addedByType && (
                      <View style={[styles.addedByBadge, { backgroundColor:
                        record.addedByType === 'mechanic' ? '#f0f9ff' : '#fef3c7'
                      }]}>
                        {record.addedByType === 'mechanic' ? (
                          <UserCheck size={14} color="#0284c7" />
                        ) : (
                          <User size={14} color="#f59e0b" />
                        )}
                        <Text style={[styles.addedByText, { color:
                          record.addedByType === 'mechanic' ? '#0284c7' : '#f59e0b'
                        }]}>
                          {record.addedByType === 'mechanic' ? 'Aggiunto dal meccanico' : 'Aggiunto dal proprietario'}
                        </Text>
                      </View>
                    )}

                    {record.mechanicName && (
                      <View style={styles.mechanicInfo}>
                        <Wrench size={14} color={colors.onSurfaceVariant} />
                        <Text style={[styles.mechanicText, { color: colors.onSurfaceVariant }]}>
                          Meccanico: {record.mechanicName}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {record.cost && (
                  <Text style={[styles.maintenanceCost, { color: colors.primary }]}>
                    Costo: €{record.cost.toFixed(2)}
                  </Text>
                )}

                {record.workshopName && (
                  <Text style={[styles.maintenanceWorkshop, { color: colors.onSurfaceVariant }]}>
                    Officina: {record.workshopName}
                  </Text>
                )}

                {record.warranty && (
                  <Chip
                    icon={() => <CheckCircle size={14} color="#34C759" />}
                    style={styles.warrantyChip}
                  >
                    In garanzia
                  </Chip>
                )}
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderPhotos = () => {
    if (!vehicleData?.photos || vehicleData.photos.length === 0) {
      return null;
    }

    return (
      <Card style={[styles.card, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <ImageIcon size={24} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
              Galleria Foto
            </Text>
            <Badge style={{ backgroundColor: colors.primary }}>
              {vehicleData.photos.length}
            </Badge>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.photosScroll}
          >
            {vehicleData.photos.map((image: any, index: number) => (
              <View key={image.id || index} style={styles.photoContainer}>
                <Image
                  source={{ uri: image.url }}
                  style={styles.photo}
                  resizeMode="cover"
                />
              </View>
            ))}
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };

  const renderAccessInfo = () => {
    if (!requestData) return null;

    const remainingViews = requestData.maxViews - requestData.viewsCount;
    const expiresAt = requestData.expiresAt.toDate ? requestData.expiresAt.toDate() : new Date(requestData.expiresAt);
    const daysLeft = Math.ceil((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
      <Card style={[styles.card, { backgroundColor: colors.primaryContainer }]}>
        <Card.Content>
          <View style={styles.accessInfoHeader}>
            <Eye size={20} color={colors.primary} />
            <Text style={[styles.accessInfoTitle, { color: colors.onPrimaryContainer }]}>
              Informazioni Accesso
            </Text>
          </View>

          <View style={styles.accessStats}>
            <View style={styles.accessStat}>
              <Text style={[styles.accessStatValue, { color: colors.onPrimaryContainer }]}>
                {remainingViews}
              </Text>
              <Text style={[styles.accessStatLabel, { color: colors.onPrimaryContainer }]}>
                Visualizzazioni rimanenti
              </Text>
            </View>
            <View style={styles.accessStat}>
              <Text style={[styles.accessStatValue, { color: colors.onPrimaryContainer }]}>
                {daysLeft}
              </Text>
              <Text style={[styles.accessStatLabel, { color: colors.onPrimaryContainer }]}>
                Giorni rimanenti
              </Text>
            </View>
          </View>

          <View style={[styles.warningBox, { backgroundColor: colors.errorContainer }]}>
            <AlertCircle size={16} color={colors.error} />
            <Text style={[styles.warningText, { color: colors.onErrorContainer }]}>
              Questi dati sono condivisi temporaneamente dal proprietario. Non possono essere esportati o condivisi.
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
            Dati Veicolo
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            Caricamento dati...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !vehicleData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
            Dati Veicolo
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.onSurface }]}>
            Impossibile caricare i dati
          </Text>
          <Text style={[styles.errorText, { color: colors.onSurfaceVariant }]}>
            {error || 'Si è verificato un errore'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
          Dati Veicolo
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isWeb && isLargeScreen && styles.scrollContentWeb
        ]}
        showsVerticalScrollIndicator={false}
      >
        {renderAccessInfo()}
        {renderBasicInfo()}
        {renderPhotos()}
        {renderMaintenanceHistory()}
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper Components
const InfoItem = ({ icon, label, value, colors }: any) => (
  <View style={styles.infoItem}>
    <View style={styles.infoItemLeft}>
      {icon}
      <Text style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>
        {label}
      </Text>
    </View>
    <Text style={[styles.infoValue, { color: colors.onSurface }]}>
      {value}
    </Text>
  </View>
);

const SpecChip = ({ label, value, colors }: any) => (
  <View style={[styles.specChip, { backgroundColor: colors.surfaceVariant }]}>
    <Text style={[styles.specLabel, { color: colors.onSurfaceVariant }]}>
      {label}
    </Text>
    <Text style={[styles.specValue, { color: colors.onSurface }]}>
      {value}
    </Text>
  </View>
);

// Helper Functions
const getMaintenanceTypeLabel = (type: string): string => {
  const labels: any = {
    tagliando: 'Tagliando',
    gomme: 'Cambio Gomme',
    freni: 'Freni',
    carrozzeria: 'Carrozzeria',
    motore: 'Motore',
    elettronica: 'Elettronica',
    altro: 'Altro'
  };
  return labels[type] || type;
};

const getMaintenanceColor = (type: string): string => {
  const colors: any = {
    tagliando: '#007AFF',
    gomme: '#5856D6',
    freni: '#FF3B30',
    carrozzeria: '#FF9500',
    motore: '#FF2D55',
    elettronica: '#5E5CE6',
    altro: '#8E8E93'
  };
  return colors[type] || '#8E8E93';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  scrollContentWeb: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    marginVertical: 16,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  specLabel: {
    fontSize: 11,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  maintenanceDivider: {
    marginVertical: 16,
  },
  maintenanceRecord: {
    gap: 8,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  maintenanceTypeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maintenanceInfo: {
    flex: 1,
  },
  maintenanceType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  maintenanceDate: {
    fontSize: 13,
  },
  maintenanceDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  maintenanceCost: {
    fontSize: 15,
    fontWeight: '600',
  },
  maintenanceWorkshop: {
    fontSize: 13,
  },
  maintenanceMetaInfo: {
    gap: 8,
    marginTop: 8,
  },
  addedByBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  addedByText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mechanicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mechanicText: {
    fontSize: 13,
    fontWeight: '500',
  },
  warrantyChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  photosScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  photoContainer: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: 200,
    height: 150,
    backgroundColor: '#f0f0f0',
  },
  accessInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  accessInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  accessStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  accessStat: {
    flex: 1,
    alignItems: 'center',
  },
  accessStatValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  accessStatLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

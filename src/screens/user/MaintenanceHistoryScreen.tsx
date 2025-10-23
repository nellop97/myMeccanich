// src/screens/user/MaintenanceHistoryScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
  Platform,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Searchbar,
  FAB,
  Menu,
  Divider,
  IconButton,
  Surface,
  Badge
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Wrench,
  Calendar,
  MapPin,
  Euro,
  Filter,
  ChevronRight,
  Lock,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Package,
  Car
} from 'lucide-react-native';
import { SecurityService } from '../../security/SecurityService';
import { MaintenanceService } from '../../services/MaintenanceService';
import { VehicleService } from '../../services/VehicleService';
import { useAppThemeManager } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { MaintenanceRecord, Vehicle } from '../../types/database.types';

export default function MaintenanceHistoryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useAppThemeManager();
  const { user } = useAuth();
  const security = SecurityService.getInstance();
  const maintenanceService = MaintenanceService.getInstance();
  const vehicleService = VehicleService.getInstance();
  
  const { carId } = route.params as { carId: string };
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MaintenanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Attiva protezione dati
    security.preventScreenCapture(true);
    
    // Disabilita context menu su web
    if (Platform.OS === 'web') {
      security.disableContextMenu();
    }
    
    // Carica dati
    loadData();

    return () => {
      security.preventScreenCapture(false);
    };
  }, [carId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carica veicolo per privacy settings
      const vehicleData = await vehicleService.getVehicle(carId);
      setVehicle(vehicleData);

      if (vehicleData && user?.uid) {
        // Carica storico manutenzione
        const maintenanceHistory = await maintenanceService.getVehicleMaintenanceHistory(
          carId,
          user.uid
        );
        
        setRecords(maintenanceHistory);
        setFilteredRecords(maintenanceHistory);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Errore', 'Impossibile caricare lo storico manutenzione');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filterRecords = async (query: string, filter: string) => {
    try {
      let filtered: MaintenanceRecord[] = [];

      if (filter === 'all') {
        filtered = records;
      } else {
        // Filtra per tipo dal server
        filtered = await maintenanceService.filterMaintenanceByType(carId, filter as any);
      }

      // Ricerca testuale locale
      if (query) {
        filtered = filtered.filter(r => 
          r.description.toLowerCase().includes(query.toLowerCase()) ||
          r.workshopName?.toLowerCase().includes(query.toLowerCase()) ||
          r.mechanicName?.toLowerCase().includes(query.toLowerCase())
        );
      }

      setFilteredRecords(filtered);
    } catch (error) {
      console.error('Error filtering records:', error);
    }
  };

  const toggleRecordExpansion = (id: string) => {
    const newExpanded = new Set(expandedRecords);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRecords(newExpanded);
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tagliando': return <Wrench size={20} />;
      case 'gomme': return <Package size={20} />;
      case 'freni': return <AlertCircle size={20} />;
      case 'carrozzeria': return <Car size={20} />;
      case 'motore': return <Settings size={20} />;
      case 'elettronica': return <Cpu size={20} />;
      default: return <Wrench size={20} />;
    }
  };

  const preventExport = () => {
    Alert.alert(
      '🔒 Funzione Bloccata',
      'Per motivi di sicurezza e privacy, lo storico manutenzione può essere consultato solo all\'interno dell\'app e non può essere esportato.',
      [{ text: 'Ho capito', style: 'default' }]
    );
  };

  const handleAddMaintenance = () => {
    navigation.navigate('AddMaintenance', { vehicleId: carId });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.onBackground }}>
          Caricamento storico...
        </Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <AlertCircle size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.onBackground }]}>
          Veicolo non trovato
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header di sicurezza */}
      <Surface style={styles.securityHeader} elevation={2}>
        <View style={styles.securityBadge}>
          <Lock size={16} color="#FF6B35" />
          <Text style={styles.securityText}>
            Dati protetti - Visualizzazione sicura
          </Text>
        </View>
        <IconButton
          icon="information"
          onPress={() => Alert.alert(
            'Protezione Dati',
            'Questi dati sono protetti e non possono essere esportati, condivisi o copiati. La visualizzazione è consentita solo all\'interno dell\'app.'
          )}
        />
      </Surface>

      {/* Barra di ricerca e filtri */}
      <View style={styles.searchBar}>
        <Searchbar
          placeholder="Cerca manutenzione..."
          onChangeText={(query) => {
            setSearchQuery(query);
            filterRecords(query, selectedFilter);
          }}
          value={searchQuery}
          style={styles.searchInput}
        />
        
        <Menu
          visible={showFilterMenu}
          onDismiss={() => setShowFilterMenu(false)}
          anchor={
            <IconButton
              icon={() => <Filter size={20} />}
              onPress={() => setShowFilterMenu(true)}
              style={styles.filterButton}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setSelectedFilter('all');
              filterRecords(searchQuery, 'all');
              setShowFilterMenu(false);
            }}
            title="Tutti"
            leadingIcon="all-inclusive"
          />
          <Divider />
          <Menu.Item
            onPress={() => {
              setSelectedFilter('tagliando');
              filterRecords(searchQuery, 'tagliando');
              setShowFilterMenu(false);
            }}
            title="Tagliandi"
            leadingIcon="wrench"
          />
          <Menu.Item
            onPress={() => {
              setSelectedFilter('gomme');
              filterRecords(searchQuery, 'gomme');
              setShowFilterMenu(false);
            }}
            title="Pneumatici"
            leadingIcon="circle-outline"
          />
          <Menu.Item
            onPress={() => {
              setSelectedFilter('freni');
              filterRecords(searchQuery, 'freni');
              setShowFilterMenu(false);
            }}
            title="Freni"
            leadingIcon="car-brake-alert"
          />
          <Menu.Item
            onPress={() => {
              setSelectedFilter('carrozzeria');
              filterRecords(searchQuery, 'carrozzeria');
              setShowFilterMenu(false);
            }}
            title="Carrozzeria"
            leadingIcon="car"
          />
          <Menu.Item
            onPress={() => {
              setSelectedFilter('motore');
              filterRecords(searchQuery, 'motore');
              setShowFilterMenu(false);
            }}
            title="Motore"
            leadingIcon="engine"
          />
        </Menu>
      </View>

      {/* Timeline manutenzioni */}
      <ScrollView
        style={styles.timeline}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        // Disabilita selezione testo su web
        {...(Platform.OS === 'web' && { style: { ...styles.timeline, userSelect: 'none' } })}
      >
        {filteredRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <Wrench size={48} color={colors.onSurfaceVariant} />
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
              Nessuna manutenzione registrata
            </Text>
            <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
              {searchQuery ? 'Prova a modificare i criteri di ricerca' : 'Aggiungi la prima manutenzione'}
            </Text>
          </View>
        ) : (
          filteredRecords.map((record, index) => (
            <View key={record.id}>
              {/* Linea timeline */}
              {index > 0 && <View style={styles.timelineLine} />}
              
              {/* Card manutenzione */}
              <TouchableOpacity
                onPress={() => navigation.navigate('MaintenanceDetail', {
                  maintenanceId: record.id,
                  carId
                })}
                activeOpacity={0.7}
              >
                <Card
                  style={[
                    styles.recordCard,
                    { backgroundColor: colors.surface }
                  ]}
                  elevation={2}
                >
                  {/* Header card */}
                  <View style={styles.recordHeader}>
                    <View
                      style={[
                        styles.typeIndicator,
                        { backgroundColor: getTypeColor(record.type) }
                      ]}
                    >
                      {getTypeIcon(record.type)}
                    </View>
                    
                    <View style={styles.recordInfo}>
                      <Text style={styles.recordTitle}>
                        {record.description}
                      </Text>
                      <View style={styles.recordMeta}>
                        <View style={styles.metaItem}>
                          <Calendar size={14} color="#666" />
                          <Text style={styles.metaText}>
                            {new Date(record.date).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Gauge size={14} color="#666" />
                          <Text style={styles.metaText}>
                            {record.mileage.toLocaleString()} km
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.recordActions}>
                      {record.warranty && (
                        <Badge style={styles.warrantyBadge}>
                          Garanzia
                        </Badge>
                      )}
                      <ChevronRight size={20} color={colors.onSurfaceVariant} />
                    </View>
                  </View>

                  {/* Preview dettagli (limitato) */}
                  {false && (
                    <View style={styles.recordDetails}>
                      <Divider style={styles.detailsDivider} />
                      
                      {record.workshopName && vehicle.privacySettings.showMechanics && (
                        <DetailRow
                          icon={<MapPin size={16} />}
                          label="Officina"
                          value={record.workshopName}
                        />
                      )}
                      
                      {record.mechanicName && vehicle.privacySettings.showMechanics && (
                        <DetailRow
                          icon={<User size={16} />}
                          label="Meccanico"
                          value={record.mechanicName}
                        />
                      )}
                      
                      {record.cost && vehicle.privacySettings.showCosts && (
                        <DetailRow
                          icon={<Euro size={16} />}
                          label="Costo"
                          value={`€ ${record.cost.toFixed(2)}`}
                          secure
                        />
                      )}
                      
                      {record.parts && record.parts.length > 0 && vehicle.privacySettings.showMaintenanceDetails && (
                        <View style={styles.partsSection}>
                          <Text style={styles.partsSectionTitle}>
                            Ricambi utilizzati:
                          </Text>
                          {record.parts.map((part, idx) => (
                            <View key={idx} style={styles.partItem}>
                              <Text style={styles.partBullet}>•</Text>
                              <Text style={styles.partText}>
                                {part.name} {part.quantity > 1 ? `x${part.quantity}` : ''}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                      
                      {record.notes && (
                        <View style={styles.notesSection}>
                          <Text style={styles.notesSectionTitle}>Note:</Text>
                          <Text style={styles.notesText}>{record.notes}</Text>
                        </View>
                      )}
                      
                      {record.nextServiceDate && (
                        <View style={styles.nextServiceBanner}>
                          <Clock size={16} color="#FF6B35" />
                          <Text style={styles.nextServiceText}>
                            Prossimo controllo: {new Date(record.nextServiceDate).toLocaleDateString()}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB per aggiungere e export */}
      <View style={styles.fabContainer}>
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={handleAddMaintenance}
        />
        <FAB
          icon="export"
          style={[styles.fabDisabled, { backgroundColor: '#999' }]}
          onPress={preventExport}
          label="Export"
          disabled
          small
        />
      </View>
    </SafeAreaView>
  );
}

// Componente helper rimane uguale
const DetailRow = ({ icon, label, value, secure }: any) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIcon}>{icon}</View>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={[styles.detailValue, secure && styles.secureValue]}>
      {value}
    </Text>
    {secure && <Lock size={12} color="#999" style={{ marginLeft: 4 }} />}
  </View>
);

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
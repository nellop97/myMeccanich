// src/screens/user/MaintenanceHistoryScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  Dimensions,
  Platform,
  SectionList
} from 'react-native';
import {
  Wrench,Calendar, Car,Filter,Search,Download,ChevronRight,Clock,DollarSign,MapPin,AlertCircle,CheckCircle,Settings,FileText,X,Gauge,Shield,Battery,Droplet,Disc,Zap
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store';
import { useUserCarsStore } from '../../store/useCarsStore';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

interface MaintenanceFilter {
  carId: string | null;
  type: string | null;
  dateRange: 'all' | '3months' | '6months' | 'year';
  status: 'all' | 'completed' | 'scheduled' | 'overdue';
}

const MaintenanceHistoryScreen = () => {
  const navigation = useNavigation();
  const { darkMode } = useStore();
  const { cars, getCarById } = useUserCarsStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [filter, setFilter] = useState<MaintenanceFilter>({
    carId: null,
    type: null,
    dateRange: 'all',
    status: 'all'
  });

  const theme = {
    background: darkMode ? '#111827' : '#f3f4f6',
    cardBackground: darkMode ? '#1f2937' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#9ca3af' : '#6b7280',
    border: darkMode ? '#374151' : '#e5e7eb',
    accent: '#2563eb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  };

  const maintenanceTypes = [
    { id: 'routine', name: 'Routine', icon: Clock, color: theme.info },
    { id: 'repair', name: 'Riparazione', icon: Wrench, color: theme.warning },
    { id: 'inspection', name: 'Revisione', icon: Shield, color: theme.success },
    { id: 'other', name: 'Altro', icon: Settings, color: theme.textSecondary }
  ];

  // Raccogli tutti i record di manutenzione
  const allMaintenanceRecords = useMemo(() => {
    let records: any[] = [];
    
    cars.forEach(car => {
      car.maintenanceRecords.forEach(record => {
        records.push({
          ...record,
          carId: car.id,
          carName: `${car.make} ${car.model}`,
          carPlate: car.licensePlate,
          car: car
        });
      });
    });

    // Applica filtri
    if (filter.carId) {
      records = records.filter(r => r.carId === filter.carId);
    }
    
    if (filter.type) {
      records = records.filter(r => r.type === filter.type);
    }
    
    if (filter.status !== 'all') {
      records = records.filter(r => r.status === filter.status);
    }
    
    // Filtro data
    if (filter.dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (filter.dateRange) {
        case '3months':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(now.getMonth() - 6);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      records = records.filter(r => new Date(r.date) >= startDate);
    }
    
    // Filtro ricerca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      records = records.filter(r => 
        r.description.toLowerCase().includes(query) ||
        r.carName.toLowerCase().includes(query) ||
        r.workshopName?.toLowerCase().includes(query)
      );
    }

    return records.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [cars, filter, searchQuery]);

  // Raggruppa per mese
  const groupedRecords = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    
    allMaintenanceRecords.forEach(record => {
      const date = new Date(record.date);
      const monthYear = date.toLocaleDateString('it-IT', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(record);
    });
    
    return Object.entries(groups).map(([title, data]) => ({
      title,
      data
    }));
  }, [allMaintenanceRecords]);

  // Statistiche
  const stats = useMemo(() => {
    const totalCost = allMaintenanceRecords.reduce((sum, r) => sum + r.cost, 0);
    const avgCost = allMaintenanceRecords.length > 0 
      ? totalCost / allMaintenanceRecords.length 
      : 0;
    
    const typeCount: Record<string, number> = {
      routine: 0,
      repair: 0,
      inspection: 0,
      other: 0
    };
    
    allMaintenanceRecords.forEach(r => {
      typeCount[r.type]++;
    });
    
    return {
      total: allMaintenanceRecords.length,
      totalCost,
      avgCost,
      typeCount,
      scheduled: allMaintenanceRecords.filter(r => r.status === 'scheduled').length,
      overdue: allMaintenanceRecords.filter(r => r.status === 'overdue').length
    };
  }, [allMaintenanceRecords]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const toggleExpanded = (recordId: string) => {
    setExpandedItems(prev => 
      prev.includes(recordId) 
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  const getMaintenanceIcon = (type: string) => {
    switch (type) {
      case 'oil': return Droplet;
      case 'brakes': return Disc;
      case 'battery': return Battery;
      case 'electrical': return Zap;
      default: return Wrench;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return theme.success;
      case 'scheduled': return theme.warning;
      case 'overdue': return theme.error;
      default: return theme.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const renderMaintenanceItem = ({ item }: { item: any }) => {
    const isExpanded = expandedItems.includes(item.id);
    const typeConfig = maintenanceTypes.find(t => t.type === item.type);
    const Icon = getMaintenanceIcon(item.type);
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity
        style={[styles.maintenanceCard, { backgroundColor: theme.cardBackground }]}
        onPress={() => toggleExpanded(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.maintenanceHeader}>
          <View style={[styles.iconContainer, { backgroundColor: typeConfig?.color + '20' }]}>
            <Icon size={24} color={typeConfig?.color} />
          </View>
          
          <View style={styles.maintenanceInfo}>
            <Text style={[styles.maintenanceTitle, { color: theme.text }]}>
              {item.description}
            </Text>
            <View style={styles.maintenanceDetails}>
              <View style={styles.detailItem}>
                <Car size={14} color={theme.textSecondary} />
                <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                  {item.carName} • {item.carPlate}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Calendar size={14} color={theme.textSecondary} />
                <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                  {formatDate(item.date)}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.maintenanceRight}>
            <Text style={[styles.maintenanceCost, { color: theme.text }]}>
              {formatCurrency(item.cost)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              {item.status === 'completed' ? (
                <CheckCircle size={14} color={statusColor} />
              ) : item.status === 'overdue' ? (
                <AlertCircle size={14} color={statusColor} />
              ) : (
                <Clock size={14} color={statusColor} />
              )}
            </View>
          </View>
        </View>
        
        {isExpanded && (
          <View style={[styles.expandedContent, { borderTopColor: theme.border }]}>
            <View style={styles.expandedRow}>
              <Gauge size={16} color={theme.textSecondary} />
              <Text style={[styles.expandedLabel, { color: theme.textSecondary }]}>
                Chilometraggio:
              </Text>
              <Text style={[styles.expandedValue, { color: theme.text }]}>
                {item.mileage.toLocaleString()} km
              </Text>
            </View>
            
            {item.workshopName && (
              <View style={styles.expandedRow}>
                <MapPin size={16} color={theme.textSecondary} />
                <Text style={[styles.expandedLabel, { color: theme.textSecondary }]}>
                  Officina:
                </Text>
                <Text style={[styles.expandedValue, { color: theme.text }]}>
                  {item.workshopName}
                </Text>
              </View>
            )}
            
            {item.notes && (
              <View style={styles.notesRow}>
                <FileText size={16} color={theme.textSecondary} />
                <Text style={[styles.notesText, { color: theme.textSecondary }]}>
                  {item.notes}
                </Text>
              </View>
            )}
            
            {(item.nextDueDate || item.nextDueMileage) && (
              <View style={[styles.nextServiceBox, { backgroundColor: theme.warning + '10' }]}>
                <Text style={[styles.nextServiceTitle, { color: theme.warning }]}>
                  Prossimo intervento
                </Text>
                {item.nextDueDate && (
                  <Text style={[styles.nextServiceText, { color: theme.text }]}>
                    Data: {formatDate(item.nextDueDate)}
                  </Text>
                )}
                {item.nextDueMileage && (
                  <Text style={[styles.nextServiceText, { color: theme.text }]}>
                    Km: {item.nextDueMileage.toLocaleString()}
                  </Text>
                )}
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.viewDetailsButton, { borderColor: theme.accent }]}
              onPress={() => navigation.navigate('MaintenanceDetail', { 
                carId: item.carId, 
                maintenanceId: item.id 
              })}
            >
              <Text style={[styles.viewDetailsText, { color: theme.accent }]}>
                Vedi dettagli completi
              </Text>
              <ChevronRight size={16} color={theme.accent} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>
            Storico Manutenzioni
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {stats.total} interventi registrati
          </Text>
        </View>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={() => Alert.alert('Export', 'Funzionalità in arrivo')}
        >
          <Download size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
      >
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.statValue, { color: theme.accent }]}>
            {stats.total}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Totali
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.statValue, { color: theme.success }]}>
            {formatCurrency(stats.totalCost)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Spesa Totale
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.statValue, { color: theme.info }]}>
            {formatCurrency(stats.avgCost)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Media Costo
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.statValue, { color: theme.warning }]}>
            {stats.scheduled}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Programmate
          </Text>
        </View>
        
        {stats.overdue > 0 && (
          <View style={[styles.statCard, { backgroundColor: theme.error + '10' }]}>
            <Text style={[styles.statValue, { color: theme.error }]}>
              {stats.overdue}
            </Text>
            <Text style={[styles.statLabel, { color: theme.error }]}>
              Scadute
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Search and Filter Bar */}
      <View style={styles.searchFilterBar}>
        <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground }]}>
          <Search size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Cerca manutenzione..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: theme.cardBackground }]}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={18} color={theme.text} />
          {(filter.carId || filter.type || filter.dateRange !== 'all' || filter.status !== 'all') && (
            <View style={[styles.filterBadge, { backgroundColor: theme.accent }]} />
          )}
        </TouchableOpacity>
      </View>

      {/* Maintenance List */}
      <SectionList
        sections={groupedRecords}
        keyExtractor={(item) => item.id}
        renderItem={renderMaintenanceItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={[styles.sectionHeader, { 
            color: theme.textSecondary,
            backgroundColor: theme.background 
          }]}>
            {title.charAt(0).toUpperCase() + title.slice(1)}
          </Text>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Wrench size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Nessuna manutenzione trovata
            </Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {searchQuery || Object.values(filter).some(v => v !== null && v !== 'all')
                ? 'Prova a modificare i filtri di ricerca'
                : 'Non hai ancora registrato manutenzioni'}
            </Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Filtra Manutenzioni
              </Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Car Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: theme.text }]}>
                Veicolo
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    !filter.carId && { backgroundColor: theme.accent }
                  ]}
                  onPress={() => setFilter({ ...filter, carId: null })}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: !filter.carId ? '#ffffff' : theme.text }
                  ]}>
                    Tutti
                  </Text>
                </TouchableOpacity>
                {cars.map(car => (
                  <TouchableOpacity
                    key={car.id}
                    style={[
                      styles.filterChip,
                      filter.carId === car.id && { backgroundColor: theme.accent }
                    ]}
                    onPress={() => setFilter({ ...filter, carId: car.id })}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { color: filter.carId === car.id ? '#ffffff' : theme.text }
                    ]}>
                      {car.make} {car.model}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Type Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: theme.text }]}>
                Tipo
              </Text>
              <View style={styles.filterGrid}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    !filter.type && { backgroundColor: theme.accent }
                  ]}
                  onPress={() => setFilter({ ...filter, type: null })}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: !filter.type ? '#ffffff' : theme.text }
                  ]}>
                    Tutti
                  </Text>
                </TouchableOpacity>
                {maintenanceTypes.map(type => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.filterChip,
                      filter.type === type.id && { backgroundColor: theme.accent }
                    ]}
                    onPress={() => setFilter({ ...filter, type: type.id })}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { color: filter.type === type.id ? '#ffffff' : theme.text }
                    ]}>
                      {type.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date Range Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: theme.text }]}>
                Periodo
              </Text>
              <View style={styles.filterGrid}>
                {[
                  { id: 'all', label: 'Tutto' },
                  { id: '3months', label: '3 mesi' },
                  { id: '6months', label: '6 mesi' },
                  { id: 'year', label: '1 anno' }
                ].map(range => (
                  <TouchableOpacity
                    key={range.id}
                    style={[
                      styles.filterChip,
                      filter.dateRange === range.id && { backgroundColor: theme.accent }
                    ]}
                    onPress={() => setFilter({ ...filter, dateRange: range.id as any })}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { color: filter.dateRange === range.id ? '#ffffff' : theme.text }
                    ]}>
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: theme.text }]}>
                Stato
              </Text>
              <View style={styles.filterGrid}>
                {[
                  { id: 'all', label: 'Tutti' },
                  { id: 'completed', label: 'Completate' },
                  { id: 'scheduled', label: 'Programmate' },
                  { id: 'overdue', label: 'Scadute' }
                ].map(status => (
                  <TouchableOpacity
                    key={status.id}
                    style={[
                      styles.filterChip,
                      filter.status === status.id && { backgroundColor: theme.accent }
                    ]}
                    onPress={() => setFilter({ ...filter, status: status.id as any })}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { color: filter.status === status.id ? '#ffffff' : theme.text }
                    ]}>
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.border }]}
                onPress={() => {
                  setFilter({
                    carId: null,
                    type: null,
                    dateRange: 'all',
                    status: 'all'
                  });
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  Resetta
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.accent }]}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>
                  Applica
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  exportButton: {
    padding: 8,
  },
  statsContainer: {
    maxHeight: 100,
    paddingVertical: 12,
  },
  statCard: {
    alignItems: 'center',
    marginHorizontal: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 120,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  searchFilterBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    padding: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  maintenanceCard: {
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maintenanceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  maintenanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  maintenanceDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
  },
  maintenanceRight: {
    alignItems: 'flex-end',
  },
  maintenanceCost: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    marginTop: 8,
  },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  expandedLabel: {
    fontSize: 14,
    flex: 1,
  },
  expandedValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  notesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  nextServiceBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  nextServiceTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  nextServiceText: {
    fontSize: 14,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MaintenanceHistoryScreen;
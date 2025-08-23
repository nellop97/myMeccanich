// src/screens/mechanic/AllCarsInWorkshopScreen.tsx
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Calendar,
  Car,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Filter,
  Phone,
  Search,
  User,
  Wrench,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useStore } from '../../store';
import { useWorkshopStore } from '../../store/workshopStore';

const { width: screenWidth } = Dimensions.get('window');

interface ExtendedCar {
  id: string;
  model: string;
  vin: string;
  licensePlate?: string;
  owner?: string;
  ownerPhone?: string; // Campo aggiuntivo
  color?: string; // Campo aggiuntivo
  year?: string; // Campo aggiuntivo
  entryDate?: string; // Campo aggiuntivo
  estimatedExit?: string; // Campo aggiuntivo
  repairs: any[];
  currentRepair?: any;
  totalCost?: number;
  daysInShop?: number;
  priority?: 'low' | 'medium' | 'high';
}

const AllCarsInWorkshopScreen = () => {
  const navigation = useNavigation();
  const { user, darkMode } = useStore();
  const { cars, updateRepairStatus } = useWorkshopStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all'); // all, in-progress, pending, priority
  const [sortBy, setSortBy] = useState('entry'); // entry, priority, cost, model
  const [showFilters, setShowFilters] = useState(false);
  
  const isDesktop = Platform.OS === 'web' && screenWidth > 768;

  const theme = {
    background: darkMode ? '#111827' : '#f3f4f6',
    cardBackground: darkMode ? '#1f2937' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#9ca3af' : '#6b7280',
    border: darkMode ? '#374151' : '#e5e7eb',
    accent: '#2563eb',
  };

  // Estendi i dati delle auto con informazioni aggiuntive per la demo
  const extendedCars: ExtendedCar[] = cars
    .filter(car => car.repairs.some(repair => repair.status === 'in-progress' || repair.status === 'pending'))
    .map((car, index) => {
      const activeRepairs = car.repairs.filter(repair => repair.status === 'in-progress' || repair.status === 'pending');
      const currentRepair = activeRepairs[0];
      
      // Dati fittizi aggiuntivi per la demo
      const mockData = {
        ownerPhone: ['+39 334 1234567', '+39 347 8901234', '+39 328 5678901'][index % 3],
        color: ['Bianco', 'Nero', 'Grigio', 'Rosso', 'Blu'][index % 5],
        year: ['2020', '2019', '2021', '2018', '2022'][index % 5],
        entryDate: ['2025-05-28', '2025-05-29', '2025-05-30'][index % 3],
        estimatedExit: ['2025-06-02', '2025-06-03', '2025-06-05'][index % 3],
        priority: (['low', 'medium', 'high'] as const)[index % 3],
      };

      const totalCost = activeRepairs.reduce((sum, repair) => sum + repair.totalCost, 0);
      const entryDate = new Date(mockData.entryDate);
      const today = new Date();
      const daysInShop = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        ...car,
        ...mockData,
        currentRepair,
        totalCost,
        daysInShop,
      };
    });

  // Filtri e ricerca
  const filteredCars = extendedCars.filter(car => {
    const matchesSearch = 
      car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.licensePlate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.owner?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.vin.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = 
      filterBy === 'all' ||
      (filterBy === 'in-progress' && car.currentRepair?.status === 'in-progress') ||
      (filterBy === 'pending' && car.currentRepair?.status === 'pending') ||
      (filterBy === 'priority' && car.priority === 'high');

    return matchesSearch && matchesFilter;
  });

  // Ordinamento
  const sortedCars = [...filteredCars].sort((a, b) => {
    switch (sortBy) {
      case 'entry':
        return new Date(b.entryDate!).getTime() - new Date(a.entryDate!).getTime();
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority!] - priorityOrder[a.priority!];
      case 'cost':
        return (b.totalCost || 0) - (a.totalCost || 0);
      case 'model':
        return a.model.localeCompare(b.model);
      default:
        return 0;
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return theme.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress': return darkMode ? '#3b82f6' : '#2563eb';
      case 'pending': return darkMode ? '#f59e0b' : '#d97706';
      case 'completed': return darkMode ? '#10b981' : '#059669';
      default: return theme.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderCarCard = ({ item: car }: { item: ExtendedCar }) => (
    <TouchableOpacity
      style={[styles.carCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
      onPress={() => console.log('Dettagli auto:', car.id)}
      activeOpacity={0.7}
    >
      {/* Header della card */}
      <View style={styles.carCardHeader}>
        <View style={styles.carMainInfo}>
          <View style={styles.plateContainer}>
            <Text style={[styles.licensePlate, { color: theme.text }]}>
              {car.licensePlate || 'N/A'}
            </Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(car.priority!) + '20' }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(car.priority!) }]}>
                {car.priority?.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={[styles.carModel, { color: theme.text }]}>
            {car.model} • {car.year} • {car.color}
          </Text>
          <Text style={[styles.carVin, { color: theme.textSecondary }]}>
            VIN: {car.vin}
          </Text>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(car.currentRepair?.status) + '20' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: getStatusColor(car.currentRepair?.status) }
            ]}>
              {car.currentRepair?.status === 'in-progress' ? 'In Lavorazione' : 'In Attesa'}
            </Text>
          </View>
          <Text style={[styles.daysInShop, { color: theme.textSecondary }]}>
            {car.daysInShop} giorni in officina
          </Text>
        </View>
      </View>

      {/* Informazioni cliente */}
      <View style={[styles.customerInfo, { borderColor: theme.border }]}>
        <View style={styles.customerRow}>
          <User size={16} color={theme.textSecondary} />
          <Text style={[styles.customerText, { color: theme.text }]}>
            {car.owner || 'N/A'}
          </Text>
        </View>
        <View style={styles.customerRow}>
          <Phone size={16} color={theme.textSecondary} />
          <Text style={[styles.customerText, { color: theme.textSecondary }]}>
            {car.ownerPhone}
          </Text>
        </View>
      </View>

      {/* Dettagli riparazione corrente */}
      <View style={[styles.repairInfo, { borderColor: theme.border }]}>
        <View style={styles.repairHeader}>
          <Wrench size={16} color={theme.accent} />
          <Text style={[styles.repairTitle, { color: theme.text }]}>
            Intervento Corrente
          </Text>
        </View>
        <Text style={[styles.repairDescription, { color: theme.textSecondary }]}>
          {car.currentRepair?.description}
        </Text>
        
        <View style={styles.repairDetails}>
          <View style={styles.repairDetailItem}>
            <Calendar size={14} color={theme.textSecondary} />
            <Text style={[styles.repairDetailText, { color: theme.textSecondary }]}>
              Ingresso: {formatDate(car.entryDate!)}
            </Text>
          </View>
          <View style={styles.repairDetailItem}>
            <Clock size={14} color={theme.textSecondary} />
            <Text style={[styles.repairDetailText, { color: theme.textSecondary }]}>
              Consegna prevista: {formatDate(car.estimatedExit!)}
            </Text>
          </View>
          <View style={styles.repairDetailItem}>
            <DollarSign size={14} color={theme.textSecondary} />
            <Text style={[styles.repairDetailText, { color: theme.text }]}>
              Costo: €{car.totalCost?.toFixed(2) || '0.00'}
            </Text>
          </View>
        </View>
      </View>

      {/* Azioni */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryAction]}
          onPress={() => updateRepairStatus(
            car.id,
            car.currentRepair?.id,
            car.currentRepair?.status === 'in-progress' ? 'completed' : 'in-progress'
          )}
        >
          <Text style={styles.actionButtonText}>
            {car.currentRepair?.status === 'in-progress' ? 'Completa' : 'Inizia Lavoro'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
            style={[styles.actionButton, styles.secondaryAction, { borderColor: theme.border }]}
            onPress={() => {
                // Naviga alla gestione prodotti del primo intervento attivo
                if (car.currentRepair) {
                navigation.navigate('RepairPartsManagement', {
                    carId: car.id,
                    repairId: car.currentRepair.id
                });
                } else {
                console.log('Nessun intervento attivo per questa auto');
                }
            }}
            >
            <Text style={[styles.secondaryActionText, { color: theme.accent }]}>
                Dettagli
            </Text>
            <ChevronRight size={16} color={theme.accent} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Statistiche rapide */}
      <View style={styles.statsContainer}>
        <View style={[styles.statItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Car size={20} color={theme.accent} />
          <Text style={[styles.statNumber, { color: theme.text }]}>{sortedCars.length}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Auto Totali</Text>
        </View>
        
        <View style={[styles.statItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Wrench size={20} color="#f59e0b" />
          <Text style={[styles.statNumber, { color: theme.text }]}>
            {sortedCars.filter(car => car.currentRepair?.status === 'in-progress').length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>In Lavorazione</Text>
        </View>
        
        <View style={[styles.statItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Clock size={20} color="#10b981" />
          <Text style={[styles.statNumber, { color: theme.text }]}>
            {sortedCars.filter(car => car.currentRepair?.status === 'pending').length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>In Attesa</Text>
        </View>
      </View>

      {/* Barra di ricerca */}
      <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Search size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Cerca per targa, modello, proprietario o VIN..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filtri e ordinamento */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} color={theme.text} />
          <Text style={[styles.filterButtonText, { color: theme.text }]}>Filtri</Text>
          <ChevronDown 
            size={16} 
            color={theme.text}
            style={[
              styles.chevron,
              showFilters && styles.chevronRotated
            ]}
          />
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortContainer}>
          {[
            { key: 'entry', label: 'Data Ingresso' },
            { key: 'priority', label: 'Priorità' },
            { key: 'cost', label: 'Costo' },
            { key: 'model', label: 'Modello' },
          ].map((sort) => (
            <TouchableOpacity
              key={sort.key}
              style={[
                styles.sortButton,
                { backgroundColor: theme.cardBackground, borderColor: theme.border },
                sortBy === sort.key && { backgroundColor: theme.accent }
              ]}
              onPress={() => setSortBy(sort.key)}
            >
              <Text style={[
                styles.sortButtonText,
                { color: sortBy === sort.key ? '#ffffff' : theme.text }
              ]}>
                {sort.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Pannello filtri espandibile */}
      {showFilters && (
        <View style={[styles.filtersPanel, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.filtersPanelTitle, { color: theme.text }]}>Filtra per:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'all', label: 'Tutte' },
              { key: 'in-progress', label: 'In Lavorazione' },
              { key: 'pending', label: 'In Attesa' },
              { key: 'priority', label: 'Alta Priorità' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  { borderColor: theme.border },
                  filterBy === filter.key && { backgroundColor: theme.accent }
                ]}
                onPress={() => setFilterBy(filter.key)}
              >
                <Text style={[
                  styles.filterChipText,
                  { color: filterBy === filter.key ? '#ffffff' : theme.text }
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header con pulsante indietro */}
      <View style={[styles.titleContainer, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        
        <Text style={[styles.screenTitle, { color: theme.text }]}>
          Auto in Officina
        </Text>
        
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={sortedCars}
        renderItem={renderCarCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Car size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Nessuna auto trovata
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {searchQuery ? 'Prova a modificare i criteri di ricerca' : 'Non ci sono auto in officina al momento'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
  },
  filterButtonText: {
    marginLeft: 4,
    marginRight: 4,
    fontSize: 14,
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  sortContainer: {
    flex: 1,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  filtersPanel: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 8,
  },
  filtersPanelTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  carCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  carCardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  carMainInfo: {
    marginBottom: 12,
  },
  plateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  licensePlate: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  carModel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  carVin: {
    fontSize: 12,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  daysInShop: {
    fontSize: 11,
  },
  customerInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerText: {
    marginLeft: 8,
    fontSize: 14,
  },
  repairInfo: {
    padding: 16,
    borderBottomWidth: 1,
  },
  repairHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  repairTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  repairDescription: {
    fontSize: 14,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  repairDetails: {
    gap: 6,
  },
  repairDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  repairDetailText: {
    marginLeft: 6,
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryAction: {
    backgroundColor: '#2563eb',
  },
  secondaryAction: {
    borderWidth: 1,
    flexDirection: 'row',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
});

export default AllCarsInWorkshopScreen;
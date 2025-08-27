
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Car,
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Fuel,
  Wrench,
  Calendar,
  ArrowUpRight,
  MoreVertical,
  Settings,
  Trash2
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../store';
import { useUserCarsStore } from '../../store/useCarsStore';

const { width: screenWidth } = Dimensions.get('window');

const CarsListScreen = () => {
  const navigation = useNavigation();
  const { darkMode } = useStore();
  const { cars, loading, refreshCars, deleteCar } = useUserCarsStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const theme = {
    background: darkMode ? '#121212' : '#f5f5f5',
    cardBackground: darkMode ? '#1e1e1e' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#a0a0a0' : '#666666',
    primary: '#007AFF',
    border: darkMode ? '#333333' : '#e0e0e0',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30'
  };

  useEffect(() => {
    refreshCars();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshCars();
    setRefreshing(false);
  };

  const filteredCars = cars.filter(car => {
    const matchesSearch = car.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         car.licensePlate.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'active' && car.status === 'active') ||
                         (selectedFilter === 'maintenance' && car.status === 'maintenance');
    
    return matchesSearch && matchesFilter;
  });

  const handleQuickAction = (carId: string, action: string) => {
    switch (action) {
      case 'fuel':
        navigation.navigate('AddFuel', { carId });
        break;
      case 'maintenance':
        navigation.navigate('AddMaintenance', { carId });
        break;
      case 'expense':
        navigation.navigate('AddExpense', { carId });
        break;
    }
  };

  const handleDeleteCar = (carId: string, carName: string) => {
    Alert.alert(
      'Elimina Veicolo',
      `Sei sicuro di voler eliminare ${carName}? Questa azione non può essere annullata.`,
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Elimina', 
          style: 'destructive',
          onPress: () => deleteCar(carId)
        }
      ]
    );
  };

  const renderCarCard = ({ item: car }) => {
    if (viewMode === 'list') {
      return (
        <TouchableOpacity
          style={[styles.listCard, { backgroundColor: theme.cardBackground }]}
          onPress={() => navigation.navigate('CarDetail', { carId: car.id })}
        >
          <View style={styles.listCardContent}>
            <View style={styles.carIconContainer}>
              <Car size={24} color={theme.primary} />
            </View>
            
            <View style={styles.carInfo}>
              <Text style={[styles.carTitle, { color: theme.text }]}>
                {car.make} {car.model}
              </Text>
              <Text style={[styles.carYear, { color: theme.textSecondary }]}>
                {car.year} • {car.licensePlate}
              </Text>
              <Text style={[styles.carMileage, { color: theme.textSecondary }]}>
                {car.mileage?.toLocaleString()} km
              </Text>
            </View>

            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: theme.primary + '20' }]}
                onPress={() => handleQuickAction(car.id, 'fuel')}
              >
                <Fuel size={16} color={theme.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: theme.success + '20' }]}
                onPress={() => handleQuickAction(car.id, 'maintenance')}
              >
                <Wrench size={16} color={theme.success} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: theme.warning + '20' }]}
                onPress={() => handleQuickAction(car.id, 'expense')}
              >
                <Calendar size={16} color={theme.warning} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View style={[styles.gridCard, { backgroundColor: theme.cardBackground }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('CarDetail', { carId: car.id })}
          style={styles.cardContent}
        >
          <LinearGradient
            colors={[theme.primary + '20', theme.primary + '10']}
            style={styles.carImagePlaceholder}
          >
            <Car size={32} color={theme.primary} />
          </LinearGradient>
          
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
              {car.make} {car.model}
            </Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              {car.year} • {car.licensePlate}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.gridQuickActions}>
          <TouchableOpacity
            style={[styles.gridActionButton, { backgroundColor: theme.primary }]}
            onPress={() => handleQuickAction(car.id, 'fuel')}
          >
            <Fuel size={12} color="#ffffff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.gridActionButton, { backgroundColor: theme.success }]}
            onPress={() => handleQuickAction(car.id, 'maintenance')}
          >
            <Wrench size={12} color="#ffffff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.gridActionButton, { backgroundColor: theme.warning }]}
            onPress={() => handleQuickAction(car.id, 'expense')}
          >
            <Calendar size={12} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => {
            Alert.alert(
              'Azioni',
              `Scegli un'azione per ${car.make} ${car.model}`,
              [
                { text: 'Modifica', onPress: () => navigation.navigate('CarDetail', { carId: car.id }) },
                { text: 'Elimina', style: 'destructive', onPress: () => handleDeleteCar(car.id, `${car.make} ${car.model}`) },
                { text: 'Annulla', style: 'cancel' }
              ]
            );
          }}
        >
          <MoreVertical size={16} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={filterVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setFilterVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.filterModal, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Filtra Veicoli</Text>
          
          {['all', 'active', 'maintenance'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterOption,
                selectedFilter === filter && { backgroundColor: theme.primary + '20' }
              ]}
              onPress={() => {
                setSelectedFilter(filter);
                setFilterVisible(false);
              }}
            >
              <Text style={[
                styles.filterText,
                { color: selectedFilter === filter ? theme.primary : theme.text }
              ]}>
                {filter === 'all' ? 'Tutti' : filter === 'active' ? 'Attivi' : 'In Manutenzione'}
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={[styles.modalCloseButton, { backgroundColor: theme.border }]}
            onPress={() => setFilterVisible(false)}
          >
            <Text style={[styles.modalCloseText, { color: theme.text }]}>Chiudi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>I Miei Veicoli</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.border }]}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? 
              <List size={20} color={theme.text} /> : 
              <Grid3X3 size={20} color={theme.text} />
            }
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.border }]}
            onPress={() => setFilterVisible(true)}
          >
            <Filter size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Search size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Cerca veicoli..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Cars List */}
      {filteredCars.length === 0 ? (
        <View style={styles.emptyState}>
          <Car size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            {searchQuery ? 'Nessun risultato' : 'Nessun Veicolo'}
          </Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {searchQuery ? 'Modifica la ricerca per trovare veicoli.' : 'Aggiungi il tuo primo veicolo per iniziare.'}
          </Text>
          
          {!searchQuery && (
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate('AddVehicle')}
            >
              <Plus size={16} color="#ffffff" />
              <Text style={styles.emptyButtonText}>Aggiungi Veicolo</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredCars}
          renderItem={renderCarCard}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
        />
      )}

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('AddVehicle')}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      {renderFilterModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  gridCard: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  cardContent: {
    alignItems: 'center',
  },
  carImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  gridQuickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  gridActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listCard: {
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  carIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  carInfo: {
    flex: 1,
  },
  carTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  carYear: {
    fontSize: 14,
    marginTop: 2,
  },
  carMileage: {
    fontSize: 12,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterText: {
    fontSize: 16,
  },
  modalCloseButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CarsListScreen;

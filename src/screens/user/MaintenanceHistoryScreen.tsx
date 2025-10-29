// src/screens/user/MaintenanceHistoryScreen.tsx - REDESIGN APPLE LIQUID GLASS
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
  RefreshControl,
  Animated,
  useWindowDimensions
} from 'react-native';
import {
  Text,
  Searchbar,
} from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import {
  Wrench,
  Calendar,
  MapPin,
  Euro,
  Filter,
  ChevronRight,
  AlertCircle,
  Package,
  Car,
  Plus,
  Shield,
  Settings,
  Cpu,
  TrendingUp,
  Clock
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SecurityService } from '../../security/SecurityService';
import { MaintenanceService } from '../../services/MaintenanceService';
import { VehicleService } from '../../services/VehicleService';
import { useAppThemeManager } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { MaintenanceRecord, Vehicle } from '../../types/database.types';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isTablet = SCREEN_WIDTH >= 768;

// Liquid Glass Card Component
const GlassCard = ({ children, style, onPress }: any) => {
  const { isDark } = useAppThemeManager();
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const cardContent = (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      {Platform.OS === 'web' || Platform.OS === 'ios' ? (
        <BlurView
          intensity={isWeb ? 40 : (isDark ? 30 : 60)}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.glassCard,
            {
              backgroundColor: isDark
                ? 'rgba(30, 30, 30, 0.7)'
                : 'rgba(255, 255, 255, 0.7)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.05)',
            },
            style
          ]}
        >
          {children}
        </BlurView>
      ) : (
        <View
          style={[
            styles.glassCard,
            {
              backgroundColor: isDark
                ? 'rgba(30, 30, 30, 0.9)'
                : 'rgba(255, 255, 255, 0.9)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.05)',
            },
            style
          ]}
        >
          {children}
        </View>
      )}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

// Filter Chip Component
const FilterChip = ({ label, active, onPress, icon }: any) => {
  const { isDark } = useAppThemeManager();
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient
          colors={active
            ? isDark
              ? ['#4A90E2', '#357ABD']
              : ['#007AFF', '#0051D5']
            : isDark
              ? ['rgba(60, 60, 60, 0.8)', 'rgba(40, 40, 40, 0.8)']
              : ['rgba(240, 240, 240, 0.9)', 'rgba(230, 230, 230, 0.9)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.filterChip,
            active && styles.filterChipActive,
            {
              borderColor: active
                ? isDark ? 'rgba(74, 144, 226, 0.5)' : 'rgba(0, 122, 255, 0.3)'
                : 'transparent',
            }
          ]}
        >
          {icon && (
            <View style={styles.chipIcon}>
              {icon}
            </View>
          )}
          <Text style={[
            styles.filterChipText,
            { color: active ? '#fff' : (isDark ? '#ddd' : '#666') }
          ]}>
            {label}
          </Text>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function MaintenanceHistoryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, isDark } = useAppThemeManager();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const security = SecurityService.getInstance();
  const maintenanceService = MaintenanceService.getInstance();
  const vehicleService = VehicleService.getInstance();

  const { carId } = route.params as { carId: string };

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MaintenanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalCount: 0,
    totalCost: 0,
    lastMaintenance: null as Date | null,
  });

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

  useEffect(() => {
    filterRecords(searchQuery, selectedFilter);
  }, [searchQuery, selectedFilter, records]);

  // Ricarica dati quando la schermata torna in focus (dopo salvataggio)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Screen focused, reloading maintenance data...');
      loadData();
    }, [carId])
  );

  const loadData = async () => {
    try {
      setLoading(true);

      // Carica veicolo per privacy settings
      const vehicleData = await vehicleService.getVehicle(carId);
      setVehicle(vehicleData);

      if (vehicleData && user?.uid) {
        // Carica storico manutenzione
        console.log('🔍 Loading maintenance for carId:', carId, 'userId:', user.uid);
        const maintenanceHistory = await maintenanceService.getVehicleMaintenanceHistory(
          carId,
          user.uid
        );

        console.log('📊 Loaded maintenance records:', maintenanceHistory.length);
        if (maintenanceHistory.length > 0) {
          console.log('📋 Sample record:', {
            id: maintenanceHistory[0].id,
            vehicleId: maintenanceHistory[0].vehicleId,
            description: maintenanceHistory[0].description,
            date: maintenanceHistory[0].date,
          });
        } else {
          console.warn('⚠️ No maintenance records found for this vehicle');
        }

        setRecords(maintenanceHistory);

        // Calcola statistiche
        const totalCost = maintenanceHistory.reduce((sum, record) => sum + (record.cost || 0), 0);
        const lastMaintenance = maintenanceHistory.length > 0 ? maintenanceHistory[0].date : null;

        setStats({
          totalCount: maintenanceHistory.length,
          totalCost,
          lastMaintenance,
        });
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

  const filterRecords = (query: string, filter: string) => {
    let filtered = [...records];

    // Filtra per tipo
    if (filter !== 'all') {
      filtered = filtered.filter(r => r.type === filter);
    }

    // Ricerca testuale locale
    if (query) {
      const queryLower = query.toLowerCase();
      filtered = filtered.filter(r =>
        r.description.toLowerCase().includes(queryLower) ||
        r.workshopName?.toLowerCase().includes(queryLower) ||
        r.mechanicName?.toLowerCase().includes(queryLower) ||
        r.type.toLowerCase().includes(queryLower)
      );
    }

    setFilteredRecords(filtered);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tagliando': return { from: '#4CAF50', to: '#45A049' };
      case 'gomme': return { from: '#2196F3', to: '#1976D2' };
      case 'freni': return { from: '#FF9800', to: '#F57C00' };
      case 'carrozzeria': return { from: '#9C27B0', to: '#7B1FA2' };
      case 'motore': return { from: '#F44336', to: '#D32F2F' };
      case 'elettronica': return { from: '#00BCD4', to: '#0097A7' };
      default: return { from: '#757575', to: '#616161' };
    }
  };

  const getTypeIcon = (type: string, size: number = 20, color: string = '#fff') => {
    switch (type) {
      case 'tagliando': return <Wrench size={size} color={color} />;
      case 'gomme': return <Package size={size} color={color} />;
      case 'freni': return <AlertCircle size={size} color={color} />;
      case 'carrozzeria': return <Car size={size} color={color} />;
      case 'motore': return <Settings size={size} color={color} />;
      case 'elettronica': return <Cpu size={size} color={color} />;
      default: return <Wrench size={size} color={color} />;
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      tagliando: 'Tagliando',
      gomme: 'Pneumatici',
      freni: 'Freni',
      carrozzeria: 'Carrozzeria',
      motore: 'Motore',
      elettronica: 'Elettronica',
      altro: 'Altro',
    };
    return types[type] || type;
  };

  const handleAddMaintenance = () => {
    navigation.navigate('AddMaintenance', { carId });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#000' : '#F5F5F7' }]}>
        <LinearGradient
          colors={isDark ? ['#1a1a1a', '#000'] : ['#F5F5F7', '#E8E8ED']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: isDark ? '#fff' : '#000', marginTop: 16 }]}>
          Caricamento storico...
        </Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: isDark ? '#000' : '#F5F5F7' }]}>
        <AlertCircle size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: isDark ? '#fff' : '#000' }]}>
          Veicolo non trovato
        </Text>
      </View>
    );
  }

  // Responsive layout
  const isLargeScreen = width >= 768;
  const numColumns = isLargeScreen ? 2 : 1;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={isDark
          ? ['#000000', '#1a1a1a', '#000000']
          : ['#F5F5F7', '#FFFFFF', '#F5F5F7']
        }
        style={StyleSheet.absoluteFill}
      />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <View style={[styles.iconButton, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
            }]}>
              <ChevronRight size={24} color={isDark ? '#fff' : '#000'} style={{ transform: [{ rotate: '180deg' }] }} />
            </View>
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>
              Storico Manutenzioni
            </Text>
            {vehicle && (
              <Text style={[styles.headerSubtitle, { color: isDark ? '#999' : '#666' }]}>
                {vehicle.brand} {vehicle.model}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={handleAddMaintenance}
            style={styles.addButton}
          >
            <LinearGradient
              colors={['#007AFF', '#0051D5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButtonGradient}
            >
              <Plus size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsContainer}
        >
          <GlassCard style={styles.statCard}>
            <View style={[styles.statIconContainer, {
              backgroundColor: isDark ? 'rgba(74, 144, 226, 0.2)' : 'rgba(0, 122, 255, 0.1)'
            }]}>
              <Wrench size={20} color="#007AFF" />
            </View>
            <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>
              {stats.totalCount}
            </Text>
            <Text style={[styles.statLabel, { color: isDark ? '#999' : '#666' }]}>
              Interventi
            </Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <View style={[styles.statIconContainer, {
              backgroundColor: isDark ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)'
            }]}>
              <Euro size={20} color="#4CAF50" />
            </View>
            <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>
              €{stats.totalCost.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
            </Text>
            <Text style={[styles.statLabel, { color: isDark ? '#999' : '#666' }]}>
              Spesa Totale
            </Text>
          </GlassCard>

          {stats.lastMaintenance && (
            <GlassCard style={styles.statCard}>
              <View style={[styles.statIconContainer, {
                backgroundColor: isDark ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)'
              }]}>
                <Clock size={20} color="#FF9800" />
              </View>
              <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000', fontSize: 16 }]}>
                {new Date(stats.lastMaintenance).toLocaleDateString('it-IT', {
                  day: 'numeric',
                  month: 'short'
                })}
              </Text>
              <Text style={[styles.statLabel, { color: isDark ? '#999' : '#666' }]}>
                Ultimo Intervento
              </Text>
            </GlassCard>
          )}
        </ScrollView>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <GlassCard style={styles.searchCard}>
            <Searchbar
              placeholder="Cerca manutenzioni..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={[styles.searchBar, {
                backgroundColor: 'transparent',
              }]}
              inputStyle={{ color: isDark ? '#fff' : '#000' }}
              iconColor={isDark ? '#999' : '#666'}
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
          </GlassCard>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          <FilterChip
            label="Tutti"
            active={selectedFilter === 'all'}
            onPress={() => setSelectedFilter('all')}
            icon={<Filter size={16} color={selectedFilter === 'all' ? '#fff' : (isDark ? '#ddd' : '#666')} />}
          />
          <FilterChip
            label="Tagliando"
            active={selectedFilter === 'tagliando'}
            onPress={() => setSelectedFilter('tagliando')}
            icon={getTypeIcon('tagliando', 16, selectedFilter === 'tagliando' ? '#fff' : (isDark ? '#ddd' : '#666'))}
          />
          <FilterChip
            label="Pneumatici"
            active={selectedFilter === 'gomme'}
            onPress={() => setSelectedFilter('gomme')}
            icon={getTypeIcon('gomme', 16, selectedFilter === 'gomme' ? '#fff' : (isDark ? '#ddd' : '#666'))}
          />
          <FilterChip
            label="Freni"
            active={selectedFilter === 'freni'}
            onPress={() => setSelectedFilter('freni')}
            icon={getTypeIcon('freni', 16, selectedFilter === 'freni' ? '#fff' : (isDark ? '#ddd' : '#666'))}
          />
          <FilterChip
            label="Carrozzeria"
            active={selectedFilter === 'carrozzeria'}
            onPress={() => setSelectedFilter('carrozzeria')}
            icon={getTypeIcon('carrozzeria', 16, selectedFilter === 'carrozzeria' ? '#fff' : (isDark ? '#ddd' : '#666'))}
          />
          <FilterChip
            label="Motore"
            active={selectedFilter === 'motore'}
            onPress={() => setSelectedFilter('motore')}
            icon={getTypeIcon('motore', 16, selectedFilter === 'motore' ? '#fff' : (isDark ? '#ddd' : '#666'))}
          />
          <FilterChip
            label="Elettronica"
            active={selectedFilter === 'elettronica'}
            onPress={() => setSelectedFilter('elettronica')}
            icon={getTypeIcon('elettronica', 16, selectedFilter === 'elettronica' ? '#fff' : (isDark ? '#ddd' : '#666'))}
          />
        </ScrollView>
      </View>

      {/* Timeline/Grid */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          isLargeScreen && styles.contentContainerGrid
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {filteredRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
            }]}>
              <Wrench size={48} color={isDark ? '#666' : '#999'} />
            </View>
            <Text style={[styles.emptyTitle, { color: isDark ? '#fff' : '#000' }]}>
              {searchQuery || selectedFilter !== 'all'
                ? 'Nessun risultato'
                : 'Nessuna manutenzione registrata'}
            </Text>
            <Text style={[styles.emptyText, { color: isDark ? '#999' : '#666' }]}>
              {searchQuery || selectedFilter !== 'all'
                ? 'Prova a modificare i filtri di ricerca'
                : 'Inizia ad aggiungere le tue manutenzioni'}
            </Text>
            {!searchQuery && selectedFilter === 'all' && (
              <TouchableOpacity
                onPress={handleAddMaintenance}
                style={styles.emptyButton}
              >
                <LinearGradient
                  colors={['#007AFF', '#0051D5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyButtonGradient}
                >
                  <Plus size={20} color="#fff" />
                  <Text style={styles.emptyButtonText}>Aggiungi Prima Manutenzione</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={[
            styles.recordsList,
            isLargeScreen && styles.recordsGrid
          ]}>
            {filteredRecords.map((record, index) => {
              const typeColors = getTypeColor(record.type);

              return (
                <View
                  key={record.id}
                  style={[
                    styles.recordWrapper,
                    isLargeScreen && styles.recordWrapperGrid
                  ]}
                >
                  <GlassCard
                    onPress={() => navigation.navigate('MaintenanceDetail', {
                      maintenanceId: record.id,
                      carId
                    })}
                    style={styles.recordCard}
                  >
                    {/* Type Badge */}
                    <View style={styles.recordHeader}>
                      <LinearGradient
                        colors={[typeColors.from, typeColors.to]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.typeBadge}
                      >
                        {getTypeIcon(record.type, 24, '#fff')}
                      </LinearGradient>

                      <View style={styles.recordHeaderInfo}>
                        <Text style={[styles.typeLabel, {
                          color: isDark ? '#fff' : '#000'
                        }]}>
                          {getTypeLabel(record.type)}
                        </Text>
                        {record.warranty && (
                          <View style={styles.warrantyBadge}>
                            <Shield size={12} color="#4CAF50" />
                            <Text style={styles.warrantyText}>Garanzia</Text>
                          </View>
                        )}
                      </View>

                      <ChevronRight size={20} color={isDark ? '#666' : '#999'} />
                    </View>

                    {/* Description */}
                    <Text style={[styles.recordDescription, {
                      color: isDark ? '#fff' : '#000'
                    }]} numberOfLines={2}>
                      {record.description}
                    </Text>

                    {/* Info Row */}
                    <View style={styles.recordInfoRow}>
                      <View style={styles.infoItem}>
                        <Calendar size={14} color={isDark ? '#999' : '#666'} />
                        <Text style={[styles.infoText, {
                          color: isDark ? '#999' : '#666'
                        }]}>
                          {new Date(record.date).toLocaleDateString('it-IT', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>

                      <View style={styles.infoItem}>
                        <TrendingUp size={14} color={isDark ? '#999' : '#666'} />
                        <Text style={[styles.infoText, {
                          color: isDark ? '#999' : '#666'
                        }]}>
                          {record.mileage.toLocaleString()} km
                        </Text>
                      </View>
                    </View>

                    {/* Bottom Info */}
                    <View style={styles.recordBottom}>
                      {record.workshopName && vehicle?.privacySettings?.showMechanics && (
                        <View style={styles.workshopInfo}>
                          <MapPin size={14} color={isDark ? '#666' : '#999'} />
                          <Text style={[styles.workshopText, {
                            color: isDark ? '#666' : '#999'
                          }]} numberOfLines={1}>
                            {record.workshopName}
                          </Text>
                        </View>
                      )}

                      {record.cost && vehicle?.privacySettings?.showCosts && (
                        <View style={styles.costBadge}>
                          <Text style={[styles.costText, {
                            color: isDark ? '#fff' : '#000'
                          }]}>
                            €{record.cost.toLocaleString('it-IT', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </Text>
                        </View>
                      )}
                    </View>
                  </GlassCard>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },

  // Glass Card
  glassCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      },
    }),
  },

  // Header
  header: {
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    marginRight: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 2,
  },
  addButton: {
    marginLeft: 12,
  },
  addButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stats
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    minWidth: 120,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  searchCard: {
    padding: 0,
  },
  searchBar: {
    elevation: 0,
    shadowOpacity: 0,
  },

  // Filters
  filtersContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    marginRight: 8,
  },
  filterChipActive: {
    borderWidth: 2,
  },
  chipIcon: {
    marginRight: 6,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  contentContainerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  // Records
  recordsList: {
    gap: 16,
  },
  recordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  recordWrapper: {
    width: '100%',
  },
  recordWrapperGrid: {
    width: '48%',
  },
  recordCard: {
    padding: 20,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  typeLabel: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  warrantyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  warrantyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  recordDescription: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 16,
  },
  recordInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
  },
  recordBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  workshopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  workshopText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  costBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  costText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 32,
  },
  emptyButton: {
    marginTop: 8,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

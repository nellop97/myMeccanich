// src/screens/user/MaintenanceDetailScreen.tsx - REDESIGN APPLE LIQUID GLASS
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
  Animated,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
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
  Phone,
  TrendingUp,
  Car,
  Settings,
  AlertCircle,
  CheckCircle,
  ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaintenanceService } from '../../services/MaintenanceService';
import { VehicleService } from '../../services/VehicleService';
import { useAppThemeManager } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { MaintenanceRecord, Vehicle } from '../../types/database.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Glass Card Component
const GlassCard = ({ children, style, onPress }: any) => {
  const { isDark } = useAppThemeManager();
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
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

export default function MaintenanceDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, isDark } = useAppThemeManager();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const maintenanceService = MaintenanceService.getInstance();
  const vehicleService = VehicleService.getInstance();

  const { maintenanceId, carId } = route.params as { maintenanceId: string; carId: string };

  const [maintenance, setMaintenance] = useState<MaintenanceRecord | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Responsive
  const isLargeScreen = width >= 768;

  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [maintenanceId, user?.uid]);

  useFocusEffect(
    React.useCallback(() => {
      if (user?.uid) {
        loadData();
      }
    }, [maintenanceId, user?.uid])
  );

  const loadData = async () => {
    try {
      console.log('🔍 Loading maintenance detail:', {
        maintenanceId,
        carId,
        userId: user?.uid
      });

      if (!user?.uid) {
        console.warn('⚠️ User not authenticated, skipping load');
        setLoading(false);
        return;
      }

      setLoading(true);

      // Load vehicle
      const vehicleData = await vehicleService.getVehicle(carId);
      setVehicle(vehicleData);

      // Check if user is owner
      const userIsOwner = vehicleData?.ownerId === user.uid;
      setIsOwner(userIsOwner);
      console.log('👤 User is owner:', userIsOwner);

      // Load maintenance record
      const records = await maintenanceService.getVehicleMaintenanceHistory(carId, user.uid);
      console.log('📊 Total records loaded:', records.length);

      const record = records.find(r => r.id === maintenanceId);

      if (record) {
        console.log('✅ Maintenance found:', {
          id: record.id,
          type: record.type,
          description: record.description,
          date: record.date
        });
        setMaintenance(record);
      } else {
        console.error('❌ Maintenance not found');
        Alert.alert('Errore', 'Manutenzione non trovata');
        navigation.goBack();
      }
    } catch (error) {
      console.error('❌ Error loading maintenance:', error);
      Alert.alert('Errore', 'Impossibile caricare i dettagli della manutenzione');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDelete = () => {
    Alert.alert(
      'Elimina Manutenzione',
      'Sei sicuro di voler eliminare questa manutenzione? Questa azione non può essere annullata.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await maintenanceService.updateMaintenanceRecord(maintenanceId, { isVisible: false });

              if (Platform.OS === 'web') {
                Alert.alert('Successo', 'Manutenzione eliminata con successo');
                setTimeout(() => navigation.goBack(), 1000);
              } else {
                Alert.alert('Successo', 'Manutenzione eliminata con successo', [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ]);
              }
            } catch (error) {
              console.error('Error deleting maintenance:', error);
              Alert.alert('Errore', 'Impossibile eliminare la manutenzione');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
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

  const getTypeIcon = (type: string, size: number = 24, color: string = '#fff') => {
    switch (type) {
      case 'tagliando': return <Wrench size={size} color={color} />;
      case 'gomme': return <Package size={size} color={color} />;
      case 'freni': return <AlertCircle size={size} color={color} />;
      case 'carrozzeria': return <Car size={size} color={color} />;
      case 'motore': return <Settings size={size} color={color} />;
      case 'elettronica': return <FileText size={size} color={color} />;
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    const d = date instanceof Date ? date : date.toDate?.() || new Date(date);
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(d);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('it-IT').format(mileage) + ' km';
  };

  if (loading && !maintenance) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#000' : '#F5F5F7' }]}>
        <LinearGradient
          colors={isDark ? ['#1a1a1a', '#000'] : ['#F5F5F7', '#E8E8ED']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: isDark ? '#fff' : '#000', marginTop: 16 }]}>
          Caricamento dettagli...
        </Text>
      </View>
    );
  }

  if (!maintenance || !vehicle) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: isDark ? '#000' : '#F5F5F7' }]}>
        <AlertCircle size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: isDark ? '#fff' : '#000' }]}>
          Manutenzione non trovata
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            Torna indietro
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const typeColors = getTypeColor(maintenance.type);
  const canEdit = isOwner;
  const showCosts = vehicle.privacySettings?.showCosts !== false;
  const showWorkshop = vehicle.privacySettings?.showMechanics !== false;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={isDark
          ? ['#000000', '#1a1a1a', '#000000']
          : ['#F5F5F7', '#FFFFFF', '#F5F5F7']
        }
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.headerButton, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
          }]}
        >
          <ArrowLeft size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>
            Dettaglio Manutenzione
          </Text>
          <Text style={[styles.headerSubtitle, { color: isDark ? '#999' : '#666' }]}>
            {vehicle.brand} {vehicle.model}
          </Text>
        </View>

        {canEdit && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('EditMaintenance' as never, {
                maintenanceId,
                carId
              } as never)}
              style={[styles.headerButton, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                marginRight: 8
              }]}
            >
              <Edit size={20} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.headerButton, {
                backgroundColor: 'rgba(244, 67, 54, 0.15)'
              }]}
            >
              <Trash2 size={20} color="#F44336" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          isLargeScreen && styles.contentContainerLarge
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
        {/* Type Badge Header */}
        <GlassCard style={styles.typeBadgeCard}>
          <LinearGradient
            colors={[typeColors.from, typeColors.to]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.typeBadgeGradient}
          >
            <View style={styles.typeBadgeIcon}>
              {getTypeIcon(maintenance.type, 32, '#fff')}
            </View>
            <Text style={styles.typeBadgeText}>
              {getTypeLabel(maintenance.type)}
            </Text>
            {maintenance.warranty && (
              <View style={styles.warrantyBadge}>
                <Shield size={16} color="#fff" />
                <Text style={styles.warrantyBadgeText}>In Garanzia</Text>
              </View>
            )}
          </LinearGradient>
        </GlassCard>

        {/* Main Info Section */}
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color={isDark ? '#fff' : '#000'} />
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
              Informazioni Principali
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Calendar size={18} color={isDark ? '#999' : '#666'} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: isDark ? '#999' : '#666' }]}>
                  Data Intervento
                </Text>
                <Text style={[styles.infoValue, { color: isDark ? '#fff' : '#000' }]}>
                  {formatDate(maintenance.date)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <TrendingUp size={18} color={isDark ? '#999' : '#666'} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: isDark ? '#999' : '#666' }]}>
                  Chilometraggio
                </Text>
                <Text style={[styles.infoValue, { color: isDark ? '#fff' : '#000' }]}>
                  {formatMileage(maintenance.mileage)}
                </Text>
              </View>
            </View>
          </View>

          {maintenance.description && (
            <>
              <View style={styles.infoDivider} />
              <View style={styles.descriptionContainer}>
                <Text style={[styles.infoLabel, { color: isDark ? '#999' : '#666', marginBottom: 8 }]}>
                  Descrizione
                </Text>
                <Text style={[styles.descriptionText, { color: isDark ? '#fff' : '#000' }]}>
                  {maintenance.description}
                </Text>
              </View>
            </>
          )}
        </GlassCard>

        {/* Costs Section */}
        {showCosts && maintenance.cost !== undefined && maintenance.cost > 0 && (
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Euro size={20} color={isDark ? '#fff' : '#000'} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
                Costi
              </Text>
            </View>

            <View style={styles.costRow}>
              <Text style={[styles.costLabel, { color: isDark ? '#999' : '#666' }]}>
                Costo Totale
              </Text>
              <Text style={[styles.costValue, { color: isDark ? '#fff' : '#000' }]}>
                {formatCurrency(maintenance.cost)}
              </Text>
            </View>

            {maintenance.laborCost !== undefined && maintenance.laborCost > 0 && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.costRow}>
                  <Text style={[styles.costSubLabel, { color: isDark ? '#999' : '#666' }]}>
                    Manodopera
                  </Text>
                  <Text style={[styles.costSubValue, { color: isDark ? '#ddd' : '#333' }]}>
                    {formatCurrency(maintenance.laborCost)}
                  </Text>
                </View>
              </>
            )}

            {maintenance.partsCost !== undefined && maintenance.partsCost > 0 && (
              <View style={styles.costRow}>
                <Text style={[styles.costSubLabel, { color: isDark ? '#999' : '#666' }]}>
                  Ricambi
                </Text>
                <Text style={[styles.costSubValue, { color: isDark ? '#ddd' : '#333' }]}>
                  {formatCurrency(maintenance.partsCost)}
                </Text>
              </View>
            )}

            {maintenance.invoiceNumber && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.costRow}>
                  <Text style={[styles.costSubLabel, { color: isDark ? '#999' : '#666' }]}>
                    N° Fattura
                  </Text>
                  <Text style={[styles.costSubValue, { color: isDark ? '#ddd' : '#333' }]}>
                    {maintenance.invoiceNumber}
                  </Text>
                </View>
              </>
            )}
          </GlassCard>
        )}

        {/* Workshop Section */}
        {showWorkshop && (maintenance.workshopName || maintenance.mechanicName) && (
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color={isDark ? '#fff' : '#000'} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
                Officina e Meccanico
              </Text>
            </View>

            {maintenance.workshopName && (
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <MapPin size={18} color={isDark ? '#999' : '#666'} />
                  <View style={styles.infoTextContainer}>
                    <Text style={[styles.infoLabel, { color: isDark ? '#999' : '#666' }]}>
                      Officina
                    </Text>
                    <Text style={[styles.infoValue, { color: isDark ? '#fff' : '#000' }]}>
                      {maintenance.workshopName}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {maintenance.mechanicName && (
              <>
                {maintenance.workshopName && <View style={styles.infoDivider} />}
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <User size={18} color={isDark ? '#999' : '#666'} />
                    <View style={styles.infoTextContainer}>
                      <Text style={[styles.infoLabel, { color: isDark ? '#999' : '#666' }]}>
                        Meccanico
                      </Text>
                      <Text style={[styles.infoValue, { color: isDark ? '#fff' : '#000' }]}>
                        {maintenance.mechanicName}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}

            {maintenance.mechanicPhone && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Phone size={18} color={isDark ? '#999' : '#666'} />
                    <View style={styles.infoTextContainer}>
                      <Text style={[styles.infoLabel, { color: isDark ? '#999' : '#666' }]}>
                        Telefono
                      </Text>
                      <Text style={[styles.infoValue, { color: '#007AFF' }]}>
                        {maintenance.mechanicPhone}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </GlassCard>
        )}

        {/* Parts Section */}
        {maintenance.parts && maintenance.parts.length > 0 && (
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Package size={20} color={isDark ? '#fff' : '#000'} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
                Ricambi Utilizzati
              </Text>
            </View>

            {maintenance.parts.map((part, index) => (
              <View key={index}>
                {index > 0 && <View style={styles.infoDivider} />}
                <View style={styles.partItem}>
                  <View style={styles.partHeader}>
                    <Text style={[styles.partName, { color: isDark ? '#fff' : '#000' }]}>
                      {part.name}
                    </Text>
                    {part.cost && showCosts && (
                      <Text style={[styles.partCost, { color: isDark ? '#4CAF50' : '#45A049' }]}>
                        {formatCurrency(part.cost)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.partDetails}>
                    <Text style={[styles.partDetail, { color: isDark ? '#999' : '#666' }]}>
                      Quantità: {part.quantity}
                    </Text>
                    {part.brand && (
                      <Text style={[styles.partDetail, { color: isDark ? '#999' : '#666' }]}>
                        • {part.brand}
                      </Text>
                    )}
                    {part.partNumber && (
                      <Text style={[styles.partDetail, { color: isDark ? '#999' : '#666' }]}>
                        • Cod: {part.partNumber}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </GlassCard>
        )}

        {/* Warranty Section */}
        {maintenance.warranty && (
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield size={20} color="#4CAF50" />
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
                Garanzia
              </Text>
            </View>

            <View style={styles.warrantyInfo}>
              <CheckCircle size={18} color="#4CAF50" />
              <Text style={[styles.warrantyText, { color: isDark ? '#fff' : '#000' }]}>
                Questo intervento è coperto da garanzia
              </Text>
            </View>

            {maintenance.warrantyExpiry && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Calendar size={18} color={isDark ? '#999' : '#666'} />
                    <View style={styles.infoTextContainer}>
                      <Text style={[styles.infoLabel, { color: isDark ? '#999' : '#666' }]}>
                        Scadenza Garanzia
                      </Text>
                      <Text style={[styles.infoValue, { color: isDark ? '#fff' : '#000' }]}>
                        {formatDate(maintenance.warrantyExpiry)}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </GlassCard>
        )}

        {/* Next Service Section */}
        {(maintenance.nextServiceDate || maintenance.nextServiceMileage) && (
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color="#FF9800" />
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
                Prossimo Intervento
              </Text>
            </View>

            {maintenance.nextServiceDate && (
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Calendar size={18} color={isDark ? '#999' : '#666'} />
                  <View style={styles.infoTextContainer}>
                    <Text style={[styles.infoLabel, { color: isDark ? '#999' : '#666' }]}>
                      Data Prevista
                    </Text>
                    <Text style={[styles.infoValue, { color: isDark ? '#fff' : '#000' }]}>
                      {formatDate(maintenance.nextServiceDate)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {maintenance.nextServiceMileage && (
              <>
                {maintenance.nextServiceDate && <View style={styles.infoDivider} />}
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <TrendingUp size={18} color={isDark ? '#999' : '#666'} />
                    <View style={styles.infoTextContainer}>
                      <Text style={[styles.infoLabel, { color: isDark ? '#999' : '#666' }]}>
                        Chilometraggio Previsto
                      </Text>
                      <Text style={[styles.infoValue, { color: isDark ? '#fff' : '#000' }]}>
                        {formatMileage(maintenance.nextServiceMileage)}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </GlassCard>
        )}

        {/* Notes Section */}
        {maintenance.notes && (
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color={isDark ? '#fff' : '#000'} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
                Note Aggiuntive
              </Text>
            </View>

            <Text style={[styles.notesText, { color: isDark ? '#ddd' : '#333' }]}>
              {maintenance.notes}
            </Text>
          </GlassCard>
        )}

        {/* Metadata Section (only for owner) */}
        {isOwner && (
          <GlassCard style={[styles.section, { opacity: 0.7 }]}>
            <View style={styles.metadataRow}>
              <Text style={[styles.metadataLabel, { color: isDark ? '#666' : '#999' }]}>
                Creato il
              </Text>
              <Text style={[styles.metadataValue, { color: isDark ? '#666' : '#999' }]}>
                {formatDate(maintenance.createdAt)}
              </Text>
            </View>
            {maintenance.updatedAt && maintenance.updatedAt !== maintenance.createdAt && (
              <View style={styles.metadataRow}>
                <Text style={[styles.metadataLabel, { color: isDark ? '#666' : '#999' }]}>
                  Modificato il
                </Text>
                <Text style={[styles.metadataValue, { color: isDark ? '#666' : '#999' }]}>
                  {formatDate(maintenance.updatedAt)}
                </Text>
              </View>
            )}
          </GlassCard>
        )}

        {/* Spacer */}
        <View style={{ height: 40 }} />
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
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 24 : 16,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  contentContainerLarge: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },

  // Type Badge
  typeBadgeCard: {
    padding: 0,
    marginBottom: 20,
  },
  typeBadgeGradient: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  typeBadgeText: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  warrantyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  warrantyBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Section
  section: {
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  },

  // Info
  infoRow: {
    marginVertical: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    marginVertical: 12,
  },
  descriptionContainer: {
    marginTop: 4,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },

  // Costs
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  costLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  costValue: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  costSubLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  costSubValue: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Parts
  partItem: {
    paddingVertical: 4,
  },
  partHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  partName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  partCost: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 12,
  },
  partDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  partDetail: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Warranty
  warrantyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  warrantyText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },

  // Notes
  notesText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },

  // Metadata
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  metadataLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  metadataValue: {
    fontSize: 12,
    fontWeight: '600',
  },
});

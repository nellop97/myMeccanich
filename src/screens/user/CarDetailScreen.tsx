// src/screens/user/CarDetailScreen.tsx
import React, { useState, useCallback, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Share,
  Alert,
  Animated,
  Dimensions,
  PanResponder
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  Plus,
  Share as ShareIcon,
  Settings,
  Wrench,
  DollarSign,
  FileText,
  Calendar,
  MapPin,
  Fuel,
  Car,
  CreditCard,
  Shield,
  Clipboard,
  Image,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  ChevronRight,
  Eye,
  Edit
} from 'lucide-react-native';

import { useStore } from '../../store';
import { useUserCarsStore } from '@/src/store/useCarsStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface RouteParams {
  carId: string;
}

const CarDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { carId } = route.params as RouteParams;
  const { darkMode } = useStore();
  const { getCarById, getCarStats } = useUserCarsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const bottomSheetAnim = useRef(new Animated.Value(screenHeight)).current;

  const car = getCarById(carId);
  const stats = getCarStats(carId);

  useFocusEffect(
    useCallback(() => {
      if (!car) {
        Alert.alert('Errore', 'Auto non trovata', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    }, [car, navigation])
  );

  if (!car) {
    return null;
  }

  const fallbackTheme = {
    background: darkMode ? '#121212' : '#f5f5f5',
    cardBackground: darkMode ? '#1e1e1e' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#a0a0a0' : '#666666',
    primary: '#007AFF',
    border: darkMode ? '#333333' : '#e0e0e0',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    info: '#5AC8FA'
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${car.model} (${car.year}) - ${car.licensePlate}\nChilometraggio: ${car.currentMileage?.toLocaleString()} km\nManutenzioni: ${stats.maintenanceCount}\nSpese totali: ${formatCurrency(stats.totalExpenses)}`,
        title: 'Dettagli Auto'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const showBottomSheet = () => {
    setBottomSheetVisible(true);
    Animated.spring(bottomSheetAnim, {
      toValue: screenHeight * 0.3,
      useNativeDriver: false,
      tension: 100,
      friction: 8
    }).start();
  };

  const hideBottomSheet = () => {
    Animated.spring(bottomSheetAnim, {
      toValue: screenHeight,
      useNativeDriver: false,
      tension: 100,
      friction: 8
    }).start(() => setBottomSheetVisible(false));
  };

  // Mock data for recent activities
  const recentMaintenanceRecords = car.maintenanceRecords?.slice(0, 3) || [];
  const recentExpenses = [
    {
      id: '1',
      description: 'Rifornimento',
      amount: 65.50,
      category: 'fuel',
      date: '2024-11-15',
      location: 'Eni Via Milano'
    },
    {
      id: '2',
      description: 'Cambio olio motore',
      amount: 120.00,
      category: 'maintenance',
      date: '2024-11-10',
      location: 'Autofficina Rossi'
    }
  ];

  const recentDocuments = [
    {
      id: '1',
      name: 'Assicurazione Auto',
      type: 'insurance',
      expiryDate: '2024-12-31'
    },
    {
      id: '2',
      name: 'Revisione Auto',
      type: 'inspection',
      expiryDate: '2026-03-20'
    }
  ];

  // Card Components
  const QuickStatsCard = () => (
    <View style={[styles.card, { backgroundColor: fallbackTheme.cardBackground }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: fallbackTheme.text }]}>Panoramica Rapida</Text>
        <TouchableOpacity onPress={showBottomSheet}>
          <Eye size={20} color={fallbackTheme.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: fallbackTheme.primary }]}>
            {car.currentMileage?.toLocaleString() || '0'} km
          </Text>
          <Text style={[styles.statLabel, { color: fallbackTheme.textSecondary }]}>Chilometraggio</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: fallbackTheme.success }]}>
            {stats.maintenanceCount}
          </Text>
          <Text style={[styles.statLabel, { color: fallbackTheme.textSecondary }]}>Manutenzioni</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: fallbackTheme.warning }]}>
            {formatCurrency(stats.totalExpenses)}
          </Text>
          <Text style={[styles.statLabel, { color: fallbackTheme.textSecondary }]}>Spese Totali</Text>
        </View>
      </View>
    </View>
  );

  const MaintenanceCard = () => (
    <View style={[styles.card, { backgroundColor: fallbackTheme.cardBackground }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.cardIcon, { backgroundColor: fallbackTheme.info + '20' }]}>
            <Wrench size={20} color={fallbackTheme.info} />
          </View>
          <Text style={[styles.cardTitle, { color: fallbackTheme.text }]}>Manutenzioni</Text>
        </View>
        <TouchableOpacity 
          style={styles.cardAction}
          onPress={() => navigation.navigate('CarMaintenance', { carId })}
        >
          <ChevronRight size={20} color={fallbackTheme.textSecondary} />
        </TouchableOpacity>
      </View>

      {recentMaintenanceRecords.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: fallbackTheme.textSecondary }]}>
            Nessuna manutenzione registrata
          </Text>
          <TouchableOpacity 
            style={[styles.emptyButton, { backgroundColor: fallbackTheme.info }]}
            onPress={() => navigation.navigate('AddMaintenance', { carId })}
          >
            <Plus size={16} color="#ffffff" />
            <Text style={styles.emptyButtonText}>Aggiungi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cardContent}>
          {recentMaintenanceRecords.map((record) => (
            <View key={record.id} style={styles.listItem}>
              <View style={styles.listItemContent}>
                <Text style={[styles.listItemTitle, { color: fallbackTheme.text }]}>
                  {record.description}
                </Text>
                <Text style={[styles.listItemSubtitle, { color: fallbackTheme.textSecondary }]}>
                  {formatDate(record.date)} • {formatCurrency(record.cost || 0)}
                </Text>
              </View>
              <View style={[
                styles.statusDot, 
                { backgroundColor: record.status === 'completed' ? fallbackTheme.success : fallbackTheme.warning }
              ]} />
            </View>
          ))}

          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('CarMaintenance', { carId })}
          >
            <Text style={[styles.viewAllText, { color: fallbackTheme.primary }]}>
              Vedi tutte le manutenzioni
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const ExpensesCard = () => (
    <View style={[styles.card, { backgroundColor: fallbackTheme.cardBackground }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.cardIcon, { backgroundColor: fallbackTheme.warning + '20' }]}>
            <DollarSign size={20} color={fallbackTheme.warning} />
          </View>
          <Text style={[styles.cardTitle, { color: fallbackTheme.text }]}>Spese Recenti</Text>
        </View>
        <TouchableOpacity 
          style={styles.cardAction}
          onPress={() => navigation.navigate('CarExpenses', { carId })}
        >
          <ChevronRight size={20} color={fallbackTheme.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContent}>
        {recentExpenses.map((expense) => (
          <View key={expense.id} style={styles.listItem}>
            <View style={styles.listItemContent}>
              <Text style={[styles.listItemTitle, { color: fallbackTheme.text }]}>
                {expense.description}
              </Text>
              <Text style={[styles.listItemSubtitle, { color: fallbackTheme.textSecondary }]}>
                {formatDate(expense.date)} • {expense.location}
              </Text>
            </View>
            <Text style={[styles.listItemAmount, { color: fallbackTheme.text }]}>
              {formatCurrency(expense.amount)}
            </Text>
          </View>
        ))}

        <View style={styles.expenseActions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: fallbackTheme.primary }]}
              onPress={() => navigation.navigate('AddFuel', { carId })}
            >
              <Text style={styles.actionButtonText}>+ Rifornimento</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: fallbackTheme.warning }]}
              onPress={() => navigation.navigate('AddExpense', { carId })}
            >
              <Text style={styles.actionButtonText}>+ Spesa</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('CarExpenses', { carId })}
          >
            <Text style={[styles.viewAllText, { color: fallbackTheme.primary }]}>
              Vedi tutte le spese
            </Text>
          </TouchableOpacity>
      </View>
    </View>
  );

  const DocumentsCard = () => (
    <View style={[styles.card, { backgroundColor: fallbackTheme.cardBackground }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.cardIcon, { backgroundColor: fallbackTheme.success + '20' }]}>
            <FileText size={20} color={fallbackTheme.success} />
          </View>
          <Text style={[styles.cardTitle, { color: fallbackTheme.text }]}>Documenti</Text>
        </View>
        <TouchableOpacity 
          style={styles.cardAction}
          onPress={() => navigation.navigate('CarDocuments', { carId })}
        >
          <ChevronRight size={20} color={fallbackTheme.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContent}>
        {recentDocuments.map((document) => (
          <View key={document.id} style={styles.listItem}>
            <View style={styles.listItemContent}>
              <Text style={[styles.listItemTitle, { color: fallbackTheme.text }]}>
                {document.name}
              </Text>
              <Text style={[styles.listItemSubtitle, { color: fallbackTheme.textSecondary }]}>
                Scadenza: {formatDate(document.expiryDate)}
              </Text>
            </View>
            <View style={[
              styles.statusDot, 
              { backgroundColor: new Date(document.expiryDate) > new Date() ? fallbackTheme.success : fallbackTheme.error }
            ]} />
          </View>
        ))}

        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('CarDocuments', { carId })}
        >
          <Text style={[styles.viewAllText, { color: fallbackTheme.primary }]}>
            Vedi tutti i documenti
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const AlertsCard = () => {
    const hasAlerts = stats.maintenanceCount > 0; // Mock condition

    if (!hasAlerts) return null;

    return (
      <View style={[styles.card, styles.alertCard, { 
        backgroundColor: fallbackTheme.cardBackground,
        borderLeftColor: fallbackTheme.warning
      }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.cardIcon, { backgroundColor: fallbackTheme.warning + '20' }]}>
              <AlertTriangle size={20} color={fallbackTheme.warning} />
            </View>
            <Text style={[styles.cardTitle, { color: fallbackTheme.text }]}>Richiede Attenzione</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.alertText, { color: fallbackTheme.textSecondary }]}>
            2 manutenzioni in scadenza nei prossimi 30 giorni
          </Text>
          <TouchableOpacity 
            style={[styles.alertButton, { backgroundColor: fallbackTheme.warning }]}
            onPress={() => navigation.navigate('CarMaintenance', { carId })}
          >
            <Text style={styles.alertButtonText}>Vedi Dettagli</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Bottom Sheet Component
  const BottomSheet = () => (
    <Animated.View 
      style={[
        styles.bottomSheet,
        {
          backgroundColor: fallbackTheme.cardBackground,
          transform: [{ translateY: bottomSheetAnim }]
        }
      ]}
    >
      <View style={styles.bottomSheetHandle} />

      <View style={styles.bottomSheetHeader}>
        <Text style={[styles.bottomSheetTitle, { color: fallbackTheme.text }]}>
          Dettagli Completi
        </Text>
        <TouchableOpacity onPress={hideBottomSheet}>
          <Text style={[styles.bottomSheetClose, { color: fallbackTheme.primary }]}>
            Chiudi
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.bottomSheetContent}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: fallbackTheme.textSecondary }]}>Marca</Text>
          <Text style={[styles.detailValue, { color: fallbackTheme.text }]}>{car.make}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: fallbackTheme.textSecondary }]}>Modello</Text>
          <Text style={[styles.detailValue, { color: fallbackTheme.text }]}>{car.model}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: fallbackTheme.textSecondary }]}>Anno</Text>
          <Text style={[styles.detailValue, { color: fallbackTheme.text }]}>{car.year}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: fallbackTheme.textSecondary }]}>Targa</Text>
          <Text style={[styles.detailValue, { color: fallbackTheme.text }]}>{car.licensePlate}</Text>
        </View>
        {car.vin && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: fallbackTheme.textSecondary }]}>VIN</Text>
            <Text style={[styles.detailValue, { color: fallbackTheme.text }]}>{car.vin}</Text>
          </View>
        )}
        {car.owner?.name && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: fallbackTheme.textSecondary }]}>Proprietario</Text>
            <Text style={[styles.detailValue, { color: fallbackTheme.text }]}>{car.owner.name}</Text>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: fallbackTheme.background }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: fallbackTheme.cardBackground, borderBottomColor: fallbackTheme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={fallbackTheme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={[styles.headerTitle, { color: fallbackTheme.text }]}>{car.make} {car.model}</Text>
          <Text style={[styles.headerSubtitle, { color: fallbackTheme.textSecondary }]}>{car.licensePlate}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => navigation.navigate('EditCar', { carId })}
          >
            <Edit size={20} color={fallbackTheme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={handleShare}
          >
            <ShareIcon size={20} color={fallbackTheme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => navigation.navigate('TransferCar', { carId })}
          >
            <Car size={20} color={fallbackTheme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={fallbackTheme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <QuickStatsCard />
        <AlertsCard />
        <MaintenanceCard />
        <ExpensesCard />
        <DocumentsCard />
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: fallbackTheme.primary }]}
          onPress={() => navigation.navigate('AddMaintenance', { carId })}
        >
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      {bottomSheetVisible && (
        <>
          <TouchableOpacity 
            style={styles.bottomSheetOverlay}
            onPress={hideBottomSheet}
            activeOpacity={1}
          />
          <BottomSheet />
        </>
      )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerAction: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },

  // Card Styles
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardAction: {
    padding: 4,
  },
  cardContent: {
    gap: 12,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },

  // List Items
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 14,
  },
  listItemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 12,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    marginBottom: 12,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  // View All Button
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Alert Card
  alertCard: {
    borderLeftWidth: 4,
  },
  alertText: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  alertButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  alertButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fab: {
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

  // Bottom Sheet
  bottomSheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: screenHeight * 0.7,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bottomSheetClose: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },

  // New styles for expense actions
  expenseActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CarDetailScreen;
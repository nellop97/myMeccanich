// src/screens/user/CarDetailScreen.tsx
import React, { useState, useCallback } from 'react';
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
  Alert
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  MoreVertical,
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
  Film,
  Eye,
  Download,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react-native';

import { useStore } from '../../store';
import { useUserCarsStore } from '@/src/store/useCarsStore';

export interface RouteParams {
  carId: string;
}

const CarDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { carId } = route.params as RouteParams;
  const { darkMode } = useStore();
  const { getCarById, getCarStats } = useUserCarsStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

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
        message: `${car.model} (${car.year}) - ${car.licensePlate}\nChilometraggio: ${car.mileage?.toLocaleString()} km\nManutenzioni: ${stats.maintenanceCount}\nSpese totali: ${formatCurrency(stats.totalExpenses)}`,
        title: 'Dettagli Auto'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Mock data per i tab (da sostituire con dati reali dal tuo store)
  const mockMaintenanceRecords = car.repairs || [];
  const mockExpenses = [
    {
      id: '1',
      carId,
      description: 'Rifornimento',
      amount: 65.50,
      category: 'fuel',
      date: '2024-11-15',
      location: 'Eni Via Milano'
    },
    {
      id: '2',
      carId,
      description: 'Cambio olio motore',
      amount: 120.00,
      category: 'maintenance',
      date: '2024-11-10',
      location: 'Autofficina Rossi'
    },
    {
      id: '3',
      carId,
      description: 'Assicurazione mensile',
      amount: 85.00,
      category: 'insurance',
      date: '2024-11-01'
    },
    {
      id: '4',
      carId,
      description: 'Parcheggio centro',
      amount: 12.50,
      category: 'parking',
      date: '2024-11-14',
      location: 'Piazza Duomo'
    }
  ];

  const mockDocuments = [
    {
      id: '1',
      carId,
      name: 'Assicurazione Auto',
      type: 'insurance',
      fileName: 'assicurazione_2024.pdf',
      fileSize: 245760,
      mimeType: 'application/pdf',
      uploadDate: '2024-01-15',
      expiryDate: '2024-12-31',
      description: 'Polizza assicurativa RCA'
    },
    {
      id: '2',
      carId,
      name: 'Libretto di Circolazione',
      type: 'registration',
      fileName: 'libretto_circolazione.pdf',
      fileSize: 189440,
      mimeType: 'application/pdf',
      uploadDate: '2024-01-10',
      description: 'Documento di circolazione del veicolo'
    },
    {
      id: '3',
      carId,
      name: 'Revisione Auto',
      type: 'inspection',
      fileName: 'revisione_2024.pdf',
      fileSize: 156720,
      mimeType: 'application/pdf',
      uploadDate: '2024-03-20',
      expiryDate: '2026-03-20',
      description: 'Certificato di revisione periodica'
    }
  ];

  const TabButton = ({ id, title, active }: { id: string; title: string; active: boolean }) => (
    <TouchableOpacity
      style={[styles.tabButton, active && styles.tabButtonActive]}
      onPress={() => setActiveTab(id)}
    >
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  // Helper functions
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'fuel': return Fuel;
      case 'maintenance': return Wrench;
      case 'insurance': return CreditCard;
      case 'parking': return Car;
      default: return DollarSign;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'fuel': return fallbackTheme.warning;
      case 'maintenance': return fallbackTheme.info;
      case 'insurance': return fallbackTheme.success;
      case 'parking': return fallbackTheme.primary;
      default: return fallbackTheme.textSecondary;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'fuel': return 'Carburante';
      case 'maintenance': return 'Manutenzione';
      case 'insurance': return 'Assicurazione';
      case 'parking': return 'Parcheggio';
      default: return 'Altro';
    }
  };

  const getDocumentIcon = (type: string, mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Film;
    
    switch (type) {
      case 'insurance': return Shield;
      case 'registration': return Car;
      case 'inspection': return CheckCircle;
      case 'maintenance': return Clipboard;
      case 'receipt': return CreditCard;
      default: return FileText;
    }
  };

  const getDocumentColor = (type: string) => {
    switch (type) {
      case 'insurance': return fallbackTheme.success;
      case 'registration': return fallbackTheme.primary;
      case 'inspection': return fallbackTheme.info;
      case 'maintenance': return fallbackTheme.warning;
      case 'receipt': return '#9B59B6';
      case 'photo': return '#E67E22';
      case 'video': return '#E74C3C';
      default: return fallbackTheme.textSecondary;
    }
  };

  const getDocumentTypeName = (type: string) => {
    switch (type) {
      case 'insurance': return 'Assicurazione';
      case 'registration': return 'Documenti Auto';
      case 'inspection': return 'Revisione';
      case 'maintenance': return 'Manutenzione';
      case 'receipt': return 'Ricevute';
      case 'photo': return 'Foto';
      case 'video': return 'Video';
      default: return 'Altro';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return fallbackTheme.success;
      case 'in-progress': return fallbackTheme.info;
      case 'scheduled': return fallbackTheme.warning;
      default: return fallbackTheme.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completato';
      case 'in-progress': return 'In corso';
      case 'scheduled': return 'Programmato';
      default: return 'Sconosciuto';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Componente Overview Tab
  const OverviewTab = () => (
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
      {/* Car Info Card */}
      <View style={[styles.carInfoCard, { backgroundColor: fallbackTheme.cardBackground }]}>
        <View style={styles.carHeader}>
          <View style={styles.carMainInfo}>
            <Text style={[styles.carTitle, { color: fallbackTheme.text }]}>{car.model}</Text>
            <Text style={[styles.carSubtitle, { color: fallbackTheme.textSecondary }]}>
              {car.year} • {car.licensePlate}
            </Text>
            <Text style={[styles.carMileage, { color: fallbackTheme.primary }]}>
              {car.mileage?.toLocaleString() || 0} km
            </Text>
          </View>
        </View>

        {/* Car Details */}
        <View style={[styles.carDetailsSection, { borderTopColor: fallbackTheme.border }]}>
          <Text style={[styles.sectionTitle, { color: fallbackTheme.text }]}>Dettagli Veicolo</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: fallbackTheme.textSecondary }]}>Marca</Text>
              <Text style={[styles.detailValue, { color: fallbackTheme.text }]}>{car.make}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: fallbackTheme.textSecondary }]}>Modello</Text>
              <Text style={[styles.detailValue, { color: fallbackTheme.text }]}>{car.model}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: fallbackTheme.textSecondary }]}>Anno</Text>
              <Text style={[styles.detailValue, { color: fallbackTheme.text }]}>{car.year}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: fallbackTheme.textSecondary }]}>Carburante</Text>
              <Text style={[styles.detailValue, { color: fallbackTheme.text }]}>{car.fuelType || 'Non specificato'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={[styles.statsSection, { backgroundColor: fallbackTheme.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: fallbackTheme.text }]}>Statistiche</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: fallbackTheme.primary }]}>
              {stats.maintenanceCount.toString()}
            </Text>
            <Text style={[styles.statLabel, { color: fallbackTheme.textSecondary }]}>Manutenzioni</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: fallbackTheme.primary }]}>
              {formatCurrency(stats.totalExpenses)}
            </Text>
            <Text style={[styles.statLabel, { color: fallbackTheme.textSecondary }]}>Spese Totali</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // Componente Maintenance Tab - Ora con contenuto reale
  const MaintenanceTab = () => (
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
      {/* Stats Cards */}
      <View style={styles.quickStatsContainer}>
        <View style={[styles.statCard, { backgroundColor: fallbackTheme.cardBackground }]}>
          <View style={[styles.statIcon, { backgroundColor: fallbackTheme.success + '20' }]}>
            <CheckCircle size={20} color={fallbackTheme.success} />
          </View>
          <View style={styles.statInfo}>
            <Text style={[styles.statValue, { color: fallbackTheme.text }]}>
              {mockMaintenanceRecords.filter(r => r.status === 'completed').length}
            </Text>
            <Text style={[styles.statTitle, { color: fallbackTheme.textSecondary }]}>Completate</Text>
          </View>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: fallbackTheme.cardBackground }]}>
          <View style={[styles.statIcon, { backgroundColor: fallbackTheme.warning + '20' }]}>
            <Clock size={20} color={fallbackTheme.warning} />
          </View>
          <View style={styles.statInfo}>
            <Text style={[styles.statValue, { color: fallbackTheme.text }]}>
              {mockMaintenanceRecords.filter(r => r.status === 'scheduled').length}
            </Text>
            <Text style={[styles.statTitle, { color: fallbackTheme.textSecondary }]}>Programmate</Text>
          </View>
        </View>
      </View>

      {/* Maintenance List */}
      {mockMaintenanceRecords.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: fallbackTheme.cardBackground }]}>
          <Wrench size={48} color={fallbackTheme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: fallbackTheme.text }]}>Nessuna manutenzione</Text>
          <Text style={[styles.emptySubtitle, { color: fallbackTheme.textSecondary }]}>
            Non ci sono ancora manutenzioni registrate per questo veicolo
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: fallbackTheme.primary }]}
            onPress={() => navigation.navigate('AddMaintenance', { carId })}
          >
            <Plus size={16} color="#ffffff" />
            <Text style={styles.emptyButtonText}>Aggiungi Manutenzione</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.itemsList}>
          {mockMaintenanceRecords.slice(0, 3).map((record) => (
            <TouchableOpacity
              key={record.id}
              style={[styles.itemCard, { backgroundColor: fallbackTheme.cardBackground }]}
              onPress={() => navigation.navigate('MaintenanceDetail', { carId, maintenanceId: record.id })}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.itemIcon, { backgroundColor: getStatusColor(record.status) + '20' }]}>
                    <Wrench size={20} color={getStatusColor(record.status)} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.itemTitle, { color: fallbackTheme.text }]}>
                      {record.description}
                    </Text>
                    <Text style={[styles.itemSubtitle, { color: fallbackTheme.textSecondary }]}>
                      {getStatusText(record.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardHeaderRight}>
                  <Text style={[styles.itemAmount, { color: fallbackTheme.text }]}>
                    {formatCurrency(record.totalCost || 0)}
                  </Text>
                  <Text style={[styles.itemDate, { color: fallbackTheme.textSecondary }]}>
                    {formatDate(record.scheduledDate)}
                  </Text>
                </View>
              </View>

              {record.workshop && (
                <View style={styles.itemDetails}>
                  <MapPin size={12} color={fallbackTheme.textSecondary} />
                  <Text style={[styles.itemDetailText, { color: fallbackTheme.textSecondary }]}>
                    {record.workshop}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.viewAllButton, { backgroundColor: fallbackTheme.primary }]}
        onPress={() => navigation.navigate('CarMaintenance', { carId })}
      >
        <Text style={styles.viewAllButtonText}>Vedi tutte le manutenzioni</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Componente Expenses Tab - Ora con contenuto reale
  const ExpensesTab = () => (
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
      {/* Stats Cards */}
      <View style={styles.quickStatsContainer}>
        <View style={[styles.statCard, { backgroundColor: fallbackTheme.cardBackground }]}>
          <View style={[styles.statIcon, { backgroundColor: fallbackTheme.primary + '20' }]}>
            <DollarSign size={20} color={fallbackTheme.primary} />
          </View>
          <View style={styles.statInfo}>
            <Text style={[styles.statValue, { color: fallbackTheme.text }]}>
              {formatCurrency(mockExpenses.reduce((sum, exp) => sum + exp.amount, 0))}
            </Text>
            <Text style={[styles.statTitle, { color: fallbackTheme.textSecondary }]}>Totale</Text>
          </View>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: fallbackTheme.cardBackground }]}>
          <View style={[styles.statIcon, { backgroundColor: fallbackTheme.warning + '20' }]}>
            <Fuel size={20} color={fallbackTheme.warning} />
          </View>
          <View style={styles.statInfo}>
            <Text style={[styles.statValue, { color: fallbackTheme.text }]}>
              {formatCurrency(mockExpenses.filter(e => e.category === 'fuel').reduce((sum, e) => sum + e.amount, 0))}
            </Text>
            <Text style={[styles.statTitle, { color: fallbackTheme.textSecondary }]}>Carburante</Text>
          </View>
        </View>
      </View>

      {/* Expenses List */}
      {mockExpenses.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: fallbackTheme.cardBackground }]}>
          <DollarSign size={48} color={fallbackTheme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: fallbackTheme.text }]}>Nessuna spesa</Text>
          <Text style={[styles.emptySubtitle, { color: fallbackTheme.textSecondary }]}>
            Non ci sono ancora spese registrate per questo veicolo
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: fallbackTheme.primary }]}
            onPress={() => navigation.navigate('AddExpense', { carId })}
          >
            <Plus size={16} color="#ffffff" />
            <Text style={styles.emptyButtonText}>Aggiungi Spesa</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.itemsList}>
          {mockExpenses.slice(0, 5).map((expense) => {
            const CategoryIcon = getCategoryIcon(expense.category);
            const categoryColor = getCategoryColor(expense.category);

            return (
              <TouchableOpacity
                key={expense.id}
                style={[styles.itemCard, { backgroundColor: fallbackTheme.cardBackground }]}
                onPress={() => navigation.navigate('ExpenseDetail', { expenseId: expense.id })}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={[styles.itemIcon, { backgroundColor: categoryColor + '20' }]}>
                      <CategoryIcon size={20} color={categoryColor} />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={[styles.itemTitle, { color: fallbackTheme.text }]}>
                        {expense.description}
                      </Text>
                      <Text style={[styles.itemSubtitle, { color: fallbackTheme.textSecondary }]}>
                        {getCategoryName(expense.category)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardHeaderRight}>
                    <Text style={[styles.itemAmount, { color: fallbackTheme.text }]}>
                      {formatCurrency(expense.amount)}
                    </Text>
                    <Text style={[styles.itemDate, { color: fallbackTheme.textSecondary }]}>
                      {formatDate(expense.date)}
                    </Text>
                  </View>
                </View>

                {expense.location && (
                  <View style={styles.itemDetails}>
                    <MapPin size={12} color={fallbackTheme.textSecondary} />
                    <Text style={[styles.itemDetailText, { color: fallbackTheme.textSecondary }]}>
                      {expense.location}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        style={[styles.viewAllButton, { backgroundColor: fallbackTheme.primary }]}
        onPress={() => navigation.navigate('CarExpenses', { carId })}
      >
        <Text style={styles.viewAllButtonText}>Vedi tutte le spese</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Componente Documents Tab - Ora con contenuto reale
  const DocumentsTab = () => (
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
      {/* Stats Cards */}
      <View style={styles.quickStatsContainer}>
        <View style={[styles.statCard, { backgroundColor: fallbackTheme.cardBackground }]}>
          <View style={[styles.statIcon, { backgroundColor: fallbackTheme.primary + '20' }]}>
            <FileText size={20} color={fallbackTheme.primary} />
          </View>
          <View style={styles.statInfo}>
            <Text style={[styles.statValue, { color: fallbackTheme.text }]}>
              {mockDocuments.length}
            </Text>
            <Text style={[styles.statTitle, { color: fallbackTheme.textSecondary }]}>Documenti</Text>
          </View>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: fallbackTheme.cardBackground }]}>
          <View style={[styles.statIcon, { backgroundColor: fallbackTheme.info + '20' }]}>
            <Image size={20} color={fallbackTheme.info} />
          </View>
          <View style={styles.statInfo}>
            <Text style={[styles.statValue, { color: fallbackTheme.text }]}>
              {mockDocuments.filter(d => d.mimeType.startsWith('image/')).length}
            </Text>
            <Text style={[styles.statTitle, { color: fallbackTheme.textSecondary }]}>Foto</Text>
          </View>
        </View>
      </View>

      {/* Documents List */}
      {mockDocuments.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: fallbackTheme.cardBackground }]}>
          <FileText size={48} color={fallbackTheme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: fallbackTheme.text }]}>Nessun documento</Text>
          <Text style={[styles.emptySubtitle, { color: fallbackTheme.textSecondary }]}>
            Non ci sono ancora documenti caricati per questo veicolo
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: fallbackTheme.primary }]}
            onPress={() => navigation.navigate('AddDocument', { carId })}
          >
            <Plus size={16} color="#ffffff" />
            <Text style={styles.emptyButtonText}>Aggiungi Documento</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.itemsList}>
          {mockDocuments.map((document) => {
            const DocumentIcon = getDocumentIcon(document.type, document.mimeType);
            const documentColor = getDocumentColor(document.type);

            return (
              <TouchableOpacity
                key={document.id}
                style={[styles.itemCard, { backgroundColor: fallbackTheme.cardBackground }]}
                onPress={() => navigation.navigate('DocumentViewer', { documentId: document.id })}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={[styles.itemIcon, { backgroundColor: documentColor + '20' }]}>
                      <DocumentIcon size={20} color={documentColor} />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={[styles.itemTitle, { color: fallbackTheme.text }]}>
                        {document.name}
                      </Text>
                      <Text style={[styles.itemSubtitle, { color: fallbackTheme.textSecondary }]}>
                        {getDocumentTypeName(document.type)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardHeaderRight}>
                    <Text style={[styles.itemAmount, { color: fallbackTheme.text }]}>
                      {formatFileSize(document.fileSize)}
                    </Text>
                    <Text style={[styles.itemDate, { color: fallbackTheme.textSecondary }]}>
                      {formatDate(document.uploadDate)}
                    </Text>
                  </View>
                </View>

                {document.expiryDate && (
                  <View style={styles.itemDetails}>
                    <Calendar size={12} color={fallbackTheme.textSecondary} />
                    <Text style={[styles.itemDetailText, { color: fallbackTheme.textSecondary }]}>
                      Scadenza: {formatDate(document.expiryDate)}
                    </Text>
                  </View>
                )}

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: fallbackTheme.primary + '20' }]}
                    onPress={() => navigation.navigate('DocumentViewer', { documentId: document.id })}
                  >
                    <Eye size={14} color={fallbackTheme.primary} />
                    <Text style={[styles.actionButtonText, { color: fallbackTheme.primary }]}>
                      Visualizza
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: fallbackTheme.info + '20' }]}
                    onPress={() => {
                      // Logica per scaricare il documento
                      Alert.alert('Download', 'Funzione di download non ancora implementata');
                    }}
                  >
                    <Download size={14} color={fallbackTheme.info} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        style={[styles.viewAllButton, { backgroundColor: fallbackTheme.primary }]}
        onPress={() => navigation.navigate('CarDocuments', { carId })}
      >
        <Text style={styles.viewAllButtonText}>Vedi tutti i documenti</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Rendering del contenuto del tab attivo
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'maintenance':
        return <MaintenanceTab />;
      case 'expenses':
        return <ExpensesTab />;
      case 'documents':
        return <DocumentsTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: fallbackTheme.background }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { backgroundColor: fallbackTheme.cardBackground, borderBottomColor: fallbackTheme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={fallbackTheme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={[styles.headerTitle, { color: fallbackTheme.text }]}>{car.model}</Text>
          <Text style={[styles.headerSubtitle, { color: fallbackTheme.textSecondary }]}>{car.licensePlate}</Text>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={handleShare}
        >
          <ShareIcon size={24} color={fallbackTheme.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabsContainer, { backgroundColor: fallbackTheme.cardBackground, borderBottomColor: fallbackTheme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TabButton 
            id="overview" 
            title="Panoramica" 
            active={activeTab === 'overview'} 
          />
          <TabButton 
            id="maintenance" 
            title="Manutenzioni" 
            active={activeTab === 'maintenance'} 
          />
          <TabButton 
            id="expenses" 
            title="Spese" 
            active={activeTab === 'expenses'} 
          />
          <TabButton 
            id="documents" 
            title="Documenti" 
            active={activeTab === 'documents'} 
          />
        </ScrollView>
      </View>

      {/* Contenuto del tab attivo */}
      <View style={styles.tabContentContainer}>
        {renderTabContent()}
      </View>

     
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  moreButton: {
    marginLeft: 16,
  },
  tabsContainer: {
    borderBottomWidth: 1,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#007AFF',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  tabButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContentContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  
  // Overview tab styles
  carInfoCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  carHeader: {
    marginBottom: 16,
  },
  carMainInfo: {
    flex: 1,
  },
  carTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  carSubtitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  carMileage: {
    fontSize: 18,
    fontWeight: '600',
  },
  carDetailsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
  },
  detailLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsSection: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
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

  // Common tab styles
  quickStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    marginTop: 2,
  },

  // Item card styles
  itemsList: {
    gap: 12,
  },
  itemCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 14,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 12,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  itemDetailText: {
    fontSize: 12,
    marginLeft: 6,
  },

  // Action buttons
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
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

  // View all button
  viewAllButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  viewAllButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  quickActionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CarDetailScreen;
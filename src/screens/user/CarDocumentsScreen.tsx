// src/screens/user/CarDocumentsScreen.tsx
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Calendar,
  FileText,
  Download,
  Share,
  Eye,
  AlertTriangle,
  CheckCircle,
  Car,
  CreditCard,
  Shield,
  Clipboard,
  Image,
  Film
} from 'lucide-react-native';

import { useStore } from '../../store';
import { useUserCarsStore } from '@/src/store/useCarsStore';

interface RouteParams {
  carId: string;
}

interface Document {
  id: string;
  carId: string;
  name: string;
  type: 'insurance' | 'registration' | 'inspection' | 'maintenance' | 'receipt' | 'photo' | 'video' | 'other';
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadDate: string;
  expiryDate?: string;
  description?: string;
  tags?: string[];
}

const CarDocumentsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { carId } = route.params as RouteParams;
  const { darkMode } = useStore();
  const { getCarById } = useUserCarsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const car = getCarById(carId);

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

  // Mock data - in una vera app questi dati verrebbero dal database
  const mockDocuments: Document[] = [
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
      description: 'Polizza assicurativa RCA',
      tags: ['assicurazione', 'RCA', '2024']
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
    },
    {
      id: '4',
      carId,
      name: 'Fattura Cambio Olio',
      type: 'receipt',
      fileName: 'fattura_cambio_olio.jpg',
      fileSize: 2048000,
      mimeType: 'image/jpeg',
      uploadDate: '2024-11-10',
      description: 'Ricevuta manutenzione cambio olio'
    },
    {
      id: '5',
      carId,
      name: 'Foto Danni Anteriori',
      type: 'photo',
      fileName: 'danni_anteriori.jpg',
      fileSize: 3145728,
      mimeType: 'image/jpeg',
      uploadDate: '2024-10-05',
      description: 'Documentazione danni minori al paraurti'
    }
  ];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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

  const isDocumentExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isDocumentExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || doc.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const documentStats = {
    totalCount: mockDocuments.length,
    expiredCount: mockDocuments.filter(doc => isDocumentExpired(doc.expiryDate)).length,
    expiringSoonCount: mockDocuments.filter(doc => isDocumentExpiringSoon(doc.expiryDate)).length,
    photoCount: mockDocuments.filter(doc => doc.mimeType.startsWith('image/')).length,
    pdfCount: mockDocuments.filter(doc => doc.mimeType === 'application/pdf').length
  };

  const DocumentCard = ({ document }: { document: Document }) => {
    const DocumentIcon = getDocumentIcon(document.type, document.mimeType);
    const documentColor = getDocumentColor(document.type);
    const isExpired = isDocumentExpired(document.expiryDate);
    const isExpiringSoon = isDocumentExpiringSoon(document.expiryDate);

    return (
      <TouchableOpacity
        style={[
          styles.documentCard,
          { backgroundColor: fallbackTheme.cardBackground },
          isExpired && { borderColor: fallbackTheme.error, borderWidth: 2 },
          isExpiringSoon && { borderColor: fallbackTheme.warning, borderWidth: 1 }
        ]}
        onPress={() => navigation.navigate('DocumentViewer', { documentId: document.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.documentIcon, { backgroundColor: documentColor + '20' }]}>
              <DocumentIcon size={24} color={documentColor} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.documentTitle, { color: fallbackTheme.text }]}>
                {document.name}
              </Text>
              <Text style={[styles.documentType, { color: fallbackTheme.textSecondary }]}>
                {getDocumentTypeName(document.type)}
              </Text>
              <View style={styles.documentMeta}>
                <Text style={[styles.fileInfo, { color: fallbackTheme.textSecondary }]}>
                  {formatFileSize(document.fileSize)} • {formatDate(document.uploadDate)}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.cardHeaderRight}>
            {isExpired && (
              <View style={[styles.statusBadge, { backgroundColor: fallbackTheme.error + '20' }]}>
                <AlertTriangle size={12} color={fallbackTheme.error} />
                <Text style={[styles.statusText, { color: fallbackTheme.error }]}>Scaduto</Text>
              </View>
            )}
            {isExpiringSoon && !isExpired && (
              <View style={[styles.statusBadge, { backgroundColor: fallbackTheme.warning + '20' }]}>
                <AlertTriangle size={12} color={fallbackTheme.warning} />
                <Text style={[styles.statusText, { color: fallbackTheme.warning }]}>In scadenza</Text>
              </View>
            )}
          </View>
        </View>

        {document.expiryDate && (
          <View style={styles.expiryInfo}>
            <Calendar size={14} color={fallbackTheme.textSecondary} />
            <Text style={[styles.expiryText, { color: fallbackTheme.textSecondary }]}>
              Scadenza: {formatDate(document.expiryDate)}
            </Text>
          </View>
        )}

        {document.description && (
          <Text style={[styles.documentDescription, { color: fallbackTheme.textSecondary }]}>
            {document.description}
          </Text>
        )}

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: fallbackTheme.primary + '20' }]}
            onPress={() => navigation.navigate('DocumentViewer', { documentId: document.id })}
          >
            <Eye size={16} color={fallbackTheme.primary} />
            <Text style={[styles.actionButtonText, { color: fallbackTheme.primary }]}>
              Visualizza
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: fallbackTheme.success + '20' }]}
            onPress={() => {
              // Logica per condividere il documento
              Alert.alert('Condividi', 'Funzione di condivisione non ancora implementata');
            }}
          >
            <Share size={16} color={fallbackTheme.success} />
            <Text style={[styles.actionButtonText, { color: fallbackTheme.success }]}>
              Condividi
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: fallbackTheme.info + '20' }]}
            onPress={() => {
              // Logica per scaricare il documento
              Alert.alert('Download', 'Funzione di download non ancora implementata');
            }}
          >
            <Download size={16} color={fallbackTheme.info} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const StatCard = ({ title, value, icon: Icon, iconColor, alert }: any) => (
    <View style={[styles.statCard, { backgroundColor: fallbackTheme.cardBackground }]}>
      <View style={[styles.statIcon, { backgroundColor: iconColor + '20' }]}>
        <Icon size={20} color={iconColor} />
      </View>
      <View style={styles.statInfo}>
        <Text style={[styles.statValue, { color: fallbackTheme.text }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: fallbackTheme.textSecondary }]}>{title}</Text>
      </View>
      {alert && (
        <View style={[styles.alertDot, { backgroundColor: fallbackTheme.error }]} />
      )}
    </View>
  );

  const FilterChip = ({ title, value, active, count }: any) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        { backgroundColor: active ? fallbackTheme.primary : fallbackTheme.border }
      ]}
      onPress={() => setSelectedFilter(value)}
    >
      <Text style={[
        styles.filterChipText,
        { color: active ? '#ffffff' : fallbackTheme.textSecondary }
      ]}>
        {title}
        {count !== undefined && (
          <Text style={styles.filterChipCount}>
            {' '}({count})
          </Text>
        )}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: fallbackTheme.background }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: fallbackTheme.cardBackground, borderBottomColor: fallbackTheme.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={fallbackTheme.text} />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={[styles.headerTitle, { color: fallbackTheme.text }]}>
              Documenti
            </Text>
            <Text style={[styles.headerSubtitle, { color: fallbackTheme.textSecondary }]}>
              {car.make} {car.model}
            </Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: fallbackTheme.cardBackground }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: fallbackTheme.background, borderColor: fallbackTheme.border }]}>
          <Search size={20} color={fallbackTheme.textSecondary} />
          <Text
            style={[styles.searchInput, { color: fallbackTheme.text }]}
            placeholder="Cerca documenti..."
            placeholderTextColor={fallbackTheme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
          <StatCard
            title="Totale Documenti"
            value={documentStats.totalCount.toString()}
            icon={FileText}
            iconColor={fallbackTheme.primary}
          />
          <StatCard
            title="Scaduti"
            value={documentStats.expiredCount.toString()}
            icon={AlertTriangle}
            iconColor={fallbackTheme.error}
            alert={documentStats.expiredCount > 0}
          />
          <StatCard
            title="In Scadenza"
            value={documentStats.expiringSoonCount.toString()}
            icon={Calendar}
            iconColor={fallbackTheme.warning}
            alert={documentStats.expiringSoonCount > 0}
          />
          <StatCard
            title="PDF"
            value={documentStats.pdfCount.toString()}
            icon={FileText}
            iconColor={fallbackTheme.info}
          />
          <StatCard
            title="Foto"
            value={documentStats.photoCount.toString()}
            icon={Image}
            iconColor={fallbackTheme.success}
          />
        </ScrollView>
      </View>

      {/* Expiry Alerts */}
      {(documentStats.expiredCount > 0 || documentStats.expiringSoonCount > 0) && (
        <View style={[styles.alertContainer, { backgroundColor: fallbackTheme.cardBackground }]}>
          {documentStats.expiredCount > 0 && (
            <View style={[styles.alertCard, { backgroundColor: fallbackTheme.error + '10', borderColor: fallbackTheme.error }]}>
              <AlertTriangle size={20} color={fallbackTheme.error} />
              <Text style={[styles.alertText, { color: fallbackTheme.error }]}>
                {documentStats.expiredCount} documento{documentStats.expiredCount > 1 ? 'i' : ''} scadut{documentStats.expiredCount > 1 ? 'i' : 'o'}
              </Text>
            </View>
          )}
          {documentStats.expiringSoonCount > 0 && (
            <View style={[styles.alertCard, { backgroundColor: fallbackTheme.warning + '10', borderColor: fallbackTheme.warning }]}>
              <AlertTriangle size={20} color={fallbackTheme.warning} />
              <Text style={[styles.alertText, { color: fallbackTheme.warning }]}>
                {documentStats.expiringSoonCount} documento{documentStats.expiringSoonCount > 1 ? 'i' : ''} in scadenza entro 30 giorni
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: fallbackTheme.cardBackground }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterChip title="Tutti" value="all" active={selectedFilter === 'all'} />
          <FilterChip title="Assicurazione" value="insurance" active={selectedFilter === 'insurance'} />
          <FilterChip title="Documenti Auto" value="registration" active={selectedFilter === 'registration'} />
          <FilterChip title="Revisione" value="inspection" active={selectedFilter === 'inspection'} />
          <FilterChip title="Manutenzione" value="maintenance" active={selectedFilter === 'maintenance'} />
          <FilterChip title="Ricevute" value="receipt" active={selectedFilter === 'receipt'} />
          <FilterChip title="Foto" value="photo" active={selectedFilter === 'photo'} />
        </ScrollView>
      </View>

      {/* Documents List */}
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
        {filteredDocuments.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={64} color={fallbackTheme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: fallbackTheme.text }]}>
              {searchQuery ? "Nessun risultato" : "Nessun documento"}
            </Text>
            <Text style={[styles.emptySubtitle, { color: fallbackTheme.textSecondary }]}>
              {searchQuery
                ? "Prova a modificare i criteri di ricerca"
                : "Non ci sono ancora documenti caricati per questo veicolo"
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: fallbackTheme.primary }]}
                onPress={() => navigation.navigate('AddDocument', { carId })}
              >
                <Plus size={20} color="#ffffff" />
                <Text style={styles.emptyButtonText}>Aggiungi Documento</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.documentsList}>
            {filteredDocuments.map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: fallbackTheme.primary }]}
        onPress={() => navigation.navigate('AddDocument', { carId })}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  statsContainer: {
    paddingVertical: 8,
  },
  statsScroll: {
    paddingHorizontal: 16,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 12,
    minWidth: 120,
    position: 'relative',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
  },
  alertDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  alertText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  filtersContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipCount: {
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  documentsList: {
    gap: 16,
  },
  documentCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  documentType: {
    fontSize: 14,
    marginBottom: 4,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileInfo: {
    fontSize: 12,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  expiryText: {
    fontSize: 14,
  },
  documentDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default CarDocumentsScreen;
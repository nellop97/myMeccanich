import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  FlatList,
  StatusBar
} from 'react-native';

const CarDocumentsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  const mockDocuments = [
    {
      id: '1',
      name: 'Assicurazione Auto',
      type: 'insurance',
      uploadDate: '2024-01-15',
      expiryDate: '2024-12-31',
      fileSize: 245760,
      mimeType: 'application/pdf'
    },
    {
      id: '2',
      name: 'Libretto di Circolazione',
      type: 'registration',
      uploadDate: '2024-01-10',
      fileSize: 189440,
      mimeType: 'application/pdf'
    },
    {
      id: '3',
      name: 'Revisione Auto',
      type: 'inspection',
      uploadDate: '2024-03-20',
      expiryDate: '2026-03-20',
      fileSize: 156720,
      mimeType: 'application/pdf'
    }
  ];

  const getDocumentIcon = (type) => {
    switch (type) {
      case 'insurance': return '🛡️';
      case 'registration': return '🚗';
      case 'inspection': return '✅';
      default: return '📄';
    }
  };

  const getDocumentColor = (type) => {
    switch (type) {
      case 'insurance': return '#10B981';
      case 'registration': return '#3B82F6';
      case 'inspection': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const formatFileSize = (bytes) => {
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const DocumentCard = ({ document }) => (
    <TouchableOpacity style={styles.documentCard}>
      <View style={styles.documentHeader}>
        <View style={styles.documentIconContainer}>
          <View style={[styles.documentIcon, { backgroundColor: getDocumentColor(document.type) }]}>
            <Text style={styles.documentIconText}>{getDocumentIcon(document.type)}</Text>
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentName}>{document.name}</Text>
            <Text style={styles.documentMeta}>
              {formatFileSize(document.fileSize)} • {formatDate(document.uploadDate)}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.documentAction}>
          <Text style={styles.icon}>👁️</Text>
        </TouchableOpacity>
      </View>
      
      {document.expiryDate && (
        <View style={styles.documentFooter}>
          <Text style={styles.expiryText}>
            Scadenza: {formatDate(document.expiryDate)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.icon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Documenti</Text>
          <Text style={styles.subtitle}>Toyota Yaris</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.icon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca documenti..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{mockDocuments.length}</Text>
          <Text style={styles.statLabel}>Documenti</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>2</Text>
          <Text style={styles.statLabel}>In Scadenza</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>1</Text>
          <Text style={styles.statLabel}>Scaduti</Text>
        </View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        {[
          { key: 'all', label: 'Tutti' },
          { key: 'insurance', label: 'Assicurazione' },
          { key: 'registration', label: 'Documenti' },
          { key: 'inspection', label: 'Revisione' }
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              selectedFilter === filter.key && styles.filterChipActive
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === filter.key && styles.filterTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Documents List */}
      <ScrollView style={styles.documentsContainer} showsVerticalScrollIndicator={false}>
        {mockDocuments.map((document) => (
          <DocumentCard key={document.id} document={document} />
        ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTitle: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', color: '#1F2937' },
  subtitle: { fontSize: 16, color: '#6B7280' },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: { padding: 20, backgroundColor: '#FFFFFF' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: { fontSize: 20, marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: '#1F2937' },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  statLabel: { fontSize: 14, color: '#6B7280' },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  filterText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  filterTextActive: { color: '#FFFFFF' },
  documentsContainer: { flex: 1, padding: 20 },
  documentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  documentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  documentIconContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  documentIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  documentIconText: { fontSize: 24 },
  documentInfo: { flex: 1 },
  documentName: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  documentMeta: { fontSize: 14, color: '#6B7280' },
  documentAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentFooter: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  expiryText: { fontSize: 14, color: '#F59E0B', fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  fabIcon: { fontSize: 28, color: '#FFFFFF', fontWeight: '300' },
  icon: { fontSize: 20, color: '#374151' },
});

export default CarDocumentsScreen;

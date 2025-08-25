// src/screens/user/DocumentsListScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  FileText,
  Shield,
  CreditCard,
  File,
  Calendar,
  Download,
  Share2,
  Trash2,
  Plus,
  Camera,
  Upload,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Car,
  Filter,
  Search,
  Eye,
  Edit3,
  Image as ImageIcon,
  Paperclip,
} from 'lucide-react-native';
import { FAB, Chip, ProgressBar } from 'react-native-paper';
import { useAppThemeManager } from '../../hooks/useTheme';
import { useUserData } from '../../hooks/useUserData';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import DocumentPicker from 'react-native-document-picker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

interface Document {
  id: string;
  vehicleId: string;
  type: 'insurance' | 'registration' | 'license' | 'tax' | 'inspection' | 'invoice' | 'other';
  title: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  expiryDate?: Date;
  issueDate?: Date;
  uploadedAt: Date;
  updatedAt: Date;
  tags?: string[];
}

const DocumentsListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, isDark } = useAppThemeManager();
  const { vehicles, refreshData } = useUserData();

  const carId = route.params?.carId;
  const [documents, setDocuments] = useState<Document[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<string>(carId || 'all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Document types configuration
  const documentTypes = [
    { 
      id: 'insurance', 
      label: 'Assicurazione', 
      icon: Shield, 
      color: '#34C759',
      hasExpiry: true,
      description: 'Polizza assicurativa RCA'
    },
    { 
      id: 'registration', 
      label: 'Libretto', 
      icon: Car, 
      color: '#007AFF',
      hasExpiry: false,
      description: 'Carta di circolazione'
    },
    { 
      id: 'license', 
      label: 'Patente', 
      icon: CreditCard, 
      color: '#5856D6',
      hasExpiry: true,
      description: 'Patente di guida'
    },
    { 
      id: 'tax', 
      label: 'Bollo', 
      icon: FileText, 
      color: '#FF9500',
      hasExpiry: true,
      description: 'Tassa automobilistica'
    },
    { 
      id: 'inspection', 
      label: 'Revisione', 
      icon: CheckCircle, 
      color: '#FF3B30',
      hasExpiry: true,
      description: 'Certificato di revisione'
    },
    { 
      id: 'invoice', 
      label: 'Fatture', 
      icon: File, 
      color: '#8E8E93',
      hasExpiry: false,
      description: 'Fatture e ricevute'
    },
    { 
      id: 'other', 
      label: 'Altri', 
      icon: Paperclip, 
      color: '#8E8E93',
      hasExpiry: false,
      description: 'Altri documenti'
    },
  ];

  useEffect(() => {
    loadDocuments();
  }, [selectedVehicle]);

  const loadDocuments = async () => {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) return;

      let query = firestore()
        .collection('users')
        .doc(userId)
        .collection('documents');

      if (selectedVehicle !== 'all') {
        query = query.where('vehicleId', '==', selectedVehicle);
      }

      const documentsSnapshot = await query.orderBy('uploadedAt', 'desc').get();

      const loadedDocuments = documentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiryDate: doc.data().expiryDate?.toDate(),
        issueDate: doc.data().issueDate?.toDate(),
        uploadedAt: doc.data().uploadedAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Document[];

      setDocuments(loadedDocuments);
    } catch (error) {
      console.error('Errore caricamento documenti:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    await refreshData();
    setRefreshing(false);
  };

  const getDocumentStatus = (doc: Document) => {
    if (!doc.expiryDate) return 'valid';

    const now = new Date();
    const expiryDate = new Date(doc.expiryDate);
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'expiring';
    return 'valid';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expired': return colors.error;
      case 'expiring': return colors.warning;
      case 'valid': return colors.success;
      default: return colors.onSurfaceVariant;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'expired': return 'Scaduto';
      case 'expiring': return 'In scadenza';
      case 'valid': return 'Valido';
      default: return '';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleUploadDocument = async (type: string) => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
      });

      if (result && result[0]) {
        setIsUploading(true);
        setUploadProgress(0);

        const file = result[0];
        const userId = auth().currentUser?.uid;
        if (!userId) return;

        // Upload to Firebase Storage
        const fileName = `${Date.now()}_${file.name}`;
        const reference = storage().ref(`documents/${userId}/${fileName}`);

        const task = reference.putFile(file.uri);

        task.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            Alert.alert('Errore', 'Errore durante il caricamento del documento');
            setIsUploading(false);
          },
          async () => {
            // Get download URL
            const downloadURL = await reference.getDownloadURL();

            // Save document metadata to Firestore
            const documentData = {
              vehicleId: selectedVehicle === 'all' ? vehicles[0]?.id : selectedVehicle,
              type: type,
              title: file.name,
              fileName: file.name,
              fileUrl: downloadURL,
              fileSize: file.size,
              fileType: file.type,
              uploadedAt: firestore.FieldValue.serverTimestamp(),
              updatedAt: firestore.FieldValue.serverTimestamp(),
              userId: userId,
            };

            await firestore()
              .collection('users')
              .doc(userId)
              .collection('documents')
              .add(documentData);

            setIsUploading(false);
            setShowUploadModal(false);
            await loadDocuments();

            Alert.alert('Successo', 'Documento caricato con successo');
          }
        );
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled
      } else {
        Alert.alert('Errore', 'Errore nella selezione del documento');
      }
    }
  };

  const handleTakePhoto = async (type: string) => {
    const options = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    launchCamera(options, async (response) => {
      if (response.didCancel || response.errorMessage || !response.assets) {
        return;
      }

      const asset = response.assets[0];
      if (!asset.uri) return;

      setIsUploading(true);
      setUploadProgress(0);

      try {
        const userId = auth().currentUser?.uid;
        if (!userId) return;

        const fileName = `${Date.now()}_photo.jpg`;
        const reference = storage().ref(`documents/${userId}/${fileName}`);

        const task = reference.putFile(asset.uri);

        task.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            Alert.alert('Errore', 'Errore durante il caricamento della foto');
            setIsUploading(false);
          },
          async () => {
            const downloadURL = await reference.getDownloadURL();

            const documentData = {
              vehicleId: selectedVehicle === 'all' ? vehicles[0]?.id : selectedVehicle,
              type: type,
              title: `Foto ${type}`,
              fileName: fileName,
              fileUrl: downloadURL,
              fileSize: asset.fileSize,
              fileType: 'image/jpeg',
              uploadedAt: firestore.FieldValue.serverTimestamp(),
              updatedAt: firestore.FieldValue.serverTimestamp(),
              userId: userId,
            };

            await firestore()
              .collection('users')
              .doc(userId)
              .collection('documents')
              .add(documentData);

            setIsUploading(false);
            setShowUploadModal(false);
            await loadDocuments();

            Alert.alert('Successo', 'Foto salvata con successo');
          }
        );
      } catch (error) {
        Alert.alert('Errore', 'Errore durante il salvataggio della foto');
        setIsUploading(false);
      }
    });
  };

  const deleteDocument = async (docId: string, title: string) => {
    Alert.alert(
      'Elimina Documento',
      `Sei sicuro di voler eliminare "${title}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = auth().currentUser?.uid;
              if (!userId) return;

              await firestore()
                .collection('users')
                .doc(userId)
                .collection('documents')
                .doc(docId)
                .delete();

              await loadDocuments();
              Alert.alert('Successo', 'Documento eliminato');
            } catch (error) {
              Alert.alert('Errore', 'Impossibile eliminare il documento');
            }
          },
        },
      ]
    );
  };

  const DocumentCard = ({ document }: { document: Document }) => {
    const docType = documentTypes.find(t => t.id === document.type);
    const Icon = docType?.icon || File;
    const color = docType?.color || colors.primary;
    const status = getDocumentStatus(document);
    const vehicle = vehicles.find(v => v.id === document.vehicleId);

    return (
      <TouchableOpacity
        style={[styles.documentCard, { backgroundColor: colors.surface }]}
        onPress={() => {
          setSelectedDocument(document);
          setShowPreviewModal(true);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.documentHeader}>
          <View style={[styles.documentIcon, { backgroundColor: color + '20' }]}>
            <Icon size={24} color={color} />
          </View>
          <View style={styles.documentInfo}>
            <Text style={[styles.documentTitle, { color: colors.onSurface }]}>
              {document.title}
            </Text>
            <Text style={[styles.documentType, { color: colors.onSurfaceVariant }]}>
              {docType?.label} • {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Veicolo'}
            </Text>
            {document.expiryDate && (
              <View style={styles.expiryInfo}>
                <Calendar size={12} color={getStatusColor(status)} />
                <Text style={[styles.expiryText, { color: getStatusColor(status) }]}>
                  {status === 'expired' 
                    ? `Scaduto il ${document.expiryDate.toLocaleDateString('it-IT')}`
                    : `Scade il ${document.expiryDate.toLocaleDateString('it-IT')}`
                  }
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.documentActions}>
          {document.expiryDate && (
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(status) + '20' }
            ]}>
              <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                {getStatusText(status)}
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => {
              if (document.fileUrl) {
                Linking.openURL(document.fileUrl);
              }
            }}
          >
            <Eye size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const UploadModal = () => (
    <Modal
      visible={showUploadModal}
      transparent
      animationType="slide"
      onRequestClose={() => !isUploading && setShowUploadModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
              Aggiungi Documento
            </Text>
            <TouchableOpacity 
              onPress={() => setShowUploadModal(false)}
              disabled={isUploading}
            >
              <X size={24} color={colors.onSurface} />
            </TouchableOpacity>
          </View>

          {isUploading ? (
            <View style={styles.uploadProgress}>
              <Text style={[styles.uploadingText, { color: colors.onSurface }]}>
                Caricamento in corso...
              </Text>
              <ProgressBar progress={uploadProgress / 100} color={colors.primary} />
              <Text style={[styles.progressText, { color: colors.onSurfaceVariant }]}>
                {Math.round(uploadProgress)}%
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.modalSubtitle, { color: colors.onSurfaceVariant }]}>
                Seleziona il tipo di documento
              </Text>

              <ScrollView style={styles.typesList}>
                {documentTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <View key={type.id} style={styles.typeSection}>
                      <View style={[styles.typeHeader, { backgroundColor: colors.surfaceVariant }]}>
                        <Icon size={20} color={type.color} />
                        <Text style={[styles.typeName, { color: colors.onSurface }]}>
                          {type.label}
                        </Text>
                      </View>
                      <View style={styles.uploadOptions}>
                        <TouchableOpacity
                          style={[styles.uploadOption, { backgroundColor: colors.primaryContainer }]}
                          onPress={() => handleUploadDocument(type.id)}
                        >
                          <Upload size={20} color={colors.onPrimaryContainer} />
                          <Text style={[styles.uploadOptionText, { color: colors.onPrimaryContainer }]}>
                            Carica File
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.uploadOption, { backgroundColor: colors.secondaryContainer }]}
                          onPress={() => handleTakePhoto(type.id)}
                        >
                          <Camera size={20} color={colors.onSecondaryContainer} />
                          <Text style={[styles.uploadOptionText, { color: colors.onSecondaryContainer }]}>
                            Scatta Foto
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    if (selectedFilter !== 'all' && doc.type !== selectedFilter) return false;
    return true;
  });

  // Group documents by status
  const expiredDocs = filteredDocuments.filter(d => getDocumentStatus(d) === 'expired');
  const expiringDocs = filteredDocuments.filter(d => getDocumentStatus(d) === 'expiring');
  const validDocs = filteredDocuments.filter(d => getDocumentStatus(d) === 'valid' || !d.expiryDate);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with filters */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip
            selected={selectedFilter === 'all'}
            onPress={() => setSelectedFilter('all')}
            style={styles.filterChip}
          >
            Tutti
          </Chip>
          {documentTypes.map(type => (
            <Chip
              key={type.id}
              selected={selectedFilter === type.id}
              onPress={() => setSelectedFilter(type.id)}
              style={styles.filterChip}
            >
              {type.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Expired Documents */}
        {expiredDocs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={20} color={colors.error} />
              <Text style={[styles.sectionTitle, { color: colors.error }]}>
                Documenti Scaduti ({expiredDocs.length})
              </Text>
            </View>
            {expiredDocs.map(doc => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </View>
        )}

        {/* Expiring Documents */}
        {expiringDocs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color={colors.warning} />
              <Text style={[styles.sectionTitle, { color: colors.warning }]}>
                In Scadenza ({expiringDocs.length})
              </Text>
            </View>
            {expiringDocs.map(doc => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </View>
        )}

        {/* Valid Documents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CheckCircle size={20} color={colors.success} />
            <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
              Documenti Validi ({validDocs.length})
            </Text>
          </View>

          {validDocs.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <FileText size={48} color={colors.onSurfaceVariant} />
              <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
                Nessun documento
              </Text>
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                Carica i documenti del tuo veicolo per averli sempre a portata di mano
              </Text>
            </View>
          ) : (
            validDocs.map(doc => (
              <DocumentCard key={doc.id} document={doc} />
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowUploadModal(true)}
      />

      {/* Upload Modal */}
      <UploadModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    elevation: 2,
  },
  filterChip: {
    marginRight: 8,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  documentCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  documentType: {
    fontSize: 14,
    marginBottom: 4,
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  expiryText: {
    fontSize: 12,
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
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
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  typesList: {
    maxHeight: 400,
  },
  typeSection: {
    marginBottom: 16,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '500',
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
  },
  uploadOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  uploadOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  uploadProgress: {
    padding: 20,
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: 16,
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    marginTop: 8,
  },
});

export default DocumentsListScreen;
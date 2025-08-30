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
import { db, auth } from '../../services/firebase';
import { collection, addDoc, deleteDoc, doc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import {
    UniversalImagePicker,
    UniversalDatePicker,
    UniversalDocumentPicker,
} from '../../components';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const storage = getStorage();

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
      label: 'Bollo Auto', 
      icon: FileText, 
      color: '#FF9500',
      hasExpiry: true,
      description: 'Tassa di proprietà'
    },
    { 
      id: 'inspection', 
      label: 'Revisione', 
      icon: CheckCircle, 
      color: '#32D74B',
      hasExpiry: true,
      description: 'Controllo tecnico periodico'
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
      label: 'Altro', 
      icon: Paperclip, 
      color: '#6C6C70',
      hasExpiry: false,
      description: 'Altri documenti'
    },
  ];

  const getDocumentStatus = (document: Document) => {
    if (!document.expiryDate) return { status: 'valid', label: 'Valido', color: '#34C759' };
    
    const now = new Date();
    const expiryDate = new Date(document.expiryDate);
    const daysDiff = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (daysDiff < 0) {
      return { status: 'expired', label: 'Scaduto', color: '#FF3B30' };
    } else if (daysDiff <= 30) {
      return { status: 'expiring', label: 'In scadenza', color: '#FF9500' };
    } else {
      return { status: 'valid', label: 'Valido', color: '#34C759' };
    }
  };

  const loadDocuments = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const documentsRef = collection(db, 'users', userId, 'documents');
      let q = query(documentsRef);
      
      if (selectedVehicle !== 'all') {
        q = query(documentsRef, where('vehicleId', '==', selectedVehicle));
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs: Document[] = [];
        snapshot.forEach((doc) => {
          docs.push({ id: doc.id, ...doc.data() } as Document);
        });
        setDocuments(docs);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    await refreshData();
    setRefreshing(false);
  };

  useEffect(() => {
    const unsubscribe = loadDocuments();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedVehicle]);

  const formatFileSize = (bytes: number) => {
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
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const fileName = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `documents/${userId}/${fileName}`);

        const response = await fetch(file.uri);
        const blob = await response.blob();

        const uploadTask = uploadBytesResumable(storageRef, blob);

        uploadTask.on('state_changed', 
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
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            const documentData = {
              vehicleId: selectedVehicle === 'all' ? 
                (vehicles && vehicles[0] ? vehicles[0].id : selectedVehicle) : 
                selectedVehicle,
              type: type,
              title: file.name,
              fileName: file.name,
              fileUrl: downloadURL,
              fileSize: file.size,
              fileType: file.type,
              uploadedAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              userId: userId,
            };

            const documentsRef = collection(db, 'users', userId, 'documents');
            await addDoc(documentsRef, documentData);

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
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const fileName = `${Date.now()}_photo.jpg`;
        const storageRef = ref(storage, `documents/${userId}/${fileName}`);

        const response = await fetch(asset.uri);
        const blob = await response.blob();

        const uploadTask = uploadBytesResumable(storageRef, blob);

        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            Alert.alert('Errore', 'Errore durante il caricamento della foto');
            setIsUploading(false);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            const documentData = {
              vehicleId: selectedVehicle === 'all' ?
                (vehicles && vehicles[0] ? vehicles[0].id : selectedVehicle) :
                selectedVehicle,
              type: type,
              title: `Foto ${type}`,
              fileName: fileName,
              fileUrl: downloadURL,
              fileSize: asset.fileSize,
              fileType: 'image/jpeg',
              uploadedAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              userId: userId,
            };

            const documentsRef = collection(db, 'users', userId, 'documents');
            await addDoc(documentsRef, documentData);

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
              const userId = auth.currentUser?.uid;
              if (!userId) return;

              const docRef = doc(db, 'users', userId, 'documents', docId);
              await deleteDoc(docRef);

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
              {docType?.label} • {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Tutte le auto'}
            </Text>
          </View>
          <View style={[styles.statusChip, { backgroundColor: status.color + '20' }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        {document.expiryDate && (
          <View style={styles.documentDetails}>
            <Calendar size={16} color={colors.onSurfaceVariant} />
            <Text style={[styles.expiryText, { color: colors.onSurfaceVariant }]}>
              Scade il {new Date(document.expiryDate).toLocaleDateString('it-IT')}
            </Text>
          </View>
        )}

        <View style={styles.documentFooter}>
          <Text style={[styles.uploadDate, { color: colors.onSurfaceVariant }]}>
            Caricato il {new Date(document.uploadedAt).toLocaleDateString('it-IT')}
          </Text>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              deleteDocument(document.id, document.title);
            }}
            style={styles.deleteButton}
          >
            <Trash2 size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredDocuments = documents.filter(doc => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'expiring') {
      const status = getDocumentStatus(doc);
      return status.status === 'expiring' || status.status === 'expired';
    }
    return doc.type === selectedFilter;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <X size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
          Documenti
        </Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {/* Open filter modal */}}
        >
          <Filter size={24} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Vehicle Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.vehicleSelector}
        contentContainerStyle={styles.vehicleSelectorContent}
      >
        <TouchableOpacity
          style={[
            styles.vehicleChip,
            { 
              backgroundColor: selectedVehicle === 'all' ? colors.primary : colors.surface,
              borderColor: colors.outline 
            }
          ]}
          onPress={() => setSelectedVehicle('all')}
        >
          <Text style={[
            styles.vehicleChipText,
            { color: selectedVehicle === 'all' ? colors.onPrimary : colors.onSurface }
          ]}>
            Tutte le auto
          </Text>
        </TouchableOpacity>
        
        {vehicles.map(vehicle => (
          <TouchableOpacity
            key={vehicle.id}
            style={[
              styles.vehicleChip,
              { 
                backgroundColor: selectedVehicle === vehicle.id ? colors.primary : colors.surface,
                borderColor: colors.outline 
              }
            ]}
            onPress={() => setSelectedVehicle(vehicle.id)}
          >
            <Text style={[
              styles.vehicleChipText,
              { color: selectedVehicle === vehicle.id ? colors.onPrimary : colors.onSurface }
            ]}>
              {vehicle.brand} {vehicle.model}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Document Types Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterSelector}
        contentContainerStyle={styles.filterSelectorContent}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            { 
              backgroundColor: selectedFilter === 'all' ? colors.primary : colors.surface,
              borderColor: colors.outline 
            }
          ]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[
            styles.filterChipText,
            { color: selectedFilter === 'all' ? colors.onPrimary : colors.onSurface }
          ]}>
            Tutti
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            { 
              backgroundColor: selectedFilter === 'expiring' ? colors.error : colors.surface,
              borderColor: colors.outline 
            }
          ]}
          onPress={() => setSelectedFilter('expiring')}
        >
          <AlertTriangle size={16} color={selectedFilter === 'expiring' ? colors.onError : colors.error} />
          <Text style={[
            styles.filterChipText,
            { color: selectedFilter === 'expiring' ? colors.onError : colors.error }
          ]}>
            In scadenza
          </Text>
        </TouchableOpacity>
        
        {documentTypes.map(type => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.filterChip,
              { 
                backgroundColor: selectedFilter === type.id ? type.color : colors.surface,
                borderColor: colors.outline 
              }
            ]}
            onPress={() => setSelectedFilter(type.id)}
          >
            <type.icon size={16} color={selectedFilter === type.id ? 'white' : type.color} />
            <Text style={[
              styles.filterChipText,
              { color: selectedFilter === type.id ? 'white' : colors.onSurface }
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Documents List */}
      <ScrollView
        style={styles.documentsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map(document => (
            <DocumentCard key={document.id} document={document} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <File size={64} color={colors.onSurfaceVariant} />
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
              Nessun documento trovato
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
              Aggiungi il primo documento per iniziare
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Upload FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowUploadModal(true)}
      />

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.uploadModal, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                Aggiungi Documento
              </Text>
              <TouchableOpacity 
                onPress={() => setShowUploadModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            {isUploading && (
              <View style={styles.uploadProgress}>
                <ProgressBar 
                  progress={uploadProgress / 100} 
                  color={colors.primary}
                  style={styles.progressBar}
                />
                <Text style={[styles.progressText, { color: colors.onSurface }]}>
                  Caricamento {Math.round(uploadProgress)}%
                </Text>
              </View>
            )}

            <ScrollView style={styles.documentTypesList}>
              {documentTypes.map(type => (
                <View key={type.id} style={styles.documentTypeSection}>
                  <View style={[styles.sectionHeader, { borderBottomColor: colors.outline }]}>
                    <View style={[styles.typeIcon, { backgroundColor: type.color + '20' }]}>
                      <type.icon size={20} color={type.color} />
                    </View>
                    <View style={styles.typeInfo}>
                      <Text style={[styles.typeName, { color: colors.onSurface }]}>
                        {type.label}
                      </Text>
                      <Text style={[styles.typeDescription, { color: colors.onSurfaceVariant }]}>
                        {type.description}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
                      onPress={() => handleUploadDocument(type.id)}
                      disabled={isUploading}
                    >
                      <Upload size={20} color={colors.primary} />
                      <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                        Carica File
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.secondary + '20' }]}
                      onPress={() => handleTakePhoto(type.id)}
                      disabled={isUploading}
                    >
                      <Camera size={20} color={colors.secondary} />
                      <Text style={[styles.actionButtonText, { color: colors.secondary }]}>
                        Scatta Foto
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Document Preview Modal */}
      <Modal
        visible={showPreviewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPreviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.previewModal, { backgroundColor: colors.surface }]}>
            {selectedDocument && (
              <>
                <View style={styles.previewHeader}>
                  <Text style={[styles.previewTitle, { color: colors.onSurface }]}>
                    {selectedDocument.title}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setShowPreviewModal(false)}
                    style={styles.closeButton}
                  >
                    <X size={24} color={colors.onSurface} />
                  </TouchableOpacity>
                </View>

                <View style={styles.previewContent}>
                  {selectedDocument.fileType?.includes('image') ? (
                    <Image 
                      source={{ uri: selectedDocument.fileUrl }} 
                      style={styles.previewImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.filePreview}>
                      <FileText size={64} color={colors.onSurfaceVariant} />
                      <Text style={[styles.fileName, { color: colors.onSurface }]}>
                        {selectedDocument.fileName}
                      </Text>
                      <Text style={[styles.fileSize, { color: colors.onSurfaceVariant }]}>
                        {formatFileSize(selectedDocument.fileSize || 0)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.previewActions}>
                  <TouchableOpacity
                    style={[styles.previewAction, { backgroundColor: colors.primary + '20' }]}
                    onPress={() => {
                      if (selectedDocument.fileUrl) {
                        Linking.openURL(selectedDocument.fileUrl);
                      }
                    }}
                  >
                    <Eye size={20} color={colors.primary} />
                    <Text style={[styles.previewActionText, { color: colors.primary }]}>
                      Visualizza
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.previewAction, { backgroundColor: colors.secondary + '20' }]}
                    onPress={() => {
                      // Share functionality
                    }}
                  >
                    <Share2 size={20} color={colors.secondary} />
                    <Text style={[styles.previewActionText, { color: colors.secondary }]}>
                      Condividi
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.previewAction, { backgroundColor: colors.error + '20' }]}
                    onPress={() => {
                      setShowPreviewModal(false);
                      deleteDocument(selectedDocument.id, selectedDocument.title);
                    }}
                  >
                    <Trash2 size={20} color={colors.error} />
                    <Text style={[styles.previewActionText, { color: colors.error }]}>
                      Elimina
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  filterButton: {
    padding: 8,
  },
  vehicleSelector: {
    marginVertical: 8,
  },
  vehicleSelectorContent: {
    paddingHorizontal: 16,
  },
  vehicleChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  vehicleChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterSelector: {
    marginBottom: 8,
  },
  filterSelectorContent: {
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  documentsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  documentCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  documentType: {
    fontSize: 14,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  documentDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  expiryText: {
    fontSize: 14,
    marginLeft: 6,
  },
  documentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uploadDate: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
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
  uploadModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  uploadProgress: {
    padding: 16,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
  },
  documentTypesList: {
    flex: 1,
  },
  documentTypeSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  typeDescription: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  previewModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  previewContent: {
    flex: 1,
    padding: 16,
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  filePreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  fileSize: {
    fontSize: 14,
  },
  previewActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  previewAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  previewActionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default DocumentsListScreen;
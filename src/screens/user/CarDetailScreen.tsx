// src/screens/user/CarDetailScreen.tsx - REDESIGN COMPLETO con Foto e Documenti
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Platform,
  ActivityIndicator,
  Image,
  Dimensions,
  Alert,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  Edit,
  Wrench,
  Calendar,
  Plus,
  ChevronRight,
  AlertCircle,
  Clock,
  Shield,
  FileText,
  Image as ImageIcon,
  Trash2,
  Download,
  X,
  Upload,
  Eye,
} from 'lucide-react-native';
import { useAppThemeManager } from '../../hooks/useTheme';
import { useUserData } from '../../hooks/useUserData';
import { db, auth } from '../../services/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { MaintenanceService } from '../../services/MaintenanceService';
import { MaintenanceRecord } from '../../types/database.types';
import { useAuth } from '../../hooks/useAuth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface RouteParams {
  carId: string;
}

interface VehiclePhoto {
  id: string;
  base64: string; // Immagine in formato base64
  mimeType: string; // es: 'image/jpeg', 'image/png'
  caption?: string;
  uploadedAt: any;
  vehicleId: string;
  userId: string;
}

interface VehicleDocument {
  id: string;
  name: string;
  type: string;
  base64: string; // Documento in formato base64
  mimeType: string;
  size?: number;
  uploadedAt: any;
  vehicleId: string;
  userId: string;
  expiryDate?: any;
}

const CarDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { carId } = route.params as RouteParams;
  const { colors, isDark } = useAppThemeManager();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const maintenanceService = MaintenanceService.getInstance();

  const {
    vehicles,
    upcomingReminders,
    refreshData,
    loading,
  } = useUserData();

  const [refreshing, setRefreshing] = useState(false);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);
  const [photos, setPhotos] = useState<VehiclePhoto[]>([]);
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<VehiclePhoto | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showPhotoOptionsModal, setShowPhotoOptionsModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<VehicleDocument | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Responsive
  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width >= 768;
  const isDesktop = width >= 1024;
  const photoWidth = isDesktop ? 200 : isLargeScreen ? 150 : (SCREEN_WIDTH - 60) / 3;

  // Helper function to show toast notifications
  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Helper function to convert URI to base64
  const uriToBase64 = async (uri: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(uri);
        const blob = await response.blob();

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Remove the data URI prefix (e.g., "data:image/jpeg;base64,")
          const base64 = base64data.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      } catch (error) {
        reject(error);
      }
    });
  };

  // Get vehicle data
  const vehicle = vehicles.find((v) => v.id === carId);

  // Filter reminders for this vehicle
  const reminders = upcomingReminders
    .filter((reminder) => reminder.vehicleId === carId)
    .slice(0, 10);

  // Load maintenance records
  const loadMaintenanceRecords = async () => {
    if (!user?.uid || !carId) return;

    try {
      setLoadingMaintenance(true);
      console.log('🔧 Loading maintenance records for vehicle:', carId);

      const records = await maintenanceService.getVehicleMaintenanceHistory(carId, user.uid);
      console.log('📊 Loaded maintenance records:', records.length);

      // Take only the 10 most recent
      const recentRecords = records.slice(0, 10);
      setMaintenanceRecords(recentRecords);

      console.log('✅ Maintenance records state updated with', recentRecords.length, 'records');
    } catch (error) {
      console.error('❌ Error loading maintenance records:', error);
    } finally {
      setLoadingMaintenance(false);
    }
  };

  useEffect(() => {
    if (carId) {
      loadPhotos();
      loadDocuments();
      loadMaintenanceRecords();
    }
  }, [carId]);

  // Ricarica dati quando la schermata torna in focus (dopo salvataggio manutenzione)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 CarDetail screen focused, refreshing data...');
      refreshData();
      loadPhotos();
      loadDocuments();
      loadMaintenanceRecords();
    }, [carId])
  );

  const loadPhotos = async () => {
    if (!auth.currentUser) return;

    try {
      setLoadingPhotos(true);
      const photosQuery = query(
        collection(db, 'vehicle_photos'),
        where('vehicleId', '==', carId),
        where('userId', '==', auth.currentUser.uid)
      );

      const snapshot = await getDocs(photosQuery);
      const photosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VehiclePhoto[];

      setPhotos(photosData);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const loadDocuments = async () => {
    if (!auth.currentUser) return;

    try {
      setLoadingDocuments(true);
      const docsQuery = query(
        collection(db, 'documents'),
        where('vehicleId', '==', carId),
        where('userId', '==', auth.currentUser.uid)
      );

      const snapshot = await getDocs(docsQuery);
      const docsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VehicleDocument[];

      setDocuments(docsData);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshData(),
      loadPhotos(),
      loadDocuments()
    ]);
    setRefreshing(false);
  };

  const pickImage = async () => {
    try {
      setShowPhotoOptionsModal(false);

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        showToastMessage('Hai bisogno di abilitare l\'accesso alla galleria', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToastMessage('Impossibile selezionare l\'immagine', 'error');
    }
  };

  const takePhoto = async () => {
    try {
      setShowPhotoOptionsModal(false);

      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        showToastMessage('Hai bisogno di abilitare l\'accesso alla fotocamera', 'error');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showToastMessage('Impossibile scattare la foto', 'error');
    }
  };

  const uploadPhoto = async (uri: string) => {
    if (!auth.currentUser || !vehicle) return;

    try {
      setUploadingPhoto(true);

      // Converti l'immagine in base64
      const base64 = await uriToBase64(uri);

      // Determina il tipo MIME dall'URI
      const mimeType = uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

      // Verifica la dimensione (Firestore ha limite di ~1MB per documento)
      const sizeInBytes = (base64.length * 3) / 4; // Approssimazione della dimensione
      if (sizeInBytes > 900000) { // 900KB per sicurezza
        showToastMessage('L\'immagine è troppo grande. Riduci la qualità o le dimensioni.', 'error');
        return;
      }

      // Salva direttamente in Firestore
      await addDoc(collection(db, 'vehicle_photos'), {
        vehicleId: carId,
        userId: auth.currentUser.uid,
        base64: base64,
        mimeType: mimeType,
        uploadedAt: serverTimestamp(),
      });

      await loadPhotos();
      showToastMessage('Foto caricata con successo!', 'success');
    } catch (error) {
      console.error('Error uploading photo:', error);
      showToastMessage('Impossibile caricare la foto: ' + (error as Error).message, 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const deletePhoto = async (photo: VehiclePhoto) => {
    Alert.alert(
      'Elimina Foto',
      'Sei sicuro di voler eliminare questa foto?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              // Elimina solo da Firestore
              await deleteDoc(doc(db, 'vehicle_photos', photo.id));

              await loadPhotos();
              Alert.alert('Successo', 'Foto eliminata');
            } catch (error) {
              console.error('Error deleting photo:', error);
              Alert.alert('Errore', 'Impossibile eliminare la foto');
            }
          },
        },
      ]
    );
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success' || !result.canceled) {
        // @ts-ignore
        const file = result.assets ? result.assets[0] : result;
        await uploadDocument(file);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      showToastMessage('Impossibile selezionare il documento', 'error');
    }
  };

  const uploadDocument = async (file: any) => {
    if (!auth.currentUser || !vehicle) return;

    try {
      setUploadingDocument(true);

      // Converti il documento in base64
      const base64 = await uriToBase64(file.uri);

      // Verifica la dimensione (Firestore ha limite di ~1MB per documento)
      const sizeInBytes = (base64.length * 3) / 4;
      if (sizeInBytes > 900000) { // 900KB per sicurezza
        showToastMessage('Il file è troppo grande (max 900KB). Prova con un file più piccolo.', 'error');
        return;
      }

      // Salva direttamente in Firestore
      await addDoc(collection(db, 'documents'), {
        vehicleId: carId,
        userId: auth.currentUser.uid,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
        mimeType: file.mimeType || 'application/octet-stream',
        size: file.size,
        base64: base64,
        uploadedAt: serverTimestamp(),
      });

      await loadDocuments();
      showToastMessage('Documento caricato con successo!', 'success');
    } catch (error) {
      console.error('Error uploading document:', error);
      showToastMessage('Impossibile caricare il documento: ' + (error as Error).message, 'error');
    } finally {
      setUploadingDocument(false);
    }
  };

  const downloadDocument = (document: VehicleDocument) => {
    try {
      // Crea un data URI dal base64
      const dataUri = `data:${document.mimeType};base64,${document.base64}`;

      if (Platform.OS === 'web') {
        // Su web crea un link temporaneo e simula il click per scaricare
        const link = window.document.createElement('a');
        link.href = dataUri;
        link.download = document.name;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        showToastMessage('Download avviato!', 'success');
      } else {
        // Su mobile mostra il toast e il documento verrà visualizzato nel modal
        showToastMessage('Documento visualizzato', 'success');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      showToastMessage('Errore durante il download', 'error');
    }
  };

  const deleteDocument = async (document: VehicleDocument) => {
    if (isWeb) {
      // Su web usa conferma nativa
      if (window.confirm(`Sei sicuro di voler eliminare "${document.name}"?`)) {
        try {
          await deleteDoc(doc(db, 'documents', document.id));
          await loadDocuments();
          showToastMessage('Documento eliminato', 'success');
        } catch (error) {
          console.error('Error deleting document:', error);
          showToastMessage('Impossibile eliminare il documento', 'error');
        }
      }
    } else {
      // Su mobile usa Alert.alert
      Alert.alert(
        'Elimina Documento',
        `Sei sicuro di voler eliminare "${document.name}"?`,
        [
          { text: 'Annulla', style: 'cancel' },
          {
            text: 'Elimina',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteDoc(doc(db, 'documents', document.id));
                await loadDocuments();
                showToastMessage('Documento eliminato', 'success');
              } catch (error) {
                console.error('Error deleting document:', error);
                showToastMessage('Impossibile eliminare il documento', 'error');
              }
            },
          },
        ]
      );
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const isOverdue = (dueDate: any) => {
    if (!dueDate) return false;
    const due = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
    return due < new Date();
  };

  const showPhotoOptions = () => {
    if (isWeb) {
      // Su web usa il modale personalizzato
      setShowPhotoOptionsModal(true);
    } else {
      // Su mobile usa Alert.alert()
      Alert.alert(
        'Aggiungi Foto',
        'Scegli come aggiungere la foto',
        [
          {
            text: 'Scatta Foto',
            onPress: takePhoto,
          },
          {
            text: 'Scegli dalla Galleria',
            onPress: pickImage,
          },
          {
            text: 'Annulla',
            style: 'cancel',
          },
        ]
      );
    }
  };

  // Render Photo Modal
  const renderPhotoModal = () => (
    <Modal
      visible={showPhotoModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowPhotoModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowPhotoModal(false)}
      >
        <View style={styles.modalContent}>
          {selectedPhoto && (
            <>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPhotoModal(false)}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>
              <Image
                source={{ uri: `data:${selectedPhoto.mimeType};base64,${selectedPhoto.base64}` }}
                style={styles.modalImage}
                resizeMode="contain"
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: '#EF4444' }]}
                  onPress={() => {
                    setShowPhotoModal(false);
                    deletePhoto(selectedPhoto);
                  }}
                >
                  <Trash2 size={20} color="#fff" />
                  <Text style={styles.modalActionText}>Elimina</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Render Photo Options Modal (for web)
  const renderPhotoOptionsModal = () => (
    <Modal
      visible={showPhotoOptionsModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowPhotoOptionsModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowPhotoOptionsModal(false)}
      >
        <View style={styles.optionsModalContent} onStartShouldSetResponder={() => true}>
          <Text style={[styles.optionsModalTitle, { color: colors.onSurface }]}>
            Aggiungi Foto
          </Text>
          <Text style={[styles.optionsModalSubtitle, { color: colors.onSurfaceVariant }]}>
            Scegli come aggiungere la foto
          </Text>

          <TouchableOpacity
            style={[styles.optionButton, { backgroundColor: colors.primary }]}
            onPress={pickImage}
          >
            <Upload size={20} color="#fff" />
            <Text style={styles.optionButtonText}>Scegli dalla Galleria</Text>
          </TouchableOpacity>

          {!isWeb && (
            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: colors.primary }]}
              onPress={takePhoto}
            >
              <ImageIcon size={20} color="#fff" />
              <Text style={styles.optionButtonText}>Scatta Foto</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.optionButton, styles.cancelButton, { borderColor: colors.outline }]}
            onPress={() => setShowPhotoOptionsModal(false)}
          >
            <X size={20} color={colors.onSurface} />
            <Text style={[styles.optionButtonText, { color: colors.onSurface }]}>Annulla</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Render Document Modal
  const renderDocumentModal = () => (
    <Modal
      visible={showDocumentModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowDocumentModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowDocumentModal(false)}
      >
        <View style={styles.documentModalContent} onStartShouldSetResponder={() => true}>
          {selectedDocument && (
            <>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowDocumentModal(false)}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>

              <View style={styles.documentPreview}>
                <FileText size={80} color={colors.primary} />
                <Text style={[styles.documentModalName, { color: colors.onSurface }]}>
                  {selectedDocument.name}
                </Text>
                <Text style={[styles.documentModalInfo, { color: colors.onSurfaceVariant }]}>
                  {formatFileSize(selectedDocument.size)}
                </Text>
                {selectedDocument.uploadedAt && (
                  <Text style={[styles.documentModalInfo, { color: colors.onSurfaceVariant }]}>
                    Caricato il {formatDate(selectedDocument.uploadedAt)}
                  </Text>
                )}
              </View>

              <View style={styles.documentModalActions}>
                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    downloadDocument(selectedDocument);
                  }}
                >
                  <Download size={20} color="#fff" />
                  <Text style={styles.modalActionText}>Scarica</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: '#EF4444' }]}
                  onPress={() => {
                    setShowDocumentModal(false);
                    deleteDocument(selectedDocument);
                  }}
                >
                  <Trash2 size={20} color="#fff" />
                  <Text style={styles.modalActionText}>Elimina</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Render Toast Notification
  const renderToast = () => {
    if (!showToast) return null;

    return (
      <View style={[
        styles.toast,
        toastType === 'success' ? styles.toastSuccess : styles.toastError,
        isDesktop && styles.toastDesktop
      ]}>
        <Text style={styles.toastText}>{toastMessage}</Text>
      </View>
    );
  };

  if (!vehicle) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: colors.onSurface }]}>
            Veicolo non trovato
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Torna indietro</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const containerStyle = isDesktop ? styles.webContainer : styles.container;
  const contentStyle = isDesktop ? styles.webContent : styles.scrollContent;

  return (
    <SafeAreaView
      style={[
        containerStyle,
        { backgroundColor: isDark ? colors.background : '#F8F9FA' },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
        ]}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={colors.onSurface} strokeWidth={2} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
          Dettagli Veicolo
        </Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => (navigation as any).navigate('AddVehicle', { vehicleId: carId })}
        >
          <Edit size={24} color={colors.onSurface} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={false}
      >
        <View style={isDesktop ? styles.webGrid : undefined}>
          <View style={isDesktop ? styles.webMainColumn : undefined}>
            {/* Vehicle Info Card */}
            <View
              style={[
                styles.vehicleCard,
                { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
              ]}
            >
              <Text style={[styles.vehicleName, { color: colors.onSurface }]}>
                {vehicle.make} {vehicle.model} {vehicle.year}
              </Text>
              <Text style={[styles.vehicleVIN, { color: colors.onSurfaceVariant }]}>
                VIN: {vehicle.vin || '1HGCV2F69JL000000'}
              </Text>
            </View>

            {/* Photos Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  Galleria Foto
                </Text>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: `${colors.primary}15` }]}
                  onPress={showPhotoOptions}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Plus size={20} color={colors.primary} strokeWidth={2.5} />
                      <Text style={[styles.addButtonText, { color: colors.primary }]}>
                        Aggiungi
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {loadingPhotos ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : photos.length === 0 ? (
                <View
                  style={[
                    styles.emptySection,
                    { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
                  ]}
                >
                  <ImageIcon size={32} color={colors.onSurfaceVariant} strokeWidth={1.5} />
                  <Text
                    style={[
                      styles.emptySectionText,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    Nessuna foto caricata
                  </Text>
                </View>
              ) : (
                <View style={[styles.photosGrid, isDesktop && styles.photosGridWeb]}>
                  {photos.map((photo) => (
                    <TouchableOpacity
                      key={photo.id}
                      style={[
                        styles.photoItem,
                        { width: photoWidth, height: photoWidth },
                      ]}
                      onPress={() => {
                        setSelectedPhoto(photo);
                        setShowPhotoModal(true);
                      }}
                    >
                      <Image
                        source={{ uri: `data:${photo.mimeType};base64,${photo.base64}` }}
                        style={styles.photoImage}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.6)']}
                        style={styles.photoOverlay}
                      >
                        <TouchableOpacity
                          style={styles.photoDeleteButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            deletePhoto(photo);
                          }}
                        >
                          <Trash2 size={16} color="#fff" />
                        </TouchableOpacity>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Documents Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  Documenti
                </Text>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: `${colors.primary}15` }]}
                  onPress={pickDocument}
                  disabled={uploadingDocument}
                >
                  {uploadingDocument ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Plus size={20} color={colors.primary} strokeWidth={2.5} />
                      <Text style={[styles.addButtonText, { color: colors.primary }]}>
                        Aggiungi
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {loadingDocuments ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : documents.length === 0 ? (
                <View
                  style={[
                    styles.emptySection,
                    { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
                  ]}
                >
                  <FileText size={32} color={colors.onSurfaceVariant} strokeWidth={1.5} />
                  <Text
                    style={[
                      styles.emptySectionText,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    Nessun documento caricato
                  </Text>
                </View>
              ) : (
                documents.map((document) => (
                  <TouchableOpacity
                    key={document.id}
                    style={[
                      styles.documentCard,
                      { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
                    ]}
                    onPress={() => {
                      setSelectedDocument(document);
                      setShowDocumentModal(true);
                    }}
                  >
                    <View style={[styles.documentIcon, { backgroundColor: '#3B82F620' }]}>
                      <FileText size={20} color="#3B82F6" strokeWidth={2} />
                    </View>

                    <View style={styles.documentInfo}>
                      <Text style={[styles.documentName, { color: colors.onSurface }]}>
                        {document.name}
                      </Text>
                      <Text
                        style={[
                          styles.documentMeta,
                          { color: colors.onSurfaceVariant },
                        ]}
                      >
                        {formatDate(document.uploadedAt)} • {formatFileSize(document.size)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.documentDeleteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        deleteDocument(document);
                      }}
                    >
                      <Trash2 size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* Storico Manutenzioni Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  Storico Manutenzioni
                </Text>
                <View style={styles.sectionActions}>
                  <TouchableOpacity
                    style={[styles.viewAllButton, { marginRight: 8 }]}
                    onPress={() =>
                      (navigation as any).navigate('MaintenanceHistory', { carId })
                    }
                  >
                    <Text style={[styles.viewAllText, { color: colors.primary }]}>
                      Vedi tutte
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: `${colors.primary}15` }]}
                    onPress={() =>
                      (navigation as any).navigate('AddMaintenance', { carId })
                    }
                  >
                    <Plus size={20} color={colors.primary} strokeWidth={2.5} />
                    <Text style={[styles.addButtonText, { color: colors.primary }]}>
                      Aggiungi
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {loadingMaintenance ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : maintenanceRecords.length === 0 ? (
                <View
                  style={[
                    styles.emptySection,
                    { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
                  ]}
                >
                  <Wrench size={32} color={colors.onSurfaceVariant} strokeWidth={1.5} />
                  <Text
                    style={[
                      styles.emptySectionText,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    Nessuna manutenzione registrata
                  </Text>
                </View>
              ) : (
                maintenanceRecords.map((record) => (
                  <TouchableOpacity
                    key={record.id}
                    style={[
                      styles.recordCard,
                      { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
                    ]}
                    onPress={() => {
                      (navigation as any).navigate('MaintenanceDetail', {
                        maintenanceId: record.id,
                        carId
                      });
                    }}
                  >
                    <View style={[styles.recordIcon, { backgroundColor: '#3B82F620' }]}>
                      <Wrench size={20} color="#3B82F6" strokeWidth={2} />
                    </View>

                    <View style={styles.recordInfo}>
                      <Text style={[styles.recordTitle, { color: colors.onSurface }]}>
                        {record.type}
                      </Text>
                      <Text
                        style={[
                          styles.recordDate,
                          { color: colors.onSurfaceVariant },
                        ]}
                      >
                        {formatDate(record.date)}
                      </Text>
                    </View>

                    <ChevronRight
                      size={20}
                      color={colors.onSurfaceVariant}
                      strokeWidth={2}
                    />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>

          {isDesktop && (
            <View style={styles.webSidebar}>
              {/* Scadenze e Promemoria Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                    Scadenze e Promemoria
                  </Text>
                  <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: `${colors.primary}15` }]}
                    onPress={() =>
                      (navigation as any).navigate('AddReminder', { carId })
                    }
                  >
                    <Plus size={20} color={colors.primary} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : reminders.length === 0 ? (
                  <View
                    style={[
                      styles.emptySection,
                      { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
                    ]}
                  >
                    <Calendar
                      size={32}
                      color={colors.onSurfaceVariant}
                      strokeWidth={1.5}
                    />
                    <Text
                      style={[
                        styles.emptySectionText,
                        { color: colors.onSurfaceVariant },
                      ]}
                    >
                      Nessuna scadenza programmata
                    </Text>
                  </View>
                ) : (
                  reminders.map((reminder) => {
                    const overdueStatus = isOverdue(reminder.dueDate);
                    const iconColor = overdueStatus ? '#EF4444' : '#F59E0B';
                    const backgroundColor = overdueStatus ? '#FEE2E2' : '#FEF3C7';

                    const IconComponent =
                      reminder.type === 'maintenance' ? Wrench :
                      reminder.type === 'insurance' ? Shield :
                      reminder.type === 'inspection' ? AlertCircle :
                      Calendar;

                    return (
                      <TouchableOpacity
                        key={reminder.id}
                        style={[
                          styles.recordCard,
                          overdueStatus && styles.overdueCard,
                          {
                            backgroundColor: overdueStatus
                              ? backgroundColor
                              : (isDark ? colors.surface : '#FFFFFF')
                          },
                        ]}
                        onPress={() => {
                          // Navigate to reminder detail
                        }}
                      >
                        <View style={[styles.recordIcon, { backgroundColor: `${iconColor}20` }]}>
                          <IconComponent size={20} color={iconColor} strokeWidth={2} />
                        </View>

                        <View style={styles.recordInfo}>
                          <Text
                            style={[
                              styles.recordTitle,
                              { color: overdueStatus ? '#991B1B' : colors.onSurface },
                            ]}
                          >
                            {reminder.title}
                          </Text>
                          <Text
                            style={[
                              styles.recordDate,
                              {
                                color: overdueStatus
                                  ? '#DC2626'
                                  : colors.onSurfaceVariant,
                              },
                            ]}
                          >
                            Scadenza: {formatDate(reminder.dueDate)}
                          </Text>
                        </View>

                        <ChevronRight
                          size={20}
                          color={overdueStatus ? '#DC2626' : colors.onSurfaceVariant}
                          strokeWidth={2}
                        />
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </View>
          )}

          {!isDesktop && reminders.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  Scadenze e Promemoria
                </Text>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: `${colors.primary}15` }]}
                  onPress={() =>
                    (navigation as any).navigate('AddReminder', { carId })
                  }
                >
                  <Plus size={20} color={colors.primary} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              {reminders.map((reminder) => {
                const overdueStatus = isOverdue(reminder.dueDate);
                const iconColor = overdueStatus ? '#EF4444' : '#F59E0B';
                const backgroundColor = overdueStatus ? '#FEE2E2' : '#FEF3C7';

                const IconComponent =
                  reminder.type === 'maintenance' ? Wrench :
                  reminder.type === 'insurance' ? Shield :
                  reminder.type === 'inspection' ? AlertCircle :
                  Calendar;

                return (
                  <TouchableOpacity
                    key={reminder.id}
                    style={[
                      styles.recordCard,
                      overdueStatus && styles.overdueCard,
                      {
                        backgroundColor: overdueStatus
                          ? backgroundColor
                          : (isDark ? colors.surface : '#FFFFFF')
                      },
                    ]}
                    onPress={() => {
                      // Navigate to reminder detail
                    }}
                  >
                    <View style={[styles.recordIcon, { backgroundColor: `${iconColor}20` }]}>
                      <IconComponent size={20} color={iconColor} strokeWidth={2} />
                    </View>

                    <View style={styles.recordInfo}>
                      <Text
                        style={[
                          styles.recordTitle,
                          { color: overdueStatus ? '#991B1B' : colors.onSurface },
                        ]}
                      >
                        {reminder.title}
                      </Text>
                      <Text
                        style={[
                          styles.recordDate,
                          {
                            color: overdueStatus
                              ? '#DC2626'
                              : colors.onSurfaceVariant,
                          },
                        ]}
                      >
                        Scadenza: {formatDate(reminder.dueDate)}
                      </Text>
                    </View>

                    <ChevronRight
                      size={20}
                      color={overdueStatus ? '#DC2626' : colors.onSurfaceVariant}
                      strokeWidth={2}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Photo Modal */}
      {renderPhotoModal()}

      {/* Photo Options Modal */}
      {renderPhotoOptionsModal()}

      {/* Document Modal */}
      {renderDocumentModal()}

      {/* Toast Notification */}
      {renderToast()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webContainer: {
    flex: 1,
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  scrollContent: {
    padding: 20,
  },
  webContent: {
    padding: 32,
  },
  webGrid: {
    flexDirection: 'row',
    gap: 32,
  },
  webMainColumn: {
    flex: 1,
  },
  webSidebar: {
    width: 380,
  },

  // Vehicle Card
  vehicleCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  vehicleVIN: {
    fontSize: 14,
    letterSpacing: 0.2,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Loading & Empty States
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptySection: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptySectionText: {
    fontSize: 14,
  },

  // Photos Grid
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photosGridWeb: {
    gap: 16,
  },
  photoItem: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 8,
  },
  photoDeleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Documents
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      },
    }),
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: 13,
  },
  documentDeleteButton: {
    padding: 8,
  },

  // Records
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      },
    }),
  },
  overdueCard: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 13,
  },

  // Photo Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalImage: {
    width: '90%',
    height: '70%',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  modalActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Options Modal (for web)
  optionsModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  optionsModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  optionsModalSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Document Modal
  documentModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    width: '90%',
    maxWidth: 500,
    alignSelf: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  documentPreview: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  documentModalName: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  documentModalInfo: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  documentModalActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },
  toastDesktop: {
    left: 'auto',
    right: 40,
    maxWidth: 400,
  },
  toastSuccess: {
    backgroundColor: '#10b981',
  },
  toastError: {
    backgroundColor: '#EF4444',
  },
  toastText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CarDetailScreen;

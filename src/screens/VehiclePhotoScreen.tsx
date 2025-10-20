// src/screens/VehiclePhotoScreen.tsx - ESEMPIO COMPLETO
import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    Alert,
    Platform,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import {
    Text,
    Card,
    Button,
    IconButton,
    Surface,
    ProgressBar,
    Chip,
    Portal,
    Modal,
    FAB,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trash2, Download, Share, Eye } from 'lucide-react-native';

// Import componenti custom
import UniversalImagePicker from '../components/UniversalImagePicker';
import UploadService from '../services/UploadService';
import { useAppThemeManager } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

// Firebase imports
import { db, storage } from '../services/firebase';
import {
    collection,
    doc,
    addDoc,
    getDocs,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = (SCREEN_WIDTH - 48) / 3; // 3 colonne con padding

interface VehiclePhoto {
    id: string;
    url: string;
    fileName: string;
    uploadedAt: any;
    description?: string;
    tags?: string[];
    size?: number;
    width?: number;
    height?: number;
}

export default function VehiclePhotoScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { colors } = useAppThemeManager();
    const { user } = useAuth();

    const { vehicleId, vehicleName } = route.params as {
        vehicleId: string;
        vehicleName: string;
    };

    // Stati
    const [photos, setPhotos] = useState<VehiclePhoto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedPhoto, setSelectedPhoto] = useState<VehiclePhoto | null>(null);
    const [showViewer, setShowViewer] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Carica le foto esistenti
    useEffect(() => {
        loadPhotos();
    }, [vehicleId]);

    const loadPhotos = async () => {
        if (!user?.uid) return;

        try {
            setIsLoading(true);
            const photosRef = collection(
                db,
                'users',
                user.uid,
                'vehicles',
                vehicleId,
                'photos'
            );

            const q = query(photosRef, orderBy('uploadedAt', 'desc'));
            const snapshot = await getDocs(q);

            const loadedPhotos: VehiclePhoto[] = [];
            snapshot.forEach((doc) => {
                loadedPhotos.push({
                    id: doc.id,
                    ...doc.data(),
                } as VehiclePhoto);
            });

            setPhotos(loadedPhotos);
        } catch (error) {
            console.error('Errore caricamento foto:', error);
            Alert.alert('Errore', 'Impossibile caricare le foto');
        } finally {
            setIsLoading(false);
        }
    };

    // Gestione upload foto
    const handleImagesSelected = async (images: any[]) => {
        if (!user?.uid) return;

        setShowUploadModal(false);
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const totalImages = images.length;
            let uploadedCount = 0;

            for (const image of images) {
                // Upload su Firebase Storage
                const path = `vehicles/${user.uid}/${vehicleId}/photos/${UploadService.generateFileName(image.fileName)}`;

                const result = await UploadService.uploadImage(image.uri, {
                    path,
                    onProgress: (progress) => {
                        const totalProgress = ((uploadedCount + progress / 100) / totalImages) * 100;
                        setUploadProgress(totalProgress);
                    },
                    compress: true,
                    maxWidth: 1920,
                    maxHeight: 1080,
                    quality: 0.8,
                });

                // Salva riferimento in Firestore
                const photoData = {
                    url: result.url,
                    path: result.path,
                    fileName: image.fileName || 'photo.jpg',
                    uploadedAt: serverTimestamp(),
                    width: image.width,
                    height: image.height,
                    size: image.fileSize,
                    vehicleId,
                    userId: user.uid,
                };

                const photosRef = collection(
                    db,
                    'users',
                    user.uid,
                    'vehicles',
                    vehicleId,
                    'photos'
                );

                await addDoc(photosRef, photoData);
                uploadedCount++;
            }

            Alert.alert(
                'Successo',
                `${totalImages} foto caricate con successo!`,
                [{ text: 'OK', onPress: loadPhotos }]
            );
        } catch (error) {
            console.error('Errore upload:', error);
            Alert.alert('Errore', 'Errore durante il caricamento delle foto');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    // Elimina foto
    const deletePhoto = async (photo: VehiclePhoto) => {
        if (!user?.uid) return;

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
                            // Elimina da Storage
                            if (photo.url) {
                                const storageRef = ref(storage, photo.url);
                                await deleteObject(storageRef).catch(() => {
                                    console.log('File già eliminato da Storage');
                                });
                            }

                            // Elimina da Firestore
                            const photoRef = doc(
                                db,
                                'users',
                                user.uid,
                                'vehicles',
                                vehicleId,
                                'photos',
                                photo.id
                            );
                            await deleteDoc(photoRef);

                            // Aggiorna UI
                            setPhotos(photos.filter(p => p.id !== photo.id));
                            setShowViewer(false);

                            Alert.alert('Successo', 'Foto eliminata');
                        } catch (error) {
                            console.error('Errore eliminazione:', error);
                            Alert.alert('Errore', 'Impossibile eliminare la foto');
                        }
                    },
                },
            ]
        );
    };

    // Condividi foto
    const sharePhoto = async (photo: VehiclePhoto) => {
        if (Platform.OS === 'web') {
            // Su web, apri in nuova tab
            window.open(photo.url, '_blank');
        } else {
            // Su mobile, usa Share API
            try {
                const { Share } = require('react-native');
                await Share.share({
                    message: `Foto di ${vehicleName}`,
                    url: photo.url,
                });
            } catch (error) {
                Alert.alert('Errore', 'Impossibile condividere la foto');
            }
        }
    };

    // Download foto (solo web)
    const downloadPhoto = (photo: VehiclePhoto) => {
        if (Platform.OS === 'web') {
            const link = document.createElement('a');
            link.href = photo.url;
            link.download = photo.fileName;
            link.click();
        }
    };

    // Render
    if (isLoading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ color: colors.onBackground, marginTop: 16 }}>
                    Caricamento foto...
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <Surface style={[styles.header, { backgroundColor: colors.surface }]} elevation={1}>
                <View style={styles.headerContent}>
                    <IconButton
                        icon="arrow-left"
                        size={24}
                        onPress={() => navigation.goBack()}
                    />
                    <View style={styles.headerTextContainer}>
                        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
                            Foto di {vehicleName}
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
                            {photos.length} foto
                        </Text>
                    </View>
                </View>
            </Surface>

            {/* Upload Progress */}
            {isUploading && (
                <Surface style={styles.uploadProgress} elevation={2}>
                    <Text style={{ color: colors.onSurface, marginBottom: 8 }}>
                        Caricamento in corso...
                    </Text>
                    <ProgressBar progress={uploadProgress / 100} color={colors.primary} />
                    <Text style={{ color: colors.onSurfaceVariant, marginTop: 4 }}>
                        {Math.round(uploadProgress)}%
                    </Text>
                </Surface>
            )}

            {/* Grid Foto */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {photos.length === 0 ? (
                    <Card style={[styles.emptyCard, { backgroundColor: colors.surfaceVariant }]}>
                        <Card.Content style={styles.emptyContent}>
                            <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                                Nessuna foto presente
                            </Text>
                            <Text style={[styles.emptySubtext, { color: colors.onSurfaceVariant }]}>
                                Aggiungi le prime foto del tuo veicolo
                            </Text>
                            <Button
                                mode="contained"
                                onPress={() => setShowUploadModal(true)}
                                style={styles.emptyButton}
                            >
                                Aggiungi Foto
                            </Button>
                        </Card.Content>
                    </Card>
                ) : (
                    <View style={styles.photoGrid}>
                        {photos.map((photo) => (
                            <TouchableOpacity
                                key={photo.id}
                                style={styles.photoItem}
                                onPress={() => {
                                    setSelectedPhoto(photo);
                                    setShowViewer(true);
                                }}
                                activeOpacity={0.8}
                            >
                                <ExpoImage
                                    source={{ uri: photo.url }}
                                    style={styles.photoImage}
                                    contentFit="cover"
                                    transition={200}
                                />
                                <View style={styles.photoOverlay}>
                                    <IconButton
                                        icon="dots-vertical"
                                        size={20}
                                        iconColor="white"
                                        style={styles.photoMenu}
                                    />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* FAB Aggiungi */}
            {photos.length > 0 && (
                <FAB
                    icon="camera-plus"
                    style={[styles.fab, { backgroundColor: colors.primary }]}
                    onPress={() => setShowUploadModal(true)}
                    color={colors.onPrimary}
                />
            )}

            {/* Modal Upload */}
            <Portal>
                <Modal
                    visible={showUploadModal}
                    onDismiss={() => setShowUploadModal(false)}
                    contentContainerStyle={[
                        styles.modal,
                        { backgroundColor: colors.surface }
                    ]}
                >
                    <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                        Aggiungi Foto
                    </Text>
                    <Text style={[styles.modalSubtitle, { color: colors.onSurfaceVariant }]}>
                        Seleziona o scatta foto del tuo veicolo
                    </Text>

                    <View style={styles.modalContent}>
                        <UniversalImagePicker
                            onImagesSelected={handleImagesSelected}
                            multiple={true}
                            maxImages={10}
                            label="Seleziona Foto"
                            mode="both"
                            showPreview={true}
                        />
                    </View>

                    <Button
                        mode="text"
                        onPress={() => setShowUploadModal(false)}
                        style={styles.modalCancel}
                    >
                        Annulla
                    </Button>
                </Modal>
            </Portal>

            {/* Photo Viewer Modal */}
            <Portal>
                <Modal
                    visible={showViewer}
                    onDismiss={() => setShowViewer(false)}
                    contentContainerStyle={styles.viewerModal}
                >
                    {selectedPhoto && (
                        <>
                            <ExpoImage
                                source={{ uri: selectedPhoto.url }}
                                style={styles.viewerImage}
                                contentFit="contain"
                            />
                            <View style={[styles.viewerActions, { backgroundColor: colors.surface }]}>
                                <IconButton
                                    icon="share-variant"
                                    size={24}
                                    onPress={() => sharePhoto(selectedPhoto)}
                                />
                                {Platform.OS === 'web' && (
                                    <IconButton
                                        icon="download"
                                        size={24}
                                        onPress={() => downloadPhoto(selectedPhoto)}
                                    />
                                )}
                                <IconButton
                                    icon="delete"
                                    size={24}
                                    iconColor={colors.error}
                                    onPress={() => deletePhoto(selectedPhoto)}
                                />
                                <IconButton
                                    icon="close"
                                    size={24}
                                    onPress={() => setShowViewer(false)}
                                />
                            </View>
                        </>
                    )}
                </Modal>
            </Portal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingVertical: 8,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    uploadProgress: {
        margin: 16,
        padding: 16,
        borderRadius: 8,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 16,
    },
    emptyCard: {
        marginTop: 32,
    },
    emptyContent: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '500',
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 8,
    },
    emptyButton: {
        marginTop: 24,
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    photoItem: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    photoImage: {
        width: '100%',
        height: '100%',
    },
    photoOverlay: {
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.2)',
        opacity: 0,
    },
    photoMenu: {
        position: 'absolute',
        top: 0,
        right: 0,
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
    },
    modal: {
        margin: 20,
        padding: 20,
        borderRadius: 12,
        maxWidth: 500,
        alignSelf: 'center',
        width: '100%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        marginBottom: 24,
    },
    modalContent: {
        marginVertical: 16,
    },
    modalCancel: {
        marginTop: 8,
    },
    viewerModal: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
    },
    viewerImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    viewerActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 8,
    },
});
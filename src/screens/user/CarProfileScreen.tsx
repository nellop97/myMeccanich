// src/screens/user/CarProfileScreen.tsx - SEZIONE FOTO AGGIORNATA
import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    Platform,
    StatusBar,
    Dimensions,
    SafeAreaView,
    ActivityIndicator
} from 'react-native';
import {
    Text,
    Card,
    Chip,
    IconButton,
    FAB,
    Divider,
    Surface,
    Button,
    Avatar,
    Badge,
    ProgressBar,
    Portal,
    Modal
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
    Car,
    Calendar,
    MapPin,
    Gauge,
    Settings,
    Shield,
    Eye,
    EyeOff,
    Camera,
    Edit,
    Share,
    Lock,
    Info,
    ChevronRight,
    CheckCircle,
    Image as ImageIcon,
    Plus,
} from 'lucide-react-native';

// NUOVO IMPORT - Universal Image Picker
import UniversalImagePicker from '../../components/UniversalImagePicker';
import UploadService from '../../services/UploadService';

import { SecurityService } from '../../security/SecurityService';
import { VehicleService } from '../../services/VehicleService';
import { MaintenanceService } from '../../services/MaintenanceService';
import { useAppThemeManager } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { Vehicle, PrivacySettings } from '../../types/database.types';
import { db, storage } from '../../services/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CarProfileScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { colors, isDark } = useAppThemeManager();
    const { user } = useAuth();
    const security = SecurityService.getInstance();
    const vehicleService = VehicleService.getInstance();
    const maintenanceService = MaintenanceService.getInstance();

    const { carId } = route.params as { carId: string };

    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [maintenanceStats, setMaintenanceStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [vehiclePhotos, setVehiclePhotos] = useState<string[]>([]);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Carica dati veicolo
    useEffect(() => {
        loadVehicleData();
    }, [carId]);

    const loadVehicleData = async () => {
        try {
            setIsLoading(true);

            // Carica dati veicolo
            const vehicleData = await vehicleService.getVehicle(carId);
            setVehicle(vehicleData);
            setVehiclePhotos(vehicleData.photos || []);

            // Carica statistiche manutenzione
            const stats = await maintenanceService.getMaintenanceStats(carId);
            setMaintenanceStats(stats);

        } catch (error) {
            console.error('Errore caricamento dati:', error);
            Alert.alert('Errore', 'Impossibile caricare i dati del veicolo');
        } finally {
            setIsLoading(false);
        }
    };

    // Gestione upload foto con Universal Image Picker
    const handlePhotoUpload = async (images: any[]) => {
        if (!user?.uid || !carId) return;

        setUploadingPhoto(true);
        setUploadProgress(0);

        try {
            const uploadedUrls = [];

            for (let i = 0; i < images.length; i++) {
                const image = images[i];

                // Upload su Firebase Storage
                const result = await UploadService.uploadImage(image.uri, {
                    path: `vehicles/${user.uid}/${carId}/photos/${Date.now()}_${image.fileName || 'photo.jpg'}`,
                    onProgress: (progress) => {
                        const totalProgress = ((i + progress / 100) / images.length) * 100;
                        setUploadProgress(totalProgress);
                    },
                    compress: true,
                    maxWidth: 1920,
                    maxHeight: 1080,
                    quality: 0.8,
                });

                uploadedUrls.push(result.url);
            }

            // Aggiorna Firestore con le nuove foto
            const vehicleRef = doc(db, 'users', user.uid, 'vehicles', carId);
            await updateDoc(vehicleRef, {
                photos: arrayUnion(...uploadedUrls),
                updatedAt: new Date(),
            });

            // Aggiorna stato locale
            setVehiclePhotos(prev => [...prev, ...uploadedUrls]);
            setShowPhotoModal(false);

            Alert.alert('Successo', `${images.length} foto caricate con successo!`);

        } catch (error) {
            console.error('Errore upload foto:', error);
            Alert.alert('Errore', 'Impossibile caricare le foto');
        } finally {
            setUploadingPhoto(false);
            setUploadProgress(0);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!vehicle) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.onBackground }}>Veicolo non trovato</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* Header con foto */}
                <View style={styles.headerContainer}>
                    {vehiclePhotos.length > 0 ? (
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            style={styles.photoCarousel}
                        >
                            {vehiclePhotos.map((photo, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: photo }}
                                    style={styles.headerImage}
                                    resizeMode="cover"
                                />
                            ))}
                        </ScrollView>
                    ) : (
                        <LinearGradient
                            colors={[colors.primary, colors.primaryContainer]}
                            style={styles.headerGradient}
                        >
                            <Car size={80} color={colors.onPrimary} />
                        </LinearGradient>
                    )}

                    {/* FAB per aggiungere foto */}
                    <FAB
                        icon="camera-plus"
                        style={[styles.photoFab, { backgroundColor: colors.primary }]}
                        onPress={() => setShowPhotoModal(true)}
                        color={colors.onPrimary}
                        size="small"
                    />
                </View>

                {/* Info Veicolo */}
                <Card style={styles.infoCard}>
                    <Card.Content>
                        <Text style={[styles.vehicleTitle, { color: colors.onSurface }]}>
                            {vehicle.brand} {vehicle.model}
                        </Text>
                        <Text style={[styles.vehicleSubtitle, { color: colors.onSurfaceVariant }]}>
                            {vehicle.year} • {vehicle.plate}
                        </Text>

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Gauge size={20} color={colors.primary} />
                                <Text style={[styles.statValue, { color: colors.onSurface }]}>
                                    {vehicle.mileage?.toLocaleString() || 0} km
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                                    Chilometraggio
                                </Text>
                            </View>

                            <View style={styles.statItem}>
                                <Calendar size={20} color={colors.primary} />
                                <Text style={[styles.statValue, { color: colors.onSurface }]}>
                                    {maintenanceStats?.nextService || 'N/D'}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
                                    Prossimo tagliando
                                </Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>

                {/* Altri contenuti del profilo... */}

            </ScrollView>

            {/* Modal per aggiungere foto */}
            <Portal>
                <Modal
                    visible={showPhotoModal}
                    onDismiss={() => setShowPhotoModal(false)}
                    contentContainerStyle={[
                        styles.modal,
                        { backgroundColor: colors.surface }
                    ]}
                >
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                            Aggiungi Foto Veicolo
                        </Text>
                        <IconButton
                            icon="close"
                            size={24}
                            onPress={() => setShowPhotoModal(false)}
                        />
                    </View>

                    <View style={styles.modalContent}>
                        {uploadingPhoto ? (
                            <View style={styles.uploadProgressContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={[styles.uploadText, { color: colors.onSurface }]}>
                                    Caricamento in corso...
                                </Text>
                                <ProgressBar
                                    progress={uploadProgress / 100}
                                    color={colors.primary}
                                    style={styles.progressBar}
                                />
                                <Text style={[styles.progressText, { color: colors.onSurfaceVariant }]}>
                                    {Math.round(uploadProgress)}%
                                </Text>
                            </View>
                        ) : (
                            <UniversalImagePicker
                                onImagesSelected={handlePhotoUpload}
                                multiple={true}
                                maxImages={5}
                                label="Seleziona o scatta foto"
                                mode="both"
                                showPreview={true}
                            />
                        )}
                    </View>
                </Modal>
            </Portal>
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: {
        height: 250,
        position: 'relative',
    },
    photoCarousel: {
        height: 250,
    },
    headerImage: {
        width: SCREEN_WIDTH,
        height: 250,
    },
    headerGradient: {
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoFab: {
        position: 'absolute',
        bottom: -28,
        right: 16,
        elevation: 4,
    },
    infoCard: {
        margin: 16,
        marginTop: 40,
    },
    vehicleTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    vehicleSubtitle: {
        fontSize: 16,
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 24,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    modal: {
        margin: 20,
        borderRadius: 16,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    modalContent: {
        minHeight: 200,
    },
    uploadProgressContainer: {
        alignItems: 'center',
        padding: 20,
    },
    uploadText: {
        fontSize: 16,
        marginTop: 16,
        marginBottom: 20,
    },
    progressBar: {
        width: '100%',
        height: 8,
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        marginTop: 8,
    },
});

export default CarProfileScreen;
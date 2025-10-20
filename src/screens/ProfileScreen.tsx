// src/screens/ProfileScreen.tsx
/**
 * ProfileScreen - Pagina profilo completa e responsive
 * Supporta sia Owner che Mechanic con UI adattiva
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    FileText,
    Camera,
    Edit3,
    LogOut,
    Trash2,
    Shield,
    Award,
    Star,
    CheckCircle,
    AlertCircle,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

import { useProfile } from '../hooks/useProfile';
import { useStore } from '../store';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

const ProfileScreen = () => {
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const { user, setUser } = useStore();
    const { profile, loading, uploadProfilePhoto, uploadingPhoto } = useProfile();

    const [refreshing, setRefreshing] = useState(false);

    // Breakpoints
    const isDesktop = width >= 1024;
    const isTablet = width >= 768 && width < 1024;
    const isMobile = width < 768;

    const isMechanic = profile?.userType === 'mechanic';

    // Handler: Cambia foto profilo
    const handleChangePhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permesso negato', 'Abbiamo bisogno del permesso per accedere alle foto');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            try {
                await uploadProfilePhoto(result.assets[0].uri);
                Alert.alert('Successo', 'Foto profilo aggiornata!');
            } catch (error) {
                Alert.alert('Errore', 'Impossibile aggiornare la foto');
            }
        }
    };

    // Handler: Modifica profilo
    const handleEditProfile = () => {
        navigation.navigate('EditProfile' as never);
    };

    // Handler: Logout
    const handleLogout = () => {
        Alert.alert(
            'Disconnetti',
            'Sei sicuro di voler uscire?',
            [
                { text: 'Annulla', style: 'cancel' },
                {
                    text: 'Disconnetti',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut(auth);
                            setUser(null);
                        } catch (error) {
                            Alert.alert('Errore', 'Impossibile disconnettersi');
                        }
                    },
                },
            ]
        );
    };

    // Handler: Privacy
    const handlePrivacy = () => {
        navigation.navigate('Privacy' as never);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Caricamento profilo...</Text>
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.errorContainer}>
                <AlertCircle size={48} color="#EF4444" />
                <Text style={styles.errorText}>Profilo non trovato</Text>
            </View>
        );
    }

    // Render Header con foto profilo
    const renderHeader = () => (
        <LinearGradient
            colors={isMechanic ? ['#FF6B35', '#FF8A65'] : ['#007AFF', '#5AC8FA']}
            style={styles.header}
        >
            <View style={styles.headerContent}>
                <View style={styles.avatarContainer}>
                    {profile.photoURL ? (
                        <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                                {profile.firstName?.[0]}{profile.lastName?.[0]}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.cameraButton}
                        onPress={handleChangePhoto}
                        disabled={uploadingPhoto}
                    >
                        {uploadingPhoto ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Camera size={20} color="#FFF" />
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.userName}>
                    {profile.firstName} {profile.lastName}
                </Text>

                <View style={styles.badgeContainer}>
                    <View style={[styles.badge, isMechanic && styles.badgeMechanic]}>
                        {isMechanic ? (
                            <Briefcase size={14} color="#FFF" />
                        ) : (
                            <User size={14} color="#FFF" />
                        )}
                        <Text style={styles.badgeText}>
                            {isMechanic ? 'Meccanico' : 'Proprietario'}
                        </Text>
                    </View>

                    {isMechanic && profile.verified && (
                        <View style={[styles.badge, styles.badgeVerified]}>
                            <Shield size={14} color="#FFF" />
                            <Text style={styles.badgeText}>Verificato</Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                    <Edit3 size={16} color="#FFF" />
                    <Text style={styles.editButtonText}>Modifica Profilo</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );

    // Render Info Cards
    const renderInfoSection = () => (
        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
            <Text style={styles.sectionTitle}>Informazioni Personali</Text>

            <View style={styles.card}>
                <InfoItem
                    icon={Mail}
                    label="Email"
                    value={profile.email}
                />
                <View style={styles.divider} />

                <InfoItem
                    icon={Phone}
                    label="Telefono"
                    value={profile.phone || 'Non specificato'}
                />

                {isMechanic && (
                    <>
                        <View style={styles.divider} />
                        <InfoItem
                            icon={Briefcase}
                            label="Officina"
                            value={profile.workshopName || 'Non specificato'}
                        />
                        <View style={styles.divider} />
                        <InfoItem
                            icon={MapPin}
                            label="Indirizzo"
                            value={profile.address || 'Non specificato'}
                        />
                        <View style={styles.divider} />
                        <InfoItem
                            icon={FileText}
                            label="P.IVA"
                            value={profile.vatNumber || 'Non specificato'}
                        />
                    </>
                )}
            </View>
        </View>
    );

    // Render Stats (solo per meccanici)
    const renderMechanicStats = () => {
        if (!isMechanic) return null;

        return (
            <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
                <Text style={styles.sectionTitle}>Statistiche</Text>

                <View style={styles.statsContainer}>
                    <StatCard
                        icon={Star}
                        value={profile.rating?.toFixed(1) || '0.0'}
                        label="Valutazione"
                        color="#FFB800"
                    />
                    <StatCard
                        icon={Award}
                        value={profile.reviewsCount?.toString() || '0'}
                        label="Recensioni"
                        color="#007AFF"
                    />
                </View>
            </View>
        );
    };

    // Render Actions
    const renderActions = () => (
        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
            <ActionButton
                icon={Shield}
                label="Privacy Policy"
                onPress={handlePrivacy}
                color="#007AFF"
            />

            <View style={styles.divider} />

            <ActionButton
                icon={LogOut}
                label="Disconnetti"
                onPress={handleLogout}
                color="#EF4444"
                destructive
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    isDesktop && styles.scrollContentDesktop,
                ]}
                showsVerticalScrollIndicator={false}
            >
                {renderHeader()}
                {renderInfoSection()}
                {renderMechanicStats()}
                {renderActions()}

                <Text style={styles.version}>MyMechanic v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

// Componente InfoItem
const InfoItem = ({ icon: Icon, label, value }: any) => (
    <View style={styles.infoItem}>
        <View style={styles.infoIcon}>
            <Icon size={20} color="#64748B" />
        </View>
        <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    </View>
);

// Componente StatCard
const StatCard = ({ icon: Icon, value, label, color }: any) => (
    <View style={styles.statCard}>
        <Icon size={24} color={color} />
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

// Componente ActionButton
const ActionButton = ({ icon: Icon, label, onPress, color, destructive }: any) => (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
        <View style={[styles.actionIcon, { backgroundColor: `${color}15` }]}>
            <Icon size={20} color={color} />
        </View>
        <Text style={[styles.actionLabel, destructive && { color }]}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748B',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 20,
    },
    errorText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '600',
        color: '#EF4444',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    scrollContentDesktop: {
        maxWidth: 900,
        width: '100%',
        alignSelf: 'center',
    },

    // Header
    header: {
        paddingTop: 40,
        paddingBottom: 32,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
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
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            },
        }),
    },
    headerContent: {
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#FFF',
    },
    avatarPlaceholder: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 48,
        fontWeight: '700',
        color: '#FFF',
    },
    cameraButton: {
        position: 'absolute',
        right: 4,
        bottom: 4,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    userName: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    badgeContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    badgeMechanic: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    badgeVerified: {
        backgroundColor: 'rgba(34, 197, 94, 0.9)',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFF',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },

    // Sections
    section: {
        marginTop: 20,
        marginHorizontal: 16,
    },
    sectionDesktop: {
        marginHorizontal: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 12,
        paddingHorizontal: 4,
    },

    // Card
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 4,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            },
        }),
    },

    // Info Item
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#0F172A',
    },

    // Stats
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            },
        }),
    },
    statValue: {
        fontSize: 32,
        fontWeight: '700',
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        color: '#64748B',
    },

    // Actions
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            },
        }),
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#0F172A',
        flex: 1,
    },

    // Divider
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
    },

    // Footer
    version: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 32,
        marginBottom: 16,
    },
});

export default ProfileScreen;
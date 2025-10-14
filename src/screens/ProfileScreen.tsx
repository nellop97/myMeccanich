// src/screens/ProfileScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Platform,
    Dimensions,
    Switch,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Camera,
    Edit,
    LogOut,
    Trash2,
    Shield,
    Bell,
    Moon,
    Globe,
    ChevronRight,
    Info,
    HelpCircle,
    FileText,
    Star,
} from 'lucide-react-native';

// Hooks personalizzati
import { useAuth } from '../hooks/useAuth';
import { useUserData, useAppTheme } from '../hooks/useUserData';
import { RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isDesktop = width >= 1024;

type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'Profile'>;

const ProfileScreen = () => {
    const route = useRoute<ProfileScreenRouteProp>();
    const { userId } = route.params;
    const navigation = useNavigation();

    // Hooks
    const { logout, loading } = useAuth();
    const {
        userName,
        userEmail,
        isMechanic,
        isEmailVerified,
        photoURL,
        workshopName,
        workshopAddress,
        vatNumber,
    } = useUserData();
    const { darkMode, toggleDarkMode } = useAppTheme();

    // Stati locali
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    // Gestione logout
    const handleLogout = async () => {
        try {
            await logout();
            setShowLogoutDialog(false);
        } catch (error) {
            console.error('Errore logout:', error);
            Alert.alert('Errore', 'Impossibile disconnettere l\'account');
        }
    };

    const showLogoutConfirmation = () => {
        Alert.alert(
            'Conferma disconnessione',
            'Sei sicuro di voler disconnettere il tuo account?',
            [
                { text: 'Annulla', style: 'cancel' },
                {
                    text: 'Disconnetti',
                    style: 'destructive',
                    onPress: handleLogout,
                },
            ]
        );
    };

    // Gestione elimina account
    const handleDeleteAccount = () => {
        Alert.alert(
            'Elimina Account',
            'Questa azione è irreversibile. Tutti i tuoi dati verranno eliminati permanentemente.',
            [
                { text: 'Annulla', style: 'cancel' },
                {
                    text: 'Elimina',
                    style: 'destructive',
                    onPress: () => {
                        // Implementa logica eliminazione account
                        Alert.alert('Info', 'Funzionalità in sviluppo');
                    },
                },
            ]
        );
    };

    // Gestione foto profilo
    const handleChangePhoto = () => {
        Alert.alert('Info', 'Funzionalità cambio foto in sviluppo');
    };

    // Render delle sezioni
    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.avatarContainer}>
                {photoURL ? (
                    <Image source={{ uri: photoURL }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <User size={40} color="#fff" />
                    </View>
                )}
                <TouchableOpacity style={styles.cameraButton} onPress={handleChangePhoto}>
                    <Camera size={16} color="#fff" />
                </TouchableOpacity>
            </View>

            <Text style={styles.userName}>{userName || 'Utente'}</Text>
            <Text style={styles.userEmail}>{userEmail}</Text>

            {isMechanic && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>🔧 Meccanico</Text>
                </View>
            )}

            {!isEmailVerified && (
                <View style={[styles.badge, styles.warningBadge]}>
                    <Text style={styles.badgeTextWarning}>⚠️ Email non verificata</Text>
                </View>
            )}
        </View>
    );

    const renderAccountSection = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>

            <TouchableOpacity
                style={styles.menuItem}
                onPress={() => Alert.alert('Info', 'Modifica profilo in sviluppo')}
            >
                <View style={styles.menuItemLeft}>
                    <View style={[styles.menuIcon, { backgroundColor: '#3b82f6' }]}>
                        <Edit size={20} color="#fff" />
                    </View>
                    <Text style={styles.menuItemText}>Modifica Profilo</Text>
                </View>
                <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>

            {isMechanic && (
                <>
                    <View style={styles.divider} />
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => Alert.alert('Info', 'Gestione officina in sviluppo')}
                    >
                        <View style={styles.menuItemLeft}>
                            <View style={[styles.menuIcon, { backgroundColor: '#8b5cf6' }]}>
                                <MapPin size={20} color="#fff" />
                            </View>
                            <View style={styles.menuItemContent}>
                                <Text style={styles.menuItemText}>Dati Officina</Text>
                                <Text style={styles.menuItemSubtext}>
                                    {workshopName || 'Non configurato'}
                                </Text>
                            </View>
                        </View>
                        <ChevronRight size={20} color="#94a3b8" />
                    </TouchableOpacity>
                </>
            )}

            <View style={styles.divider} />

            <TouchableOpacity
                style={styles.menuItem}
                onPress={() => Alert.alert('Info', 'Cambia password in sviluppo')}
            >
                <View style={styles.menuItemLeft}>
                    <View style={[styles.menuIcon, { backgroundColor: '#f59e0b' }]}>
                        <Shield size={20} color="#fff" />
                    </View>
                    <Text style={styles.menuItemText}>Sicurezza e Password</Text>
                </View>
                <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>
        </View>
    );

    const renderPreferencesSection = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferenze</Text>

            <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                    <View style={[styles.menuIcon, { backgroundColor: '#64748b' }]}>
                        <Moon size={20} color="#fff" />
                    </View>
                    <Text style={styles.menuItemText}>Tema Scuro</Text>
                </View>
                <Switch
                    value={darkMode}
                    onValueChange={toggleDarkMode}
                    trackColor={{ false: '#e2e8f0', true: '#3b82f6' }}
                    thumbColor="#fff"
                />
            </View>

            <View style={styles.divider} />

            <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                    <View style={[styles.menuIcon, { backgroundColor: '#10b981' }]}>
                        <Bell size={20} color="#fff" />
                    </View>
                    <Text style={styles.menuItemText}>Notifiche</Text>
                </View>
                <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: '#e2e8f0', true: '#3b82f6' }}
                    thumbColor="#fff"
                />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
                style={styles.menuItem}
                onPress={() => Alert.alert('Info', 'Cambio lingua in sviluppo')}
            >
                <View style={styles.menuItemLeft}>
                    <View style={[styles.menuIcon, { backgroundColor: '#06b6d4' }]}>
                        <Globe size={20} color="#fff" />
                    </View>
                    <View style={styles.menuItemContent}>
                        <Text style={styles.menuItemText}>Lingua</Text>
                        <Text style={styles.menuItemSubtext}>Italiano</Text>
                    </View>
                </View>
                <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>
        </View>
    );

    const renderSupportSection = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Supporto</Text>

            <TouchableOpacity
                style={styles.menuItem}
                onPress={() => Alert.alert('Info', 'Centro assistenza in sviluppo')}
            >
                <View style={styles.menuItemLeft}>
                    <View style={[styles.menuIcon, { backgroundColor: '#14b8a6' }]}>
                        <HelpCircle size={20} color="#fff" />
                    </View>
                    <Text style={styles.menuItemText}>Centro Assistenza</Text>
                </View>
                <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
                style={styles.menuItem}
                onPress={() => Alert.alert('Info', 'Privacy policy in sviluppo')}
            >
                <View style={styles.menuItemLeft}>
                    <View style={[styles.menuIcon, { backgroundColor: '#6366f1' }]}>
                        <FileText size={20} color="#fff" />
                    </View>
                    <Text style={styles.menuItemText}>Privacy e Termini</Text>
                </View>
                <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
                style={styles.menuItem}
                onPress={() => Alert.alert('MyMechanic', 'Versione 1.0.0\n\n© 2024 MyMechanic')}
            >
                <View style={styles.menuItemLeft}>
                    <View style={[styles.menuIcon, { backgroundColor: '#94a3b8' }]}>
                        <Info size={20} color="#fff" />
                    </View>
                    <Text style={styles.menuItemText}>Info App</Text>
                </View>
                <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
                style={styles.menuItem}
                onPress={() => Alert.alert('Info', 'Valutazione in sviluppo')}
            >
                <View style={styles.menuItemLeft}>
                    <View style={[styles.menuIcon, { backgroundColor: '#f59e0b' }]}>
                        <Star size={20} color="#fff" />
                    </View>
                    <Text style={styles.menuItemText}>Valuta l'App</Text>
                </View>
                <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>
        </View>
    );

    const renderDangerZone = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Zona Pericolosa</Text>

            <TouchableOpacity
                style={[styles.menuItem, styles.dangerItem]}
                onPress={showLogoutConfirmation}
            >
                <View style={styles.menuItemLeft}>
                    <View style={[styles.menuIcon, { backgroundColor: '#ef4444' }]}>
                        <LogOut size={20} color="#fff" />
                    </View>
                    <Text style={[styles.menuItemText, styles.dangerText]}>Disconnetti</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
                style={[styles.menuItem, styles.dangerItem]}
                onPress={handleDeleteAccount}
            >
                <View style={styles.menuItemLeft}>
                    <View style={[styles.menuIcon, { backgroundColor: '#dc2626' }]}>
                        <Trash2 size={20} color="#fff" />
                    </View>
                    <Text style={[styles.menuItemText, styles.dangerText]}>Elimina Account</Text>
                </View>
            </TouchableOpacity>
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
                {renderAccountSection()}
                {renderPreferencesSection()}
                {renderSupportSection()}
                {renderDangerZone()}

                <Text style={styles.version}>Versione 1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    scrollContentDesktop: {
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
    },

    // Header
    header: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraButton: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 12,
    },
    badge: {
        backgroundColor: '#dbeafe',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginTop: 8,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1e40af',
    },
    warningBadge: {
        backgroundColor: '#fef3c7',
    },
    badgeTextWarning: {
        fontSize: 12,
        fontWeight: '600',
        color: '#92400e',
    },

    // Sections
    section: {
        backgroundColor: '#fff',
        marginTop: 24,
        marginHorizontal: isDesktop ? 0 : 20,
        borderRadius: 16,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },

    // Menu Items
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        minHeight: 60,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuItemContent: {
        flex: 1,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#0f172a',
    },
    menuItemSubtext: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginLeft: 72,
    },

    // Danger Zone
    dangerItem: {
        opacity: 0.9,
    },
    dangerText: {
        color: '#ef4444',
    },

    // Footer
    version: {
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 32,
    },
});

export default ProfileScreen;
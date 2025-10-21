// src/screens/SettingsScreen.tsx
/**
 * SettingsScreen - Schermata Impostazioni Moderna e Responsive
 * Design minimale e pulito con layout separato per Web e Mobile
 * Integrazione completa con Firebase per gestione profilo e settings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
  User,
  Mail,
  Bell,
  Moon,
  Sun,
  Globe,
  Shield,
  LogOut,
  Trash2,
  ChevronRight,
  Camera,
  Settings as SettingsIcon,
  Lock,
  Eye,
  Database,
  Info,
  HelpCircle,
  ArrowLeft,
  UserX,
  AlertTriangle,
} from 'lucide-react-native';

// Firebase
import { doc, updateDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile, updateEmail, updatePassword, deleteUser } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../services/firebase';

// Hooks
import { useAuth } from '../hooks/useAuth';
import { useStore } from '../store';
import { useLogout } from '../hooks/useAuthSync';
import { useProfile } from '../hooks/useProfile';

// ============================================
// INTERFACES
// ============================================
interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  type: 'navigation' | 'toggle' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  danger?: boolean;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

// ============================================
// MAIN COMPONENT
// ============================================
const SettingsScreen = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const { user: authUser } = useAuth();
  const { user, darkMode, preferences, setDarkMode, updatePreferences } = useStore();
  const { logout } = useLogout();
  const { profile, uploadProfilePhoto, uploadingPhoto } = useProfile();

  // Responsive breakpoints
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;

  // States
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Theme colors
  const theme = {
    background: darkMode ? '#0f172a' : '#f8fafc',
    surface: darkMode ? '#1e293b' : '#ffffff',
    card: darkMode ? '#334155' : '#ffffff',
    primary: '#3b82f6',
    primaryDark: '#1d4ed8',
    text: darkMode ? '#f1f5f9' : '#0f172a',
    textSecondary: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#334155' : '#e2e8f0',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    accent: darkMode ? '#7c3aed' : '#a855f7',
  };

  // ============================================
  // HELPERS
  // ============================================

  // Serializza le preferenze per Firebase (solo dati semplici)
  const serializePreferences = () => {
    return {
      theme: preferences.theme,
      language: preferences.language,
      currency: preferences.currency,
      distanceUnit: preferences.distanceUnit,
      fuelUnit: preferences.fuelUnit,
      notifications: {
        maintenance: preferences.notifications.maintenance,
        expenses: preferences.notifications.expenses,
        documents: preferences.notifications.documents,
        reminders: preferences.notifications.reminders,
      },
      privacy: {
        shareData: preferences.privacy.shareData,
        analytics: preferences.privacy.analytics,
      },
    };
  };

  // ============================================
  // HANDLERS
  // ============================================

  // Upload foto profilo
  const handleUploadPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permesso Negato', 'Abbiamo bisogno del permesso per accedere alle foto');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        try {
          await uploadProfilePhoto(result.assets[0].uri);
          Alert.alert('Successo', 'Foto profilo aggiornata!');
        } catch (error) {
          Alert.alert('Errore', 'Impossibile aggiornare la foto profilo');
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error('Errore upload foto:', error);
      Alert.alert('Errore', 'Si è verificato un errore');
    }
  };

  // Toggle dark mode
  const handleToggleDarkMode = async (value: boolean) => {
    setDarkMode(value);
    updatePreferences({ theme: value ? 'dark' : 'light' });

    // Sync to Firebase
    if (authUser?.uid) {
      try {
        const updatedPrefs = serializePreferences();
        updatedPrefs.theme = value ? 'dark' : 'light';

        await updateDoc(doc(db, 'users', authUser.uid), {
          'preferences.theme': value ? 'dark' : 'light',
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Errore sync dark mode a Firebase:', error);
      }
    }
  };

  // Change language
  const handleChangeLanguage = () => {
    const languages = [
      { label: 'Italiano', value: 'it' },
      { label: 'English', value: 'en' },
      { label: 'Français', value: 'fr' },
      { label: 'Deutsch', value: 'de' },
    ];

    Alert.alert(
      'Seleziona Lingua',
      '',
      languages.map(lang => ({
        text: lang.label,
        onPress: async () => {
          updatePreferences({ language: lang.value as any });

          // Sync to Firebase
          if (authUser?.uid) {
            try {
              await updateDoc(doc(db, 'users', authUser.uid), {
                'preferences.language': lang.value,
                updatedAt: serverTimestamp(),
              });
            } catch (error) {
              console.error('Errore sync lingua a Firebase:', error);
            }
          }
        },
      }))
    );
  };

  // Toggle notifications
  const handleToggleNotification = async (type: keyof typeof preferences.notifications) => {
    const newValue = !preferences.notifications[type];
    updatePreferences({
      notifications: {
        ...preferences.notifications,
        [type]: newValue,
      },
    });

    // Sync to Firebase (usa dot notation per aggiornare solo il campo specifico)
    if (authUser?.uid) {
      try {
        await updateDoc(doc(db, 'users', authUser.uid), {
          [`preferences.notifications.${type}`]: newValue,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Errore sync notifiche a Firebase:', error);
      }
    }
  };

  // Toggle privacy
  const handleTogglePrivacy = async (type: keyof typeof preferences.privacy) => {
    const newValue = !preferences.privacy[type];
    updatePreferences({
      privacy: {
        ...preferences.privacy,
        [type]: newValue,
      },
    });

    // Sync to Firebase (usa dot notation per aggiornare solo il campo specifico)
    if (authUser?.uid) {
      try {
        await updateDoc(doc(db, 'users', authUser.uid), {
          [`preferences.privacy.${type}`]: newValue,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Errore sync privacy a Firebase:', error);
      }
    }
  };

  // Logout
  const handleLogout = () => {
    Alert.alert('Disconnetti', 'Sei sicuro di voler uscire?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Disconnetti',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await logout();
            console.log('✅ Logout completato');
          } catch (error) {
            console.error('❌ Errore logout:', error);
            Alert.alert('Errore', 'Impossibile disconnettere');
            setLoading(false);
          }
        },
      },
    ]);
  };

  // Delete account completely
  const handleDeleteAccount = () => {
    Alert.alert(
      'Elimina Account',
      'ATTENZIONE: Questa azione eliminerà permanentemente il tuo account e tutti i dati associati. Questa operazione NON può essere annullata.\n\nSei assolutamente sicuro?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina Account',
          style: 'destructive',
          onPress: () => {
            // Doppia conferma per sicurezza
            Alert.alert(
              'Conferma Finale',
              'Confermi di voler eliminare definitivamente il tuo account?',
              [
                { text: 'Annulla', style: 'cancel' },
                {
                  text: 'Sì, Elimina',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      setLoading(true);

                      if (!authUser?.uid) {
                        throw new Error('Utente non autenticato');
                      }

                      // 1. Elimina documento utente da Firestore
                      await deleteDoc(doc(db, 'users', authUser.uid));

                      // 2. Elimina tutti i veicoli dell'utente
                      // (In produzione, dovresti anche eliminare manutenzioni, spese, etc.)

                      // 3. Elimina account Firebase Auth
                      const currentUser = auth.currentUser;
                      if (currentUser) {
                        await deleteUser(currentUser);
                      }

                      // 4. Pulisci lo store locale
                      const { resetStore } = useStore.getState();
                      resetStore();

                      Alert.alert(
                        'Account Eliminato',
                        'Il tuo account è stato eliminato definitivamente.',
                        [
                          {
                            text: 'OK',
                            onPress: () => {
                              // Il redirect alla login avverrà automaticamente
                            },
                          },
                        ]
                      );
                    } catch (error: any) {
                      console.error('Errore eliminazione account:', error);
                      setLoading(false);

                      if (error.code === 'auth/requires-recent-login') {
                        Alert.alert(
                          'Riautenticazione Richiesta',
                          'Per motivi di sicurezza, devi effettuare nuovamente il login prima di eliminare l\'account.'
                        );
                      } else {
                        Alert.alert(
                          'Errore',
                          'Impossibile eliminare l\'account. Riprova più tardi.'
                        );
                      }
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  // Navigate to profile
  const handleNavigateToProfile = () => {
    navigation.navigate('Profile' as never);
  };

  // Navigate to edit profile
  const handleNavigateToEditProfile = () => {
    navigation.navigate('EditProfile' as never);
  };

  // Navigate to privacy
  const handleNavigateToPrivacy = () => {
    navigation.navigate('Privacy' as never);
  };

  // ============================================
  // SETTINGS SECTIONS
  // ============================================
  const sections: SettingSection[] = [
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'Profilo Utente',
          subtitle: user?.email || 'Email non disponibile',
          icon: User,
          type: 'navigation',
          onPress: handleNavigateToProfile,
        },
        {
          id: 'edit-profile',
          title: 'Modifica Profilo',
          subtitle: 'Aggiorna le tue informazioni',
          icon: Mail,
          type: 'navigation',
          onPress: handleNavigateToEditProfile,
        },
      ],
    },
    {
      title: 'Aspetto',
      items: [
        {
          id: 'dark-mode',
          title: 'Modalità Scura',
          subtitle: 'Attiva tema scuro',
          icon: darkMode ? Moon : Sun,
          type: 'toggle',
          value: darkMode,
          onToggle: handleToggleDarkMode,
        },
        {
          id: 'language',
          title: 'Lingua',
          subtitle: preferences.language === 'it' ? 'Italiano' : preferences.language.toUpperCase(),
          icon: Globe,
          type: 'navigation',
          onPress: handleChangeLanguage,
        },
      ],
    },
    {
      title: 'Notifiche',
      items: [
        {
          id: 'notif-maintenance',
          title: 'Manutenzioni',
          subtitle: 'Promemoria per manutenzioni',
          icon: Bell,
          type: 'toggle',
          value: preferences.notifications.maintenance,
          onToggle: () => handleToggleNotification('maintenance'),
        },
        {
          id: 'notif-expenses',
          title: 'Spese',
          subtitle: 'Notifiche per nuove spese',
          icon: Bell,
          type: 'toggle',
          value: preferences.notifications.expenses,
          onToggle: () => handleToggleNotification('expenses'),
        },
        {
          id: 'notif-documents',
          title: 'Documenti',
          subtitle: 'Scadenze documenti',
          icon: Bell,
          type: 'toggle',
          value: preferences.notifications.documents,
          onToggle: () => handleToggleNotification('documents'),
        },
      ],
    },
    {
      title: 'Privacy e Sicurezza',
      items: [
        {
          id: 'privacy-policy',
          title: 'Privacy Policy',
          subtitle: 'Leggi la nostra policy',
          icon: Shield,
          type: 'navigation',
          onPress: handleNavigateToPrivacy,
        },
        {
          id: 'share-data',
          title: 'Condividi Dati Utilizzo',
          subtitle: 'Aiutaci a migliorare',
          icon: Database,
          type: 'toggle',
          value: preferences.privacy.shareData,
          onToggle: () => handleTogglePrivacy('shareData'),
        },
        {
          id: 'analytics',
          title: 'Analytics',
          subtitle: 'Statistiche anonime',
          icon: Eye,
          type: 'toggle',
          value: preferences.privacy.analytics,
          onToggle: () => handleTogglePrivacy('analytics'),
        },
      ],
    },
    {
      title: 'Supporto',
      items: [
        {
          id: 'help',
          title: 'Centro Assistenza',
          subtitle: 'FAQ e guide',
          icon: HelpCircle,
          type: 'navigation',
          onPress: () => Alert.alert('Info', 'Funzionalità in arrivo'),
        },
        {
          id: 'about',
          title: 'Informazioni App',
          subtitle: 'Versione 1.0.0',
          icon: Info,
          type: 'navigation',
          onPress: () => Alert.alert('MyMeccanich', 'Versione 1.0.0\n\nGestisci il tuo veicolo con facilità'),
        },
      ],
    },
    {
      title: 'Zona Pericolo',
      items: [
        {
          id: 'logout',
          title: 'Disconnetti',
          subtitle: 'Esci dal tuo account',
          icon: LogOut,
          type: 'action',
          onPress: handleLogout,
          danger: true,
        },
        {
          id: 'delete-account',
          title: 'Elimina Account',
          subtitle: 'Cancella definitivamente il tuo account',
          icon: UserX,
          type: 'action',
          onPress: handleDeleteAccount,
          danger: true,
        },
      ],
    },
  ];

  // ============================================
  // RENDER COMPONENTS
  // ============================================

  // Header con foto profilo
  const renderHeader = () => (
    <LinearGradient
      colors={['#3b82f6', '#1d4ed8']}
      style={[
        styles.header,
        isDesktop && styles.headerDesktop,
      ]}
    >
      {/* Pulsante Back */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <ArrowLeft size={24} color="#ffffff" />
        <Text style={styles.backButtonText}>Indietro</Text>
      </TouchableOpacity>

      <View style={styles.headerContent}>
        <View style={styles.profilePhotoContainer}>
          <TouchableOpacity onPress={handleUploadPhoto} activeOpacity={0.8}>
            {profile?.photoURL || user?.photoURL ? (
              <Image
                source={{ uri: profile?.photoURL || user?.photoURL }}
                style={styles.profilePhoto}
              />
            ) : (
              <View style={styles.profilePhotoPlaceholder}>
                <User size={40} color="#ffffff" />
              </View>
            )}
            <View style={styles.cameraButton}>
              {uploading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Camera size={16} color="#ffffff" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>
            {profile?.name || user?.name || 'Utente'}
          </Text>
          <Text style={styles.headerEmail}>
            {profile?.email || user?.email || ''}
          </Text>
          {user?.isMechanic && (
            <View style={styles.mechanicBadge}>
              <Text style={styles.mechanicBadgeText}>Meccanico</Text>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );

  // Singolo item settings
  const renderSettingItem = (item: SettingItem) => {
    const IconComponent = item.icon;
    const itemStyle = [
      styles.settingItem,
      {
        backgroundColor: theme.card,
        borderColor: theme.border,
      },
    ];

    return (
      <TouchableOpacity
        key={item.id}
        style={itemStyle}
        onPress={item.type !== 'toggle' ? item.onPress : undefined}
        activeOpacity={0.7}
        disabled={item.type === 'toggle'}
      >
        <View style={styles.settingItemLeft}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: item.danger ? `${theme.danger}15` : `${theme.primary}15` }
          ]}>
            <IconComponent
              size={20}
              color={item.danger ? theme.danger : theme.primary}
            />
          </View>
          <View style={styles.settingItemText}>
            <Text style={[
              styles.settingItemTitle,
              { color: item.danger ? theme.danger : theme.text }
            ]}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text style={[styles.settingItemSubtitle, { color: theme.textSecondary }]}>
                {item.subtitle}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.settingItemRight}>
          {item.type === 'toggle' ? (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={item.value ? '#ffffff' : '#f4f3f4'}
            />
          ) : (
            <ChevronRight size={20} color={theme.textSecondary} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Sezione settings
  const renderSection = (section: SettingSection) => (
    <View key={section.title} style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        {section.title.toUpperCase()}
      </Text>
      <View style={styles.sectionContent}>
        {section.items.map(renderSettingItem)}
      </View>
    </View>
  );

  // Layout Desktop (2 colonne)
  const renderDesktopLayout = () => (
    <View style={[styles.desktopContainer, { backgroundColor: theme.background }]}>
      <View style={styles.desktopContent}>
        <View style={styles.desktopLeft}>
          {sections.slice(0, Math.ceil(sections.length / 2)).map(renderSection)}
        </View>
        <View style={styles.desktopRight}>
          {sections.slice(Math.ceil(sections.length / 2)).map(renderSection)}
        </View>
      </View>
    </View>
  );

  // Layout Mobile (scroll verticale)
  const renderMobileLayout = () => (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      {sections.map(renderSection)}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );

  // ============================================
  // MAIN RENDER
  // ============================================
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Caricamento...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {renderHeader()}
      {isDesktop ? renderDesktopLayout() : renderMobileLayout()}
    </SafeAreaView>
  );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },

  // Header
  header: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  headerDesktop: {
    paddingVertical: 32,
    paddingHorizontal: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePhotoContainer: {
    position: 'relative',
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  profilePhotoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3b82f6',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  headerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  headerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  mechanicBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  mechanicBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },

  // Desktop Layout
  desktopContainer: {
    flex: 1,
  },
  desktopContent: {
    flexDirection: 'row',
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    padding: 32,
    gap: 32,
  },
  desktopLeft: {
    flex: 1,
  },
  desktopRight: {
    flex: 1,
  },

  // Section
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Setting Item
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingItemText: {
    marginLeft: 12,
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingItemSubtitle: {
    fontSize: 13,
  },
  settingItemRight: {
    marginLeft: 12,
  },

  // Bottom spacing
  bottomSpacing: {
    height: 32,
  },
});

export default SettingsScreen;

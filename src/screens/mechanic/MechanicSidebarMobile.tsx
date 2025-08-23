// src/screens/mechanic/MechanicSidebarMobile.tsx - COMPONENTE COMPLETO
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useStore } from '../../store';
import { useMechanicStats } from '../../hooks/useMechanicStats';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(screenWidth * 0.85, 320);

interface SidebarProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  color?: string;
}

const MechanicSidebarMobile: React.FC<SidebarProps> = ({ children, activeTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const store = useStore();
  const { darkMode } = store;
  
  // Funzione sicura per toggle dark mode
  const handleToggleDarkMode = () => {
    try {
      if (store && typeof store.toggleDarkMode === 'function') {
        store.toggleDarkMode();
        closeDrawer();
      } else {
        console.warn('toggleDarkMode function not available');
      }
    } catch (error) {
      console.error('Error toggling dark mode:', error);
    }
  };
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['main']);
  
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Tema dinamico
  const theme = {
    background: darkMode ? '#0f172a' : '#ffffff',
    surface: darkMode ? '#1e293b' : '#f8fafc',
    card: darkMode ? '#334155' : '#ffffff',
    primary: '#3b82f6',
    primaryLight: darkMode ? '#1e40af' : '#dbeafe',
    text: darkMode ? '#f1f5f9' : '#0f172a',
    textSecondary: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#334155' : '#e2e8f0',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    accent: darkMode ? '#7c3aed' : '#a855f7',
    overlay: 'rgba(0, 0, 0, 0.5)',
  };

  // Importa useMechanicStats per ottenere dati reali
  const { stats } = useMechanicStats();

  // Menu items con badge dinamici basati sui dati reali
  const menuSections = {
    main: {
      title: 'Principale',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'view-dashboard', color: theme.primary },
        { 
          id: 'cars', 
          label: 'Auto in Officina', 
          icon: 'car-multiple', 
          badge: stats.carsInWorkshop, 
          color: theme.success 
        },
        { 
          id: 'calendar', 
          label: 'Calendario', 
          icon: 'calendar', 
          badge: stats.appointmentsToday, 
          color: theme.accent 
        },
      ] as MenuItem[]
    },
    business: {
      title: 'Gestione',
      items: [
        { 
          id: 'invoices', 
          label: 'Fatturazione', 
          icon: 'receipt', 
          badge: stats.pendingInvoices, 
          color: theme.warning 
        },
        { 
          id: 'customers', 
          label: 'Clienti', 
          icon: 'account-group', 
          badge: stats.activeCustomers,
          color: theme.primary 
        },
        { id: 'parts', label: 'Ricambi', icon: 'wrench', color: theme.success },
        { id: 'reports', label: 'Report', icon: 'chart-bar', color: theme.accent },
      ] as MenuItem[]
    },
    account: {
      title: 'Account',
      items: [
        { id: 'profile', label: 'Il Mio Profilo', icon: 'account', color: theme.text },
        { id: 'settings', label: 'Impostazioni', icon: 'cog', color: theme.textSecondary },
      ] as MenuItem[]
    }
  };

  const openDrawer = () => {
    setIsDrawerOpen(true);
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: -DRAWER_WIDTH,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsDrawerOpen(false);
    });
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleMenuItemPress = (itemId: string) => {
    onTabChange(itemId);
    closeDrawer();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Sei sicuro di voler uscire?',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Esci', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Mobile Sidebar: Iniziando logout...');
              
              // Verifica che la funzione logout esista
              if (!logout || typeof logout !== 'function') {
                throw new Error('Logout function not available');
              }
              
              await logout();
              console.log('✅ Mobile Sidebar: Logout completato con successo');
              
              // Chiudi il drawer solo dopo il logout riuscito
              closeDrawer();
              
            } catch (error) {
              console.error('❌ Mobile Sidebar: Errore durante il logout:', error);
              
              // Forza il reload della pagina se siamo su web come fallback
              if (typeof window !== 'undefined' && window.location) {
                console.log('🔄 Forcing page reload as fallback...');
                closeDrawer();
                window.location.reload();
              } else {
                Alert.alert(
                  'Errore Logout',
                  'Si è verificato un errore durante il logout. L\'app verrà riavviata.',
                  [{ 
                    text: 'OK',
                    onPress: () => {
                      closeDrawer();
                      // Forza restart dell'app su mobile se possibile
                      if (typeof require !== 'undefined') {
                        try {
                          require('react-native').NativeModules.DevSettings?.reload?.();
                        } catch (e) {
                          console.log('Could not restart app');
                        }
                      }
                    }
                  }]
                );
              }
            }
          }
        }
      ]
    );
  };

  // Render dell'header principale con hamburger menu
  const renderMainHeader = () => (
    <View style={[styles.mainHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <TouchableOpacity
        style={styles.hamburgerButton}
        onPress={openDrawer}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="menu"
          size={24}
          color={theme.text}
        />
      </TouchableOpacity>
      
      <View style={styles.headerTitle}>
        <Text style={[styles.headerTitleText, { color: theme.text }]}>
          MyMeccanic
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          {user?.workshopName || 'officina 1'}
        </Text>
      </View>
      
      <View style={styles.headerActions}>
        {/* Notification Bell */}
        <TouchableOpacity style={styles.notificationButton}>
          <MaterialCommunityIcons
            name="bell"
            size={22}
            color={theme.textSecondary}
          />
          <View style={[styles.notificationDot, { backgroundColor: theme.danger }]} />
        </TouchableOpacity>
        
        {/* User Avatar Small */}
        <View style={[styles.userAvatarSmall, { backgroundColor: theme.primary }]}>
          <Text style={[styles.userAvatarSmallText, { color: '#ffffff' }]}>
            M
          </Text>
        </View>
      </View>
    </View>
  );

  // Render del profilo utente nel drawer
  const renderUserProfile = () => (
    <View style={[styles.userProfile, { borderBottomColor: theme.border }]}>
      <LinearGradient
        colors={[theme.primary, theme.accent]}
        style={styles.profileGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={styles.profileContent}>
        <View style={[styles.userAvatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Text style={styles.userAvatarText}>MG</Text>
        </View>
        
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={[styles.userName, { color: 'rgba(255,255,255,0.9)' }]}>
              meccanico g
            </Text>
            {user?.verified && (
              <MaterialCommunityIcons 
                name="check-decagram" 
                size={16} 
                color="#ffffff" 
              />
            )}
          </View>
          
          <Text style={[styles.workshopName, { color: 'rgba(255,255,255,0.9)' }]}>
            {user?.workshopName || 'officina 1'}
          </Text>
          
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <MaterialCommunityIcons name="star" size={14} color="#fbbf24" />
              <Text style={styles.quickStatText}>
                {user?.rating?.toFixed(1) || '0.0'}
              </Text>
            </View>
            
            <View style={styles.quickStat}>
              <MaterialCommunityIcons name="account-group" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.quickStatText}>
                {user?.reviewsCount || 0} recensioni
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  // Render di un menu item
  const renderMenuItem = (item: MenuItem, isActive: boolean) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.menuItem,
        isActive && { backgroundColor: theme.primaryLight },
      ]}
      onPress={() => handleMenuItemPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemContent}>
        <View style={[styles.menuItemIcon, isActive && { backgroundColor: theme.primary }]}>
          <MaterialCommunityIcons
            name={item.icon as any}
            size={22}
            color={isActive ? '#ffffff' : (item.color || theme.textSecondary)}
          />
        </View>
        
        <Text
          style={[
            styles.menuItemText,
            { color: isActive ? theme.primary : theme.text }
          ]}
        >
          {item.label}
        </Text>
      </View>
      
      {item.badge && item.badge > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.danger }]}>
          <Text style={styles.badgeText}>
            {item.badge > 99 ? '99+' : item.badge}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Render di una sezione di menu
  const renderMenuSection = (sectionId: string, section: any) => {
    const isExpanded = expandedSections.includes(sectionId);
    
    return (
      <View key={sectionId} style={styles.menuSection}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(sectionId)}
          activeOpacity={0.7}
        >
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {section.title}
          </Text>
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.sectionItems}>
            {section.items.map((item: MenuItem) => 
              renderMenuItem(item, activeTab === item.id)
            )}
          </View>
        )}
      </View>
    );
  };

  // Render del drawer content
  const renderDrawerContent = () => (
    <Animated.View
      style={[
        styles.drawer,
        { 
          backgroundColor: theme.background,
          transform: [{ translateX }]
        }
      ]}
    >
      <SafeAreaView style={styles.drawerContent}>
        {/* Profilo utente */}
        {renderUserProfile()}
        
        {/* Menu di navigazione */}
        <ScrollView 
          style={styles.menuContainer}
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(menuSections).map(([sectionId, section]) =>
            renderMenuSection(sectionId, section)
          )}
        </ScrollView>
        
        {/* Footer con azioni */}
        <View style={[styles.drawerFooter, { borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={handleToggleDarkMode}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={darkMode ? 'weather-sunny' : 'weather-night'}
              size={20}
              color={theme.textSecondary}
            />
            <Text style={[styles.footerButtonText, { color: theme.textSecondary }]}>
              {darkMode ? 'Tema Chiaro' : 'Tema Scuro'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.footerButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="logout"
              size={20}
              color={theme.danger}
            />
            <Text style={[styles.footerButtonText, { color: theme.danger }]}>
              Esci
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header principale sempre visibile */}
      {renderMainHeader()}
      
      {/* Contenuto principale */}
      <View style={[styles.contentContainer, { backgroundColor: theme.background }]}>
        {children}
      </View>
      
      {/* Modal per il drawer */}
      <Modal
        transparent={true}
        visible={isDrawerOpen}
        animationType="none"
        onRequestClose={closeDrawer}
      >
        <View style={styles.modalContainer}>
          {/* Overlay di sfondo */}
          <Animated.View 
            style={[
              styles.overlay,
              { opacity: overlayOpacity }
            ]}
          >
            <TouchableOpacity 
              style={styles.overlayTouch} 
              onPress={closeDrawer}
              activeOpacity={1}
            />
          </Animated.View>
          
          {/* Drawer content */}
          {renderDrawerContent()}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header principale
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12, // Ridotto per rimuovere spazio extra
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  hamburgerButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    padding: 6,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  userAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarSmallText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Contenuto principale
  contentContainer: {
    flex: 1,
  },
  
  // Modal e Drawer
  modalContainer: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouch: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  drawerContent: {
    flex: 1,
  },
  
  // Profilo utente nel drawer
  userProfile: {
    position: 'relative',
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  profileGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  profileContent: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  workshopName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickStatText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
  
  // Menu di navigazione
  menuContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  menuSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionItems: {
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 2,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Footer del drawer
  drawerFooter: {
    borderTopWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  footerButtonText: {
    fontSize: 14,
    marginLeft: 12,
    fontWeight: '500',
  },
});

export default MechanicSidebarMobile;
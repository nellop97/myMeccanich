// src/screens/mechanic/MechanicSidebarDesktop.tsx - COMPONENTE COMPLETO
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import { useStore } from '../../store';

const SIDEBAR_WIDTH = 280;

interface SidebarProps {
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

const MechanicSidebarDesktop: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const store = useStore();
  const { darkMode } = store;
  
  // Funzione sicura per toggle dark mode
  const handleToggleDarkMode = () => {
    try {
      if (store && typeof store.toggleDarkMode === 'function') {
        store.toggleDarkMode();
      } else {
        console.warn('toggleDarkMode function not available');
      }
    } catch (error) {
      console.error('Error toggling dark mode:', error);
    }
  };
  const [expandedSections, setExpandedSections] = useState<string[]>(['main']);

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
  };

  // Menu items con badge dinamici
  const menuSections = {
    main: {
      title: 'Principale',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'view-dashboard', color: theme.primary },
        { id: 'AllCarsInWorkshop', label: 'Auto in Officina', icon: 'car-multiple', badge: 8, color: theme.success },
        { id: 'MechanicCalendar', label: 'Calendario', icon: 'calendar', badge: 3, color: theme.accent },
        { id: 'NewAppointment', label: 'Nuovo Appuntamento', icon: 'car', color: theme.accent },
      ] as MenuItem[]
    },
    business: {
      title: 'Gestione',
      items: [
        { id: 'InvoicingDashboard', label: 'Fatturazione', icon: 'receipt', badge: 5, color: theme.warning },
        { id: 'CustomersList', label: 'Clienti', icon: 'account-group', color: theme.primary },
        { id: 'parts', label: 'Ricambi', icon: 'wrench', color: theme.success },
        { id: 'reports', label: 'Report', icon: 'chart-bar', color: theme.accent },
      ] as MenuItem[]
    },
    account: {
      title: 'Account',
      items: [
        { id: 'Profile', label: 'Il Mio Profilo', icon: 'account', color: theme.text },
        { id: 'settings', label: 'Impostazioni', icon: 'cog', color: theme.textSecondary },
      ] as MenuItem[]
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleMenuNavigation = (itemId: string) => {
    // For now, just handle the main dashboard items
    // You can extend this based on your navigation needs
    switch (itemId) {
      case 'dashboard':
        // Stay on current dashboard - no navigation needed
        break;
      case 'AllCarsInWorkshop':
        onTabChange('cars'); // This will change the tab in the dashboard
        break;
      case 'MechanicCalendar':
        onTabChange('calendar'); // This will change the tab in the dashboard
        break;
      case 'NewAppointment':
        // Navigate to the actual NewAppointment screen
        // You might need to pass navigation prop or use a different method
        break;
      case 'InvoicingDashboard':
        onTabChange('invoices'); // This will change the tab in the dashboard
        break;
      case 'CustomersList':
        onTabChange('customers'); // This will change the tab in the dashboard
        break;
      case 'Profile':
        // Navigate to profile screen
        break;
      default:
        console.log('Navigation not implemented for:', itemId);
    }
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
              console.log('🚪 Desktop Sidebar: Iniziando logout...');
              
              // Verifica che la funzione logout esista
              if (!logout || typeof logout !== 'function') {
                throw new Error('Logout function not available');
              }
              
              await logout();
              console.log('✅ Desktop Sidebar: Logout completato con successo');
              
            } catch (error) {
              console.error('❌ Desktop Sidebar: Errore durante il logout:', error);
              
              // Forza il reload della pagina se siamo su web come fallback
              if (typeof window !== 'undefined' && window.location) {
                console.log('🔄 Forcing page reload as fallback...');
                window.location.reload();
              } else {
                Alert.alert(
                  'Errore Logout',
                  'Si è verificato un errore durante il logout. L\'app verrà riavviata.',
                  [{ 
                    text: 'OK',
                    onPress: () => {
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

  // Render dell'header
  const renderHeader = () => (
    <View style={[styles.header, { borderBottomColor: theme.border }]}>
      <View style={[styles.logoContainer, { backgroundColor: theme.primary }]}>
        <MaterialCommunityIcons name="car-wrench" size={28} color="#ffffff" />
      </View>
      
      <View style={styles.headerText}>
        <Text style={[styles.logoText, { color: theme.text }]}>MyMeccanic</Text>
        <Text style={[styles.logoSubtext, { color: theme.textSecondary }]}>Dashboard</Text>
      </View>
    </View>
  );

  // Render del profilo utente
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
            <Text style={[styles.userName, { color: 'rgba(255,255,255,0.95)' }]}>
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
          
          <Text style={[styles.workshopName, { color: 'rgba(255,255,255,0.8)' }]}>
            {user?.workshopName || 'officina 1'}
          </Text>
          
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <MaterialCommunityIcons name="star" size={14} color="#fbbf24" />
              <Text style={styles.quickStatText}>0.0</Text>
            </View>
            
            <View style={styles.quickStat}>
              <MaterialCommunityIcons name="account-group" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.quickStatText}>0 recensioni</Text>
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
      onPress={() => handleMenuNavigation(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemContent}>
        <View style={[styles.menuItemIcon, isActive && { backgroundColor: theme.primary }]}>
          <MaterialCommunityIcons
            name={item.icon as any}
            size={20}
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
            size={16}
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      {renderHeader()}
      
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
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        {/* Toggle tema */}
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
        
        {/* Logout */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    zIndex: 1000,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  // Header
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
  },
  logoSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  
  // Profilo utente
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
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#ffffff',
    fontSize: 18,
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
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  workshopName: {
    fontSize: 12,
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
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
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
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionItems: {
    gap: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 1,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  
  // Footer
  footer: {
    borderTopWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  footerButtonText: {
    fontSize: 13,
    marginLeft: 12,
    fontWeight: '500',
  },
});

export default MechanicSidebarDesktop;
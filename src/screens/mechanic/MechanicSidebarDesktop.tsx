// src/components/mechanic/MechanicSidebarDesktop.tsx - AGGIORNATO
import React, { useState, useEffect } from 'react';
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
  const { darkMode, toggleDarkMode } = useStore();
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
        { id: 'cars', label: 'Auto in Officina', icon: 'car-multiple', badge: 8, color: theme.success },
        { id: 'calendar', label: 'Calendario', icon: 'calendar', badge: 3, color: theme.accent },
      ] as MenuItem[]
    },
    business: {
      title: 'Gestione',
      items: [
        { id: 'invoices', label: 'Fatturazione', icon: 'receipt', badge: 5, color: theme.warning },
        { id: 'customers', label: 'Clienti', icon: 'account-group', color: theme.primary },
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

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
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
              await logout();
            } catch (error) {
              console.error('Errore durante il logout:', error);
            }
          }
        }
      ]
    );
  };

  // Render del logo e header
  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.surface }]}>
      <LinearGradient
        colors={[theme.primary, '#1d4ed8']}
        style={styles.logoContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <MaterialCommunityIcons 
          name="car-wrench" 
          size={28} 
          color="#ffffff" 
        />
      </LinearGradient>
      
      <View style={styles.headerText}>
        <Text style={[styles.appName, { color: theme.text }]}>
          MyMeccanic
        </Text>
        <Text style={[styles.appSubtitle, { color: theme.textSecondary }]}>
          Pannello Meccanico
        </Text>
      </View>
    </View>
  );

  // Render del profilo utente
  const renderUserProfile = () => (
    <View style={[styles.userProfile, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.userAvatar, { backgroundColor: theme.primaryLight }]}>
        <Text style={[styles.userAvatarText, { color: theme.primary }]}>
          {user?.firstName?.charAt(0)?.toUpperCase() || 'M'}
          {user?.lastName?.charAt(0)?.toUpperCase() || 'G'}
        </Text>
      </View>
      
      <View style={styles.userInfo}>
        <View style={styles.userNameRow}>
          <Text style={[styles.userName, { color: theme.text }]}>
            {user?.firstName || 'Meccanico'} {user?.lastName || 'G'}
          </Text>
          {user?.verified && (
            <MaterialCommunityIcons 
              name="check-decagram" 
              size={16} 
              color={theme.success} 
            />
          )}
        </View>
        
        <Text style={[styles.workshopName, { color: theme.primary }]}>
          {user?.workshopName || 'Officina 1'}
        </Text>
        
        <View style={styles.userStats}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons 
              name="star" 
              size={12} 
              color={theme.warning} 
            />
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
              {(user?.rating || 0).toFixed(1)}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <MaterialCommunityIcons 
              name="account-group" 
              size={12} 
              color={theme.textSecondary} 
            />
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
              {user?.reviewsCount || 0} recensioni
            </Text>
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
        { borderColor: theme.border }
      ]}
      onPress={() => onTabChange(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemContent}>
        <MaterialCommunityIcons
          name={item.icon as any}
          size={20}
          color={isActive ? theme.primary : (item.color || theme.textSecondary)}
        />
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
          onPress={toggleDarkMode}
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
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
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
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  appSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  userProfile: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  workshopName: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  userStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statText: {
    fontSize: 11,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  menuSection: {
    marginBottom: 8,
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
    gap: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 2,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
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
  footer: {
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  footerButtonText: {
    fontSize: 14,
    marginLeft: 12,
    fontWeight: '500',
  },
});

export default MechanicSidebarDesktop;
// src/components/mechanic/MechanicSidebarDesktop.tsx
import { useNavigation } from '@react-navigation/native';
import {
    Calendar,
    Car,
    FileText,
    Settings,
    Wrench,
} from 'lucide-react-native';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useStore } from '../../store';

const SIDEBAR_WIDTH = 250;

interface MechanicSidebarDesktopProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MechanicSidebarDesktop: React.FC<MechanicSidebarDesktopProps> = ({
  activeTab,
  onTabChange,
}) => {
  const navigation = useNavigation();
  const { user, darkMode, toggleDarkMode } = useStore();

  const theme = {
    sidebarBackground: darkMode ? '#1f2937' : '#1e40af',
  };

  const handleNavigation = (screen: string) => {
    onTabChange(screen);
    
    switch (screen) {
      case 'appointments':
        navigation.navigate('NewAppointment' as never);
        break;
      case 'invoices':
        console.log('Navigazione a Fatturazione');
        break;
      case 'archive':
        console.log('Navigazione ad Archivio Auto');
        break;
      case 'settings':
        console.log('Navigazione a Impostazioni');
        break;
      default:
        // Dashboard - resta sulla schermata corrente
        break;
    }
  };

  const SidebarButton = ({ title, icon: Icon, isActive, onPress }: any) => (
    <TouchableOpacity
      style={[
        styles.sidebarButton,
        isActive && styles.sidebarButtonActive,
        { backgroundColor: isActive ? (darkMode ? '#374151' : '#1d4ed8') : 'transparent' }
      ]}
      onPress={onPress}
    >
      <Icon size={20} color="#ffffff" />
      <Text style={styles.sidebarButtonText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.sidebar, { backgroundColor: theme.sidebarBackground }]}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarTitle}>AutoGestione</Text>
        <Text style={styles.sidebarSubtitle}>Pannello Officina</Text>
      </View>
      
      <ScrollView style={styles.sidebarNav} showsVerticalScrollIndicator={false}>
        <SidebarButton
          title="Dashboard"
          icon={Wrench}
          isActive={activeTab === 'dashboard'}
          onPress={() => handleNavigation('dashboard')}
        />
        <SidebarButton
          title="Appuntamenti"
          icon={Calendar}
          isActive={activeTab === 'appointments'}
          onPress={() => handleNavigation('appointments')}
        />
        <SidebarButton
          title="Fatturazione"
          icon={FileText}
          isActive={activeTab === 'invoices'}
          onPress={() => handleNavigation('invoices')}
        />
        <SidebarButton
          title="Archivio Auto"
          icon={Car}
          isActive={activeTab === 'archive'}
          onPress={() => handleNavigation('archive')}
        />
        <SidebarButton
          title="Impostazioni"
          icon={Settings}
          isActive={activeTab === 'settings'}
          onPress={() => handleNavigation('settings')}
        />
      </ScrollView>
      
      <View style={styles.sidebarFooter}>
        <View style={styles.userProfile}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user.name ? user.name.substring(0, 2).toUpperCase() : 'MG'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name || 'Mario Galli'}</Text>
            <Text style={styles.userRole}>
              {user.isMechanic ? 'Meccanico' : 'Utente'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.themeButton}
          onPress={toggleDarkMode}
        >
          <Text style={styles.themeButtonText}>
            {darkMode ? 'Modalità Chiara' : 'Modalità Scura'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    padding: 16,
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 1000,
  },
  sidebarHeader: {
    marginBottom: 32,
    paddingTop: 20,
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sidebarSubtitle: {
    fontSize: 14,
    color: '#93c5fd',
    marginTop: 4,
  },
  sidebarNav: {
    flex: 1,
  },
  sidebarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  sidebarButtonActive: {
    // backgroundColor set dynamically
  },
  sidebarButtonText: {
    color: '#ffffff',
    marginLeft: 12,
    fontSize: 16,
  },
  sidebarFooter: {
    marginTop: 32,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  userAvatar: {
    width: 40,
    height: 40,
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 16,
  },
  userRole: {
    color: '#93c5fd',
    fontSize: 12,
  },
  themeButton: {
    backgroundColor: '#1e40af',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  themeButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
});

export default MechanicSidebarDesktop;
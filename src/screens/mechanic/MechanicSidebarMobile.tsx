// src/components/mechanic/MechanicSidebarMobile.tsx
import { useNavigation } from '@react-navigation/native';
import {
    Bell,
    Calendar,
    Car,
    FileText,
    Menu,
    PlusCircle,
    Settings,
    Wrench,
    X,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useStore } from '../../store';
import { useWorkshopStore } from '../../store/workshopStore';

const { width: screenWidth } = Dimensions.get('window');
const SIDEBAR_WIDTH = 280;

interface MechanicSidebarMobileProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MechanicSidebarMobile: React.FC<MechanicSidebarMobileProps> = ({
  children,
  activeTab,
  onTabChange,
}) => {
  const navigation = useNavigation();
  const { user, darkMode, toggleDarkMode } = useStore();
  const { addCar } = useWorkshopStore();
  
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnimation = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(sidebarAnimation, {
      toValue: sidebarVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [sidebarVisible]);

  const theme = {
    background: darkMode ? '#1f2937' : '#ffffff',
    sidebarBackground: darkMode ? '#1f2937' : '#1e40af',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#9ca3af' : '#6b7280',
    overlay: 'rgba(0, 0, 0, 0.5)',
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const closeSidebar = () => {
    setSidebarVisible(false);
  };

  const handleNavigation = (screen: string) => {
    closeSidebar();
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
        { backgroundColor: isActive ? (darkMode ? '#374151' : '#1d4ed8') : 'transparent' }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon size={20} color="#ffffff" />
      <Text style={styles.sidebarButtonText}>{title}</Text>
    </TouchableOpacity>
  );

  const Sidebar = () => (
    <Animated.View 
      style={[
        styles.sidebar, 
        { 
          backgroundColor: theme.sidebarBackground,
          transform: [{
            translateX: sidebarAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [-SIDEBAR_WIDTH, 0],
            })
          }]
        }
      ]}
    >
      <View style={styles.sidebarHeader}>
        <View style={styles.sidebarTitleContainer}>
          <Text style={styles.sidebarTitle}>AutoGestione</Text>
          <TouchableOpacity onPress={closeSidebar} style={styles.closeButton}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
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
          activeOpacity={0.7}
        >
          <Text style={styles.themeButtonText}>
            {darkMode ? 'Modalità Chiara' : 'Modalità Scura'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header Mobile */}
      <View style={[styles.headerContainer, { backgroundColor: theme.background }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <Menu size={24} color={theme.text} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Buongiorno, {user.name?.split(' ')[0] || 'Mario'}!
            </Text>
            <View style={styles.notificationBadge}>
              <Bell size={14} color="#d97706" />
              <Text style={styles.notificationText}>3 notifiche</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.addButtonMobile}
          onPress={() => navigation.navigate('NewAppointment')}
        >
          <PlusCircle size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {children}
      </View>

      {/* Sidebar Modal */}
      <Modal
        visible={sidebarVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeSidebar}
      >
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={[styles.overlayTouchable, { backgroundColor: theme.overlay }]}
            onPress={closeSidebar}
            activeOpacity={1}
          />
          <Sidebar />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 40, // Per lo status bar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  notificationText: {
    color: '#d97706',
    fontSize: 12,
    marginLeft: 4,
  },
  addButtonMobile: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  overlayTouchable: {
    flex: 1,
  },
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
    marginBottom: 24,
    paddingTop: 40,
  },
  sidebarTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
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
  sidebarButtonText: {
    color: '#ffffff',
    marginLeft: 12,
    fontSize: 16,
  },
  sidebarFooter: {
    paddingBottom: 40,
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

export default MechanicSidebarMobile;
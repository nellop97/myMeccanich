// src/screens/mechanic/MechanicSidebarMobile.tsx - VERSIONE CORRETTA COMPLETA

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

// ✅ USA FIREBASE AUTH INVECE DI STORE PER DATI UTENTE
import { useAuth } from '../../hooks/useAuth';
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
  
  // ✅ USA FIREBASE AUTH PER DATI UTENTE
  const { user } = useAuth();
  
  // ✅ USA STORE SOLO PER DATI APP (TEMA, ECC.)
  const { darkMode, setDarkMode } = useStore();
  const { addCar } = useWorkshopStore();
  
  // ✅ TUTTI GLI HOOKS DEVONO ESSERE CHIAMATI SEMPRE
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnimation = useRef(new Animated.Value(0)).current;
  
  // ✅ FUNZIONE PER GESTIRE TOGGLE DEL DARK MODE
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // ✅ COSTRUISCI IL NOME UTENTE CON FALLBACK SICURO
  const userName = user?.displayName || 
                  `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
                  user?.email?.split('@')[0] ||
                  'Meccanico';
  
  useEffect(() => {
    Animated.timing(sidebarAnimation, {
      toValue: sidebarVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [sidebarVisible]);

  // ✅ CONTROLLO DI SICUREZZA DOPO TUTTI GLI HOOKS
  if (!user) {
    console.log('⚠️ MechanicSidebarMobile: user is undefined, showing loading...');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Caricamento profilo...</Text>
      </View>
    );
  }

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
        navigation.navigate('InvoicingDashboard' as never);
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
              {/* ✅ CORREZIONE: Usa userName costruito sopra */}
              {userName.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            {/* ✅ CORREZIONE: Usa userName costruito sopra */}
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userRole}>
              {/* ✅ CORREZIONE: Controllo sicuro */}
              {user?.userType === 'mechanic' ? 'Meccanico' : 'Utente'}
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
              {/* ✅ CORREZIONE: Usa userName costruito sopra */}
              Buongiorno, {userName.split(' ')[0] || 'Meccanico'}!
            </Text>
            <View style={styles.notificationBadge}>
              <Bell size={14} color="#d97706" />
              <TouchableOpacity onPress={() => alert("ci stiamo lavorando")}>
                <Text style={styles.notificationText}>3 notifiche</Text>
              </TouchableOpacity>
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

// ✅ STILI DEL COMPONENTE
const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    marginRight: 12,
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  notificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  notificationText: {
    fontSize: 12,
    color: '#d97706',
    marginLeft: 4,
  },
  addButtonMobile: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 8,
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
    paddingTop: 40,
  },
  sidebarHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sidebarTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  sidebarSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  sidebarNav: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 20,
  },
  sidebarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 2,
    borderRadius: 8,
  },
  sidebarButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  sidebarFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  userRole: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  themeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
  },
  themeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default MechanicSidebarMobile;
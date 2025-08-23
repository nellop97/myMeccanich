// src/screens/mechanic/MechanicLayout.tsx - CON MENU LATERALE RIPRISTINATO
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Platform,
  StyleSheet,
  View,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store';
import { useAuth } from '../../hooks/useAuth';

// Import dei componenti sidebar completi
import MechanicSidebarDesktop from './MechanicSidebarDesktop';
import MechanicSidebarMobile from './MechanicSidebarMobile';

const { width: screenWidth } = Dimensions.get('window');
const SIDEBAR_WIDTH_DESKTOP = 280;
const BREAKPOINT_TABLET = 768;
const BREAKPOINT_DESKTOP = 1024;

interface MechanicLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MechanicLayout: React.FC<MechanicLayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange 
}) => {
  const { darkMode } = useStore();
  const { user } = useAuth();
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  
  // Determina il tipo di layout in base alle dimensioni
  const isDesktop = Platform.OS === 'web' && dimensions.width >= BREAKPOINT_DESKTOP;
  const isTablet = Platform.OS === 'web' && dimensions.width >= BREAKPOINT_TABLET && dimensions.width < BREAKPOINT_DESKTOP;
  const isMobile = dimensions.width < BREAKPOINT_TABLET;

  // Tema dinamico basato su dark mode
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

  // Listener per i cambiamenti delle dimensioni
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  // Configurazione della status bar
  useEffect(() => {
    if (Platform.OS !== 'web') {
      StatusBar.setBarStyle(darkMode ? 'light-content' : 'dark-content', true);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(theme.surface, true);
      }
    }
  }, [darkMode, theme.surface]);

  // Render per Desktop - CON SIDEBAR FISSA
  const renderDesktopLayout = () => (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.desktopContainer}>
        {/* Sidebar Desktop sempre visibile */}
        <MechanicSidebarDesktop 
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
        
        {/* Contenuto principale con margine per sidebar */}
        <View style={[styles.desktopContent, { marginLeft: SIDEBAR_WIDTH_DESKTOP }]}>
          <View style={[styles.contentWrapper, { backgroundColor: theme.background }]}>
            {children}
          </View>
        </View>
      </View>
    </View>
  );

  // Render per Tablet (layout ibrido)
  const renderTabletLayout = () => (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Per tablet, usiamo il layout mobile ma con più spazio */}
        <MechanicSidebarMobile 
          activeTab={activeTab}
          onTabChange={onTabChange}
        >
          <View style={[styles.tabletContent, { backgroundColor: theme.background }]}>
            {children}
          </View>
        </MechanicSidebarMobile>
      </SafeAreaView>
    </View>
  );

  // Render per Mobile - CON DRAWER LATERALE
  const renderMobileLayout = () => (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Layout mobile con drawer sidebar */}
        <MechanicSidebarMobile 
          activeTab={activeTab}
          onTabChange={onTabChange}
        >
          <View style={[styles.mobileContent, { backgroundColor: theme.background }]}>
            {children}
          </View>
        </MechanicSidebarMobile>
      </SafeAreaView>
    </View>
  );

  // Render del layout appropriato
  if (isDesktop) {
    return renderDesktopLayout();
  } else if (isTablet) {
    return renderTabletLayout();
  } else {
    return renderMobileLayout();
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Desktop Layout
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopContent: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    paddingTop: 0, // Rimuovi padding extra che crea spazio bianco
  },
  
  // Tablet Layout
  safeArea: {
    flex: 1,
  },
  tabletContent: {
    flex: 1,
    paddingTop: 0, // Rimuovi padding extra
  },
  
  // Mobile Layout
  mobileContent: {
    flex: 1,
    paddingTop: 0, // Rimuovi padding extra che crea spazio bianco
  },
});

// Responsive utilities
export const getResponsiveStyle = (dimensions: any) => {
  const { width: screenWidth } = dimensions;
  
  return StyleSheet.create({
    // Container Responsive - PADDING RIDOTTO
    containerResponsive: {
      paddingHorizontal: Platform.select({
        web: screenWidth >= BREAKPOINT_DESKTOP ? 0 : 0,
        default: 0,
      }),
      paddingVertical: Platform.select({
        web: screenWidth >= BREAKPOINT_DESKTOP ? 0 : 0,
        default: 0,
      }),
    },
    
    // Text Responsive
    textLarge: {
      fontSize: Platform.select({
        web: screenWidth >= BREAKPOINT_DESKTOP ? 28 : screenWidth >= BREAKPOINT_TABLET ? 24 : 22,
        default: 22,
      }),
      fontWeight: '700',
    },
    textMedium: {
      fontSize: Platform.select({
        web: screenWidth >= BREAKPOINT_DESKTOP ? 18 : screenWidth >= BREAKPOINT_TABLET ? 16 : 15,
        default: 15,
      }),
      fontWeight: '500',
    },
    textSmall: {
      fontSize: Platform.select({
        web: screenWidth >= BREAKPOINT_DESKTOP ? 16 : screenWidth >= BREAKPOINT_TABLET ? 14 : 13,
        default: 13,
      }),
    },
    
    // Card con ombra responsive
    cardShadow: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: Platform.select({
          web: screenWidth >= BREAKPOINT_DESKTOP ? 4 : 2,
          default: 2,
        })
      },
      shadowOpacity: 0.1,
      shadowRadius: Platform.select({
        web: screenWidth >= BREAKPOINT_DESKTOP ? 8 : 4,
        default: 4,
      }),
      elevation: Platform.select({
        web: 0,
        default: 3,
      }),
    },
  });
};

export default MechanicLayout;
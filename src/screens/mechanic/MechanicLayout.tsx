// src/components/mechanic/MechanicLayout.tsx - AGGIORNATO
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

  // Render per Desktop
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

  // Render per Mobile
  const renderMobileLayout = () => (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
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
  safeArea: {
    flex: 1,
  },
  
  // Desktop Layout
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopContent: {
    flex: 1,
    minHeight: '100%',
  },
  contentWrapper: {
    flex: 1,
    minHeight: '100vh',
  },
  
  // Tablet Layout
  tabletContent: {
    flex: 1,
    paddingHorizontal: 16, // Più padding sui tablet
  },
  
  // Mobile Layout
  mobileContent: {
    flex: 1,
  },

  // Responsive Grid System per contenuti
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    padding: 16,
  },
  gridItem: {
    flex: 1,
    minWidth: 280, // Larghezza minima per desktop
  },
  
  // Responsive Typography
  titleLarge: {
    fontSize: Platform.select({
      web: screenWidth >= BREAKPOINT_DESKTOP ? 32 : screenWidth >= BREAKPOINT_TABLET ? 28 : 24,
      default: 24,
    }),
    fontWeight: 'bold',
  },
  titleMedium: {
    fontSize: Platform.select({
      web: screenWidth >= BREAKPOINT_DESKTOP ? 24 : screenWidth >= BREAKPOINT_TABLET ? 22 : 20,
      default: 20,
    }),
    fontWeight: '600',
  },
  titleSmall: {
    fontSize: Platform.select({
      web: screenWidth >= BREAKPOINT_DESKTOP ? 18 : screenWidth >= BREAKPOINT_TABLET ? 16 : 16,
      default: 16,
    }),
    fontWeight: '500',
  },
  
  // Responsive Spacing
  paddingResponsive: {
    padding: Platform.select({
      web: screenWidth >= BREAKPOINT_DESKTOP ? 24 : screenWidth >= BREAKPOINT_TABLET ? 20 : 16,
      default: 16,
    }),
  },
  marginResponsive: {
    margin: Platform.select({
      web: screenWidth >= BREAKPOINT_DESKTOP ? 16 : screenWidth >= BREAKPOINT_TABLET ? 12 : 8,
      default: 8,
    }),
  },
  
  // Card Responsive Styling
  cardResponsive: {
    borderRadius: Platform.select({
      web: screenWidth >= BREAKPOINT_DESKTOP ? 16 : 12,
      default: 12,
    }),
    padding: Platform.select({
      web: screenWidth >= BREAKPOINT_DESKTOP ? 24 : screenWidth >= BREAKPOINT_TABLET ? 20 : 16,
      default: 16,
    }),
    marginBottom: Platform.select({
      web: screenWidth >= BREAKPOINT_DESKTOP ? 24 : screenWidth >= BREAKPOINT_TABLET ? 20 : 16,
      default: 16,
    }),
    elevation: Platform.select({
      web: 0,
      default: 2,
    }),
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: Platform.select({
        web: screenWidth >= BREAKPOINT_DESKTOP ? 4 : 2,
        default: 2,
      })
    },
    shadowOpacity: Platform.select({
      web: screenWidth >= BREAKPOINT_DESKTOP ? 0.1 : 0.05,
      default: 0.1,
    }),
    shadowRadius: Platform.select({
      web: screenWidth >= BREAKPOINT_DESKTOP ? 8 : 4,
      default: 4,
    }),
  },
  
  // Button Responsive Styling
  buttonResponsive: {
    paddingHorizontal: Platform.select({
      web: screenWidth >= BREAKPOINT_DESKTOP ? 24 : screenWidth >= BREAKPOINT_TABLET ? 20 : 16,
      default: 16,
    }),
    paddingVertical: Platform.select({
      web: screenWidth >= BREAKPOINT_DESKTOP ? 16 : screenWidth >= BREAKPOINT_TABLET ? 14 : 12,
      default: 12,
    }),
    borderRadius: Platform.select({
      web: screenWidth >= BREAKPOINT_DESKTOP ? 12 : 10,
      default: 10,
    }),
  },
  
  // Icon Responsive Sizing
  iconSmall: Platform.select({
    web: screenWidth >= BREAKPOINT_DESKTOP ? 20 : screenWidth >= BREAKPOINT_TABLET ? 18 : 16,
    default: 16,
  }),
  iconMedium: Platform.select({
    web: screenWidth >= BREAKPOINT_DESKTOP ? 28 : screenWidth >= BREAKPOINT_TABLET ? 24 : 22,
    default: 22,
  }),
  iconLarge: Platform.select({
    web: screenWidth >= BREAKPOINT_DESKTOP ? 36 : screenWidth >= BREAKPOINT_TABLET ? 32 : 28,
    default: 28,
  }),
});

export default MechanicLayout;
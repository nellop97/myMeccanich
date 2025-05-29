// src/components/mechanic/MechanicLayout.tsx
import React from 'react';
import {
    Dimensions,
    Platform,
    StyleSheet,
    View,
} from 'react-native';
import { useStore } from '../../store';
import MechanicSidebarDesktop from './MechanicSidebarDesktop';
import MechanicSidebarMobile from './MechanicSidebarMobile';

const { width: screenWidth } = Dimensions.get('window');
const SIDEBAR_WIDTH_DESKTOP = 250;
const SIDEBAR_WIDTH_MOBILE = 280;

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
  const isDesktop = Platform.OS === 'web' && screenWidth > 768;

  const theme = {
    background: darkMode ? '#111827' : '#f3f4f6',
  };

  if (isDesktop) {
    // Layout Desktop con sidebar sempre visibile
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.desktopContainer}>
          <MechanicSidebarDesktop 
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
          <View style={styles.desktopContent}>
            {children}
          </View>
        </View>
      </View>
    );
  } else {
    // Layout Mobile con sidebar drawer
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <MechanicSidebarMobile 
          activeTab={activeTab}
          onTabChange={onTabChange}
        >
          {children}
        </MechanicSidebarMobile>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopContent: {
    flex: 1,
    marginLeft: SIDEBAR_WIDTH_DESKTOP,
  },
});

export default MechanicLayout;
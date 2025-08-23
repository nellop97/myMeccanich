// src/screens/mechanic/MechanicDashboard.tsx - AGGIORNATO
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// Import hooks e store
import { useAuth } from '../../hooks/useAuth';
import { useStore } from '../../store';

// Import layout
import MechanicLayout from './MechanicLayout';

// Import componenti
import MechanicDashboardContent from './MechanicDashboardContent';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isDesktop = Platform.OS === 'web' && screenWidth > 768;

interface MechanicData {
  loginProvider: string;
  firstName: string;
  lastName: string;
  uid: string;
  userType: string;
  createdAt: any;
  address: string;
  rating: number;
  profileComplete: boolean;
  vatNumber: string;
  updatedAt: any;
  phone: string;
  workshopName: string;
  mechanicLicense: string;
  reviewsCount: number;
  email: string;
  verified: boolean;
}

const MechanicDashboard: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { darkMode } = useStore();

  // Stati locali
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mechanicData, setMechanicData] = useState<MechanicData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Tema dinamico
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
  };

  // Carica i dati del meccanico all'avvio
  useEffect(() => {
    if (user) {
      loadMechanicData();
    }
  }, [user]);

  const loadMechanicData = async () => {
    try {
      setIsLoading(true);
      
      // Simula i dati del meccanico da Firebase
      const mechanicResponse: MechanicData = {
        loginProvider: "email",
        firstName: user?.firstName || "meccanico",
        lastName: user?.lastName || "g",
        uid: user?.uid || "ckC1uaEc2BgOchGAKPP0YJQd3cN2",
        userType: "mechanic",
        createdAt: {
          type: "firestore/timestamp/1.0",
          seconds: 1755430539,
          nanoseconds: 85000000
        },
        address: user?.address || "via genaoc 1",
        rating: user?.rating || 0,
        profileComplete: user?.profileComplete || true,
        vatNumber: user?.vatNumber || "18427",
        updatedAt: {
          type: "firestore/timestamp/1.0",
          seconds: 1755430539,
          nanoseconds: 85000000
        },
        phone: user?.phone || "3333146760",
        workshopName: user?.workshopName || "officina 1",
        mechanicLicense: user?.mechanicLicense || "",
        reviewsCount: user?.reviewsCount || 0,
        email: user?.email || "meccanico@gmail.com",
        verified: user?.verified || false
      };

      setMechanicData(mechanicResponse);
    } catch (error) {
      console.error('Errore nel caricamento dati meccanico:', error);
      Alert.alert('Errore', 'Impossibile caricare i dati del profilo');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMechanicData();
    setRefreshing(false);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Navigazione in base al tab selezionato
    switch (tab) {
      case 'dashboard':
        // Rimani sulla dashboard
        break;
      case 'cars':
        navigation.navigate('AllCarsInWorkshop' as never);
        break;
      case 'calendar':
        navigation.navigate('MechanicCalendar' as never);
        break;
      case 'invoices':
        navigation.navigate('InvoicingDashboard' as never);
        break;
      case 'customers':
        navigation.navigate('CustomersList' as never);
        break;
      case 'profile':
        navigation.navigate('Profile', { userId: mechanicData?.uid } as never);
        break;
      case 'settings':
        navigation.navigate('Settings' as never);
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
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
              await logout();
            } catch (error) {
              console.error('Errore durante il logout:', error);
            }
          }
        }
      ]
    );
  };

  // Render del contenuto principale in base al tab attivo
  const renderMainContent = () => {
    if (isLoading && !mechanicData) {
      return (
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <MaterialCommunityIcons 
            name="loading" 
            size={40} 
            color={theme.primary}
            style={{ marginBottom: 16 }}
          />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Caricamento dati...
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={[styles.scrollContainer, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header del meccanico */}
        <MechanicHeader mechanicData={mechanicData} theme={theme} />
        
        {/* Contenuto della dashboard */}
        <MechanicDashboardContent 
          mechanicData={mechanicData}
          theme={theme}
          navigation={navigation}
        />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <MechanicLayout 
        activeTab={activeTab}
        onTabChange={handleTabChange}
      >
        {renderMainContent()}
      </MechanicLayout>
    </SafeAreaView>
  );
};

// Componente Header del Meccanico
const MechanicHeader: React.FC<{ mechanicData: MechanicData | null; theme: any }> = ({ 
  mechanicData, 
  theme 
}) => {
  if (!mechanicData) return null;

  return (
    <View style={[styles.headerContainer, { backgroundColor: theme.surface }]}>
      <LinearGradient
        colors={[theme.primary, theme.primaryDark]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
      
      <View style={styles.headerContent}>
        <View style={styles.profileSection}>
          <View style={[styles.avatarContainer, { borderColor: theme.primary }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>
              {mechanicData.firstName.charAt(0).toUpperCase()}
              {mechanicData.lastName.charAt(0).toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.profileInfo}>
            <View style={styles.nameSection}>
              <Text style={[styles.mechanicName, { color: theme.text }]}>
                {mechanicData.firstName} {mechanicData.lastName}
              </Text>
              {mechanicData.verified && (
                <MaterialCommunityIcons 
                  name="check-decagram" 
                  size={20} 
                  color={theme.success}
                  style={styles.verifiedIcon}
                />
              )}
            </View>
            
            <Text style={[styles.workshopName, { color: theme.primary }]}>
              {mechanicData.workshopName}
            </Text>
            
            <View style={styles.ratingSection}>
              <View style={styles.ratingContainer}>
                <MaterialCommunityIcons 
                  name="star" 
                  size={16} 
                  color={theme.warning} 
                />
                <Text style={[styles.ratingText, { color: theme.textSecondary }]}>
                  {mechanicData.rating.toFixed(1)} ({mechanicData.reviewsCount} recensioni)
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons 
              name="map-marker" 
              size={16} 
              color={theme.textSecondary} 
            />
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
              {mechanicData.address}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <MaterialCommunityIcons 
              name="phone" 
              size={16} 
              color={theme.textSecondary} 
            />
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
              {mechanicData.phone}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <MaterialCommunityIcons 
              name="identifier" 
              size={16} 
              color={theme.textSecondary} 
            />
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
              P.IVA: {mechanicData.vatNumber}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

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
    fontSize: 16,
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerContainer: {
    marginBottom: 20,
    borderRadius: 16,
    marginHorizontal: isDesktop ? 20 : 16,
    marginTop: isDesktop ? 20 : 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  headerContent: {
    padding: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  mechanicName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  verifiedIcon: {
    marginLeft: 8,
  },
  workshopName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: isDesktop ? 'row' : 'column',
    gap: isDesktop ? 20 : 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: isDesktop ? 1 : undefined,
  },
  statText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});

export default MechanicDashboard;
// src/screens/mechanic/MechanicDashboard.tsx - VERSIONE MODIFICATA
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// Import hooks e store
import { useAuth } from '../../hooks/useAuth';
import { useStore } from '../../store';

// Import layout con menu laterale
import MechanicLayout from './MechanicLayout';

// Import componenti
import MechanicDashboardContent from './MechanicDashboardContent';

import { useMechanicTheme } from './mechanicTheme';

import MechanicIcon from './MechanicIcon';
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
  const theme = useMechanicTheme();

  // Stati locali
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mechanicData, setMechanicData] = useState<MechanicData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Tema dinamico

  // Caricamento dati del meccanico
  useEffect(() => {
    if (user) {
      setMechanicData({
        firstName: user.firstName || 'meccanico',
        lastName: user.lastName || 'g',
        workshopName: user.workshopName || 'officina 1',
        phone: '3333146760',
        address: 'via genaoc 1',
        vatNumber: 'P.IVA: 18427',
        rating: 0.0,
        reviewsCount: 0,
        verified: true,
        ...user
      } as MechanicData);
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Il refresh viene gestito dall'hook useMechanicStats nel componente figlio
      // Qui possiamo aggiungere altri refresh se necessario
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simula caricamento
    } catch (error) {
      console.error('Errore durante il refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);

    // Navigazione basata sul tab selezionato
    switch (tab) {
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
      case 'parts':
        navigation.navigate('RepairPartsManagement' as never, { carId: '', repairId: '' } as never);
        break;
      case 'mechanicProfile':
        navigation.navigate('MechanicProfile' as never);
        break;
      case 'profile':
        // Fallback per compatibilità
        navigation.navigate('MechanicProfile' as never);
        break;
      // Dashboard è il default, non naviga
      default:
        break;
    }
  };

  // Render del contenuto principale
  const renderMainContent = () => {
    if (isLoading && !mechanicData) {
      return (
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <MechanicIcon 
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />
        }
      >
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
    <MechanicLayout 
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      {renderMainContent()}
    </MechanicLayout>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20, // Aggiungi padding per il contenuto principale
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
});

export default MechanicDashboard;
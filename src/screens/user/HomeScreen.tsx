// src/screens/user/HomeScreen.tsx - VERSIONE CORRETTA CON SOLO USEAUTH
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  RefreshControl,
  Alert,
  ActivityIndicator
} from 'react-native';
import {
  Car,
  Settings,
  Plus,
  AlertCircle,
  Wrench,
  Fuel,
  DollarSign,
  FileText,
  Bell,
  Calendar,
  TrendingUp,
  Shield
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

// ✅ USA SOLO FIREBASE AUTH
import { useAuth } from '../../hooks/useAuth';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  
  // ✅ USA SOLO USEAUTH - FONTE SICURA
  const { user, logout, loading: authLoading } = useAuth();
  
  // ✅ TUTTI GLI STATI LOCALI PRIMA DEL CONTROLLO
  const [refreshing, setRefreshing] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  // ✅ TUTTI GLI HOOKS (INCLUSI USECALLBACK) PRIMA DEL CONTROLLO
  
  // 🔄 Refresh dei dati
  const onRefresh = useCallback(async () => {
    console.log('🔄 HomeScreen: onRefresh iniziato');
    setRefreshing(true);
    
    try {
      // Simula il caricamento dei dati
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ HomeScreen: onRefresh completato');
    } catch (error) {
      console.error('❌ HomeScreen: onRefresh errore:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // 🚪 Gestione logout
  const handleLogout = useCallback(async () => {
    console.log('🚪 HomeScreen: Richiesta logout');
    
    Alert.alert(
      'Conferma Logout',
      'Sei sicuro di voler uscire?',
      [
        { 
          text: 'Annulla', 
          style: 'cancel',
          onPress: () => console.log('❌ Logout annullato')
        },
        {
          text: 'Esci',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔄 Eseguendo logout...');
              await logout();
              console.log('✅ Logout completato');
            } catch (error) {
              console.error('❌ Errore durante logout:', error);
              Alert.alert('Errore', 'Errore durante il logout');
            }
          }
        }
      ]
    );
  }, [logout]);

  // 🧭 Navigazione
  const handleNavigation = useCallback((screenName: string, params?: any) => {
    console.log(`🧭 Navigazione verso: ${screenName}`);
    navigation.navigate(screenName as any, params);
  }, [navigation]);

  // ✅ COSTRUISCI IL NOME UTENTE CON FALLBACK SICURO
  const userName = user?.displayName || 
                  `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
                  user?.email?.split('@')[0] ||
                  'Utente';

  // ✅ CONTROLLO DI SICUREZZA DOPO TUTTI GLI HOOKS
  if (!user) {
    console.log('⚠️ HomeScreen: user is undefined, showing loading...');
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Caricamento profilo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Theme
  const theme = {
    background: '#f3f4f6',
    cardBackground: '#ffffff',
    text: '#000000',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    accent: '#2563eb',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  };

  // 📱 Loading state
  if (authLoading || localLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Caricamento...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // 🏠 INTERFACCIA PRINCIPALE
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
          />
        }
      >
        {/* 👋 Header con saluto */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              Ciao,
            </Text>
            <Text style={[styles.username, { color: theme.text }]}>
              {userName}
            </Text>
            {user?.userType && (
              <Text style={[styles.userType, { color: theme.textSecondary }]}>
                {user.userType === 'mechanic' ? 'Meccanico' : 'Proprietario Auto'}
              </Text>
            )}
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => console.log('Notifiche pressed')}
            >
              <Bell size={24} color={theme.text} />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>3</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => handleNavigation('Settings')}
            >
              <Settings size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 📊 Statistiche Rapide */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Car size={24} color={theme.accent} />
            <Text style={[styles.statNumber, { color: theme.text }]}>0</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Auto</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Wrench size={24} color={theme.warning} />
            <Text style={[styles.statNumber, { color: theme.text }]}>0</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Manutenzioni</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <DollarSign size={24} color={theme.success} />
            <Text style={[styles.statNumber, { color: theme.text }]}>€0</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Spese</Text>
          </View>
        </View>

        {/* 🚗 Sezione Auto */}
        <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Le Mie Auto</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => console.log('Aggiungi auto')}
            >
              <Plus size={20} color={theme.accent} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.emptyState}>
            <Car size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
              Nessuna auto registrata
            </Text>
            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
              Aggiungi la tua prima auto per iniziare a gestire le manutenzioni
            </Text>
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: theme.accent }]}
              onPress={() => console.log('Aggiungi prima auto')}
            >
              <Text style={styles.primaryButtonText}>Aggiungi Auto</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🔧 Manutenzioni Recenti */}
        <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Manutenzioni Recenti</Text>
            <TouchableOpacity onPress={() => console.log('Vedi tutte manutenzioni')}>
              <Text style={[styles.seeAllText, { color: theme.accent }]}>Vedi tutto</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.emptyState}>
            <Wrench size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
              Nessuna manutenzione
            </Text>
            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
              Le tue manutenzioni appariranno qui
            </Text>
          </View>
        </View>

        {/* 🔔 Promemoria */}
        <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Promemoria</Text>
            <TouchableOpacity onPress={() => console.log('Gestisci promemoria')}>
              <Text style={[styles.seeAllText, { color: theme.accent }]}>Gestisci</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.emptyState}>
            <Bell size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
              Nessun promemoria
            </Text>
            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
              I tuoi promemoria appariranno qui
            </Text>
          </View>
        </View>

        {/* 🚪 Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity 
            style={[styles.logoutButton, { borderColor: theme.error }]}
            onPress={handleLogout}
          >
            <Text style={[styles.logoutButtonText, { color: theme.error }]}>
              Esci dall'account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  userType: {
    fontSize: 14,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    marginRight: 12,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  logoutButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HomeScreen;
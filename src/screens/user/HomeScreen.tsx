// src/screens/user/HomeScreenSecure.tsx
import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  RefreshControl,
  Alert
} from 'react-native';
import {
  Car,
  Settings,
  Plus,
  AlertCircle,
  Wrench,
  Fuel,
  DollarSign,
  FileText
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import {
  useSecureAuth,
  useDisplayName,
  useAuthGuard
} from '../../hooks/useSecureAuth';

const HomeScreenSecure = () => {
  const navigation = useNavigation();
  const { user, loading, error, logout } = useSecureAuth();
  const displayName = useDisplayName();
  const { isAuthenticated, isLoading } = useAuthGuard();
  const [refreshing, setRefreshing] = useState(false);

  // Theme (semplificato)
  const theme = {
    background: '#f3f4f6',
    cardBackground: '#ffffff',
    text: '#000000',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    accent: '#2563eb',
    error: '#ef4444',
  };

  // Logout sicuro con conferma
  const handleLogout = useCallback(async () => {
    Alert.alert(
        'Conferma Logout',
        'Sei sicuro di voler uscire?',
        [
          { text: 'Annulla', style: 'cancel' },
          {
            text: 'Esci',
            style: 'destructive',
            onPress: async () => {
              try {
                await logout();
                console.log('✅ Logout completed successfully');
              } catch (error) {
                console.error('❌ Logout failed:', error);
                Alert.alert('Errore', 'Errore durante il logout');
              }
            }
          }
        ]
    );
  }, [logout]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // In una vera app, qui ricaricheresti i dati
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleNavigation = (screenName: string, params?: any) => {
    navigation.navigate(screenName as any, params);
  };

  // Loading state
  if (isLoading) {
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.text }]}>
              Caricamento...
            </Text>
          </View>
        </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.errorContainer}>
            <AlertCircle width={48} height={48} color={theme.error} />
            <Text style={[styles.errorText, { color: theme.text }]}>
              {error}
            </Text>
            <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: theme.accent }]}
                onPress={onRefresh}
            >
              <Text style={styles.retryButtonText}>Riprova</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
    );
  }

  // Not authenticated (shouldn't happen if guards are in place)
  if (!isAuthenticated) {
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.text }]}>
              Non autenticato
            </Text>
          </View>
        </SafeAreaView>
    );
  }

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
          {/* Header con nome utente SICURO */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: theme.textSecondary }]}>
                Buongiorno,
              </Text>
              <Text style={[styles.username, { color: theme.text }]}>
                {displayName}
              </Text>
              {/* Info utente per debug (solo development) */}
              {__DEV__ && (
                  <Text style={[styles.debugText, { color: theme.textSecondary }]}>
                    Debug: {user?.email} | {user?.userType} | Verified: {user?.emailVerified ? '✅' : '❌'}
                  </Text>
              )}
            </View>
            <TouchableOpacity
                onPress={() => handleNavigation('Settings')}
                style={[
                  styles.settingsButton,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border
                  }
                ]}
            >
              <Settings width={20} height={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Verifica Email (se necessaria) */}
          {user && !user.emailVerified && (
              <View style={[styles.warningCard, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                <Text style={[styles.warningTitle, { color: '#92400E' }]}>
                  Email non verificata
                </Text>
                <Text style={[styles.warningText, { color: '#92400E' }]}>
                  Verifica la tua email per accedere a tutte le funzionalità
                </Text>
              </View>
          )}

          {/* Sezione Veicoli */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                I Miei Veicoli
              </Text>
              <TouchableOpacity onPress={() => handleNavigation('AddCar')}>
                <Plus width={24} height={24} color={theme.accent} />
              </TouchableOpacity>
            </View>

            {/* Per ora empty state - in una vera app caricheresti da Firebase */}
            <View style={[styles.emptyState, { backgroundColor: theme.cardBackground }]}>
              <Car width={48} height={48} color={theme.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
                Nessun veicolo aggiunto
              </Text>
              <Text style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}>
                Aggiungi il tuo primo veicolo per iniziare
              </Text>
              <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: theme.accent }]}
                  onPress={() => handleNavigation('AddCar')}
              >
                <Text style={styles.addButtonText}>Aggiungi Veicolo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Azioni Rapide */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text, paddingHorizontal: 20 }]}>
              Azioni Rapide
            </Text>
            <View style={styles.quickActionsGrid}>
              {[
                {
                  icon: Wrench,
                  title: 'Manutenzione',
                  subtitle: 'Programma intervento',
                  screen: 'AddMaintenance',
                  enabled: true
                },
                {
                  icon: Fuel,
                  title: 'Rifornimento',
                  subtitle: 'Registra carburante',
                  screen: 'AddFuel',
                  enabled: true
                },
                {
                  icon: DollarSign,
                  title: 'Spesa',
                  subtitle: 'Aggiungi spesa',
                  screen: 'AddExpense',
                  enabled: true
                },
                {
                  icon: FileText,
                  title: 'Documento',
                  subtitle: 'Carica documento',
                  screen: 'AddDocument',
                  enabled: user?.emailVerified || false
                },
              ].map((action, index) => (
                  <TouchableOpacity
                      key={index}
                      style={[
                        styles.quickActionCard,
                        {
                          backgroundColor: theme.cardBackground,
                          borderColor: theme.border,
                          opacity: action.enabled ? 1 : 0.5
                        }
                      ]}
                      onPress={() => {
                        if (action.enabled) {
                          handleNavigation(action.screen);
                        } else {
                          Alert.alert('Verifica Email', 'Verifica la tua email per accedere a questa funzione');
                        }
                      }}
                      disabled={!action.enabled}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: theme.accent + '20' }]}>
                      <action.icon width={24} height={24} color={theme.accent} />
                    </View>
                    <Text style={[styles.quickActionTitle, { color: theme.text }]}>
                      {action.title}
                    </Text>
                    <Text style={[styles.quickActionSubtitle, { color: theme.textSecondary }]}>
                      {action.subtitle}
                    </Text>
                  </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Informazioni Utente (solo per meccanici) */}
          {user?.userType === 'mechanic' && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text, paddingHorizontal: 20 }]}>
                  Informazioni Officina
                </Text>
                <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                  <Text style={[styles.infoTitle, { color: theme.text }]}>
                    {user.workshopName || 'Nome officina non impostato'}
                  </Text>
                  {user.address && (
                      <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                        {user.address}
                      </Text>
                  )}
                  {user.vatNumber && (
                      <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                        P.IVA: {user.vatNumber}
                      </Text>
                  )}
                </View>
              </View>
          )}

          {/* Logout Button */}
          <TouchableOpacity
              style={[styles.logoutButton, { borderColor: theme.border }]}
              onPress={handleLogout}
              activeOpacity={0.7}
          >
            <Text style={[styles.logoutButtonText, { color: theme.text }]}>
              Esci
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  debugText: {
    fontSize: 10,
    marginTop: 4,
    maxWidth: 200,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  warningCard: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  infoCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  logoutButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 32,
    marginHorizontal: 20,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HomeScreenSecure;

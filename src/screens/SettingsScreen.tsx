// src/screens/SettingsScreen.tsx - VERSIONE AGGIORNATA SICURA
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import {
  Card,
  Text,
  Switch,
  List,
  Divider,
  Button,
  Dialog,
  Portal,
  RadioButton,
  useTheme,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import {
  User,
  Palette,
  Globe,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Trash2,
  Download,
  Upload,
} from 'lucide-react-native';

// 🔒 USA I NUOVI HOOK SICURI
import { useAuth } from '../hooks/useAuth';
import {
  useUserData,
  useAppTheme,
  useUserCars,
  useAppState
} from '../hooks/useUserData';
import { useStore } from '../store';
import { useLogout } from '../hooks/useAuthSync';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useTheme();

  // 🔒 USA I NUOVI HOOK SICURI
  const { loading } = useAuth();
  const { logout } = useLogout(); // ✅ Nuovo hook per logout completo
  const {
    userName,
    userEmail,
    isMechanic,
    isAuthenticated,
    profileComplete
  } = useUserData();
  const {
    darkMode,
    preferences,
    setDarkMode,
    updatePreferences
  } = useAppTheme();
  const { cars, carsCount } = useUserCars();
  const { resetAppData } = useStore();

  // Stati locali per dialoghi
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [tempTheme, setTempTheme] = useState(preferences.theme);
  const [tempLanguage, setTempLanguage] = useState(preferences.language);

  // 🚨 Controllo sicurezza
  if (!isAuthenticated) {
    return null; // AppNavigator gestirà il redirect
  }

  // 🚪 Gestione logout
  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutDialog(false);
      console.log('✅ Logout completato');
    } catch (error) {
      console.error('❌ Errore logout:', error);
      Alert.alert('Errore', 'Impossibile disconnettere l\'account');
    }
  };

  // 🗑️ Cancellazione dati app
  const handleDeleteAppData = () => {
    Alert.alert(
        'Conferma Cancellazione',
        'Sei sicuro di voler cancellare tutti i dati dell\'app? Questa azione non può essere annullata.',
        [
          { text: 'Annulla', style: 'cancel' },
          {
            text: 'Cancella',
            style: 'destructive',
            onPress: () => {
              resetAppData();
              setShowDeleteDialog(false);
              Alert.alert('Completato', 'Tutti i dati dell\'app sono stati cancellati');
            },
          },
        ]
    );
  };

  // 🎨 Gestione tema
  const handleThemeChange = () => {
    updatePreferences({ theme: tempTheme });
    setShowThemeDialog(false);
  };

  // 🌍 Gestione lingua
  const handleLanguageChange = () => {
    updatePreferences({ language: tempLanguage });
    setShowLanguageDialog(false);
  };

  // 🔔 Toggle notifiche
  const toggleNotification = (type: keyof typeof preferences.notifications) => {
    updatePreferences({
      notifications: {
        ...preferences.notifications,
        [type]: !preferences.notifications[type]
      }
    });
  };

  // 🛡️ Toggle privacy
  const togglePrivacy = (type: keyof typeof preferences.privacy) => {
    updatePreferences({
      privacy: {
        ...preferences.privacy,
        [type]: !preferences.privacy[type]
      }
    });
  };

  // 📱 Navigazione profilo
  const handleProfilePress = () => {
    navigation.navigate('Profile' as any, { userId: 'current' });
  };

  // 📊 Informazioni app
  const renderAppInfo = () => (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Informazioni App</Text>

          <List.Item
              title="Versione"
              description="1.0.0"
              left={() => <List.Icon icon="information" />}
          />

          <List.Item
              title="Auto registrate"
              description={`${carsCount} ${carsCount === 1 ? 'auto' : 'auto'}`}
              left={() => <List.Icon icon="car" />}
          />

          <List.Item
              title="Tipo account"
              description={isMechanic ? 'Meccanico' : 'Proprietario auto'}
              left={() => <User size={24} color={theme.colors.onSurfaceVariant} />}
          />

          <List.Item
              title="Profilo completo"
              description={profileComplete ? 'Completato' : 'Incompleto'}
              left={() => <List.Icon icon="account-check" />}
              right={() => profileComplete ?
                  <List.Icon icon="check" color={theme.colors.primary} /> :
                  <List.Icon icon="alert" color={theme.colors.error} />
              }
          />
        </Card.Content>
      </Card>
  );

  // 👤 Sezione account
  const renderAccountSection = () => (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Account</Text>

          <List.Item
              title="Profilo utente"
              description={`${userName} - ${userEmail}`}
              left={() => <User size={24} color={theme.colors.onSurfaceVariant} />}
              onPress={handleProfilePress}
              right={() => <List.Icon icon="chevron-right" />}
          />

          <Divider style={styles.divider} />

          <List.Item
              title="Disconnetti"
              description="Esci dal tuo account"
              left={() => <LogOut size={24} color={theme.colors.error} />}
              onPress={() => setShowLogoutDialog(true)}
              titleStyle={{ color: theme.colors.error }}
          />
        </Card.Content>
      </Card>
  );

  // 🎨 Sezione aspetto
  const renderAppearanceSection = () => (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Aspetto</Text>

          <List.Item
              title="Tema"
              description={
                preferences.theme === 'dark' ? 'Scuro' :
                    preferences.theme === 'light' ? 'Chiaro' :
                        'Automatico'
              }
              left={() => <Palette size={24} color={theme.colors.onSurfaceVariant} />}
              onPress={() => setShowThemeDialog(true)}
              right={() => <List.Icon icon="chevron-right" />}
          />

          <List.Item
              title="Lingua"
              description={
                preferences.language === 'it' ? 'Italiano' :
                    preferences.language === 'en' ? 'English' :
                        preferences.language === 'fr' ? 'Français' :
                            'Deutsch'
              }
              left={() => <Globe size={24} color={theme.colors.onSurfaceVariant} />}
              onPress={() => setShowLanguageDialog(true)}
              right={() => <List.Icon icon="chevron-right" />}
          />

          <List.Item
              title="Valuta"
              description={preferences.currency}
              left={() => <List.Icon icon="currency-eur" />}
              onPress={() => {
                // Implementa dialog per cambio valuta
                Alert.alert('Info', 'Funzionalità in arrivo');
              }}
              right={() => <List.Icon icon="chevron-right" />}
          />
        </Card.Content>
      </Card>
  );

  // 🔔 Sezione notifiche
  const renderNotificationsSection = () => (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Notifiche</Text>

          <List.Item
              title="Manutenzioni"
              description="Promemoria per le manutenzioni"
              left={() => <Bell size={24} color={theme.colors.onSurfaceVariant} />}
              right={() => (
                  <Switch
                      value={preferences.notifications.maintenance}
                      onValueChange={() => toggleNotification('maintenance')}
                  />
              )}
          />

          <List.Item
              title="Spese"
              description="Notifiche per le spese"
              left={() => <List.Icon icon="cash" />}
              right={() => (
                  <Switch
                      value={preferences.notifications.expenses}
                      onValueChange={() => toggleNotification('expenses')}
                  />
              )}
          />

          <List.Item
              title="Documenti"
              description="Scadenze documenti e assicurazioni"
              left={() => <List.Icon icon="file-document" />}
              right={() => (
                  <Switch
                      value={preferences.notifications.documents}
                      onValueChange={() => toggleNotification('documents')}
                  />
              )}
          />

          <List.Item
              title="Promemoria"
              description="Altri promemoria importanti"
              left={() => <List.Icon icon="alarm" />}
              right={() => (
                  <Switch
                      value={preferences.notifications.reminders}
                      onValueChange={() => toggleNotification('reminders')}
                  />
              )}
          />
        </Card.Content>
      </Card>
  );

  // 🛡️ Sezione privacy
  const renderPrivacySection = () => (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Privacy e Sicurezza</Text>

          <List.Item
              title="Condividi dati di utilizzo"
              description="Aiutaci a migliorare l'app"
              left={() => <Shield size={24} color={theme.colors.onSurfaceVariant} />}
              right={() => (
                  <Switch
                      value={preferences.privacy.shareData}
                      onValueChange={() => togglePrivacy('shareData')}
                  />
              )}
          />

          <List.Item
              title="Analytics"
              description="Statistiche anonime di utilizzo"
              left={() => <List.Icon icon="chart-line" />}
              right={() => (
                  <Switch
                      value={preferences.privacy.analytics}
                      onValueChange={() => togglePrivacy('analytics')}
                  />
              )}
          />
        </Card.Content>
      </Card>
  );

  // 🔧 Sezione dati
  const renderDataSection = () => (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Gestione Dati</Text>

          <List.Item
              title="Esporta dati"
              description="Scarica una copia dei tuoi dati"
              left={() => <Download size={24} color={theme.colors.primary} />}
              onPress={() => Alert.alert('Info', 'Funzionalità in arrivo')}
              right={() => <List.Icon icon="chevron-right" />}
          />

          <List.Item
              title="Importa dati"
              description="Importa dati da backup"
              left={() => <Upload size={24} color={theme.colors.primary} />}
              onPress={() => Alert.alert('Info', 'Funzionalità in arrivo')}
              right={() => <List.Icon icon="chevron-right" />}
          />

          <Divider style={styles.divider} />

          <List.Item
              title="Cancella dati app"
              description="Rimuove tutte le auto e le impostazioni"
              left={() => <Trash2 size={24} color={theme.colors.error} />}
              onPress={() => setShowDeleteDialog(true)}
              titleStyle={{ color: theme.colors.error }}
              right={() => <List.Icon icon="chevron-right" />}
          />
        </Card.Content>
      </Card>
  );

  // ❓ Sezione supporto
  const renderSupportSection = () => (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Supporto</Text>

          <List.Item
              title="Centro assistenza"
              description="FAQ e guide"
              left={() => <HelpCircle size={24} color={theme.colors.onSurfaceVariant} />}
              onPress={() => Alert.alert('Info', 'Funzionalità in arrivo')}
              right={() => <List.Icon icon="chevron-right" />}
          />

          <List.Item
              title="Contattaci"
              description="Invia feedback o segnala problemi"
              left={() => <List.Icon icon="email" />}
              onPress={() => Alert.alert('Info', 'Funzionalità in arrivo')}
              right={() => <List.Icon icon="chevron-right" />}
          />

          <List.Item
              title="Valuta l'app"
              description="Lascia una recensione"
              left={() => <List.Icon icon="star" />}
              onPress={() => Alert.alert('Info', 'Funzionalità in arrivo')}
              right={() => <List.Icon icon="chevron-right" />}
          />
        </Card.Content>
      </Card>
  );

  return (
      <View style={styles.container}>
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
          {renderAppInfo()}
          {renderAccountSection()}
          {renderAppearanceSection()}
          {renderNotificationsSection()}
          {renderPrivacySection()}
          {renderDataSection()}
          {renderSupportSection()}
        </ScrollView>

        {/* Dialog Logout */}
        <Portal>
          <Dialog visible={showLogoutDialog} onDismiss={() => setShowLogoutDialog(false)}>
            <Dialog.Title>Disconnetti Account</Dialog.Title>
            <Dialog.Content>
              <Text>Sei sicuro di voler disconnettere il tuo account?</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowLogoutDialog(false)}>Annulla</Button>
              <Button onPress={handleLogout} loading={loading}>Disconnetti</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Dialog Cancella Dati */}
        <Portal>
          <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
            <Dialog.Title>Cancella Dati App</Dialog.Title>
            <Dialog.Content>
              <Text>
                Questa azione cancellerà tutte le auto, manutenzioni e impostazioni salvate nell'app.
                I dati del tuo account Firebase rimarranno intatti.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowDeleteDialog(false)}>Annulla</Button>
              <Button onPress={handleDeleteAppData} textColor={theme.colors.error}>
                Cancella
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Dialog Tema */}
        <Portal>
          <Dialog visible={showThemeDialog} onDismiss={() => setShowThemeDialog(false)}>
            <Dialog.Title>Seleziona Tema</Dialog.Title>
            <Dialog.Content>
              <RadioButton.Group value={tempTheme} onValueChange={setTempTheme}>
                <RadioButton.Item label="Chiaro" value="light" />
                <RadioButton.Item label="Scuro" value="dark" />
                <RadioButton.Item label="Automatico" value="auto" />
              </RadioButton.Group>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowThemeDialog(false)}>Annulla</Button>
              <Button onPress={handleThemeChange}>Applica</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Dialog Lingua */}
        <Portal>
          <Dialog visible={showLanguageDialog} onDismiss={() => setShowLanguageDialog(false)}>
            <Dialog.Title>Seleziona Lingua</Dialog.Title>
            <Dialog.Content>
              <RadioButton.Group value={tempLanguage} onValueChange={setTempLanguage}>
                <RadioButton.Item label="Italiano" value="it" />
                <RadioButton.Item label="English" value="en" />
                <RadioButton.Item label="Français" value="fr" />
                <RadioButton.Item label="Deutsch" value="de" />
              </RadioButton.Group>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowLanguageDialog(false)}>Annulla</Button>
              <Button onPress={handleLanguageChange}>Applica</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
  },
});

export default SettingsScreen;

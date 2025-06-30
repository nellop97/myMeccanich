// src/screens/ProfileScreen.tsx - VERSIONE AGGIORNATA SICURA
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import {
  Avatar,
  Button,
  Card,
  Chip,
  Dialog,
  Divider,
  FAB,
  Portal,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { RootStackParamList } from '../navigation/AppNavigator';

// 🔒 USA I NUOVI HOOK SICURI
import { useAuth } from '../hooks/useAuth';
import { useUserData, useAppTheme, useUserStats } from '../hooks/useUserData';

type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'Profile'>;

export default function ProfileScreen() {
  const route = useRoute<ProfileScreenRouteProp>();
  const { userId } = route.params;
  const theme = useTheme();
  const navigation = useNavigation();

  // 🔒 USA I NUOVI HOOK SICURI
  const { updateUserProfile, logout, loading } = useAuth();
  const {
    userName,
    userEmail,
    isMechanic,
    isEmailVerified,
    photoURL,
    workshopName,
    workshopAddress,
    vatNumber,
    profileComplete
  } = useUserData();
  const { darkMode, toggleDarkMode } = useAppTheme();
  const stats = useUserStats();

  const [activeTab, setActiveTab] = useState('info');
  const [editMode, setEditMode] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Form state - inizializzato con i dati da Firebase
  const [displayName, setDisplayName] = useState(userName || '');
  const [email, setEmail] = useState(userEmail || '');
  const [workshop, setWorkshop] = useState(workshopName || '');
  const [address, setAddress] = useState(workshopAddress || '');
  const [vat, setVat] = useState(vatNumber || '');

  // 💾 Salva le modifiche al profilo
  const saveChanges = async () => {
    try {
      const updates: any = {
        displayName: displayName.trim(),
        firstName: displayName.split(' ')[0],
        lastName: displayName.split(' ').slice(1).join(' '),
      };

      if (isMechanic) {
        updates.workshopName = workshop.trim();
        updates.address = address.trim();
        updates.vatNumber = vat.trim();
      }

      const success = await updateUserProfile(updates);

      if (success) {
        setEditMode(false);
        Alert.alert('Successo', 'Profilo aggiornato con successo!');
      }
    } catch (error) {
      console.error('Errore nel salvare il profilo:', error);
      Alert.alert('Errore', 'Impossibile salvare le modifiche');
    }
  };

  // 🚪 Gestisci logout
  const handleLogout = async () => {
    try {
      await logout();
      console.log('✅ Logout completato, navigazione automatica');
      // La navigazione sarà gestita automaticamente dall'AppNavigator
    } catch (error) {
      console.error('Errore logout:', error);
      Alert.alert('Errore', 'Impossibile effettuare il logout');
    }
  };

  // 📊 Rendering del tab info
  const renderInfoTab = () => (
      <View>
        <Card style={styles.infoCard}>
          <Card.Content>
            {editMode ? (
                // 📝 Modalità modifica
                <View>
                  <Text style={styles.sectionTitle}>Informazioni Personali</Text>

                  <TextInput
                      label="Nome completo"
                      value={displayName}
                      onChangeText={setDisplayName}
                      mode="outlined"
                      style={styles.input}
                  />

                  {isMechanic && (
                      <>
                        <TextInput
                            label="Nome officina"
                            value={workshop}
                            onChangeText={setWorkshop}
                            mode="outlined"
                            style={styles.input}
                        />

                        <TextInput
                            label="Indirizzo officina"
                            value={address}
                            onChangeText={setAddress}
                            mode="outlined"
                            multiline
                            numberOfLines={2}
                            style={styles.input}
                        />

                        <TextInput
                            label="Partita IVA"
                            value={vat}
                            onChangeText={setVat}
                            mode="outlined"
                            style={styles.input}
                        />
                      </>
                  )}

                  <View style={styles.editButtonsRow}>
                    <Button
                        mode="outlined"
                        onPress={() => setEditMode(false)}
                        style={styles.cancelButton}
                    >
                      Annulla
                    </Button>
                    <Button
                        mode="contained"
                        onPress={saveChanges}
                        loading={loading}
                        disabled={loading}
                        style={styles.saveButton}
                    >
                      Salva
                    </Button>
                  </View>
                </View>
            ) : (
                // 👁️ Modalità visualizzazione
                <View>
                  <Text style={styles.sectionTitle}>Informazioni Personali</Text>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Nome:</Text>
                    <Text style={styles.infoValue}>{userName || 'Non specificato'}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email:</Text>
                    <Text style={styles.infoValue}>{userEmail}</Text>
                    {!isEmailVerified && (
                        <Chip mode="outlined" textStyle={{ fontSize: 10 }} style={styles.warningChip}>
                          Non verificata
                        </Chip>
                    )}
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tipo account:</Text>
                    <Chip mode="outlined" style={styles.accountTypeChip}>
                      {isMechanic ? 'Meccanico' : 'Proprietario auto'}
                    </Chip>
                  </View>

                  {isMechanic && (
                      <>
                        <Divider style={styles.divider} />
                        <Text style={styles.sectionTitle}>Informazioni Officina</Text>

                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Nome officina:</Text>
                          <Text style={styles.infoValue}>{workshopName || 'Non specificato'}</Text>
                        </View>

                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Indirizzo:</Text>
                          <Text style={styles.infoValue}>{workshopAddress || 'Non specificato'}</Text>
                        </View>

                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Partita IVA:</Text>
                          <Text style={styles.infoValue}>{vatNumber || 'Non specificata'}</Text>
                        </View>
                      </>
                  )}
                </View>
            )}
          </Card.Content>
        </Card>
      </View>
  );

  // 📊 Rendering del tab statistiche
  const renderStatsTab = () => (
      <View>
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Le tue statistiche</Text>

            {!isMechanic && (
                <>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Auto totali:</Text>
                    <Text style={styles.statValue}>{stats.totalCars}</Text>
                  </View>

                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Manutenzioni registrate:</Text>
                    <Text style={styles.statValue}>{stats.totalMaintenanceRecords}</Text>
                  </View>

                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Età media auto:</Text>
                    <Text style={styles.statValue}>{stats.averageCarAge} anni</Text>
                  </View>

                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Auto che necessitano servizio:</Text>
                    <Text style={[styles.statValue, { color: stats.carsNeedingService > 0 ? theme.colors.error : theme.colors.primary }]}>
                      {stats.carsNeedingService}
                    </Text>
                  </View>

                  {stats.oldestCar && (
                      <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Auto più vecchia:</Text>
                        <Text style={styles.statValue}>
                          {stats.oldestCar.make} {stats.oldestCar.model} ({stats.oldestCar.year})
                        </Text>
                      </View>
                  )}
                </>
            )}

            {isMechanic && (
                <Text style={styles.infoValue}>
                  Le statistiche per i meccanici saranno disponibili presto.
                </Text>
            )}
          </Card.Content>
        </Card>
      </View>
  );

  // 🎛️ Rendering del tab impostazioni
  const renderSettingsTab = () => (
      <View>
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Impostazioni</Text>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Tema scuro</Text>
              <Button
                  mode={darkMode ? "contained" : "outlined"}
                  onPress={toggleDarkMode}
                  compact
              >
                {darkMode ? "Attivo" : "Disattivo"}
              </Button>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Profilo completo</Text>
              <Chip mode="outlined" style={profileComplete ? styles.successChip : styles.warningChip}>
                {profileComplete ? "Completo" : "Incompleto"}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            <Button
                mode="outlined"
                onPress={() => setShowLogoutDialog(true)}
                style={styles.logoutButton}
                textColor={theme.colors.error}
            >
              Disconnetti
            </Button>
          </Card.Content>
        </Card>
      </View>
  );

  return (
      <View style={styles.container}>
        {/* Header con avatar */}
        <View style={styles.header}>
          <Avatar.Image
              size={80}
              source={photoURL ? { uri: photoURL } : undefined}
          />
          <Text style={styles.headerName}>{userName || 'Utente'}</Text>
          <Text style={styles.headerEmail}>{userEmail}</Text>
        </View>

        {/* Tabs */}
        <SegmentedButtons
            value={activeTab}
            onValueChange={setActiveTab}
            buttons={[
              { value: 'info', label: 'Info' },
              { value: 'stats', label: 'Statistiche' },
              { value: 'settings', label: 'Impostazioni' },
            ]}
            style={styles.tabs}
        />

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'info' && renderInfoTab()}
          {activeTab === 'stats' && renderStatsTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </ScrollView>

        {/* FAB per modifica (solo nel tab info) */}
        {activeTab === 'info' && !editMode && (
            <FAB
                icon="pencil"
                style={styles.fab}
                onPress={() => setEditMode(true)}
            />
        )}

        {/* Dialog di conferma logout */}
        <Portal>
          <Dialog visible={showLogoutDialog} onDismiss={() => setShowLogoutDialog(false)}>
            <Dialog.Title>Conferma disconnessione</Dialog.Title>
            <Dialog.Content>
              <Text>Sei sicuro di voler disconnettere il tuo account?</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowLogoutDialog(false)}>Annulla</Button>
              <Button onPress={handleLogout} loading={loading}>Disconnetti</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  headerName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  headerEmail: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  tabs: {
    margin: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  infoCard: {
    marginBottom: 16,
  },
  statsCard: {
    marginBottom: 16,
  },
  settingsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 100,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
  },
  input: {
    marginBottom: 12,
  },
  editButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
  divider: {
    marginVertical: 16,
  },
  accountTypeChip: {
    marginLeft: 8,
  },
  warningChip: {
    marginLeft: 8,
    backgroundColor: '#fff3cd',
  },
  successChip: {
    backgroundColor: '#d1edff',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 14,
    flex: 1,
  },
  logoutButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

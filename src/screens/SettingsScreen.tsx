// src/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Dialog,
  Divider,
  List,
  Portal,
  RadioButton,
  Snackbar,
  Switch,
  Text,
  useTheme
} from 'react-native-paper';
import { useStore } from '../store';

export default function SettingsScreen() {
  const theme = useTheme();
  const { darkMode, toggleDarkMode, logout } = useStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState('italiano');
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const saveSettings = () => {
    // Qui puoi implementare il salvataggio delle impostazioni
    showSnackbar('Impostazioni salvate con successo');
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text variant="headlineMedium" style={styles.title}>Impostazioni</Text>
        
        <List.Section title="Aspetto">
          <List.Item
            title="Tema scuro"
            description="Attiva/disattiva modalità scura"
            left={props => <List.Icon {...props} icon="theme-light-dark" />}
            right={props => <Switch value={darkMode} onValueChange={toggleDarkMode} />}
          />
          
          <List.Item
            title="Lingua"
            description={`Selezionata: ${language}`}
            left={props => <List.Icon {...props} icon="translate" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setShowLanguageDialog(true)}
          />

          <Divider />
        </List.Section>

        <List.Section title="Notifiche">
          <List.Item
            title="Notifiche push"
            description="Ricevi notifiche push"
            left={props => <List.Icon {...props} icon="bell" />}
            right={props => <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />}
          />
          
          <List.Item
            title="Suoni di notifica"
            description="Abilita suoni per le notifiche"
            left={props => <List.Icon {...props} icon="volume-high" />}
            right={props => <Switch value={notificationsEnabled} disabled={!notificationsEnabled} onValueChange={() => {}} />}
          />
          
          <Divider />
        </List.Section>
        
        <List.Section title="Privacy e sicurezza">
          <List.Item
            title="Impostazioni privacy"
            description="Gestisci chi può vedere il tuo profilo"
            left={props => <List.Icon {...props} icon="shield-account" />}
            onPress={() => showSnackbar('Impostazioni privacy non ancora implementate')}
          />
          
          <List.Item
            title="Password e sicurezza"
            description="Aggiorna la tua password e le impostazioni di sicurezza"
            left={props => <List.Icon {...props} icon="lock" />}
            onPress={() => showSnackbar('Impostazioni sicurezza non ancora implementate')}
          />
          
          <Divider />
        </List.Section>
        
        <List.Section title="Account">
          <List.Item
            title="Informazioni personali"
            description="Modifica i tuoi dati personali"
            left={props => <List.Icon {...props} icon="account-edit" />}
            onPress={() => showSnackbar('Modifica informazioni non ancora implementata')}
          />
          
          <List.Item
            title="Esci dall'account"
            description="Disconnetti il tuo account da questo dispositivo"
            left={props => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
            onPress={logout}
          />
        </List.Section>
        
        <Button 
          mode="contained" 
          onPress={saveSettings}
          style={styles.saveButton}
        >
          Salva impostazioni
        </Button>
      </ScrollView>

      {/* Dialog per selezione lingua */}
      <Portal>
        <Dialog visible={showLanguageDialog} onDismiss={() => setShowLanguageDialog(false)}>
          <Dialog.Title>Seleziona lingua</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={value => setLanguage(value)} value={language}>
              <RadioButton.Item label="Italiano" value="italiano" />
              <RadioButton.Item label="English" value="english" />
              <RadioButton.Item label="Español" value="espanol" />
              <RadioButton.Item label="Français" value="francais" />
              <RadioButton.Item label="Deutsch" value="deutsch" />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLanguageDialog(false)}>Annulla</Button>
            <Button onPress={() => {
              setShowLanguageDialog(false);
              showSnackbar('Lingua aggiornata');
            }}>Conferma</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbar per feedback */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Chiudi',
          onPress: () => setSnackbarVisible(false),
        }}>
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    margin: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    margin: 16,
    marginBottom: 32,
  }
});
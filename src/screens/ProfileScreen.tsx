// src/screens/ProfileScreen.tsx
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
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
  useTheme
} from 'react-native-paper';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useStore } from '../store';

type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'Profile'>;

export default function ProfileScreen() {
  const route = useRoute<ProfileScreenRouteProp>();
  const { userId } = route.params;
  const theme = useTheme();
  const navigation = useNavigation();
  const { user } = useStore();
  
  const [activeTab, setActiveTab] = useState('info');
  const [editMode, setEditMode] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Form state
  const [name, setName] = useState(user?.name || 'Nome Utente');
  const [email, setEmail] = useState(user?.email || 'user@example.com');
  const [location, setLocation] = useState('Milano, Italia');
  const [bio, setBio] = useState('Questa è la mia biografia. Puoi modificare questo testo per descrivere te stesso.');

  const saveChanges = () => {
    // Qui implementerai la logica per salvare le modifiche al profilo
    setEditMode(false);
  };

  const renderInfoTab = () => (
    <Card style={styles.infoCard}>
      <Card.Content>
        {editMode ? (
          <View style={styles.editForm}>
            <TextInput
              label="Nome"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Località"
              value={location}
              onChangeText={setLocation}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Biografia"
              value={bio}
              onChangeText={setBio}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
            />
          </View>
        ) : (
          <>
            <View style={styles.infoRow}>
              <Text variant="labelLarge" style={styles.infoLabel}>Nome:</Text>
              <Text variant="bodyLarge">{name}</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text variant="labelLarge" style={styles.infoLabel}>Email:</Text>
              <Text variant="bodyLarge">{email}</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text variant="labelLarge" style={styles.infoLabel}>Località:</Text>
              <Text variant="bodyLarge">{location}</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text variant="labelLarge" style={styles.infoLabel}>ID Utente:</Text>
              <Text variant="bodyLarge">{userId}</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text variant="labelLarge" style={styles.infoLabel}>Registrato dal:</Text>
              <Text variant="bodyLarge">01/01/2023</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.bioSection}>
              <Text variant="labelLarge" style={styles.infoLabel}>Biografia:</Text>
              <Text variant="bodyMedium" style={styles.bioText}>{bio}</Text>
            </View>
          </>
        )}
      </Card.Content>
      
      {editMode && (
        <Card.Actions style={styles.editActions}>
          <Button 
            mode="outlined" 
            onPress={() => setEditMode(false)}
            style={styles.actionButton}
          >
            Annulla
          </Button>
          <Button 
            mode="contained" 
            onPress={saveChanges}
            style={styles.actionButton}
          >
            Salva
          </Button>
        </Card.Actions>
      )}
    </Card>
  );

  const renderActivityTab = () => (
    <Card style={styles.infoCard}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.sectionTitle}>Attività recenti</Text>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={styles.activityItem}>
            <Text variant="bodyMedium">
              Hai completato un'azione {i} giorni fa
            </Text>
            <Divider style={styles.divider} />
          </View>
        ))}
        
        <Text variant="titleMedium" style={[styles.sectionTitle, {marginTop: 16}]}>Interessi</Text>
        <View style={styles.chipsContainer}>
          <Chip style={styles.chip} icon="music">Musica</Chip>
          <Chip style={styles.chip} icon="book">Lettura</Chip>
          <Chip style={styles.chip} icon="basketball">Sport</Chip>
          <Chip style={styles.chip} icon="food">Cucina</Chip>
          <Chip style={styles.chip} icon="palette">Arte</Chip>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Avatar.Text size={80} label={name.substring(0, 2).toUpperCase()} style={styles.avatar} />
          <Text variant="headlineSmall" style={styles.name}>{name}</Text>
          <Text variant="bodyLarge" style={styles.userStatus}>Utente Premium</Text>
        </View>
        
        <View style={styles.contentContainer}>
          <SegmentedButtons
            value={activeTab}
            onValueChange={setActiveTab}
            buttons={[
              { value: 'info', label: 'Informazioni' },
              { value: 'activity', label: 'Attività' },
            ]}
            style={styles.segmentedButtons}
          />
          
          {activeTab === 'info' ? renderInfoTab() : renderActivityTab()}
          
          {/* Azioni supplementari */}
          {!editMode && (
            <View style={styles.actionButtonsContainer}>
              <Button 
                mode="contained" 
                icon="account-edit" 
                onPress={() => setEditMode(true)}
                style={styles.actionButton}
              >
                Modifica Profilo
              </Button>
              <Button 
                mode="outlined" 
                icon="delete" 
                onPress={() => setShowConfirmDialog(true)}
                style={styles.actionButton}
                textColor={theme.colors.error}
              >
                Elimina Account
              </Button>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* FAB per opzioni aggiuntive */}
      <FAB
        icon="share"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => {}}
      />
      
      {/* Dialog di conferma eliminazione */}
      <Portal>
        <Dialog visible={showConfirmDialog} onDismiss={() => setShowConfirmDialog(false)}>
          <Dialog.Title>Elimina account</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile e tutti i tuoi dati verranno persi.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowConfirmDialog(false)}>Annulla</Button>
            <Button textColor={theme.colors.error} onPress={() => {
              setShowConfirmDialog(false);
              // Qui implementerai la logica per eliminare l'account
            }}>Elimina</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 16,
    paddingTop: 24,
  },
  avatar: {
    backgroundColor: '#007AFF',
  },
  name: {
    marginTop: 12,
    fontWeight: 'bold',
  },
  userStatus: {
    marginTop: 4,
    opacity: 0.6,
  },
  contentContainer: {
    padding: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  infoLabel: {
    width: 110,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 6,
  },
  bioSection: {
    marginTop: 8,
  },
  bioText: {
    marginTop: 8,
    lineHeight: 20,
  },
  actionButtonsContainer: {
    marginBottom: 24,
  },
  actionButton: {
    marginVertical: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  activityItem: {
    marginBottom: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    margin: 4,
  },
  editForm: {
    padding: 8,
  },
  input: {
    marginBottom: 12,
  },
  editActions: {
    justifyContent: 'flex-end',
    padding: 8,
  }
});
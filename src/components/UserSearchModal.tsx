
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import QuickAddCustomerModal from './QuickAddCustomerModal';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  userType: string;
}

interface UserSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
  darkMode?: boolean;
  excludeUserId?: string; // ID dell'utente da escludere dai risultati (es. utente corrente)
}

const UserSearchModal: React.FC<UserSearchModalProps> = ({
  visible,
  onClose,
  onSelectUser,
  darkMode = false,
  excludeUserId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const theme = {
    background: darkMode ? '#121212' : '#ffffff',
    cardBackground: darkMode ? '#1e1e1e' : '#f8fafc',
    text: darkMode ? '#ffffff' : '#0f172a',
    textSecondary: darkMode ? '#a0a0a0' : '#64748b',
    border: darkMode ? '#333333' : '#e2e8f0',
    primary: '#3b82f6',
    success: '#10b981',
  };

  const searchUsers = async () => {
    if (searchQuery.trim().length < 2) {
      Alert.alert('Attenzione', 'Inserisci almeno 2 caratteri per la ricerca');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      // Ricerca per nome
      const nameQuery = query(
        collection(db, 'users'),
        where('userType', '==', 'user'),
        orderBy('firstName'),
        limit(20)
      );

      // Ricerca per email
      const emailQuery = query(
        collection(db, 'users'),
        where('userType', '==', 'user'),
        where('email', '>=', searchQuery.toLowerCase()),
        where('email', '<=', searchQuery.toLowerCase() + '\uf8ff'),
        limit(20)
      );

      const [nameSnapshot, emailSnapshot] = await Promise.all([
        getDocs(nameQuery),
        getDocs(emailQuery)
      ]);

      const foundUsers: User[] = [];
      const userIds = new Set<string>();

      // Combina risultati da entrambe le query
      [...nameSnapshot.docs, ...emailSnapshot.docs].forEach(doc => {
        // Escludi l'utente specificato (es. utente corrente)
        if (excludeUserId && doc.id === excludeUserId) {
          return;
        }

        if (!userIds.has(doc.id)) {
          const userData = doc.data();
          const fullName = `${userData.firstName} ${userData.lastName}`.toLowerCase();
          const searchLower = searchQuery.toLowerCase();

          // Filtra per nome, cognome o email
          if (
            fullName.includes(searchLower) ||
            userData.email.toLowerCase().includes(searchLower) ||
            (userData.phone && userData.phone.includes(searchQuery))
          ) {
            foundUsers.push({
              id: doc.id,
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              phone: userData.phone,
              userType: userData.userType,
            });
            userIds.add(doc.id);
          }
        }
      });

      setUsers(foundUsers);
    } catch (error) {
      console.error('Errore nella ricerca utenti:', error);
      Alert.alert('Errore', 'Errore durante la ricerca degli utenti');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: User) => {
    onSelectUser(user);
    onClose();
    setSearchQuery('');
    setUsers([]);
    setHasSearched(false);
  };

  const handleCustomerAdded = (customer: any) => {
    handleSelectUser(customer);
    setShowQuickAdd(false);
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
      onPress={() => handleSelectUser(item)}
    >
      <View style={styles.userInfo}>
        <View style={[styles.userAvatar, { backgroundColor: theme.primary }]}>
          <Text style={styles.userAvatarText}>
            {item.firstName.charAt(0)}{item.lastName.charAt(0)}
          </Text>
        </View>
        
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: theme.text }]}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
            {item.email}
          </Text>
          {item.phone && (
            <Text style={[styles.userPhone, { color: theme.textSecondary }]}>
              📞 {item.phone}
            </Text>
          )}
        </View>
      </View>
      
      <MaterialCommunityIcons 
        name="chevron-right" 
        size={20} 
        color={theme.textSecondary} 
      />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Cerca Proprietario
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <MaterialCommunityIcons 
              name="magnify" 
              size={20} 
              color={theme.textSecondary} 
            />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Cerca per nome, email o telefono..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchUsers}
              autoFocus
            />
          </View>
          
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: theme.primary }]}
            onPress={searchUsers}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <MaterialCommunityIcons name="magnify" size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Results */}
        <View style={styles.resultsContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Ricerca in corso...
              </Text>
            </View>
          )}

          {!loading && hasSearched && users.length === 0 && (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="account-search" 
                size={64} 
                color={theme.textSecondary} 
              />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Nessun utente trovato
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Prova con termini di ricerca diversi
              </Text>
              
              <TouchableOpacity
                style={[styles.quickAddButton, { backgroundColor: theme.primary }]}
                onPress={() => setShowQuickAdd(true)}
              >
                <MaterialCommunityIcons name="account-plus" size={20} color="#ffffff" />
                <Text style={styles.quickAddButtonText}>Aggiungi Nuovo Cliente</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && !hasSearched && (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="account-multiple" 
                size={64} 
                color={theme.textSecondary} 
              />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Cerca un cliente
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Inserisci nome, email o numero di telefono{'\n'}per trovare il proprietario dell'auto
              </Text>
            </View>
          )}

          {!loading && users.length > 0 && (
            <FlatList
              data={users}
              keyExtractor={(item) => item.id}
              renderItem={renderUserItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>

        {/* Quick Add Customer Modal */}
        <QuickAddCustomerModal
          visible={showQuickAdd}
          onClose={() => setShowQuickAdd(false)}
          onCustomerAdded={handleCustomerAdded}
          darkMode={darkMode}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 12,
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  quickAddButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default UserSearchModal;

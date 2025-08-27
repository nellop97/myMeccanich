
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Car,
  User,
  Calendar,
  Check,
  X,
  Clock,
  Mail
} from 'lucide-react-native';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  doc, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { useStore } from '../../store';

interface TransferRequest {
  id: string;
  carId: string;
  fromUserId: string;
  fromUserEmail: string;
  toUserEmail: string;
  newOwnerName: string;
  newOwnerPhone: string;
  message: string;
  carInfo: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: any;
  expiresAt: any;
}

const TransferRequestsScreen = () => {
  const navigation = useNavigation();
  const { darkMode } = useStore();
  
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const theme = {
    background: darkMode ? '#121212' : '#f5f5f5',
    cardBackground: darkMode ? '#1e1e1e' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#a0a0a0' : '#666666',
    primary: '#007AFF',
    border: darkMode ? '#333333' : '#e0e0e0',
    success: '#34C759',
    error: '#FF3B30',
    warning: '#FF9500'
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'carTransferRequests'),
      where('toUserEmail', '==', auth.currentUser.email?.toLowerCase())
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transferRequests: TransferRequest[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        transferRequests.push({
          id: doc.id,
          ...data
        } as TransferRequest);
      });

      // Sort by creation date, newest first
      transferRequests.sort((a, b) => {
        const dateA = a.createdAt?.toDate() || new Date(0);
        const dateB = b.createdAt?.toDate() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setRequests(transferRequests);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh is handled by the real-time listener
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAcceptTransfer = async (request: TransferRequest) => {
    Alert.alert(
      'Accetta Trasferimento',
      `Vuoi diventare il proprietario di ${request.carInfo.make} ${request.carInfo.model} (${request.carInfo.licensePlate})?`,
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Accetta', 
          style: 'default',
          onPress: () => processTransfer(request, 'accepted')
        }
      ]
    );
  };

  const handleDeclineTransfer = async (request: TransferRequest) => {
    Alert.alert(
      'Rifiuta Trasferimento',
      'Sei sicuro di voler rifiutare questo trasferimento?',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Rifiuta', 
          style: 'destructive',
          onPress: () => processTransfer(request, 'declined')
        }
      ]
    );
  };

  const processTransfer = async (request: TransferRequest, action: 'accepted' | 'declined') => {
    if (!auth.currentUser) return;

    setProcessingId(request.id);

    try {
      // Update transfer request status
      await updateDoc(doc(db, 'carTransferRequests', request.id), {
        status: action,
        updatedAt: serverTimestamp(),
        processedAt: serverTimestamp()
      });

      if (action === 'accepted') {
        // Update car ownership
        await updateDoc(doc(db, 'vehicles', request.carId), {
          ownerId: auth.currentUser.uid,
          previousOwnerId: request.fromUserId,
          transferredAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Create transfer log
        await addDoc(collection(db, 'transferLogs'), {
          carId: request.carId,
          fromUserId: request.fromUserId,
          toUserId: auth.currentUser.uid,
          transferRequestId: request.id,
          transferredAt: serverTimestamp()
        });

        Alert.alert(
          'Successo!',
          'Hai accettato il trasferimento. L\'auto è ora di tua proprietà.',
          [{ text: 'OK', onPress: () => navigation.navigate('VehicleList') }]
        );
      } else {
        Alert.alert('Trasferimento rifiutato', 'Hai rifiutato il trasferimento.');
      }
    } catch (error) {
      console.error('Error processing transfer:', error);
      Alert.alert('Errore', 'Impossibile processare il trasferimento.');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return theme.warning;
      case 'accepted': return theme.success;
      case 'declined': return theme.error;
      case 'expired': return theme.textSecondary;
      default: return theme.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'In Attesa';
      case 'accepted': return 'Accettato';
      case 'declined': return 'Rifiutato';
      case 'expired': return 'Scaduto';
      default: return status;
    }
  };

  const isExpired = (request: TransferRequest) => {
    const now = new Date();
    const expiryDate = request.expiresAt?.toDate();
    return expiryDate && now > expiryDate;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderTransferRequest = (request: TransferRequest) => {
    const expired = isExpired(request);
    const isPending = request.status === 'pending' && !expired;
    
    return (
      <View key={request.id} style={[styles.requestCard, { backgroundColor: theme.cardBackground }]}>
        {/* Header */}
        <View style={styles.requestHeader}>
          <View style={styles.requestHeaderLeft}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(request.status) }]} />
            <Text style={[styles.requestTitle, { color: theme.text }]}>
              Richiesta di Trasferimento
            </Text>
          </View>
          <Text style={[styles.statusLabel, { color: getStatusColor(request.status) }]}>
            {expired ? 'Scaduto' : getStatusLabel(request.status)}
          </Text>
        </View>

        {/* Car Info */}
        <View style={styles.carSection}>
          <Car size={20} color={theme.primary} />
          <View style={styles.carInfo}>
            <Text style={[styles.carTitle, { color: theme.text }]}>
              {request.carInfo.make} {request.carInfo.model} ({request.carInfo.year})
            </Text>
            <Text style={[styles.carPlate, { color: theme.textSecondary }]}>
              {request.carInfo.licensePlate}
            </Text>
          </View>
        </View>

        {/* Sender Info */}
        <View style={styles.senderSection}>
          <User size={20} color={theme.textSecondary} />
          <View style={styles.senderInfo}>
            <Text style={[styles.senderText, { color: theme.textSecondary }]}>
              Da: {request.fromUserEmail}
            </Text>
          </View>
        </View>

        {/* Message */}
        {request.message && (
          <View style={[styles.messageSection, { backgroundColor: theme.background + '50' }]}>
            <Text style={[styles.messageText, { color: theme.text }]}>
              "{request.message}"
            </Text>
          </View>
        )}

        {/* Date */}
        <View style={styles.dateSection}>
          <Calendar size={16} color={theme.textSecondary} />
          <Text style={[styles.dateText, { color: theme.textSecondary }]}>
            Ricevuto il {formatDate(request.createdAt)}
          </Text>
        </View>

        {/* Actions */}
        {isPending && (
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.declineButton, { borderColor: theme.error }]}
              onPress={() => handleDeclineTransfer(request)}
              disabled={processingId === request.id}
            >
              <X size={16} color={theme.error} />
              <Text style={[styles.declineButtonText, { color: theme.error }]}>
                Rifiuta
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.acceptButton, { backgroundColor: theme.success }]}
              onPress={() => handleAcceptTransfer(request)}
              disabled={processingId === request.id}
            >
              {processingId === request.id ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={16} color="#ffffff" />
                  <Text style={styles.acceptButtonText}>Accetta</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Richieste Trasferimento</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Richieste Trasferimento</Text>
        <View style={{ width: 24 }} />
      </View>

      {requests.length === 0 ? (
        <View style={styles.emptyState}>
          <Mail size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Nessuna Richiesta
          </Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Non hai richieste di trasferimento auto in sospeso.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {requests.map(renderTransferRequest)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  requestCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  carSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  carInfo: {
    flex: 1,
  },
  carTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  carPlate: {
    fontSize: 14,
  },
  senderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  senderInfo: {
    flex: 1,
  },
  senderText: {
    fontSize: 14,
  },
  messageSection: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  messageText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  dateText: {
    fontSize: 12,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default TransferRequestsScreen;

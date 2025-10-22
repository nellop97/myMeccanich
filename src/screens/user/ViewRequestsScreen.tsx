// =====================================================
// VIEW REQUESTS SCREEN
// Schermata per gestire richieste di visualizzazione (Owner)
// =====================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Checkbox,
  Divider,
  Badge
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Car,
  User,
  Mail,
  Phone,
  Calendar,
  Check,
  X,
  Eye,
  EyeOff,
  Clock,
  MessageSquare,
  Shield
} from 'lucide-react-native';
import { useAppThemeManager } from '../../hooks/useTheme';
import { VehicleViewRequestService, VehicleViewRequest } from '../../services/VehicleViewRequestService';
import { auth } from '../../services/firebase';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isLargeScreen = width >= 768;

export default function ViewRequestsScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useAppThemeManager();
  const viewRequestService = VehicleViewRequestService.getInstance();

  const [requests, setRequests] = useState<VehicleViewRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<VehicleViewRequest | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Privacy settings per approvazione
  const [visibleData, setVisibleData] = useState({
    basicInfo: true,
    maintenanceHistory: false,
    maintenanceDetails: false,
    documents: false,
    photos: true
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    if (!auth.currentUser) return;

    try {
      const data = await viewRequestService.getIncomingRequests(auth.currentUser.uid);
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
      Alert.alert('Errore', 'Impossibile caricare le richieste');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleApproveRequest = (request: VehicleViewRequest) => {
    setSelectedRequest(request);
    // Reset privacy settings
    setVisibleData({
      basicInfo: true,
      maintenanceHistory: false,
      maintenanceDetails: false,
      documents: false,
      photos: true
    });
    setShowApprovalModal(true);
  };

  const confirmApproval = async () => {
    if (!selectedRequest) return;

    setProcessingId(selectedRequest.id);
    setShowApprovalModal(false);

    try {
      await viewRequestService.approveViewRequest(selectedRequest.id, visibleData);

      Alert.alert(
        'Richiesta approvata',
        `${selectedRequest.requesterName} potrà ora visualizzare i dati selezionati del tuo veicolo.`
      );

      await loadRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      Alert.alert('Errore', 'Impossibile approvare la richiesta');
    } finally {
      setProcessingId(null);
      setSelectedRequest(null);
    }
  };

  const handleRejectRequest = (request: VehicleViewRequest) => {
    Alert.alert(
      'Rifiuta richiesta',
      `Sei sicuro di voler rifiutare la richiesta di ${request.requesterName}?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Rifiuta',
          style: 'destructive',
          onPress: () => processRejection(request)
        }
      ]
    );
  };

  const processRejection = async (request: VehicleViewRequest) => {
    setProcessingId(request.id);

    try {
      await viewRequestService.rejectViewRequest(request.id);

      Alert.alert('Richiesta rifiutata', 'La richiesta è stata rifiutata.');

      await loadRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Errore', 'Impossibile rifiutare la richiesta');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRevokeRequest = (request: VehicleViewRequest) => {
    Alert.alert(
      'Revoca accesso',
      'Vuoi revocare l\'accesso ai dati del veicolo? L\'utente non potrà più visualizzarli.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Revoca',
          style: 'destructive',
          onPress: () => processRevocation(request)
        }
      ]
    );
  };

  const processRevocation = async (request: VehicleViewRequest) => {
    setProcessingId(request.id);

    try {
      await viewRequestService.revokeViewRequest(request.id);

      Alert.alert('Accesso revocato', 'L\'accesso ai dati è stato revocato.');

      await loadRequests();
    } catch (error) {
      console.error('Error revoking request:', error);
      Alert.alert('Errore', 'Impossibile revocare l\'accesso');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return colors.tertiary;
      case 'approved':
        return '#34C759';
      case 'rejected':
        return colors.error;
      case 'expired':
        return colors.onSurfaceVariant;
      case 'revoked':
        return colors.error;
      default:
        return colors.onSurfaceVariant;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'In Attesa';
      case 'approved':
        return 'Approvata';
      case 'rejected':
        return 'Rifiutata';
      case 'expired':
        return 'Scaduta';
      case 'revoked':
        return 'Revocata';
      default:
        return status;
    }
  };

  const renderRequest = (request: VehicleViewRequest) => {
    const isPending = request.status === 'pending';
    const isApproved = request.status === 'approved';
    const isProcessing = processingId === request.id;

    return (
      <Card
        key={request.id}
        style={[styles.requestCard, { backgroundColor: colors.surface }]}
      >
        <Card.Content>
          {/* Header with status */}
          <View style={styles.requestHeader}>
            <View style={styles.requestHeaderLeft}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(request.status) }]} />
              <Text style={[styles.requestTitle, { color: colors.onSurface }]}>
                Richiesta di Visualizzazione
              </Text>
            </View>
            <Badge
              style={{ backgroundColor: getStatusColor(request.status) }}
            >
              {getStatusLabel(request.status)}
            </Badge>
          </View>

          {/* Vehicle Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Car size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Veicolo
              </Text>
            </View>
            <Text style={[styles.vehicleText, { color: colors.onSurface }]}>
              {request.vehicleInfo.make} {request.vehicleInfo.model} ({request.vehicleInfo.year})
            </Text>
            <Text style={[styles.plateText, { color: colors.onSurfaceVariant }]}>
              {request.vehicleInfo.licensePlate}
            </Text>
          </View>

          <Divider style={styles.divider} />

          {/* Requester Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <User size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Richiedente
              </Text>
            </View>
            <View style={styles.infoRow}>
              <User size={14} color={colors.onSurfaceVariant} />
              <Text style={[styles.infoText, { color: colors.onSurface }]}>
                {request.requesterName}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Mail size={14} color={colors.onSurfaceVariant} />
              <Text style={[styles.infoText, { color: colors.onSurface }]}>
                {request.requesterEmail}
              </Text>
            </View>
            {request.requesterPhone && (
              <View style={styles.infoRow}>
                <Phone size={14} color={colors.onSurfaceVariant} />
                <Text style={[styles.infoText, { color: colors.onSurface }]}>
                  {request.requesterPhone}
                </Text>
              </View>
            )}
          </View>

          {/* Message */}
          {request.message && (
            <>
              <Divider style={styles.divider} />
              <View style={[styles.messageBox, { backgroundColor: colors.surfaceVariant }]}>
                <MessageSquare size={16} color={colors.onSurfaceVariant} />
                <Text style={[styles.messageText, { color: colors.onSurface }]}>
                  "{request.message}"
                </Text>
              </View>
            </>
          )}

          {/* Date Info */}
          <View style={styles.dateInfo}>
            <Clock size={14} color={colors.onSurfaceVariant} />
            <Text style={[styles.dateText, { color: colors.onSurfaceVariant }]}>
              Ricevuta il {formatDate(request.createdAt)}
            </Text>
          </View>

          {/* Approved Data Info */}
          {isApproved && (
            <>
              <Divider style={styles.divider} />
              <View style={[styles.approvedDataBox, { backgroundColor: colors.primaryContainer }]}>
                <Shield size={16} color={colors.primary} />
                <View style={styles.approvedDataContent}>
                  <Text style={[styles.approvedDataTitle, { color: colors.onPrimaryContainer }]}>
                    Dati condivisi:
                  </Text>
                  <Text style={[styles.approvedDataText, { color: colors.onPrimaryContainer }]}>
                    {Object.entries(request.visibleData)
                      .filter(([_, value]) => value)
                      .map(([key]) => {
                        const labels: any = {
                          basicInfo: 'Info base',
                          maintenanceHistory: 'Storico manutenzione',
                          maintenanceDetails: 'Dettagli manutenzione',
                          documents: 'Documenti',
                          photos: 'Foto'
                        };
                        return labels[key];
                      })
                      .join(', ')}
                  </Text>
                  <Text style={[styles.viewsText, { color: colors.onPrimaryContainer }]}>
                    Visualizzazioni: {request.viewsCount}/{request.maxViews}
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Actions */}
          {isPending && (
            <View style={styles.actions}>
              <Button
                mode="outlined"
                onPress={() => handleRejectRequest(request)}
                disabled={isProcessing}
                style={[styles.actionButton, { borderColor: colors.error }]}
                textColor={colors.error}
                icon={() => <X size={18} color={colors.error} />}
              >
                Rifiuta
              </Button>
              <Button
                mode="contained"
                onPress={() => handleApproveRequest(request)}
                disabled={isProcessing}
                loading={isProcessing}
                style={styles.actionButton}
                buttonColor="#34C759"
                icon={() => <Check size={18} color="#fff" />}
              >
                Approva
              </Button>
            </View>
          )}

          {isApproved && (
            <View style={styles.actions}>
              <Button
                mode="outlined"
                onPress={() => handleRevokeRequest(request)}
                disabled={isProcessing}
                style={[styles.actionButton, { borderColor: colors.error }]}
                textColor={colors.error}
                icon={() => <EyeOff size={18} color={colors.error} />}
              >
                Revoca Accesso
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderApprovalModal = () => {
    if (!showApprovalModal || !selectedRequest) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
            Approva richiesta
          </Text>
          <Text style={[styles.modalDescription, { color: colors.onSurfaceVariant }]}>
            Seleziona quali dati vuoi condividere con {selectedRequest.requesterName}
          </Text>

          <View style={styles.privacyOptions}>
            <DataOption
              title="Informazioni Base"
              description="Marca, modello, anno, targa, chilometraggio"
              value={visibleData.basicInfo}
              onToggle={() => setVisibleData({ ...visibleData, basicInfo: !visibleData.basicInfo })}
              required
              colors={colors}
            />

            <DataOption
              title="Storico Manutenzione"
              description="Lista interventi (senza costi)"
              value={visibleData.maintenanceHistory}
              onToggle={() => setVisibleData({ ...visibleData, maintenanceHistory: !visibleData.maintenanceHistory })}
              colors={colors}
            />

            <DataOption
              title="Dettagli Manutenzione"
              description="Include costi e meccanici"
              value={visibleData.maintenanceDetails}
              onToggle={() => setVisibleData({ ...visibleData, maintenanceDetails: !visibleData.maintenanceDetails })}
              disabled={!visibleData.maintenanceHistory}
              colors={colors}
            />

            <DataOption
              title="Documenti"
              description="Libretti, fatture, certificati"
              value={visibleData.documents}
              onToggle={() => setVisibleData({ ...visibleData, documents: !visibleData.documents })}
              colors={colors}
            />

            <DataOption
              title="Galleria Foto"
              description="Immagini del veicolo"
              value={visibleData.photos}
              onToggle={() => setVisibleData({ ...visibleData, photos: !visibleData.photos })}
              colors={colors}
            />
          </View>

          <View style={[styles.warningBox, { backgroundColor: colors.errorContainer }]}>
            <Eye size={16} color={colors.error} />
            <Text style={[styles.warningText, { color: colors.onErrorContainer }]}>
              L'utente potrà visualizzare questi dati per 7 giorni (max 10 volte)
            </Text>
          </View>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => {
                setShowApprovalModal(false);
                setSelectedRequest(null);
              }}
              style={styles.modalActionButton}
            >
              Annulla
            </Button>
            <Button
              mode="contained"
              onPress={confirmApproval}
              style={styles.modalActionButton}
              buttonColor={colors.primary}
            >
              Conferma
            </Button>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
            Richieste Visualizzazione
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
          Richieste Visualizzazione
        </Text>
        {requests.filter(r => r.status === 'pending').length > 0 && (
          <Badge style={{ backgroundColor: colors.error }}>
            {requests.filter(r => r.status === 'pending').length}
          </Badge>
        )}
        {requests.filter(r => r.status === 'pending').length === 0 && <View style={{ width: 24 }} />}
      </View>

      {requests.length === 0 ? (
        <View style={styles.emptyState}>
          <Eye size={64} color={colors.onSurfaceVariant} />
          <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
            Nessuna Richiesta
          </Text>
          <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            Non hai ricevuto richieste di visualizzazione per i tuoi veicoli
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isWeb && isLargeScreen && styles.scrollContentWeb
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {requests.map(renderRequest)}
        </ScrollView>
      )}

      {/* Approval Modal */}
      {renderApprovalModal()}
    </SafeAreaView>
  );
}

// Data Option Component
const DataOption = ({ title, description, value, onToggle, required, disabled, colors }: any) => (
  <TouchableOpacity
    style={[styles.dataOption, disabled && styles.dataOptionDisabled]}
    onPress={onToggle}
    disabled={required || disabled}
  >
    <View style={styles.dataOptionInfo}>
      <Text style={[styles.dataOptionTitle, { color: colors.onSurface }]}>
        {title}
      </Text>
      <Text style={[styles.dataOptionDescription, { color: colors.onSurfaceVariant }]}>
        {description}
      </Text>
      {required && (
        <Text style={[styles.dataOptionRequired, { color: colors.primary }]}>
          Obbligatorio
        </Text>
      )}
    </View>
    <Checkbox
      status={value ? 'checked' : 'unchecked'}
      disabled={required || disabled}
      color={colors.primary}
    />
  </TouchableOpacity>
);

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
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  scrollContentWeb: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  requestHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  vehicleText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  plateText: {
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
  },
  divider: {
    marginVertical: 12,
  },
  messageBox: {
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  dateText: {
    fontSize: 12,
  },
  approvedDataBox: {
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
  },
  approvedDataContent: {
    flex: 1,
  },
  approvedDataTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  approvedDataText: {
    fontSize: 13,
    marginBottom: 4,
  },
  viewsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  privacyOptions: {
    gap: 12,
    marginBottom: 16,
  },
  dataOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dataOptionDisabled: {
    opacity: 0.5,
  },
  dataOptionInfo: {
    flex: 1,
    marginRight: 12,
  },
  dataOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  dataOptionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  dataOptionRequired: {
    fontSize: 11,
    marginTop: 2,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalActionButton: {
    flex: 1,
    borderRadius: 12,
  },
});

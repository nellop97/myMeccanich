// =====================================================
// MY VEHICLE VIEW REQUESTS SCREEN
// Schermata per vedere le proprie richieste di visualizzazione
// =====================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
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
  Badge
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Car,
  Calendar,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react-native';
import { useAppThemeManager } from '../../hooks/useTheme';
import { VehicleViewRequestService, VehicleViewRequest } from '../../services/VehicleViewRequestService';
import { auth } from '../../services/firebase';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isLargeScreen = width >= 768;

export default function MyVehicleViewRequestsScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useAppThemeManager();
  const viewRequestService = VehicleViewRequestService.getInstance();

  const [requests, setRequests] = useState<VehicleViewRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    if (!auth.currentUser?.email) return;

    try {
      const data = await viewRequestService.getMyRequests(auth.currentUser.email);
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleViewVehicleData = (requestId: string) => {
    navigation.navigate('VehicleDataView', { requestId });
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
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

  const getStatusIcon = (status: string) => {
    const color = getStatusColor(status);
    switch (status) {
      case 'pending':
        return <Clock size={20} color={color} />;
      case 'approved':
        return <CheckCircle size={20} color={color} />;
      case 'rejected':
        return <XCircle size={20} color={color} />;
      case 'expired':
        return <AlertCircle size={20} color={color} />;
      case 'revoked':
        return <XCircle size={20} color={color} />;
      default:
        return <AlertCircle size={20} color={color} />;
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

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Il proprietario deve ancora rispondere alla tua richiesta';
      case 'approved':
        return 'Puoi visualizzare i dati del veicolo';
      case 'rejected':
        return 'Il proprietario ha rifiutato la tua richiesta';
      case 'expired':
        return 'La richiesta è scaduta';
      case 'revoked':
        return 'L\'accesso è stato revocato dal proprietario';
      default:
        return '';
    }
  };

  const renderRequest = (request: VehicleViewRequest) => {
    const isApproved = request.status === 'approved';
    const isPending = request.status === 'pending';

    return (
      <Card
        key={request.id}
        style={[styles.requestCard, { backgroundColor: colors.surface }]}
      >
        <Card.Content>
          {/* Header */}
          <View style={styles.requestHeader}>
            <View style={styles.statusInfo}>
              {getStatusIcon(request.status)}
              <View style={styles.statusTextContainer}>
                <Text style={[styles.statusLabel, { color: getStatusColor(request.status) }]}>
                  {getStatusLabel(request.status)}
                </Text>
                <Text style={[styles.statusDescription, { color: colors.onSurfaceVariant }]}>
                  {getStatusDescription(request.status)}
                </Text>
              </View>
            </View>
          </View>

          {/* Vehicle Info */}
          <View style={styles.vehicleSection}>
            <View style={[styles.vehicleIcon, { backgroundColor: colors.primaryContainer }]}>
              <Car size={24} color={colors.primary} />
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={[styles.vehicleTitle, { color: colors.onSurface }]}>
                {request.vehicleInfo.make} {request.vehicleInfo.model}
              </Text>
              <Text style={[styles.vehicleSubtitle, { color: colors.onSurfaceVariant }]}>
                {request.vehicleInfo.year} • {request.vehicleInfo.licensePlate}
              </Text>
            </View>
          </View>

          {/* Date Info */}
          <View style={styles.dateSection}>
            <Calendar size={14} color={colors.onSurfaceVariant} />
            <Text style={[styles.dateText, { color: colors.onSurfaceVariant }]}>
              Inviata il {formatDate(request.createdAt)}
            </Text>
          </View>

          {/* Approved Info */}
          {isApproved && (
            <View style={[styles.approvedInfo, { backgroundColor: colors.primaryContainer }]}>
              <Eye size={16} color={colors.primary} />
              <View style={styles.approvedInfoText}>
                <Text style={[styles.approvedInfoTitle, { color: colors.onPrimaryContainer }]}>
                  Visualizzazioni: {request.viewsCount}/{request.maxViews}
                </Text>
                <Text style={[styles.approvedInfoSubtitle, { color: colors.onPrimaryContainer }]}>
                  Scade il {formatDate(request.expiresAt)}
                </Text>
              </View>
            </View>
          )}

          {/* Actions */}
          {isApproved && (
            <Button
              mode="contained"
              onPress={() => handleViewVehicleData(request.id)}
              style={styles.viewButton}
              buttonColor={colors.primary}
              icon={() => <Eye size={18} color="#fff" />}
            >
              Visualizza Dati Veicolo
            </Button>
          )}

          {isPending && (
            <View style={[styles.pendingInfo, { backgroundColor: colors.surfaceVariant }]}>
              <Clock size={16} color={colors.onSurfaceVariant} />
              <Text style={[styles.pendingText, { color: colors.onSurfaceVariant }]}>
                Riceverai una notifica quando il proprietario risponderà
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
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
            Le Mie Richieste
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
          Le Mie Richieste
        </Text>
        {requests.filter(r => r.status === 'approved').length > 0 && (
          <Badge style={{ backgroundColor: '#34C759' }}>
            {requests.filter(r => r.status === 'approved').length}
          </Badge>
        )}
        {requests.filter(r => r.status === 'approved').length === 0 && <View style={{ width: 24 }} />}
      </View>

      {requests.length === 0 ? (
        <View style={styles.emptyState}>
          <Eye size={64} color={colors.onSurfaceVariant} />
          <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
            Nessuna Richiesta
          </Text>
          <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            Non hai ancora inviato richieste di visualizzazione
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('RequestVehicleView')}
            style={styles.emptyButton}
            buttonColor={colors.primary}
          >
            Richiedi Visualizzazione
          </Button>
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
    </SafeAreaView>
  );
}

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
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 12,
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
    marginBottom: 16,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  vehicleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  vehicleSubtitle: {
    fontSize: 14,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
  },
  approvedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  approvedInfoText: {
    flex: 1,
  },
  approvedInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  approvedInfoSubtitle: {
    fontSize: 12,
  },
  viewButton: {
    borderRadius: 12,
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  pendingText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

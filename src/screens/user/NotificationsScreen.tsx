// src/screens/user/NotificationsScreen.tsx - Notifiche con Firebase
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  RefreshControl,
  useWindowDimensions,
  Clipboard
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Bell,
  Calendar,
  Wrench,
  Shield,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Settings,
  ArrowLeft,
  Clock,
  Car,
  Copy,
  Truck
} from 'lucide-react-native';
import { useStore } from '../../store';
import { NotificationService } from '../../services/NotificationService';
import { inAppNotificationService, InAppNotification } from '../../services/InAppNotificationService';
import { TransferService } from '../../services/TransferService';
import { VehicleTransfer } from '../../types/database.types';
import TransferAcceptanceModal from '../../components/TransferAcceptanceModal';

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { user, darkMode } = useStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [settings, setSettings] = useState({
    pushNotifications: true,
    maintenanceReminders: true,
    documentExpiry: true,
    expenseAlerts: true,
    weeklyReports: false,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'settings'>('all');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<VehicleTransfer | null>(null);

  const theme = {
    background: darkMode ? '#121212' : '#f8fafc',
    cardBackground: darkMode ? '#1e1e1e' : '#ffffff',
    text: darkMode ? '#ffffff' : '#1e293b',
    textSecondary: darkMode ? '#a0a0a0' : '#64748b',
    primary: '#3b82f6',
    border: darkMode ? '#333333' : '#e2e8f0',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  useEffect(() => {
    loadNotifications();
    loadSettings();

    // Cleanup scadute
    if (user?.email) {
      inAppNotificationService.deleteExpiredNotifications(user.email);
    }

    // Real-time listener
    let unsubscribe: (() => void) | null = null;
    if (user?.email) {
      unsubscribe = inAppNotificationService.subscribeToNotifications(
        user.email,
        (notifs) => {
          setNotifications(notifs);
          setLoading(false);
        }
      );
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.email]);

  const loadNotifications = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      const notifs = await inAppNotificationService.getUserNotifications(user.email);
      setNotifications(notifs);
    } catch (error) {
      console.error('Errore caricamento notifiche:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const storedSettings = await NotificationService.getNotificationSettings();
      setSettings({ ...settings, ...storedSettings });
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await inAppNotificationService.markAsRead(notificationId);
      // Il listener real-time aggiornerà automaticamente
    } catch (error) {
      console.error('Errore aggiornamento notifica:', error);
    }
  };

  const handleNotificationPress = async (notification: InAppNotification) => {
    // Marca come letta
    await markAsRead(notification.id);

    // Naviga in base al tipo di notifica
    switch (notification.type) {
      case 'transfer_request':
        // Apri modal trasferimento
        if (notification.data?.transferId) {
          try {
            const transferService = TransferService.getInstance();
            const transfer = await transferService.getTransferById(notification.data.transferId);

            if (transfer) {
              setSelectedTransfer(transfer);
              setShowTransferModal(true);
            } else {
              Alert.alert('Errore', 'Trasferimento non trovato o già completato');
            }
          } catch (error) {
            console.error('Error loading transfer:', error);
            Alert.alert('Errore', 'Impossibile caricare il trasferimento');
          }
        }
        break;

      case 'transfer_accepted':
        // Torna alla home per vedere il veicolo
        navigation.goBack();
        break;

      case 'reminder':
        // Vai ai promemoria
        navigation.navigate('Reminders' as never);
        break;

      case 'maintenance':
        // Vai alla manutenzione (se c'è vehicleId)
        if (notification.data?.vehicleId) {
          navigation.navigate('MaintenanceHistory' as never, {
            carId: notification.data.vehicleId
          } as never);
        }
        break;

      case 'document':
        // Vai ai documenti del veicolo
        if (notification.data?.vehicleId) {
          navigation.navigate('CarDetail' as never, {
            carId: notification.data.vehicleId
          } as never);
        }
        break;

      case 'booking':
        // Vai alle prenotazioni
        navigation.navigate('BookingsDashboard' as never);
        break;

      default:
        // Comportamento di default: nessuna navigazione
        break;
    }
  };

  const markAllAsRead = async () => {
    if (!user?.email) return;

    try {
      await inAppNotificationService.markAllAsRead(user.email);
      Alert.alert('Successo', 'Tutte le notifiche sono state segnate come lette');
    } catch (error) {
      console.error('Errore aggiornamento notifiche:', error);
      Alert.alert('Errore', 'Impossibile aggiornare le notifiche');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await inAppNotificationService.deleteNotification(notificationId);
      // Il listener real-time aggiornerà automaticamente
    } catch (error) {
      console.error('Errore eliminazione notifica:', error);
      Alert.alert('Errore', 'Impossibile eliminare la notifica');
    }
  };

  const copyPinToClipboard = (pin: string) => {
    Clipboard.setString(pin);
    Alert.alert('✅ Copiato', 'PIN copiato negli appunti');
  };

  const updateSetting = async (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      await NotificationService.updateNotificationSettings(newSettings);

      if (key === 'pushNotifications' && value) {
        await NotificationService.requestPermissions();
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Errore', 'Impossibile aggiornare le impostazioni');
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    const color = priority === 'high' ? theme.error :
                 priority === 'medium' ? theme.warning : theme.success;

    switch (type) {
      case 'transfer_request':
      case 'transfer_accepted':
        return <Truck size={20} color={color} />;
      case 'reminder':
        return <Calendar size={20} color={color} />;
      case 'maintenance':
        return <Wrench size={20} color={color} />;
      case 'document':
        return <Shield size={20} color={color} />;
      case 'booking':
        return <Car size={20} color={color} />;
      default:
        return <Bell size={20} color={color} />;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Adesso';
    if (diffInHours < 24) return `${diffInHours}h fa`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Ieri';
    if (diffInDays < 7) return `${diffInDays} giorni fa`;

    return date.toLocaleDateString('it-IT');
  };

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === 'unread') return !notif.read;
    return true;
  });

  const renderNotification = (notification: InAppNotification) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationCard,
        isDesktop && styles.notificationCardDesktop,
        {
          backgroundColor: theme.cardBackground,
          borderLeftColor: notification.priority === 'high' ? theme.error :
                          notification.priority === 'medium' ? theme.warning : theme.success
        },
        !notification.read && { backgroundColor: theme.primary + '10' }
      ]}
      onPress={() => handleNotificationPress(notification)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}>
            {getNotificationIcon(notification.type, notification.priority)}
          </View>

          <View style={styles.notificationInfo}>
            <Text style={[styles.notificationTitle, { color: theme.text }]}>
              {notification.title}
            </Text>
            <Text style={[styles.notificationMessage, { color: theme.textSecondary }]}>
              {notification.message}
            </Text>

            {/* PIN per notifiche di trasferimento */}
            {notification.type === 'transfer_request' && notification.data?.transferPin && (
              <View style={[styles.pinContainer, { backgroundColor: theme.border + '30', borderColor: theme.border }]}>
                <View style={styles.pinHeader}>
                  <Text style={[styles.pinLabel, { color: theme.textSecondary }]}>
                    🔒 PIN Trasferimento:
                  </Text>
                  <TouchableOpacity
                    onPress={() => copyPinToClipboard(notification.data!.transferPin!)}
                    style={styles.copyButton}
                  >
                    <Copy size={16} color={theme.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.pinValue, { color: theme.text }]}>
                  {notification.data.transferPin}
                </Text>
                <Text style={[styles.pinHint, { color: theme.textSecondary }]}>
                  Usa questo PIN per accettare il trasferimento
                </Text>
              </View>
            )}

            {notification.data?.carInfo && (
              <View style={styles.carInfo}>
                <Car size={12} color={theme.textSecondary} />
                <Text style={[styles.carInfoText, { color: theme.textSecondary }]}>
                  {notification.data.carInfo}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.notificationMeta}>
            <Text style={[styles.notificationTime, { color: theme.textSecondary }]}>
              {formatDate(notification.createdAt)}
            </Text>
            {!notification.read && (
              <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
            )}
          </View>
        </View>

        {notification.actionRequired && notification.type === 'transfer_request' && (
          <View style={styles.actionSection}>
            <Text style={[styles.actionHint, { color: theme.textSecondary }]}>
              Vai alla sezione "Trasferimenti in arrivo" per accettare
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteNotification(notification.id)}
      >
        <Text style={[styles.deleteButtonText, { color: theme.error }]}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSettings = () => (
    <View style={[styles.settingsContainer, isDesktop && styles.settingsContainerDesktop]}>
      <View style={[styles.settingsSection, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Notifiche Push</Text>

        <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>
              Attiva Notifiche
            </Text>
            <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
              Ricevi notifiche push sul dispositivo
            </Text>
          </View>
          <Switch
            value={settings.pushNotifications}
            onValueChange={(value) => updateSetting('pushNotifications', value)}
            trackColor={{ false: theme.border, true: theme.primary + '50' }}
            thumbColor={settings.pushNotifications ? theme.primary : theme.textSecondary}
          />
        </View>

        <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>
              Promemoria Manutenzioni
            </Text>
            <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
              Avvisi per manutenzioni programmate
            </Text>
          </View>
          <Switch
            value={settings.maintenanceReminders}
            onValueChange={(value) => updateSetting('maintenanceReminders', value)}
            trackColor={{ false: theme.border, true: theme.primary + '50' }}
            thumbColor={settings.maintenanceReminders ? theme.primary : theme.textSecondary}
          />
        </View>

        <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>
              Scadenza Documenti
            </Text>
            <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
              Avvisi per documenti in scadenza
            </Text>
          </View>
          <Switch
            value={settings.documentExpiry}
            onValueChange={(value) => updateSetting('documentExpiry', value)}
            trackColor={{ false: theme.border, true: theme.primary + '50' }}
            thumbColor={settings.documentExpiry ? theme.primary : theme.textSecondary}
          />
        </View>

        <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>
              Report Settimanali
            </Text>
            <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
              Riassunto settimanale delle attività
            </Text>
          </View>
          <Switch
            value={settings.weeklyReports}
            onValueChange={(value) => updateSetting('weeklyReports', value)}
            trackColor={{ false: theme.border, true: theme.primary + '50' }}
            thumbColor={settings.weeklyReports ? theme.primary : theme.textSecondary}
          />
        </View>
      </View>
    </View>
  );

  if (!user?.email) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.emptyState}>
          <Bell size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Accesso Richiesto
          </Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Effettua il login per vedere le notifiche
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[
        styles.header,
        isDesktop && styles.headerDesktop,
        { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }
      ]}>
        <View style={[styles.headerContent, isDesktop && styles.headerContentDesktop]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Notifiche</Text>
          <TouchableOpacity onPress={markAllAsRead}>
            <CheckCircle size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={[
        styles.tabBar,
        isDesktop && styles.tabBarDesktop,
        { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }
      ]}>
        <View style={[styles.tabContainer, isDesktop && styles.tabContainerDesktop]}>
          {[
            { key: 'all', label: 'Tutte', count: notifications.length },
            { key: 'unread', label: 'Non lette', count: notifications.filter(n => !n.read).length },
            { key: 'settings', label: 'Impostazioni', count: 0 }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && { borderBottomColor: theme.primary }
              ]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === tab.key ? theme.primary : theme.textSecondary }
              ]}>
                {tab.label} {tab.count > 0 && `(${tab.count})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      {activeTab === 'settings' ? (
        <ScrollView style={styles.content}>
          {renderSettings()}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={isDesktop && styles.contentDesktop}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
        >
          {loading ? (
            <View style={styles.loadingState}>
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Caricamento notifiche...
              </Text>
            </View>
          ) : filteredNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {activeTab === 'unread' ? 'Tutto letto!' : 'Nessuna notifica'}
              </Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {activeTab === 'unread'
                  ? 'Non hai notifiche non lette.'
                  : 'Le tue notifiche appariranno qui quando riceverai nuovi aggiornamenti.'
                }
              </Text>
            </View>
          ) : (
            <View style={styles.notificationsList}>
              {filteredNotifications.map(renderNotification)}
            </View>
          )}
        </ScrollView>
      )}

      {/* Transfer Acceptance Modal */}
      <TransferAcceptanceModal
        visible={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setSelectedTransfer(null);
        }}
        transfer={selectedTransfer}
        onAccept={async () => {
          setShowTransferModal(false);
          setSelectedTransfer(null);
          // Ricarica le notifiche dopo l'accettazione
          await loadNotifications();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
  },
  headerDesktop: {
    paddingHorizontal: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContentDesktop: {
    maxWidth: 900,
    width: '100%',
    marginHorizontal: 'auto',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  tabBar: {
    borderBottomWidth: 1,
  },
  tabBarDesktop: {
    paddingHorizontal: 0,
  },
  tabContainer: {
    flexDirection: 'row',
  },
  tabContainerDesktop: {
    maxWidth: 900,
    width: '100%',
    marginHorizontal: 'auto',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentDesktop: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  notificationsList: {
    padding: 16,
  },
  notificationCard: {
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  notificationCardDesktop: {
    maxWidth: '100%',
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  pinContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  pinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pinLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  copyButton: {
    padding: 4,
  },
  pinValue: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 4,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  pinHint: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  carInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  carInfoText: {
    fontSize: 12,
  },
  notificationMeta: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  notificationTime: {
    fontSize: 12,
    marginBottom: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionHint: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  deleteButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsContainer: {
    padding: 16,
  },
  settingsContainerDesktop: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  settingsSection: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 64,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 64,
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
  loadingText: {
    fontSize: 16,
  },
});

export default NotificationsScreen;

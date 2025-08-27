
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
  RefreshControl
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
  Car
} from 'lucide-react-native';
import { useStore } from '../../store';
import { NotificationService } from '../../services/NotificationService';

interface Notification {
  id: string;
  type: 'reminder' | 'maintenance' | 'document' | 'expense';
  title: string;
  message: string;
  carId?: string;
  carInfo?: string;
  date: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionRequired?: boolean;
}

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { darkMode } = useStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState({
    pushNotifications: true,
    maintenanceReminders: true,
    documentExpiry: true,
    expenseAlerts: true,
    weeklyReports: false,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'settings'>('all');

  const theme = {
    background: darkMode ? '#121212' : '#f5f5f5',
    cardBackground: darkMode ? '#1e1e1e' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#a0a0a0' : '#666666',
    primary: '#007AFF',
    border: darkMode ? '#333333' : '#e0e0e0',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30'
  };

  useEffect(() => {
    loadNotifications();
    loadSettings();
  }, []);

  const loadNotifications = () => {
    // Mock notifications - in realtà queste verranno da Firebase
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'reminder',
        title: 'Revisione in Scadenza',
        message: 'La revisione della tua Fiat 500 scade tra 15 giorni',
        carId: 'car1',
        carInfo: 'Fiat 500',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false,
        priority: 'high',
        actionRequired: true
      },
      {
        id: '2',
        type: 'maintenance',
        title: 'Manutenzione Programmata',
        message: 'È ora di fare il tagliando alla BMW X3',
        carId: 'car2',
        carInfo: 'BMW X3',
        date: new Date(Date.now() - 4 * 60 * 60 * 1000),
        read: false,
        priority: 'medium'
      },
      {
        id: '3',
        type: 'document',
        title: 'Assicurazione Rinnovata',
        message: 'L\'assicurazione è stata rinnovata con successo',
        carId: 'car1',
        carInfo: 'Fiat 500',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        read: true,
        priority: 'low'
      }
    ];

    setNotifications(mockNotifications);
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

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    );
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
      case 'reminder':
        return <Calendar size={20} color={color} />;
      case 'maintenance':
        return <Wrench size={20} color={color} />;
      case 'document':
        return <Shield size={20} color={color} />;
      case 'expense':
        return <DollarSign size={20} color={color} />;
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

  const renderNotification = (notification: Notification) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationCard,
        { 
          backgroundColor: theme.cardBackground,
          borderLeftColor: notification.priority === 'high' ? theme.error :
                          notification.priority === 'medium' ? theme.warning : theme.success
        },
        !notification.read && { backgroundColor: theme.primary + '10' }
      ]}
      onPress={() => {
        markAsRead(notification.id);
        if (notification.carId) {
          navigation.navigate('CarDetail', { carId: notification.carId });
        }
      }}
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
            {notification.carInfo && (
              <View style={styles.carInfo}>
                <Car size={12} color={theme.textSecondary} />
                <Text style={[styles.carInfoText, { color: theme.textSecondary }]}>
                  {notification.carInfo}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.notificationMeta}>
            <Text style={[styles.notificationTime, { color: theme.textSecondary }]}>
              {formatDate(notification.date)}
            </Text>
            {!notification.read && (
              <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
            )}
          </View>
        </View>

        {notification.actionRequired && (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={() => {
                // Naviga alla schermata appropriata
                if (notification.type === 'reminder') {
                  navigation.navigate('RemindersList');
                } else if (notification.type === 'maintenance') {
                  navigation.navigate('AddMaintenance', { carId: notification.carId });
                }
              }}
            >
              <Text style={styles.actionButtonText}>Vai</Text>
            </TouchableOpacity>
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
    <View style={styles.settingsContainer}>
      <View style={[styles.settingsSection, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Notifiche Push</Text>
        
        <View style={styles.settingItem}>
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

        <View style={styles.settingItem}>
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

        <View style={styles.settingItem}>
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

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>
              Alert Spese
            </Text>
            <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
              Notifiche per spese elevate
            </Text>
          </View>
          <Switch
            value={settings.expenseAlerts}
            onValueChange={(value) => updateSetting('expenseAlerts', value)}
            trackColor={{ false: theme.border, true: theme.primary + '50' }}
            thumbColor={settings.expenseAlerts ? theme.primary : theme.textSecondary}
          />
        </View>

        <View style={styles.settingItem}>
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Notifiche</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <CheckCircle size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
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

      {/* Content */}
      {activeTab === 'settings' ? (
        <ScrollView style={styles.content}>
          {renderSettings()}
        </ScrollView>
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
        >
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {activeTab === 'unread' ? 'Tutto letto!' : 'Nessuna notifica'}
              </Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {activeTab === 'unread' 
                  ? 'Non hai notifiche non lette.'
                  : 'Le tue notifiche appariranno qui.'
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
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
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
    marginBottom: 4,
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsContainer: {
    padding: 16,
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
    borderBottomColor: '#f0f0f0',
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
});

export default NotificationsScreen;

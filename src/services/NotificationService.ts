
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configurazione notifiche
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationSettings {
  pushNotifications: boolean;
  maintenanceReminders: boolean;
  documentExpiry: boolean;
  expenseAlerts: boolean;
  weeklyReports: boolean;
  bookingNotifications: boolean;
  quoteNotifications: boolean;
  messageNotifications: boolean;
}

export class NotificationService {
  private static SETTINGS_KEY = 'notification_settings';

  // Richiedi permessi per le notifiche
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return false;
      }

      // Configurazione per Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        await Notifications.setNotificationChannelAsync('maintenance', {
          name: 'Manutenzioni',
          importance: Notifications.AndroidImportance.HIGH,
          description: 'Promemoria per manutenzioni auto',
        });

        await Notifications.setNotificationChannelAsync('documents', {
          name: 'Documenti',
          importance: Notifications.AndroidImportance.HIGH,
          description: 'Scadenza documenti auto',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Ottieni token per notifiche push
  static async getPushToken(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  // Programma notifica locale
  static async scheduleLocalNotification(
    title: string,
    body: string,
    trigger: Date,
    data?: any
  ): Promise<string> {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger,
    });

    return id;
  }

  // Programma promemoria manutenzione
  static async scheduleMaintenanceReminder(
    carInfo: { make: string; model: string; licensePlate: string },
    maintenanceType: string,
    dueDate: Date,
    carId: string
  ) {
    const title = `Manutenzione ${maintenanceType}`;
    const body = `${carInfo.make} ${carInfo.model} (${carInfo.licensePlate}) necessita di ${maintenanceType}`;
    
    // Programma 3 notifiche: 7 giorni prima, 3 giorni prima, il giorno stesso
    const reminders = [
      { days: 7, title: `${title} - 7 giorni` },
      { days: 3, title: `${title} - 3 giorni` },
      { days: 0, title: `${title} - Oggi` }
    ];

    const notificationIds: string[] = [];

    for (const reminder of reminders) {
      const notificationDate = new Date(dueDate);
      notificationDate.setDate(notificationDate.getDate() - reminder.days);
      notificationDate.setHours(9, 0, 0, 0); // 9:00 AM

      if (notificationDate > new Date()) {
        const id = await this.scheduleLocalNotification(
          reminder.title,
          body,
          notificationDate,
          {
            type: 'maintenance',
            carId,
            maintenanceType,
            dueDate: dueDate.toISOString()
          }
        );
        notificationIds.push(id);
      }
    }

    return notificationIds;
  }

  // Programma promemoria scadenza documenti
  static async scheduleDocumentExpiryReminder(
    carInfo: { make: string; model: string; licensePlate: string },
    documentType: string,
    expiryDate: Date,
    carId: string
  ) {
    const title = `Scadenza ${documentType}`;
    const body = `${documentType} di ${carInfo.make} ${carInfo.model} (${carInfo.licensePlate}) scade presto`;
    
    // Promemoria: 30, 15, 7, 1 giorni prima
    const reminders = [30, 15, 7, 1];
    const notificationIds: string[] = [];

    for (const days of reminders) {
      const notificationDate = new Date(expiryDate);
      notificationDate.setDate(notificationDate.getDate() - days);
      notificationDate.setHours(10, 0, 0, 0); // 10:00 AM

      if (notificationDate > new Date()) {
        const id = await this.scheduleLocalNotification(
          title,
          `${body} (${days} giorni)`,
          notificationDate,
          {
            type: 'document',
            carId,
            documentType,
            expiryDate: expiryDate.toISOString()
          }
        );
        notificationIds.push(id);
      }
    }

    return notificationIds;
  }

  // Cancella notifiche programmate
  static async cancelScheduledNotifications(notificationIds: string[]) {
    try {
      await Notifications.cancelScheduledNotificationAsync(...notificationIds);
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  // Cancella tutte le notifiche programmate
  static async cancelAllScheduledNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  // Salva impostazioni notifiche
  static async updateNotificationSettings(settings: NotificationSettings) {
    try {
      await AsyncStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  // Carica impostazioni notifiche
  static async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem(this.SETTINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }

    // Impostazioni predefinite
    return {
      pushNotifications: true,
      maintenanceReminders: true,
      documentExpiry: true,
      expenseAlerts: true,
      weeklyReports: false,
      bookingNotifications: true,
      quoteNotifications: true,
      messageNotifications: true,
    };
  }

  // Invia notifica push tramite server
  static async sendPushNotification(
    expoPushToken: string,
    title: string,
    body: string,
    data?: any
  ) {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return null;
    }
  }

  // Programma report settimanale
  static async scheduleWeeklyReport() {
    const settings = await this.getNotificationSettings();
    if (!settings.weeklyReports) return;

    // Cancella eventuali report precedenti
    await Notifications.cancelScheduledNotificationAsync('weekly_report');

    // Programma per ogni domenica alle 18:00
    const nextSunday = new Date();
    const daysUntilSunday = (7 - nextSunday.getDay()) % 7;
    nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
    nextSunday.setHours(18, 0, 0, 0);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Report Settimanale MyMechanic',
        body: 'Ecco il riassunto delle tue attività automotive della settimana',
        data: { type: 'weekly_report' },
      },
      trigger: {
        weekday: 1, // Domenica
        hour: 18,
        minute: 0,
        repeats: true,
      },
      identifier: 'weekly_report',
    });
  }

  // Listener per notifiche ricevute
  static addNotificationReceivedListener(handler: (notification: any) => void) {
    return Notifications.addNotificationReceivedListener(handler);
  }

  // Listener per tap su notifica
  static addNotificationResponseReceivedListener(handler: (response: any) => void) {
    return Notifications.addNotificationResponseReceivedListener(handler);
  }

  // Ottieni badge count
  static async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  // Imposta badge count
  static async setBadgeCount(count: number) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  // =====================================================
  // NOTIFICHE SISTEMA PRENOTAZIONE MECCANICO
  // =====================================================

  // Notifica prenotazione confermata
  static async notifyBookingConfirmed(
    workshopName: string,
    date: Date,
    bookingId: string
  ) {
    const settings = await this.getNotificationSettings();
    if (!settings.bookingNotifications) return;

    const title = 'Prenotazione Confermata';
    const body = `La tua prenotazione presso ${workshopName} è stata confermata per il ${date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: 'booking_confirmed',
          bookingId,
        },
      },
      trigger: null, // Invia subito
    });

    // Programma promemoria 1 giorno prima
    const reminderDate = new Date(date);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(18, 0, 0, 0);

    if (reminderDate > new Date()) {
      await this.scheduleLocalNotification(
        'Promemoria Appuntamento',
        `Domani hai l'appuntamento presso ${workshopName}`,
        reminderDate,
        {
          type: 'booking_reminder',
          bookingId,
        }
      );
    }
  }

  // Notifica preventivo ricevuto
  static async notifyQuoteReceived(
    workshopName: string,
    totalCost: number,
    quoteId: string,
    bookingId: string
  ) {
    const settings = await this.getNotificationSettings();
    if (!settings.quoteNotifications) return;

    const title = 'Preventivo Ricevuto';
    const body = `${workshopName} ha inviato un preventivo di €${totalCost.toFixed(2)}. Visualizzalo e approvalo.`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: 'quote_received',
          quoteId,
          bookingId,
        },
      },
      trigger: null,
    });
  }

  // Notifica proposta data ricevuta
  static async notifyDateProposed(
    workshopName: string,
    proposedDate: Date,
    bookingId: string
  ) {
    const settings = await this.getNotificationSettings();
    if (!settings.bookingNotifications) return;

    const title = 'Nuova Proposta Data';
    const body = `${workshopName} ha proposto il ${proposedDate.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    })} per il tuo appuntamento`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: 'date_proposed',
          bookingId,
        },
      },
      trigger: null,
    });
  }

  // Notifica auto pronta
  static async notifyVehicleReady(
    carInfo: { make: string; model: string; licensePlate: string },
    workshopName: string,
    bookingId: string
  ) {
    const settings = await this.getNotificationSettings();
    if (!settings.bookingNotifications) return;

    const title = 'Auto Pronta! 🎉';
    const body = `La tua ${carInfo.make} ${carInfo.model} (${carInfo.licensePlate}) è pronta presso ${workshopName}. Puoi passare a ritirarla.`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: 'vehicle_ready',
          bookingId,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  }

  // Notifica nuovo messaggio
  static async notifyNewMessage(
    senderName: string,
    message: string,
    bookingId: string
  ) {
    const settings = await this.getNotificationSettings();
    if (!settings.messageNotifications) return;

    const title = `Messaggio da ${senderName}`;
    const body = message.length > 100 ? `${message.substring(0, 100)}...` : message;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: 'message_received',
          bookingId,
        },
      },
      trigger: null,
    });
  }

  // Notifica prenotazione cancellata
  static async notifyBookingCancelled(
    workshopName: string,
    reason: string,
    bookingId: string
  ) {
    const settings = await this.getNotificationSettings();
    if (!settings.bookingNotifications) return;

    const title = 'Prenotazione Cancellata';
    const body = reason
      ? `La tua prenotazione presso ${workshopName} è stata cancellata. Motivo: ${reason}`
      : `La tua prenotazione presso ${workshopName} è stata cancellata.`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: 'booking_cancelled',
          bookingId,
        },
      },
      trigger: null,
    });
  }

  // Notifica richiesta prenotazione per meccanico
  static async notifyNewBookingRequest(
    userName: string,
    vehicleInfo: string,
    serviceType: string,
    bookingId: string
  ) {
    const title = 'Nuova Richiesta Prenotazione';
    const body = `${userName} ha richiesto una prenotazione per ${vehicleInfo} - ${serviceType}`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: 'new_booking_request',
          bookingId,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  }

  // Configura canali Android per prenotazioni
  static async setupBookingChannels() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('bookings', {
        name: 'Prenotazioni',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'Notifiche per prenotazioni e appuntamenti',
        vibrationPattern: [0, 250, 250, 250],
      });

      await Notifications.setNotificationChannelAsync('quotes', {
        name: 'Preventivi',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'Notifiche per preventivi ricevuti',
      });

      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messaggi',
        importance: Notifications.AndroidImportance.MAX,
        description: 'Messaggi da officine e meccanici',
        vibrationPattern: [0, 250, 250, 250],
      });
    }
  }
}

export default NotificationService;

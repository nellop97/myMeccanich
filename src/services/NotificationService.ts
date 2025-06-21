// src/services/NotificationService.ts
import * as Notifications from 'expo-notifications';

export class NotificationService {
  static async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  static async scheduleMaintenanceReminder(
    title: string,
    body: string,
    date: Date
  ) {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { date },
    });
  }
}
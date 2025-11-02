// src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('Notification permissions not granted');
            return false;
        }

        // Android requires notification channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('reminders', {
                name: 'Promemoria',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF3B30',
                sound: 'default',
            });
        }

        return true;
    } catch (error) {
        console.error('Error requesting notification permissions:', error);
        return false;
    }
};

/**
 * Schedule a notification for a reminder
 */
export const scheduleReminderNotification = async (
    reminderId: string,
    title: string,
    body: string,
    dueDate: Date
): Promise<string | null> => {
    try {
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
            return null;
        }

        // Schedule notification 1 day before
        const notificationDate = new Date(dueDate);
        notificationDate.setDate(notificationDate.getDate() - 1);
        notificationDate.setHours(9, 0, 0, 0); // 9:00 AM

        // Don't schedule if date is in the past
        if (notificationDate < new Date()) {
            return null;
        }

        const trigger: Notifications.NotificationTriggerInput = {
            date: notificationDate,
        };

        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: '⏰ Promemoria: ' + title,
                body: body,
                data: { reminderId, type: 'reminder' },
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.HIGH,
                ...(Platform.OS === 'android' && {
                    channelId: 'reminders',
                }),
            },
            trigger,
        });

        console.log('✅ Notification scheduled:', notificationId, 'for', notificationDate);
        return notificationId;
    } catch (error) {
        console.error('Error scheduling notification:', error);
        return null;
    }
};

/**
 * Cancel a scheduled notification
 */
export const cancelNotification = async (notificationId: string): Promise<void> => {
    try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        console.log('✅ Notification canceled:', notificationId);
    } catch (error) {
        console.error('Error canceling notification:', error);
    }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log('✅ All notifications canceled');
    } catch (error) {
        console.error('Error canceling all notifications:', error);
    }
};

/**
 * Get all scheduled notifications
 */
export const getAllScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
    try {
        const notifications = await Notifications.getAllScheduledNotificationsAsync();
        return notifications;
    } catch (error) {
        console.error('Error getting scheduled notifications:', error);
        return [];
    }
};

// ============================================
// CALENDAR
// ============================================

/**
 * Request calendar permissions
 */
export const requestCalendarPermissions = async (): Promise<boolean> => {
    try {
        const { status: existingStatus } = await Calendar.getCalendarPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Calendar.requestCalendarPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('Calendar permissions not granted');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error requesting calendar permissions:', error);
        return false;
    }
};

/**
 * Get or create MyMeccanich calendar
 */
const getOrCreateCalendar = async (): Promise<string | null> => {
    try {
        const hasPermission = await requestCalendarPermissions();
        if (!hasPermission) {
            return null;
        }

        // Get all calendars
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

        // Find MyMeccanich calendar
        let myCalendar = calendars.find(cal => cal.title === 'MyMeccanich');

        if (myCalendar) {
            return myCalendar.id;
        }

        // Create new calendar if it doesn't exist
        if (Platform.OS === 'ios') {
            // iOS requires a source
            const defaultCalendarSource = calendars.find(
                cal => cal.source.type === Calendar.SourceType.CALDAV ||
                       cal.source.type === Calendar.SourceType.LOCAL
            )?.source;

            if (!defaultCalendarSource) {
                console.error('No calendar source available');
                return null;
            }

            const newCalendarId = await Calendar.createCalendarAsync({
                title: 'MyMeccanich',
                color: '#3b82f6',
                entityType: Calendar.EntityTypes.EVENT,
                sourceId: defaultCalendarSource.id,
                source: defaultCalendarSource,
                name: 'MyMeccanich',
                ownerAccount: 'personal',
                accessLevel: Calendar.CalendarAccessLevel.OWNER,
            });

            return newCalendarId;
        } else {
            // Android
            const newCalendarId = await Calendar.createCalendarAsync({
                title: 'MyMeccanich',
                color: '#3b82f6',
                entityType: Calendar.EntityTypes.EVENT,
                name: 'MyMeccanich',
                ownerAccount: 'personal',
                accessLevel: Calendar.CalendarAccessLevel.OWNER,
            });

            return newCalendarId;
        }
    } catch (error) {
        console.error('Error getting/creating calendar:', error);
        return null;
    }
};

/**
 * Add reminder to calendar
 */
export const addReminderToCalendar = async (
    title: string,
    notes: string,
    dueDate: Date,
    location?: string
): Promise<string | null> => {
    try {
        const calendarId = await getOrCreateCalendar();
        if (!calendarId) {
            return null;
        }

        // Create all-day event on the due date
        const startDate = new Date(dueDate);
        startDate.setHours(9, 0, 0, 0);

        const endDate = new Date(dueDate);
        endDate.setHours(10, 0, 0, 0);

        const eventId = await Calendar.createEventAsync(calendarId, {
            title: '🚗 ' + title,
            notes: notes,
            startDate,
            endDate,
            timeZone: 'Europe/Rome',
            location: location || '',
            alarms: [
                { relativeOffset: -24 * 60 }, // 1 day before
                { relativeOffset: -60 },      // 1 hour before
            ],
        });

        console.log('✅ Event added to calendar:', eventId);
        return eventId;
    } catch (error) {
        console.error('Error adding event to calendar:', error);
        return null;
    }
};

/**
 * Delete event from calendar
 */
export const deleteCalendarEvent = async (eventId: string): Promise<boolean> => {
    try {
        await Calendar.deleteEventAsync(eventId);
        console.log('✅ Event deleted from calendar:', eventId);
        return true;
    } catch (error) {
        console.error('Error deleting calendar event:', error);
        return false;
    }
};

/**
 * Update calendar event
 */
export const updateCalendarEvent = async (
    eventId: string,
    title: string,
    notes: string,
    dueDate: Date,
    location?: string
): Promise<boolean> => {
    try {
        const startDate = new Date(dueDate);
        startDate.setHours(9, 0, 0, 0);

        const endDate = new Date(dueDate);
        endDate.setHours(10, 0, 0, 0);

        await Calendar.updateEventAsync(eventId, {
            title: '🚗 ' + title,
            notes: notes,
            startDate,
            endDate,
            timeZone: 'Europe/Rome',
            location: location || '',
            alarms: [
                { relativeOffset: -24 * 60 }, // 1 day before
                { relativeOffset: -60 },      // 1 hour before
            ],
        });

        console.log('✅ Event updated in calendar:', eventId);
        return true;
    } catch (error) {
        console.error('Error updating calendar event:', error);
        return false;
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if notifications are enabled
 */
export const areNotificationsEnabled = async (): Promise<boolean> => {
    try {
        const { status } = await Notifications.getPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        return false;
    }
};

/**
 * Check if calendar access is granted
 */
export const isCalendarEnabled = async (): Promise<boolean> => {
    try {
        const { status } = await Calendar.getCalendarPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        return false;
    }
};

export default {
    // Notifications
    requestNotificationPermissions,
    scheduleReminderNotification,
    cancelNotification,
    cancelAllNotifications,
    getAllScheduledNotifications,
    areNotificationsEnabled,

    // Calendar
    requestCalendarPermissions,
    addReminderToCalendar,
    deleteCalendarEvent,
    updateCalendarEvent,
    isCalendarEnabled,
};

// src/utils/analytics.ts
// Utility per tracciare eventi analytics nell'app

// Nota: Questo è un wrapper che può essere facilmente integrato con
// Firebase Analytics, Google Analytics, Mixpanel, Amplitude, ecc.

interface AnalyticsEvent {
    event: string;
    params?: Record<string, any>;
    timestamp: number;
}

class AnalyticsService {
    private static instance: AnalyticsService;
    private events: AnalyticsEvent[] = [];
    private isEnabled: boolean = true;

    private constructor() {
        console.log('📊 Analytics Service inizializzato');
    }

    static getInstance(): AnalyticsService {
        if (!AnalyticsService.instance) {
            AnalyticsService.instance = new AnalyticsService();
        }
        return AnalyticsService.instance;
    }

    // Metodo privato per loggare eventi
    private logEvent(event: string, params?: Record<string, any>) {
        if (!this.isEnabled) return;

        const analyticsEvent: AnalyticsEvent = {
            event,
            params: params || {},
            timestamp: Date.now(),
        };

        this.events.push(analyticsEvent);
        console.log('📊 Analytics Event:', event, params);

        // Qui puoi integrare con servizi analytics reali:
        // - Firebase Analytics
        // - Google Analytics
        // - Mixpanel
        // - Amplitude
        // etc.

        /*
        // Esempio con Firebase Analytics:
        if (analytics) {
          logEvent(analytics, event, params);
        }
        */
    }

    // Abilita/disabilita tracking
    setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
        console.log(`📊 Analytics ${enabled ? 'abilitati' : 'disabilitati'}`);
    }

    // Ottieni tutti gli eventi (per debug)
    getEvents(): AnalyticsEvent[] {
        return this.events;
    }

    // Pulisci eventi (per debug)
    clearEvents() {
        this.events = [];
    }

    // ==========================================
    // EVENTI AUTENTICAZIONE
    // ==========================================

    logRegistration(userType: 'user' | 'mechanic') {
        this.logEvent('sign_up', {
            method: 'email',
            user_type: userType,
        });
    }

    logLogin(method: 'email' | 'google' | 'apple') {
        this.logEvent('login', {
            method,
        });
    }

    logLogout() {
        this.logEvent('logout');
    }

    // ==========================================
    // EVENTI NAVIGAZIONE
    // ==========================================

    logScreenView(screenName: string, screenClass?: string) {
        this.logEvent('screen_view', {
            screen_name: screenName,
            screen_class: screenClass || screenName,
        });
    }

    // ==========================================
    // EVENTI VEICOLI
    // ==========================================

    logVehicleAdded(vehicleData: {
        make: string;
        model: string;
        year: number;
        fuelType?: string;
    }) {
        this.logEvent('vehicle_added', {
            make: vehicleData.make,
            model: vehicleData.model,
            year: vehicleData.year,
            fuel_type: vehicleData.fuelType,
        });
    }

    logVehicleDeleted(vehicleId: string) {
        this.logEvent('vehicle_deleted', {
            vehicle_id: vehicleId,
        });
    }

    logVehicleViewed(vehicleId: string) {
        this.logEvent('vehicle_viewed', {
            vehicle_id: vehicleId,
        });
    }

    // ==========================================
    // EVENTI MANUTENZIONI
    // ==========================================

    logMaintenanceAdded(maintenanceData: {
        vehicleId: string;
        type: string;
        cost?: number;
    }) {
        this.logEvent('maintenance_added', {
            vehicle_id: maintenanceData.vehicleId,
            maintenance_type: maintenanceData.type,
            cost: maintenanceData.cost,
        });
    }

    logMaintenanceViewed(maintenanceId: string) {
        this.logEvent('maintenance_viewed', {
            maintenance_id: maintenanceId,
        });
    }

    // ==========================================
    // EVENTI PROMEMORIA
    // ==========================================

    logReminderAdded(reminderData: {
        vehicleId: string;
        type: string;
        dueDate: Date;
    }) {
        this.logEvent('reminder_added', {
            vehicle_id: reminderData.vehicleId,
            reminder_type: reminderData.type,
            days_until_due: Math.ceil((reminderData.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        });
    }

    logReminderCompleted(reminderId: string) {
        this.logEvent('reminder_completed', {
            reminder_id: reminderId,
        });
    }

    logReminderDismissed(reminderId: string) {
        this.logEvent('reminder_dismissed', {
            reminder_id: reminderId,
        });
    }

    // ==========================================
    // EVENTI SPESE
    // ==========================================

    logExpenseAdded(expenseData: {
        vehicleId: string;
        category: string;
        amount: number;
    }) {
        this.logEvent('expense_added', {
            vehicle_id: expenseData.vehicleId,
            category: expenseData.category,
            amount: expenseData.amount,
        });
    }

    // ==========================================
    // EVENTI CARBURANTE
    // ==========================================

    logFuelAdded(fuelData: {
        vehicleId: string;
        liters: number;
        cost: number;
        fuelType: string;
    }) {
        this.logEvent('fuel_added', {
            vehicle_id: fuelData.vehicleId,
            liters: fuelData.liters,
            cost: fuelData.cost,
            fuel_type: fuelData.fuelType,
            cost_per_liter: fuelData.cost / fuelData.liters,
        });
    }

    // ==========================================
    // EVENTI DOCUMENTI
    // ==========================================

    logDocumentAdded(documentData: {
        vehicleId: string;
        type: string;
    }) {
        this.logEvent('document_added', {
            vehicle_id: documentData.vehicleId,
            document_type: documentData.type,
        });
    }

    logDocumentViewed(documentId: string, documentType: string) {
        this.logEvent('document_viewed', {
            document_id: documentId,
            document_type: documentType,
        });
    }

    // ==========================================
    // EVENTI MECCANICO
    // ==========================================

    logAppointmentCreated(appointmentData: {
        vehicleId?: string;
        customerId?: string;
        date: Date;
    }) {
        this.logEvent('appointment_created', {
            vehicle_id: appointmentData.vehicleId,
            customer_id: appointmentData.customerId,
            appointment_date: appointmentData.date.toISOString(),
        });
    }

    logInvoiceCreated(invoiceData: {
        customerId: string;
        amount: number;
        type: string;
    }) {
        this.logEvent('invoice_created', {
            customer_id: invoiceData.customerId,
            amount: invoiceData.amount,
            invoice_type: invoiceData.type,
        });
    }

    logCustomerAdded() {
        this.logEvent('customer_added');
    }

    // ==========================================
    // EVENTI ERRORI
    // ==========================================

    logError(error: {
        message: string;
        screen?: string;
        fatal?: boolean;
    }) {
        this.logEvent('app_error', {
            error_message: error.message,
            screen: error.screen,
            fatal: error.fatal || false,
        });
    }

    // ==========================================
    // EVENTI ENGAGEMENT
    // ==========================================

    logSearch(searchTerm: string, category?: string) {
        this.logEvent('search', {
            search_term: searchTerm,
            category,
        });
    }

    logShare(contentType: string, itemId: string) {
        this.logEvent('share', {
            content_type: contentType,
            item_id: itemId,
        });
    }

    logTutorialBegin() {
        this.logEvent('tutorial_begin');
    }

    logTutorialComplete() {
        this.logEvent('tutorial_complete');
    }
}

// Esporta istanza singleton
const analytics = AnalyticsService.getInstance();

// Esporta funzioni helper per uso semplificato
export const logRegistration = (userType: 'user' | 'mechanic') =>
    analytics.logRegistration(userType);

export const logLogin = (method: 'email' | 'google' | 'apple') =>
    analytics.logLogin(method);

export const logLogout = () =>
    analytics.logLogout();

export const logScreenView = (screenName: string, screenClass?: string) =>
    analytics.logScreenView(screenName, screenClass);

export const logVehicleAdded = (vehicleData: any) =>
    analytics.logVehicleAdded(vehicleData);

export const logMaintenanceAdded = (maintenanceData: any) =>
    analytics.logMaintenanceAdded(maintenanceData);

export const logReminderAdded = (reminderData: any) =>
    analytics.logReminderAdded(reminderData);

export const logExpenseAdded = (expenseData: any) =>
    analytics.logExpenseAdded(expenseData);

export const logFuelAdded = (fuelData: any) =>
    analytics.logFuelAdded(fuelData);

export const logDocumentAdded = (documentData: any) =>
    analytics.logDocumentAdded(documentData);

export const logError = (error: any) =>
    analytics.logError(error);

export default analytics;
// src/hooks/useMechanicStats.ts - Hook per statistiche meccanico da Firebase
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useFirebaseInvoices } from './useFirebaseInvoices';

export interface MechanicStats {
  carsInWorkshop: number;
  appointmentsToday: number;
  appointmentsWeek: number;
  pendingInvoices: number;
  overdueInvoices: number;
  monthlyRevenue: number;
  monthlyGrowth: number;
  completedJobs: number;
  activeCustomers: number;
  averageJobTime: number;
  customerSatisfaction: number;
}

export interface RecentActivity {
  id: string;
  type: 'car_added' | 'appointment' | 'invoice' | 'review' | 'repair_completed' | 'payment_received';
  title: string;
  description: string;
  time: string;
  relatedId?: string;
  icon: string;
  color: string;
}

export const useMechanicStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<MechanicStats>({
    carsInWorkshop: 0,
    appointmentsToday: 0,
    appointmentsWeek: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    monthlyRevenue: 0,
    monthlyGrowth: 0,
    completedJobs: 0,
    activeCustomers: 0,
    averageJobTime: 0,
    customerSatisfaction: 0,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carica dati fatturazione da Firebase
  const { stats: invoiceStats, loading: invoicesLoading } = useFirebaseInvoices();

  // Utility per formattare il tempo
  const formatTimeAgo = useCallback((date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'ora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minuti fa`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ore fa`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} giorni fa`;
    return date.toLocaleDateString('it-IT');
  }, []);

  // Carica auto in officina
  const loadCarsInWorkshop = useCallback(async (mechanicId: string): Promise<number> => {
    try {
      const carsQuery = query(
        collection(db, 'workshop_cars'),
        where('mechanicId', '==', mechanicId),
        where('status', 'in', ['in_progress', 'waiting_parts', 'ready_for_pickup'])
      );

      const carsSnapshot = await getDocs(carsQuery);
      return carsSnapshot.size;
    } catch (error) {
      console.error('Errore nel caricamento auto in officina:', error);
      return 0;
    }
  }, []);

  // Carica appuntamenti di oggi
  const loadTodayAppointments = useCallback(async (mechanicId: string): Promise<number> => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('mechanicId', '==', mechanicId),
        where('date', '>=', Timestamp.fromDate(today)),
        where('date', '<', Timestamp.fromDate(tomorrow)),
        where('status', '!=', 'cancelled')
      );

      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      return appointmentsSnapshot.size;
    } catch (error) {
      console.error('Errore nel caricamento appuntamenti di oggi:', error);
      return 0;
    }
  }, []);

  // Carica appuntamenti della settimana
  const loadWeekAppointments = useCallback(async (mechanicId: string): Promise<number> => {
    try {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('mechanicId', '==', mechanicId),
        where('date', '>=', Timestamp.fromDate(weekStart)),
        where('date', '<', Timestamp.fromDate(weekEnd)),
        where('status', '!=', 'cancelled')
      );

      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      return appointmentsSnapshot.size;
    } catch (error) {
      console.error('Errore nel caricamento appuntamenti della settimana:', error);
      return 0;
    }
  }, []);

  // Carica fatture in sospeso
  const loadPendingInvoices = useCallback(async (mechanicId: string): Promise<{ pending: number, overdue: number }> => {
    try {
      const invoicesQuery = query(
        collection(db, 'invoices'),
        where('mechanicId', '==', mechanicId),
        where('status', '==', 'pending')
      );

      const invoicesSnapshot = await getDocs(invoicesQuery);
      const invoices = invoicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const today = new Date();
      let overdueCount = 0;

      invoices.forEach(invoice => {
        const dueDate = invoice.dueDate?.toDate();
        if (dueDate && dueDate < today) {
          overdueCount++;
        }
      });

      return {
        pending: invoices.length,
        overdue: overdueCount
      };
    } catch (error) {
      console.error('Errore nel caricamento fatture:', error);
      return { pending: 0, overdue: 0 };
    }
  }, []);

  // Carica fatturato mensile
  const loadMonthlyRevenue = useCallback(async (mechanicId: string): Promise<{ revenue: number, growth: number }> => {
    try {
      const today = new Date();

      // Mese corrente
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Mese precedente
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

      // Query per il mese corrente
      const currentMonthQuery = query(
        collection(db, 'invoices'),
        where('mechanicId', '==', mechanicId),
        where('status', '==', 'paid'),
        where('paidDate', '>=', Timestamp.fromDate(currentMonthStart)),
        where('paidDate', '<=', Timestamp.fromDate(currentMonthEnd))
      );

      // Query per il mese precedente
      const lastMonthQuery = query(
        collection(db, 'invoices'),
        where('mechanicId', '==', mechanicId),
        where('status', '==', 'paid'),
        where('paidDate', '>=', Timestamp.fromDate(lastMonthStart)),
        where('paidDate', '<=', Timestamp.fromDate(lastMonthEnd))
      );

      const [currentMonthSnapshot, lastMonthSnapshot] = await Promise.all([
        getDocs(currentMonthQuery),
        getDocs(lastMonthQuery)
      ]);

      const currentRevenue = currentMonthSnapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().total || 0);
      }, 0);

      const lastRevenue = lastMonthSnapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().total || 0);
      }, 0);

      const growth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

      return {
        revenue: currentRevenue,
        growth: growth
      };
    } catch (error) {
      console.error('Errore nel caricamento fatturato mensile:', error);
      return { revenue: 0, growth: 0 };
    }
  }, []);

  // Carica altre statistiche
  const loadOtherStats = useCallback(async (mechanicId: string) => {
    try {
      // Lavori completati (ultimi 30 giorni)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const completedJobsQuery = query(
        collection(db, 'workshop_cars'),
        where('mechanicId', '==', mechanicId),
        where('status', '==', 'completed'),
        where('completedDate', '>=', Timestamp.fromDate(thirtyDaysAgo))
      );

      const completedJobsSnapshot = await getDocs(completedJobsQuery);

      // Clienti attivi (ultimi 3 mesi)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const activeCustomersQuery = query(
        collection(db, 'appointments'),
        where('mechanicId', '==', mechanicId),
        where('date', '>=', Timestamp.fromDate(threeMonthsAgo)),
        where('status', '==', 'completed')
      );

      const activeCustomersSnapshot = await getDocs(activeCustomersQuery);
      const uniqueCustomers = new Set(activeCustomersSnapshot.docs.map(doc => doc.data().customerId));

      // Media recensioni
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('mechanicId', '==', mechanicId)
      );

      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviews = reviewsSnapshot.docs.map(doc => doc.data());
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length 
        : 0;

      return {
        completedJobs: completedJobsSnapshot.size,
        activeCustomers: uniqueCustomers.size,
        customerSatisfaction: Math.round(averageRating * 10) / 10,
        averageJobTime: 2.5 // Placeholder - difficile da calcolare senza dati specifici
      };
    } catch (error) {
      console.error('Errore nel caricamento altre statistiche:', error);
      return {
        completedJobs: 0,
        activeCustomers: 0,
        customerSatisfaction: 0,
        averageJobTime: 0
      };
    }
  }, []);

  // Carica attività recenti
  const loadRecentActivity = useCallback(async (mechanicId: string): Promise<RecentActivity[]> => {
    try {
      const activities: RecentActivity[] = [];

      // Auto aggiunte recentemente
      const recentCarsQuery = query(
        collection(db, 'workshop_cars'),
        where('mechanicId', '==', mechanicId),
        orderBy('createdAt', 'desc'),
        limit(3)
      );

      const recentCarsSnapshot = await getDocs(recentCarsQuery);
      recentCarsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: `car_${doc.id}`,
          type: 'car_added',
          title: 'Nuova auto aggiunta',
          description: `${data.brand} ${data.model} - ${data.licensePlate}`,
          time: formatTimeAgo(data.createdAt?.toDate() || new Date()),
          relatedId: doc.id,
          icon: 'car-plus',
          color: '#10b981'
        });
      });

      // Appuntamenti recenti
      const recentAppointmentsQuery = query(
        collection(db, 'appointments'),
        where('mechanicId', '==', mechanicId),
        where('status', '==', 'confirmed'),
        orderBy('createdAt', 'desc'),
        limit(3)
      );

      const recentAppointmentsSnapshot = await getDocs(recentAppointmentsQuery);
      recentAppointmentsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: `appointment_${doc.id}`,
          type: 'appointment',
          title: 'Appuntamento confermato',
          description: data.description || 'Intervento programmato',
          time: formatTimeAgo(data.createdAt?.toDate() || new Date()),
          relatedId: doc.id,
          icon: 'calendar-check',
          color: '#3b82f6'
        });
      });

      // Fatture recenti
      const recentInvoicesQuery = query(
        collection(db, 'invoices'),
        where('mechanicId', '==', mechanicId),
        orderBy('createdAt', 'desc'),
        limit(2)
      );

      const recentInvoicesSnapshot = await getDocs(recentInvoicesQuery);
      recentInvoicesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: `invoice_${doc.id}`,
          type: 'invoice',
          title: 'Fattura emessa',
          description: `Fattura #${data.number} - €${data.total?.toFixed(2)}`,
          time: formatTimeAgo(data.createdAt?.toDate() || new Date()),
          relatedId: doc.id,
          icon: 'receipt',
          color: '#f59e0b'
        });
      });

      // Ordina per data e prendi solo le prime 4
      return activities
        .sort((a, b) => {
          // Ordine personalizzato basato sul tempo
          const timeOrder = ['ora', 'minuti fa', 'ore fa', 'giorni fa'];
          const aOrder = timeOrder.findIndex(t => a.time.includes(t));
          const bOrder = timeOrder.findIndex(t => b.time.includes(t));
          return aOrder - bOrder;
        })
        .slice(0, 4);

    } catch (error) {
      console.error('Errore nel caricamento attività recenti:', error);
      return [];
    }
  }, [formatTimeAgo]);

  // Funzione principale per caricare tutte le statistiche
  const loadAllStats = useCallback(async () => {
    if (!user?.uid) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Caricamento statistiche per meccanico:', user.uid);

      const [
        carsInWorkshop,
        appointmentsToday,
        appointmentsWeek,
        invoicesData,
        revenueData,
        otherStats,
        activities
      ] = await Promise.all([
        loadCarsInWorkshop(user.uid),
        loadTodayAppointments(user.uid),
        loadWeekAppointments(user.uid),
        loadPendingInvoices(user.uid),
        loadMonthlyRevenue(user.uid),
        loadOtherStats(user.uid),
        loadRecentActivity(user.uid)
      ]);

      const newStats: MechanicStats = {
        carsInWorkshop,
        appointmentsToday,
        appointmentsWeek,
        pendingInvoices: invoicesData.pending,
        overdueInvoices: invoicesData.overdue,
        monthlyRevenue: revenueData.revenue,
        monthlyGrowth: revenueData.growth,
        completedJobs: otherStats.completedJobs,
        activeCustomers: otherStats.activeCustomers,
        averageJobTime: otherStats.averageJobTime,
        customerSatisfaction: otherStats.customerSatisfaction,
      };

      setStats(newStats);
      setRecentActivity(activities);

      console.log('✅ Statistiche caricate:', newStats);

    } catch (error) {
      console.error('❌ Errore nel caricamento statistiche:', error);
      setError('Errore nel caricamento delle statistiche');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, loadCarsInWorkshop, loadTodayAppointments, loadWeekAppointments, loadPendingInvoices, loadMonthlyRevenue, loadOtherStats, loadRecentActivity]);

  // Effetto per caricare i dati quando l'utente cambia
  useEffect(() => {
    if (user?.uid && user.userType === 'mechanic') {
      loadAllStats();
    }
  }, [user?.uid, user?.userType, loadAllStats]);

  // Funzione per refresh manuale
  const refreshStats = useCallback(() => {
    loadAllStats();
  }, [loadAllStats]);

  return {
    stats,
    loading: isLoading || invoicesLoading,
    error,
    refreshStats,
  };
};
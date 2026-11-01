
// src/hooks/useMechanicStats.ts - Hook per statistiche meccanico da Firebase
import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from './useAuth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { toDayString } from '../utils/calendarGrid';
import { calculateInvoiceStats } from '../utils/invoiceStats';

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
  const hasLoaded = useRef(false);

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

  // Auto, appuntamenti e lavori si ricavano dagli interventi, che sono la fonte dell'agenda
  const loadWorkshopOverview = useCallback(async (mechanicId: string) => {
    try {
      const snapshot = await getDocs(query(
        collection(db, 'workshopCars'),
        where('workshopId', '==', mechanicId),
        where('isActive', '==', true)
      ));

      const todayKey = toDayString(new Date());
      const week = new Date();
      week.setDate(week.getDate() + 7);
      const weekKey = toDayString(week);
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      let carsInWorkshop = 0;
      let appointmentsToday = 0;
      let appointmentsWeek = 0;
      let completedJobs = 0;
      let hoursTotal = 0;
      let hoursCount = 0;
      const customers = new Set<string>();

      snapshot.docs.forEach((carDoc) => {
        const car = carDoc.data();
        const repairs: any[] = car.repairs ?? [];
        const open = repairs.filter((repair) => ['pending', 'in_progress', 'in-progress', 'ready'].includes(repair.status));

        if (open.length > 0) carsInWorkshop++;

        open.forEach((repair) => {
          if (repair.status === 'ready') return;
          if (repair.scheduledDate === todayKey) appointmentsToday++;
          if (repair.scheduledDate >= todayKey && repair.scheduledDate < weekKey) appointmentsWeek++;
        });

        repairs.forEach((repair) => {
          const finishedAt = new Date(repair.completedAt || repair.updatedAt || 0);
          const finished = repair.status === 'completed' || repair.status === 'ready';

          if (finished && finishedAt >= monthAgo) {
            completedJobs++;
            if (repair.estimatedHours > 0) {
              hoursTotal += repair.estimatedHours;
              hoursCount++;
            }
          }
          if (car.ownerId && new Date(repair.updatedAt || 0) >= threeMonthsAgo) {
            customers.add(car.ownerId);
          }
        });
      });

      return {
        carsInWorkshop,
        appointmentsToday,
        appointmentsWeek,
        completedJobs,
        activeCustomers: customers.size,
        averageJobTime: hoursCount > 0 ? Math.round((hoursTotal / hoursCount) * 10) / 10 : 0,
      };
    } catch (error) {
      console.error('Errore nel caricamento panoramica officina:', error);
      return {
        carsInWorkshop: 0,
        appointmentsToday: 0,
        appointmentsWeek: 0,
        completedJobs: 0,
        activeCustomers: 0,
        averageJobTime: 0,
      };
    }
  }, []);

  // Fatture in sospeso e fatturato: una sola lettura, gli importi si calcolano sul dispositivo
  const loadInvoiceStats = useCallback(async (mechanicId: string) => {
    try {
      const snapshot = await getDocs(query(
        collection(db, 'invoices'),
        where('workshopId', '==', mechanicId),
        limit(1000)
      ));

      return calculateInvoiceStats(snapshot.docs.map((invoiceDoc) => invoiceDoc.data() as any), new Date());
    } catch (error) {
      console.error('Errore nel caricamento fatture:', error);
      return { pending: 0, overdue: 0, revenue: 0, growth: 0 };
    }
  }, []);

  // Media recensioni
  const loadRating = useCallback(async (mechanicId: string) => {
    try {
      const reviewsSnapshot = await getDocs(query(collection(db, 'reviews'), where('mechanicId', '==', mechanicId)));
      const reviews = reviewsSnapshot.docs.map((reviewDoc) => reviewDoc.data());
      const average = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
        : 0;
      return Math.round(average * 10) / 10;
    } catch (error) {
      console.error('Errore nel caricamento recensioni:', error);
      return 0;
    }
  }, []);

  // Carica attività recenti
  const loadRecentActivity = useCallback(async (mechanicId: string): Promise<RecentActivity[]> => {
    try {
      const activities: RecentActivity[] = [];
      
      // Auto aggiunte recentemente
      const recentCarsQuery = query(
        collection(db, 'workshopCars'),
        where('workshopId', '==', mechanicId),
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
          description: `${data.make} ${data.model} - ${data.licensePlate}`,
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
          description: `Fattura ${data.number} - €${(data.totalAmount ?? 0).toFixed(2)}`,
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

    // Al ritorno sulla Home i numeri si aggiornano senza coprire la pagina
    setIsLoading(!hasLoaded.current);
    setError(null);

    try {
      console.log('🔄 Caricamento statistiche per meccanico:', user.uid);

      const [overview, invoices, customerSatisfaction, activities] = await Promise.all([
        loadWorkshopOverview(user.uid),
        loadInvoiceStats(user.uid),
        loadRating(user.uid),
        loadRecentActivity(user.uid)
      ]);

      const newStats: MechanicStats = {
        ...overview,
        pendingInvoices: invoices.pending,
        overdueInvoices: invoices.overdue,
        monthlyRevenue: invoices.revenue,
        monthlyGrowth: invoices.growth,
        customerSatisfaction,
      };

      hasLoaded.current = true;
      setStats(newStats);
      setRecentActivity(activities);

      console.log('✅ Statistiche caricate:', newStats);

    } catch (error) {
      console.error('❌ Errore nel caricamento statistiche:', error);
      setError('Errore nel caricamento delle statistiche');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, loadWorkshopOverview, loadInvoiceStats, loadRating, loadRecentActivity]);

  // Ogni ritorno sulla Home mostra i numeri aggiornati
  useFocusEffect(
    useCallback(() => {
      if (user?.uid && user.userType === 'mechanic') {
        loadAllStats();
      }
    }, [user?.uid, user?.userType, loadAllStats])
  );

  // Funzione per refresh manuale
  const refreshStats = useCallback(() => {
    loadAllStats();
  }, [loadAllStats]);

  return {
    stats,
    recentActivity,
    isLoading,
    error,
    refreshStats,
  };
};

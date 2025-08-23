// src/hooks/useMechanicData.ts - Hook per gestire i dati del meccanico
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface MechanicData {
  loginProvider: string;
  firstName: string;
  lastName: string;
  uid: string;
  userType: 'mechanic';
  createdAt: {
    type: string;
    seconds: number;
    nanoseconds: number;
  };
  address: string;
  rating: number;
  profileComplete: boolean;
  vatNumber: string;
  updatedAt: {
    type: string;
    seconds: number;
    nanoseconds: number;
  };
  phone: string;
  workshopName: string;
  mechanicLicense: string;
  reviewsCount: number;
  email: string;
  verified: boolean;
}

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

export interface WorkshopCar {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  customerName: string;
  customerPhone: string;
  status: 'in_progress' | 'waiting_parts' | 'completed' | 'ready_for_pickup';
  entryDate: Date;
  estimatedCompletion?: Date;
  currentIssue: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedCost: number;
  actualCost?: number;
  notes?: string;
}

export interface RecentActivity {
  id: string;
  type: 'car_added' | 'appointment' | 'invoice' | 'review' | 'repair_completed' | 'payment_received';
  title: string;
  description: string;
  time: string;
  relatedId?: string; // ID dell'auto, fattura, etc.
  icon: string;
  color: string;
}

export const useMechanicData = () => {
  const { user, refreshUser } = useAuth();
  
  // Stati per i dati del meccanico
  const [mechanicData, setMechanicData] = useState<MechanicData | null>(null);
  const [mechanicStats, setMechanicStats] = useState<MechanicStats>({
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
  
  const [workshopCars, setWorkshopCars] = useState<WorkshopCar[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Funzione per caricare i dati del meccanico dal database
  const loadMechanicData = useCallback(async (): Promise<MechanicData | null> => {
    try {
      setIsLoading(true);

      if (!user || user.userType !== 'mechanic') {
        throw new Error('User is not a mechanic');
      }

      // Qui colleghi la tua chiamata al database Firebase/Firestore
      // Esempio: const mechanicDoc = await db.collection('mechanics').doc(user.uid).get();
      // const mechanicResponse = mechanicDoc.data() as MechanicData;
      
      // Per ora usa i dati dall'hook useAuth
      const mechanicResponse: MechanicData = {
        loginProvider: user.loginProvider || "email",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        uid: user.uid || "",
        userType: "mechanic",
        createdAt: user.createdAt || {
          type: "firestore/timestamp/1.0",
          seconds: Math.floor(Date.now() / 1000),
          nanoseconds: 0
        },
        address: user.address || "",
        rating: user.rating || 0,
        profileComplete: user.profileComplete ?? false,
        vatNumber: user.vatNumber || "",
        updatedAt: user.updatedAt || {
          type: "firestore/timestamp/1.0",
          seconds: Math.floor(Date.now() / 1000),
          nanoseconds: 0
        },
        phone: user.phone || "",
        workshopName: user.workshopName || "",
        mechanicLicense: user.mechanicLicense || "",
        reviewsCount: user.reviewsCount || 0,
        email: user.email || "",
        verified: user.verified ?? false
      };

      setMechanicData(mechanicResponse);
      setLastUpdated(new Date());
      
      return mechanicResponse;
    } catch (error) {
      console.error('Errore nel caricamento dati meccanico:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Funzione per caricare le statistiche del meccanico dal database
  const loadMechanicStats = useCallback(async (): Promise<MechanicStats> => {
    try {
      if (!mechanicData) return mechanicStats;

      // Qui colleghi le tue query al database per ottenere le statistiche
      // Esempio:
      // const carsQuery = await db.collection('cars').where('mechanicId', '==', mechanicData.uid).where('status', 'in', ['in_progress', 'waiting_parts']).get();
      // const appointmentsQuery = await db.collection('appointments').where('mechanicId', '==', mechanicData.uid).where('date', '==', today).get();
      // const invoicesQuery = await db.collection('invoices').where('mechanicId', '==', mechanicData.uid).where('status', '==', 'pending').get();
      
      const stats: MechanicStats = {
        carsInWorkshop: 0, // carsQuery.size
        appointmentsToday: 0, // appointmentsQuery.size  
        appointmentsWeek: 0, // weekAppointmentsQuery.size
        pendingInvoices: 0, // invoicesQuery.size
        overdueInvoices: 0, // overdueInvoicesQuery.size
        monthlyRevenue: 0, // Calcolo da query fatture del mese
        monthlyGrowth: 0, // Calcolo confronto mese precedente
        completedJobs: 0, // Query lavori completati
        activeCustomers: 0, // Query clienti attivi
        averageJobTime: 0, // Calcolo media tempi lavorazione
        customerSatisfaction: 0, // Media recensioni
      };

      setMechanicStats(stats);
      return stats;
    } catch (error) {
      console.error('Errore nel caricamento statistiche:', error);
      return mechanicStats;
    }
  }, [mechanicData, mechanicStats]);

  // Funzione per caricare le auto in officina dal database
  const loadWorkshopCars = useCallback(async (): Promise<WorkshopCar[]> => {
    try {
      if (!mechanicData) return [];

      // Qui colleghi la query al database per ottenere le auto in officina
      // Esempio:
      // const carsQuery = await db.collection('workshop_cars')
      //   .where('mechanicId', '==', mechanicData.uid)
      //   .where('status', 'in', ['in_progress', 'waiting_parts', 'completed', 'ready_for_pickup'])
      //   .orderBy('entryDate', 'desc')
      //   .get();
      
      // const cars: WorkshopCar[] = carsQuery.docs.map(doc => ({
      //   id: doc.id,
      //   ...doc.data()
      // })) as WorkshopCar[];

      const cars: WorkshopCar[] = []; // Sostituisci con i dati dal database

      setWorkshopCars(cars);
      return cars;
    } catch (error) {
      console.error('Errore nel caricamento auto in officina:', error);
      return [];
    }
  }, [mechanicData]);

  // Funzione per caricare attività recente dal database
  const loadRecentActivity = useCallback(async (): Promise<RecentActivity[]> => {
    try {
      if (!mechanicData) return [];

      // Qui colleghi la query al database per ottenere le attività recenti
      // Esempio:
      // const activitiesQuery = await db.collection('activities')
      //   .where('mechanicId', '==', mechanicData.uid)
      //   .orderBy('timestamp', 'desc')
      //   .limit(10)
      //   .get();
      
      // const activities: RecentActivity[] = activitiesQuery.docs.map(doc => {
      //   const data = doc.data();
      //   return {
      //     id: doc.id,
      //     type: data.type,
      //     title: data.title,
      //     description: data.description,
      //     time: formatTimeAgo(data.timestamp.toDate()),
      //     relatedId: data.relatedId,
      //     icon: data.icon,
      //     color: data.color
      //   };
      // });

      const activities: RecentActivity[] = []; // Sostituisci con i dati dal database

      setRecentActivity(activities);
      return activities;
    } catch (error) {
      console.error('Errore nel caricamento attività recente:', error);
      return [];
    }
  }, [mechanicData]);

  // Funzione per aggiornare i dati del profilo nel database
  const updateMechanicProfile = useCallback(async (updates: Partial<MechanicData>): Promise<boolean> => {
    try {
      if (!mechanicData) return false;

      setIsLoading(true);

      // Qui colleghi l'aggiornamento al database Firebase/Firestore
      // Esempio:
      // await db.collection('mechanics').doc(mechanicData.uid).update({
      //   ...updates,
      //   updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      // });

      // Aggiorna lo stato locale dopo l'aggiornamento del database
      const updatedData = {
        ...mechanicData,
        ...updates,
        updatedAt: {
          type: "firestore/timestamp/1.0",
          seconds: Math.floor(Date.now() / 1000),
          nanoseconds: (Date.now() % 1000) * 1000000
        }
      };

      setMechanicData(updatedData);
      setLastUpdated(new Date());
      
      // Aggiorna anche i dati nell'hook useAuth se necessario
      await refreshUser();

      return true;
    } catch (error) {
      console.error('Errore nell\'aggiornamento profilo:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [mechanicData, refreshUser]);

  // Funzione per marcare profilo come verificato (solo per admin)
  const verifyMechanic = useCallback(async (): Promise<boolean> => {
    try {
      return await updateMechanicProfile({ verified: true });
    } catch (error) {
      console.error('Errore nella verifica meccanico:', error);
      return false;
    }
  }, [updateMechanicProfile]);

  // Funzione per refresh completo di tutti i dati
  const refreshAllData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadMechanicData(),
        loadMechanicStats(),
        loadWorkshopCars(),
        loadRecentActivity(),
      ]);
    } catch (error) {
      console.error('Errore nel refresh dei dati:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadMechanicData, loadMechanicStats, loadWorkshopCars, loadRecentActivity]);

  // Effetto per caricare i dati all'avvio
  useEffect(() => {
    if (user && user.userType === 'mechanic') {
      loadMechanicData();
    }
  }, [user, loadMechanicData]);

  // Effetto per caricare statistiche quando i dati del meccanico sono disponibili
  useEffect(() => {
    if (mechanicData) {
      Promise.all([
        loadMechanicStats(),
        loadWorkshopCars(),
        loadRecentActivity(),
      ]).catch(console.error);
    }
  }, [mechanicData, loadMechanicStats, loadWorkshopCars, loadRecentActivity]);

  // Funzioni di utilità
  const getFormattedCreationDate = useCallback((): string => {
    if (!mechanicData?.createdAt) return 'N/A';
    
    const date = new Date(mechanicData.createdAt.seconds * 1000);
    return date.toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [mechanicData]);

  const getWorkshopDisplayName = useCallback((): string => {
    return mechanicData?.workshopName || 'Officina';
  }, [mechanicData]);

  const getMechanicFullName = useCallback((): string => {
    if (!mechanicData) return 'Meccanico';
    return `${mechanicData.firstName} ${mechanicData.lastName}`.trim();
  }, [mechanicData]);

  const isProfileIncomplete = useCallback((): boolean => {
    if (!mechanicData) return true;
    
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phone', 
      'address', 'workshopName', 'vatNumber'
    ];
    
    return requiredFields.some(field => !mechanicData[field as keyof MechanicData]);
  }, [mechanicData]);

  // Utility per formattare il tempo in "tempo fa" (utile per attività recenti)
  const formatTimeAgo = useCallback((date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'ora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minuti fa`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ore fa`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} giorni fa`;
    return date.toLocaleDateString('it-IT');
  }, []);

  // Return dei dati e funzioni
  return {
    // Dati
    mechanicData,
    mechanicStats,
    workshopCars,
    recentActivity,
    
    // Stati
    isLoading,
    lastUpdated,
    
    // Funzioni
    loadMechanicData,
    loadMechanicStats,
    loadWorkshopCars,
    loadRecentActivity,
    updateMechanicProfile,
    verifyMechanic,
    refreshAllData,
    
    // Utilità
    getFormattedCreationDate,
    getWorkshopDisplayName,
    getMechanicFullName,
    isProfileIncomplete,
    formatTimeAgo,
  };
};
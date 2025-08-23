
// src/hooks/useFirebaseInvoices.ts
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './useAuth';

export interface FirebaseInvoice {
  id: string;
  invoiceNumber: string;
  workshopId: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  customerVatNumber?: string;
  customerFiscalCode?: string;
  vehicleId?: string;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount?: number;
  items: InvoiceItem[];
  maintenanceRecordIds?: string[];
  paymentInfo?: {
    method: string;
    paidDate?: string;
    transactionId?: string;
  };
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface InvoiceItem {
  type: 'labor' | 'part' | 'service';
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate: number;
  maintenanceRecordId?: string;
}

export interface InvoiceStats {
  totalInvoices: number;
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  monthlyGrowth: number;
}

export const useFirebaseInvoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<FirebaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    console.log('🧾 Caricamento fatture per meccanico:', user.uid);

    const q = query(
      collection(db, 'invoices'),
      where('workshopId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const invoicesData: FirebaseInvoice[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          invoicesData.push({
            id: doc.id,
            ...data,
            issueDate: data.issueDate,
            dueDate: data.dueDate,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as FirebaseInvoice);
        });

        setInvoices(invoicesData);
        setLoading(false);
        setError(null);
        console.log('✅ Fatture caricate:', invoicesData.length);
      } catch (err) {
        console.error('❌ Errore nel caricamento fatture:', err);
        setError('Errore nel caricamento delle fatture');
        setLoading(false);
      }
    }, (err) => {
      console.error('❌ Errore listener fatture:', err);
      setError('Errore nella connessione alle fatture');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const createInvoice = async (invoiceData: Omit<FirebaseInvoice, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.uid) {
      throw new Error('Utente non autenticato');
    }

    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, 'invoices'), {
        ...invoiceData,
        workshopId: user.uid,
        createdAt: now,
        updatedAt: now,
      });

      console.log('✅ Fattura creata con ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Errore nella creazione fattura:', error);
      throw new Error('Errore nella creazione della fattura');
    }
  };

  const updateInvoice = async (invoiceId: string, updates: Partial<FirebaseInvoice>) => {
    try {
      const invoiceRef = doc(db, 'invoices', invoiceId);
      await updateDoc(invoiceRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });

      console.log('✅ Fattura aggiornata:', invoiceId);
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento fattura:', error);
      throw new Error('Errore nell\'aggiornamento della fattura');
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    try {
      await deleteDoc(doc(db, 'invoices', invoiceId));
      console.log('✅ Fattura eliminata:', invoiceId);
    } catch (error) {
      console.error('❌ Errore nell\'eliminazione fattura:', error);
      throw new Error('Errore nell\'eliminazione della fattura');
    }
  };

  const markAsPaid = async (invoiceId: string, paidDate?: string, transactionId?: string) => {
    try {
      const updates: Partial<FirebaseInvoice> = {
        status: 'paid',
        paidAmount: invoices.find(inv => inv.id === invoiceId)?.totalAmount || 0,
        paymentInfo: {
          method: 'bank_transfer', // Default, può essere personalizzato
          paidDate: paidDate || new Date().toISOString().split('T')[0],
          transactionId,
        },
        updatedAt: Timestamp.now(),
      };

      await updateInvoice(invoiceId, updates);
      console.log('✅ Fattura marcata come pagata:', invoiceId);
    } catch (error) {
      console.error('❌ Errore nel marcare fattura come pagata:', error);
      throw new Error('Errore nell\'aggiornamento dello stato di pagamento');
    }
  };

  const getInvoiceStats = (): InvoiceStats => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const totalInvoices = invoices.length;
    
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const pendingAmount = invoices
      .filter(inv => inv.status === 'sent')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const overdueAmount = invoices
      .filter(inv => {
        if (inv.status !== 'sent') return false;
        const dueDate = new Date(inv.dueDate);
        return dueDate < now;
      })
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const thisMonthRevenue = invoices
      .filter(inv => {
        if (inv.status !== 'paid') return false;
        const paidDate = inv.paymentInfo?.paidDate 
          ? new Date(inv.paymentInfo.paidDate)
          : inv.createdAt.toDate();
        return paidDate.getMonth() === thisMonth && paidDate.getFullYear() === thisYear;
      })
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const lastMonthRevenue = invoices
      .filter(inv => {
        if (inv.status !== 'paid') return false;
        const paidDate = inv.paymentInfo?.paidDate 
          ? new Date(inv.paymentInfo.paidDate)
          : inv.createdAt.toDate();
        return paidDate.getMonth() === lastMonth && paidDate.getFullYear() === lastMonthYear;
      })
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const monthlyGrowth = lastMonthRevenue === 0 
      ? (thisMonthRevenue > 0 ? 100 : 0)
      : ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

    return {
      totalInvoices,
      totalRevenue,
      pendingAmount,
      overdueAmount,
      thisMonthRevenue,
      lastMonthRevenue,
      monthlyGrowth,
    };
  };

  const getRecentInvoices = (limit: number = 5) => {
    return invoices.slice(0, limit);
  };

  const getInvoiceById = (invoiceId: string) => {
    return invoices.find(inv => inv.id === invoiceId);
  };

  const getInvoicesByStatus = (status: string) => {
    if (status === 'all') return invoices;
    return invoices.filter(inv => inv.status === status);
  };

  const searchInvoices = (searchQuery: string) => {
    const query = searchQuery.toLowerCase();
    return invoices.filter(inv => 
      inv.invoiceNumber.toLowerCase().includes(query) ||
      inv.customerName.toLowerCase().includes(query) ||
      inv.customerEmail?.toLowerCase().includes(query) ||
      inv.notes?.toLowerCase().includes(query)
    );
  };

  return {
    invoices,
    loading,
    error,
    stats: getInvoiceStats(),
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markAsPaid,
    getRecentInvoices,
    getInvoiceById,
    getInvoicesByStatus,
    searchInvoices,
  };
};

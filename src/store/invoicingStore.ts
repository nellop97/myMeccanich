// src/store/invoicingStore.ts - Store Fatturazione con integrazione Firestore
import create from 'zustand';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  onSnapshot,
  serverTimestamp,
  limit,
  runTransaction,
  Timestamp,
  Transaction
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';

// Id del meccanico autenticato: le regole Firestore richiedono che coincida col proprietario
const getCurrentUserId = (): string => {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Utente non autenticato');
  }
  return uid;
};

// Firestore rifiuta i campi undefined, che qui sono normali per i dati facoltativi
const removeUndefined = <T extends object>(data: T): T =>
  Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as T;

// Numero più alto già usato nell'anno: inizializza il contatore al primo utilizzo.
// Si cerca su entrambi i campi perché workshopId è facoltativo nelle regole di creazione.
const findHighestInvoiceNumber = async (ownerId: string, year: number): Promise<number> => {
  const prefix = `FAT-${year}-`;
  const snapshots = await Promise.all(
    ['workshopId', 'mechanicId'].map(field =>
      getDocs(query(collection(db, 'invoices'), where(field, '==', ownerId)))
    )
  );

  return snapshots.flatMap(snapshot => snapshot.docs).reduce((highest, item) => {
    const number = item.data().number;
    if (typeof number !== 'string' || !number.startsWith(prefix)) return highest;
    const value = parseInt(number.slice(prefix.length), 10);
    return Number.isNaN(value) ? highest : Math.max(highest, value);
  }, 0);
};

// ====================================
// INTERFACCE E TIPI
// ====================================

export type InvoiceType = 'customer' | 'supplier' | 'expense' | 'credit_note';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'check' | 'other';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number; // Percentuale IVA (es. 22)
  discount?: number; // Percentuale sconto
  total: number; // quantity * unitPrice * (1 - discount/100)
  vatAmount: number; // total * vatRate/100
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  province?: string;
  country?: string;
  vatNumber?: string;
  fiscalCode?: string;
  isCompany: boolean;
  pec?: string; // Posta Elettronica Certificata
  sdiCode?: string; // Codice SDI per fatturazione elettronica
  notes?: string;
  workshopId: string;
  mechanicId?: string; // Stesso id di workshopId, richiesto dalle regole Firestore
  createdAt?: any;
  updatedAt?: any;
}

export interface Invoice {
  id: string;
  number: string; // Numero fattura progressivo
  type: InvoiceType;
  status: InvoiceStatus;
  
  // Date
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  
  // Cliente/Fornitore
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  customerVatNumber?: string;
  customerFiscalCode?: string;
  
  // Dettagli fattura
  items: InvoiceItem[];
  
  // Importi
  subtotal: number; // Totale senza IVA
  totalVat: number; // Totale IVA
  totalAmount: number; // Totale con IVA
  totalDiscount: number; // Totale sconti
  
  // Pagamento
  paymentMethod?: PaymentMethod;
  paymentTerms?: string; // es. "30 giorni"
  bankDetails?: string; // IBAN o dettagli bancari
  
  // Note e riferimenti
  notes?: string;
  internalNotes?: string;
  
  // Collegamento a riparazione (se applicabile)
  carId?: string;
  repairId?: string;
  
  // Metadati
  workshopId: string;
  mechanicId?: string; // Stesso id di workshopId, richiesto dalle regole Firestore
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  type: InvoiceType;
  items: Omit<InvoiceItem, 'id' | 'total' | 'vatAmount'>[];
  defaultPaymentTerms?: string;
  defaultNotes?: string;
  workshopId: string;
  createdAt?: any;
  updatedAt?: any;
}

// ====================================
// INTERFACCIA DELLO STORE
// ====================================

interface InvoicingStore {
  // Stati
  invoices: Invoice[];
  customers: Customer[];
  templates: InvoiceTemplate[];
  isLoading: boolean;
  error: string | null;
  currentWorkshopId: string | null;
  
  // Listener attivi
  unsubscribers: (() => void)[];
  
  // === METODI PER FATTURE ===
  fetchInvoices: (workshopId: string, year?: number) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'number' | 'workshopId' | 'mechanicId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateInvoice: (invoiceId: string, updates: Partial<Omit<Invoice, 'workshopId' | 'mechanicId'>>) => Promise<void>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
  subscribeToInvoices: (workshopId: string) => void;
  
  // === METODI PER CLIENTI ===
  fetchCustomers: (workshopId: string) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'workshopId' | 'mechanicId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateCustomer: (customerId: string, updates: Partial<Omit<Customer, 'workshopId' | 'mechanicId'>>) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  subscribeToCustomers: (workshopId: string) => void;
  
  // === METODI PER TEMPLATE ===
  fetchTemplates: (workshopId: string) => Promise<void>;
  addTemplate: (template: Omit<InvoiceTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTemplate: (templateId: string, updates: Partial<InvoiceTemplate>) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  
  // === UTILITY ===
  getInvoiceById: (invoiceId: string) => Invoice | undefined;
  getCustomerById: (customerId: string) => Customer | undefined;
  getInvoicesByCustomer: (customerId: string) => Invoice[];
  getInvoicesByRepair: (carId: string, repairId: string) => Invoice[];
  calculateInvoiceTotals: (items: InvoiceItem[]) => {
    subtotal: number;
    totalVat: number;
    totalAmount: number;
    totalDiscount: number;
  };
  generateNextInvoiceNumber: (onNumberReserved?: (transaction: Transaction, invoiceNumber: string) => void) => Promise<string>;
  updateInvoiceStatus: (invoiceId: string, status: InvoiceStatus, paidDate?: string) => Promise<void>;
  
  // === STATISTICHE ===
  getInvoiceStats: () => {
    totalInvoices: number;
    totalRevenue: number;
    pendingAmount: number;
    overdueAmount: number;
    thisMonthRevenue: number;
    lastMonthRevenue: number;
    averageInvoiceValue: number;
  };
  
  // === SETUP E CLEANUP ===
  setWorkshopId: (workshopId: string) => void;
  cleanup: () => void;
  resetStore: () => void;
}

// ====================================
// CREAZIONE DELLO STORE
// ====================================

export const useInvoicingStore = create<InvoicingStore>((set, get) => ({
  // === STATO INIZIALE ===
  invoices: [],
  customers: [],
  templates: [],
  isLoading: false,
  error: null,
  currentWorkshopId: null,
  unsubscribers: [],
  
  // === METODI PER FATTURE ===
  fetchInvoices: async (workshopId, year) => {
    set({ isLoading: true, error: null });
    try {
      const currentYear = year || new Date().getFullYear();
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;
      
      const invoicesQuery = query(
        collection(db, 'invoices'),
        where('workshopId', '==', workshopId),
        where('issueDate', '>=', startDate),
        where('issueDate', '<=', endDate),
        orderBy('issueDate', 'desc'),
        orderBy('number', 'desc')
      );
      
      const snapshot = await getDocs(invoicesQuery);
      const invoices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invoice[];
      
      set({ invoices, isLoading: false });
    } catch (error: any) {
      console.error('Errore recupero fatture:', error);
      set({ 
        error: error.message || 'Errore nel recupero delle fatture',
        isLoading: false 
      });
    }
  },
  
  addInvoice: async (invoice) => {
    set({ isLoading: true, error: null });
    try {
      const ownerId = getCurrentUserId();
      const invoiceData = removeUndefined({
        ...invoice,
        customerId: invoice.customerId || '', // Richiesto dalle regole Firestore
        mechanicId: ownerId,
        workshopId: ownerId
      });
      
      // Fattura e contatore si scrivono insieme: se la scrittura fallisce il numero non va perso
      const docRef = doc(collection(db, 'invoices'));
      const invoiceNumber = await get().generateNextInvoiceNumber((transaction, number) => {
        transaction.set(docRef, {
          ...invoiceData,
          number,
          status: invoice.status || 'draft',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      const newInvoice: Invoice = {
        ...invoiceData,
        id: docRef.id,
        number: invoiceNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      set(state => ({
        invoices: [newInvoice, ...state.invoices],
        isLoading: false
      }));
      
      return docRef.id;
    } catch (error: any) {
      console.error('Errore creazione fattura:', error);
      set({ 
        error: error.message || 'Errore nella creazione della fattura',
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateInvoice: async (invoiceId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const invoiceRef = doc(db, 'invoices', invoiceId);
      
      // Ricalcola i totali se gli items sono stati aggiornati
      let finalUpdates = { ...updates };
      if (updates.items) {
        const totals = get().calculateInvoiceTotals(updates.items);
        finalUpdates = { ...finalUpdates, ...totals };
      }
      
      await updateDoc(invoiceRef, {
        ...finalUpdates,
        updatedAt: serverTimestamp()
      });
      
      set(state => ({
        invoices: state.invoices.map(inv =>
          inv.id === invoiceId ? { ...inv, ...finalUpdates } : inv
        ),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Errore aggiornamento fattura:', error);
      set({ 
        error: error.message || 'Errore nell\'aggiornamento della fattura',
        isLoading: false 
      });
      throw error;
    }
  },
  
  deleteInvoice: async (invoiceId) => {
    set({ isLoading: true, error: null });
    try {
      // Non eliminiamo fisicamente, ma marchiamo come cancellata
      const invoiceRef = doc(db, 'invoices', invoiceId);
      await updateDoc(invoiceRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp()
      });
      
      set(state => ({
        invoices: state.invoices.map(inv =>
          inv.id === invoiceId ? { ...inv, status: 'cancelled' } : inv
        ),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Errore eliminazione fattura:', error);
      set({ 
        error: error.message || 'Errore nell\'eliminazione della fattura',
        isLoading: false 
      });
      throw error;
    }
  },
  
  subscribeToInvoices: (workshopId) => {
    const currentYear = new Date().getFullYear();
    const startDate = `${currentYear}-01-01`;
    
    const invoicesQuery = query(
      collection(db, 'invoices'),
      where('workshopId', '==', workshopId),
      where('issueDate', '>=', startDate),
      orderBy('issueDate', 'desc'),
      limit(100)
    );
    
    const unsubscribe = onSnapshot(invoicesQuery, 
      (snapshot) => {
        const invoices = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Invoice[];
        
        set({ invoices, error: null });
      },
      (error) => {
        console.error('Errore subscription fatture:', error);
        set({ error: error.message });
      }
    );
    
    set(state => ({
      unsubscribers: [...state.unsubscribers, unsubscribe]
    }));
  },
  
  // === METODI PER CLIENTI ===
  fetchCustomers: async (workshopId) => {
    set({ isLoading: true, error: null });
    try {
      const customersQuery = query(
        collection(db, 'customers'),
        where('workshopId', '==', workshopId),
        orderBy('name', 'asc')
      );
      
      const snapshot = await getDocs(customersQuery);
      const customers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      
      set({ customers, isLoading: false });
    } catch (error: any) {
      console.error('Errore recupero clienti:', error);
      set({ 
        error: error.message || 'Errore nel recupero dei clienti',
        isLoading: false 
      });
    }
  },
  
  addCustomer: async (customer) => {
    set({ isLoading: true, error: null });
    try {
      const ownerId = getCurrentUserId();
      const customerData = removeUndefined({
        ...customer,
        email: customer.email?.trim() || '', // Richiesta dalle regole Firestore
        mechanicId: ownerId,
        workshopId: ownerId
      });
      
      const docRef = await addDoc(collection(db, 'customers'), {
        ...customerData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      const newCustomer: Customer = {
        ...customerData,
        id: docRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      set(state => ({
        customers: [...state.customers, newCustomer],
        isLoading: false
      }));
      
      return docRef.id;
    } catch (error: any) {
      console.error('Errore aggiunta cliente:', error);
      set({ 
        error: error.message || 'Errore nell\'aggiunta del cliente',
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateCustomer: async (customerId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const customerRef = doc(db, 'customers', customerId);
      await updateDoc(customerRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      set(state => ({
        customers: state.customers.map(cust =>
          cust.id === customerId ? { ...cust, ...updates } : cust
        ),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Errore aggiornamento cliente:', error);
      set({ 
        error: error.message || 'Errore nell\'aggiornamento del cliente',
        isLoading: false 
      });
      throw error;
    }
  },
  
  deleteCustomer: async (customerId) => {
    set({ isLoading: true, error: null });
    try {
      await deleteDoc(doc(db, 'customers', customerId));
      
      set(state => ({
        customers: state.customers.filter(cust => cust.id !== customerId),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Errore eliminazione cliente:', error);
      set({ 
        error: error.message || 'Errore nell\'eliminazione del cliente',
        isLoading: false 
      });
      throw error;
    }
  },
  
  subscribeToCustomers: (workshopId) => {
    const customersQuery = query(
      collection(db, 'customers'),
      where('workshopId', '==', workshopId),
      orderBy('name', 'asc')
    );
    
    const unsubscribe = onSnapshot(customersQuery, 
      (snapshot) => {
        const customers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Customer[];
        
        set({ customers, error: null });
      },
      (error) => {
        console.error('Errore subscription clienti:', error);
        set({ error: error.message });
      }
    );
    
    set(state => ({
      unsubscribers: [...state.unsubscribers, unsubscribe]
    }));
  },
  
  // === METODI PER TEMPLATE ===
  fetchTemplates: async (workshopId) => {
    set({ isLoading: true, error: null });
    try {
      const templatesQuery = query(
        collection(db, 'invoice_templates'),
        where('workshopId', '==', workshopId),
        orderBy('name', 'asc')
      );
      
      const snapshot = await getDocs(templatesQuery);
      const templates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InvoiceTemplate[];
      
      set({ templates, isLoading: false });
    } catch (error: any) {
      console.error('Errore recupero template:', error);
      set({ 
        error: error.message || 'Errore nel recupero dei template',
        isLoading: false 
      });
    }
  },
  
  addTemplate: async (template) => {
    set({ isLoading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'invoice_templates'), {
        ...template,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      const newTemplate: InvoiceTemplate = {
        ...template,
        id: docRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      set(state => ({
        templates: [...state.templates, newTemplate],
        isLoading: false
      }));
      
      return docRef.id;
    } catch (error: any) {
      console.error('Errore aggiunta template:', error);
      set({ 
        error: error.message || 'Errore nell\'aggiunta del template',
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateTemplate: async (templateId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const templateRef = doc(db, 'invoice_templates', templateId);
      await updateDoc(templateRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      set(state => ({
        templates: state.templates.map(tmpl =>
          tmpl.id === templateId ? { ...tmpl, ...updates } : tmpl
        ),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Errore aggiornamento template:', error);
      set({ 
        error: error.message || 'Errore nell\'aggiornamento del template',
        isLoading: false 
      });
      throw error;
    }
  },
  
  deleteTemplate: async (templateId) => {
    set({ isLoading: true, error: null });
    try {
      await deleteDoc(doc(db, 'invoice_templates', templateId));
      
      set(state => ({
        templates: state.templates.filter(tmpl => tmpl.id !== templateId),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Errore eliminazione template:', error);
      set({ 
        error: error.message || 'Errore nell\'eliminazione del template',
        isLoading: false 
      });
      throw error;
    }
  },
  
  // === UTILITY ===
  getInvoiceById: (invoiceId) => {
    return get().invoices.find(inv => inv.id === invoiceId);
  },
  
  getCustomerById: (customerId) => {
    return get().customers.find(cust => cust.id === customerId);
  },
  
  getInvoicesByCustomer: (customerId) => {
    return get().invoices.filter(inv => inv.customerId === customerId);
  },
  
  getInvoicesByRepair: (carId, repairId) => {
    return get().invoices.filter(inv => 
      inv.carId === carId && inv.repairId === repairId
    );
  },
  
  calculateInvoiceTotals: (items) => {
    let subtotal = 0;
    let totalVat = 0;
    let totalDiscount = 0;
    
    items.forEach(item => {
      const itemTotal = item.quantity * item.unitPrice;
      const discountAmount = itemTotal * (item.discount || 0) / 100;
      const totalAfterDiscount = itemTotal - discountAmount;
      const vatAmount = totalAfterDiscount * item.vatRate / 100;
      
      subtotal += totalAfterDiscount;
      totalVat += vatAmount;
      totalDiscount += discountAmount;
    });
    
    return {
      subtotal,
      totalVat,
      totalAmount: subtotal + totalVat,
      totalDiscount,
    };
  },
  
  generateNextInvoiceNumber: async (onNumberReserved) => {
    const ownerId = getCurrentUserId();
    const year = new Date().getFullYear();
    const settingsRef = doc(db, 'workshop_settings', ownerId);
    
    return runTransaction(db, async (transaction) => {
      const settingsSnap = await transaction.get(settingsRef);
      const storedNumber = settingsSnap.data()?.invoiceCounters?.[year];
      const lastNumber = typeof storedNumber === 'number'
        ? storedNumber
        : await findHighestInvoiceNumber(ownerId, year);
      
      const nextNumber = lastNumber + 1;
      const paddedNumber = nextNumber.toString().padStart(5, '0');
      const invoiceNumber = `FAT-${year}-${paddedNumber}`;
      
      // merge conserva i contatori degli altri anni e le altre impostazioni dell'officina
      transaction.set(settingsRef, { invoiceCounters: { [year]: nextNumber } }, { merge: true });
      onNumberReserved?.(transaction, invoiceNumber);
      
      return invoiceNumber;
    });
  },
  
  updateInvoiceStatus: async (invoiceId, status, paidDate) => {
    const updates: Partial<Invoice> = { status };
    if (status === 'paid' && paidDate) {
      updates.paidDate = paidDate;
    }
    return get().updateInvoice(invoiceId, updates);
  },
  
  // === STATISTICHE ===
  getInvoiceStats: () => {
    const invoices = get().invoices;
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    
    const activeInvoices = invoices.filter(inv => inv.status !== 'cancelled');
    const paidInvoices = activeInvoices.filter(inv => inv.status === 'paid');
    const pendingInvoices = activeInvoices.filter(inv => 
      inv.status === 'sent' || inv.status === 'draft'
    );
    const overdueInvoices = activeInvoices.filter(inv => {
      if (inv.status === 'paid' || inv.status === 'cancelled') return false;
      const dueDate = new Date(inv.dueDate);
      return dueDate < now;
    });
    
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    // Calcola revenue mensile
    const thisMonthInvoices = activeInvoices.filter(inv => {
      const date = new Date(inv.issueDate);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });
    const lastMonthInvoices = activeInvoices.filter(inv => {
      const date = new Date(inv.issueDate);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });
    
    const thisMonthRevenue = thisMonthInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const lastMonthRevenue = lastMonthInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    const averageInvoiceValue = activeInvoices.length > 0 
      ? totalRevenue / activeInvoices.length 
      : 0;
    
    return {
      totalInvoices: activeInvoices.length,
      totalRevenue,
      pendingAmount,
      overdueAmount,
      thisMonthRevenue,
      lastMonthRevenue,
      averageInvoiceValue,
    };
  },
  
  // === SETUP E CLEANUP ===
  setWorkshopId: (workshopId) => {
    set({ currentWorkshopId: workshopId });
  },
  
  cleanup: () => {
    const { unsubscribers } = get();
    unsubscribers.forEach(unsub => unsub());
    set({ unsubscribers: [] });
  },
  
  resetStore: () => {
    get().cleanup();
    set({
      invoices: [],
      customers: [],
      templates: [],
      isLoading: false,
      error: null,
      currentWorkshopId: null,
      unsubscribers: []
    });
  }
}));
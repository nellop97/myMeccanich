// src/store/invoicingStore.ts - Store Fatturazione con integrazione Firestore
import { create } from 'zustand';
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
  Timestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';

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
  nextInvoiceNumber: number;
  isLoading: boolean;
  error: string | null;
  currentWorkshopId: string | null;
  
  // Listener attivi
  unsubscribers: (() => void)[];
  
  // === METODI PER FATTURE ===
  fetchInvoices: (workshopId: string, year?: number) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'number' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateInvoice: (invoiceId: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
  subscribeToInvoices: (workshopId: string) => void;
  
  // === METODI PER CLIENTI ===
  fetchCustomers: (workshopId: string) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateCustomer: (customerId: string, updates: Partial<Customer>) => Promise<void>;
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
  generateNextInvoiceNumber: () => Promise<string>;
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
  nextInvoiceNumber: 1,
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
      
      // Calcola il prossimo numero di fattura
      if (invoices.length > 0) {
        const lastNumber = parseInt(invoices[0].number.split('-').pop() || '0');
        set({ nextInvoiceNumber: lastNumber + 1 });
      }
      
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
      const invoiceNumber = await get().generateNextInvoiceNumber();
      
      const docRef = await addDoc(collection(db, 'invoices'), {
        ...invoice,
        number: invoiceNumber,
        status: invoice.status || 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      const newInvoice: Invoice = {
        ...invoice,
        id: docRef.id,
        number: invoiceNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      set(state => ({
        invoices: [newInvoice, ...state.invoices],
        nextInvoiceNumber: state.nextInvoiceNumber + 1,
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
      const docRef = await addDoc(collection(db, 'customers'), {
        ...customer,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      const newCustomer: Customer = {
        ...customer,
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
  
  generateNextInvoiceNumber: async () => {
    const year = new Date().getFullYear();
    const number = get().nextInvoiceNumber;
    const paddedNumber = number.toString().padStart(5, '0');
    return `FAT-${year}-${paddedNumber}`;
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
      nextInvoiceNumber: 1,
      isLoading: false,
      error: null,
      currentWorkshopId: null,
      unsubscribers: []
    });
  }
}));
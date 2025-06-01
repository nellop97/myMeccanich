import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type InvoiceType = 'customer' | 'supplier' | 'expense' | 'other';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'check' | 'other';

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number; // Percentuale IVA (es. 22)
  discount?: number; // Percentuale sconto
  total: number; // quantity * unitPrice * (1 - discount/100)
  vatAmount: number; // total * vatRate/100
};

export type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  vatNumber?: string;
  fiscalCode?: string;
  isCompany: boolean;
};

export type Invoice = {
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
  
  // Note e riferimenti
  notes?: string;
  internalNotes?: string;
  
  // Collegamento a riparazione (se applicabile)
  carId?: string;
  repairId?: string;
  
  // Metadati
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
};

export type InvoiceTemplate = {
  id: string;
  name: string;
  type: InvoiceType;
  items: Omit<InvoiceItem, 'id' | 'total' | 'vatAmount'>[];
  defaultPaymentTerms?: string;
  defaultNotes?: string;
};

interface InvoicingStore {
  invoices: Invoice[];
  customers: Customer[];
  templates: InvoiceTemplate[];
  
  // Contatori
  nextInvoiceNumber: number;
  
  // Metodi per fatture
  addInvoice: (invoice: Omit<Invoice, 'id' | 'number' | 'createdAt' | 'updatedAt'>) => string;
  updateInvoice: (invoiceId: string, data: Partial<Omit<Invoice, 'id'>>) => void;
  deleteInvoice: (invoiceId: string) => void;
  getInvoiceById: (invoiceId: string) => Invoice | undefined;
  getInvoicesByCustomer: (customerId: string) => Invoice[];
  getInvoicesByRepair: (carId: string, repairId: string) => Invoice[];
  
  // Metodi per clienti
  addCustomer: (customer: Omit<Customer, 'id'>) => string;
  updateCustomer: (customerId: string, data: Partial<Omit<Customer, 'id'>>) => void;
  deleteCustomer: (customerId: string) => void;
  getCustomerById: (customerId: string) => Customer | undefined;
  
  // Metodi per template
  addTemplate: (template: Omit<InvoiceTemplate, 'id'>) => string;
  updateTemplate: (templateId: string, data: Partial<Omit<InvoiceTemplate, 'id'>>) => void;
  deleteTemplate: (templateId: string) => void;
  
  // Utility
  calculateInvoiceTotals: (items: InvoiceItem[]) => {
    subtotal: number;
    totalVat: number;
    totalAmount: number;
    totalDiscount: number;
  };
  generateInvoiceFromRepair: (carId: string, repairId: string) => Omit<Invoice, 'id' | 'number' | 'createdAt' | 'updatedAt'> | null;
  updateInvoiceStatus: (invoiceId: string, status: InvoiceStatus, paidDate?: string) => void;
  
  // Statistiche
  getInvoiceStats: () => {
    totalInvoices: number;
    totalRevenue: number;
    pendingAmount: number;
    overdueAmount: number;
    thisMonthRevenue: number;
    lastMonthRevenue: number;
  };
}

export const useInvoicingStore = create<InvoicingStore>()(
  persist(
    (set, get) => ({
      invoices: [
        // Fattura di esempio per Tesla
        {
          id: '1',
          number: 'FAT-2025-001',
          type: 'customer',
          status: 'paid',
          issueDate: '2025-05-20',
          dueDate: '2025-06-19',
          paidDate: '2025-05-25',
          customerId: '1',
          customerName: 'Mario Rossi',
          customerEmail: 'mario.rossi@email.com',
          customerAddress: 'Via Roma 123, 20100 Milano',
          customerFiscalCode: 'RSSMRA80A01F205X',
          items: [
            {
              id: '1',
              description: 'Sostituzione batteria trazione Tesla Model 3',
              quantity: 1,
              unitPrice: 1000.00,
              vatRate: 22,
              total: 1000.00,
              vatAmount: 220.00,
            },
            {
              id: '2',
              description: 'Manodopera specializzata',
              quantity: 4,
              unitPrice: 50.00,
              vatRate: 22,
              total: 200.00,
              vatAmount: 44.00,
            }
          ],
          subtotal: 1200.00,
          totalVat: 264.00,
          totalAmount: 1464.00,
          totalDiscount: 0,
          paymentMethod: 'bank_transfer',
          paymentTerms: '30 giorni',
          notes: 'Intervento in garanzia, solo manodopera a carico del cliente',
          carId: '1',
          repairId: '1',
          createdAt: '2025-05-20T10:00:00Z',
          updatedAt: '2025-05-25T14:30:00Z',
        },
        // Fattura di esempio per Fiat Panda
        {
          id: '2',
          number: 'FAT-2025-002',
          type: 'customer',
          status: 'sent',
          issueDate: '2025-06-01',
          dueDate: '2025-07-01',
          customerId: '2',
          customerName: 'Anna Verdi',
          customerEmail: 'anna.verdi@email.com',
          customerAddress: 'Via Milano 45, 20121 Milano',
          customerFiscalCode: 'VRDNNA85B42F205Y',
          items: [
            {
              id: '3',
              description: 'Olio motore 5W-30 (4 litri)',
              quantity: 4,
              unitPrice: 8.50,
              vatRate: 22,
              total: 34.00,
              vatAmount: 7.48,
            },
            {
              id: '4',
              description: 'Filtro olio',
              quantity: 1,
              unitPrice: 12.00,
              vatRate: 22,
              total: 12.00,
              vatAmount: 2.64,
            },
            {
              id: '5',
              description: 'Filtro aria',
              quantity: 1,
              unitPrice: 15.00,
              vatRate: 22,
              total: 15.00,
              vatAmount: 3.30,
            },
            {
              id: '6',
              description: 'Filtro abitacolo',
              quantity: 1,
              unitPrice: 18.00,
              vatRate: 22,
              total: 18.00,
              vatAmount: 3.96,
            },
            {
              id: '7',
              description: 'Manodopera tagliando',
              quantity: 2,
              unitPrice: 25.00,
              vatRate: 22,
              total: 50.00,
              vatAmount: 11.00,
            }
          ],
          subtotal: 129.00,
          totalVat: 28.38,
          totalAmount: 157.38,
          totalDiscount: 0,
          paymentMethod: 'card',
          paymentTerms: '30 giorni',
          notes: 'Tagliando completo come da programma manutenzione',
          carId: '2',
          repairId: '2',
          createdAt: '2025-06-01T09:15:00Z',
          updatedAt: '2025-06-01T09:15:00Z',
        }
      ],
      
      customers: [
        {
          id: '1',
          name: 'Mario Rossi',
          email: 'mario.rossi@email.com',
          phone: '+39 334 1234567',
          address: 'Via Roma 123',
          city: 'Milano',
          postalCode: '20100',
          fiscalCode: 'RSSMRA80A01F205X',
          isCompany: false,
        },
        {
          id: '2',
          name: 'Anna Verdi',
          email: 'anna.verdi@email.com',
          phone: '+39 347 9876543',
          address: 'Via Milano 45',
          city: 'Milano',
          postalCode: '20121',
          fiscalCode: 'VRDNNA85B42F205Y',
          isCompany: false,
        },
        {
          id: '3',
          name: 'AutoService SpA',
          email: 'info@autoservice.it',
          phone: '+39 02 1234567',
          address: 'Via Industria 12',
          city: 'Milano',
          postalCode: '20143',
          vatNumber: 'IT12345678901',
          isCompany: true,
        }
      ],
      
      templates: [
        {
          id: '1',
          name: 'Tagliando Standard',
          type: 'customer',
          items: [
            {
              description: 'Olio motore (litri variabili)',
              quantity: 4,
              unitPrice: 8.50,
              vatRate: 22,
            },
            {
              description: 'Filtro olio',
              quantity: 1,
              unitPrice: 12.00,
              vatRate: 22,
            },
            {
              description: 'Filtro aria',
              quantity: 1,
              unitPrice: 15.00,
              vatRate: 22,
            },
            {
              description: 'Manodopera tagliando',
              quantity: 2,
              unitPrice: 25.00,
              vatRate: 22,
            }
          ],
          defaultPaymentTerms: '30 giorni',
          defaultNotes: 'Tagliando come da programma manutenzione',
        }
      ],
      
      nextInvoiceNumber: 3,

      addInvoice: (invoiceData) => {
        const newId = Date.now().toString();
        const invoiceNumber = `FAT-2025-${String(get().nextInvoiceNumber).padStart(3, '0')}`;
        const now = new Date().toISOString();
        
        const totals = get().calculateInvoiceTotals(invoiceData.items);
        
        const newInvoice: Invoice = {
          id: newId,
          number: invoiceNumber,
          ...invoiceData,
          ...totals,
          createdAt: now,
          updatedAt: now,
        };

        set(state => ({
          invoices: [...state.invoices, newInvoice],
          nextInvoiceNumber: state.nextInvoiceNumber + 1,
        }));

        return newId;
      },

      updateInvoice: (invoiceId, data) => {
        set(state => ({
          invoices: state.invoices.map(invoice =>
            invoice.id === invoiceId
              ? {
                  ...invoice,
                  ...data,
                  ...(data.items ? get().calculateInvoiceTotals(data.items) : {}),
                  updatedAt: new Date().toISOString(),
                }
              : invoice
          ),
        }));
      },

      deleteInvoice: (invoiceId) => {
        set(state => ({
          invoices: state.invoices.filter(invoice => invoice.id !== invoiceId),
        }));
      },

      getInvoiceById: (invoiceId) => {
        return get().invoices.find(invoice => invoice.id === invoiceId);
      },

      getInvoicesByCustomer: (customerId) => {
        return get().invoices.filter(invoice => invoice.customerId === customerId);
      },

      getInvoicesByRepair: (carId, repairId) => {
        return get().invoices.filter(invoice => 
          invoice.carId === carId && invoice.repairId === repairId
        );
      },

      addCustomer: (customerData) => {
        const newId = Date.now().toString();
        const newCustomer: Customer = {
          id: newId,
          ...customerData,
        };

        set(state => ({
          customers: [...state.customers, newCustomer],
        }));

        return newId;
      },

      updateCustomer: (customerId, data) => {
        set(state => ({
          customers: state.customers.map(customer =>
            customer.id === customerId ? { ...customer, ...data } : customer
          ),
        }));
      },

      deleteCustomer: (customerId) => {
        set(state => ({
          customers: state.customers.filter(customer => customer.id !== customerId),
        }));
      },

      getCustomerById: (customerId) => {
        return get().customers.find(customer => customer.id === customerId);
      },

      addTemplate: (templateData) => {
        const newId = Date.now().toString();
        const newTemplate: InvoiceTemplate = {
          id: newId,
          ...templateData,
        };

        set(state => ({
          templates: [...state.templates, newTemplate],
        }));

        return newId;
      },

      updateTemplate: (templateId, data) => {
        set(state => ({
          templates: state.templates.map(template =>
            template.id === templateId ? { ...template, ...data } : template
          ),
        }));
      },

      deleteTemplate: (templateId) => {
        set(state => ({
          templates: state.templates.filter(template => template.id !== templateId),
        }));
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

      generateInvoiceFromRepair: (carId, repairId) => {
        // Qui dovremmo importare useWorkshopStore, ma per evitare dipendenze circolari
        // questo metodo sarà implementato nelle schermate
        return null;
      },

      updateInvoiceStatus: (invoiceId, status, paidDate) => {
        set(state => ({
          invoices: state.invoices.map(invoice =>
            invoice.id === invoiceId
              ? {
                  ...invoice,
                  status,
                  paidDate: status === 'paid' ? paidDate || new Date().toISOString().split('T')[0] : undefined,
                  updatedAt: new Date().toISOString(),
                }
              : invoice
          ),
        }));
      },

      getInvoiceStats: () => {
        const invoices = get().invoices;
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
            const invoiceDate = new Date(inv.paidDate || inv.issueDate);
            return invoiceDate.getMonth() === thisMonth && invoiceDate.getFullYear() === thisYear;
          })
          .reduce((sum, inv) => sum + inv.totalAmount, 0);

        const lastMonthRevenue = invoices
          .filter(inv => {
            if (inv.status !== 'paid') return false;
            const invoiceDate = new Date(inv.paidDate || inv.issueDate);
            return invoiceDate.getMonth() === lastMonth && invoiceDate.getFullYear() === lastMonthYear;
          })
          .reduce((sum, inv) => sum + inv.totalAmount, 0);

        return {
          totalInvoices,
          totalRevenue,
          pendingAmount,
          overdueAmount,
          thisMonthRevenue,
          lastMonthRevenue,
        };
      },
    }),
    {
      name: 'invoicing-storage',
      partialize: (state) => ({
        invoices: state.invoices,
        customers: state.customers,
        templates: state.templates,
        nextInvoiceNumber: state.nextInvoiceNumber,
      }),
    }
  )
);
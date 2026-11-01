// src/utils/invoiceStats.ts - Fatture in sospeso e fatturato mensile

interface InvoiceData {
  type?: string;
  status: string;
  totalAmount?: number;
  issueDate?: string;
  dueDate?: string;
  paidDate?: string;
}

const sameMonth = (date: Date, year: number, month: number) =>
  date.getFullYear() === year && date.getMonth() === month;

export const calculateInvoiceStats = (invoices: InvoiceData[], today: Date) => {
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const dayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  let pending = 0;
  let overdue = 0;
  let revenue = 0;
  let lastRevenue = 0;

  invoices
    // Fatture fornitori, spese e note di credito non sono ricavi
    .filter((invoice) => !invoice.type || invoice.type === 'customer')
    .forEach((invoice) => {
      if (['draft', 'sent', 'overdue'].includes(invoice.status)) {
        pending++;
        const isLate = !!invoice.dueDate && invoice.dueDate.slice(0, 10) < dayKey;
        if (invoice.status === 'overdue' || (invoice.status === 'sent' && isLate)) {
          overdue++;
        }
      }

      if (invoice.status === 'paid') {
        // Le fatture segnate pagate prima di questa versione non hanno paidDate
        const paidOn = new Date(invoice.paidDate || invoice.issueDate || 0);
        const amount = invoice.totalAmount ?? 0;

        if (sameMonth(paidOn, today.getFullYear(), today.getMonth())) revenue += amount;
        if (sameMonth(paidOn, lastMonth.getFullYear(), lastMonth.getMonth())) lastRevenue += amount;
      }
    });

  return {
    pending,
    overdue,
    revenue: Math.round(revenue * 100) / 100,
    growth: lastRevenue > 0 ? ((revenue - lastRevenue) / lastRevenue) * 100 : 0,
  };
};

// src/screens/mechanic/InvoicingDashboardScreen.tsx
import { useNavigation } from '@react-navigation/native';
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  CreditCard,
  DollarSign,
  FileText,
  Filter,
  Plus,
  TrendingUp,
  Users,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useStore } from '../../store';
import { useInvoicingStore, Invoice, InvoiceStatus } from '../../store/invoicingStore';

import { mechanicButton, mechanicButtonText, mechanicCard, mechanicStaticColors, useMechanicTheme, useMechanicBreakpoints } from './mechanicTheme';
import MechanicTextInput from './MechanicTextInput';
import { MechanicEmptyState, MechanicLoadingState } from './MechanicStates';

import MechanicHeader from './MechanicHeader';
const InvoicingDashboardScreen = () => {
  const navigation = useNavigation();
  const theme = useMechanicTheme();
  const { user } = useStore();
  const { invoices, customers, fetchInvoices, fetchCustomers, getInvoiceStats, updateInvoiceStatus } = useInvoicingStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const { isMobile } = useMechanicBreakpoints();

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  // Carica i dati all'apertura: senza dati in store la lista mostrerebbe un falso vuoto.
  // In sequenza perché isLoading ed error dello store sono condivisi tra le due letture
  const loadInvoicingData = useCallback(async () => {
    if (!user?.id) {
      setInitialLoading(false);
      return;
    }
    setInitialLoading(true);
    await fetchInvoices(user.id);
    const invoicesFailed = !!useInvoicingStore.getState().error;
    await fetchCustomers(user.id);
    setLoadFailed(invoicesFailed || !!useInvoicingStore.getState().error);
    setInitialLoading(false);
  }, [user?.id, fetchInvoices, fetchCustomers]);

  useEffect(() => {
    loadInvoicingData();
  }, [loadInvoicingData]);

  const stats = useMemo(() => getInvoiceStats(), [invoices]);

  // Filtra le fatture
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch =
        invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.notes?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter = filterStatus === 'all' || invoice.status === filterStatus;

      return matchesSearch && matchesFilter;
    });
  }, [invoices, searchQuery, filterStatus]);

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft': return theme.neutral;
      case 'sent': return theme.primary;
      case 'paid': return theme.success;
      case 'overdue': return theme.error;
      case 'cancelled': return theme.neutral;
      default: return theme.textSecondary;
    }
  };

  const getStatusText = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft': return 'Bozza';
      case 'sent': return 'Inviata';
      case 'paid': return 'Pagata';
      case 'overdue': return 'Scaduta';
      case 'cancelled': return 'Annullata';
      default: return status;
    }
  };

  const handleMarkAsPaid = (invoiceId: string) => {
    updateInvoiceStatus(invoiceId, 'paid');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, iconBg, iconColor, trend }: any) => (
    <View style={[
      styles.statCard,
      { backgroundColor: theme.surface, borderColor: theme.border }
    ]}>
      <View style={styles.statCardHeader}>
        <View style={styles.statCardInfo}>
          <Text style={[styles.statCardTitle, { color: theme.textSecondary }]}>{title}</Text>
          <Text style={[styles.statCardValue, { color: theme.text }]}>{value}</Text>
          {subtitle && (
            <Text style={[styles.statCardSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
          )}
        </View>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <Icon size={24} color={iconColor} />
        </View>
      </View>
      {trend && (
        <View style={styles.trendContainer}>
          <TrendingUp size={16} color={trend > 0 ? theme.success : theme.error} />
          <Text style={[
            styles.trendText,
            { color: trend > 0 ? theme.success : theme.error }
          ]}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}% vs mese scorso
          </Text>
        </View>
      )}
    </View>
  );

  const renderInvoiceCard = ({ item: invoice }: { item: Invoice }) => {
    const customer = customers.find(c => c.id === invoice.customerId);
    const isOverdue = invoice.status === 'sent' && new Date(invoice.dueDate) < new Date();

    return (
      <TouchableOpacity
        style={[styles.invoiceCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: invoice.id })}
        activeOpacity={0.7}
      >
        <View style={styles.invoiceCardHeader}>
          <View style={styles.invoiceMainInfo}>
            <Text style={[styles.invoiceNumber, { color: theme.text }]}>
              {invoice.number}
            </Text>
            <Text style={[styles.customerName, { color: theme.textSecondary }]}>
              {invoice.customerName}
            </Text>
            <Text style={[styles.invoiceDate, { color: theme.textSecondary }]}>
              {formatDate(invoice.issueDate)}
            </Text>
          </View>

          <View style={styles.invoiceAmountContainer}>
            <Text style={[styles.invoiceAmount, { color: theme.text }]}>
              {formatCurrency(invoice.totalAmount)}
            </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(invoice.status) + '20' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: getStatusColor(invoice.status) }
              ]}>
                {getStatusText(invoice.status)}
              </Text>
            </View>
          </View>
        </View>

        {isOverdue && (
          <View style={[styles.overdueWarning, { backgroundColor: theme.error + '20' }]}>
            <AlertCircle size={16} color={theme.error} />
            <Text style={[styles.overdueText, { color: theme.error }]}>
              Scaduta il {formatDate(invoice.dueDate)}
            </Text>
          </View>
        )}

        <View style={styles.invoiceActions}>
          {invoice.status === 'sent' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.success }]}
              onPress={() => handleMarkAsPaid(invoice.id)}
            >
              <CreditCard size={16} color={theme.onPrimary} />
              <Text style={styles.actionButtonText}>Segna come Pagata</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryAction, { borderColor: theme.border }]}
            onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: invoice.id })}
          >
            <FileText size={16} color={theme.primary} />
            <Text style={[styles.secondaryActionText, { color: theme.primary }]}>Dettagli</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilters = () => (
    <View style={[styles.filtersContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.filtersTitle, { color: theme.text }]}>Filtra per stato:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { key: 'all', label: 'Tutte' },
          { key: 'draft', label: 'Bozze' },
          { key: 'sent', label: 'Inviate' },
          { key: 'paid', label: 'Pagate' },
          { key: 'overdue', label: 'Scadute' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              { borderColor: theme.border },
              filterStatus === filter.key && { backgroundColor: theme.primary }
            ]}
            onPress={() => setFilterStatus(filter.key as any)}
          >
            <Text style={[
              styles.filterChipText,
              { color: filterStatus === filter.key ? theme.onPrimary : theme.text }
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const growthRate = stats.lastMonthRevenue > 0
    ? ((stats.thisMonthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100
    : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      <MechanicHeader
        title="Fatturazione"
        subtitle="Gestione fatture e clienti"
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('CreateInvoice')}
            accessibilityRole="button"
            accessibilityLabel="Crea fattura"
          >
            <Plus size={20} color={theme.onPrimary} />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistiche */}
        <View style={[styles.statsGrid, isMobile && styles.statsGridMobile]}>
          <StatCard
            title="Fatturato Totale"
            value={formatCurrency(stats.totalRevenue)}
            subtitle={`${stats.totalInvoices} fatture`}
            icon={DollarSign}
            iconBg={theme.successLight}
            iconColor={theme.success}
            trend={growthRate}
          />
          <StatCard
            title="In Attesa di Pagamento"
            value={formatCurrency(stats.pendingAmount)}
            subtitle="Fatture inviate"
            icon={FileText}
            iconBg={theme.primaryLight}
            iconColor={theme.onPrimaryLight}
          />
          <StatCard
            title="Scadute"
            value={formatCurrency(stats.overdueAmount)}
            subtitle="Richiedono attenzione"
            icon={AlertCircle}
            iconBg={theme.errorLight}
            iconColor={theme.error}
          />
          <StatCard
            title="Questo Mese"
            value={formatCurrency(stats.thisMonthRevenue)}
            subtitle="Entrate confermate"
            icon={TrendingUp}
            iconBg={theme.secondaryLight}
            iconColor={theme.secondary}
          />
        </View>

        {/* Azioni Rapide */}
        <View style={[styles.quickActions, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Azioni Rapide</Text>
          <View style={styles.actionButtonsGrid}>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
              onPress={() => navigation.navigate('CreateInvoice')}
            >
              <Plus size={24} color={theme.primary} />
              <Text style={[styles.quickActionText, { color: theme.primary }]}>Nuova Fattura</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: theme.success + '20', borderColor: theme.success }]}
              onPress={() => navigation.navigate('CustomersList')}
            >
              <Users size={24} color={theme.success} />
              <Text style={[styles.quickActionText, { color: theme.success }]}>Gestisci Clienti</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: theme.warning + '20', borderColor: theme.warning }]}
              onPress={() => navigation.navigate('InvoiceTemplates')}
            >
              <FileText size={24} color={theme.warning} />
              <Text style={[styles.quickActionText, { color: theme.warning }]}>Template</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: theme.textSecondary + '20', borderColor: theme.textSecondary }]}
              onPress={() => navigation.navigate('InvoiceReports')}
            >
              <Calendar size={24} color={theme.textSecondary} />
              <Text style={[styles.quickActionText, { color: theme.textSecondary }]}>Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ricerca e Filtri */}
        <View style={styles.searchContainer}>
          <MechanicTextInput
            variant="search"
            containerStyle={styles.searchInputContainer}
            placeholder="Cerca fatture per numero, cliente o note..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: showFilters ? theme.primary : 'transparent', borderColor: theme.border }]}
            onPress={() => setShowFilters(!showFilters)}
            accessibilityRole="button"
            accessibilityLabel="Filtri"
          >
            <Filter size={20} color={showFilters ? theme.onPrimary : theme.text} />
          </TouchableOpacity>
        </View>

        {showFilters && renderFilters()}

        {/* Lista Fatture */}
        <View style={[styles.invoicesSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Fatture Recenti ({filteredInvoices.length})
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('InvoicesList')}
            >
              <Text style={[styles.seeAllText, { color: theme.primary }]}>Vedi tutte</Text>
            </TouchableOpacity>
          </View>

          {initialLoading ? (
            <MechanicLoadingState text="Caricamento fatture..." />
          ) : loadFailed ? (
            <MechanicEmptyState
              icon={AlertCircle}
              title="Impossibile caricare le fatture"
              subtitle="Controlla la connessione e riprova"
              actionLabel="Riprova"
              onAction={loadInvoicingData}
            />
          ) : filteredInvoices.length === 0 ? (
            <MechanicEmptyState
              icon={FileText}
              title={searchQuery || filterStatus !== 'all' ? 'Nessuna fattura trovata' : 'Nessuna fattura creata'}
              subtitle={searchQuery || filterStatus !== 'all'
                ? 'Prova a modificare i criteri di ricerca'
                : 'Crea la tua prima fattura per iniziare'
              }
              actionLabel={!searchQuery && filterStatus === 'all' ? 'Crea Prima Fattura' : undefined}
              actionIcon={Plus}
              onAction={() => navigation.navigate('CreateInvoice')}
            />
          ) : (
            <FlatList
              data={filteredInvoices.slice(0, 5)} // Mostra solo le prime 5
              renderItem={renderInvoiceCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addButton: mechanicButton.icon,
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statsGridMobile: {
    flexDirection: 'column',
    gap: 12,
  },
  statCard: {
    ...mechanicCard,
    flex: 1,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statCardInfo: {
    flex: 1,
  },
  statCardTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statCardSubtitle: {
    fontSize: 12,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  trendText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  quickActions: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
  },
  filterButton: {
    ...mechanicButton.icon,
    borderWidth: 1,
  },
  filtersContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  invoicesSection: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: mechanicStaticColors.divider,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  invoiceCard: {
    ...mechanicCard,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  invoiceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceMainInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    marginBottom: 2,
  },
  invoiceDate: {
    fontSize: 12,
  },
  invoiceAmountContainer: {
    alignItems: 'flex-end',
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  overdueWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  overdueText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  invoiceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    ...mechanicButton.compact,
    flex: 1,
  },
  secondaryAction: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionButtonText: {
    ...mechanicButtonText.compact,
    color: mechanicStaticColors.onPrimary,
    marginLeft: 6,
  },
  secondaryActionText: {
    ...mechanicButtonText.compact,
    marginLeft: 6,
  },
});

export default InvoicingDashboardScreen;

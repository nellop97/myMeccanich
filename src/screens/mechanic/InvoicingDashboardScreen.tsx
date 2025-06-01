// src/screens/mechanic/InvoicingDashboardScreen.tsx
import { useNavigation } from '@react-navigation/native';
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  FileText,
  Filter,
  Plus,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import {
  Dimensions,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useStore } from '../../store';
import { useInvoicingStore, Invoice, InvoiceStatus } from '../../store/invoicingStore';

const { width: screenWidth } = Dimensions.get('window');

const InvoicingDashboardScreen = () => {
  const navigation = useNavigation();
  const { darkMode } = useStore();
  const { invoices, customers, getInvoiceStats, updateInvoiceStatus } = useInvoicingStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const isDesktop = Platform.OS === 'web' && screenWidth > 768;

  const theme = {
    background: darkMode ? '#111827' : '#f3f4f6',
    cardBackground: darkMode ? '#1f2937' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#9ca3af' : '#6b7280',
    border: darkMode ? '#374151' : '#e5e7eb',
    accent: '#2563eb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  };

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
      case 'draft': return darkMode ? '#6b7280' : '#4b5563';
      case 'sent': return darkMode ? '#3b82f6' : '#2563eb';
      case 'paid': return darkMode ? '#10b981' : '#059669';
      case 'overdue': return darkMode ? '#ef4444' : '#dc2626';
      case 'cancelled': return darkMode ? '#6b7280' : '#4b5563';
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
      isDesktop && styles.statCardDesktop,
      { backgroundColor: theme.cardBackground, borderColor: theme.border }
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
        style={[styles.invoiceCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
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
              <CreditCard size={16} color="#ffffff" />
              <Text style={styles.actionButtonText}>Segna come Pagata</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryAction, { borderColor: theme.border }]}
            onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: invoice.id })}
          >
            <FileText size={16} color={theme.accent} />
            <Text style={[styles.secondaryActionText, { color: theme.accent }]}>Dettagli</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilters = () => (
    <View style={[styles.filtersContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
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
              filterStatus === filter.key && { backgroundColor: theme.accent }
            ]}
            onPress={() => setFilterStatus(filter.key as any)}
          >
            <Text style={[
              styles.filterChipText,
              { color: filterStatus === filter.key ? '#ffffff' : theme.text }
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
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Fatturazione</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Gestione fatture e clienti
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.accent }]}
          onPress={() => navigation.navigate('CreateInvoice')}
        >
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistiche */}
        <View style={[styles.statsGrid, !isDesktop && styles.statsGridMobile]}>
          <StatCard
            title="Fatturato Totale"
            value={formatCurrency(stats.totalRevenue)}
            subtitle={`${stats.totalInvoices} fatture`}
            icon={DollarSign}
            iconBg={darkMode ? '#065f46' : '#d1fae5'}
            iconColor={darkMode ? '#10b981' : '#059669'}
            trend={growthRate}
          />
          <StatCard
            title="In Attesa di Pagamento"
            value={formatCurrency(stats.pendingAmount)}
            subtitle="Fatture inviate"
            icon={FileText}
            iconBg={darkMode ? '#1e3a8a' : '#dbeafe'}
            iconColor={darkMode ? '#60a5fa' : '#2563eb'}
          />
          <StatCard
            title="Scadute"
            value={formatCurrency(stats.overdueAmount)}
            subtitle="Richiedono attenzione"
            icon={AlertCircle}
            iconBg={darkMode ? '#7f1d1d' : '#fee2e2'}
            iconColor={darkMode ? '#ef4444' : '#dc2626'}
          />
          <StatCard
            title="Questo Mese"
            value={formatCurrency(stats.thisMonthRevenue)}
            subtitle="Entrate confermate"
            icon={TrendingUp}
            iconBg={darkMode ? '#581c87' : '#e9d5ff'}
            iconColor={darkMode ? '#a855f7' : '#7c3aed'}
          />
        </View>

        {/* Azioni Rapide */}
        <View style={[styles.quickActions, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Azioni Rapide</Text>
          <View style={styles.actionButtonsGrid}>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: theme.accent + '20', borderColor: theme.accent }]}
              onPress={() => navigation.navigate('CreateInvoice')}
            >
              <Plus size={24} color={theme.accent} />
              <Text style={[styles.quickActionText, { color: theme.accent }]}>Nuova Fattura</Text>
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
        <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Cerca fatture per numero, cliente o note..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: showFilters ? theme.accent : 'transparent', borderColor: theme.border }]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} color={showFilters ? '#ffffff' : theme.text} />
          </TouchableOpacity>
        </View>

        {showFilters && renderFilters()}

        {/* Lista Fatture */}
        <View style={[styles.invoicesSection, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Fatture Recenti ({filteredInvoices.length})
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('InvoicesList')}
            >
              <Text style={[styles.seeAllText, { color: theme.accent }]}>Vedi tutte</Text>
            </TouchableOpacity>
          </View>

          {filteredInvoices.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
                {searchQuery || filterStatus !== 'all' ? 'Nessuna fattura trovata' : 'Nessuna fattura creata'}
              </Text>
              <Text style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}>
                {searchQuery || filterStatus !== 'all' 
                  ? 'Prova a modificare i criteri di ricerca' 
                  : 'Crea la tua prima fattura per iniziare'
                }
              </Text>
              {!searchQuery && filterStatus === 'all' && (
                <TouchableOpacity
                  style={[styles.emptyActionButton, { backgroundColor: theme.accent }]}
                  onPress={() => navigation.navigate('CreateInvoice')}
                >
                  <Plus size={20} color="#ffffff" />
                  <Text style={styles.emptyActionButtonText}>Crea Prima Fattura</Text>
                </TouchableOpacity>
              )}
            </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
    padding: 10,
    borderRadius: 8,
  },
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
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statCardDesktop: {
    padding: 20,
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
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 12,
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
    borderBottomColor: '#f3f4f6',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  invoiceCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
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
    borderRadius: 6,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  secondaryAction: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyActionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default InvoicingDashboardScreen;
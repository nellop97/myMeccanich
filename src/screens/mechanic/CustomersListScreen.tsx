// src/screens/mechanic/CustomersListScreen.tsx
import { useNavigation } from '@react-navigation/native';
import {
  Building,
  ChevronLeft,
  Edit3,
  FileText,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
} from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useStore } from '../../store';
import { useInvoicingStore, Customer } from '../../store/invoicingStore';

const { width: screenWidth } = Dimensions.get('window');

const CustomersListScreen = () => {
  const navigation = useNavigation();
  const { darkMode } = useStore();
  const { customers, deleteCustomer, getInvoicesByCustomer } = useInvoicingStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  
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

  // Filtra i clienti in base alla ricerca
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.vatNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.fiscalCode?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customers, searchQuery]);

  const handleDeleteCustomer = (customerId: string, customerName: string) => {
    const customerInvoices = getInvoicesByCustomer(customerId);
    
    if (customerInvoices.length > 0) {
      Alert.alert(
        'Impossibile eliminare',
        `Il cliente ${customerName} ha ${customerInvoices.length} fatture associate. Elimina prima le fatture.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Conferma eliminazione',
      `Sei sicuro di voler eliminare il cliente ${customerName}?`,
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Elimina', 
          style: 'destructive',
          onPress: () => deleteCustomer(customerId)
        }
      ]
    );
  };

  const formatCustomerStats = (customer: Customer) => {
    const invoices = getInvoicesByCustomer(customer.id);
    const totalAmount = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    return {
      invoicesCount: invoices.length,
      totalAmount,
      lastInvoiceDate: invoices.length > 0 
        ? Math.max(...invoices.map(inv => new Date(inv.issueDate).getTime()))
        : null
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const renderCustomerCard = ({ item: customer }: { item: Customer }) => {
    const stats = formatCustomerStats(customer);
    
    return (
      <TouchableOpacity
        style={[styles.customerCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
        onPress={() => navigation.navigate('CustomerDetail', { customerId: customer.id })}
        activeOpacity={0.7}
      >
        <View style={styles.customerHeader}>
          <View style={styles.customerMainInfo}>
            <View style={styles.customerNameRow}>
              <View style={[
                styles.customerTypeIcon,
                { backgroundColor: customer.isCompany ? theme.warning + '20' : theme.accent + '20' }
              ]}>
                {customer.isCompany ? (
                  <Building size={20} color={customer.isCompany ? theme.warning : theme.accent} />
                ) : (
                  <User size={20} color={customer.isCompany ? theme.warning : theme.accent} />
                )}
              </View>
              <View style={styles.customerNameContainer}>
                <Text style={[styles.customerName, { color: theme.text }]}>
                  {customer.name}
                </Text>
                <Text style={[styles.customerType, { color: theme.textSecondary }]}>
                  {customer.isCompany ? 'Azienda' : 'Privato'}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.customerActions}>
            <TouchableOpacity
              style={[styles.actionIconButton, { backgroundColor: theme.accent + '20' }]}
              onPress={() => navigation.navigate('EditCustomer', { customerId: customer.id })}
            >
              <Edit3 size={16} color={theme.accent} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionIconButton, { backgroundColor: theme.error + '20' }]}
              onPress={() => handleDeleteCustomer(customer.id, customer.name)}
            >
              <Trash2 size={16} color={theme.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.customerDetails}>
          {customer.email && (
            <View style={styles.detailRow}>
              <Mail size={14} color={theme.textSecondary} />
              <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                {customer.email}
              </Text>
            </View>
          )}
          
          {customer.phone && (
            <View style={styles.detailRow}>
              <Phone size={14} color={theme.textSecondary} />
              <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                {customer.phone}
              </Text>
            </View>
          )}

          {customer.isCompany && customer.vatNumber && (
            <View style={styles.detailRow}>
              <Building size={14} color={theme.textSecondary} />
              <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                P.IVA: {customer.vatNumber}
              </Text>
            </View>
          )}

          {!customer.isCompany && customer.fiscalCode && (
            <View style={styles.detailRow}>
              <User size={14} color={theme.textSecondary} />
              <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                C.F.: {customer.fiscalCode}
              </Text>
            </View>
          )}

          {customer.address && (
            <View style={styles.detailRow}>
              <Text style={[styles.addressText, { color: theme.textSecondary }]}>
                {customer.address}
                {customer.city && `, ${customer.city}`}
                {customer.postalCode && ` ${customer.postalCode}`}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.customerStats, { borderColor: theme.border }]}>
          <View style={styles.statItem}>
            <FileText size={16} color={theme.accent} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {stats.invoicesCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              {stats.invoicesCount === 1 ? 'Fattura' : 'Fatture'}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.success }]}>
              {formatCurrency(stats.totalAmount)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Fatturato
            </Text>
          </View>

          {stats.lastInvoiceDate && (
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.textSecondary }]}>
                {new Date(stats.lastInvoiceDate).toLocaleDateString('it-IT', {
                  day: '2-digit',
                  month: '2-digit'
                })}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Ultima fattura
              </Text>
            </View>
          )}
        </View>

        <View style={styles.customerActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.accent }]}
            onPress={() => navigation.navigate('CreateInvoice', { customerId: customer.id })}
          >
            <FileText size={16} color="#ffffff" />
            <Text style={styles.actionButtonText}>Nuova Fattura</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryAction, { borderColor: theme.border }]}
            onPress={() => navigation.navigate('CustomerDetail', { customerId: customer.id })}
          >
            <Text style={[styles.secondaryActionText, { color: theme.accent }]}>Dettagli</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStats = () => {
    const totalCustomers = customers.length;
    const companyCustomers = customers.filter(c => c.isCompany).length;
    const privateCustomers = customers.filter(c => !c.isCompany).length;

    return (
      <View style={[styles.statsContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.text }]}>{totalCustomers}</Text>
          <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Clienti Totali</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.warning }]}>{companyCustomers}</Text>
          <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Aziende</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.accent }]}>{privateCustomers}</Text>
          <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Privati</Text>
        </View>
      </View>
    );
  };

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
          <Text style={[styles.headerTitle, { color: theme.text }]}>Clienti</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Gestisci i tuoi clienti
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.accent }]}
          onPress={() => navigation.navigate('AddCustomer')}
        >
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Statistiche */}
      {renderStats()}

      {/* Barra di ricerca */}
      <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Search size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Cerca clienti per nome, email o codici..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Lista Clienti */}
      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomerCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <User size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
              {searchQuery ? 'Nessun cliente trovato' : 'Nessun cliente registrato'}
            </Text>
            <Text style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}>
              {searchQuery 
                ? 'Prova a modificare i criteri di ricerca' 
                : 'Aggiungi il tuo primo cliente per iniziare'
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={[styles.emptyActionButton, { backgroundColor: theme.accent }]}
                onPress={() => navigation.navigate('AddCustomer')}
              >
                <Plus size={20} color="#ffffff" />
                <Text style={styles.emptyActionButtonText}>Aggiungi Cliente</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
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
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  customerCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  customerMainInfo: {
    flex: 1,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerTypeIcon: {
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  customerNameContainer: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  customerType: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  customerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconButton: {
    padding: 8,
    borderRadius: 6,
  },
  customerDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
  },
  customerStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    margin: 16,
    marginTop: 0,
  },
  secondaryAction: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyActionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default CustomersListScreen;
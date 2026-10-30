// src/screens/mechanic/CustomersListScreen.tsx
import { useNavigation } from '@react-navigation/native';
import {
  AlertCircle,
  Building,
  Edit3,
  FileText,
  Mail,
  Phone,
  Plus,
  Trash2,
  User,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useStore } from '../../store';
import { useInvoicingStore, Customer } from '../../store/invoicingStore';

import { mechanicButton, mechanicButtonText, mechanicCard, mechanicStaticColors, useMechanicTheme, useMechanicBreakpoints } from './mechanicTheme';
import MechanicTextInput from './MechanicTextInput';
import { MechanicEmptyState, MechanicLoadingState } from './MechanicStates';

import MechanicHeader from './MechanicHeader';
const CustomersListScreen = () => {
  const navigation = useNavigation();
  const theme = useMechanicTheme();
  const { user } = useStore();
  const { customers, fetchCustomers, deleteCustomer, getInvoicesByCustomer } = useInvoicingStore();

  const [searchQuery, setSearchQuery] = useState('');

  const { isDesktop } = useMechanicBreakpoints();

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  // Carica i clienti all'apertura: senza dati in store la lista mostrerebbe un falso vuoto
  const loadCustomers = useCallback(async () => {
    if (!user?.id) {
      setInitialLoading(false);
      return;
    }
    setInitialLoading(true);
    await fetchCustomers(user.id);
    setLoadFailed(!!useInvoicingStore.getState().error);
    setInitialLoading(false);
  }, [user?.id, fetchCustomers]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

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
        style={[styles.customerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => navigation.navigate('CustomerDetail', { customerId: customer.id })}
        activeOpacity={0.7}
      >
        <View style={styles.customerHeader}>
          <View style={styles.customerMainInfo}>
            <View style={styles.customerNameRow}>
              <View style={[
                styles.customerTypeIcon,
                { backgroundColor: customer.isCompany ? theme.warning + '20' : theme.primary + '20' }
              ]}>
                {customer.isCompany ? (
                  <Building size={20} color={customer.isCompany ? theme.warning : theme.primary} />
                ) : (
                  <User size={20} color={customer.isCompany ? theme.warning : theme.primary} />
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
              style={[styles.actionIconButton, { backgroundColor: theme.primary + '20' }]}
              onPress={() => navigation.navigate('EditCustomer', { customerId: customer.id })}
            >
              <Edit3 size={16} color={theme.primary} />
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
            <FileText size={16} color={theme.primary} />
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
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('CreateInvoice', { customerId: customer.id })}
          >
            <FileText size={16} color={theme.onPrimary} />
            <Text style={styles.actionButtonText}>Nuova Fattura</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryAction, { borderColor: theme.border }]}
            onPress={() => navigation.navigate('CustomerDetail', { customerId: customer.id })}
          >
            <Text style={[styles.secondaryActionText, { color: theme.primary }]}>Dettagli</Text>
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
      <View style={[styles.statsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.text }]}>{totalCustomers}</Text>
          <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Clienti Totali</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.warning }]}>{companyCustomers}</Text>
          <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Aziende</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.primary }]}>{privateCustomers}</Text>
          <Text style={[styles.statTitle, { color: theme.textSecondary }]}>Privati</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      <MechanicHeader
        title="Clienti"
        subtitle="Gestisci i tuoi clienti"
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('AddCustomer')}
            accessibilityRole="button"
            accessibilityLabel="Aggiungi cliente"
          >
            <Plus size={20} color={theme.onPrimary} />
          </TouchableOpacity>
        }
      />

      {/* Statistiche */}
      {renderStats()}

      {/* Barra di ricerca */}
      <MechanicTextInput
        variant="search"
        containerStyle={styles.searchContainer}
        placeholder="Cerca clienti per nome, email o codici..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Lista Clienti */}
      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomerCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          initialLoading ? (
            <MechanicLoadingState text="Caricamento clienti..." />
          ) : loadFailed ? (
            <MechanicEmptyState
              icon={AlertCircle}
              title="Impossibile caricare i clienti"
              subtitle="Controlla la connessione e riprova"
              actionLabel="Riprova"
              onAction={loadCustomers}
            />
          ) : (
            <MechanicEmptyState
              icon={User}
              title={searchQuery ? 'Nessun cliente trovato' : 'Nessun cliente registrato'}
              subtitle={searchQuery
                ? 'Prova a modificare i criteri di ricerca'
                : 'Aggiungi il tuo primo cliente per iniziare'
              }
              actionLabel={searchQuery ? undefined : 'Aggiungi Cliente'}
              actionIcon={Plus}
              onAction={() => navigation.navigate('AddCustomer')}
            />
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addButton: mechanicButton.icon,
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
    marginHorizontal: 16,
    marginTop: 16,
  },
  listContainer: {
    padding: 16,
  },
  customerCard: {
    ...mechanicCard,
    padding: 0,
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
    borderRadius: 8,
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
    ...mechanicButton.compact,
    flex: 1,
    margin: 16,
    marginTop: 0,
  },
  secondaryAction: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionButtonText: {
    ...mechanicButtonText.compact,
    color: mechanicStaticColors.onPrimary,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CustomersListScreen;

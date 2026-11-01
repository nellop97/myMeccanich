// src/screens/mechanic/CustomerDetailScreen.tsx
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  Linking
} from 'react-native';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Car,
  Wrench,
  FileText,
  Calendar,
  Edit,
  Clock,
  CheckCircle,
  AlertCircle,
  Building,
  Hash,
  ChevronRight
} from 'lucide-react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useStore } from '../../store';
import type { Invoice, InvoiceStatus } from '../../store/invoicingStore';
import type { Repair, WorkshopCar } from '../../store/workshopStore';

import { mechanicButton, mechanicCard, mechanicStaticColors, useMechanicTheme } from './mechanicTheme';

import MechanicHeader from './MechanicHeader';
import { MechanicEmptyState, MechanicLoadingState } from './MechanicStates';
import { showAlert } from '../../utils/platformHelpers';

interface CustomerDetail {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  cityLine?: string;
  vatNumber?: string;
  fiscalCode?: string;
  sdiCode?: string;
  pecEmail?: string;
  isCompany: boolean;
  notes?: string;
}

interface CustomerRepair extends Repair {
  car: WorkshopCar;
}

type LoadStatus = 'loading' | 'ready' | 'notFound' | 'accessDenied' | 'error';

const cleanText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  return value.trim() || undefined;
};

// name viene prima: la modifica cliente aggiorna name ma non firstName e lastName
const mapCustomer = (id: string, data: Record<string, any>): CustomerDetail => {
  const fullName = [cleanText(data.firstName), cleanText(data.lastName)].filter(Boolean).join(' ');
  const personName = cleanText(data.name) || fullName;
  const isCompany = !!data.isCompany;
  const companyName = isCompany ? cleanText(data.companyName) : undefined;
  const province = cleanText(data.province);
  const city = [cleanText(data.postalCode), cleanText(data.city)].filter(Boolean).join(' ');

  return {
    id,
    name: companyName || personName || 'Cliente senza nome',
    email: cleanText(data.email),
    phone: cleanText(data.phone),
    address: cleanText(data.address),
    cityLine: [city, province && `(${province})`].filter(Boolean).join(' ') || undefined,
    vatNumber: cleanText(data.vatNumber),
    fiscalCode: cleanText(data.fiscalCode),
    sdiCode: cleanText(data.sdiCode),
    pecEmail: cleanText(data.pecEmail) || cleanText(data.pec),
    isCompany,
    notes: cleanText(data.notes),
  };
};

const getInitials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('');

const getWhatsAppNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (phone.trim().startsWith('+')) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  return `39${digits}`; // Numero nazionale: wa.me vuole il prefisso internazionale
};

const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Bozza',
  sent: 'In attesa',
  paid: 'Pagata',
  overdue: 'Scaduta',
  cancelled: 'Annullata',
};

const REPAIR_STATUS_LABELS: Record<Repair['status'], string> = {
  pending: 'In attesa',
  in_progress: 'In corso',
  ready: 'Pronta per il ritiro',
  completed: 'Completato',
  cancelled: 'Annullato',
};

const CustomerDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const customerId = (route.params as { customerId?: string } | undefined)?.customerId;
  const { user } = useStore();
  const theme = useMechanicTheme();
  const workshopId = user?.id;

  const [activeTab, setActiveTab] = useState<'info' | 'vehicles' | 'invoices' | 'history'>('info');
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [vehicles, setVehicles] = useState<WorkshopCar[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vehiclesFailed, setVehiclesFailed] = useState(false);
  const [invoicesFailed, setInvoicesFailed] = useState(false);
  const lastRequest = useRef(0);

  const loadInvoices = useCallback(async (id: string, ownerId: string) => {
    // Due uguaglianze senza orderBy: bastano gli indici semplici, l'ordine è lato client
    const snapshot = await getDocs(query(
      collection(db, 'invoices'),
      where('workshopId', '==', ownerId),
      where('customerId', '==', id)
    ));
    return snapshot.docs
      .map(item => ({ ...item.data(), id: item.id }) as Invoice)
      .sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || ''));
  }, []);

  const loadVehicles = useCallback(async (id: string, ownerId: string) => {
    // ownerId coincide col cliente solo per le auto create scegliendo un documento customers:
    // chi è stato scelto tra gli utenti registrati ha l'id di users e qui non compare
    const snapshot = await getDocs(query(
      collection(db, 'workshopCars'),
      where('workshopId', '==', ownerId),
      where('ownerId', '==', id)
    ));
    return snapshot.docs
      .map(item => ({ ...item.data(), id: item.id }) as WorkshopCar)
      .filter(car => car.isActive !== false);
  }, []);

  const loadData = useCallback(async () => {
    const request = ++lastRequest.current;
    const isCurrent = () => request === lastRequest.current;

    if (!customerId) {
      setStatus('notFound');
      return;
    }
    if (!workshopId) {
      setStatus('error');
      return;
    }

    // Al ritorno da modifica o nuova fattura i dati restano visibili durante l'aggiornamento
    setStatus(current => (current === 'ready' ? current : 'loading'));

    try {
      const customerSnap = await getDoc(doc(db, 'customers', customerId));
      if (!isCurrent()) return;

      if (!customerSnap.exists()) {
        setStatus('notFound');
        return;
      }

      const [invoicesResult, vehiclesResult] = await Promise.allSettled([
        loadInvoices(customerId, workshopId),
        loadVehicles(customerId, workshopId),
      ]);
      if (!isCurrent()) return;

      setCustomer(mapCustomer(customerSnap.id, customerSnap.data()));

      if (invoicesResult.status === 'fulfilled') {
        setInvoices(invoicesResult.value);
      } else {
        console.error('Errore caricamento fatture cliente:', invoicesResult.reason);
      }
      setInvoicesFailed(invoicesResult.status === 'rejected');

      if (vehiclesResult.status === 'fulfilled') {
        setVehicles(vehiclesResult.value);
      } else {
        console.error('Errore caricamento veicoli cliente:', vehiclesResult.reason);
      }
      setVehiclesFailed(vehiclesResult.status === 'rejected');

      setStatus('ready');
    } catch (error: any) {
      if (!isCurrent()) return;
      console.error('Errore caricamento cliente:', error);
      // Le regole leggono resource.data: permission-denied arriva anche su un documento
      // inesistente, quindi non distingue tra cliente assente e cliente di un altro meccanico
      setStatus(error?.code === 'permission-denied' ? 'accessDenied' : 'error');
    }
  }, [customerId, workshopId, loadInvoices, loadVehicles]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const repairs = useMemo<CustomerRepair[]>(() => (
    vehicles
      .flatMap(car => (car.repairs || []).map(repair => ({ ...repair, car })))
      .sort((a, b) => (b.scheduledDate || '').localeCompare(a.scheduledDate || ''))
  ), [vehicles]);

  const stats = useMemo(() => ({
    totalPaid: invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0),
    pendingInvoices: invoices.filter(invoice => invoice.status === 'sent' || invoice.status === 'overdue').length,
    completedRepairs: repairs.filter(repair => repair.status === 'completed').length,
  }), [invoices, repairs]);

  const openLink = async (url: string, failureMessage: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Errore apertura collegamento:', error);
      showAlert('Errore', failureMessage);
    }
  };

  const handleCall = () => {
    if (customer?.phone) {
      openLink(`tel:${customer.phone.replace(/\s+/g, '')}`, 'Impossibile avviare la chiamata');
    }
  };

  const handleEmail = () => {
    if (customer?.email) {
      openLink(`mailto:${customer.email}`, "Impossibile aprire l'email");
    }
  };

  const handleWhatsApp = () => {
    if (customer?.phone) {
      openLink(`https://wa.me/${getWhatsAppNumber(customer.phone)}`, 'Impossibile aprire WhatsApp');
    }
  };

  const openRepair = (carId: string, repairId: string) => {
    navigation.navigate('RepairPartsManagement', { carId, repairId });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const formatDate = (dateString?: string) => {
    const date = dateString ? new Date(dateString) : null;
    if (!date || isNaN(date.getTime())) return 'Data non indicata';
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (value: string) => {
    switch (value) {
      case 'paid':
      case 'completed':
        return theme.success;
      case 'sent':
      case 'pending':
      case 'in_progress':
        return theme.warning;
      case 'overdue':
        return theme.error;
      default:
        return theme.textSecondary;
    }
  };

  const renderLoadError = (title: string, subtitle = 'Controlla la connessione e riprova') => (
    <MechanicEmptyState
      icon={AlertCircle}
      title={title}
      subtitle={subtitle}
      actionLabel="Riprova"
      onAction={loadData}
    />
  );

  const renderInfoTab = (current: CustomerDetail) => {
    const hasAddress = !!(current.address || current.cityLine);
    const hasFiscalData = !!(current.vatNumber || current.fiscalCode || current.sdiCode || current.pecEmail);

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.infoContent}>
        {/* Contact Info */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Informazioni Contatto
          </Text>

          {current.phone && (
            <TouchableOpacity
              style={styles.infoRow}
              onPress={handleCall}
              accessibilityRole="button"
              accessibilityLabel={`Chiama ${current.phone}`}
            >
              <Phone size={18} color={theme.textSecondary} />
              <Text style={[styles.infoText, { color: theme.text }]}>
                {current.phone}
              </Text>
              <ChevronRight size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          )}

          {current.email && (
            <TouchableOpacity
              style={styles.infoRow}
              onPress={handleEmail}
              accessibilityRole="button"
              accessibilityLabel={`Scrivi a ${current.email}`}
            >
              <Mail size={18} color={theme.textSecondary} />
              <Text style={[styles.infoText, { color: theme.text }]}>
                {current.email}
              </Text>
              <ChevronRight size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          )}

          {hasAddress && (
            <View style={styles.infoRow}>
              <MapPin size={18} color={theme.textSecondary} />
              <View style={styles.addressContainer}>
                {current.address && (
                  <Text style={[styles.infoText, { color: theme.text }]}>
                    {current.address}
                  </Text>
                )}
                {current.cityLine && (
                  <Text style={[styles.cityText, { color: theme.textSecondary }]}>
                    {current.cityLine}
                  </Text>
                )}
              </View>
            </View>
          )}

          {!current.phone && !current.email && !hasAddress && (
            <Text style={[styles.notesText, { color: theme.textSecondary }]}>
              Nessun recapito registrato
            </Text>
          )}
        </View>

        {/* Fiscal Info */}
        {hasFiscalData && (
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Dati Fiscali
            </Text>

            {([
              { label: 'Partita IVA', value: current.vatNumber, icon: Building },
              { label: 'Codice Fiscale', value: current.fiscalCode, icon: Hash },
              { label: 'Codice SDI', value: current.sdiCode, icon: Hash },
              { label: 'Email PEC', value: current.pecEmail, icon: Mail },
            ]).filter(row => row.value).map(({ label, value, icon: Icon }) => (
              <View key={label} style={styles.infoRow}>
                <Icon size={18} color={theme.textSecondary} />
                <View style={styles.addressContainer}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                    {label}
                  </Text>
                  <Text style={[styles.infoText, { color: theme.text }]}>
                    {value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {current.notes && (
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Note
            </Text>
            <Text style={[styles.notesText, { color: theme.textSecondary }]}>
              {current.notes}
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('CreateInvoice', { customerId: current.id })}
            accessibilityRole="button"
          >
            <FileText size={20} color={theme.onPrimary} />
            <Text style={styles.quickActionText}>Nuova Fattura</Text>
          </TouchableOpacity>

          {current.phone && (
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: theme.success }]}
              onPress={handleWhatsApp}
              accessibilityRole="button"
            >
              <Phone size={20} color={theme.onPrimary} />
              <Text style={styles.quickActionText}>WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderVehicleCard = (vehicle: WorkshopCar) => {
    const carRepairs = repairs.filter(repair => repair.car.id === vehicle.id);
    const lastRepair = carRepairs[0];
    const details = [vehicle.year, vehicle.licensePlate].filter(Boolean).join(' • ');

    const content = (
      <>
        <View style={styles.vehicleHeader}>
          <View style={styles.addressContainer}>
            <Text style={[styles.vehicleName, { color: theme.text }]}>
              {vehicle.make} {vehicle.model}
            </Text>
            <Text style={[styles.vehicleInfo, { color: theme.textSecondary }]}>
              {details}
            </Text>
          </View>
          {lastRepair && <ChevronRight size={20} color={theme.textSecondary} />}
        </View>

        <View style={styles.vehicleStats}>
          <View style={styles.vehicleStat}>
            <Wrench size={16} color={theme.textSecondary} />
            <Text style={[styles.vehicleStatText, { color: theme.textSecondary }]}>
              {carRepairs.length === 1 ? '1 intervento' : `${carRepairs.length} interventi`}
            </Text>
          </View>
          {lastRepair && (
            <View style={styles.vehicleStat}>
              <Calendar size={16} color={theme.textSecondary} />
              <Text style={[styles.vehicleStatText, { color: theme.textSecondary }]}>
                {formatDate(lastRepair.scheduledDate)}
              </Text>
            </View>
          )}
        </View>
      </>
    );

    const cardStyle = [styles.vehicleCard, { backgroundColor: theme.surface, borderColor: theme.border }];

    // La scheda veicolo CarDetail legge solo la collezione vehicles: si apre l'ultimo intervento
    if (!lastRepair) {
      return <View style={cardStyle}>{content}</View>;
    }

    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={() => openRepair(vehicle.id, lastRepair.id)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Apri ultimo intervento di ${vehicle.make} ${vehicle.model}`}
      >
        {content}
      </TouchableOpacity>
    );
  };

  const renderInvoiceCard = (invoice: Invoice) => {
    const StatusIcon = invoice.status === 'paid' ? CheckCircle :
                      invoice.status === 'overdue' ? AlertCircle : Clock;
    const statusColor = getStatusColor(invoice.status);

    // InvoiceDetail è ancora un segnaposto: la card resta informativa
    return (
      <View style={[styles.invoiceCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.invoiceHeader}>
          <View style={styles.addressContainer}>
            <Text style={[styles.invoiceNumber, { color: theme.text }]}>
              {invoice.number}
            </Text>
            <Text style={[styles.invoiceDate, { color: theme.textSecondary }]}>
              {formatDate(invoice.issueDate)}
            </Text>
          </View>
          <View style={styles.invoiceRight}>
            <Text style={[styles.invoiceAmount, { color: theme.text }]}>
              {formatCurrency(invoice.totalAmount)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <StatusIcon size={14} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderRepairCard = (repair: CustomerRepair) => {
    const statusColor = getStatusColor(repair.status);

    return (
      <TouchableOpacity
        style={[styles.serviceCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => openRepair(repair.car.id, repair.id)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Apri intervento: ${repair.description}`}
      >
        <View style={styles.serviceHeader}>
          <View style={styles.addressContainer}>
            <Text style={[styles.serviceDescription, { color: theme.text }]}>
              {repair.description}
            </Text>
            <Text style={[styles.serviceVehicle, { color: theme.textSecondary }]}>
              {repair.car.make} {repair.car.model} • {repair.car.licensePlate}
            </Text>
          </View>
          {repair.totalCost > 0 && (
            <Text style={[styles.serviceAmount, { color: theme.text }]}>
              {formatCurrency(repair.totalCost)}
            </Text>
          )}
        </View>
        <View style={styles.serviceFooter}>
          <Text style={[styles.serviceDate, { color: theme.textSecondary }]}>
            {formatDate(repair.scheduledDate)}
          </Text>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {REPAIR_STATUS_LABELS[repair.status] || repair.status}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const statusBar = (
    <StatusBar
      barStyle={theme.isDark ? 'light-content' : 'dark-content'}
      backgroundColor={theme.background}
    />
  );

  if (status !== 'ready' || !customer) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {statusBar}
        <MechanicHeader title="Dettaglio Cliente" onBack={() => navigation.goBack()} />
        {status === 'notFound' ? (
          <MechanicEmptyState
            icon={User}
            title="Cliente non trovato"
            subtitle="Il cliente non esiste più o non appartiene alla tua officina"
            actionLabel="Torna indietro"
            onAction={() => navigation.goBack()}
          />
        ) : status === 'accessDenied' ? (
          renderLoadError(
            'Impossibile accedere a questo cliente',
            'La scheda potrebbe non essere più disponibile o non essere accessibile dal tuo account'
          )
        ) : status === 'error' ? (
          renderLoadError('Impossibile caricare il cliente')
        ) : (
          <MechanicLoadingState text="Caricamento cliente..." />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {statusBar}

      <MechanicHeader
        title={customer.name}
        subtitle={`Cliente ${customer.isCompany ? 'Business' : 'Privato'}`}
        onBack={() => navigation.goBack()}
        leading={
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>
              {getInitials(customer.name)}
            </Text>
          </View>
        }
        right={
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => navigation.navigate('EditCustomer', { customerId: customer.id })}
            accessibilityRole="button"
            accessibilityLabel="Modifica cliente"
          >
            <Edit size={24} color={theme.text} />
          </TouchableOpacity>
        }
      />

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statValue, { color: theme.primary }]}>
            {invoicesFailed ? '—' : formatCurrency(stats.totalPaid)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Totale Pagato
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statValue, { color: theme.success }]}>
            {vehiclesFailed ? '—' : vehicles.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Veicoli Attivi
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statValue, { color: theme.primary }]}>
            {vehiclesFailed ? '—' : stats.completedRepairs}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Interventi Completati
          </Text>
        </View>

        {!invoicesFailed && stats.pendingInvoices > 0 && (
          <View style={[styles.statCard, { backgroundColor: theme.warning + '10', borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: theme.warning }]}>
              {stats.pendingInvoices}
            </Text>
            <Text style={[styles.statLabel, { color: theme.warning }]}>
              Fatture in Attesa
            </Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs} accessibilityRole="tablist">
        {(['info', 'vehicles', 'invoices', 'history'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomColor: theme.primary }
            ]}
            onPress={() => setActiveTab(tab)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab ? theme.primary : theme.textSecondary }
            ]}>
              {tab === 'info' ? 'Info' :
               tab === 'vehicles' ? 'Veicoli' :
               tab === 'invoices' ? 'Fatture' : 'Storico'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'info' && renderInfoTab(customer)}

        {activeTab === 'vehicles' && (vehiclesFailed ? renderLoadError('Impossibile caricare i veicoli') : (
          <FlatList
            data={vehicles}
            renderItem={({ item }) => renderVehicleCard(item)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <MechanicEmptyState
                icon={Car}
                title="Nessun veicolo collegato"
                subtitle="I veicoli registrati in officina per questo cliente compariranno qui"
              />
            }
          />
        ))}

        {activeTab === 'invoices' && (invoicesFailed ? renderLoadError('Impossibile caricare le fatture') : (
          <FlatList
            data={invoices}
            renderItem={({ item }) => renderInvoiceCard(item)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <MechanicEmptyState
                icon={FileText}
                title="Nessuna fattura"
                subtitle="Le fatture emesse per questo cliente compariranno qui"
              />
            }
          />
        ))}

        {activeTab === 'history' && (vehiclesFailed ? renderLoadError('Impossibile caricare lo storico') : (
          <FlatList
            data={repairs}
            renderItem={({ item }) => renderRepairCard(item)}
            keyExtractor={(item) => `${item.car.id}_${item.id}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <MechanicEmptyState
                icon={Wrench}
                title="Nessun intervento"
                subtitle="Gli interventi sui veicoli collegati a questo cliente compariranno qui"
              />
            }
          />
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: mechanicStaticColors.onPrimary,
  },
  moreButton: mechanicButton.icon,
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    ...mechanicCard,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: mechanicStaticColors.divider,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  infoContent: {
    paddingTop: 16,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  addressContainer: {
    flex: 1,
  },
  cityText: {
    fontSize: 12,
    marginTop: 2,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickActionButton: {
    ...mechanicButton.primary,
    flex: 1,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: mechanicStaticColors.onPrimary,
  },
  vehicleCard: {
    ...mechanicCard,
    marginBottom: 12,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
  },
  vehicleInfo: {
    fontSize: 14,
    marginTop: 2,
  },
  vehicleStats: {
    flexDirection: 'row',
    gap: 16,
  },
  vehicleStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vehicleStatText: {
    fontSize: 12,
  },
  invoiceCard: {
    ...mechanicCard,
    marginBottom: 12,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  invoiceDate: {
    fontSize: 12,
    marginTop: 2,
  },
  invoiceRight: {
    alignItems: 'flex-end',
  },
  invoiceAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  serviceCard: {
    ...mechanicCard,
    marginBottom: 12,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    fontWeight: '500',
  },
  serviceVehicle: {
    fontSize: 12,
    marginTop: 2,
  },
  serviceAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceDate: {
    fontSize: 12,
  },
});

export default CustomerDetailScreen;
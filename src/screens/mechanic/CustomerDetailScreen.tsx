// src/screens/mechanic/CustomerDetailScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  Modal,
  Alert,
  Linking,
  Platform
} from 'react-native';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Car,
  Wrench,
  FileText,
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Building,
  Hash,
  MoreVertical,
  ChevronRight,
  Download,
  Share2
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStore } from '../../store';

import { mechanicButton, mechanicCard, mechanicStaticColors, useMechanicTheme } from './mechanicTheme';

import MechanicHeader from './MechanicHeader';
interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  vatNumber?: string;
  fiscalCode?: string;
  type: 'private' | 'business';
  notes?: string;
  createdAt: string;
  totalSpent: number;
  activeVehicles: number;
  completedServices: number;
  pendingInvoices: number;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin?: string;
  lastService?: string;
  totalServices: number;
  totalSpent: number;
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate?: string;
  vehicleId?: string;
}

interface Service {
  id: string;
  vehicleId: string;
  date: string;
  description: string;
  amount: number;
  status: 'completed' | 'in-progress' | 'scheduled';
  invoiceId?: string;
}

const CustomerDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { customerId } = route.params as { customerId: string };
  const theme = useMechanicTheme();
  
  const [activeTab, setActiveTab] = useState<'info' | 'vehicles' | 'invoices' | 'history'>('info');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


  // Mock data - in produzione verrebbe dal database
  const customer: Customer = {
    id: customerId,
    name: 'Mario Rossi',
    email: 'mario.rossi@email.com',
    phone: '+39 333 1234567',
    address: 'Via Roma 123',
    city: 'Milano, MI',
    vatNumber: '12345678901',
    fiscalCode: 'RSSMRA80A01H501Z',
    type: 'private',
    notes: 'Cliente affidabile, preferisce essere contattato via WhatsApp',
    createdAt: '2023-01-15',
    totalSpent: 4580.50,
    activeVehicles: 2,
    completedServices: 12,
    pendingInvoices: 1
  };

  const vehicles: Vehicle[] = [
    {
      id: '1',
      make: 'Fiat',
      model: '500',
      year: 2019,
      licensePlate: 'AB123CD',
      vin: 'ZFA3120000J123456',
      lastService: '2025-05-15',
      totalServices: 8,
      totalSpent: 2450.00
    },
    {
      id: '2',
      make: 'Ford',
      model: 'Focus',
      year: 2021,
      licensePlate: 'EF456GH',
      lastService: '2025-06-01',
      totalServices: 4,
      totalSpent: 2130.50
    }
  ];

  const invoices: Invoice[] = [
    {
      id: '1',
      number: 'FT-2025-0156',
      date: '2025-06-01',
      amount: 380.50,
      status: 'pending',
      dueDate: '2025-07-01',
      vehicleId: '2'
    },
    {
      id: '2',
      number: 'FT-2025-0142',
      date: '2025-05-15',
      amount: 520.00,
      status: 'paid',
      vehicleId: '1'
    }
  ];

  const services: Service[] = [
    {
      id: '1',
      vehicleId: '2',
      date: '2025-06-01',
      description: 'Tagliando completo + cambio filtri',
      amount: 380.50,
      status: 'completed',
      invoiceId: '1'
    },
    {
      id: '2',
      vehicleId: '1',
      date: '2025-05-15',
      description: 'Sostituzione pastiglie freni anteriori',
      amount: 520.00,
      status: 'completed',
      invoiceId: '2'
    }
  ];

  const handleCall = () => {
    if (customer.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  };

  const handleEmail = () => {
    if (customer.email) {
      Linking.openURL(`mailto:${customer.email}`);
    }
  };

  const handleWhatsApp = () => {
    if (customer.phone) {
      const phoneNumber = customer.phone.replace(/\s+/g, '');
      Linking.openURL(`whatsapp://send?phone=${phoneNumber}`);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Elimina Cliente',
      `Sei sicuro di voler eliminare ${customer.name}? Questa azione eliminerà anche tutti i dati associati.`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => {
            // Logica eliminazione
            navigation.goBack();
          }
        }
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return theme.success;
      case 'pending':
      case 'in-progress':
      case 'scheduled':
        return theme.warning;
      case 'overdue':
        return theme.error;
      default:
        return theme.textSecondary;
    }
  };

  const renderInfoTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Contact Info */}
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          Informazioni Contatto
        </Text>
        
        <TouchableOpacity 
          style={styles.infoRow}
          onPress={handleCall}
          disabled={!customer.phone}
        >
          <Phone size={18} color={theme.textSecondary} />
          <Text style={[styles.infoText, { color: theme.text }]}>
            {customer.phone || 'Non specificato'}
          </Text>
          {customer.phone && <ChevronRight size={16} color={theme.textSecondary} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.infoRow}
          onPress={handleEmail}
          disabled={!customer.email}
        >
          <Mail size={18} color={theme.textSecondary} />
          <Text style={[styles.infoText, { color: theme.text }]}>
            {customer.email || 'Non specificato'}
          </Text>
          {customer.email && <ChevronRight size={16} color={theme.textSecondary} />}
        </TouchableOpacity>
        
        <View style={styles.infoRow}>
          <MapPin size={18} color={theme.textSecondary} />
          <View style={styles.addressContainer}>
            <Text style={[styles.infoText, { color: theme.text }]}>
              {customer.address || 'Non specificato'}
            </Text>
            {customer.city && (
              <Text style={[styles.cityText, { color: theme.textSecondary }]}>
                {customer.city}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Fiscal Info */}
      {(customer.vatNumber || customer.fiscalCode) && (
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Dati Fiscali
          </Text>
          
          {customer.vatNumber && (
            <View style={styles.infoRow}>
              <Building size={18} color={theme.textSecondary} />
              <View>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                  Partita IVA
                </Text>
                <Text style={[styles.infoText, { color: theme.text }]}>
                  {customer.vatNumber}
                </Text>
              </View>
            </View>
          )}
          
          {customer.fiscalCode && (
            <View style={styles.infoRow}>
              <Hash size={18} color={theme.textSecondary} />
              <View>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                  Codice Fiscale
                </Text>
                <Text style={[styles.infoText, { color: theme.text }]}>
                  {customer.fiscalCode}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Notes */}
      {customer.notes && (
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Note
          </Text>
          <Text style={[styles.notesText, { color: theme.textSecondary }]}>
            {customer.notes}
          </Text>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('CreateInvoice', { customerId: customer.id })}
        >
          <FileText size={20} color={theme.onPrimary} />
          <Text style={styles.quickActionText}>Nuova Fattura</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: theme.success }]}
          onPress={handleWhatsApp}
        >
          <Phone size={20} color={theme.onPrimary} />
          <Text style={styles.quickActionText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderVehicleCard = (vehicle: Vehicle) => (
    <TouchableOpacity
      key={vehicle.id}
      style={[styles.vehicleCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={() => navigation.navigate('CarDetail', { carId: vehicle.id })}
      activeOpacity={0.8}
    >
      <View style={styles.vehicleHeader}>
        <View>
          <Text style={[styles.vehicleName, { color: theme.text }]}>
            {vehicle.make} {vehicle.model}
          </Text>
          <Text style={[styles.vehicleInfo, { color: theme.textSecondary }]}>
            {vehicle.year} • {vehicle.licensePlate}
          </Text>
        </View>
        <ChevronRight size={20} color={theme.textSecondary} />
      </View>
      
      <View style={styles.vehicleStats}>
        <View style={styles.vehicleStat}>
          <Wrench size={16} color={theme.textSecondary} />
          <Text style={[styles.vehicleStatText, { color: theme.textSecondary }]}>
            {vehicle.totalServices} servizi
          </Text>
        </View>
        <View style={styles.vehicleStat}>
          <DollarSign size={16} color={theme.textSecondary} />
          <Text style={[styles.vehicleStatText, { color: theme.textSecondary }]}>
            {formatCurrency(vehicle.totalSpent)}
          </Text>
        </View>
        {vehicle.lastService && (
          <View style={styles.vehicleStat}>
            <Calendar size={16} color={theme.textSecondary} />
            <Text style={[styles.vehicleStatText, { color: theme.textSecondary }]}>
              {formatDate(vehicle.lastService)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderInvoiceCard = (invoice: Invoice) => {
    const StatusIcon = invoice.status === 'paid' ? CheckCircle : 
                      invoice.status === 'overdue' ? AlertCircle : Clock;
    const statusColor = getStatusColor(invoice.status);
    
    return (
      <TouchableOpacity
        key={invoice.id}
        style={[styles.invoiceCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: invoice.id })}
        activeOpacity={0.8}
      >
        <View style={styles.invoiceHeader}>
          <View>
            <Text style={[styles.invoiceNumber, { color: theme.text }]}>
              {invoice.number}
            </Text>
            <Text style={[styles.invoiceDate, { color: theme.textSecondary }]}>
              {formatDate(invoice.date)}
            </Text>
          </View>
          <View style={styles.invoiceRight}>
            <Text style={[styles.invoiceAmount, { color: theme.text }]}>
              {formatCurrency(invoice.amount)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <StatusIcon size={14} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {invoice.status === 'paid' ? 'Pagata' : 
                 invoice.status === 'pending' ? 'In attesa' : 'Scaduta'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderServiceCard = (service: Service) => {
    const vehicle = vehicles.find(v => v.id === service.vehicleId);
    
    return (
      <View
        key={service.id}
        style={[styles.serviceCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <View style={styles.serviceHeader}>
          <View>
            <Text style={[styles.serviceDescription, { color: theme.text }]}>
              {service.description}
            </Text>
            <Text style={[styles.serviceVehicle, { color: theme.textSecondary }]}>
              {vehicle?.make} {vehicle?.model} • {vehicle?.licensePlate}
            </Text>
          </View>
          <Text style={[styles.serviceAmount, { color: theme.text }]}>
            {formatCurrency(service.amount)}
          </Text>
        </View>
        <View style={styles.serviceFooter}>
          <Text style={[styles.serviceDate, { color: theme.textSecondary }]}>
            {formatDate(service.date)}
          </Text>
          {service.invoiceId && (
            <TouchableOpacity
              onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: service.invoiceId })}
            >
              <Text style={[styles.invoiceLink, { color: theme.primary }]}>
                Vedi fattura →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      <MechanicHeader
        title={customer.name}
        subtitle={`Cliente ${customer.type === 'business' ? 'Business' : 'Privato'}`}
        onBack={() => navigation.goBack()}
        leading={
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>
              {customer.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
        }
        right={
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => setShowOptionsMenu(true)}
            accessibilityRole="button"
            accessibilityLabel="Altre opzioni"
          >
            <MoreVertical size={24} color={theme.text} />
          </TouchableOpacity>
        }
      />

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statValue, { color: theme.primary }]}>
            {formatCurrency(customer.totalSpent)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Totale Speso
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statValue, { color: theme.success }]}>
            {customer.activeVehicles}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Veicoli Attivi
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statValue, { color: theme.primary }]}>
            {customer.completedServices}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Servizi Completati
          </Text>
        </View>
        
        {customer.pendingInvoices > 0 && (
          <View style={[styles.statCard, { backgroundColor: theme.warning + '10', borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: theme.warning }]}>
              {customer.pendingInvoices}
            </Text>
            <Text style={[styles.statLabel, { color: theme.warning }]}>
              Fatture in Attesa
            </Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['info', 'vehicles', 'invoices', 'history'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomColor: theme.primary }
            ]}
            onPress={() => setActiveTab(tab)}
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
        {activeTab === 'info' && renderInfoTab()}
        
        {activeTab === 'vehicles' && (
          <FlatList
            data={vehicles}
            renderItem={({ item }) => renderVehicleCard(item)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <TouchableOpacity
                style={[styles.addButton, { borderColor: theme.primary }]}
                onPress={() => navigation.navigate('AddCar', { customerId: customer.id })}
              >
                <Plus size={20} color={theme.primary} />
                <Text style={[styles.addButtonText, { color: theme.primary }]}>
                  Aggiungi Veicolo
                </Text>
              </TouchableOpacity>
            }
          />
        )}
        
        {activeTab === 'invoices' && (
          <FlatList
            data={invoices}
            renderItem={({ item }) => renderInvoiceCard(item)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
        
        {activeTab === 'history' && (
          <FlatList
            data={services}
            renderItem={({ item }) => renderServiceCard(item)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Options Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View 
            style={[styles.optionsMenu, { backgroundColor: theme.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setShowOptionsMenu(false);
                navigation.navigate('EditCustomer', { customerId: customer.id });
              }}
            >
              <Edit size={20} color={theme.text} />
              <Text style={[styles.optionText, { color: theme.text }]}>
                Modifica Cliente
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setShowOptionsMenu(false);
                // Export logic
              }}
            >
              <Download size={20} color={theme.text} />
              <Text style={[styles.optionText, { color: theme.text }]}>
                Esporta Dati
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setShowOptionsMenu(false);
                // Share logic
              }}
            >
              <Share2 size={20} color={theme.text} />
              <Text style={[styles.optionText, { color: theme.text }]}>
                Condividi Contatto
              </Text>
            </TouchableOpacity>
            
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setShowOptionsMenu(false);
                handleDelete();
              }}
            >
              <Trash2 size={20} color={theme.error} />
              <Text style={[styles.optionText, { color: theme.error }]}>
                Elimina Cliente
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  invoiceLink: {
    fontSize: 12,
    fontWeight: '500',
  },
  addButton: {
    ...mechanicButton.secondary,
    marginBottom: 16,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: mechanicStaticColors.overlay,
    justifyContent: 'flex-end',
  },
  optionsMenu: {
    margin: 20,
    padding: 8,
    borderRadius: 16,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
});

export default CustomerDetailScreen;
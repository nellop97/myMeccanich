// src/screens/mechanic/MechanicDashboardContent.tsx - AGGIORNATO
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');
const isDesktop = Platform.OS === 'web' && screenWidth > 768;

interface MechanicData {
  loginProvider: string;
  firstName: string;
  lastName: string;
  uid: string;
  userType: string;
  createdAt: any;
  address: string;
  rating: number;
  profileComplete: boolean;
  vatNumber: string;
  updatedAt: any;
  phone: string;
  workshopName: string;
  mechanicLicense: string;
  reviewsCount: number;
  email: string;
  verified: boolean;
}

interface Props {
  mechanicData: MechanicData | null;
  theme: any;
  navigation: any;
}

interface StatCardData {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  gradient: string[];
  onPress: () => void;
}

const MechanicDashboardContent: React.FC<Props> = ({ mechanicData, theme, navigation }) => {
  const [dashboardStats, setDashboardStats] = useState({
    carsInWorkshop: 8,
    appointmentsToday: 3,
    appointmentsWeek: 12,
    pendingInvoices: 5,
    overdueInvoices: 2,
    monthlyRevenue: 12500.50,
    monthlyGrowth: 15.2,
    completedJobs: 156,
    activeCustomers: 87,
    averageJobTime: 2.5,
    customerSatisfaction: 4.8,
  });

  const [recentActivity, setRecentActivity] = useState([
    {
      id: '1',
      type: 'car_added',
      title: 'Nuova auto aggiunta',
      description: 'Fiat 500 - Targa AB123CD',
      time: '10 minuti fa',
      icon: 'car-plus',
      color: theme.success,
    },
    {
      id: '2',
      type: 'appointment',
      title: 'Appuntamento confermato',
      description: 'Tagliando Volkswagen Golf',
      time: '1 ora fa',
      icon: 'calendar-check',
      color: theme.primary,
    },
    {
      id: '3',
      type: 'invoice',
      title: 'Fattura emessa',
      description: 'Fattura #2024-001 - €285.00',
      time: '2 ore fa',
      icon: 'receipt',
      color: theme.warning,
    },
    {
      id: '4',
      type: 'review',
      title: 'Nuova recensione',
      description: '5 stelle da Mario Rossi',
      time: '3 ore fa',
      icon: 'star',
      color: theme.warning,
    },
  ]);

  // Statistiche principali
  const statCards: StatCardData[] = [
    {
      title: 'Auto in Officina',
      value: dashboardStats.carsInWorkshop,
      subtitle: 'Attualmente in lavorazione',
      icon: 'car-wrench',
      color: theme.primary,
      trend: 'up',
      trendValue: '+2 da ieri',
    },
    {
      title: 'Appuntamenti Oggi',
      value: dashboardStats.appointmentsToday,
      subtitle: `${dashboardStats.appointmentsWeek} questa settimana`,
      icon: 'calendar-today',
      color: theme.accent,
      trend: 'neutral',
      trendValue: 'Come previsto',
    },
    {
      title: 'Fatture in Sospeso',
      value: dashboardStats.pendingInvoices,
      subtitle: `${dashboardStats.overdueInvoices} scadute`,
      icon: 'file-document-alert',
      color: theme.warning,
      trend: dashboardStats.overdueInvoices > 0 ? 'down' : 'up',
      trendValue: dashboardStats.overdueInvoices > 0 ? 'Attenzione!' : 'Tutto ok',
    },
    {
      title: 'Fatturato Mensile',
      value: `€${dashboardStats.monthlyRevenue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
      subtitle: `+${dashboardStats.monthlyGrowth}% vs mese scorso`,
      icon: 'trending-up',
      color: theme.success,
      trend: 'up',
      trendValue: `+€${(dashboardStats.monthlyRevenue * dashboardStats.monthlyGrowth / 100).toLocaleString('it-IT', { maximumFractionDigits: 0 })}`,
    },
  ];

  // Quick Actions
  const quickActions: QuickAction[] = [
    {
      id: 'add_car',
      title: 'Nuova Auto',
      subtitle: 'Aggiungi veicolo in officina',
      icon: 'car-plus',
      color: theme.success,
      gradient: ['#10b981', '#059669'],
      onPress: () => navigation.navigate('NewAppointment'),
    },
    {
      id: 'new_appointment',
      title: 'Appuntamento',
      subtitle: 'Programma nuovo intervento',
      icon: 'calendar-plus',
      color: theme.primary,
      gradient: ['#3b82f6', '#1d4ed8'],
      onPress: () => navigation.navigate('MechanicCalendar'),
    },
    {
      id: 'create_invoice',
      title: 'Fattura',
      subtitle: 'Crea nuova fattura',
      icon: 'receipt',
      color: theme.warning,
      gradient: ['#f59e0b', '#d97706'],
      onPress: () => navigation.navigate('CreateInvoice'),
    },
    {
      id: 'add_customer',
      title: 'Cliente',
      subtitle: 'Aggiungi nuovo cliente',
      icon: 'account-plus',
      color: theme.accent,
      gradient: ['#7c3aed', '#5b21b6'],
      onPress: () => navigation.navigate('AddCustomer'),
    },
  ];

  // Render di una stat card
  const renderStatCard = (stat: StatCardData, index: number) => (
    <View
      key={index}
      style={[
        styles.statCard,
        { backgroundColor: theme.surface },
        isDesktop ? styles.statCardDesktop : styles.statCardMobile
      ]}
    >
      <View style={styles.statCardHeader}>
        <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
          <MaterialCommunityIcons
            name={stat.icon as any}
            size={24}
            color={stat.color}
          />
        </View>
        
        <View style={styles.statTrend}>
          <MaterialCommunityIcons
            name={
              stat.trend === 'up' ? 'trending-up' : 
              stat.trend === 'down' ? 'trending-down' : 
              'minus'
            }
            size={16}
            color={
              stat.trend === 'up' ? theme.success : 
              stat.trend === 'down' ? theme.danger : 
              theme.textSecondary
            }
          />
        </View>
      </View>
      
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: theme.text }]}>
          {stat.value}
        </Text>
        <Text style={[styles.statTitle, { color: theme.textSecondary }]}>
          {stat.title}
        </Text>
        <Text style={[styles.statSubtitle, { color: theme.textSecondary }]}>
          {stat.subtitle}
        </Text>
        
        {stat.trendValue && (
          <Text style={[
            styles.statTrendValue,
            { color: stat.trend === 'up' ? theme.success : stat.trend === 'down' ? theme.danger : theme.textSecondary }
          ]}>
            {stat.trendValue}
          </Text>
        )}
      </View>
    </View>
  );

  // Render di una quick action
  const renderQuickAction = (action: QuickAction, index: number) => (
    <TouchableOpacity
      key={action.id}
      style={[
        styles.quickAction,
        isDesktop ? styles.quickActionDesktop : styles.quickActionMobile
      ]}
      onPress={action.onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={action.gradient}
        style={styles.quickActionGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.quickActionContent}>
          <MaterialCommunityIcons
            name={action.icon as any}
            size={28}
            color="#ffffff"
          />
          <View style={styles.quickActionText}>
            <Text style={styles.quickActionTitle}>
              {action.title}
            </Text>
            <Text style={styles.quickActionSubtitle}>
              {action.subtitle}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color="rgba(255,255,255,0.8)"
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  // Render dell'attività recente
  const renderRecentActivity = () => (
    <View style={[styles.section, { backgroundColor: theme.surface }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Attività Recente
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('ActivityLog')}
          style={styles.seeAllButton}
        >
          <Text style={[styles.seeAllText, { color: theme.primary }]}>
            Vedi tutto
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={16}
            color={theme.primary}
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.activityList}>
        {recentActivity.map((activity, index) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: `${activity.color}15` }]}>
              <MaterialCommunityIcons
                name={activity.icon as any}
                size={18}
                color={activity.color}
              />
            </View>
            
            <View style={styles.activityContent}>
              <Text style={[styles.activityTitle, { color: theme.text }]}>
                {activity.title}
              </Text>
              <Text style={[styles.activityDescription, { color: theme.textSecondary }]}>
                {activity.description}
              </Text>
            </View>
            
            <Text style={[styles.activityTime, { color: theme.textSecondary }]}>
              {activity.time}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  // Render delle performance metrics
  const renderPerformanceMetrics = () => (
    <View style={[styles.section, { backgroundColor: theme.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Performance
      </Text>
      
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: theme.success }]}>
            {dashboardStats.completedJobs}
          </Text>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
            Lavori Completati
          </Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: theme.primary }]}>
            {dashboardStats.activeCustomers}
          </Text>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
            Clienti Attivi
          </Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: theme.warning }]}>
            {dashboardStats.averageJobTime}h
          </Text>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
            Tempo Medio
          </Text>
        </View>
        
        <View style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: theme.warning }]}>
            {dashboardStats.customerSatisfaction}
          </Text>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
            Soddisfazione
          </Text>
        </View>
      </View>
    </View>
  );

  if (!mechanicData) {
    return null;
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {/* Statistiche Principali */}
      <View style={styles.statsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 16 }]}>
          Panoramica
        </Text>
        <View style={[styles.statsGrid, isDesktop && styles.statsGridDesktop]}>
          {statCards.map((stat, index) => renderStatCard(stat, index))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 16 }]}>
          Azioni Rapide
        </Text>
        <View style={[styles.quickActionsGrid, isDesktop && styles.quickActionsGridDesktop]}>
          {quickActions.map((action, index) => renderQuickAction(action, index))}
        </View>
      </View>

      {/* Performance Metrics */}
      {renderPerformanceMetrics()}

      {/* Attività Recente */}
      {renderRecentActivity()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: isDesktop ? 24 : 16,
    paddingBottom: 40,
  },
  
  // Stats Section
  statsContainer: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: isDesktop ? 'row' : 'column',
    gap: 16,
  },
  statsGridDesktop: {
    flexWrap: 'wrap',
  },
  statCard: {
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCardDesktop: {
    flex: 1,
    minWidth: 280,
  },
  statCardMobile: {
    width: '100%',
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTrend: {
    padding: 4,
  },
  statContent: {
    gap: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  statSubtitle: {
    fontSize: 12,
  },
  statTrendValue: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },

  // Quick Actions Section
  quickActionsContainer: {
    marginBottom: 32,
  },
  quickActionsGrid: {
    gap: 12,
  },
  quickActionsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickAction: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  quickActionDesktop: {
    flex: 1,
    minWidth: 250,
  },
  quickActionMobile: {
    width: '100%',
  },
  quickActionGradient: {
    padding: 20,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },

  // Section Styling
  section: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Performance Metrics
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: '22%',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },

  // Recent Activity
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityDescription: {
    fontSize: 12,
  },
  activityTime: {
    fontSize: 11,
    minWidth: 70,
    textAlign: 'right',
  },
});

export default MechanicDashboardContent;
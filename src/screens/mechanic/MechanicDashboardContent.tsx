// src/screens/mechanic/MechanicDashboardContent.tsx - AGGIORNATO CON DATI REALI
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMechanicStats } from '../../hooks/useMechanicStats';

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
  // Usa l'hook per le statistiche reali
  const { stats: dashboardStats, recentActivity, isLoading, error, refreshStats } = useMechanicStats();

  // Navigazione alla schermata delle auto in officina
  const goToWorkshopCars = () => {
    console.log("Navigating to workshop cars screen...");
    navigation.navigate('AllCarsInWorkshop' as never);
  };

  // Statistiche principali
  const statCards: StatCardData[] = [
    {
      title: 'Auto in Officina',
      value: dashboardStats.carsInWorkshop,
      subtitle: 'Attualmente in lavorazione',
      icon: 'car-wrench',
      color: theme.primary,
      trend: dashboardStats.carsInWorkshop > 0 ? 'up' : 'neutral',
      trendValue: dashboardStats.carsInWorkshop > 0 ? `${dashboardStats.carsInWorkshop} auto` : 'Nessuna auto',
    },
    {
      title: 'Appuntamenti Oggi',
      value: dashboardStats.appointmentsToday,
      subtitle: `${dashboardStats.appointmentsWeek} questa settimana`,
      icon: 'calendar-today',
      color: theme.accent,
      trend: dashboardStats.appointmentsToday > 0 ? 'up' : 'neutral',
      trendValue: dashboardStats.appointmentsToday > 0 ? 'In programma' : 'Nessuno',
    },
    {
      title: 'Fatture in Sospeso',
      value: dashboardStats.pendingInvoices,
      subtitle: `${dashboardStats.overdueInvoices} scadute`,
      icon: 'file-document-outline',
      color: theme.warning,
      trend: dashboardStats.overdueInvoices > 0 ? 'down' : 'up',
      trendValue: dashboardStats.overdueInvoices > 0 ? 'Attenzione!' : 'Tutto ok',
    },
    {
      title: 'Fatturato Mensile',
      value: `€${dashboardStats.monthlyRevenue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
      subtitle: `${dashboardStats.monthlyGrowth >= 0 ? '+' : ''}${dashboardStats.monthlyGrowth.toFixed(1)}% vs mese scorso`,
      icon: 'trending-up',
      color: theme.success,
      trend: dashboardStats.monthlyGrowth >= 0 ? 'up' : 'down',
      trendValue: dashboardStats.monthlyGrowth >= 0 ? 'In crescita' : 'In calo',
    },
  ];

  // Quick Actions
  const quickActions: QuickAction[] = [
    {
      id: 'add_car',
      title: 'Nuova Auto',
      subtitle: 'Aggiungi veicolo in officina',
      icon: 'car',
      color: theme.success,
      gradient: ['#10b981', '#059669'],
      onPress: () => navigation.navigate('NewAppointment'),
    },
    {
      id: 'new_appointment',
      title: ' Appuntamento',
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

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary, marginTop: 16 }]}>
          Caricamento statistiche...
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <MaterialCommunityIcons name="alert-circle" size={48} color={theme.danger} />
        <Text style={[styles.errorText, { color: theme.danger, marginTop: 16 }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={refreshStats}
        >
          <Text style={[styles.retryButtonText, { color: '#ffffff' }]}>
            Riprova
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!mechanicData) {
    return null;
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refreshStats}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
    >
      {/* Header con stato sincronizzazione */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 4 }]}>
            Panoramica
          </Text>
          <Text style={[styles.lastUpdateText, { color: theme.textSecondary }]}>
            Ultimo aggiornamento: {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshStats}
        >
          <MaterialCommunityIcons name="refresh" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Statistiche Principali */}
      <View style={styles.statsContainer}>
        <View style={[styles.statsGrid, isDesktop && styles.statsGridDesktop]}>
          {statCards.map((stat, index) => {
            if (stat.title === 'Auto in Officina') {
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.statCard,
                    { backgroundColor: theme.surface },
                    isDesktop ? styles.statCardDesktop : styles.statCardMobile
                  ]}
                  onPress={goToWorkshopCars} // Naviga alla schermata delle auto in officina
                  activeOpacity={0.7}
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
                </TouchableOpacity>
              );
            }
            return renderStatCard(stat, index);
          })}
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

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Header
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  lastUpdateText: {
    fontSize: 12,
    fontWeight: '400',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
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
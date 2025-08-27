
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Modal
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Download,
  Calendar,
  Fuel,
  Wrench,
  DollarSign,
  FileText,
  Filter,
  Share
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../store';
import { useUserCarsStore } from '../../store/useCarsStore';

const { width: screenWidth } = Dimensions.get('window');

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface Report {
  period: 'week' | 'month' | 'year';
  totalExpenses: number;
  fuelConsumption: number;
  maintenanceCosts: number;
  avgConsumption: number;
  expenseCategories: ChartData[];
  fuelTrends: ChartData[];
}

const ReportsScreen = () => {
  const navigation = useNavigation();
  const { darkMode } = useStore();
  const { cars } = useUserCarsStore();

  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [selectedCar, setSelectedCar] = useState<string>('all');
  const [reportData, setReportData] = useState<Report | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeChart, setActiveChart] = useState<'expenses' | 'fuel' | 'maintenance'>('expenses');

  const theme = {
    background: darkMode ? '#121212' : '#f5f5f5',
    cardBackground: darkMode ? '#1e1e1e' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#a0a0a0' : '#666666',
    primary: '#007AFF',
    border: darkMode ? '#333333' : '#e0e0e0',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30'
  };

  useEffect(() => {
    generateReport();
  }, [selectedPeriod, selectedCar]);

  const generateReport = () => {
    // Mock data generation - in realtà questi dati verranno calcolati da Firebase
    const mockReport: Report = {
      period: selectedPeriod,
      totalExpenses: selectedPeriod === 'year' ? 3500 : selectedPeriod === 'month' ? 420 : 85,
      fuelConsumption: selectedPeriod === 'year' ? 1800 : selectedPeriod === 'month' ? 180 : 45,
      maintenanceCosts: selectedPeriod === 'year' ? 1200 : selectedPeriod === 'month' ? 150 : 25,
      avgConsumption: 7.2,
      expenseCategories: [
        { label: 'Carburante', value: 60, color: '#FF6B6B' },
        { label: 'Manutenzione', value: 25, color: '#4ECDC4' },
        { label: 'Assicurazione', value: 10, color: '#45B7D1' },
        { label: 'Altri', value: 5, color: '#96CEB4' }
      ],
      fuelTrends: generateFuelTrends(selectedPeriod)
    };

    setReportData(mockReport);
  };

  const generateFuelTrends = (period: string): ChartData[] => {
    const periods = period === 'year' ? 12 : period === 'month' ? 4 : 7;
    const trends: ChartData[] = [];
    
    for (let i = 0; i < periods; i++) {
      trends.push({
        label: period === 'year' ? `M${i + 1}` : period === 'month' ? `S${i + 1}` : `G${i + 1}`,
        value: Math.random() * 100 + 50,
        color: '#007AFF'
      });
    }
    
    return trends;
  };

  const exportReport = () => {
    Alert.alert(
      'Esporta Report',
      'Scegli il formato di esportazione:',
      [
        { text: 'PDF', onPress: () => exportToPDF() },
        { text: 'CSV', onPress: () => exportToCSV() },
        { text: 'Annulla', style: 'cancel' }
      ]
    );
  };

  const exportToPDF = async () => {
    Alert.alert('Info', 'Funzione di esportazione PDF in sviluppo');
  };

  const exportToCSV = async () => {
    Alert.alert('Info', 'Funzione di esportazione CSV in sviluppo');
  };

  const shareReport = () => {
    Alert.alert('Info', 'Funzione di condivisione in sviluppo');
  };

  const renderSummaryCard = (title: string, value: string, trend: number, icon: any) => (
    <View style={[styles.summaryCard, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.summaryHeader}>
        <View style={[styles.summaryIcon, { backgroundColor: theme.primary + '20' }]}>
          {icon}
        </View>
        <View style={styles.summaryTrend}>
          {trend > 0 ? (
            <TrendingUp size={16} color={theme.success} />
          ) : (
            <TrendingDown size={16} color={theme.error} />
          )}
          <Text style={[
            styles.trendText,
            { color: trend > 0 ? theme.success : theme.error }
          ]}>
            {Math.abs(trend)}%
          </Text>
        </View>
      </View>
      <Text style={[styles.summaryValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.summaryTitle, { color: theme.textSecondary }]}>{title}</Text>
    </View>
  );

  const renderPieChart = (data: ChartData[], title: string) => (
    <View style={[styles.chartCard, { backgroundColor: theme.cardBackground }]}>
      <Text style={[styles.chartTitle, { color: theme.text }]}>{title}</Text>
      
      <View style={styles.pieChartContainer}>
        <View style={styles.pieChart}>
          {data.map((item, index) => (
            <View
              key={index}
              style={[
                styles.pieSlice,
                {
                  backgroundColor: item.color,
                  width: `${item.value}%`,
                  height: 20,
                  borderRadius: 10
                }
              ]}
            />
          ))}
        </View>
        
        <View style={styles.chartLegend}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                {item.label}: {item.value}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderBarChart = (data: ChartData[], title: string) => (
    <View style={[styles.chartCard, { backgroundColor: theme.cardBackground }]}>
      <Text style={[styles.chartTitle, { color: theme.text }]}>{title}</Text>
      
      <View style={styles.barChartContainer}>
        <View style={styles.barChart}>
          {data.map((item, index) => (
            <View key={index} style={styles.barItem}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%`,
                    backgroundColor: item.color
                  }
                ]}
              />
              <Text style={[styles.barLabel, { color: theme.textSecondary }]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.filterModal, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Filtra Report</Text>
          
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: theme.text }]}>Periodo:</Text>
            <View style={styles.filterOptions}>
              {[
                { key: 'week', label: 'Settimana' },
                { key: 'month', label: 'Mese' },
                { key: 'year', label: 'Anno' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    selectedPeriod === option.key && { backgroundColor: theme.primary + '20' }
                  ]}
                  onPress={() => setSelectedPeriod(option.key as any)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    { color: selectedPeriod === option.key ? theme.primary : theme.text }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: theme.text }]}>Veicolo:</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  selectedCar === 'all' && { backgroundColor: theme.primary + '20' }
                ]}
                onPress={() => setSelectedCar('all')}
              >
                <Text style={[
                  styles.filterOptionText,
                  { color: selectedCar === 'all' ? theme.primary : theme.text }
                ]}>
                  Tutti i veicoli
                </Text>
              </TouchableOpacity>
              
              {cars.slice(0, 3).map((car) => (
                <TouchableOpacity
                  key={car.id}
                  style={[
                    styles.filterOption,
                    selectedCar === car.id && { backgroundColor: theme.primary + '20' }
                  ]}
                  onPress={() => setSelectedCar(car.id)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    { color: selectedCar === car.id ? theme.primary : theme.text }
                  ]}>
                    {car.make} {car.model}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowFilterModal(false)}
          >
            <Text style={styles.applyButtonText}>Applica Filtri</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (!reportData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Text>Caricamento...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Report & Statistiche</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Filter size={20} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={exportReport}
          >
            <Download size={20} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={shareReport}
          >
            <Share size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <View style={styles.periodButtons}>
            {[
              { key: 'week', label: 'Settimana' },
              { key: 'month', label: 'Mese' },
              { key: 'year', label: 'Anno' }
            ].map((period) => (
              <TouchableOpacity
                key={period.key}
                style={[
                  styles.periodButton,
                  selectedPeriod === period.key && { backgroundColor: theme.primary },
                  { borderColor: theme.border }
                ]}
                onPress={() => setSelectedPeriod(period.key as any)}
              >
                <Text style={[
                  styles.periodButtonText,
                  { color: selectedPeriod === period.key ? '#ffffff' : theme.text }
                ]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          {renderSummaryCard(
            'Spese Totali',
            `€${reportData.totalExpenses}`,
            5.2,
            <DollarSign size={20} color={theme.primary} />
          )}
          {renderSummaryCard(
            'Carburante',
            `€${reportData.fuelConsumption}`,
            -2.1,
            <Fuel size={20} color={theme.primary} />
          )}
          {renderSummaryCard(
            'Manutenzione',
            `€${reportData.maintenanceCosts}`,
            8.7,
            <Wrench size={20} color={theme.primary} />
          )}
          {renderSummaryCard(
            'Consumo Medio',
            `${reportData.avgConsumption} L/100km`,
            -1.5,
            <BarChart3 size={20} color={theme.primary} />
          )}
        </View>

        {/* Chart Tabs */}
        <View style={[styles.chartTabs, { backgroundColor: theme.cardBackground }]}>
          {[
            { key: 'expenses', label: 'Spese', icon: <PieChart size={16} color={theme.textSecondary} /> },
            { key: 'fuel', label: 'Carburante', icon: <Fuel size={16} color={theme.textSecondary} /> },
            { key: 'maintenance', label: 'Manutenzione', icon: <Wrench size={16} color={theme.textSecondary} /> }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.chartTab,
                activeChart === tab.key && { borderBottomColor: theme.primary }
              ]}
              onPress={() => setActiveChart(tab.key as any)}
            >
              {tab.icon}
              <Text style={[
                styles.chartTabText,
                { color: activeChart === tab.key ? theme.primary : theme.textSecondary }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Charts */}
        <View style={styles.chartsContainer}>
          {activeChart === 'expenses' && renderPieChart(reportData.expenseCategories, 'Distribuzione Spese')}
          {activeChart === 'fuel' && renderBarChart(reportData.fuelTrends, 'Andamento Consumi')}
          {activeChart === 'maintenance' && renderBarChart(reportData.fuelTrends, 'Costi Manutenzione')}
        </View>

        {/* Insights */}
        <View style={[styles.insightsCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.insightsTitle, { color: theme.text }]}>Insights</Text>
          
          <View style={styles.insightItem}>
            <View style={[styles.insightIcon, { backgroundColor: theme.success + '20' }]}>
              <TrendingDown size={16} color={theme.success} />
            </View>
            <Text style={[styles.insightText, { color: theme.textSecondary }]}>
              I consumi sono diminuiti del 2.1% rispetto al periodo precedente
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <View style={[styles.insightIcon, { backgroundColor: theme.warning + '20' }]}>
              <TrendingUp size={16} color={theme.warning} />
            </View>
            <Text style={[styles.insightText, { color: theme.textSecondary }]}>
              Le spese di manutenzione sono aumentate dell'8.7%
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <View style={[styles.insightIcon, { backgroundColor: theme.primary + '20' }]}>
              <Calendar size={16} color={theme.primary} />
            </View>
            <Text style={[styles.insightText, { color: theme.textSecondary }]}>
              Prossima manutenzione programmata tra 15 giorni
            </Text>
          </View>
        </View>
      </ScrollView>

      {renderFilterModal()}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  periodSelector: {
    padding: 16,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  summaryCard: {
    width: (screenWidth - 44) / 2,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 12,
  },
  chartTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  chartTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  chartTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartsContainer: {
    padding: 16,
  },
  chartCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  pieChartContainer: {
    alignItems: 'center',
  },
  pieChart: {
    flexDirection: 'row',
    width: '100%',
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
  },
  pieSlice: {
    flex: 1,
  },
  chartLegend: {
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
  },
  barChartContainer: {
    alignItems: 'center',
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    width: '100%',
    gap: 8,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    marginBottom: 8,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  insightsCard: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  insightIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  filterOptionText: {
    fontSize: 14,
  },
  applyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReportsScreen;

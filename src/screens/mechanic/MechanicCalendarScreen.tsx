// src/screens/mechanic/MechanicCalendarScreen.tsx
import { useNavigation } from '@react-navigation/native';
import {
  Calendar,
  Car,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  MapPin,
  Phone,
  User,
  Wrench,
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
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar as RNCalendar, LocaleConfig } from 'react-native-calendars';
import { useStore } from '../../store';
import { useWorkshopStore } from '../../store/workshopStore';

// Configurazione italiana per il calendario
LocaleConfig.locales['it'] = {
  monthNames: [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ],
  monthNamesShort: [
    'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
    'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
  ],
  dayNames: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
  today: 'Oggi'
};
LocaleConfig.defaultLocale = 'it';

const { width: screenWidth } = Dimensions.get('window');

interface DayWithRepairs {
  date: string;
  repairs: Array<{
    carId: string;
    repairId: string;
    car: any;
    repair: any;
  }>;
}

const MechanicCalendarScreen = () => {
  const navigation = useNavigation();
  const { darkMode } = useStore();
  const { cars } = useWorkshopStore();
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
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

  // Calcola i giorni con riparazioni
  const daysWithRepairs = useMemo(() => {
    const repairsByDate: { [key: string]: DayWithRepairs } = {};
    
    cars.forEach(car => {
      car.repairs.forEach(repair => {
        if (repair.status !== 'completed') {
          const dateKey = repair.scheduledDate;
          
          if (!repairsByDate[dateKey]) {
            repairsByDate[dateKey] = {
              date: dateKey,
              repairs: []
            };
          }
          
          repairsByDate[dateKey].repairs.push({
            carId: car.id,
            repairId: repair.id,
            car,
            repair
          });
        }
      });
    });
    
    return repairsByDate;
  }, [cars]);

  // Prepara i marcatori per il calendario
  const markedDates = useMemo(() => {
    const marks: any = {};
    
    Object.keys(daysWithRepairs).forEach(date => {
      const dayRepairs = daysWithRepairs[date];
      const count = dayRepairs.repairs.length;
      
      marks[date] = {
        marked: true,
        dotColor: count > 3 ? theme.error : count > 1 ? theme.warning : theme.success,
        customStyles: {
          container: {
            backgroundColor: selectedDate === date ? theme.accent : 'transparent',
          },
          text: {
            color: selectedDate === date ? '#ffffff' : theme.text,
            fontWeight: selectedDate === date ? 'bold' : 'normal',
          },
          dot: {
            backgroundColor: count > 3 ? theme.error : count > 1 ? theme.warning : theme.success,
          }
        }
      };
    });
    
    // Evidenzia il giorno selezionato anche se non ha riparazioni
    if (selectedDate && !marks[selectedDate]) {
      marks[selectedDate] = {
        selected: true,
        selectedColor: theme.accent,
      };
    }
    
    return marks;
  }, [daysWithRepairs, selectedDate, theme]);

  // Riparazioni del giorno selezionato
  const selectedDayRepairs = selectedDate ? daysWithRepairs[selectedDate]?.repairs || [] : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress': return darkMode ? '#3b82f6' : '#2563eb';
      case 'pending': return darkMode ? '#f59e0b' : '#d97706';
      case 'completed': return darkMode ? '#10b981' : '#059669';
      default: return theme.textSecondary;
    }
  };

  const renderRepairCard = ({ item }: { item: any }) => {
    const { car, repair } = item;
    
    return (
      <TouchableOpacity
        style={[styles.repairCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
        onPress={() => navigation.navigate('RepairPartsManagement', {
          carId: car.id,
          repairId: repair.id
        })}
        activeOpacity={0.7}
      >
        <View style={styles.repairCardHeader}>
          <View style={styles.carInfo}>
            <Text style={[styles.licensePlate, { color: theme.text }]}>
              {car.licensePlate || 'N/A'}
            </Text>
            <Text style={[styles.carModel, { color: theme.textSecondary }]}>
              {car.model}
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(repair.status) + '20' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: getStatusColor(repair.status) }
            ]}>
              {repair.status === 'in-progress' ? 'In Lavorazione' : 'In Attesa'}
            </Text>
          </View>
        </View>
        
        <View style={styles.repairDetails}>
          <View style={styles.detailRow}>
            <Wrench size={16} color={theme.textSecondary} />
            <Text style={[styles.detailText, { color: theme.text }]}>
              {repair.description}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <User size={16} color={theme.textSecondary} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              {car.owner || 'N/A'}
            </Text>
          </View>
          
          {car.ownerPhone && (
            <View style={styles.detailRow}>
              <Phone size={16} color={theme.textSecondary} />
              <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                {car.ownerPhone}
              </Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Clock size={16} color={theme.textSecondary} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              Consegna: {new Date(repair.deliveryDate).toLocaleDateString('it-IT')}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <DollarSign size={16} color={theme.textSecondary} />
            <Text style={[styles.detailText, { color: theme.accent }]}>
              €{repair.totalCost.toFixed(2)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDayStats = () => {
    const totalRepairs = Object.keys(daysWithRepairs).reduce(
      (sum, date) => sum + daysWithRepairs[date].repairs.length, 0
    );
    
    const todayKey = new Date().toISOString().split('T')[0];
    const todayRepairs = daysWithRepairs[todayKey]?.repairs.length || 0;
    
    return (
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Car size={20} color={theme.accent} />
          <Text style={[styles.statNumber, { color: theme.text }]}>
            {totalRepairs}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Totale Interventi
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Calendar size={20} color={theme.warning} />
          <Text style={[styles.statNumber, { color: theme.text }]}>
            {todayRepairs}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Oggi
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Clock size={20} color={theme.success} />
          <Text style={[styles.statNumber, { color: theme.text }]}>
            {Object.keys(daysWithRepairs).length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Giorni Occupati
          </Text>
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Calendario Interventi
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistiche */}
        {renderDayStats()}
        
        {/* Calendario */}
        <View style={[styles.calendarContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <RNCalendar
            current={currentMonth.toISOString().split('T')[0]}
            markedDates={markedDates}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            onMonthChange={(month) => setCurrentMonth(new Date(month.timestamp))}
            theme={{
              backgroundColor: theme.cardBackground,
              calendarBackground: theme.cardBackground,
              textSectionTitleColor: theme.text,
              selectedDayBackgroundColor: theme.accent,
              selectedDayTextColor: '#ffffff',
              todayTextColor: theme.accent,
              dayTextColor: theme.text,
              textDisabledColor: theme.textSecondary,
              dotColor: theme.accent,
              selectedDotColor: '#ffffff',
              arrowColor: theme.accent,
              monthTextColor: theme.text,
              indicatorColor: theme.accent,
              textDayFontFamily: Platform.select({
                ios: 'System',
                android: 'Roboto',
                default: 'System'
              }),
              textMonthFontFamily: Platform.select({
                ios: 'System',
                android: 'Roboto',
                default: 'System'
              }),
              textDayHeaderFontFamily: Platform.select({
                ios: 'System',
                android: 'Roboto',
                default: 'System'
              }),
              textDayFontWeight: '400',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
            markingType={'custom'}
            renderArrow={(direction) => (
              direction === 'left' ? 
                <ChevronLeft size={20} color={theme.accent} /> : 
                <ChevronRight size={20} color={theme.accent} />
            )}
          />
          
          {/* Legenda */}
          <View style={[styles.legend, { borderColor: theme.border }]}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                1 intervento
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.warning }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                2-3 interventi
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.error }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                4+ interventi
              </Text>
            </View>
          </View>
        </View>
        
        {/* Lista interventi del giorno selezionato */}
        {selectedDate && (
          <View style={[styles.dayDetailsContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={styles.dayDetailsHeader}>
              <Text style={[styles.dayDetailsTitle, { color: theme.text }]}>
                Interventi del {new Date(selectedDate).toLocaleDateString('it-IT', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </Text>
              <Text style={[styles.dayDetailsCount, { color: theme.textSecondary }]}>
                {selectedDayRepairs.length} {selectedDayRepairs.length === 1 ? 'intervento' : 'interventi'}
              </Text>
            </View>
            
            {selectedDayRepairs.length === 0 ? (
              <View style={styles.emptyState}>
                <Calendar size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
                  Nessun intervento programmato
                </Text>
                <Text style={[styles.emptyStateSubtitle, { color: theme.textSecondary }]}>
                  Non ci sono interventi previsti per questo giorno
                </Text>
              </View>
            ) : (
              <FlatList
                data={selectedDayRepairs}
                renderItem={renderRepairCard}
                keyExtractor={(item) => `${item.carId}-${item.repairId}`}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              />
            )}
          </View>
        )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  calendarContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
  dayDetailsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dayDetailsHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dayDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dayDetailsCount: {
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  repairCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  repairCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  carInfo: {
    flex: 1,
  },
  licensePlate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  carModel: {
    fontSize: 14,
    marginTop: 2,
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
  repairDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
});

export default MechanicCalendarScreen;


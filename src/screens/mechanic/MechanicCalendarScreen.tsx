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
import React, { useState, useMemo, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Calendar as RNCalendar, LocaleConfig } from 'react-native-calendars';
import { useStore } from '../../store';
import { useWorkshopStore } from '../../store/workshopStore';

import { mechanicCard, mechanicStaticColors, useMechanicTheme, useMechanicBreakpoints } from './mechanicTheme';
import { MechanicEmptyState } from './MechanicStates';
import MechanicHeader from './MechanicHeader';
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
  const { user } = useStore();
  const theme = useMechanicTheme();
  const { cars, fetchCars, isLoading } = useWorkshopStore();

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { isDesktop } = useMechanicBreakpoints();

  // Carica le auto all'avvio e quando cambia selectedDate
  useEffect(() => {
    if (user?.id) {
      console.log('📅 Caricamento auto da Firebase...');
      fetchCars(user.id);
    }
  }, [user?.id, selectedDate]);


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
            backgroundColor: selectedDate === date ? theme.primary : 'transparent',
          },
          text: {
            color: selectedDate === date ? theme.onPrimary : theme.text,
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
        selectedColor: theme.primary,
      };
    }
    
    return marks;
  }, [daysWithRepairs, selectedDate, theme]);

  // Riparazioni del giorno selezionato
  const selectedDayRepairs = selectedDate ? daysWithRepairs[selectedDate]?.repairs || [] : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress': return theme.primary;
      case 'pending': return theme.warning;
      case 'completed': return theme.success;
      default: return theme.textSecondary;
    }
  };

  const renderRepairCard = ({ item }: { item: any }) => {
    const { car, repair } = item;
    
    return (
      <TouchableOpacity
        style={[styles.repairCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
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
            <Text style={[styles.detailText, { color: theme.primary }]}>
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
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Car size={20} color={theme.primary} />
          <Text style={[styles.statNumber, { color: theme.text }]}>
            {totalRepairs}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Totale Interventi
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Calendar size={20} color={theme.warning} />
          <Text style={[styles.statNumber, { color: theme.text }]}>
            {todayRepairs}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Oggi
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      
      <MechanicHeader title="Calendario Interventi" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistiche */}
        {renderDayStats()}

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Aggiornamento dati...
            </Text>
          </View>
        )}

        {/* Calendario */}
        <View style={[styles.calendarContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <RNCalendar
            current={currentMonth.toISOString().split('T')[0]}
            markedDates={markedDates}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            onMonthChange={(month) => setCurrentMonth(new Date(month.timestamp))}
            theme={{
              backgroundColor: theme.surface,
              calendarBackground: theme.surface,
              textSectionTitleColor: theme.text,
              selectedDayBackgroundColor: theme.primary,
              selectedDayTextColor: theme.onPrimary,
              todayTextColor: theme.primary,
              dayTextColor: theme.text,
              textDisabledColor: theme.textSecondary,
              dotColor: theme.primary,
              selectedDotColor: theme.onPrimary,
              arrowColor: theme.primary,
              monthTextColor: theme.text,
              indicatorColor: theme.primary,
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
                <ChevronLeft size={20} color={theme.primary} /> : 
                <ChevronRight size={20} color={theme.primary} />
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
          <View style={[styles.dayDetailsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
              isLoading ? null : (
                <MechanicEmptyState
                  icon={Calendar}
                  title="Nessun intervento programmato"
                  subtitle="Non ci sono interventi previsti per questo giorno"
                />
              )
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
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
    ...mechanicCard,
    flex: 1,
    alignItems: 'center',
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
    borderRadius: 8,
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
    borderBottomColor: mechanicStaticColors.divider,
  },
  dayDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dayDetailsCount: {
    fontSize: 14,
  },
  repairCard: {
    ...mechanicCard,
    marginHorizontal: 16,
    marginBottom: 12,
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


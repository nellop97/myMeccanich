import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Car,
  CheckCircle,
  AlertCircle
} from 'lucide-react-native';
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

interface CalendarAppointmentPickerProps {
  selectedDates: string[];
  onDatesChange: (dates: string[]) => void;
  theme: any;
  estimatedDays?: number;
}

const CalendarAppointmentPicker: React.FC<CalendarAppointmentPickerProps> = ({
  selectedDates,
  onDatesChange,
  theme,
  estimatedDays = 1
}) => {
  const { cars } = useWorkshopStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Calcola tutti gli appuntamenti esistenti
  const existingAppointments = useMemo(() => {
    const appointments: { [key: string]: any[] } = {};
    
    cars.forEach(car => {
      car.repairs.forEach(repair => {
        if (repair.status !== 'completed') {
          const dateKey = repair.scheduledDate;
          
          if (!appointments[dateKey]) {
            appointments[dateKey] = [];
          }
          
          appointments[dateKey].push({
            carId: car.id,
            repairId: repair.id,
            car: car,
            repair: repair,
            plate: car.licensePlate || 'N/A'
          });
        }
      });
    });
    
    return appointments;
  }, [cars]);

  // Prepara i marcatori per il calendario
  const markedDates = useMemo(() => {
    const marks: any = {};
    
    // Marca i giorni con appuntamenti esistenti
    Object.keys(existingAppointments).forEach(date => {
      const appointmentCount = existingAppointments[date].length;
      marks[date] = {
        marked: true,
        dotColor: appointmentCount > 2 ? '#ef4444' : appointmentCount > 1 ? '#f59e0b' : '#10b981',
        customStyles: {
          container: {
            backgroundColor: 'transparent',
          },
          text: {
            color: theme.text,
            fontWeight: 'normal',
          },
        }
      };
    });

    // Marca i giorni selezionati
    selectedDates.forEach(date => {
      if (marks[date]) {
        // Se il giorno ha già appuntamenti, combina i marcatori
        marks[date] = {
          ...marks[date],
          selected: true,
          selectedColor: theme.accent,
          customStyles: {
            container: {
              backgroundColor: theme.accent,
            },
            text: {
              color: '#ffffff',
              fontWeight: 'bold',
            },
            dot: {
              backgroundColor: '#ffffff',
            }
          }
        };
      } else {
        // Giorno selezionato senza appuntamenti esistenti
        marks[date] = {
          selected: true,
          selectedColor: theme.accent,
          customStyles: {
            container: {
              backgroundColor: theme.accent,
            },
            text: {
              color: '#ffffff',
              fontWeight: 'bold',
            },
          }
        };
      }
    });
    
    return marks;
  }, [existingAppointments, selectedDates, theme]);

  const handleDayPress = (day: any) => {
    const dateString = day.dateString;
    
    if (selectedDates.includes(dateString)) {
      // Rimuovi la data se già selezionata
      onDatesChange(selectedDates.filter(date => date !== dateString));
    } else {
      // Aggiungi la data
      const newDates = [...selectedDates, dateString].sort();
      onDatesChange(newDates);
    }
  };

  const getWorkloadStatus = (date: string) => {
    const appointmentCount = existingAppointments[date]?.length || 0;
    if (appointmentCount === 0) return 'libero';
    if (appointmentCount <= 2) return 'normale';
    return 'pieno';
  };

  const getWorkloadColor = (status: string) => {
    switch (status) {
      case 'libero': return '#10b981';
      case 'normale': return '#f59e0b';
      case 'pieno': return '#ef4444';
      default: return theme.textSecondary;
    }
  };

  const getWorkloadText = (status: string) => {
    switch (status) {
      case 'libero': return 'Disponibile';
      case 'normale': return 'Carico normale';
      case 'pieno': return 'Pieno';
      default: return '';
    }
  };

  const renderQuickSelection = () => (
    <View style={styles.quickSelectionContainer}>
      <Text style={[styles.quickSelectionTitle, { color: theme.text }]}>
        Selezione Rapida
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.quickSelectionButton, { borderColor: theme.border }]}
          onPress={() => {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            onDatesChange([tomorrow.toISOString().split('T')[0]]);
          }}
        >
          <Text style={[styles.quickSelectionText, { color: theme.text }]}>Domani</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickSelectionButton, { borderColor: theme.border }]}
          onPress={() => {
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);
            onDatesChange([nextWeek.toISOString().split('T')[0]]);
          }}
        >
          <Text style={[styles.quickSelectionText, { color: theme.text }]}>Prossima settimana</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickSelectionButton, { borderColor: theme.border }]}
          onPress={() => {
            // Suggerisci i prossimi giorni disponibili basati sul carico di lavoro
            const today = new Date();
            const availableDates = [];
            
            for (let i = 1; i <= 14 && availableDates.length < estimatedDays; i++) {
              const date = new Date(today);
              date.setDate(date.getDate() + i);
              const dateString = date.toISOString().split('T')[0];
              
              // Salta i weekend (opzionale)
              if (date.getDay() === 0 || date.getDay() === 6) continue;
              
              const workloadStatus = getWorkloadStatus(dateString);
              if (workloadStatus !== 'pieno') {
                availableDates.push(dateString);
              }
            }
            
            onDatesChange(availableDates);
          }}
        >
          <Text style={[styles.quickSelectionText, { color: theme.text }]}>
            Auto-suggerisci ({estimatedDays} {estimatedDays === 1 ? 'giorno' : 'giorni'})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickSelectionButton, { borderColor: theme.border }]}
          onPress={() => onDatesChange([])}
        >
          <Text style={[styles.quickSelectionText, { color: theme.error }]}>Cancella selezione</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderSelectedDatesInfo = () => {
    if (selectedDates.length === 0) return null;

    return (
      <View style={[styles.selectedDatesContainer, { backgroundColor: theme.accent + '20', borderColor: theme.accent }]}>
        <View style={styles.selectedDatesHeader}>
          <CheckCircle size={20} color={theme.accent} />
          <Text style={[styles.selectedDatesTitle, { color: theme.accent }]}>
            {selectedDates.length} {selectedDates.length === 1 ? 'giorno selezionato' : 'giorni selezionati'}
          </Text>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {selectedDates.map((date, index) => {
            const workloadStatus = getWorkloadStatus(date);
            const existingCount = existingAppointments[date]?.length || 0;
            
            return (
              <View
                key={date}
                style={[styles.selectedDateChip, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              >
                <Text style={[styles.selectedDateText, { color: theme.text }]}>
                  {new Date(date).toLocaleDateString('it-IT', { 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </Text>
                {existingCount > 0 && (
                  <View style={styles.workloadIndicator}>
                    <Car size={12} color={getWorkloadColor(workloadStatus)} />
                    <Text style={[styles.workloadText, { color: getWorkloadColor(workloadStatus) }]}>
                      {existingCount}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderDayAppointments = () => {
    // Mostra gli appuntamenti per i giorni selezionati
    const relevantDates = selectedDates.filter(date => existingAppointments[date]);
    
    if (relevantDates.length === 0) return null;

    return (
      <View style={[styles.appointmentsContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={styles.appointmentsHeader}>
          <AlertCircle size={20} color={theme.warning} />
          <Text style={[styles.appointmentsTitle, { color: theme.text }]}>
            Appuntamenti Esistenti
          </Text>
        </View>
        
        {relevantDates.map(date => (
          <View key={date} style={[styles.dayAppointments, { borderColor: theme.border }]}>
            <Text style={[styles.dayAppointmentsDate, { color: theme.text }]}>
              {new Date(date).toLocaleDateString('it-IT', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </Text>
            
            {existingAppointments[date].map((appointment, index) => (
              <View key={index} style={styles.appointmentItem}>
                <Car size={16} color={theme.textSecondary} />
                <Text style={[styles.appointmentText, { color: theme.textSecondary }]}>
                  {appointment.plate} - {appointment.repair.description}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderLegend = () => (
    <View style={[styles.legend, { borderColor: theme.border }]}>
      <Text style={[styles.legendTitle, { color: theme.text }]}>Legenda:</Text>
      <View style={styles.legendItems}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Disponibile</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>2-3 appuntamenti</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Giorno pieno (4+)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.accent }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Selezionato</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderQuickSelection()}
      
      <View style={[styles.calendarContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <View style={styles.calendarHeader}>
          <CalendarIcon size={20} color={theme.accent} />
          <Text style={[styles.calendarTitle, { color: theme.text }]}>
            Seleziona i giorni di lavorazione
          </Text>
        </View>
        
        <Calendar
          current={currentMonth.toISOString().split('T')[0]}
          markedDates={markedDates}
          onDayPress={handleDayPress}
          onMonthChange={(month) => setCurrentMonth(new Date(month.timestamp))}
          minDate={new Date().toISOString().split('T')[0]}
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
          hideExtraDays={true}
          firstDay={1} // Lunedì come primo giorno
        />
        
        {renderLegend()}
      </View>

      {renderSelectedDatesInfo()}
      {renderDayAppointments()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  quickSelectionContainer: {
    marginBottom: 16,
  },
  quickSelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickSelectionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  quickSelectionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  calendarContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  legend: {
    padding: 16,
    borderTopWidth: 1,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
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
  selectedDatesContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  selectedDatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedDatesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  selectedDateChip: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    minWidth: 60,
  },
  selectedDateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  workloadIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  workloadText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  appointmentsContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  appointmentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  appointmentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dayAppointments: {
    padding: 16,
    borderBottomWidth: 1,
  },
  dayAppointmentsDate: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  appointmentText: {
    fontSize: 14,
    marginLeft: 8,
  },
});

export default CalendarAppointmentPicker;

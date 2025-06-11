import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Dimensions,
  Image,
  Animated,
  FlatList,
  Platform,
  ImageBackground,
  Alert,
} from 'react-native';
import {
  Car,
  Calendar,
  FileText,
  Settings,
  Bell,
  Plus,
  ChevronRight,
  Wrench,
  DollarSign,
  Fuel,
  AlertCircle,
  Clock,
  Activity,
  MapPin,
  CheckCircle,
  BarChart2,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserCarsStore } from '../store/useCarsStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.8;
const CARD_SPACING = screenWidth * 0.05;

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user, darkMode, logout } = useStore();
  const { cars } = useUserCarsStore(); // Usa i dati dallo store
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeCarIndex, setActiveCarIndex] = useState(0);

  const theme = {
    background: darkMode ? '#111827' : '#f3f4f6',
    cardBackground: darkMode ? '#1f2937' : '#ffffff',
    cardBackgroundAlt: darkMode ? '#2a3441' : '#f9fafb',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#9ca3af' : '#6b7280',
    border: darkMode ? '#374151' : '#e5e7eb',
    accent: '#2563eb',
    accentGradient: ['#2563eb', '#3b82f6'],
    success: '#10b981',
    successGradient: ['#059669', '#10b981'],
    warning: '#f59e0b',
    warningGradient: ['#d97706', '#f59e0b'],
    error: '#ef4444',
    errorGradient: ['#dc2626', '#ef4444'],
    shadow: darkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
  };


  const quickActions = [
    {
      icon: Car,
      title: 'Le Mie Auto',
      subtitle: `${cars.length} veicoli registrati`,
      color: theme.accent,
      bgColor: darkMode ? '#1e3a8a' : '#dbeafe',
      gradient: theme.accentGradient,
      onPress: () => handleNavigation('MyCars'),
    },
    {
      icon: Calendar,
      title: 'Prossimi Servizi',
      subtitle: `${cars.length} veicoli registrati`,
      color: theme.warning,
      bgColor: darkMode ? '#92400e' : '#fef3c7',
      gradient: theme.warningGradient,
      onPress: () => handleNavigation('MaintenanceCalendar'),
    },
    {
      icon: FileText,
      title: 'Storico Interventi',
      subtitle: `${cars.length} veicoli registrati`,
      color: theme.success,
      bgColor: darkMode ? '#065f46' : '#d1fae5',
      gradient: theme.successGradient,
      onPress: () => handleNavigation('MaintenanceHistory'),
    },
    {
      icon: DollarSign,
      title: 'Spese',
      subtitle: `${cars.length} veicoli registrati`,
      color: theme.error,
      bgColor: darkMode ? '#7f1d1d' : '#fee2e2',
      gradient: theme.errorGradient,
      onPress: () => handleNavigation('ExpenseTracker'),
    },
  ];

  const recentActivities = [
    {
      id: '1',
      type: 'service',
      title: 'Tagliando completato',
      subtitle: 'Fiat 500 - AB123CD',
      date: '2 giorni fa',
      icon: Wrench,
      iconBg: theme.success,
      carId: '1',
    },
    {
      id: '2',
      type: 'reminder',
      title: 'Promemoria: Cambio gomme',
      subtitle: 'Tesla Model 3 - CD456EF',
      date: '5 giorni fa',
      icon: Bell,
      iconBg: theme.warning,
      carId: '2',
    },
    {
      id: '3',
      type: 'expense',
      title: 'Nuova spesa registrata',
      subtitle: 'Carburante - €45.00',
      date: '1 settimana fa',
      icon: DollarSign,
      iconBg: theme.error,
      carId: '1',
    },
  ];

  // Funzione di navigazione con gestione errori
  const handleNavigation = (screenName, params = {}) => {
    try {
      navigation.navigate(screenName, params);
    } catch (error) {
      console.error('Errore nella navigazione:', error);
      Alert.alert(
        'Errore',
        'Impossibile aprire la schermata richiesta',
        [{ text: 'OK' }]
      );
    }
  };

  // Gestisce la navigazione al dettaglio del veicolo
  const handleCarNavigation = (carId) => {
    handleNavigation('CarDetail', { carId });
  };

  // Gestisce la navigazione dalle attività
  const handleActivityNavigation = (activity) => {
    if (activity.carId) {
      handleCarNavigation(activity.carId);
    } else if (activity.type === 'expense') {
      handleNavigation('ExpenseTracker');
    } else if (activity.type === 'service') {
      handleNavigation('MaintenanceHistory');
    }
  };

  // Gestisce l'indice del veicolo attivo quando si scorre
  useEffect(() => {
    const listener = scrollX.addListener(({ value }) => {
      const index = Math.round(value / (CARD_WIDTH + CARD_SPACING));
      setActiveCarIndex(index);
    });
    return () => scrollX.removeListener(listener);
  }, []);

  // Genera gli indicatori per il carousel
  const renderCarouselIndicators = () => {
    return (
      <View style={styles.carouselIndicators}>
        {cars.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              {
                backgroundColor: index === activeCarIndex ? theme.accent : theme.border,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  // Card per veicolo nel carousel
  const renderCarCard = ({ item, index }) => {
    const car = item;
    // Calcola l'input range basato sulla posizione della card
    const inputRange = [
      (index - 1) * (CARD_WIDTH + CARD_SPACING),
      index * (CARD_WIDTH + CARD_SPACING),
      (index + 1) * (CARD_WIDTH + CARD_SPACING),
    ];

    // Animazione di scala per effetto "zoom su attivo"
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.95, 1, 0.95],
      extrapolate: 'clamp',
    });

    // Animazione di opacità
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 1, 0.7],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.carCard,
          {
            transform: [{ scale }],
            opacity,
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
            shadowColor: theme.shadow,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => handleCarNavigation(car.id)}
          style={styles.carCardTouchable}
        >
          <View style={styles.carImageContainer}>
            {/* Placeholder per l'immagine del veicolo - in produzione usare Image locale */}
            <View
              style={[
                styles.carImagePlaceholder,
                {backgroundColor: theme.cardBackgroundAlt}
              ]}
            >
              <Car
                width={60}
                height={60}
                color={theme.accent}
                style={styles.carIcon}
              />
              <Text style={[styles.carModel, {color: theme.text}]}>
              {car.make} {car.model} 
            </Text>
              <Text style={[styles.carPlate, {color: theme.textSecondary}]}>
              {car.licensePlate} 
            </Text>
          </View>
          </View>

          <View style={styles.carInfoContainer}>
            <View style={styles.carInfoRow}>
              <View style={styles.carInfoItem}>
                <Calendar width={20} height={20} color={theme.accent} />
                <Text style={[styles.carInfoLabel, {color: theme.textSecondary}]}>
                  Prossimo servizio
                </Text>
                <Text style={[styles.carInfoValue, {color: theme.text}]}>
                  {item.nextService}
                </Text>
              </View>
              <View style={styles.carInfoItem}>
                <Wrench width={20} height={20} color={theme.accent} />
                <Text style={[styles.carInfoLabel, {color: theme.textSecondary}]}>
                  Ultimo servizio
                </Text>
                <Text style={[styles.carInfoValue, {color: theme.text}]}>
                  {item.lastService}
                </Text>
              </View>
            </View>

            <View style={styles.carInfoRow}>
              <View style={styles.carInfoItem}>
                <Fuel width={20} height={20} color={theme.accent} />
                <Text style={[styles.carInfoLabel, {color: theme.textSecondary}]}>
                  Livello carburante
                </Text>
                <Text style={[styles.carInfoValue, {color: theme.text}]}>
                  {item.fuelLevel}%
                </Text>
              </View>
              <View style={styles.carInfoItem}>
                <Activity width={20} height={20} color={theme.accent} />
                <Text style={[styles.carInfoLabel, {color: theme.textSecondary}]}>
                  Chilometraggio
                </Text>
                <Text style={[styles.carInfoValue, {color: theme.text}]}>
                  {car.currentMileage.toLocaleString()} km
                </Text>
              </View>
            </View>

            <View style={styles.carStatusContainer}>
              <Text style={[styles.carStatusLabel, {color: theme.textSecondary}]}>
                Stato:
              </Text>
              <Text style={[styles.carStatusValue, {color: item.statusColor}]}>
                {item.status}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.carDetailButton, {backgroundColor: theme.accent}]}
          onPress={() => handleCarNavigation(item.id)}
        >
          <Text style={styles.carDetailButtonText}>Dettagli</Text>
          <ChevronRight width={16} height={16} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Card per azioni rapide
  const QuickActionCard = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.quickActionCard,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.border,
          shadowColor: theme.shadow,
        },
      ]}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={item.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.quickActionIcon}
      >
        <item.icon width={24} height={24} color="#ffffff" />
      </LinearGradient>
      <Text style={[styles.quickActionTitle, { color: theme.text }]}>
        {item.title}
      </Text>
      <Text style={[styles.quickActionSubtitle, { color: theme.textSecondary }]}>
        {item.subtitle}
      </Text>
      <ChevronRight
        width={16}
        height={16}
        color={theme.textSecondary}
        style={styles.quickActionArrow}
      />
    </TouchableOpacity>
  );

  // Card per attività recenti
  const ActivityItem = ({ item, isLast }) => (
    <TouchableOpacity 
      style={{ marginBottom: isLast ? 0 : 12 }}
      onPress={() => handleActivityNavigation(item)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.activityItem,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.activityIcon,
            {
              backgroundColor: item.iconBg,
            },
          ]}
        >
          <item.icon width={20} height={20} color="#ffffff" />
        </View>
        <View style={styles.activityContent}>
          <Text style={[styles.activityTitle, { color: theme.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.activitySubtitle, { color: theme.textSecondary }]}>
            {item.subtitle}
          </Text>
        </View>
        <View style={styles.activityMeta}>
          <Text style={[styles.activityDate, { color: theme.textSecondary }]}>
            {item.date}
          </Text>
          <ChevronRight width={16} height={16} color={theme.textSecondary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: theme.border },
        ]}
      >
        <View>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>
            Bentornato,
          </Text>
          <Text style={[styles.userName, { color: theme.text }]}>
            {user.name || 'Utente'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => handleNavigation('Notifications')}
          >
            <Bell width={24} height={24} color={theme.text} />
            <View style={[styles.notificationBadge, { backgroundColor: theme.error }]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => handleNavigation('Settings')}
          >
            <Settings width={24} height={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Carousel dei veicoli */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              I Tuoi Veicoli
            </Text>
            <TouchableOpacity onPress={() => handleNavigation('MyCars')}>
              <Text style={[styles.seeAllText, { color: theme.accent }]}>
                Vedi tutti
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.carouselContainer}>
            <Animated.FlatList
              data={cars}
              keyExtractor={(item) => item.id}
              renderItem={renderCarCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH + CARD_SPACING}
              decelerationRate="fast"
              contentContainerStyle={styles.carouselContent}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: true }
              )}
              scrollEventThrottle={16}
            />
            {renderCarouselIndicators()}
          </View>
        </View>

        {/* Aggiungi veicolo */}
        <TouchableOpacity
          style={[
            styles.addVehicleButton,
            { backgroundColor: theme.accent },
          ]}
          onPress={() => handleNavigation('AddCar')}
          activeOpacity={0.8}
        >
          <Plus width={20} height={20} color="#ffffff" />
          <Text style={styles.addVehicleText}>
            Aggiungi Nuovo Veicolo
          </Text>
        </TouchableOpacity>

        {/* Azioni Rapide */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Azioni Rapide
            </Text>
          </View>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <QuickActionCard key={index} item={action} />
            ))}
          </View>
        </View>

        {/* Attività Recenti */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Attività Recenti
            </Text>
            <TouchableOpacity onPress={() => handleNavigation('ActivityHistory')}>
              <Text style={[styles.seeAllText, { color: theme.accent }]}>
                Vedi tutto
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.activityCard,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            {recentActivities.map((activity, index) => (
              <ActivityItem
                key={activity.id}
                item={activity}
                isLast={index === recentActivities.length - 1}
              />
            ))}
          </View>
        </View>

        {/* Riepilogo Annuale */}
        <TouchableOpacity
          style={[
            styles.statsCard,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
          onPress={() => handleNavigation('Statistics')}
          activeOpacity={0.8}
        >
          <Text style={[styles.statsTitle, { color: theme.text }]}>
            Riepilogo Annuale
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <BarChart2 width={24} height={24} color={theme.accent} style={{marginBottom: 8}} />
              <Text style={[styles.statValue, { color: theme.text }]}>15</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Interventi
              </Text>
            </View>
            <View style={styles.statItem}>
              <DollarSign width={24} height={24} color={theme.warning} style={{marginBottom: 8}} />
              <Text style={[styles.statValue, { color: theme.text }]}>€2,450</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Spese Totali
              </Text>
            </View>
            <View style={styles.statItem}>
              <MapPin width={24} height={24} color={theme.success} style={{marginBottom: 8}} />
              <Text style={[styles.statValue, { color: theme.text }]}>32,500</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Km Percorsi
              </Text>
            </View>
          </View>
          <ChevronRight
            width={20}
            height={20}
            color={theme.textSecondary}
            style={styles.statsArrow}
          />
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            {
              borderColor: theme.border,
            },
          ]}
          onPress={logout}
          activeOpacity={0.7}
        >
          <Text style={[styles.logoutButtonText, { color: theme.text }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    marginRight: 16,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  settingsButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
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
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Stili per il carousel di veicoli
  carouselContainer: {
    marginBottom: 8,
  },
  carouselContent: {
    paddingRight: CARD_SPACING,
  },
  carouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  carCard: {
    width: CARD_WIDTH,
    marginLeft: CARD_SPACING,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  carCardTouchable: {
    flex: 1,
  },
  carImageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  carImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  carIcon: {
    marginBottom: 8,
  },
  carModel: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  carPlate: {
    fontSize: 14,
    textAlign: 'center',
  },
  carInfoContainer: {
    padding: 16,
  },
  carInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  carInfoItem: {
    alignItems: 'center',
    width: '48%',
  },
  carInfoLabel: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  carInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  carStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  carStatusLabel: {
    fontSize: 14,
    marginRight: 4,
  },
  carStatusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  carDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  carDetailButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginRight: 4,
  },

  // Stili per le azioni rapide
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  quickActionCard: {
    width: (screenWidth - 52) / 2,
    padding: 16,
    margin: 6,
    borderRadius: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 14,
  },
  quickActionArrow: {
    position: 'absolute',
    top: 16,
    right: 16,
  },

  // Stile per il pulsante di aggiunta veicolo
  addVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  addVehicleText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Stili per le attività recenti
  activityCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 14,
  },
  activityMeta: {
    alignItems: 'flex-end',
  },
  activityDate: {
    fontSize: 12,
    marginBottom: 4,
  },

  // Stili per il riepilogo statistiche
  statsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  statsArrow: {
    position: 'absolute',
    top: 20,
    right: 20,
  },

  // Stile per il pulsante di logout
  logoutButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HomeScreen;
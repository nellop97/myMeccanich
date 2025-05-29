import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, FAB, Paragraph, Text, Title, useTheme } from 'react-native-paper';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useStore } from '../store';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.7;
const SPACING = 13;
const SIDECARD_LENGTH = (SCREEN_WIDTH - CARD_WIDTH - SPACING * 3) / 8;
const CAR_OFFSET = SIDECARD_LENGTH + SPACING;


type CarItemProps = {
  item: {
    id: string;
    model: string;
    image: string;
    description: string;
  };
  index: number;
  scrollX: Animated.SharedValue<number>;
  theme: ReturnType<typeof useTheme>;
};

function CarItem({ item, index, scrollX, theme }: CarItemProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const inputRange = [
    (index - 1) * CARD_WIDTH - CAR_OFFSET,
    index * CARD_WIDTH - CAR_OFFSET,
    (index + 1) * CARD_WIDTH - CAR_OFFSET,
  ];

  const animatedStyle = useAnimatedStyle(() => {
    
    const scale = interpolate(scrollX.value, inputRange, [0.8, 1, 0.8], Extrapolate.CLAMP);
    const rotateY = interpolate(scrollX.value, inputRange, [30, 0, -30], Extrapolate.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.5, 1, 0.5], Extrapolate.CLAMP);

    return {
      transform: [{ perspective: 800 }, { scale }, { rotateY: `${rotateY}deg` }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.carContainer,
        animatedStyle,
        { backgroundColor: theme.colors.surfaceVariant },
      ]}
    >
      <Card style={styles.carCard}>
        <Card.Cover source={{ uri: item.image }} style={styles.carImage} resizeMode="cover" />
        <Card.Content>
          <Title style={styles.carTitle}>{item.model}</Title>
          <Paragraph>{item.description}</Paragraph>
        </Card.Content>
        <Card.Actions>
        <Button
          onPress={() =>
            navigation.navigate('CarDetail', {
              model: item.model,
              year: 2021,
              vin: 'ABC123',
              status: 'Attiva',
              mileage: 10000,
              specs: [
                { label: 'Autonomia (EPA)', value: '423 km' }, // [4][11]
                { label: 'Capacità batteria', value: '54 kWh' }, // [12]
                { label: 'Velocità massima', value: '225 km/h' }, // [12]
                { label: 'Accelerazione 0-100 km/h', value: '5.6 secondi' }, // [12]
                { label: 'Potenza motore', value: '283 CV' }, // [12]
                { label: 'Peso a vuoto', value: '1.645 kg' }, // [12]
                { label: 'Carico utile', value: '454 kg' }, // [9]
                { label: 'Portata trainabile', value: '910 kg' }, // [9]
                { label: 'Caricamento DC', value: '170 kW max' }, // [12]
                { label: 'Sistema frenante', value: 'Freni a disco ventilati' }, // [11]
                { label: 'Sicurezza', value: '5 stelle NHTSA, 94% Euro NCAP' }, // [12]
                { label: 'Dimensioni', value: '4694 mm (L) x 2088 mm (W)' } // [9][12]
              ],
              repairs: [
                {
                  id: '1',
                  date: '2023-03-15',
                  shop: 'Officina Tesla Milano',
                  description: 'Sostituzione bracci inferiori anteriori',
                  cost: 420.50,
                  parts: [
                    {
                      partNumber: 'TS-CTA-2021',
                      name: 'Braccio controllo anteriore',
                      qty: 2,
                      unitCost: 150.00
                    },
                    {
                      partNumber: 'TS-BUS-003',
                      name: 'Cuscinetti sfera',
                      qty: 4,
                      unitCost: 25.00
                    }
                  ]
                },
                {
                  id: '2',
                  date: '2022-11-20',
                  shop: 'AutoElettrica Roma',
                  description: 'Manutenzione sistema HVAC e sostituzione filtro abitacolo',
                  cost: 285.00,
                  parts: [
                    {
                      partNumber: 'TS-FILT-2021',
                      name: 'Filtro abitacolo Tesla',
                      qty: 1,
                      unitCost: 45.00
                    },
                    {
                      partNumber: 'TS-COIL-007',
                      name: 'Bobina riscaldamento',
                      qty: 1,
                      unitCost: 120.00
                    }
                  ]
                },
                {
                  id: '3',
                  date: '2023-05-10',
                  shop: 'Centro Assistenza Torino',
                  description: 'Aggiornamento firmware e calibrazione sensori',
                  cost: 150.00,
                  parts: [] // Nessun ricambio per interventi software
                }
              ],
            })
          }
        >
          Dettagli
        </Button>

          <Button mode="contained">Prenota</Button>
        </Card.Actions>
      </Card>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const { user } = useStore();
  const scrollX = useSharedValue(0);

  const cars = [
    { id: '1', model: 'Tesla Model S', image: 'https://via.placeholder.com/350x200', description: 'Auto elettrica di lusso con autonomia eccezionale' },
    { id: '2', model: 'Ferrari 488', image: 'https://via.placeholder.com/350x200', description: 'Supercar italiana con prestazioni straordinarie' },
    { id: '3', model: 'Lamborghini Huracán', image: 'https://via.placeholder.com/350x200', description: 'Design aggressivo e motore V10 potentissimo' },
    { id: '4', model: 'Porsche 911', image: 'https://via.placeholder.com/350x200', description: "Un'icona senza tempo dell'ingegneria tedesca" },
    { id: '5', model: 'Audi e-tron GT', image: 'https://via.placeholder.com/350x200', description: 'Gran turismo elettrica con design futuristico' },
  ];

  const cards = [
    { id: '1', title: 'Benvenuto nella tua app', description: 'Questa è la pagina principale della tua nuova applicazione. Qui puoi visualizzare contenuti e accedere alle diverse funzionalità.', avatar: 'A' },
    { id: '2', title: 'Novità', description: 'Scopri le ultime funzionalità e aggiornamenti della tua applicazione. Puoi personalizzare questa sezione con i contenuti che preferisci.', avatar: 'N' },
    { id: '3', title: 'Suggerimenti', description: 'Consigli e suggerimenti su come utilizzare al meglio la tua applicazione. Qui puoi trovare informazioni utili per ottimizzare la tua esperienza.', avatar: 'S' },
  ];

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Title>Bentornato, {user?.name || 'Utente'}</Title>
            <Paragraph>È bello rivederti nella tua app!</Paragraph>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={() => navigation.navigate('Profile', { userId: user?.id || '123' })}>
              Il mio profilo
            </Button>
          </Card.Actions>
        </Card>

        <Text variant="titleLarge" style={styles.sectionTitle}>Le tue auto</Text>

        <View style={styles.carSliderContainer}>
          <Animated.FlatList
            data={cars}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <CarItem item={item} index={index} scrollX={scrollX} theme={theme} />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH}
            decelerationRate="fast"
            contentContainerStyle={styles.carList}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
          />
        </View>

        <Text variant="titleLarge" style={styles.sectionTitle}>In evidenza</Text>

        {cards.map(card => (
          <Card key={card.id} style={styles.card}>
            <Card.Title
              title={card.title}
              left={(props) => <Avatar.Text {...props} size={40} label={card.avatar} />}
            />
            <Card.Content>
              <Paragraph>{card.description}</Paragraph>
            </Card.Content>
            <Card.Actions>
              <Button>Dettagli</Button>
              <Button mode="contained">Azione</Button>
            </Card.Actions>
          </Card>
        ))}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => console.log('FAB pressed')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  welcomeCard: {
    marginBottom: 16,
    elevation: 4,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  carSliderContainer: {
    height: 320,
    marginBottom: 16,
  },
  carList: {
    paddingHorizontal: SIDECARD_LENGTH,
  },
  carContainer: {
    width: CARD_WIDTH,
    height: 300,
    marginHorizontal: SPACING,
    borderRadius: 12,
  },
  carCard: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 12,
    elevation: 8,
  },
  carImage: {
    height: 160,
  },
  carTitle: {
    fontWeight: 'bold',
    marginTop: 8,
  },
});
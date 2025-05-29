// 2. Crea CarsByDateScreen.tsx
import { useWorkshopStore } from '@/src/store/workshopStore';
import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';

export default function CarsByDateScreen({ route }) {
  const { date } = route.params;
  const theme = useTheme();
  const { cars } = useWorkshopStore();

  const filteredCars = cars.filter(car => 
    car.repairs.some(repair => repair.scheduledDate === date)
  );

  return (
    <FlatList
      data={filteredCars}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <Card.Title
            title={item.model}
            subtitle={`VIN: ${item.vin}`}
          />
          <Card.Content>
            <Text variant="bodyMedium">Riparazioni programmate:</Text>
            {item.repairs
              .filter(r => r.scheduledDate === date)
              .map(repair => (
                <Text key={repair.id} style={styles.repairText}>
                  • {repair.description} - Consegna: {repair.deliveryDate}
                </Text>
              ))}
          </Card.Content>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  repairText: {
    marginLeft: 8,
    marginTop: 4,
  },
});

// 4. Crea RepairDetailsScreen.tsx
import { useWorkshopStore } from '@/src/store/workshopStore';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';

export default function RepairDetailsScreen({ route }) {
  const { carId, repairId } = route.params;
  const theme = useTheme();
  const { getRepairDetails } = useWorkshopStore();

  const repair = getRepairDetails(carId, repairId);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card>
        <Card.Title title={repair.description} />
        <Card.Content>
          <Text variant="titleMedium">Dettagli:</Text>
          <Text>Data programmata: {repair.scheduledDate}</Text>
          <Text>Data consegna: {repair.deliveryDate}</Text>
          <Text>Costo totale: €{repair.totalCost.toFixed(2)}</Text>
          
          <Text variant="titleMedium" style={styles.partsTitle}>
            Parti utilizzate:
          </Text>
          {repair.parts.map(part => (
            <Text key={part.id} style={styles.partText}>
              • {part.name} (x{part.quantity})
            </Text>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  partsTitle: {
    marginTop: 16,
  },
  partText: {
    marginLeft: 8,
  },
});

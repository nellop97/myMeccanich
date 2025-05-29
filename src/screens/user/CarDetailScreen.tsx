// src/screens/CarDetailScreen.tsx
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Avatar,
  Button,
  Card,
  DataTable,
  List,
  Paragraph,
  Text,
  useTheme
} from 'react-native-paper';

type Repair = {
  id: string;
  date: string;
  shop: string;
  description: string;
  cost: number;
  parts: Part[];
};

type Part = {
  partNumber: string;
  name: string;
  qty: number;
  unitCost: number;
};

export type RouteParams = {
  model: string;
  year: number;
  vin: string;
  status: string;
  mileage: number;
  specs: { label: string; value: string }[];
  repairs: Repair[];
};

export default function CarDetailScreen({ route }: { route: { params: RouteParams } }) {
  const { model, year, vin, status, mileage, specs, repairs } = route.params;
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
      {/* Intestazione */}
      <Card style={styles.headerCard} elevation={4}>
        <Card.Title
          title={`${model} (${year})`}
          subtitle={`VIN: ${vin}`}
          left={(props) => <Avatar.Text {...props} size={48} label={model[0]} />}
        />
        <Card.Content>
          <Paragraph>Status: <Text style={{ color: status === 'OK' ? theme.colors.primary : theme.colors.error }}>{status}</Text></Paragraph>
          <Paragraph>Chilometraggio: {mileage ? mileage.toLocaleString() : 'N/D'} km</Paragraph>
        </Card.Content>
      </Card>

      {/* Specifiche Tecniche */}
      <Card style={styles.sectionCard} elevation={2}>
        <Card.Title title="Specifiche Tecniche" />
        <Card.Content>
          {specs && specs.length > 0 ? (
            specs.map((spec) => (
              <View style={styles.specRow} key={spec.label}>
                <Text style={styles.specLabel}>{spec.label}</Text>
                <Text>{spec.value}</Text>
              </View>
            ))
          ) : (
            <Text>Nessuna specifica disponibile</Text>
          )}
        </Card.Content>
      </Card>

      {/* Storico Riparazioni */}
      <Card style={styles.sectionCard} elevation={2}>
        <Card.Title title="Storico Riparazioni" />
        <Card.Content>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Data</DataTable.Title>
              <DataTable.Title>Officina</DataTable.Title>
              <DataTable.Title numeric>Costo €</DataTable.Title>
            </DataTable.Header>
            {repairs && repairs.length > 0 ? (
              repairs.map((r) => (
                <React.Fragment key={r.id}>
                  <DataTable.Row>
                    <DataTable.Cell>{r.date || 'N/D'}</DataTable.Cell>
                    <DataTable.Cell>{r.shop || 'N/D'}</DataTable.Cell>
                    <DataTable.Cell numeric>{typeof r.cost === 'number' ? r.cost.toFixed(2) : 'N/D'}</DataTable.Cell>
                  </DataTable.Row>
                  {/* Lista dei pezzi usati */}
                  {r.parts && r.parts.length > 0 ? (
                    r.parts.map((p) => (
                      <List.Item
                        key={p.partNumber}
                        title={`${p.name || 'Pezzo'} (${p.partNumber || 'N/D'})`}
                        description={`Qty: ${p.qty || 0}, Prezzo: €${typeof p.unitCost === 'number' ? p.unitCost.toFixed(2) : 'N/D'}`}
                        left={(props) => <List.Icon {...props} icon="tools" />}
                        style={styles.partItem}
                      />
                    ))
                  ) : (
                    <List.Item
                      title="Nessun pezzo registrato"
                      left={(props) => <List.Icon {...props} icon="information" />}
                      style={styles.partItem}
                    />
                  )}
                </React.Fragment>
              ))
            ) : (
              <DataTable.Row>
                <DataTable.Cell>Nessuna riparazione registrata</DataTable.Cell>
                <DataTable.Cell></DataTable.Cell>
                <DataTable.Cell numeric></DataTable.Cell>
              </DataTable.Row>
            )}
          </DataTable>
        </Card.Content>
      </Card>

      {/* Azioni */}
      <View style={styles.actions}>
        <Button mode="contained" onPress={() => {/* naviga a modifica */}}>
          Modifica Dati
        </Button>
        <Button mode="outlined" style={{ marginLeft: 12 }} onPress={() => {/* nuova riparazione */}}>
          Aggiungi Riparazione
        </Button>
      </View>
    </ScrollView>
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
  headerCard: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  sectionCard: {
    marginBottom: 16,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  specLabel: {
    fontWeight: 'bold',
    width: '50%',
  },
  partItem: {
    paddingLeft: 32,
    backgroundColor: '#FAFAFA',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginVertical: 16,
  },
});
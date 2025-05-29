// 1. Crea NewAppointmentScreen.tsx
import { useWorkshopStore } from '@/src/store/workshopStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Card, TextInput, useTheme } from 'react-native-paper';

export type FormData = {
  carModel: string;
  vin: string;
  repairDescription: string;
  scheduledDate: Date;
  deliveryDate: Date;
};

export default function NewAppointmentScreen() {
  const theme = useTheme();
  const { addAppointment } = useWorkshopStore();
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    addAppointment({
      carModel: data.carModel,
      vin: data.vin,
      repairs: [{
        id: Date.now().toString(),
        description: data.repairDescription,
        scheduledDate: data.scheduledDate.toISOString().split('T')[0],
        deliveryDate: data.deliveryDate.toISOString().split('T')[0],
        status: 'da-iniziare',
        parts: []
      }]
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Nuovo Appuntamento" />
        <Card.Content>
          <Controller
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Modello Auto"
                mode="outlined"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={!!errors.carModel}
              />
            )}
            name="carModel"
          />

          <Controller
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="VIN"
                mode="outlined"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                style={styles.input}
                error={!!errors.vin}
              />
            )}
            name="vin"
          />

          <Controller
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Descrizione Riparazione"
                mode="outlined"
                multiline
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                style={styles.input}
                error={!!errors.repairDescription}
              />
            )}
            name="repairDescription"
          />

          <Controller
            control={control}
            render={({ field: { onChange, value } }) => (
              <DateTimePicker
                value={value || new Date()}
                mode="date"
                display="default"
                onChange={(_, date) => onChange(date)}
              />
            )}
            name="scheduledDate"
          />

          <Controller
            control={control}
            render={({ field: { onChange, value } }) => (
              <DateTimePicker
                value={value || new Date()}
                mode="date"
                display="default"
                onChange={(_, date) => onChange(date)}
              />
            )}
            name="deliveryDate"
          />

          <Button 
            mode="contained" 
            onPress={handleSubmit(onSubmit)}
            style={styles.button}>
            Salva Appuntamento
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  input: {
    marginTop: 10,
  },
  button: {
    marginTop: 20,
  },
});

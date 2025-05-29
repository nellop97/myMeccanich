// 2. Crea PartEntryModal.tsx
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Modal, StyleSheet, View } from 'react-native';
import { Button, TextInput, useTheme } from 'react-native-paper';

type PartForm = {
  partNumber: string;
  name: string;
  quantity: string;
  unitCost: string;
};

export default function PartEntryModal({ visible, onDismiss, onSave }) {
  const theme = useTheme();
  const { control, handleSubmit, reset } = useForm<PartForm>();

  const handleSave = (data: PartForm) => {
    onSave({
      ...data,
      quantity: parseInt(data.quantity),
      unitCost: parseFloat(data.unitCost)
    });
    reset();
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}>
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <Controller
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Codice Pezzo"
                mode="outlined"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                style={styles.input}
              />
            )}
            name="partNumber"
          />

          <Controller
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Nome Pezzo"
                mode="outlined"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                style={styles.input}
              />
            )}
            name="name"
          />

          <Controller
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Quantità"
                mode="outlined"
                keyboardType="numeric"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                style={styles.input}
              />
            )}
            name="quantity"
          />

          <Controller
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Costo Unitario"
                mode="outlined"
                keyboardType="numeric"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                style={styles.input}
              />
            )}
            name="unitCost"
          />

          <Button 
            mode="contained" 
            onPress={handleSubmit(handleSave)}
            style={styles.button}>
            Aggiungi Pezzo
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    margin: 20,
    borderRadius: 10,
    padding: 15,
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginTop: 15,
  },
});

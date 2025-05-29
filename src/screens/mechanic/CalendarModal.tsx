// 1. Crea il componente CalendarModal.tsx
import React from 'react';
import { Modal, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTheme } from 'react-native-paper';

export default function CalendarModal({ visible, onClose, onDateSelect }) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
        <TouchableWithoutFeedback onPress={onClose}> 
        <View style={styles.modalContainer}>
            <View style={[styles.calendarContainer, { backgroundColor: theme.colors.background }]}>
            <Calendar
                onDayPress={day => {
                onDateSelect(day.dateString);
                onClose();
                }}
                theme={{
                backgroundColor: theme.colors.background,
                calendarBackground: theme.colors.background,
                }}
            />
            </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  calendarContainer: {
    margin: 20,
    borderRadius: 10,
    padding: 15,
  },
});

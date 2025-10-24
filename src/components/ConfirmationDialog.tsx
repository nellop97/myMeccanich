// src/components/ConfirmationDialog.tsx
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { Button } from 'react-native-paper';
import { AlertCircle, XCircle, CheckCircle, Shield } from 'lucide-react-native';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'success' | 'info';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  colors: any;
}

export default function ConfirmationDialog({
  visible,
  title,
  message,
  type = 'info',
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  onConfirm,
  onCancel,
  isLoading = false,
  colors,
}: ConfirmationDialogProps) {
  const getIcon = () => {
    const size = 48;
    switch (type) {
      case 'danger':
        return <XCircle size={size} color="#EF4444" />;
      case 'warning':
        return <AlertCircle size={size} color="#F59E0B" />;
      case 'success':
        return <CheckCircle size={size} color="#10B981" />;
      default:
        return <Shield size={size} color={colors.primary} />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'danger':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'success':
        return '#10B981';
      default:
        return colors.primary;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onCancel}
      >
        <TouchableOpacity
          style={[styles.dialog, { backgroundColor: colors.surface }]}
          activeOpacity={1}
        >
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>

          <Text style={[styles.title, { color: colors.onSurface }]}>
            {title}
          </Text>

          <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>
            {message}
          </Text>

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={onCancel}
              disabled={isLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              {cancelText}
            </Button>
            <Button
              mode="contained"
              onPress={onConfirm}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              buttonColor={getColor()}
            >
              {confirmText}
            </Button>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      },
    }),
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
  buttonContent: {
    paddingVertical: 6,
  },
});

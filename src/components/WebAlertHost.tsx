// src/components/WebAlertHost.tsx - Finestre di showAlert e showPrompt su web
import React, { useEffect, useState } from 'react';
import { AlertButton, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  MECHANIC_MIN_TOUCH,
  mechanicRadius,
  mechanicSpacing,
  useMechanicTheme,
} from '../screens/mechanic/mechanicTheme';
import { subscribeWebAlerts, WebAlertRequest } from '../utils/platformHelpers';

interface QueuedAlert extends WebAlertRequest {
  id: number;
}

interface WebAlertDialogProps {
  request: WebAlertRequest;
  onClose: () => void;
}

let nextAlertId = 0;

function WebAlertDialog({ request, onClose }: WebAlertDialogProps) {
  const theme = useMechanicTheme();
  const [text, setText] = useState('');
  const { buttons, message, title, withInput } = request;

  const pressButton = (button: AlertButton) => {
    onClose();
    const onPress = button.onPress as ((value?: string) => void) | undefined;
    onPress?.(withInput ? text : undefined);
  };

  // Come su mobile, ESC non deve scegliere al posto dell'utente tra due azioni
  const dismissButton =
    buttons.find(button => button.style === 'cancel') ??
    (buttons.length === 1 ? buttons[0] : undefined);

  const getButtonColors = (button: AlertButton) => {
    if (button.style === 'cancel') {
      return { backgroundColor: theme.surfaceVariant, color: theme.text };
    }
    if (button.style === 'destructive') {
      return { backgroundColor: theme.errorLight, color: theme.text };
    }
    return { backgroundColor: theme.primaryDark, color: theme.onPrimary };
  };

  return (
    <Modal
      transparent
      visible
      animationType="none"
      onRequestClose={() => {
        if (dismissButton) {
          pressButton(dismissButton);
        }
      }}
    >
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View
          style={[styles.dialog, { backgroundColor: theme.surface, borderColor: theme.border }]}
          accessibilityRole="alert"
        >
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          {!!message && (
            <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
          )}

          {withInput && (
            <TextInput
              autoFocus
              value={text}
              onChangeText={setText}
              onSubmitEditing={() => pressButton(buttons[buttons.length - 1])}
              accessibilityLabel={message || title}
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
            />
          )}

          <View style={styles.actions}>
            {buttons.map((button, index) => {
              const { backgroundColor, color } = getButtonColors(button);
              return (
                <Pressable
                  key={`${button.text}-${index}`}
                  onPress={() => pressButton(button)}
                  accessibilityRole="button"
                  style={[styles.button, { backgroundColor }]}
                >
                  <Text style={[styles.buttonText, { color }]}>{button.text ?? 'OK'}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Una finestra alla volta: quelle aperte dalla callback di un pulsante vanno in coda
export default function WebAlertHost() {
  const [queue, setQueue] = useState<QueuedAlert[]>([]);

  useEffect(
    () =>
      subscribeWebAlerts(request => {
        setQueue(previous => [...previous, { ...request, id: nextAlertId++ }]);
      }),
    []
  );

  const current = queue[0];
  if (!current) {
    return null;
  }

  // Montata solo quando serve: così il Modal finisce sopra quelli già aperti
  return (
    <WebAlertDialog
      key={current.id}
      request={current}
      onClose={() => setQueue(previous => previous.slice(1))}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: mechanicSpacing.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    borderRadius: mechanicRadius.lg,
    borderWidth: 1,
    padding: mechanicSpacing.lg,
    gap: mechanicSpacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
  },
  input: {
    minHeight: MECHANIC_MIN_TOUCH,
    borderRadius: mechanicRadius.md,
    borderWidth: 1,
    paddingHorizontal: mechanicSpacing.md,
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: mechanicSpacing.sm,
    marginTop: mechanicSpacing.xs,
  },
  button: {
    minHeight: MECHANIC_MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mechanicRadius.md,
    paddingHorizontal: mechanicSpacing.md,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

// src/utils/platformHelpers.ts
import { Alert, AlertButton, Platform } from 'react-native';

/**
 * Helper per gestire le differenze tra piattaforme
 */
export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

export interface WebAlertRequest {
  title: string;
  message?: string;
  buttons: AlertButton[];
  withInput?: boolean;
}

type WebAlertListener = (request: WebAlertRequest) => void;

let webAlertListener: WebAlertListener | null = null;

// Usata da WebAlertHost, montato in App.web.tsx, che disegna le finestre
export const subscribeWebAlerts = (listener: WebAlertListener) => {
  webAlertListener = listener;
  return () => {
    webAlertListener = null;
  };
};

/**
 * Stessa forma di Alert.alert. Su web Alert.alert di react-native-web è un metodo
 * vuoto: la finestra la disegna WebAlertHost, con qualsiasi numero di pulsanti
 */
export const showAlert = (title: string, message?: string, buttons?: AlertButton[]) => {
  if (isWeb) {
    webAlertListener?.({
      title,
      message,
      buttons: buttons?.length ? buttons : [{ text: 'OK' }],
    });
    return;
  }
  Alert.alert(title, message, buttons);
};

/**
 * Finestra con un campo di testo. Alert.prompt non esiste su web e funziona
 * solo su iOS: su Android la chiamata non mostra nulla
 */
export const showPrompt = (
  title: string,
  message: string,
  onSubmit: (text: string) => void
) => {
  if (isWeb) {
    webAlertListener?.({
      title,
      message,
      withInput: true,
      buttons: [
        { text: 'Annulla', style: 'cancel' },
        { text: 'OK', onPress: (value?: string) => onSubmit(value ?? '') },
      ],
    });
    return;
  }
  Alert.prompt(title, message, onSubmit);
};

export const confirmAction = (
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void
) => {
  showAlert(title, message, [
    { text: 'Annulla', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
};

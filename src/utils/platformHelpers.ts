// src/utils/platformHelpers.ts
import { Platform } from 'react-native';

/**
 * Helper per gestire le differenze tra piattaforme
 */
export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
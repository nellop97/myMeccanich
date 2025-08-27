// =====================================================
// 1. SERVIZIO SICUREZZA - SecurityService.ts
// =====================================================
// src/services/SecurityService.ts

import { Platform, Alert } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export class SecurityService {
  private static instance: SecurityService;
  private db = getFirestore();
  
  private constructor() {}
  
  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // Previene screenshot su mobile
  async preventScreenCapture(enable: boolean = true): Promise<void> {
    if (Platform.OS !== 'web') {
      try {
        if (enable) {
          await ScreenCapture.preventScreenCaptureAsync();
        } else {
          await ScreenCapture.allowScreenCaptureAsync();
        }
      } catch (error) {
        console.warn('Screenshot prevention not available:', error);
      }
    }
  }

  // Watermark per dati sensibili (web)
  addWatermark(element: HTMLElement, userId: string): void {
    if (Platform.OS === 'web') {
      element.style.position = 'relative';
      const watermark = document.createElement('div');
      watermark.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 48px;
        opacity: 0.1;
        pointer-events: none;
        user-select: none;
        z-index: 9999;
      `;
      watermark.textContent = `CONFIDENZIALE - ${userId}`;
      element.appendChild(watermark);
    }
  }

  // Disabilita menu contestuale (web)
  disableContextMenu(): void {
    if (Platform.OS === 'web') {
      document.addEventListener('contextmenu', (e) => e.preventDefault());
    }
  }

  // Log accesso ai dati sensibili
  async logDataAccess(userId: string, carId: string, action: string): Promise<void> {
    try {
      const logRef = doc(this.db, 'access_logs', `${userId}_${Date.now()}`);
      await setDoc(logRef, {
        userId,
        carId,
        action,
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
      });
    } catch (error) {
      console.error('Error logging access:', error);
    }
  }

  // Verifica permessi visualizzazione
  async checkViewPermission(ownerId: string, viewerId: string, carId: string): Promise<boolean> {
    try {
      const permissionRef = doc(this.db, 'view_permissions', `${carId}_${viewerId}`);
      const permission = await getDoc(permissionRef);
      
      if (!permission.exists()) return false;
      
      const data = permission.data();
      return data.ownerId === ownerId && data.active === true;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }
}
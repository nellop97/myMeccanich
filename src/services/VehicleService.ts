// =====================================================
// 2. SERVIZI FIREBASE
// =====================================================
// src/services/VehicleService.ts

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  serverTimestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from './firebase';
import { Vehicle, VehicleImage, PrivacySettings } from '../types/database.types';

export class VehicleService {
  private static instance: VehicleService;
  private vehiclesCollection = 'vehicles';
  private cacheTimeout = 5 * 60 * 1000; // 5 minuti
  private cache = new Map<string, { data: Vehicle; timestamp: number }>();

  private constructor() {}

  static getInstance(): VehicleService {
    if (!VehicleService.instance) {
      VehicleService.instance = new VehicleService();
    }
    return VehicleService.instance;
  }

  // Ottieni veicolo per ID con cache
  async getVehicle(vehicleId: string, forceRefresh = false): Promise<Vehicle | null> {
    try {
      // Controlla cache
      if (!forceRefresh) {
        const cached = this.cache.get(vehicleId);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      const docRef = doc(db, this.vehiclesCollection, vehicleId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const vehicle = { 
        id: docSnap.id, 
        ...docSnap.data() 
      } as Vehicle;

      // Aggiorna cache
      this.cache.set(vehicleId, { 
        data: vehicle, 
        timestamp: Date.now() 
      });

      return vehicle;
    } catch (error) {
      console.error('Error getting vehicle:', error);
      throw error;
    }
  }

  // Ottieni tutti i veicoli dell'utente
  async getUserVehicles(userId: string): Promise<Vehicle[]> {
    try {
      const q = query(
        collection(db, this.vehiclesCollection),
        where('ownerId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Vehicle));
    } catch (error) {
      console.error('Error getting user vehicles:', error);
      throw error;
    }
  }

  // Crea nuovo veicolo
  async createVehicle(vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = doc(collection(db, this.vehiclesCollection));
      
      const vehicle = {
        ...vehicleData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        maintenanceCount: 0,
        documentsCount: 0,
        privacySettings: this.getDefaultPrivacySettings()
      };

      await setDoc(docRef, vehicle);
      return docRef.id;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  }

  // Aggiorna veicolo
  async updateVehicle(vehicleId: string, updates: Partial<Vehicle>): Promise<void> {
    try {
      const docRef = doc(db, this.vehiclesCollection, vehicleId);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // Invalida cache
      this.cache.delete(vehicleId);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  }

  // Aggiorna privacy settings
  async updatePrivacySettings(
    vehicleId: string, 
    settings: PrivacySettings
  ): Promise<void> {
    try {
      await this.updateVehicle(vehicleId, { privacySettings: settings });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  }

  // Upload immagine veicolo
  async uploadVehicleImage(
    vehicleId: string, 
    imageUri: string, 
    isMain = false
  ): Promise<VehicleImage> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const imageId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const storageRef = ref(storage, `vehicles/${vehicleId}/${imageId}`);
      
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      
      const image: VehicleImage = {
        id: imageId,
        url,
        uploadedAt: new Date(),
        isMain
      };

      // Aggiorna veicolo con nuova immagine
      const vehicle = await this.getVehicle(vehicleId);
      if (vehicle) {
        const images = [...(vehicle.images || []), image];
        await this.updateVehicle(vehicleId, {
          images,
          ...(isMain && { mainImageUrl: url })
        });
      }

      return image;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // Listener real-time per un veicolo
  subscribeToVehicle(
    vehicleId: string, 
    callback: (vehicle: Vehicle | null) => void
  ): Unsubscribe {
    const docRef = doc(db, this.vehiclesCollection, vehicleId);
    
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const vehicle = { id: doc.id, ...doc.data() } as Vehicle;
        callback(vehicle);
        
        // Aggiorna cache
        this.cache.set(vehicleId, { 
          data: vehicle, 
          timestamp: Date.now() 
        });
      } else {
        callback(null);
      }
    });
  }

  // Privacy settings di default
  private getDefaultPrivacySettings(): PrivacySettings {
    return {
      showPersonalInfo: true,
      showMileage: true,
      showMaintenanceHistory: true,
      showMaintenanceDetails: false,
      showCosts: false,
      showMechanics: false,
      showDocuments: false,
      showPhotos: true,
      allowDataTransfer: false,
      requirePinForTransfer: true
    };
  }
}
// src/services/SyncService.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, onSnapshot, doc } from 'firebase/firestore';

const firebaseConfig = {
  // Your config
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export class SyncService {
  static subscribeToUserCars(userId: string, callback: (cars: any[]) => void) {
    return onSnapshot(doc(db, 'users', userId), (doc) => {
      if (doc.exists()) {
        callback(doc.data().cars || []);
      }
    });
  }

  static async updateCar(userId: string, carId: string, data: any) {
    // Update logic
  }
}
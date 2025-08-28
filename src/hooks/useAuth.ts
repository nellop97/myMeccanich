// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { auth } from '../services/firebase';

// Import condizionale per onAuthStateChanged
let onAuthStateChanged: any;

if (Platform.OS === 'web') {
  // Web: usa Firebase JS SDK
  const { onAuthStateChanged: webAuthStateChanged } = require('firebase/auth');
  onAuthStateChanged = webAuthStateChanged;
} else {
  // Mobile: usa il listener già disponibile nell'istanza auth
  onAuthStateChanged = (callback: any) => {
    if (auth && typeof auth.onAuthStateChanged === 'function') {
      return auth.onAuthStateChanged(callback);
    } else {
      console.warn('Auth listener not available');
      callback(null);
      return () => {}; // Return empty unsubscribe function
    }
  };
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  userType?: 'user' | 'mechanic';
  isLoggedIn: boolean;
  isMechanic: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!auth) {
      console.warn('Firebase auth not available');
      setInitializing(false);
      return;
    }

    console.log('Setting up auth state listener...');

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: any) => {
      console.log('Auth state changed:', firebaseUser?.uid ? 'User logged in' : 'User logged out');
      
      if (firebaseUser) {
        // Utente autenticato
        const userData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          userType: 'user', // Default, da aggiornare con dati dal database
          isLoggedIn: true,
          isMechanic: false // Default, da aggiornare con dati dal database
        };
        setUser(userData);
      } else {
        // Utente non autenticato
        setUser(null);
      }

      if (initializing) {
        setInitializing(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [initializing]);

  return {
    user,
    initializing,
    signOut: async () => {
      try {
        if (Platform.OS === 'web') {
          const { signOut } = require('firebase/auth');
          await signOut(auth);
        } else {
          await auth.signOut();
        }
      } catch (error) {
        console.error('Error signing out:', error);
        throw error;
      }
    }
  };
}
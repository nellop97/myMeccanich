// src/store/index.ts
import { create } from 'zustand';

interface AppState {
  // Tema
  darkMode: boolean;
  toggleDarkMode: () => void;
  
  // Stato di caricamento
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
  
  // Stato utente
  user: {
    id: string | null;
    name: string | null;
    email: string | null;
    isLoggedIn: boolean;
    isMechanic: boolean;
  };
  setUser: (userData: Partial<AppState['user']>) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Tema
  darkMode: false,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  
  // Stato di caricamento
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
  
  // Stato utente
  user: {
    id: null,
    name: null,
    email: null,
    isLoggedIn: true,
    isMechanic: false,
  },
  setUser: (userData) => set((state) => ({ 
    user: { ...state.user, ...userData }
  })),
  logout: () => set({
    user: {
      id: null,
      name: null,
      email: null,
      isLoggedIn: false,
      isMechanic: false,
    }
  }),
}));
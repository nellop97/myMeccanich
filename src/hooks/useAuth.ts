// src/hooks/useAuth.ts
import { useEffect } from 'react';
import { useStore } from '../store';
import { authService } from '../services/AuthService';

export const useAuth = () => {
  const { user, setUser, setLoading, setError } = useStore();

  useEffect(() => {
    // Inizializza il servizio di autenticazione
    authService.initialize('YOUR_WEB_CLIENT_ID'); // Sostituisci con il tuo Web Client ID

    // Ascolta i cambiamenti dello stato di autenticazione
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, [setUser, setLoading]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const user = await authService.signInWithEmail(email, password);
      setUser(user);
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
      setLoading(true);
      setError(null);
      const user = await authService.signUpWithEmail(email, password, displayName);
      setUser(user);
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await authService.signInWithGoogle();
      setUser(user);
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithApple = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await authService.signInWithApple();
      setUser(user);
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await authService.signOut();
      setUser(null);
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      await authService.resetPassword(email);
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    isAuthenticated: !!user?.isLoggedIn,
    isLoading: useStore().isLoading,
    error: useStore().error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    signOut,
    resetPassword,
  };
};
// src/utils/authUtils.ts
import { AuthUser } from '../hooks/useAuth';

/**
 * Costruisce il nome visualizzato dell'utente con fallback multipli
 * @param authUser - L'oggetto utente autenticato
 * @returns Il nome da visualizzare
 */
export const buildUserDisplayName = (authUser: AuthUser | null | undefined): string => {
  // Gestisci caso in cui authUser è null o undefined
  if (!authUser) {
    return 'Utente';
  }

  // Priorità:
  // 1. name (da Firestore)
  // 2. displayName (da Firebase Auth)
  // 3. firstName + lastName (da Firestore)
  // 4. firstName solo (da Firestore)
  // 5. Parte locale dell'email
  // 6. "Utente" come fallback

  // Prova prima con il campo 'name' da Firestore
  if (authUser.name && typeof authUser.name === 'string' && authUser.name.trim()) {
    return authUser.name.trim();
  }

  // Poi prova con displayName
  if (authUser.displayName && typeof authUser.displayName === 'string' && authUser.displayName.trim()) {
    return authUser.displayName.trim();
  }

  // Prova con firstName e lastName
  const firstName = authUser.firstName || '';
  const lastName = authUser.lastName || '';
  
  if (firstName && lastName) {
    return `${firstName.trim()} ${lastName.trim()}`.trim();
  }

  if (firstName) {
    return firstName.trim();
  }

  // Usa l'email come fallback
  if (authUser.email && typeof authUser.email === 'string') {
    return extractNameFromEmail(authUser.email);
  }

  return 'Utente';
};

/**
 * Estrae un nome leggibile dall'email
 * @param email - L'indirizzo email
 * @returns Un nome formattato
 */
export const extractNameFromEmail = (email: string): string => {
  const emailLocal = email.split('@')[0];
  
  // Rimuovi numeri e caratteri speciali comuni
  const cleanName = emailLocal
    .replace(/[0-9_.-]/g, ' ')
    .trim()
    .split(' ')
    .filter(part => part.length > 0)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
  
  if (cleanName) {
    return cleanName;
  }
  
  // Se dopo la pulizia non rimane nulla, usa l'email originale capitalizzata
  return emailLocal.charAt(0).toUpperCase() + emailLocal.slice(1);
};

/**
 * Verifica se un utente è un meccanico
 * @param user - L'oggetto utente
 * @returns true se l'utente è un meccanico
 */
export const isMechanic = (user: AuthUser | null | undefined): boolean => {
  return user?.userType === 'mechanic';
};

/**
 * Verifica se un utente è un proprietario di auto
 * @param user - L'oggetto utente
 * @returns true se l'utente è un proprietario di auto
 */
export const isCarOwner = (user: AuthUser | null | undefined): boolean => {
  return user?.userType === 'user' || (!user?.userType && !!user);
};

/**
 * Ottiene l'avatar dell'utente o le iniziali per un placeholder
 * @param user - L'oggetto utente
 * @returns Un oggetto con l'URL dell'avatar o le iniziali
 */
export const getUserAvatar = (user: AuthUser | null | undefined): { photoURL?: string; initials: string } => {
  if (!user) {
    return { initials: 'U' };
  }

  if (user.photoURL) {
    return { photoURL: user.photoURL, initials: '' };
  }

  const displayName = buildUserDisplayName(user);
  const parts = displayName.split(' ');
  
  if (parts.length >= 2) {
    return { initials: `${parts[0][0]}${parts[1][0]}`.toUpperCase() };
  }
  
  return { initials: displayName.substring(0, 2).toUpperCase() };
};

/**
 * Formatta i dati utente per la visualizzazione
 * @param user - L'oggetto utente
 * @returns Un oggetto con i dati formattati
 */
export const formatUserData = (user: AuthUser | null | undefined) => {
  if (!user) {
    return {
      displayName: 'Utente',
      email: '',
      phone: '',
      userType: 'user',
      isVerified: false,
    };
  }

  return {
    displayName: buildUserDisplayName(user),
    email: user.email || '',
    phone: user.phoneNumber || user.workshopInfo?.phone || '',
    userType: user.userType || 'user',
    isVerified: user.emailVerified || false,
    workshopName: user.workshopName || user.workshopInfo?.name || null,
    address: user.address || user.workshopInfo?.address || null,
  };
};

/**
 * Verifica se il profilo utente è completo
 * @param user - L'oggetto utente
 * @returns true se il profilo è completo
 */
export const isProfileComplete = (user: AuthUser | null | undefined): boolean => {
  if (!user) return false;

  // Per proprietari di auto
  if (user.userType === 'user' || !user.userType) {
    return !!(
      user.name &&
      user.email &&
      user.emailVerified
    );
  }

  // Per meccanici
  if (user.userType === 'mechanic') {
    return !!(
      user.name &&
      user.email &&
      user.emailVerified &&
      (user.workshopName || user.workshopInfo?.name) &&
      (user.vatNumber || user.workshopInfo?.vatNumber)
    );
  }

  return false;
};
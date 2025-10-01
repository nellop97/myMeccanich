// Bridge Firebase per compatibilità cross-platform
// Per web (Expo 54), re-esporta tutto da firebase.web.ts
// Per mobile, usa firebase.web.ts comunque (compatibile con entrambi)

export { app, auth, db, storage, isFirebaseReady, handleAuthError, isWeb, isMobile } from './firebase.web';

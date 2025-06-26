// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configurazione Firebase - SOSTITUISCI CON I TUOI DATI REALI
const firebaseConfig = {
  apiKey: "AIzaSyC-AmP6d3a_VVXJnCWVHB1WmU_wPHF0ISI",
  authDomain: "mymecanich.firebaseapp.com",
  projectId: "mymecanich",
  storageBucket: "mymecanich.firebasestorage.app",
  messagingSenderId: "619020396283",
  appId: "1:619020396283:web:883f0ca48dce8c4d05b25e",
  measurementId: "G-FS1LZ8SWL1"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Inizializza i servizi
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
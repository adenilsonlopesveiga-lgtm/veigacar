// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// 🔴 USE EXATAMENTE AS MESMAS CHAVES DO SEU FIREBASE (as que já funcionam)
const firebaseConfig = {
  apiKey: "AIzaSyDN5VG5TYwtl48p8FAPmhuicoSz8xFj6_Q",
  authDomain: "veigacar-eee0d.firebaseapp.com",
  projectId: "veigacar-eee0d",
  storageBucket: "veigacar-eee0d.firebasestorage.app",
  messagingSenderId: "556926487254",
  appId: "1:556926487254:web:c9e859ae4d2b6e01cf5777"
};

const app = initializeApp(firebaseConfig);

// 🔴 TUDO AMARRADO AO MESMO APP
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "us-central1");
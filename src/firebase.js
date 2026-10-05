// src/firebase.js
import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  browserLocalPersistence,
  browserPopupRedirectResolver
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase config: EXPO_PUBLIC_* env ကို အရင်သုံးမယ်၊ မရှိရင် fallback သုံးမယ်
// Production မှာ .env file ထဲထည့်ပါ (ဥပမာ .env.example ကြည့်)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyBqCZYc1octHkFdym33TYeFmq-7nyGiqLU",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "japanese-mksedu.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "japanese-mksedu",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "japanese-mksedu.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_SENDER_ID || "310467540365",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:310467540365:web:c183423b7cb5837d0b79c4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Platform အလိုက် Auth နှင့် Persistence ကို ပုံစံခွဲထုတ်ခြင်း
let auth;
if (Platform.OS === 'web') {
  // Web (ကွန်ပျူတာ Browser) အတွက်
  // NOTE: popupRedirectResolver မထည့်ရင် signInWithPopup / signInWithRedirect /
  // getRedirectResult တို့က auth/argument-error နဲ့ ချက်ချင်းပျက်မယ် —
  // Google login လုံးဝ အလုပ်မလုပ်တဲ့ အကြောင်းရင်း ဒါပဲ
  try {
    auth = initializeAuth(app, {
      persistence: browserLocalPersistence,
      popupRedirectResolver: browserPopupRedirectResolver
    });
  } catch (e) {
    auth = getAuth(app);
  }
} else {
  // Mobile (Android / iOS) အတွက်
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (e) {
    auth = getAuth(app);
  }
}

// Initialize Firestore (db)
const db = getFirestore(app);

export { app, auth, db };
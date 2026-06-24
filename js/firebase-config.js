// js/firebase-config.js
// ============================================================
// 🔁 REPLACE WITH YOUR FIREBASE CONFIG (from Firebase Console)
// ============================================================

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSy...",              // <-- REPLACE
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services for use throughout the app
export const auth = getAuth(app);
export const db = getFirestore(app);

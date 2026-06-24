// js/auth-logic.js
// Handles login, logout, signup, and admin role detection.
// ============================================================

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config.js';

// Global state (can be imported elsewhere)
export let currentUser = null;
export let isAdmin = false;

// ===== Login =====
export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Login error:', error.message);
    return { success: false, error: error.message };
  }
}

// ===== Signup =====
export async function signup(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Optionally, create a user document with default role 'user'
    // (We'll handle this separately via the UI or automatically)
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Signup error:', error.message);
    return { success: false, error: error.message };
  }
}

// ===== Logout =====
export async function logout() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error.message);
    return { success: false, error: error.message };
  }
}

// ===== Check Admin Role (call this after auth state changes) =====
export async function checkAdminRole(user) {
  if (!user) {
    isAdmin = false;
    return false;
  }
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists() && userDoc.data().role === 'admin') {
      isAdmin = true;
      return true;
    } else {
      isAdmin = false;
      return false;
    }
  } catch (error) {
    console.error('Error checking admin role:', error.message);
    isAdmin = false;
    return false;
  }
}

// ===== Auth state observer (set up in your main app) =====
export function initAuthObserver(onUserChanged) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      await checkAdminRole(user);  // updates global isAdmin
    } else {
      currentUser = null;
      isAdmin = false;
    }
    // Callback to update UI (passed from ui-controller)
    if (typeof onUserChanged === 'function') {
      onUserChanged(user, isAdmin);
    }
  });
}

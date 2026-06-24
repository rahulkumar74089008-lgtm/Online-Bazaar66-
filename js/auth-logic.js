// js/auth-logic.js
import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// ----- Auth functions -----
export async function loginUser(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: cred.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function signupUser(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: cred.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function checkAdmin(uid) {
  if (!uid) return false;
  try {
    const docSnap = await getDoc(doc(db, "users", uid));
    return docSnap.exists() && docSnap.data().role === "admin";
  } catch {
    return false;
  }
}

// ----- Auth state listener (returns unsubscribe function) -----
export function onAuthStateChangedListener(callback) {
  return onAuthStateChanged(auth, callback);
}

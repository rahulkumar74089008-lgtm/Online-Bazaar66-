import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// ----- Helper: Current User -----
export const getCurrentUser = () => auth.currentUser;

// ----- Auth functions -----
export async function loginUser(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: cred.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function signupUser(email, password, displayName = "") {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    
    if (displayName) {
        await updateProfile(cred.user, { displayName });
    }

    await setDoc(doc(db, "users", cred.user.uid), {
      email: email,
      role: "user",
      displayName: displayName,
      createdAt: new Date().toISOString()
    });
    
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
  } catch (error) {
    return false;
  }
}

export function onAuthStateChangedListener(callback) {
  return onAuthStateChanged(auth, callback);
}


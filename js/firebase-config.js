// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";

// ================= CONFIGURATION =================
// Replace these placeholders with your actual Firebase project config.
const firebaseConfig = {
  apiKey: "AIzaSyAsTYWehPz9QGpK9hIjNY_TBY456rzcKoA",
  authDomain: "onlinebazaar66.firebaseapp.com",
  projectId: "onlinebazaar66",
  storageBucket: "onlinebazaar66.firebasestorage.app",
  messagingSenderId: "741329003167",
  appId: "1:741329003167:web:b42b8937d5152083b6f8aa"
};

// ================= INITIALIZATION =================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };

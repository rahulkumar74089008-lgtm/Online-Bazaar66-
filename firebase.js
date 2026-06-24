const firebaseConfig = {
  apiKey: "AIzaSyAsTYWehPz9QGpK9hIjNY_TBY456rzcKoA",
  authDomain: "onlinebazaar66.firebaseapp.com",
  projectId: "onlinebazaar66",
  storageBucket: "onlinebazaar66.firebasestorage.app",
  messagingSenderId: "741329003167",
  appId: "1:741329003167:web:b42b8937d5152083b6f8aa"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// js/db-logic.js
import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// ----- Products -----
export async function fetchProducts() {
  const snapshot = await getDocs(collection(db, "products"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export function subscribeProducts(callback) {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  return onSnapshot(q,
    (snapshot) => {
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(products, null);
    },
    (error) => callback([], error)
  );
}

export async function addProduct(data) {
  try {
    const ref = await addDoc(collection(db, "products"), { ...data, createdAt: serverTimestamp() });
    return { success: true, id: ref.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function editProduct(id, data) {
  try {
    await updateDoc(doc(db, "products", id), { ...data, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteProduct(id) {
  try {
    await deleteDoc(doc(db, "products", id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ----- Orders -----
export async function saveOrder(orderData) {
  try {
    const ref = await addDoc(collection(db, "orders"), {
      ...orderData,
      status: "pending",
      createdAt: serverTimestamp()
    });
    return { success: true, orderId: ref.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function fetchOrders() {
  const snapshot = await getDocs(collection(db, "orders"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

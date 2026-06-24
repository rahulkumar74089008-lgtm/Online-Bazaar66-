// js/db-logic.js
// All Firestore interactions – fetch, add, update, delete products.
// ============================================================

import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase-config.js';
import { isAdmin } from './auth-logic.js'; // import the admin flag

const PRODUCTS_COLLECTION = 'products';

// ===== Fetch all products =====
export async function fetchProducts() {
  try {
    const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: products };
  } catch (error) {
    console.error('Error fetching products:', error.message);
    return { success: false, error: error.message };
  }
}

// ===== Add a new product (admin only) =====
export async function addProduct(productData) {
  if (!isAdmin) {
    return { success: false, error: 'Permission denied. Admin only.' };
  }
  try {
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
      ...productData,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding product:', error.message);
    return { success: false, error: error.message };
  }
}

// ===== Update a product (admin only) =====
export async function updateProduct(productId, updatedData) {
  if (!isAdmin) {
    return { success: false, error: 'Permission denied. Admin only.' };
  }
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(productRef, {
      ...updatedData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating product:', error.message);
    return { success: false, error: error.message };
  }
}

// ===== Delete a product (admin only) =====
export async function deleteProduct(productId) {
  if (!isAdmin) {
    return { success: false, error: 'Permission denied. Admin only.' };
  }
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(productRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error.message);
    return { success: false, error: error.message };
  }
}

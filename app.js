// Firebase Modules Import via CDN (Vercel automatic support)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. AAPKI FIREBASE CONFIGURATION (Firebase Console se copy karke yahan replace karein)
const firebaseConfig = {
  apiKey: "AIzaSyC1UyNHPmMMJSC574g8QDYAfzNe3YzDIbU",
  authDomain: "online-bazaar66.firebaseapp.com",
  projectId: "online-bazaar66",
  storageBucket: "online-bazaar66.firebasestorage.app",
  messagingSenderId: "109625936148",
  appId: "1:109625936148:web:cd8f7c2f332a07788d5a01",
  measurementId: "G-Z005XDNR0X"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

// 2. CUSTOMER PAGE LOGIC: Products Fetch & Render
const productsGrid = document.getElementById("products-grid");
if (productsGrid) {
    async function loadProducts() {
        try {
            // Firestore se products fetch karein latest sorting ke sath
            const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            
            productsGrid.innerHTML = ""; // Loading text hatayein

            if (querySnapshot.empty) {
                productsGrid.innerHTML = `<p class="loading-text">No products available in shop yet.</p>`;
                return;
            }

            querySnapshot.forEach((doc) => {
                const product = doc.data();
                const productCard = document.createElement("div");
                productCard.className = "product-card";
                productCard.innerHTML = `
                    <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-price">₹${product.price}</p>
                    </div>
                `;
                productsGrid.appendChild(productCard);
            });
        } catch (error) {
            console.error("Error fetching products: ", error);
            productsGrid.innerHTML = `<p class="loading-text" style="color: red;">Failed to load products. Check console config.</p>`;
        }
    }
    loadProducts();
}

// 3. ADMIN PANEL LOGIC: Automatic Heavy File Upload
const productForm = document.getElementById("product-form");
if (productForm) {
    const statusMessage = document.getElementById("status-message");
    const submitBtn = document.getElementById("submit-btn");

    productForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("product-name").value;
        const price = document.getElementById("product-price").value;
        const imageFile = document.getElementById("product-image").files[0];

        if (!imageFile) return;

        // UI ko Processing state mein dalein
        submitBtn.disabled = true;
        submitBtn.innerText = "Uploading Image...";
        statusMessage.innerText = "Uploading to Firebase Storage...";

        try {
            // A. Firebase Storage mein image secure aur automatic upload karein
            const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
            const uploadSnapshot = await uploadBytes(storageRef, imageFile);
            
            // B. Public CDN link nikaalein
            statusMessage.innerText = "Saving data to Firestore...";
            const downloadURL = await getDownloadURL(uploadSnapshot.ref);

            // C. Text details aur image link ko Database mein add karein
            await addDoc(collection(db, "products"), {
                name: name,
                price: Number(price),
                imageUrl: downloadURL,
                createdAt: new Date()
            });

            statusMessage.style.color = "#28a745";
            statusMessage.innerText = "Product successfully uploaded on Online Bazaar66!";
            productForm.reset();
        } catch (error) {
            console.error("Upload error details: ", error);
            statusMessage.style.color = "red";
            statusMessage.innerText = "Upload failed. Check console error.";
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = "Upload to Store";
        }
    });
    }

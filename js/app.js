// js/app.js (Main Controller)
import { auth } from "./firebase-config.js";
import {
  loginUser,
  signupUser,
  logoutUser,
  checkAdmin,
  onAuthStateChangedListener
} from "./auth-logic.js";
import {
  subscribeProducts,
  addProduct,
  editProduct,
  deleteProduct,
  saveOrder
} from "./db-logic.js";

// ---------- DOM References ----------
// मान लें कि आपके HTML में ये IDs मौजूद हैं – अपने हिसाब से बदलें।
const loginSection = document.getElementById("loginSection");
const userSection = document.getElementById("userSection");
const adminSection = document.getElementById("adminSection");
const logoutBtn = document.getElementById("logoutBtn");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const featuredContainer = document.getElementById("featuredProducts");
const loadingIndicator = document.getElementById("loadingIndicator");
const emptyMsg = document.getElementById("emptyMessage");

const adminAddForm = document.getElementById("adminAddProductForm");
const checkoutForm = document.getElementById("checkoutForm");

// ---------- Helper: Product Card (आपकी डिज़ाइन के अनुसार) ----------
function createProductCard(product) {
  const div = document.createElement("div");
  div.className = "product-card";
  div.innerHTML = `
    <h3>${product.name || "Unnamed"}</h3>
    <p>₹${product.price ?? "N/A"}</p>
    <p>${product.description || ""}</p>
    <button data-id="${product.id}" class="add-to-cart">Add to Cart</button>
  `;
  return div;
}

// ---------- Real‑time Products Subscription ----------
let unsubscribeProducts = null;

function initProductsSubscription() {
  if (unsubscribeProducts) unsubscribeProducts(); // cleanup
  unsubscribeProducts = subscribeProducts((products, error) => {
    if (loadingIndicator) loadingIndicator.style.display = "none";
    if (error) {
      if (emptyMsg) emptyMsg.textContent = "Failed to load products. Please try again.";
      return;
    }
    if (featuredContainer) {
      featuredContainer.innerHTML = "";
      if (products.length === 0) {
        if (emptyMsg) emptyMsg.style.display = "block";
      } else {
        if (emptyMsg) emptyMsg.style.display = "none";
        products.forEach(p => featuredContainer.appendChild(createProductCard(p)));
      }
    }
  });
}

// ---------- Auth State Handler ----------
function handleAuthState(user) {
  // Hide all sections first
  if (loginSection) loginSection.style.display = "none";
  if (userSection) userSection.style.display = "none";
  if (adminSection) adminSection.style.display = "none";

  if (user) {
    // Logged in
    if (userSection) userSection.style.display = "block";
    // Check admin
    checkAdmin(user.uid).then(isAdmin => {
      if (isAdmin && adminSection) adminSection.style.display = "block";
    });
    // Start product subscription (only if user logged in – but you can also show products to guests)
    // For guest access, you might want to start subscription anyway; we start it regardless.
  } else {
    // Logged out
    if (loginSection) loginSection.style.display = "block";
    // Optionally clear products or keep showing
  }
}

// ---------- Initialize App ----------
function initApp() {
  // 1. Auth listener
  onAuthStateChangedListener(handleAuthState);

  // 2. Start product subscription (for all users – logged in or not)
  initProductsSubscription();

  // 3. Event Listeners
  // Login
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = loginForm.querySelector("#loginEmail").value;
      const password = loginForm.querySelector("#loginPassword").value;
      const result = await loginUser(email, password);
      if (!result.success) alert("Login failed: " + result.error);
      else loginForm.reset();
    });
  }

  // Signup
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = signupForm.querySelector("#signupEmail").value;
      const password = signupForm.querySelector("#signupPassword").value;
      const result = await signupUser(email, password);
      if (!result.success) alert("Signup failed: " + result.error);
      else signupForm.reset();
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await logoutUser();
    });
  }

  // Admin: Add Product
  if (adminAddForm) {
    adminAddForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(adminAddForm);
      const data = {
        name: fd.get("name"),
        price: parseFloat(fd.get("price")),
        description: fd.get("description")
      };
      const result = await addProduct(data);
      if (result.success) {
        alert("Product added!");
        adminAddForm.reset();
      } else {
        alert("Error: " + result.error);
      }
    });
  }

  // Checkout
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(checkoutForm);
      const order = {
        userId: auth.currentUser ? auth.currentUser.uid : "guest",
        items: JSON.parse(fd.get("items") || "[]"),
        total: parseFloat(fd.get("total")),
        paymentMethod: fd.get("paymentMethod"),
        address: fd.get("address")
      };
      const result = await saveOrder(order);
      if (result.success) {
        alert("Order placed! ID: " + result.orderId);
        checkoutForm.reset();
      } else {
        alert("Error: " + result.error);
      }
    });
  }

  // Example: Delete product (delegated event)
  document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-product")) {
      const id = e.target.dataset.id;
      if (confirm("Delete this product?")) {
        const res = await deleteProduct(id);
        alert(res.success ? "Deleted" : "Error: " + res.error);
      }
    }
  });

  console.log("Onlinebazaar66 App Initialized (Centralized)");
}

// ---------- Start the app ----------
initApp();

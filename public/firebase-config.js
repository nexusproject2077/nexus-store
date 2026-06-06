// ============================================
// NEXUS STORE — Firebase Configuration
// ============================================
// IMPORTANT: Replace these values with your actual
// Firebase project configuration from the Firebase Console
// Project Settings > General > Your Apps > Web App

import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, enableNetwork } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// ============================================
// YOUR FIREBASE CONFIG
// ============================================
const firebaseConfig = {
  apiKey: "aaV5m6rR8m3G9orHajGqgmdvyy1WJ52ASNtBCTXab14",
  authDomain: "nexus-store-app.firebaseapp.com",
  projectId: "nexus-store-app",
  storageBucket: "nexus-store-app.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// ============================================
// INITIALIZE FIREBASE (singleton)
// ============================================
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// ============================================
// FIREBASE SERVICES
// ============================================
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export { app };

// ============================================
// NEXUS STORE FIRESTORE STRUCTURE
// ============================================
// Collections:
//   /products/{id}       - Product listings
//   /users/{uid}         - User profiles
//   /orders/{id}         - Orders
//   /vendors/{uid}       - Vendor profiles
//   /reviews/{id}        - Product reviews
//   /categories/{id}     - Product categories
//   /promos/{code}       - Promo codes
//   /flash_sales/{id}    - Flash sale events
//
// Nexus Commission Structure:
//   Basic Vendor:   10% commission
//   Pro Vendor:     8%  commission (abonnement Pro)
//   Elite Vendor:   6%  commission (abonnement Elite)
//
// ============================================

// ============================================
// HELPER: Load products from Firestore
// ============================================
export async function loadProducts(options = {}) {
  const { getDocs, collection, query, where, orderBy, limit } = await import(
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
  );
  try {
    let q = collection(db, 'products');
    const constraints = [];
    if (options.category) constraints.push(where('category', '==', options.category));
    if (options.minPrice) constraints.push(where('price', '>=', options.minPrice));
    if (options.maxPrice) constraints.push(where('price', '<=', options.maxPrice));
    if (options.sort === 'price_asc') constraints.push(orderBy('price', 'asc'));
    else if (options.sort === 'price_desc') constraints.push(orderBy('price', 'desc'));
    else constraints.push(orderBy('sold', 'desc'));
    if (options.limit) constraints.push(limit(options.limit));
    const snapshot = await getDocs(query(q, ...constraints));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn('Firebase load error, using demo data:', err.message);
    return null; // Pages fall back to DEMO_PRODUCTS
  }
}

// ============================================
// HELPER: Save order to Firestore
// ============================================
export async function saveOrder(orderData) {
  const { addDoc, collection, serverTimestamp } = await import(
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
  );
  try {
    const ref = await addDoc(collection(db, 'orders'), {
      ...orderData,
      createdAt: serverTimestamp(),
      status: 'pending',
      nexusCommission: orderData.total * 0.10, // 10% default commission
    });
    return ref.id;
  } catch (err) {
    console.warn('Order save error:', err.message);
    return 'NS-' + Date.now();
  }
}

// ============================================
// HELPER: Verify promo code
// ============================================
export async function verifyPromo(code) {
  const { getDoc, doc } = await import(
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
  );
  try {
    const snap = await getDoc(doc(db, 'promos', code.toUpperCase()));
    if (snap.exists() && snap.data().active) return snap.data().discount;
    return null;
  } catch {
    // Fallback: local promo codes
    const LOCAL = { NEXUS10: 10, WELCOME20: 20, VIP30: 30 };
    return LOCAL[code.toUpperCase()] || null;
  }
}

// ============================================
// HELPER: Get vendor info
// ============================================
export async function getVendor(vendorId) {
  const { getDoc, doc } = await import(
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
  );
  try {
    const snap = await getDoc(doc(db, 'vendors', vendorId));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
}

console.log('🔥 Nexus Store Firebase initialized successfully');

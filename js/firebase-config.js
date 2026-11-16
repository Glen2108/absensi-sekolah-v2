// firebase-config.js

// 1. Gunakan URL CDN lengkap untuk semua import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";

// Tambahkan import Firestore dan Auth yang dibutuhkan oleh app.js dan dashboard.js
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD8IAdxeAe51MWYe9a4MBpOKiDk3e1QnBA",
  authDomain: "absensi-sekolah-v3.firebaseapp.com",
  projectId: "absensi-sekolah-v3",
  storageBucket: "absensi-sekolah-v3.firebasestorage.app",
  messagingSenderId: "1052209110554",
  appId: "1:1052209110554:web:4837264e9111d69939bba3",
  measurementId: "G-3B9HF3DKX0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 2. Inisialisasi Firestore Database dan Authentication
const db = getFirestore(app);
const auth = getAuth(app);

// 3. Wajib di-export agar bisa dipakai di app.js, auth.js, dan dashboard.js
export { app, db, auth };
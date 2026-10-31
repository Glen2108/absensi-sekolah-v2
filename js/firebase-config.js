import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyALEqF4jv2EhhfCnzigsbFE1kLBuSM2JVI",
  authDomain: "absensi-sekolah-v2.firebaseapp.com",
  projectId: "absensi-sekolah-v2",
  storageBucket: "absensi-sekolah-v2.firebasestorage.app",
  messagingSenderId: "37227813725",
  appId: "1:37227813725:web:b3fc5edb8889e618d3a6b4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
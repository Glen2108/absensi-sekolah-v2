import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Salin dan tempel konfigurasi dari Konsol Firebase (Firebase Console) kamu di sini
const firebaseConfig = {
  apiKey: "AIzaSyALEqF4jv2EhhfCnzigsbFE1kLBuSM2JVI",
  authDomain: "absensi-sekolah-v2.firebaseapp.com",
  projectId: "absensi-sekolah-v2",
  storageBucket: "absensi-sekolah-v2.firebasestorage.app",
  messagingSenderId: "37227813725",
  appId: "1:37227813725:web:b3fc5edb8889e618d3a6b4"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
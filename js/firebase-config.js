// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
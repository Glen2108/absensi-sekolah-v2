import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const loginForm = document.getElementById("login-form");

// ... (Kode import tetap sama) ...
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        Swal.fire({
            icon: 'success',
            title: 'Login Berhasil',
            showConfirmButton: false,
            timer: 1500
        }).then(() => {
            window.location.href = "dashboard.html"; 
        });
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Gagal Login',
            text: 'Email atau password salah!',
        });
    }
});
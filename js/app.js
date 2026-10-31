import { db } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ==========================================
// 1. KONFIGURASI GEOFENCING SEKOLAH
// ==========================================
// Hapus simbol derajat (°), gunakan angka desimal murni
const KOORDINAT_SEKOLAH = {
    latitude: 1.4748,  
    longitude: 124.8421
};
const RADIUS_MAKSIMAL_METER = 5000000; // Ubah ke 50 setelah selesai uji coba

// ==========================================
// DEKLARASI ELEMEN HTML
// ==========================================
const namaSiswaInput = document.getElementById("namaSiswa");
const kelasSiswaInput = document.getElementById("kelasSiswa");
const statusSiswaInput = document.getElementById("statusSiswa");
const keteranganSiswaInput = document.getElementById("keteranganSiswa");
const tombolSubmit = document.getElementById("btn-submit");
const absenForm = document.getElementById("absen-form");

// ==========================================
// 2. FUNGSI MENGHITUNG JARAK (RUMUS HAVERSINE)
// ==========================================
function hitungJarak(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
              
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
}

// ==========================================
// 3. FUNGSI MENDAPATKAN LOKASI GPS (PROMISE)
// ==========================================
function dapatkanLokasiSiswa() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject("Browser Anda tidak mendukung fitur GPS/Geolocation.");
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
    });
}

// ==========================================
// 4. INISIALISASI KAMERA SCANNER (YANG SEBELUMNYA HILANG)
// ==========================================
let html5QrcodeScanner = new Html5QrcodeScanner(
    "reader", { fps: 10, qrbox: {width: 250, height: 250} }, false
);

function onScanSuccess(decodedText, decodedResult) {
    const data = decodedText.split("|");
    if(data.length === 2) {
        namaSiswaInput.value = data[0];
        kelasSiswaInput.value = data[1];
        tombolSubmit.disabled = false;
        html5QrcodeScanner.clear(); // Matikan kamera setelah berhasil scan
        
        Swal.fire({
            icon: 'success',
            title: 'QR Code Terbaca!',
            text: `Halo, ${data[0]}`,
            timer: 1500,
            showConfirmButton: false
        });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: 'Format QR Code tidak valid.'
        });
    }
}

function onScanFailure(error) {
    // Abaikan error saat sedang mencari QR
}

// Nyalakan kamera saat web dibuka
html5QrcodeScanner.render(onScanSuccess, onScanFailure);

// ==========================================
// 5. LOGIKA MENAMPILKAN KOLOM KETERANGAN
// ==========================================
statusSiswaInput.addEventListener("change", () => {
    if (statusSiswaInput.value === "Sakit" || statusSiswaInput.value === "Izin") {
        keteranganSiswaInput.style.display = "block";
        keteranganSiswaInput.required = true;
    } else {
        keteranganSiswaInput.style.display = "none";
        keteranganSiswaInput.required = false;
        keteranganSiswaInput.value = "";
    }
});

// ==========================================
// 6. LOGIKA TOMBOL ABSEN (SUBMIT)
// ==========================================
absenForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const statusSaatIni = statusSiswaInput.value;
    tombolSubmit.innerText = "Memproses...";
    tombolSubmit.disabled = true;

    try {
        let jarak = null; 
        
        if (statusSaatIni === "Hadir") {
            tombolSubmit.innerText = "Mengecek Lokasi GPS...";
            const posisi = await dapatkanLokasiSiswa();
            const latSiswa = posisi.coords.latitude;
            const lonSiswa = posisi.coords.longitude;

            jarak = hitungJarak(
                KOORDINAT_SEKOLAH.latitude, 
                KOORDINAT_SEKOLAH.longitude, 
                latSiswa, 
                lonSiswa
            );

            if (jarak > RADIUS_MAKSIMAL_METER) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Absen Hadir Ditolak!',
                    html: `Anda berada di luar area sekolah.<br>Jarak Anda: <b>${Math.round(jarak)} meter</b> dari sekolah.`,
                    confirmButtonColor: '#d33'
                });
                tombolSubmit.innerText = "Kirim Absen";
                tombolSubmit.disabled = false;
                return; 
            }
        }

        tombolSubmit.innerText = "Menyimpan Data...";

        await addDoc(collection(db, "absensi"), {
            nama: namaSiswaInput.value,
            kelas: kelasSiswaInput.value,
            status: statusSaatIni, 
            keterangan: statusSaatIni === "Hadir" ? "-" : keteranganSiswaInput.value,
            jarak_meter: jarak ? Math.round(jarak) : "Tidak Cek GPS",
            waktu_absen: serverTimestamp()
        });
        
        // Perbaikan format backtick pada SweetAlert
        Swal.fire({
            icon: 'success',
            title: `Berhasil Absen (${statusSaatIni})!`,
            text: statusSaatIni === "Hadir" ? `Jarak valid: ${Math.round(jarak)} meter.` : "Data keterangan berhasil disimpan.",
            timer: 3000,
            showConfirmButton: false
        });
        
        absenForm.reset();
        statusSiswaInput.value = "Hadir";
        keteranganSiswaInput.style.display = "none";
        tombolSubmit.disabled = true;
        
        // Nyalakan ulang kamera untuk siswa berikutnya
        html5QrcodeScanner.render(onScanSuccess, onScanFailure);

    } catch (error) {
        let pesanError = error.message || error;
        if (error.code === 1) pesanError = "Anda harus MENGIZINKAN akses lokasi (GPS).";
        else if (error.code === 2 || error.code === 3) pesanError = "Sinyal GPS tidak stabil.";

        Swal.fire({
            icon: 'error',
            title: 'Terjadi Kesalahan',
            text: pesanError,
        });
        tombolSubmit.innerText = "Kirim Absen";
        tombolSubmit.disabled = false;
    }
});
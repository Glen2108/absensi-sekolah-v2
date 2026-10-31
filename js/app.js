import { db } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ==========================================
// 1. KONFIGURASI GEOFENCING SEKOLAH
// ==========================================
// Ganti koordinat ini dengan koordinat asli sekolah Anda (ambil dari Google Maps)
const KOORDINAT_SEKOLAH = {
    latitude: 1.4748°,  // Contoh: Koordinat di Makassar
    longitude: 124.8421°
};
const RADIUS_MAKSIMAL_METER = 50; // Batas toleransi jarak absen dalam meter

// ==========================================
// 2. FUNGSI MENGHITUNG JARAK (RUMUS HAVERSINE)
// ==========================================
function hitungJarak(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Jari-jari bumi dalam meter
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
              
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const jarak = R * c; 
    
    return jarak; // Hasil dalam satuan meter
}

// ==========================================
// 3. FUNGSI MENDAPATKAN LOKASI GPS (PROMISE)
// ==========================================
function dapatkanLokasiSiswa() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject("Browser Anda tidak mendukung fitur GPS/Geolocation.");
        }
        
        // Meminta opsi akurasi tinggi
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
    });
}

// ==========================================
// LOGIKA MENAMPILKAN KOLOM KETERANGAN
// ==========================================
const statusSiswaInput = document.getElementById("statusSiswa");
const keteranganSiswaInput = document.getElementById("keteranganSiswa");

statusSiswaInput.addEventListener("change", () => {
    if (statusSiswaInput.value === "Sakit" || statusSiswaInput.value === "Izin") {
        keteranganSiswaInput.style.display = "block";
        keteranganSiswaInput.required = true; // Wajib diisi
    } else {
        keteranganSiswaInput.style.display = "none";
        keteranganSiswaInput.required = false;
        keteranganSiswaInput.value = ""; // Kosongkan jika kembali ke "Hadir"
    }
});

// ==========================================
// 4. LOGIKA TOMBOL ABSEN (SUBMIT)
// ==========================================
const absenForm = document.getElementById("absen-form");

absenForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const statusSiswa = document.getElementById("statusSiswa").value;
    tombolSubmit.innerText = "Memproses...";
    tombolSubmit.disabled = true;

    try {
        let jarak = null; // Default jarak kosong jika Sakit/Izin
        // =======================================
        // CEK GPS HANYA JIKA STATUS "HADIR"
        // =======================================
        if (statusSiswa === "Hadir") {
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
            // Notifikasi SweetAlert jika di luar radius
            Swal.fire({
                icon: 'warning',
                title: 'Absen Hadir Ditolak!',
                html: `Anda berada di luar area sekolah.<br>Jarak Anda: <b>${Math.round(jarak)} meter</b> dari sekolah.`,
                confirmButtonColor: '#d33'
            });
            tombolSubmit.innerText = "Kirim Absen";
            tombolSubmit.disabled = false;
            return; // Hentikan proses, jangan kirim data
        }

        // =======================================
        // SIMPAN KE DATABASE
        // =======================================
        tombolSubmit.innerText = "Menyimpan Data...";
        const statusSaatIni = statusSiswaInput.value;

        await addDoc(collection(db, "absensi"), {
            nama: namaSiswaInput.value,
            kelas: kelasSiswaInput.value,
            status: statusSaatIni, // Menyimpan Hadir/Sakit/Izin // Simpan keterangan, jika Hadir isi dengan strip (-)
            keterangan: statusSaatIni === "Hadir" ? "-" : keteranganSiswaInput.value,
            jarak_meter: jarak ? Math.round(jarak) : "Tidak Cek GPS",
            waktu_absen: serverTimestamp()
        });
        
        // Notifikasi SweetAlert untuk Sukses Absen
        Swal.fire({
            icon: 'success',
            title: 'Berhasil Absen (${statusSiswa})!',
            text: statusSiswa === "Hadir" ? `Jarak valid: ${Math.round(jarak)} meter.` : "Data keterangan berhasil disimpan.",
            timer: 3000,
            showConfirmButton: false
        });
        
        absenForm.reset();
        document.getElementById("statusSiswa").value = "Hadir"; // Kembalikan ke default
        tombolSubmit.disabled = true;
        html5QrcodeScanner.render(onScanSuccess, onScanFailure);

    } catch (error) {
        // Notifikasi SweetAlert untuk Error GPS/Sistem
        let pesanError = error.message || error;
        if (error.code === 1) pesanError = "Anda harus MENGIZINKAN akses lokasi (GPS) untuk absen Hadir.";
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
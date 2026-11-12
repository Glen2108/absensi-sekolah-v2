import { db } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
// ==========================================
// 1. KONFIGURASI GEOFENCING SEKOLAH
// ==========================================
// Hapus simbol derajat (°), gunakan angka desimal murni
const KOORDINAT_SEKOLAH = {
    latitude: 1.4748,  
    longitude: 124.8421
};
const RADIUS_MAKSIMAL_METER = 25000; // Ubah ke 50 setelah selesai uji coba

// ==========================================
// DEKLARASI ELEMEN HTML
// ==========================================
const namaSiswaInput = document.getElementById("namaSiswa");
const kelasSiswaInput = document.getElementById("kelasSiswa");
const statusSiswaInput = document.getElementById("statusAbsen");
const keteranganSiswaInput = document.getElementById("keterangan");
const tombolSubmit = document.getElementById("btn-submit");
const absenForm = document.getElementById("absensi-form");

// ==========================================
// PENGATURAN NOTIFIKASI MENGAMBANG (TOAST)
// ==========================================
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end', // Posisi di kanan atas
    showConfirmButton: false,
    timer: 4000, // Hilang otomatis setelah 4 detik
    timerProgressBar: true,
    background: 'rgba(30, 30, 30, 0.85)', // Warna hitam gelap dengan transparansi 85%
    color: '#ffffff', // Warna teks putih agar kontras
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
});

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
let sedangMemproses = false;
let html5QrcodeScanner = new Html5QrcodeScanner(
    "reader", { 
        fps: 10, 
        qrbox: function(viewfinderWidth, viewfinderHeight) {
            let minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            let qrboxSize = Math.floor(minEdgeSize * 0.8); // 80% dari lebar layar
            return {
                width: qrboxSize,
                height: qrboxSize
            };
        },
        rememberLastUsedCamera: true,
        // Memaksa browser HP untuk memprioritaskan kamera belakang
        videoConstraints: { facingMode: "environment" }
    },
    false
);

function onScanSuccess(decodedText, decodedResult) {
    // 1. Jika sedang memproses data lain, abaikan scan baru
    if (sedangMemproses) return;
    playBeep();
    const data = decodedText.split("|");
    if(data.length === 2) {
        namaSiswaInput.value = data[0];
        kelasSiswaInput.value = data[1];
        document.getElementById("statusAbsen").value = "Hadir";
        html5QrcodeScanner.pause();

        tombolSubmit.disabled = false;        
        tombolSubmit.click();
        
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
// VALIDASI JADWAL PELAJARAN PER KELAS
// ==========================================
function validasiJadwal(kelas) {
    const waktu = new Date();
    const hari = waktu.getDay(); // 0=Minggu, 1=Senin, 2=Selasa, 3=Rabu, 4=Kamis, 5=Jumat, 6=Sabtu
    const waktuTotalMenit = (waktu.getHours() * 60) + waktu.getMinutes();

    // 1. KELAS XII-5 (Rabu & Kamis, 13:25 - 14:40)
    if (kelas === "XII-5") {
        // Rabu = 3, Kamis = 4 | 13:25 = 805 menit | 14:40 = 880 menit
        if ((hari === 3 || hari === 4) && waktuTotalMenit >= 805 && waktuTotalMenit <= 880) {
            return { diizinkan: true, pesan: "" };
        }
        return { diizinkan: false, pesan: "Di luar jadwal! Presensi XII-5 khusus Rabu & Kamis (13:25 - 14:40)." };
    }

    // 2. KELAS X-2 (Kamis, 10:15 - 11:35)
    if (kelas === "X-2") {
        // Kamis = 4 | 10:15 = 615 menit | 11:35 = 695 menit
        if (hari === 4 && waktuTotalMenit >= 615 && waktuTotalMenit <= 695) {
            return { diizinkan: true, pesan: "" };
        }
        return { diizinkan: false, pesan: "Di luar jadwal! Presensi X-2 khusus hari Kamis (10:15 - 11:35)." };
    }

    // 3. KELAS XI-2 (Senin 12:45-14:40 & Rabu 09:35-10:15)
    if (kelas === "XI-2") {
        // Senin = 1 | 12:45 = 765 | 14:40 = 880
        if (hari === 1 && waktuTotalMenit >= 765 && waktuTotalMenit <= 880) {
            return { diizinkan: true, pesan: "" };
        }
        // Rabu = 3 | 09:35 = 575 | 10:15 = 615
        if (hari === 3 && waktuTotalMenit >= 575 && waktuTotalMenit <= 615) {
            return { diizinkan: true, pesan: "" };
        }
        return { diizinkan: false, pesan: "Di luar jadwal! Presensi XI-2 khusus Senin (12:45-14:40) & Rabu (09:35-10:15)." };
    }

    // Default untuk kelas lain yang mungkin ditambahkan nanti
    return { diizinkan: true, pesan: "" }; 
}

// ==========================================
// 6. LOGIKA TOMBOL ABSEN (SUBMIT)
// ==========================================
absenForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Kunci form agar tidak bisa diklik dobel
    if (sedangMemproses) return; 
    sedangMemproses = true;

    // 2. Ambil nilai yang sudah bersih dari spasi
    const namaBersih = namaSiswaInput.value.trim();
    const kelasBersih = kelasSiswaInput.value.trim();
    let statusFinal = statusSiswaInput.value;

    // ==========================================
    // CEK JADWAL PER KELAS
    // ==========================================
    const jadwal = validasiJadwal(kelasBersih);
    
    if (!jadwal.diizinkan) {
        Swal.fire({
            icon: 'error',
            title: 'Sesi Tertutup',
            text: jadwal.pesan,
            timer: 4000,
            showConfirmButton: false
        });
        
        if (typeof playErrorBeep === "function") playErrorBeep(); // Mainkan suara error jika ada
        
        absenForm.reset();
        tombolSubmit.innerText = "Kirim Absen";
        tombolSubmit.disabled = false;
        sedangMemproses = false; // Buka kunci proses
        
        setTimeout(() => {
            try { html5QrcodeScanner.resume(); } catch(e) {}
        }, 4000);
        
        return; // Hentikan proses, siswa tidak bisa absen!
    }
    // ==========================================

    tombolSubmit.innerText = "Memproses...";
    tombolSubmit.disabled = true;

    try {

        // ==========================================
        // FITUR CEK DUPLIKASI (ANTI DOUBLE SCAN)
        // ==========================================
        tombolSubmit.innerText = "Cek Data...";
        const qCek = query(collection(db, "absensi"), where("nama", "==", namaBersih));
        const cekSnapshot = await getDocs(qCek);

        if (!cekSnapshot.empty) {
            // Jika data sudah ditemukan di database, tolak absennya
            playErrorBeep();
            Swal.fire({
                icon: 'warning',
                title: 'Sudah Presensi!',
                html: `Siswa bernama <b>${namaSiswaInput.value}</b> sudah tercatat melakukan absensi.`,
                timer: 3000,
                showConfirmButton: false
            });

            absenForm.reset();
            tombolSubmit.innerText = "Kirim Absen";
            tombolSubmit.disabled = false;

            // Buka kunci kembali
            sedangMemproses = false;

            // Nyalakan ulang kamera untuk siswa berikutnya setelah peringatan hilang
            setTimeout(() => {
                try { html5QrcodeScanner.resume(); } catch(e) {}
            }, 3000);

            return; // Hentikan proses, jangan lanjut ke GPS atau simpan data
        }
        // ==========================================
        let jarak = null; 
        
        if (statusFinal === "Hadir") {
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
                Toast.fire({
                    icon: 'error',
                    title: 'Lokasi Ditolak!',
                    text: `Jarak: ${Math.round(jarak)}m (Maks: ${RADIUS_MAKSIMAL_METER}m)`
                });
                tombolSubmit.innerText = "Kirim Absen";
                tombolSubmit.disabled = false;
                
                // Pindahkan setTimeout ke SINI (sebelum return)
                setTimeout(() => {
                    try { html5QrcodeScanner.resume(); } catch(e) {}
                }, 2500);
                
                return; // Hentikan proses absen
            }
            // Jika posisi SISWA BERADA DI LOKASI SEKOLAH
            else {
                Toast.fire({
                    icon: 'info',
                    title: 'Lokasi Sesuai',
                    text: `Jarak Anda ${Math.round(jarak)}m dari titik pusat.`
                });
            }
        }

        tombolSubmit.innerText = "Menyimpan Data...";

        await addDoc(collection(db, "absensi"), {
            nama: namaSiswaInput.value,
            kelas: kelasSiswaInput.value,
            status: statusFinal, 
            keterangan: statusFinal === "Hadir" ? "-" : keteranganSiswaInput.value,
            jarak_meter: jarak ? Math.round(jarak) : "Tidak Cek GPS",
            waktu_absen: serverTimestamp()
        });
        
        // Perbaikan format backtick pada SweetAlert
        Swal.fire({
            icon: 'success',
            // Mengubah Judul
            title: `Mantap! Absen ${statusFinal} Masuk`, 
            
            // Menggunakan html agar bisa memakai tag <b> atau <br>
            html: statusFinal === "Hadir" 
                  ? `Terima kasih, <b>${namaSiswaInput.value}</b>.<br>Jarak Anda: ${Math.round(jarak)} meter dari sekolah.` 
                  : `Data <b>${statusFinal}</b> untuk ${namaSiswaInput.value} berhasil dicatat.`,
            
            // --- KODE PEMANGGILAN FOTO ---
            imageUrl: `img/siswa/${namaSiswaInput.value}.jpg`,
            imageWidth: 120,
            imageHeight: 120,
            imageAlt: 'Foto Siswa',
            // Jika foto tidak ditemukan, sistem akan memuat gambar avatar default (opsional)
            didError: (elm) => { elm.src = 'img/avatar-default.png'; },
            // -----------------------------

            timer: 3000,
            showConfirmButton: false
        });
        
        absenForm.reset();
        keteranganSiswaInput.style.display = "none";
        tombolSubmit.disabled = false;

        // ==========================================
        // PENGATURAN WAKTU JEDA KAMERA
        // ==========================================
        // Angka 2500 berarti 2.5 detik (1000 = 1 detik)
        // Silakan ubah angka ini sesuai kecepatan antrean yang Anda inginkan
        setTimeout(() => {
            try {
                html5QrcodeScanner.resume();
            } catch(e) {
                console.log("Kamera siap.");
            }
        }, 2500);

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

// ==========================================
// FUNGSI EFEK SUARA BEEP (WEB AUDIO API)
// ==========================================
function playBeep() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine'; // Tipe gelombang suara yang halus
        oscillator.frequency.value = 880; // Frekuensi nada (880 Hz = Nada A tinggi)
        
        // Mengatur volume agar memudar secara cepat (durasi 0.15 detik)
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
        console.log("Audio API tidak didukung di browser ini.");
    }
}

function playErrorBeep() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sawtooth'; // Nada kasar peringatan
        osc.frequency.value = 150; // Frekuensi rendah (Teeet)
        
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {}
}

let deferredPrompt;
const installBtn = document.getElementById('btn-install');

window.addEventListener('beforeinstallprompt', (e) => {
    // Mencegah Chrome memunculkan banner otomatis bawaannya
    e.preventDefault();
    // Simpan event agar bisa dipicu nanti
    deferredPrompt = e;
    // Munculkan tombol install buatan kita
    installBtn.style.display = 'block';
});

installBtn.addEventListener('click', async () => {
    if (deferredPrompt !== null) {
        // Tampilkan pop-up instalasi Chrome
        deferredPrompt.prompt();
        // Tunggu respon pengguna
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            installBtn.style.display = 'none'; // Sembunyikan tombol jika sukses diinstal
        }
        deferredPrompt = null;
    }
});
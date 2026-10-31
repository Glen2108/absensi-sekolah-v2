import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 1. PROTEKSI HALAMAN
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
    } else {
        loadDataAbsensi("Semua"); // Muat semua kelas saat pertama kali masuk
    }
});

// 2. DETEKSI PERUBAHAN PADA FILTER
document.getElementById("filter-kelas").addEventListener("change", (e) => {
    loadDataAbsensi(e.target.value); // Muat ulang data berdasarkan kelas yang dipilih
});

// 3. FUNGSI MENGAMBIL DAN MENAMPILKAN DATA
async function loadDataAbsensi(filterKelas) {
    const tbody = document.getElementById("tabel-absensi");
    tbody.innerHTML = `<tr><td colspan="5" align="center">Memuat data...</td></tr>`;

    try {
        let q;
        const absensiRef = collection(db, "absensi");

        // Jika filter "Semua", urutkan berdasarkan kelas, lalu nama abjad
        if (filterKelas === "Semua") {
            q = query(absensiRef, orderBy("kelas", "asc"), orderBy("nama", "asc"));
        } else {
            // Jika filter spesifik, cari kelas tersebut, lalu urutkan nama abjad
            q = query(absensiRef, where("kelas", "==", filterKelas), orderBy("nama", "asc"));
        }

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="6" align="center">Belum ada data absensi untuk kelas ini</td></tr>`;
            updateTampilanRekap(0, 0, 0, 0);
            return;
        }

        tbody.innerHTML = ""; // Kosongkan indikator loading
        let nomor = 1;
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Logika Penghitungan Jumlah per Kelas (sesuaikan dengan nama kelas baru)
            totalSemua++;
            if (data.kelas === "X-2") totalX++;
            else if (data.kelas === "XI-2") totalXI++;
            else if (data.kelas === "XII-5") totalXII++;

            let waktuFormat = "-";
            if (data.waktu_absen) {
                waktuFormat = data.waktu_absen.toDate().toLocaleString("id-ID");
            }

            // Ambil data keterangan. Jika kosong/tidak ada, tampilkan strip "-"
            const teksKeterangan = data.keterangan ? data.keterangan : "-";

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td align="center">${nomor++}</td>
                <td>${data.nama}</td>
                <td align="center">${data.kelas}</td>
                <td align="center"><strong/>${data.status}</strong></td>
                <td>${teksKeterangan}</td>
                <td align="center">${waktuFormat}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error mengambil data: ", error);
        
        // Menangani error Composite Index Firestore
        if (error.message.includes("The query requires an index")) {
            tbody.innerHTML = `<tr><td colspan="5" align="center" style="color:red;">
                Gagal memuat: Buka Console Browser Anda (F12), klik link yang muncul berwarna merah di Console untuk membuat <b>Index Database Firebase</b> secara otomatis.
            </td></tr>`;
        } else {
            tbody.innerHTML = `<tr><td colspan="5" align="center" style="color:red;">Gagal memuat data: ${error.message}</td></tr>`;
        }
    }
}

// ... (Bagian import dan auth tidak berubah) ...

async function loadDataAbsensi(filterKelas) {
    const tbody = document.getElementById("tabel-absensi");
    tbody.innerHTML = `<tr><td colspan="5" align="center">Memuat data...</td></tr>`;

    // Siapkan variabel penghitung (counter)
    let totalX = 0;
    let totalXI = 0;
    let totalXII = 0;
    let totalSemua = 0;

    try {
        let q;
        const absensiRef = collection(db, "absensi");

        if (filterKelas === "Semua") {
            q = query(absensiRef, orderBy("kelas", "asc"), orderBy("nama", "asc"));
        } else {
            q = query(absensiRef, where("kelas", "==", filterKelas), orderBy("nama", "asc"));
        }

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="5" align="center">Belum ada data absensi untuk kelas ini</td></tr>`;
            // Reset tampilan angka ke 0 jika data kosong
            updateTampilanRekap(0, 0, 0, 0);
            return;
        }

        tbody.innerHTML = ""; 
        let nomor = 1;
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Logika Penghitungan Jumlah per Kelas
            totalSemua++;
            if (data.kelas === "X") totalX++;
            else if (data.kelas === "XI") totalXI++;
            else if (data.kelas === "XII") totalXII++;
            
            // Format waktu
            let waktuFormat = "-";
            if (data.waktu_absen) {
                waktuFormat = data.waktu_absen.toDate().toLocaleString("id-ID");
            }

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td align="center">${nomor++}</td>
                <td>${data.nama}</td>
                <td align="center">${data.kelas}</td>
                <td align="center">${data.status}</td>
                <td align="center">${waktuFormat}</td>
            `;
            tbody.appendChild(tr);
        });

        // Jalankan fungsi update angka setelah semua data selesai dilooping
        updateTampilanRekap(totalSemua, totalX, totalXI, totalXII);

        } catch (error) {
            console.error("Error mengambil data: ", error);
            tbody.innerHTML = `<tr><td colspan="5" align="center" style="color:red;">Gagal memuat data: ${error.message}</td></tr>`;
        }
}

    // Fungsi pembantu untuk memperbarui teks angka pada HTML
    function updateTampilanRekap(semua, x, xi, xii) {
        document.getElementById("count-total").innerText = semua;
        document.getElementById("count-x").innerText = x;
        document.getElementById("count-xi").innerText = xi;
        document.getElementById("count-xii").innerText = xii;
    }

    // ... (Fungsi logout tidak berubah) ...

// 4. FUNGSI LOGOUT
document.getElementById("btn-logout").addEventListener("click", async () => {
    try {
        await signOut(auth);
    } catch (error) {
        alert("Gagal logout: " + error.message);
    }
});

// ==========================================
// FUNGSI EXPORT KE EXCEL (CSV)
// ==========================================
document.getElementById("btn-export").addEventListener("click", () => {
    // 1. Ambil elemen tabel
    const table = document.querySelector("table");
    let csv = [];
    
    // 2. Looping setiap baris (tr) pada tabel
    for (let i = 0; i < table.rows.length; i++) {
        let row = [];
        // Ambil setiap kolom (th atau td) pada baris tersebut
        let cols = table.rows[i].querySelectorAll("td, th");
        
        for (let j = 0; j < cols.length; j++) {
            // Bersihkan teks dari spasi berlebih dan hindari error koma (escape)
            let data = cols[j].innerText.trim().replace(/"/g, '""');
            row.push('"' + data + '"'); // Bungkus data dengan tanda kutip
        }
        // Gabungkan kolom dengan koma, lalu masukkan ke array baris
        csv.push(row.join(","));
    }

    // 3. Gabungkan semua baris menjadi satu teks dengan enter (\n)
    const csvContent = csv.join("\n");

    // 4. Proses Download File
    downloadCSVFile(csvContent, "Rekap_Absensi_Siswa.csv");
});

function downloadCSVFile(csv_data, filename) {
    // Buat objek Blob untuk file CSV
    let CSVFile = new Blob([csv_data], { type: "text/csv" });
    
    // Buat link download sementara (tidak terlihat di layar)
    let temp_link = document.createElement("a");
    temp_link.download = filename;
    let url = window.URL.createObjectURL(CSVFile);
    temp_link.href = url;
    
    // Simulasikan klik untuk memicu download
    temp_link.style.display = "none";
    document.body.appendChild(temp_link);
    temp_link.click();
    document.body.removeChild(temp_link);
    
    Swal.fire({
        icon: 'success',
        title: 'Berhasil Download!',
        text: 'File CSV berhasil disimpan ke perangkat Anda.',
        timer: 2000,
        showConfirmButton: false
    });
}
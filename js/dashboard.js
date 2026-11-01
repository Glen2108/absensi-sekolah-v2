import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
// Mengganti getDocs dengan onSnapshot untuk realtime
import { collection, onSnapshot, query, orderBy, where, deleteDoc, doc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let unsubscribe = null; // Variabel penampung fungsi realtime

// 1. PROTEKSI HALAMAN
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
    } else {
        loadDataAbsensi("Semua"); 
    }
});

// 2. DETEKSI PERUBAHAN PADA FILTER
document.getElementById("filter-kelas").addEventListener("change", (e) => {
    loadDataAbsensi(e.target.value); 
});

// 3. FUNGSI MENGAMBIL DAN MENAMPILKAN DATA (REALTIME)
function loadDataAbsensi(filterKelas) {
    const tbody = document.getElementById("tabel-absensi");
    tbody.innerHTML = `<tr><td colspan="6" align="center">Memuat data...</td></tr>`;

    try {
        let q;
        const absensiRef = collection(db, "absensi");

        if (filterKelas === "Semua") {
            q = query(absensiRef, orderBy("kelas", "asc"), orderBy("nama", "asc"));
        } else {
            q = query(absensiRef, where("kelas", "==", filterKelas), orderBy("nama", "asc"));
        }

        // Matikan pendengar data lama jika guru mengganti filter kelas
        if (unsubscribe) {
            unsubscribe();
        }

        // onSnapshot membuat data tampil secara otomatis tanpa reload
        unsubscribe = onSnapshot(q, (querySnapshot) => {
            let totalX = 0;
            let totalXI = 0;
            let totalXII = 0;
            let totalSemua = 0;

            if (querySnapshot.empty) {
                tbody.innerHTML = `<tr><td colspan="6" align="center">Belum ada data absensi untuk kelas ini</td></tr>`;
                updateTampilanRekap(0, 0, 0, 0);
                return;
            }

            tbody.innerHTML = ""; 
            let nomor = 1;
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                
                totalSemua++;
                if (data.kelas === "X-2") totalX++;
                else if (data.kelas === "XI-2") totalXI++;
                else if (data.kelas === "XII-5") totalXII++;

                let waktuFormat = "-";
                if (data.waktu_absen) {
                    waktuFormat = data.waktu_absen.toDate().toLocaleString("id-ID");
                }

                const teksKeterangan = data.keterangan ? data.keterangan : "-";

                // --- LOGIKA PENENTUAN WARNA BADGE ---
                let badgeClass = "";
                let statusSiswa = data.status ? data.status.toLowerCase() : "";
                
                if (statusSiswa === "hadir") {
                    badgeClass = "status-hadir";
                } else if (statusSiswa === "sakit") {
                    badgeClass = "status-sakit";
                } else if (statusSiswa === "izin") {
                    badgeClass = "status-izin";
                }

                // --- MERAKIT BARIS TABEL DENGAN BADGE ---
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td align="center">${nomor++}</td>
                    <td>${data.nama}</td>
                    <td align="center">${data.kelas}</td>
                    <td align="center"><span class="status-badge ${badgeClass}">${data.status}</span></td>
                    <td>${teksKeterangan}</td>
                    <td align="center">${waktuFormat}</td>
                    <td align="center">
                        <button class="btn-delete" data-id="${doc.id}" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; box-shadow: 0 2px 5px rgba(220,53,69,0.3);">🗑️ Hapus</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            updateTampilanRekap(totalSemua, totalX, totalXI, totalXII);
        }, (error) => {
            console.error("Error mengambil data realtime: ", error);
            tbody.innerHTML = `<tr><td colspan="6" align="center" style="color:red;">Gagal memuat data: ${error.message}</td></tr>`;
        });

    } catch (error) {
        console.error("Error pengaturan awal: ", error);
    }
}

function updateTampilanRekap(semua, x, xi, xii) {
    document.getElementById("count-total").innerText = semua;
    document.getElementById("count-x").innerText = x;
    document.getElementById("count-xi").innerText = xi;
    document.getElementById("count-xii").innerText = xii;
}

// 4. FUNGSI LOGOUT
document.getElementById("btn-logout").addEventListener("click", async () => {
    try {
        await signOut(auth);
    } catch (error) {
        alert("Gagal logout: " + error.message);
    }
});

// 5. FUNGSI EXPORT KE EXCEL (CSV)
document.getElementById("btn-export").addEventListener("click", () => {
    const table = document.querySelector("table");
    let csv = [];
    
    for (let i = 0; i < table.rows.length; i++) {
        let row = [];
        let cols = table.rows[i].querySelectorAll("td, th");
        
        for (let j = 0; j < cols.length; j++) {
            let data = cols[j].innerText.trim().replace(/"/g, '""');
            row.push('"' + data + '"'); 
        }
        csv.push(row.join(","));
    }

    const csvContent = csv.join("\n");
    downloadCSVFile(csvContent, "Rekap_Absensi_Siswa.csv");
});

function downloadCSVFile(csv_data, filename) {
    let CSVFile = new Blob([csv_data], { type: "text/csv" });
    let temp_link = document.createElement("a");
    temp_link.download = filename;
    let url = window.URL.createObjectURL(CSVFile);
    temp_link.href = url;
    
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

// ==========================================
// 6. FUNGSI HAPUS DATA ABSENSI
// ==========================================
document.getElementById("tabel-absensi").addEventListener("click", (e) => {
    // Mengecek apakah yang diklik adalah tombol hapus
    if (e.target.classList.contains("btn-delete")) {
        const docId = e.target.getAttribute("data-id");

        // Memunculkan Pop-up Konfirmasi
        Swal.fire({
            title: 'Hapus data ini?',
            text: "Data yang dihapus tidak bisa dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // Perintah menghapus data ke Firestore
                    await deleteDoc(doc(db, "absensi", docId));
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Terhapus!',
                        text: 'Data absen berhasil dihapus.',
                        timer: 1500,
                        showConfirmButton: false
                    });
                } catch (error) {
                    console.error("Error menghapus data: ", error);
                    Swal.fire('Gagal!', 'Terjadi kesalahan saat menghapus data.', 'error');
                }
            }
        });
    }
});

// ==========================================
// 7. FUNGSI HAPUS SEMUA DATA (RESET)
// ==========================================
document.getElementById("btn-reset").addEventListener("click", () => {
    Swal.fire({
        title: 'RESET SEMUA DATA?',
        text: "PERINGATAN: Seluruh data absensi akan dihapus secara permanen dan tidak bisa dikembalikan!",
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Hapus Semua!',
        cancelButtonText: 'Batal'
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Sedang Menghapus...',
                text: 'Mohon tunggu sebentar',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            try {
                // 1. Ambil semua data di koleksi absensi
                const absensiRef = collection(db, "absensi");
                const snapshot = await getDocs(absensiRef);
                
                // 2. Lakukan perulangan untuk menghapus data satu per satu
                const deletePromises = [];
                snapshot.forEach((document) => {
                    deletePromises.push(deleteDoc(doc(db, "absensi", document.id)));
                });
                
                // 3. Tunggu sampai semua proses hapus selesai
                await Promise.all(deletePromises);

                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil Direset!',
                    text: 'Semua data absensi telah dikosongkan.',
                    timer: 2000,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error("Error mereset data: ", error);
                Swal.fire('Gagal!', 'Terjadi kesalahan saat menghapus data.', 'error');
            }
        }
    });
});
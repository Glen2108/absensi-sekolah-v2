import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, onSnapshot, query, orderBy, where, deleteDoc, doc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let unsubscribe = null; 

// ==========================================
// VARIABEL GLOBAL UNTUK PAGINATION
// ==========================================
let semuaDataAbsensi = []; 
let dataTerfilter = []; 
let halamanSaatIni = 1;
const barisPerHalaman = 10; // Jumlah siswa per halaman

// 1. PROTEKSI HALAMAN
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
    } else {
        loadDataAbsensi("Semua"); 
    }
});

// 2. DETEKSI PERUBAHAN PADA FILTER
document.getElementById("filter-kelas").addEventListener("change", terapkanFilter);
document.getElementById("search-nama").addEventListener("input", terapkanFilter);

function terapkanFilter() {
    const filterKelas = document.getElementById("filter-kelas").value;
    const keyword = document.getElementById("search-nama").value.toLowerCase();
    
    dataTerfilter = semuaDataAbsensi.filter(data => {
        const cocokKelas = (filterKelas === "Semua") || (data.kelas === filterKelas);
        const cocokNama = data.nama.toLowerCase().includes(keyword);
        return cocokKelas && cocokNama;
    });
    
    halamanSaatIni = 1;
    renderTabelPagination();
}

// ==========================================
// 3. FUNGSI MENGAMBIL DATA (REALTIME & URUT ABJAD)
// ==========================================
function loadDataAbsensi(filterKelas) {
    const tbody = document.getElementById("tabel-absensi");
    tbody.innerHTML = `<tr><td colspan="7" align="center">Memuat data...</td></tr>`;

    try {
        let q;
        const absensiRef = collection(db, "absensi");

        // Kita abaikan orderBy nama dari query Firestore, karena kita akan 
        // mengurutkannya secara manual menggunakan Javascript agar lebih fleksibel
        if (filterKelas === "Semua") {
            q = query(absensiRef, orderBy("kelas", "asc"));
        } else {
            q = query(absensiRef, where("kelas", "==", filterKelas));
        }

        if (unsubscribe) {
            unsubscribe();
        }

        unsubscribe = onSnapshot(q, (querySnapshot) => {
            let totalX = 0, totalXI = 0, totalXII = 0, totalSemua = 0;
            semuaDataAbsensi = []; // Kosongkan array sebelum diisi ulang

            if (querySnapshot.empty) {
                tbody.innerHTML = `<tr><td colspan="7" align="center">Belum ada data absensi untuk kelas ini</td></tr>`;
                updateTampilanRekap(0, 0, 0, 0);
                
                // Matikan tombol pagination jika kosong
                document.getElementById("page-info").innerText = `Halaman 1 dari 1`;
                if(document.getElementById("btn-prev")) document.getElementById("btn-prev").disabled = true;
                if(document.getElementById("btn-next")) document.getElementById("btn-next").disabled = true;
                return;
            }

            // Masukkan data dari Firestore ke dalam Array lokal
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                semuaDataAbsensi.push({ id: doc.id, ...data });
                
                // Hitung Rekap
                totalSemua++;
                if (data.kelas === "X-2") totalX++;
                else if (data.kelas === "XI-2") totalXI++;
                else if (data.kelas === "XII-5") totalXII++;
            });

            // FITUR PENGURUTAN ABJAD (A-Z) BERDASARKAN NAMA
            semuaDataAbsensi.sort((a, b) => {
                const namaA = a.nama ? a.nama.toLowerCase() : "";
                const namaB = b.nama ? b.nama.toLowerCase() : "";
                if (namaA < namaB) return -1;
                if (namaA > namaB) return 1;
                return 0;
            });

            dataTerfilter = semuaDataAbsensi; 
            halamanSaatIni = 1; // Reset ke halaman pertama

            // Panggil fungsi render tabel
            renderTabelPagination();
            updateTampilanRekap(totalSemua, totalX, totalXI, totalXII);

        }, (error) => {
            console.error("Error mengambil data realtime: ", error);
            tbody.innerHTML = `<tr><td colspan="7" align="center" style="color:red;">Gagal memuat data: ${error.message}</td></tr>`;
        });

    } catch (error) {
        console.error("Error pengaturan awal: ", error);
    }
}

// ==========================================
// 4. FUNGSI MERENDER TABEL SESUAI HALAMAN (PAGINATION)
// ==========================================
function renderTabelPagination() {
    const tbody = document.getElementById("tabel-absensi");
    tbody.innerHTML = "";

    const totalHalaman = Math.ceil(dataTerfilter.length / barisPerHalaman) || 1;
    
    // Logika Pemotongan Data (Slice)
    const indexAwal = (halamanSaatIni - 1) * barisPerHalaman;
    const indexAkhir = indexAwal + barisPerHalaman;
    const dataHalamanIni = dataTerfilter.slice(indexAwal, indexAkhir);

    if (dataHalamanIni.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" align="center">Belum ada data absensi.</td></tr>`;
    } else {
        dataHalamanIni.forEach((data, index) => {
            const nomorUrut = indexAwal + index + 1; 
            
            let waktuFormat = "-";
            if (data.waktu_absen) {
                waktuFormat = data.waktu_absen.toDate().toLocaleString("id-ID");
            }

            const teksKeterangan = data.keterangan ? data.keterangan : "-";
            
            // Logika Warna Badge
            let badgeClass = "";
            let statusSiswa = data.status ? data.status.toLowerCase() : "";
            if (statusSiswa === "hadir") badgeClass = "status-hadir";
            else if (statusSiswa === "sakit") badgeClass = "status-sakit";
            else if (statusSiswa === "izin") badgeClass = "status-izin";

            // Rakit Baris Tabel
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td align="center">${nomorUrut}</td>
                <td>${data.nama}</td>
                <td align="center">${data.kelas}</td>
                <td align="center"><span class="status-badge ${badgeClass}">${data.status}</span></td>
                <td>${teksKeterangan}</td>
                <td align="center">${waktuFormat}</td>
                <td align="center">
                    <button class="btn-delete" data-id="${data.id}" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; box-shadow: 0 2px 5px rgba(220,53,69,0.3);">🗑️ Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Update Navigasi Pagination
    if (document.getElementById("page-info")) {
        document.getElementById("page-info").innerText = `Halaman ${halamanSaatIni} dari ${totalHalaman}`;
        document.getElementById("btn-prev").disabled = halamanSaatIni === 1;
        document.getElementById("btn-next").disabled = halamanSaatIni === totalHalaman;
    }
}

// ==========================================
// 5. EVENT LISTENER TOMBOL PAGINATION
// ==========================================
// Memastikan elemen ada sebelum memasang event listener
if (document.getElementById("btn-prev") && document.getElementById("btn-next")) {
    document.getElementById("btn-prev").addEventListener("click", () => {
        if (halamanSaatIni > 1) {
            halamanSaatIni--;
            renderTabelPagination();
        }
    });

    document.getElementById("btn-next").addEventListener("click", () => {
        const totalHalaman = Math.ceil(dataTerfilter.length / barisPerHalaman);
        if (halamanSaatIni < totalHalaman) {
            halamanSaatIni++;
            renderTabelPagination();
        }
    });
}

function updateTampilanRekap(semua, x, xi, xii) {
    document.getElementById("count-total").innerText = semua;
    document.getElementById("count-x").innerText = x;
    document.getElementById("count-xi").innerText = xi;
    document.getElementById("count-xii").innerText = xii;
}

// ==========================================
// 6. FUNGSI LOGOUT
// ==========================================
document.getElementById("btn-logout").addEventListener("click", async () => {
    try {
        await signOut(auth);
    } catch (error) {
        alert("Gagal logout: " + error.message);
    }
});

// ==========================================
// 7. FUNGSI EXPORT KE EXCEL (CSV)
// ==========================================
document.getElementById("btn-export").addEventListener("click", () => {
    const table = document.querySelector("table");
    let csv = [];
    
    // Perbaikan export agar mengambil SEMUA data, bukan hanya halaman saat ini
    // Kita buat header manual
    csv.push('"No","Nama Siswa","Kelas","Status","Keterangan","Waktu Absen"');
    
    dataTerfilter.forEach((data, index) => {
        let waktuFormat = data.waktu_absen ? data.waktu_absen.toDate().toLocaleString("id-ID") : "-";
        let keterangan = data.keterangan ? data.keterangan : "-";
        
        let row = [
            `"${index + 1}"`,
            `"${data.nama}"`,
            `"${data.kelas}"`,
            `"${data.status}"`,
            `"${keterangan}"`,
            `"${waktuFormat}"`
        ];
        csv.push(row.join(","));
    });

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
// 8. FUNGSI HAPUS DATA ABSENSI (SINGLE)
// ==========================================
document.getElementById("tabel-absensi").addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-delete")) {
        const docId = e.target.getAttribute("data-id");

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
// 9. FUNGSI HAPUS SEMUA DATA (RESET)
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
                const absensiRef = collection(db, "absensi");
                const snapshot = await getDocs(absensiRef);
                
                const deletePromises = [];
                snapshot.forEach((document) => {
                    deletePromises.push(deleteDoc(doc(db, "absensi", document.id)));
                });
                
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
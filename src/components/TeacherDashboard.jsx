import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { 
  collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc 
} from 'firebase/firestore';
import { 
  Power, Users, Search, Download, Lock, KeyRound, 
  LogOut, Trash2, ShieldAlert, Calendar, ArrowUpDown, 
  ChevronLeft, ChevronRight, Filter, CheckCircle2, 
  Clock, AlertCircle, XCircle, X
} from 'lucide-react';

const DAFTAR_KELAS = [
  'SEMUA',
  'X-1', 'X-2', 'X-3', 'X-4',
  'XI-1', 'XI-2', 'XI-3', 'XI-4', 'XI-5',
  'XII-1', 'XII-2', 'XII-3', 'XII-4', 'XII-5'
];

export default function TeacherDashboard() {
  // Otentikasi Guru
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Data & Sesi
  const [attendanceList, setAttendanceList] = useState([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState('SEMUA');
  const [selectedDateFilter, setSelectedDateFilter] = useState('SEMUA');
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionData, setSessionData] = useState({ isOpen: false, targetClass: 'SEMUA' });
  const [targetClassInput, setTargetClassInput] = useState('SEMUA');

  // State Sorting & Pagination
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State Toast & Modal Hapus
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, studentName: '' });

  // Helper Toast Notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3500);
  };

  // Cek sesi login tersimpan
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem('teacher_authenticated');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Handler Login Password Guru
  const handleLogin = (e) => {
    e.preventDefault();
    if (inputPassword === 'glendy2108') {
      setIsAuthenticated(true);
      setLoginError(false);
      sessionStorage.setItem('teacher_authenticated', 'true');
      showToast('Berhasil masuk ke Portal Guru!', 'success');
    } else {
      setLoginError(true);
      setInputPassword('');
    }
  };

  // Handler Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('teacher_authenticated');
    setInputPassword('');
  };

  // Realtime Status Sesi & Attendance dari Firestore
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribeSession = onSnapshot(doc(db, 'settings', 'active_session'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSessionData(data);
        if (data.targetClass) setTargetClassInput(data.targetClass);
      }
    });

    const q = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'));
    const unsubscribeAttendance = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setAttendanceList(docs);
    });

    return () => {
      unsubscribeSession();
      unsubscribeAttendance();
    };
  }, [isAuthenticated]);

  // Toggle Sesi Buka/Tutup
  const toggleSession = async () => {
    const nextStatus = !sessionData.isOpen;
    await setDoc(doc(db, 'settings', 'active_session'), {
      isOpen: nextStatus,
      targetClass: targetClassInput,
      openedAt: Date.now()
    });
    showToast(
      nextStatus ? `Sesi absensi dibuka untuk ${targetClassInput}` : 'Sesi absensi telah ditutup',
      nextStatus ? 'success' : 'info'
    );
  };

  // Buka Modal Konfirmasi Hapus
  const confirmDeleteAttendance = (id, studentName) => {
    setDeleteModal({ show: true, id, studentName });
  };

  // Eksekusi Hapus Data Absensi
  const executeDeleteAttendance = async () => {
    if (!deleteModal.id) return;
    try {
      await deleteDoc(doc(db, 'attendance', deleteModal.id));
      showToast(`Data absensi "${deleteModal.studentName}" berhasil dihapus`, 'success');
    } catch (err) {
      showToast(`Gagal menghapus data: ${err.message}`, 'error');
    } finally {
      setDeleteModal({ show: false, id: null, studentName: '' });
    }
  };

  // Daftar Tanggal Unik dari Database
  const availableDates = useMemo(() => {
    const dates = attendanceList.map((item) => item.date).filter(Boolean);
    return Array.from(new Set(dates));
  }, [attendanceList]);

  // Filter Data
  const filteredData = useMemo(() => {
    return attendanceList.filter((item) => {
      const matchesClass = selectedClassFilter === 'SEMUA' || item.className === selectedClassFilter;
      const matchesDate = selectedDateFilter === 'SEMUA' || item.date === selectedDateFilter;
      const matchesSearch = !searchQuery || item.studentName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesClass && matchesDate && matchesSearch;
    });
  }, [attendanceList, selectedClassFilter, selectedDateFilter, searchQuery]);

  // Kartu Ringkasan Statistik Dinamis
  const stats = useMemo(() => {
    const total = filteredData.length;
    const hadir = filteredData.filter((i) => i.status === 'Hadir').length;
    const izin = filteredData.filter((i) => i.status === 'Izin').length;
    const sakit = filteredData.filter((i) => i.status === 'Sakit').length;
    const alpa = filteredData.filter((i) => i.status === 'Alpa').length;
    return { total, hadir, izin, sakit, alpa };
  }, [filteredData]);

  // Reset Ke Halaman 1 saat filter berubah
  const handleClassFilterChange = (e) => {
    setSelectedClassFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleDateFilterChange = (e) => {
    setSelectedDateFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Sorting Data
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let items = [...filteredData];
    if (sortConfig.key) {
      items.sort((a, b) => {
        let aVal = a[sortConfig.key] || '';
        let bVal = b[sortConfig.key] || '';

        if (sortConfig.key === 'timestamp') {
          aVal = a.timestamp || 0;
          bVal = b.timestamp || 0;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [filteredData, sortConfig]);

  // Pagination Data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  // Export Excel CSV Tingkat Lanjut (Tahap 4)
  const exportToCSV = () => {
    if (sortedData.length === 0) {
      return showToast('Tidak ada data yang dapat diekspor!', 'error');
    }

    const escapeCsv = (str) => `"${(str || '').toString().replace(/"/g, '""')}"`;
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    let csvContent = '\uFEFF'; // Byte Order Mark untuk Microsoft Excel

    // Header Laporan Resmi Sekolah
    csvContent += `LAPORAN REKAPITULASI PRESENSI SISWA\n`;
    csvContent += `SMA NEGERI 4 MANADO - TAHUN AJARAN 2026/2027\n`;
    csvContent += `Mata Pelajaran: Informatika | Guru Pengampu: Glendy A. Taawoeda, S.Pd\n`;
    csvContent += `Filter Kelas: ${selectedClassFilter} | Filter Tanggal: ${selectedDateFilter} | Tanggal Unduh: ${today}\n\n`;

    // Header Kolom Tabel
    csvContent += `No,Nama Siswa,Kelas,Mata Pelajaran,Guru Pengampu,Status,Catatan,Tanggal Absensi\n`;

    // Baris Data Siswa
    sortedData.forEach((row, index) => {
      csvContent += [
        index + 1,
        escapeCsv(row.studentName),
        escapeCsv(row.className),
        escapeCsv('Informatika'),
        escapeCsv('Glendy A. Taawoeda, S.Pd'),
        escapeCsv(row.status),
        escapeCsv(row.notes),
        escapeCsv(row.date)
      ].join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const cleanClass = selectedClassFilter.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanDate = selectedDateFilter.replace(/[^a-zA-Z0-9]/g, '_');
    
    link.href = url;
    link.setAttribute('download', `Rekap_Absensi_Informatika_${cleanClass}_${cleanDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Berhasil mengekspor ${sortedData.length} data absensi ke file CSV`, 'success');
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto py-12">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500"></div>

          <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-extrabold text-white tracking-tight">Portal Guru Pengampu</h2>
          <p className="text-xs text-slate-400 mt-1">Masukkan password otentikasi untuk mengakses panel kontrol dan rekapitulasi presensi.</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Password Guru
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoFocus
                  value={inputPassword}
                  onChange={(e) => {
                    setInputPassword(e.target.value);
                    if (loginError) setLoginError(false);
                  }}
                  placeholder="Masukkan password..."
                  className={`w-full bg-slate-950 border rounded-2xl pl-11 pr-4 py-3.5 text-slate-100 text-sm focus:outline-none transition-all ${
                    loginError ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 'border-slate-800 focus:border-sky-500'
                  }`}
                />
              </div>
              {loginError && (
                <p className="text-xs text-rose-400 mt-2 flex items-center gap-1 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5" /> Password salah! Akses ditolak.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white font-bold py-3.5 rounded-2xl shadow-xl transition-all duration-300 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>Masuk Portal Guru</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 relative">
      
      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border border-slate-700 bg-slate-900/95 text-slate-100 animate-in fade-in slide-in-from-top-3 duration-200">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <AlertCircle className="w-5 h-5 text-sky-400 shrink-0" />}
          <span className="text-xs font-semibold">{toast.message}</span>
          <button 
            onClick={() => setToast({ ...toast, show: false })}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-white">Hapus Data Absensi?</h4>
              <p className="text-xs text-slate-400">
                Apakah Anda yakin ingin menghapus catatan presensi milik <strong className="text-slate-200">{deleteModal.studentName}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteModal({ show: false, id: null, studentName: '' })}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={executeDeleteAttendance}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-950/50 transition-colors"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PANEL KONTROL SESI ABSENSI */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">
                Portal Guru Pengampu
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">Kontrol Sesi Absensi Informatika</h2>
            <p className="text-xs text-slate-400">Atur kapan siswa diperbolehkan melakukan presensi.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={targetClassInput}
              onChange={(e) => setTargetClassInput(e.target.value)}
              disabled={sessionData.isOpen}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none"
            >
              {DAFTAR_KELAS.map(k => (
                <option key={k} value={k}>{k === 'SEMUA' ? 'Semua Kelas' : `Kelas ${k}`}</option>
              ))}
            </select>

            <button
              onClick={toggleSession}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition-all shadow-lg ${
                sessionData.isOpen
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{sessionData.isOpen ? 'TUTUP SESI ABSENSI' : 'BUKA SESI ABSENSI'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-3 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-xl text-xs transition-all"
              title="Kunci Portal Guru"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Kunci Portal</span>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${sessionData.isOpen ? 'bg-emerald-500 animate-ping' : 'bg-slate-600'}`}></span>
            <span className="text-slate-300 font-semibold">
              Status Sesi: {sessionData.isOpen ? <span className="text-emerald-400">DIBUKA ({sessionData.targetClass})</span> : <span className="text-slate-400">DITUTUP</span>}
            </span>
          </div>
          <span className="text-slate-500 text-[11px]">SMA N 4 Manado — Mapel Informatika</span>
        </div>
      </div>

      {/* KARTU STATISTIK RINGKASAN PRESENSI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg backdrop-blur-xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Hadir</p>
            <p className="text-lg font-bold text-emerald-400">{stats.hadir} <span className="text-xs font-normal text-slate-500">siswa</span></p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg backdrop-blur-xl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Izin</p>
            <p className="text-lg font-bold text-amber-400">{stats.izin} <span className="text-xs font-normal text-slate-500">siswa</span></p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg backdrop-blur-xl">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Sakit</p>
            <p className="text-lg font-bold text-sky-400">{stats.sakit} <span className="text-xs font-normal text-slate-500">siswa</span></p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg backdrop-blur-xl">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Alpa</p>
            <p className="text-lg font-bold text-rose-400">{stats.alpa} <span className="text-xs font-normal text-slate-500">siswa</span></p>
          </div>
        </div>
      </div>

      {/* REKAP TABEL DATA ABSENSI */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Rekapitulasi Presensi Siswa</h3>
              <p className="text-xs text-slate-400">Total Terfilter: {filteredData.length} siswa (Total Seluruhnya: {attendanceList.length})</p>
            </div>
          </div>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all shrink-0"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Export Excel (CSV)</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama siswa..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-sky-400 shrink-0" />
            <select
              value={selectedClassFilter}
              onChange={handleClassFilterChange}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value="SEMUA">Semua Kelas</option>
              {DAFTAR_KELAS.filter(k => k !== 'SEMUA').map(k => (
                <option key={k} value={k}>Kelas {k}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
            <select
              value={selectedDateFilter}
              onChange={handleDateFilterChange}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value="SEMUA">Semua Tanggal Absensi</option>
              {availableDates.map(dateStr => (
                <option key={dateStr} value={dateStr}>{dateStr}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabel Data */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 select-none">
              <tr>
                <th className="p-3 w-12 text-center">NO</th>
                <th 
                  className="p-3 cursor-pointer hover:text-white transition-colors"
                  onClick={() => requestSort('studentName')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>SISWA</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th 
                  className="p-3 cursor-pointer hover:text-white transition-colors"
                  onClick={() => requestSort('className')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>KELAS</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th 
                  className="p-3 cursor-pointer hover:text-white transition-colors"
                  onClick={() => requestSort('status')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>STATUS</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="p-3">CATATAN</th>
                <th 
                  className="p-3 cursor-pointer hover:text-white transition-colors"
                  onClick={() => requestSort('timestamp')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>TANGGAL / WAKTU</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="p-3 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    Tidak ada data absensi yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-center font-mono text-slate-500">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="p-3 font-semibold text-white">{item.studentName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-800 rounded text-sky-400 font-mono">
                        {item.className}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.status === 'Hadir' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        item.status === 'Izin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        item.status === 'Sakit' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 max-w-xs truncate">{item.notes || '-'}</td>
                    <td className="p-3 text-slate-400">{item.date}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => confirmDeleteAttendance(item.id, item.studentName)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg transition-all"
                        title="Hapus Data Absensi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Kontrol Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Tampilkan</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>data per halaman</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              Halaman <strong className="text-slate-200">{currentPage}</strong> dari <strong className="text-slate-200">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
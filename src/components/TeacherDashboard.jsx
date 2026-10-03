import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc 
} from 'firebase/firestore';
import { 
  Power, Users, Search, Download, Lock, KeyRound, 
  LogOut, Trash2, Edit3, ShieldAlert, Check, X 
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionData, setSessionData] = useState({ isOpen: false, targetClass: 'SEMUA' });
  const [targetClassInput, setTargetClassInput] = useState('SEMUA');

  // Cek sesi login tersimpan di memori lokal (opsional selama tab dibuka)
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
    } else {
      setLoginError(true);
      setInputPassword('');
    }
  };

  // Handler Logout / Kunci Portal
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('teacher_authenticated');
    setInputPassword('');
  };

  // Realtime Status Sesi dari Firestore
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
  };

  // Hapus Record Absensi
  const handleDeleteAttendance = async (id, studentName) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data absensi siswa "${studentName}"?`)) {
      try {
        await deleteDoc(doc(db, 'attendance', id));
      } catch (err) {
        alert('Gagal menghapus data: ' + err.message);
      }
    }
  };

  // Filter Data
  const filteredData = attendanceList.filter(item => {
    const matchesClass = selectedClassFilter === 'SEMUA' || item.className === selectedClassFilter;
    const matchesSearch = item.studentName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  // Export Excel CSV
  const exportToCSV = () => {
    if (filteredData.length === 0) return alert('Tidak ada data untuk diexport!');
    
    let csv = 'No,Nama Siswa,Kelas,Mata Pelajaran,Guru,Status,Catatan,Tanggal\n';
    filteredData.forEach((row, index) => {
      csv += `${index + 1},"${row.studentName || ''}","${row.className || ''}","Informatika","Glendy A. Taawoeda, S.Pd","${row.status || ''}","${row.notes || ''}","${row.date || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rekap_Absensi_Informatika_${selectedClassFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ========================================================= */
  /* TAMPILAN 1: LAYAR LOCK / LOGIN PORTAL GURU               */
  /* ========================================================= */
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

  /* ========================================================= */
  /* TAMPILAN 2: DASHBOARD UTAMA GURU                          */
  /* ========================================================= */
  return (
    <div className="w-full space-y-6">
      
      {/* PANEL KONTROL SESI ABSENSI (KONTROL GURU) */}
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

        {/* Status Sesi Saat Ini */}
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

      {/* REKAP TABEL DATA ABSENSI */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Rekapitutasi Presensi Siswa</h3>
              <p className="text-xs text-slate-400">Total Recorded: {filteredData.length} siswa</p>
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

        {/* Filter & Pencarian */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none"
            />
          </div>

          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="SEMUA">Semua Kelas</option>
            {DAFTAR_KELAS.filter(k => k !== 'SEMUA').map(k => (
              <option key={k} value={k}>Kelas {k}</option>
            ))}
          </select>
        </div>

        {/* Tabel Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">SISWA</th>
                <th className="p-3">KELAS</th>
                <th className="p-3">STATUS</th>
                <th className="p-3">CATATAN</th>
                <th className="p-3">TANGGAL</th>
                <th className="p-3 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    Belum ada data absensi yang tersimpan.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40">
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
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 max-w-xs truncate">{item.notes || '-'}</td>
                    <td className="p-3 text-slate-400">{item.date}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteAttendance(item.id, item.studentName)}
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
      </div>

    </div>
  );
}
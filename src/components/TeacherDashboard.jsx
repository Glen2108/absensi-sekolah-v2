import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
// Tambahkan 'doc' di dalam baris import ini
import { doc, collection, query, orderBy, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  Power, Users, Search, Download, Lock, KeyRound, 
  LogOut, Trash2, ShieldAlert, Calendar, ArrowUpDown, 
  ChevronLeft, ChevronRight, Filter, CheckCircle2, 
  Clock, AlertCircle, XCircle, X, Table, LayoutList,
  CalendarDays, Sparkles
} from 'lucide-react';
import { JADWAL_GURU } from '../data/schedule.js';
import { useDialog } from '../context/DialogContext.jsx';

const DAFTAR_KELAS = [
  'SEMUA',
  'X-1', 'X-2', 'X-3', 'X-4',
  'XI-1', 'XI-2', 'XI-3', 'XI-4', 'XI-5',
  'XII-1', 'XII-2', 'XII-3', 'XII-4', 'XII-5'
];

export default function TeacherDashboard() {
  const dialog = useDialog();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [viewMode, setViewMode] = useState('matrix');

  const [attendanceList, setAttendanceList] = useState([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState('SEMUA');
  const [selectedDateFilter, setSelectedDateFilter] = useState('SEMUA');
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionData, setSessionData] = useState({ isOpen: false, targetClass: 'SEMUA' });
  const [targetClassInput, setTargetClassInput] = useState('SEMUA');

  const [sortConfig, setSortConfig] = useState({ key: 'studentName', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3500);
  };

  useEffect(() => {
    const sessionAuth = sessionStorage.getItem('teacher_authenticated');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

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

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('teacher_authenticated');
    setInputPassword('');
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribeSession = onSnapshot(doc(db, 'settings', 'active_session'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSessionData(data);
        if (data.targetClass) setTargetClassInput(data.targetClass);
      }
    });

    const q = query(
      collection(db, 'attendance'), 
      orderBy('timestamp', 'desc'), 
      limit(200)
    );
    const unsubscribeAttendance = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setAttendanceList(docs);
    });

    return () => {
      unsubscribeSession();
      unsubscribeAttendance();
    };
  }, [isAuthenticated]);

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

  const handleDeleteAttendance = async (id, studentName) => {
    const yakin = await dialog.confirm(`Apakah Anda yakin ingin menghapus data absensi milik "${studentName}"?`, 'Konfirmasi Hapus');
    if (!yakin) return;

    try {
      await deleteDoc(doc(db, 'attendance', id));
      showToast(`Data absensi "${studentName}" berhasil dihapus`, 'success');
    } catch (err) {
      showToast(`Gagal menghapus data: ${err.message}`, 'error');
    }
  };

  const availableDates = useMemo(() => {
    const dates = attendanceList.map((item) => item.date).filter(Boolean);
    return Array.from(new Set(dates));
  }, [attendanceList]);

  // FIX: Mengamankan fungsi filter dari resiko 'undefined.includes'
  const filteredData = useMemo(() => {
    return attendanceList.filter((item) => {
      const matchesClass = selectedClassFilter === 'SEMUA' || item.className === selectedClassFilter;
      const matchesDate = selectedDateFilter === 'SEMUA' || item.date === selectedDateFilter;
      
      const safeName = item.studentName ? String(item.studentName).toLowerCase() : '';
      const matchesSearch = !searchQuery || safeName.includes(searchQuery.toLowerCase());
      
      return matchesClass && matchesDate && matchesSearch;
    });
  }, [attendanceList, selectedClassFilter, selectedDateFilter, searchQuery]);

  // FIX: Mengamankan fungsi pembentukan matrix
  const matrixData = useMemo(() => {
    const datesToInclude = selectedDateFilter === 'SEMUA' 
      ? availableDates 
      : availableDates.filter(d => d === selectedDateFilter);

    const studentMap = {};

    attendanceList.forEach(item => {
      if (selectedClassFilter !== 'SEMUA' && item.className !== selectedClassFilter) return;
      
      const safeNameLower = item.studentName ? String(item.studentName).toLowerCase() : '';
      if (searchQuery && !safeNameLower.includes(searchQuery.toLowerCase())) return;

      const displayStudentName = item.studentName || 'Tanpa Nama';
      const displayClassName = item.className || 'Tidak Diketahui';
      const key = `${displayStudentName}_${displayClassName}`;
      
      if (!studentMap[key]) {
        studentMap[key] = {
          studentName: displayStudentName,
          className: displayClassName,
          records: {}
        };
      }
      if (item.date) {
        studentMap[key].records[item.date] = item.status;
      }
    });

    const studentsArray = Object.values(studentMap).map(student => {
      let totalHadir = 0;
      let totalIzin = 0;
      let totalSakit = 0;
      let totalAlpa = 0;

      datesToInclude.forEach(dateStr => {
        const st = student.records[dateStr];
        if (st === 'Hadir') totalHadir++;
        else if (st === 'Izin') totalIzin++;
        else if (st === 'Sakit') totalSakit++;
        else if (st === 'Alpa') totalAlpa++;
      });

      const totalPertemuan = datesToInclude.length;
      const pctHadir = totalPertemuan > 0 ? Math.round((totalHadir / totalPertemuan) * 100) : 0;
      const pctAlpa = totalPertemuan > 0 ? Math.round((totalAlpa / totalPertemuan) * 100) : 0;
      const pctIzin = totalPertemuan > 0 ? Math.round((totalIzin / totalPertemuan) * 100) : 0;
      const pctSakit = totalPertemuan > 0 ? Math.round((totalSakit / totalPertemuan) * 100) : 0;

      const isTuntas = pctHadir >= 75;

      return {
        ...student,
        totalHadir,
        totalIzin,
        totalSakit,
        totalAlpa,
        totalPertemuan,
        pctHadir,
        pctIzin,
        pctSakit,
        pctAlpa,
        isTuntas
      };
    });

    return { dates: datesToInclude, students: studentsArray };
  }, [attendanceList, availableDates, selectedClassFilter, selectedDateFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const hadir = filteredData.filter((i) => i.status === 'Hadir').length;
    const izin = filteredData.filter((i) => i.status === 'Izin').length;
    const sakit = filteredData.filter((i) => i.status === 'Sakit').length;
    const alpa = filteredData.filter((i) => i.status === 'Alpa').length;
    return { total, hadir, izin, sakit, alpa };
  }, [filteredData]);

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

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // FIX: Memperbaiki logika perbandingan agar nilai 0 tidak dianggap string kosong
  const sortedMatrixStudents = useMemo(() => {
    let items = [...matrixData.students];
    items.sort((a, b) => {
      let aVal = a[sortConfig.key] !== undefined ? a[sortConfig.key] : '';
      let bVal = b[sortConfig.key] !== undefined ? b[sortConfig.key] : '';
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [matrixData.students, sortConfig]);

  const totalPagesMatrix = Math.ceil(sortedMatrixStudents.length / itemsPerPage) || 1;
  const paginatedMatrixStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedMatrixStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedMatrixStudents, currentPage, itemsPerPage]);

  const exportMatrixCSV = () => {
    if (matrixData.students.length === 0) {
      return showToast('Tidak ada data yang dapat diekspor!', 'error');
    }

    const escapeCsv = (str) => `"${(str || '').toString().replace(/"/g, '""')}"`;
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    let csvContent = '\uFEFF';

    csvContent += `LAPORAN JURNAL REKAPITULASI KEHADIRAN SISWA\n`;
    csvContent += `SMA NEGERI 4 MANADO - TAHUN AJARAN 2026/2027\n`;
    csvContent += `Mata Pelajaran: Informatika | Guru: Glendy A. Taawoeda, S.Pd\n`;
    csvContent += `Filter Kelas: ${selectedClassFilter} | Tanggal Unduh: ${today}\n\n`;

    const headerCols = ['NO', 'NAMA SISWA', 'KELAS', ...matrixData.dates, 'JLM HADIR', 'ALPA', 'IZIN', 'SAKIT', 'TOTAL', '% HADIR', 'STATUS KEHADIRAN'];
    csvContent += headerCols.map(escapeCsv).join(',') + '\n';

    sortedMatrixStudents.forEach((st, idx) => {
      const row = [
        idx + 1,
        st.studentName,
        st.className,
        ...matrixData.dates.map(d => st.records[d] ? (st.records[d] === 'Hadir' ? 'V' : st.records[d].charAt(0)) : '-'),
        st.totalHadir,
        st.totalAlpa,
        st.totalIzin,
        st.totalSakit,
        st.totalPertemuan,
        `${st.pctHadir}%`,
        st.isTuntas ? 'Tuntas' : 'Tidak Tuntas'
      ];
      csvContent += row.map(escapeCsv).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.setAttribute('download', `Jurnal_Absensi_Informatika_${selectedClassFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Berhasil mengekspor jurnal rekap absensi ke CSV!`, 'success');
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto py-12">
        <div className="bg-slate-900 border-2 border-amber-400/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/10 backdrop-blur-xl relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-600"></div>

          <div className="w-16 h-16 bg-gradient-to-tr from-amber-500/20 to-amber-300/10 border border-amber-400/50 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/20">
            <Lock className="w-8 h-8 text-amber-400" />
          </div>

          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 tracking-tight">
            PORTAL GURU PENGAMPU
          </h2>
          <p className="text-xs text-amber-200/80 mt-1.5 font-medium">
            Masukkan password otentikasi untuk membuka kontrol absensi digital.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
                Password Akses Guru
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-amber-400/70 absolute left-4 top-1/2 -translate-y-1/2" />
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
                    loginError ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 'border-slate-800 focus:border-amber-400'
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
              className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black py-3.5 rounded-2xl shadow-xl shadow-amber-500/20 transition-all duration-300 active:scale-[0.99] flex items-center justify-center gap-2 uppercase text-xs tracking-wider"
            >
              <span>MASUK PORTAL GURU</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 relative">
      {toast.show && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border border-amber-400/30 bg-slate-900/95 text-slate-100 animate-in fade-in slide-in-from-top-3 duration-200">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />}
          <span className="text-xs font-semibold">{toast.message}</span>
          <button 
            onClick={() => setToast({ ...toast, show: false })}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Pengingat Jadwal Mengajar Informatika</h3>
              <p className="text-xs text-slate-400">Guru Pengampu: Glendy A. Taawoeda, S.Pd</p>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> T.A. 2026/2027
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {JADWAL_GURU?.map((item) => (
            <div key={item.className} className="bg-slate-950/80 border border-slate-800 hover:border-amber-400/40 rounded-2xl p-4 space-y-3 transition-all duration-300 group">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="font-extrabold text-slate-200 group-hover:text-amber-400 transition-colors text-sm">
                  Kelas {item.className}
                </span>
                <span className="text-[10px] font-mono bg-amber-400/10 text-amber-300 border border-amber-400/20 px-2 py-0.5 rounded-md">
                  {item.totalJP}
                </span>
              </div>
              <div className="space-y-2">
                {item.schedules.map((s, idx) => (
                  <div key={idx} className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/60 text-xs">
                    <div className="flex justify-between font-semibold text-slate-200">
                      <span>{s.day}</span>
                      <span className="text-amber-400">{s.hours}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{s.time} WITA</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 bg-amber-400/10 text-amber-300 border border-amber-400/30 rounded-full">
                Portal Guru
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">Kontrol Sesi Absensi Informatika</h2>
            <p className="text-xs text-slate-400">Atur status pembukaan sesi presensi siswa.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={targetClassInput}
              onChange={(e) => setTargetClassInput(e.target.value)}
              disabled={sessionData.isOpen}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              {DAFTAR_KELAS.map(k => (
                <option key={k} value={k}>{k === 'SEMUA' ? 'Semua Kelas' : `Kelas ${k}`}</option>
              ))}
            </select>

            <button
              onClick={toggleSession}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-xs transition-all shadow-lg ${
                sessionData.isOpen
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                  : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-amber-500/20'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{sessionData.isOpen ? 'TUTUP SESI ABSENSI' : 'BUKA SESI ABSENSI'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-3 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-300 border border-slate-800 rounded-xl text-xs transition-all"
              title="Kunci Portal Guru"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Kunci Portal</span>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${sessionData.isOpen ? 'bg-amber-400 animate-ping' : 'bg-slate-600'}`}></span>
            <span className="text-slate-300 font-semibold">
              Status Sesi: {sessionData.isOpen ? <span className="text-amber-300">DIBUKA ({sessionData.targetClass})</span> : <span className="text-slate-400">DITUTUP</span>}
            </span>
          </div>
          <span className="text-slate-500 text-[11px]">SMA N 4 Manado — Informatika</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg backdrop-blur-xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Hadir</p>
            <p className="text-lg font-bold text-emerald-400">{stats.hadir} <span className="text-xs font-normal text-slate-500">kali</span></p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg backdrop-blur-xl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Izin</p>
            <p className="text-lg font-bold text-amber-300">{stats.izin} <span className="text-xs font-normal text-slate-500">kali</span></p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg backdrop-blur-xl">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Sakit</p>
            <p className="text-lg font-bold text-sky-400">{stats.sakit} <span className="text-xs font-normal text-slate-500">kali</span></p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg backdrop-blur-xl">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Alpa</p>
            <p className="text-lg font-bold text-rose-400">{stats.alpa} <span className="text-xs font-normal text-slate-500">kali</span></p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Jurnal Rekapitulasi Presensi Tatap Muka</h3>
              <p className="text-xs text-slate-400">
                Total Siswa Terdaftar: {matrixData.students.length} Siswa | {matrixData.dates.length} Pertemuan Tanggal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-xl">
              <button
                onClick={() => setViewMode('matrix')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'matrix' ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilan Matriks Jurnal Excel"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Jurnal Excel</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'list' ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilan List Log Riwayat"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Riwayat Log</span>
              </button>
            </div>

            <button
              onClick={exportMatrixCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all shrink-0"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Export CSV Jurnal</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama siswa..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-300 shrink-0" />
            <select
              value={selectedClassFilter}
              onChange={handleClassFilterChange}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 transition-colors"
            >
              <option value="SEMUA">Semua Kelas</option>
              {DAFTAR_KELAS.filter(k => k !== 'SEMUA').map(k => (
                <option key={k} value={k}>Kelas {k}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-300 shrink-0" />
            <select
              value={selectedDateFilter}
              onChange={handleDateFilterChange}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 transition-colors"
            >
              <option value="SEMUA">Semua Pertemuan Tanggal</option>
              {availableDates.map(dateStr => (
                <option key={dateStr} value={dateStr}>{dateStr}</option>
              ))}
            </select>
          </div>
        </div>

        {viewMode === 'matrix' ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow-inner">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800 select-none">
                <tr className="divide-x divide-slate-800 text-center border-b border-slate-800">
                  <th rowSpan="2" className="p-2 w-10">NO</th>
                  <th rowSpan="2" className="p-2 text-left min-w-[180px]">NAMA SISWA</th>
                  <th rowSpan="2" className="p-2 w-16">KELAS</th>
                  <th colSpan={matrixData.dates.length || 1} className="p-2 bg-slate-900/90 text-amber-300">
                    KEHADIRAN PADA KEGIATAN TATAP MUKA ({matrixData.dates.length} PERTEMUAN)
                  </th>
                  <th colSpan="5" className="p-2 bg-slate-900/90 text-amber-400">JUMLAH (JLM)</th>
                  <th colSpan="4" className="p-2 bg-slate-900/90 text-amber-200">% KEHADIRAN</th>
                  <th rowSpan="2" className="p-2 min-w-[90px]">NILAI KEHADIRAN</th>
                </tr>

                <tr className="divide-x divide-slate-800 text-center text-[10px]">
                  {matrixData.dates.length === 0 ? (
                    <th className="p-2 text-slate-500 font-normal">Belum ada data tanggal</th>
                  ) : (
                    matrixData.dates.map((dStr) => (
                      <th key={dStr} className="p-1 min-w-[36px] max-w-[36px] font-mono text-slate-300">
                        <div className="writing-mode-vertical rotate-180 py-2 inline-block whitespace-nowrap">
                          {dStr}
                        </div>
                      </th>
                    ))
                  )}

                  <th className="p-1 bg-emerald-950/40 text-emerald-400 w-8" title="Hadir">✓</th>
                  <th className="p-1 bg-rose-950/40 text-rose-400 w-8" title="Alpa">A</th>
                  <th className="p-1 bg-amber-950/40 text-amber-300 w-8" title="Izin">I</th>
                  <th className="p-1 bg-sky-950/40 text-sky-400 w-8" title="Sakit">S</th>
                  <th className="p-1 bg-slate-800 text-slate-300 w-9" title="Total">TTL</th>

                  <th className="p-1 bg-emerald-950/20 text-emerald-400 w-10">%✓</th>
                  <th className="p-1 bg-rose-950/20 text-rose-400 w-10">%A</th>
                  <th className="p-1 bg-amber-950/20 text-amber-300 w-10">%I</th>
                  <th className="p-1 bg-sky-950/20 text-sky-400 w-10">%S</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {paginatedMatrixStudents.length === 0 ? (
                  <tr>
                    <td colSpan={13 + matrixData.dates.length} className="p-8 text-center text-slate-500">
                      Tidak ada data jurnal absensi yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  paginatedMatrixStudents.map((st, index) => (
                    <tr key={`${st.studentName}_${st.className}`} className="hover:bg-slate-800/40 transition-colors divide-x divide-slate-800/60">
                      <td className="p-2 text-center font-mono text-slate-500">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="p-2 font-semibold text-white">{st.studentName}</td>
                      <td className="p-2 text-center">
                        <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-amber-300 font-mono">
                          {st.className}
                        </span>
                      </td>

                      {matrixData.dates.length === 0 ? (
                        <td className="p-2 text-center text-slate-600">-</td>
                      ) : (
                        matrixData.dates.map((dateStr) => {
                          const statusVal = st.records[dateStr];
                          return (
                            <td key={dateStr} className="p-1 text-center font-bold text-xs">
                              {statusVal === 'Hadir' && <span className="text-emerald-400">✓</span>}
                              {statusVal === 'Izin' && <span className="text-amber-300 bg-amber-500/20 px-1 rounded">I</span>}
                              {statusVal === 'Sakit' && <span className="text-sky-400 bg-sky-500/20 px-1 rounded">S</span>}
                              {statusVal === 'Alpa' && <span className="text-rose-400 bg-rose-500/20 px-1 rounded">A</span>}
                              {!statusVal && <span className="text-slate-700 font-normal">-</span>}
                            </td>
                          );
                        })
                      )}

                      <td className="p-1.5 text-center font-bold text-emerald-400 bg-emerald-950/10">{st.totalHadir}</td>
                      <td className="p-1.5 text-center font-bold text-rose-400 bg-rose-950/10">{st.totalAlpa}</td>
                      <td className="p-1.5 text-center font-bold text-amber-300 bg-amber-950/10">{st.totalIzin}</td>
                      <td className="p-1.5 text-center font-bold text-sky-400 bg-sky-950/10">{st.totalSakit}</td>
                      <td className="p-1.5 text-center font-bold text-slate-200 bg-slate-800/40">{st.totalPertemuan}</td>

                      <td className="p-1 text-center font-mono text-[11px] text-emerald-300">{st.pctHadir}%</td>
                      <td className="p-1 text-center font-mono text-[11px] text-rose-300">{st.pctAlpa}%</td>
                      <td className="p-1 text-center font-mono text-[11px] text-amber-300">{st.pctIzin}%</td>
                      <td className="p-1 text-center font-mono text-[11px] text-sky-300">{st.pctSakit}%</td>

                      <td className="p-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          st.isTuntas 
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow shadow-emerald-900/50' 
                            : 'bg-rose-600 text-white shadow shadow-rose-900/50'
                        }`}>
                          {st.isTuntas ? 'Tuntas' : 'Tidak Tuntas'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
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
                  <th className="p-3">TANGGAL / WAKTU</th>
                  <th className="p-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-500">
                      Tidak ada log absensi yang sesuai.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 text-center font-mono text-slate-500">{index + 1}</td>
                      <td className="p-3 font-semibold text-white">{item.studentName || 'Tanpa Nama'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-800 rounded text-amber-300 font-mono">
                          {item.className || '-'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.status === 'Hadir' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          item.status === 'Izin' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
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
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Tampilkan</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
            <span>baris per halaman</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              Halaman <strong className="text-slate-200">{currentPage}</strong> dari <strong className="text-slate-200">{totalPagesMatrix}</strong>
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
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPagesMatrix))}
                disabled={currentPage === totalPagesMatrix || totalPagesMatrix === 0}
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
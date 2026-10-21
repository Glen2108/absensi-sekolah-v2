import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, onSnapshot, getDocs, query, where } from 'firebase/firestore';
import { 
  UserCheck, Edit3, CheckCircle2, User, Send, 
  AlertCircle, Clock, ArrowRight, Lock, Radio, CalendarDays,
  Sun, Sunset, MoonStar, Sparkles, Flame, Trophy, Compass, Save
} from 'lucide-react';
import { JADWAL_GURU } from '../data/schedule.js';
import { useDialog } from '../context/DialogContext.jsx';

const DAFTAR_KELAS = [
  'X-1', 'X-2', 'X-3', 'X-4',
  'XI-1', 'XI-2', 'XI-3', 'XI-4', 'XI-5',
  'XII-1', 'XII-2', 'XII-3', 'XII-4', 'XII-5'
];

// Fungsi Helper untuk Otomatis Mengubah Setiap Kata Menjadi Huruf Kapital Diawal
const capitalizeName = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function StudentView() {
  const dialog = useDialog();

  const [studentInfo, setStudentInfo] = useState({ name: '', className: '' });
  const [rememberMe, setRememberMe] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [status, setStatus] = useState('Hadir');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [submittedToday, setSubmittedToday] = useState(false);
  
  const [sessionData, setSessionData] = useState({ isOpen: false, targetClass: 'SEMUA', sessionTitle: '' });
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'active_session'), (docSnap) => {
      if (docSnap.exists()) {
        setSessionData(docSnap.data());
      } else {
        setSessionData({ isOpen: false, targetClass: 'SEMUA', sessionTitle: '' });
      }
    });
    return () => unsubscribe();
  }, []);

  // Cek Fitur Ingat Saya (localStorage vs sessionStorage)
  useEffect(() => {
    const savedLocal = localStorage.getItem('absensi_student_profile');
    const savedSession = sessionStorage.getItem('absensi_student_profile');
    const savedProfile = savedLocal || savedSession;

    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.name && parsed.className) {
          setStudentInfo(parsed);
          setIsSaved(true);

          const todayKey = `absen_done_${parsed.name}_${parsed.className}_${new Date().toLocaleDateString('id-ID')}`;
          if (localStorage.getItem(todayKey) || sessionStorage.getItem(todayKey)) {
            setSubmittedToday(true);
          }
        }
      } catch (e) {
        console.error('Error parsing profile:', e);
      }
    }
  }, []);

  const greetingData = useMemo(() => {
    if (currentHour >= 5 && currentHour < 11) {
      return { text: 'Selamat Pagi', icon: Sun, color: 'text-amber-300', bg: 'bg-amber-400/10 border-amber-400/30', animate: 'animate-[spin_10s_linear_infinite]' };
    } else if (currentHour >= 11 && currentHour < 15) {
      return { text: 'Selamat Siang', icon: Sun, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', animate: 'animate-pulse' };
    } else if (currentHour >= 15 && currentHour < 18.5) {
      return { text: 'Selamat Sore', icon: Sunset, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', animate: 'animate-bounce' };
    } else {
      return { text: 'Selamat Malam', icon: MoonStar, color: 'text-indigo-300', bg: 'bg-indigo-500/10 border-indigo-500/30', animate: 'animate-pulse' };
    }
  }, [currentHour]);

  const motivationalQuote = useMemo(() => {
    const cls = studentInfo.className || '';
    if (cls.startsWith('X-')) {
      return { tag: 'Eksplorasi Kelas X', icon: Compass, quote: 'Selamat bertumbuh di putih-abu! Bangun fondasi logika dan teknologi terbaikmu hari ini.', color: 'from-amber-400/20 via-slate-900 to-slate-900 border-amber-400/30 text-amber-300' };
    } else if (cls.startsWith('XI-')) {
      return { tag: 'Semangat Kelas XI', icon: Flame, quote: 'Asah ketajaman problem solving dan pemikiran kritis. Terus melangkah menuju puncak potensi!', color: 'from-amber-500/20 via-slate-900 to-slate-900 border-amber-500/30 text-amber-300' };
    } else if (cls.startsWith('XII-')) {
      return { tag: 'Perjuangan Akhir Kelas XII', icon: Trophy, quote: 'Masa depanmu makin dekat! Berikan dedikasi terbaik di setiap jam pelajaran menuju kelulusan impian.', color: 'from-amber-300/20 via-slate-900 to-slate-900 border-amber-300/40 text-amber-200' };
    }
    return { tag: 'Semangat Belajar', icon: Sparkles, quote: 'Jadikan setiap detik pembelajaran Informatika sebagai langkah menuju masa depan cemerlang.', color: 'from-amber-400/10 via-slate-900 to-slate-900 border-slate-800 text-slate-300' };
  }, [studentInfo.className]);

  // Handle Perubahan Input Nama + Auto Capitalize
  const handleNameChange = (e) => {
    const rawVal = e.target.value;
    const formattedVal = capitalizeName(rawVal);
    setStudentInfo({ ...studentInfo, name: formattedVal });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const cleanName = capitalizeName(studentInfo.name.trim());

    if (!cleanName || !studentInfo.className) {
      await dialog.alert('Silakan isi Nama Lengkap dan Pilih Kelas!', 'Peringatan');
      return;
    }

    setCheckingDuplicate(true);

    try {
      // 1. Cek Duplikat Nama di Firestore
      const snapshot = await getDocs(collection(db, 'attendance'));
      const existingRecords = snapshot.docs.map(doc => doc.data());
      
      const duplicateFound = existingRecords.find(item => {
        const existingNameClean = (item.studentName || '').toLowerCase().trim();
        const inputNameClean = cleanName.toLowerCase().trim();
        return existingNameClean === inputNameClean && item.className !== studentInfo.className;
      });

      if (duplicateFound) {
        await dialog.alert(
          `Nama "${cleanName}" sudah pernah terdaftar di ${duplicateFound.className}. Mohon periksa kembali penulisan nama atau pilihan kelas Anda!`,
          'Deteksi Nama Duplikat'
        );
        setCheckingDuplicate(false);
        return;
      }

      // 2. Simpan Sesuai Pilihan Fitur "Ingat Saya"
      const profileData = { name: cleanName, className: studentInfo.className };
      
      if (rememberMe) {
        localStorage.setItem('absensi_student_profile', JSON.stringify(profileData));
        sessionStorage.removeItem('absensi_student_profile');
      } else {
        sessionStorage.setItem('absensi_student_profile', JSON.stringify(profileData));
        localStorage.removeItem('absensi_student_profile');
      }

      setStudentInfo(profileData);
      setIsSaved(true);

      const todayKey = `absen_done_${cleanName}_${studentInfo.className}_${new Date().toLocaleDateString('id-ID')}`;
      if (localStorage.getItem(todayKey) || sessionStorage.getItem(todayKey)) {
        setSubmittedToday(true);
      }
    } catch (err) {
      console.error('Validation error:', err);
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const handleResetProfile = async () => {
    const yakin = await dialog.confirm('Apakah Anda yakin ingin mengganti identitas siswa di perangkat ini?', 'Konfirmasi Ganti Profil');
    if (yakin) {
      localStorage.removeItem('absensi_student_profile');
      sessionStorage.removeItem('absensi_student_profile');
      setStudentInfo({ name: '', className: '' });
      setIsSaved(false);
      setSubmittedToday(false);
    }
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    setLoading(true);

    const todayDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const payload = {
      studentName: studentInfo.name,
      className: studentInfo.className,
      status: status,
      notes: notes,
      subject: 'Informatika',
      teacher: 'Glendy A. Taawoeda, S.Pd',
      date: todayDate,
      timestamp: Date.now()
    };

    try {
      await addDoc(collection(db, 'attendance'), payload);
      
      const todayKey = `absen_done_${studentInfo.name}_${studentInfo.className}_${new Date().toLocaleDateString('id-ID')}`;
      if (rememberMe) {
        localStorage.setItem(todayKey, 'true');
      } else {
        sessionStorage.setItem(todayKey, 'true');
      }

      setSubmittedToday(true);
      setNotes('');
      
      await dialog.alert('Absensi Anda telah berhasil dicatat!', 'Berhasil');
    } catch (error) {
      console.warn('Sync Firestore error:', error);
      await dialog.alert('Gagal mengirim absensi. Periksa koneksi internet Anda.', 'Gagal');
    } finally {
      setLoading(false);
    }
  };

  const isClassEligible = sessionData.targetClass === 'SEMUA' || sessionData.targetClass === studentInfo.className;
  const classSchedule = JADWAL_GURU.find(j => j.className === studentInfo.className);
  const GreetingIcon = greetingData.icon;
  const QuoteIcon = motivationalQuote.icon;

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {!isSaved ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-slate-700 via-amber-400 to-amber-500"></div>

          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Identitas Siswa Digital</h2>
              <p className="text-xs text-slate-400 mt-0.5">SMA Negeri 4 Manado — Informatika</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-2">
                Nama Lengkap Siswa
              </label>
              <input
                type="text"
                required
                value={studentInfo.name}
                onChange={handleNameChange}
                placeholder="Contoh: Adam Kelapa Sawit"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-slate-100 text-sm focus:outline-none focus:border-amber-400"
              />
              <p className="text-[11px] text-slate-400 mt-1.5 italic">
                *Sistem otomatis memperbaiki format huruf kapital diawal kata.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-2">
                Pilih Kelas
              </label>
              <select
                required
                value={studentInfo.className}
                onChange={(e) => setStudentInfo({ ...studentInfo, className: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-slate-100 text-sm focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="">-- Pilih Kelas --</option>
                <optgroup label="Kelas X">
                  {DAFTAR_KELAS.filter(k => k.startsWith('X-')).map((k) => (
                    <option key={k} value={k}>Kelas {k}</option>
                  ))}
                </optgroup>
                <optgroup label="Kelas XI">
                  {DAFTAR_KELAS.filter(k => k.startsWith('XI-')).map((k) => (
                    <option key={k} value={k}>Kelas {k}</option>
                  ))}
                </optgroup>
                <optgroup label="Kelas XII">
                  {DAFTAR_KELAS.filter(k => k.startsWith('XII-')).map((k) => (
                    <option key={k} value={k}>Kelas {k}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Fitur Ingat Saya */}
            <div className="flex items-center gap-3 p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-xs text-slate-300 font-medium cursor-pointer flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5 text-amber-400" />
                Ingat Saya di Perangkat Ini (Tidak perlu isi nama lagi)
              </label>
            </div>

            <button
              type="submit"
              disabled={checkingDuplicate}
              className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black py-4 rounded-2xl shadow-lg shadow-amber-500/10 transition-all flex items-center justify-center gap-2 uppercase text-xs disabled:opacity-50"
            >
              <span>{checkingDuplicate ? 'Memeriksa Data...' : 'Simpan & Masuk Halaman Absensi'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-slate-700 via-amber-400 to-amber-500"></div>

          <div className="flex items-center justify-between pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-700 via-amber-400 to-amber-500 p-0.5 shadow-md shadow-amber-500/10 shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-300 font-extrabold text-lg">
                  {studentInfo.name ? studentInfo.name.charAt(0).toUpperCase() : 'S'}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${greetingData.bg} ${greetingData.color}`}>
                    <GreetingIcon className={`w-3.5 h-3.5 ${greetingData.animate}`} />
                    <span>{greetingData.text}, {studentInfo.name.split(' ')[0]}!</span>
                  </div>
                </div>
                <p className="text-xs text-amber-400 font-semibold">Kelas {studentInfo.className} — Informatika</p>
              </div>
            </div>

            <button
              onClick={handleResetProfile}
              className="p-2.5 text-slate-400 hover:text-amber-300 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all"
              title="Ganti Profil Siswa"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          <div className={`mt-4 p-4 rounded-2xl border bg-gradient-to-r ${motivationalQuote.color} space-y-1.5 relative overflow-hidden`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                <QuoteIcon className="w-4 h-4 text-amber-400" />
                <span>{motivationalQuote.tag}</span>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-amber-400/60" />
            </div>
            <p className="text-xs text-slate-200 leading-relaxed italic">
              "{motivationalQuote.quote}"
            </p>
          </div>

          {classSchedule && (
            <div className="mt-4 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <CalendarDays className="w-4 h-4 text-amber-400" />
                  <span>JADWAL KELAS {studentInfo.className}</span>
                </div>
                <span className="text-[10px] bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded-full font-mono border border-amber-400/20">
                  {classSchedule.totalJP}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 pt-1">
                {classSchedule.schedules.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-900/90 px-3 py-2 rounded-xl text-xs">
                    <span className="font-semibold text-white">{s.day} ({s.hours})</span>
                    <span className="text-slate-400 font-mono text-[11px]">{s.time} WITA</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!sessionData.isOpen ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-400/10 border border-amber-400/20 text-amber-300 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Sesi Absensi Belum Dibuka</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Guru Pengampu <strong className="text-amber-300">Glendy A. Taawoeda, S.Pd</strong> belum membuka sesi absensi untuk mata pelajaran Informatika.
              </p>
            </div>
          ) : !isClassEligible ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-400/10 border border-amber-400/20 text-amber-300 rounded-2xl flex items-center justify-center mx-auto">
                <Radio className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Sesi Khusus Kelas {sessionData.targetClass}</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Sesi absensi saat ini khusus ditujukan untuk <strong className="text-amber-300">Kelas {sessionData.targetClass}</strong>.
              </p>
            </div>
          ) : submittedToday ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/50">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-white tracking-tight">Presensi Berhasil Dicatat!</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
                  Terima kasih <strong className="text-amber-300">{studentInfo.name}</strong> ({studentInfo.className}), kehadiranmu sudah tersimpan.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-full text-[11px] text-slate-400">
                <Lock className="w-3 h-3 text-emerald-400" /> Absensi Terkunci (Batas 1x Sehari)
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitAttendance} className="mt-6 space-y-6">
              <div className="p-3 bg-amber-400/10 border border-amber-400/20 rounded-2xl flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                </span>
                <p className="text-xs text-amber-300 font-medium">
                  Sesi Absensi Informatika DIBUKA oleh Guru Glendy A. Taawoeda, S.Pd
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-3">
                  Status Kehadiran Hari Ini
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'Hadir', label: 'Hadir', icon: CheckCircle2, color: 'emerald' },
                    { id: 'Izin', label: 'Izin', icon: Clock, color: 'amber' },
                    { id: 'Sakit', label: 'Sakit', icon: AlertCircle, color: 'rose' },
                  ].map((item) => {
                    const IconComp = item.icon;
                    const isSelected = status === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setStatus(item.id)}
                        className={`relative p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all ${
                          isSelected
                            ? item.color === 'emerald'
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                              : item.color === 'amber'
                              ? 'bg-amber-500/10 border-amber-400 text-amber-300'
                              : 'bg-rose-500/10 border-rose-500 text-rose-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <IconComp className="w-6 h-6" />
                        <span className="text-xs font-bold">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-2">
                  Catatan / Keterangan <span className="text-slate-500 font-normal lowercase">(opsional)</span>
                </label>
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tuliskan alasan jika Izin/Sakit..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 text-sm focus:outline-none focus:border-amber-400 resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black py-4 rounded-2xl shadow-xl shadow-amber-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase text-xs"
              >
                {loading ? (
                  <span>Mengirim Presensi...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim Absensi Sekarang</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
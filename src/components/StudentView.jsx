import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, onSnapshot } from 'firebase/firestore';
import { 
  UserCheck, Edit3, CheckCircle2, User, Send, 
  AlertCircle, Clock, ArrowRight, Lock, Radio
} from 'lucide-react';

const DAFTAR_KELAS = [
  'X-1', 'X-2', 'X-3', 'X-4',
  'XI-1', 'XI-2', 'XI-3', 'XI-4', 'XI-5',
  'XII-1', 'XII-2', 'XII-3', 'XII-4', 'XII-5'
];

export default function StudentView() {
  const [studentInfo, setStudentInfo] = useState({ name: '', className: '' });
  const [isSaved, setIsSaved] = useState(false);
  const [status, setStatus] = useState('Hadir');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittedToday, setSubmittedToday] = useState(false);
  
  // Realtime Status Sesi Absensi dari Guru
  const [sessionData, setSessionData] = useState({ isOpen: false, targetClass: 'SEMUA', sessionTitle: '' });

  // 1. Dengarkan Status Sesi Absensi Realtime dari Firestore
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

  // 2. Ambil Profil & Status Absen Siswa dari LocalStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('absensi_student_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.name && parsed.className) {
          setStudentInfo(parsed);
          setIsSaved(true);

          // Cek apakah sudah pernah absen hari ini
          const todayKey = `absen_done_${parsed.name}_${parsed.className}_${new Date().toLocaleDateString('id-ID')}`;
          if (localStorage.getItem(todayKey)) {
            setSubmittedToday(true);
          }
        }
      } catch (e) {
        console.error('Error parsing profile:', e);
      }
    }
  }, []);

  // Simpan Identitas Siswa
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!studentInfo.name.trim() || !studentInfo.className) {
      alert('Silakan isi Nama Lengkap dan Pilih Kelas!');
      return;
    }
    localStorage.setItem('absensi_student_profile', JSON.stringify(studentInfo));
    setIsSaved(true);

    const todayKey = `absen_done_${studentInfo.name}_${studentInfo.className}_${new Date().toLocaleDateString('id-ID')}`;
    if (localStorage.getItem(todayKey)) {
      setSubmittedToday(true);
    }
  };

  const handleResetProfile = () => {
    if (confirm('Apakah Anda yakin ingin mengganti identitas siswa di perangkat ini?')) {
      localStorage.removeItem('absensi_student_profile');
      setStudentInfo({ name: '', className: '' });
      setIsSaved(false);
      setSubmittedToday(false);
    }
  };

  // Proses Kirim Presensi (Tepat 1 Kali)
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

    // Tandai bahwa siswa SUDAH ABSEN HARI INI di LocalStorage
    const todayKey = `absen_done_${studentInfo.name}_${studentInfo.className}_${new Date().toLocaleDateString('id-ID')}`;
    localStorage.setItem(todayKey, 'true');

    setSubmittedToday(true);
    setLoading(false);

    try {
      await addDoc(collection(db, 'attendance'), payload);
      setNotes('');
    } catch (error) {
      console.warn('Sync Firestore background:', error);
    }
  };

  // Apakah kelas siswa cocok dengan target kelas sesi guru?
  const isClassEligible = sessionData.targetClass === 'SEMUA' || sessionData.targetClass === studentInfo.className;

  return (
    <div className="w-full max-w-xl mx-auto">
      
      {/* TAMPILAN 1: ISAN IDENTITAS SISWA */}
      {!isSaved ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500"></div>

          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Identitas Siswa</h2>
              <p className="text-xs text-slate-400 mt-0.5">SMA Negeri 4 Manado — Mata Pelajaran Informatika</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Nama Lengkap Siswa
              </label>
              <input
                type="text"
                required
                value={studentInfo.name}
                onChange={(e) => setStudentInfo({ ...studentInfo, name: e.target.value })}
                placeholder="Contoh: Hizkia Wenas"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-slate-100 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Pilih Kelas
              </label>
              <select
                required
                value={studentInfo.className}
                onChange={(e) => setStudentInfo({ ...studentInfo, className: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-slate-100 text-sm focus:outline-none focus:border-sky-500 cursor-pointer"
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

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Simpan & Masuk Halaman Absensi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (

      /* TAMPILAN 2: HALAMAN UTAMA ABSENSI SISWA */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500"></div>

          {/* Header Menyapa Siswa */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 shadow-md shadow-sky-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-sky-400 font-bold text-lg">
                  {studentInfo.name ? studentInfo.name.charAt(0).toUpperCase() : 'S'}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Selamat Datang, {studentInfo.name}!
                </h2>
                <p className="text-xs text-slate-400">
                  Kelas: <span className="text-sky-400 font-semibold">{studentInfo.className}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleResetProfile}
              className="p-2.5 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all"
              title="Ganti Profil Siswa"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          {/* KONDISI 1: JIKA GURU BELUM MEMBUKA SESI ABSENSI */}
          {!sessionData.isOpen ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Sesi Absensi Belum Dibuka</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Guru Pengampu <strong className="text-slate-200">Glendy A. Taawoeda, S.Pd</strong> belum membuka sesi absensi untuk mata pelajaran Informatika saat ini. Silakan tunggu hingga jam pelajaran dimulai.
              </p>
            </div>
          ) : !isClassEligible ? (
            
          /* KONDISI 2: JIKA SESI DIBUKA UNTUK KELAS LAIN */
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-2xl flex items-center justify-center mx-auto">
                <Radio className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Sesi Khusus {sessionData.targetClass}</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Sesi absensi saat ini khusus ditujukan untuk <strong className="text-sky-400">Kelas {sessionData.targetClass}</strong>. Kamu terdaftar di Kelas {studentInfo.className}.
              </p>
            </div>
          ) : submittedToday ? (

          /* KONDISI 3: SISWA SUDAH ABSEN HARI INI (DIBATASI 1 KALI) */
            <div className="py-10 text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/50">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-white tracking-tight">Presensi Berhasil Dicatat!</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
                  Terima kasih <strong className="text-slate-200">{studentInfo.name}</strong> ({studentInfo.className}), kehadiranmu untuk mata pelajaran Informatika sudah tersimpan di server.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-full text-[11px] text-slate-400">
                <Lock className="w-3 h-3 text-emerald-400" /> Absensi Terkunci (Batas 1x Sehari)
              </div>
            </div>
          ) : (

          /* KONDISI 4: SISWA BISA MENGISI ABSENSI */
            <form onSubmit={handleSubmitAttendance} className="mt-6 space-y-6">
              
              {/* Banner Info Sesi Aktif */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <p className="text-xs text-emerald-300 font-medium">
                  Sesi Absensi Informatika DIBUKA oleh Guru Glendy A. Taawoeda, S.Pd
                </p>
              </div>

              {/* Status Kehadiran */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
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
                              ? 'bg-amber-500/10 border-amber-500 text-amber-400'
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

              {/* Catatan / Keterangan */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Catatan / Keterangan <span className="text-slate-500 font-normal lowercase">(opsional)</span>
                </label>
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tuliskan alasan jika Izin/Sakit..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 text-sm focus:outline-none focus:border-sky-500 resize-none"
                ></textarea>
              </div>

              {/* Tombol Kirim */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white font-bold py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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